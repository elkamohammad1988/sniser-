import request from "supertest";
import type { Application } from "express";

let counter = 0;

/** Register a fresh user and return its access token + public user object. */
export async function signup(
  app: Application,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  counter += 1;
  const body = {
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}-${Date.now()}@example.com`,
    password: overrides.password ?? "Password123",
  };
  const res = await request(app).post("/api/v1/auth/signup").send(body);
  if (res.status !== 201) {
    throw new Error(`signup failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.token, user: res.body.data.user };
}

/** Authorization header helper. */
export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
