import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

describe("authorization & access control", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("admin routes reject anonymous (401) and non-admins (403)", async () => {
    const anon = await request(ctx.app).get("/api/v1/admin/stats");
    assert.equal(anon.status, 401);

    const viewer = await signup(ctx.app);
    const forbidden = await request(ctx.app)
      .get("/api/v1/admin/stats")
      .set(bearer(viewer.token));
    assert.equal(forbidden.status, 403);
  });

  test("a promoted admin can reach admin routes", async () => {
    const user = await signup(ctx.app);
    const { db } = await import("../src/db");
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.user.id);

    // requireAuth re-reads the role from the DB, so the existing token now works.
    const res = await request(ctx.app).get("/api/v1/admin/stats").set(bearer(user.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("an artist cannot modify another artist's release (IDOR)", async () => {
    // Artist A publishes a release.
    const artistA = await signup(ctx.app);
    await request(ctx.app)
      .post("/api/v1/artists/apply")
      .set(bearer(artistA.token))
      .send({ handle: `a${Date.now().toString().slice(-7)}`, displayName: "Artist A" });
    const create = await request(ctx.app)
      .post("/api/v1/artists/me/releases")
      .set(bearer(artistA.token))
      .send({ title: "A Song", category: "audio", price: 5 });
    const contentId = create.body.data.release.id;

    // Artist B tries to edit it → treated as not found (ownership enforced).
    const artistB = await signup(ctx.app);
    await request(ctx.app)
      .post("/api/v1/artists/apply")
      .set(bearer(artistB.token))
      .send({ handle: `b${Date.now().toString().slice(-7)}`, displayName: "Artist B" });
    const attempt = await request(ctx.app)
      .patch(`/api/v1/artists/me/releases/${contentId}`)
      .set(bearer(artistB.token))
      .send({ title: "Hijacked" });
    assert.equal(attempt.status, 404);
  });

  test("catalog listing is public", async () => {
    const res = await request(ctx.app).get("/api/v1/catalog");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
