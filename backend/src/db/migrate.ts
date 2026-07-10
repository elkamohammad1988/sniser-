import { getDb } from "./index";
import { migrations } from "./migrations";
import { logger } from "../utils/logger";

/**
 * Forward-only migration runner. Applies any migration whose id is not yet in
 * `schema_migrations`, in declaration order, each within its own transaction.
 * Idempotent: safe to call on every boot.
 */
export function runMigrations(): { applied: string[] } {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TEXT NOT NULL
    );
  `);

  const done = new Set(
    db
      .prepare("SELECT id FROM schema_migrations")
      .all()
      .map((r) => (r as { id: string }).id)
  );

  const applied: string[] = [];

  for (const migration of migrations) {
    if (done.has(migration.id)) continue;

    const apply = db.transaction(() => {
      db.exec(migration.up);
      db.prepare(
        "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)"
      ).run(migration.id, new Date().toISOString());
    });

    apply();
    applied.push(migration.id);
    logger.info({ migration: migration.id }, "migration applied");
  }

  if (applied.length === 0) {
    logger.debug("database schema up to date");
  }

  return { applied };
}
