import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

/**
 * Test bootstrap. Env vars are set HERE, at module-load time, before any app
 * module is imported — env.ts reads process.env once at import, and dotenv does
 * not override values that are already set, so this pins a hermetic test
 * configuration (isolated temp SQLite file, no demo seed, fixed secrets).
 */
const runId = `${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
const tmpDir = path.join(os.tmpdir(), `sniser-test-${runId}`);
fs.mkdirSync(tmpDir, { recursive: true });

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");
process.env.UPLOAD_DIR = path.join(tmpDir, "uploads");
process.env.MAIL_OUTBOX_DIR = path.join(tmpDir, "outbox");
process.env.DB_AUTO_SEED = "false";
process.env.DB_AUTO_MIGRATE = "false";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars-long";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars-long";
process.env.LOG_LEVEL = "silent";

export interface TestContext {
  app: import("express").Application;
  cleanup: () => void;
}

/** Build a fully-migrated app on a fresh, isolated database. */
export async function createTestApp(): Promise<TestContext> {
  const { runMigrations } = await import("../../src/db/migrate");
  const { createApp } = await import("../../src/app");
  const { closeDb } = await import("../../src/db");

  runMigrations();
  const app = createApp();

  return {
    app,
    cleanup: () => {
      closeDb();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}
