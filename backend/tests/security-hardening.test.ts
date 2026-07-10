import fs from "node:fs";
import path from "node:path";
import { test, describe, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { Database } from "better-sqlite3";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

async function waitFor(fn: () => boolean, ms = 2000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return fn();
}

/** Pull the `sniser_rt=…` pair out of a Set-Cookie response header. */
function refreshCookie(res: request.Response): string {
  const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
  const rt = cookies.find((c) => c.startsWith("sniser_rt="));
  assert.ok(rt, "expected a refresh cookie in the response");
  return rt.split(";")[0];
}

describe("upload hardening: stored extension comes from the validated MIME, not the filename", () => {
  let ctx: TestContext;
  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("an HTML file uploaded as image/png is stored with a .png extension", async () => {
    const u = await signup(ctx.app, { name: "Upload User" });
    const res = await request(ctx.app)
      .patch("/api/v1/users/me")
      .set(bearer(u.token))
      .attach("avatar", Buffer.from("<script>alert(document.domain)</script>"), {
        filename: "x.html",
        contentType: "image/png",
      });
    assert.equal(res.status, 200, `upload failed: ${JSON.stringify(res.body)}`);
    const url = res.body.data.user.avatarUrl as string;
    assert.ok(url, "expected an avatar url");
    assert.ok(url.endsWith(".png"), `must be served as .png, got: ${url}`);
    assert.ok(!url.toLowerCase().includes(".html"), `must not honor the client .html extension: ${url}`);
  });

  test("a non-image mime is rejected outright", async () => {
    const u = await signup(ctx.app, { name: "Bad Upload" });
    const res = await request(ctx.app)
      .patch("/api/v1/users/me")
      .set(bearer(u.token))
      .attach("avatar", Buffer.from("hello"), { filename: "note.txt", contentType: "text/plain" });
    assert.equal(res.status, 400);
  });

  test("replacing an avatar deletes the previous file from disk", async () => {
    const u = await signup(ctx.app, { name: "Avatar Swapper" });
    const uploadDir = process.env.UPLOAD_DIR!;

    const first = await request(ctx.app)
      .patch("/api/v1/users/me")
      .set(bearer(u.token))
      .attach("avatar", Buffer.from("first-avatar-bytes"), { filename: "a.png", contentType: "image/png" });
    assert.equal(first.status, 200);
    const firstUrl = first.body.data.user.avatarUrl as string;
    const firstFile = path.join(uploadDir, firstUrl.replace("/uploads/", ""));
    assert.ok(fs.existsSync(firstFile), "first avatar should be on disk");

    const second = await request(ctx.app)
      .patch("/api/v1/users/me")
      .set(bearer(u.token))
      .attach("avatar", Buffer.from("second-avatar-bytes"), { filename: "b.png", contentType: "image/png" });
    assert.equal(second.status, 200);

    assert.ok(await waitFor(() => !fs.existsSync(firstFile)), "previous avatar file should be deleted");
  });
});

describe("session hardening: refresh-token reuse detection", () => {
  let ctx: TestContext;
  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("replaying a rotated-out refresh token revokes the whole family", async () => {
    const su = await request(ctx.app)
      .post("/api/v1/auth/signup")
      .send({ name: "Reuse", email: `reuse-${Date.now()}@test.io`, password: "Password123" });
    assert.equal(su.status, 201);
    const original = refreshCookie(su);

    // Legitimate rotation → new token issued, `original` now revoked.
    const rotated = await request(ctx.app).post("/api/v1/auth/refresh").set("Cookie", original);
    assert.equal(rotated.status, 200);
    const rotatedToken = refreshCookie(rotated);

    // Replaying the old (revoked) token is the theft signal.
    const replay = await request(ctx.app).post("/api/v1/auth/refresh").set("Cookie", original);
    assert.equal(replay.status, 401);

    // The fix: the reused token's whole family is revoked, so even the currently
    // "valid" rotated token can no longer refresh. Without the fix this is 200.
    const afterReuse = await request(ctx.app).post("/api/v1/auth/refresh").set("Cookie", rotatedToken);
    assert.equal(afterReuse.status, 401, "family must be revoked after a reuse is detected");
  });
});

describe("scheduler hardening: shutdown cancels the boot kickoff", () => {
  let ctx: TestContext;
  let db: Database;
  let startScheduler: () => void;
  let stopScheduler: () => void;

  before(async () => {
    ctx = await createTestApp();
    ({ db } = await import("../src/db"));
    ({ startScheduler, stopScheduler } = await import("../src/services/scheduler"));
  });
  after(() => ctx.cleanup());

  test("stopScheduler() prevents the purge job from firing after shutdown", async () => {
    const user = await signup(ctx.app, { name: "Sched User" });
    const tokenId = "sched-test-token";
    // An already-expired refresh token is exactly what the purge job deletes.
    db.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(tokenId, user.user.id, "sched-hash", "2000-01-01T00:00:00.000Z", "2000-01-01T00:00:00.000Z");

    mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
    try {
      startScheduler();
      stopScheduler(); // cancel BEFORE the ~5s boot kickoff
      mock.timers.tick(10_000);
      assert.ok(
        db.prepare("SELECT 1 FROM refresh_tokens WHERE id = ?").get(tokenId),
        "purge must NOT run after stopScheduler()"
      );

      // Positive control: left running, the kickoff fires and purges the token.
      startScheduler();
      mock.timers.tick(10_000);
      assert.equal(
        db.prepare("SELECT 1 FROM refresh_tokens WHERE id = ?").get(tokenId),
        undefined,
        "purge SHOULD run while the scheduler is live"
      );
      stopScheduler();
    } finally {
      mock.timers.reset();
    }
  });
});
