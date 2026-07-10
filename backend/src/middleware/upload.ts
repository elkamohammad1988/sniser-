import fs from "node:fs";
import path from "node:path";
import { RequestHandler } from "express";
import multer, { MulterError } from "multer";
import { env } from "../config/env";
import { uuid } from "../utils/ids";
import { ApiError } from "../utils/ApiError";

/**
 * Disk-backed uploads. Files are routed into per-purpose subfolders of the
 * upload dir and stored under a random uuid filename (never the client name).
 * Type is enforced per field; size is capped globally.
 */

const SUBDIR: Record<string, string> = {
  cover: "covers",
  media: "media",
  avatar: "avatars",
};

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * Canonical extension per accepted MIME type. The stored filename's extension is
 * taken from this map (keyed on the validated `file.mimetype`) — NEVER from the
 * client-supplied `originalname` — so a caller can't upload `x.html` with a
 * `Content-Type: image/png` header and have it served as text/html from the
 * `/uploads` origin (a content-type-spoofing / hosted-content vector). An
 * unmapped media type falls back to no extension → served as a plain download.
 */
const MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/webm": ".weba",
  "audio/aac": ".aac",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
};

function destFor(field: string): string {
  const dir = path.join(env.uploadDir, SUBDIR[field] ?? "misc");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, destFor(file.fieldname)),
  filename: (_req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] ?? "";
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname === "media") {
    const ok = file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/");
    return ok
      ? cb(null, true)
      : cb(new ApiError(400, "Media must be an audio or video file", "BAD_REQUEST"));
  }
  // cover + avatar
  return IMAGE_TYPES.has(file.mimetype)
    ? cb(null, true)
    : cb(new ApiError(400, "Image must be PNG, JPEG, WEBP or GIF", "BAD_REQUEST"));
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 2 },
});

/** Wrap a multer middleware so its errors become typed ApiErrors. */
function normalize(mw: RequestHandler): RequestHandler {
  return (req, res, next) =>
    mw(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? `File too large (max ${env.MAX_UPLOAD_MB} MB)`
            : `Upload error: ${err.message}`;
        return next(ApiError.badRequest(message));
      }
      if (err) return next(err);
      next();
    });
}

/** Optional cover + media on the same request (release create/update). */
export const uploadRelease = normalize(
  multerInstance.fields([
    { name: "cover", maxCount: 1 },
    { name: "media", maxCount: 1 },
  ])
);

export const uploadAvatar = normalize(multerInstance.single("avatar"));

/** Public URL for a stored file relative to the API origin. */
export function assetPath(field: string, filename: string): string {
  return `/uploads/${SUBDIR[field] ?? "misc"}/${filename}`;
}
