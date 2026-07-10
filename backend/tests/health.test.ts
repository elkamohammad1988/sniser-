import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp, type TestContext } from "./helpers/app";

describe("health & app shell", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("GET /healthz returns ok (unwrapped, for probes)", async () => {
    const res = await request(ctx.app).get("/healthz");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: "ok" });
  });

  test("GET /api/v1/health returns a success envelope", async () => {
    const res = await request(ctx.app).get("/api/v1/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("unknown route returns a 404 error envelope", async () => {
    const res = await request(ctx.app).get("/api/v1/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.code);
  });

  test("security headers are set and x-powered-by is hidden", async () => {
    const res = await request(ctx.app).get("/healthz");
    assert.equal(res.headers["x-powered-by"], undefined);
    assert.ok(res.headers["content-security-policy"]);
  });
});
