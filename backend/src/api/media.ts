import fs from "node:fs";
import path from "node:path";
import { Router, Request, Response } from "express";
import { db } from "../db";
import { env } from "../config/env";
import { verifyMediaToken } from "../utils/mediaToken";
import { contentTypeForFile } from "../utils/media";
import { logger } from "../utils/logger";

/**
 * Token-gated media streaming. This is the ONLY way exclusive drop media is
 * served — the raw files under `<uploadDir>/media` are not exposed statically
 * (see app.ts). A caller must present a short-lived token (minted at
 * `/purchases/:id/access` after an ownership check) bound to this exact
 * contentId. Supports HTTP Range so the player can seek, and is marked
 * `private, no-store` so exclusive content is never cached by a shared proxy.
 *
 * Mounted OUTSIDE the `/api` prefix so seek-heavy playback (many Range
 * requests) isn't consumed by the API rate limiter.
 */
const router = Router();

function reject(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ success: false, error: { code, message } });
}

router.get("/:contentId", (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;
  const claims = verifyMediaToken(token);
  // The token must be valid AND minted for this exact item — a token for one
  // drop can never be replayed to stream another.
  if (!claims || claims.contentId !== req.params.contentId) {
    return reject(res, 401, "UNAUTHORIZED", "Invalid or expired media token");
  }

  const row = db.prepare("SELECT media_url FROM content WHERE id = ?").get(req.params.contentId) as
    | { media_url: string | null }
    | undefined;
  if (!row?.media_url) return reject(res, 404, "NOT_FOUND", "No media for this content");

  // Resolve strictly inside <uploadDir>/media using only the stored basename —
  // defense-in-depth against any path traversal smuggled into media_url.
  const mediaDir = path.resolve(env.uploadDir, "media");
  const resolved = path.resolve(mediaDir, path.basename(row.media_url));
  if (resolved !== mediaDir && !resolved.startsWith(mediaDir + path.sep)) {
    return reject(res, 404, "NOT_FOUND", "Media not found");
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved);
  } catch {
    return reject(res, 404, "NOT_FOUND", "Media not found");
  }
  if (!stat.isFile()) return reject(res, 404, "NOT_FOUND", "Media not found");

  const size = stat.size;
  res.setHeader("Content-Type", contentTypeForFile(resolved));
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Content-Disposition", "inline");

  const range = req.headers.range;
  let start = 0;
  let end = size - 1;
  let statusCode = 200;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (match[1] === "" && match[2] === "")) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return reject(res, 416, "RANGE_NOT_SATISFIABLE", "Invalid Range");
    }
    if (match[1] === "") {
      // suffix range: last N bytes
      const suffix = parseInt(match[2], 10);
      start = suffix >= size ? 0 : size - suffix;
    } else {
      start = parseInt(match[1], 10);
      end = match[2] === "" ? size - 1 : parseInt(match[2], 10);
    }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0 || end >= size) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return reject(res, 416, "RANGE_NOT_SATISFIABLE", "Requested Range not satisfiable");
    }
    statusCode = 206;
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  }

  res.status(statusCode);
  res.setHeader("Content-Length", String(end - start + 1));

  const stream = fs.createReadStream(resolved, { start, end });
  stream.on("error", (err) => {
    logger.error({ err, contentId: req.params.contentId }, "media stream error");
    if (!res.headersSent) reject(res, 500, "INTERNAL", "Stream failed");
    else res.destroy(err);
  });
  // Client aborted (seek / close) — tear the read down promptly.
  res.on("close", () => stream.destroy());
  stream.pipe(res);
});

export default router;
