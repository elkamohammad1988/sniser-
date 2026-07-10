import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp, type TestContext } from "./helpers/app";
import { signup, bearer } from "./helpers/api";

describe("authentication", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await createTestApp();
  });
  after(() => ctx.cleanup());

  test("signup issues an access token + httpOnly refresh cookie", async () => {
    const res = await request(ctx.app).post("/api/v1/auth/signup").send({
      name: "Ada Lovelace",
      email: `ada-${Date.now()}@example.com`,
      password: "Password123",
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.data.token, "expected an access token");
    assert.equal(res.body.data.user.role, "viewer");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    assert.ok(cookies?.some((c) => c.startsWith("sniser_rt=")), "expected refresh cookie");
    assert.ok(
      cookies?.some((c) => /sniser_rt=.*HttpOnly/i.test(c)),
      "refresh cookie must be HttpOnly"
    );
  });

  test("duplicate email is rejected with 409", async () => {
    const email = `dupe-${Date.now()}@example.com`;
    await signup(ctx.app, { email });
    const res = await request(ctx.app)
      .post("/api/v1/auth/signup")
      .send({ name: "Someone", email, password: "Password123" });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  test("weak password is rejected by validation (422)", async () => {
    const res = await request(ctx.app)
      .post("/api/v1/auth/signup")
      .send({ name: "Weak", email: `weak-${Date.now()}@example.com`, password: "short" });
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  test("login with wrong password fails with 401 (no user enumeration)", async () => {
    const email = `login-${Date.now()}@example.com`;
    await signup(ctx.app, { email, password: "Password123" });
    const res = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email, password: "WrongPassword1" });
    assert.equal(res.status, 401);
    // Same generic message whether or not the account exists.
    const missing = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email: `ghost-${Date.now()}@example.com`, password: "WrongPassword1" });
    assert.equal(missing.status, 401);
    assert.equal(res.body.error.message, missing.body.error.message);
  });

  test("/auth/me requires a valid bearer token", async () => {
    const noAuth = await request(ctx.app).get("/api/v1/auth/me");
    assert.equal(noAuth.status, 401);

    const { token, user } = await signup(ctx.app);
    const withAuth = await request(ctx.app).get("/api/v1/auth/me").set(bearer(token));
    assert.equal(withAuth.status, 200);
    assert.equal(withAuth.body.data.user.id, user.id);
  });

  test("a tampered token is rejected", async () => {
    const res = await request(ctx.app)
      .get("/api/v1/auth/me")
      .set({ Authorization: "Bearer not.a.real.token" });
    assert.equal(res.status, 401);
  });
});
