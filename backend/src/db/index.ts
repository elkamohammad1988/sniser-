import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Single shared SQLite connection.
 *
 * SQLite (via better-sqlite3) is a deliberate choice: it is synchronous,
 * transactional, ACID-compliant, needs no external service, and comfortably
 * handles this workload. WAL mode gives concurrent readers alongside a writer,
 * and `foreign_keys = ON` enforces every relationship declared in the schema.
 */

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  const file = env.databaseFile;
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");

  instance = db;
  logger.debug({ file }, "sqlite connection opened");
  return db;
}

/** Convenience accessor — the live connection. */
export const db = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const conn = getDb();
    const value = (conn as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(conn) : value;
  },
});

/**
 * Run a set of statements inside a single transaction. Rolls back on throw.
 * better-sqlite3 transactions are synchronous — pass a sync function.
 */
export function transaction<T>(fn: (tx: Database.Database) => T): T {
  const conn = getDb();
  const wrapped = conn.transaction(fn);
  return wrapped(conn);
}

/**
 * Like {@link transaction}, but begins with `BEGIN IMMEDIATE` so the write lock
 * is acquired up front. Use this when the body reads a value and then writes a
 * decision based on it (e.g. a supply/quota check followed by an insert): with a
 * deferred transaction two concurrent processes could both read the stale value
 * before either writes. An immediate transaction serializes them, so the
 * read-then-write stays consistent even across processes sharing the DB file.
 */
export function transactionImmediate<T>(fn: (tx: Database.Database) => T): T {
  const conn = getDb();
  const wrapped = conn.transaction(fn).immediate;
  return wrapped(conn);
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
    logger.debug("sqlite connection closed");
  }
}
