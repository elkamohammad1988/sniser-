/**
 * Standalone migration runner — apply pending migrations without starting the
 * HTTP server. Handy as a pre-deploy / release step, or in CI.
 *
 *   Local (ts):    npm run migrate:dev
 *   Built (prod):  npm run migrate      # node dist/db/migrateCli.js
 *
 * Idempotent: re-running when the schema is current is a no-op.
 */
import { getDb, closeDb } from "./index";
import { runMigrations } from "./migrate";
import { logger } from "../utils/logger";

try {
  getDb();
  const { applied } = runMigrations();
  logger.info(
    { applied, count: applied.length },
    applied.length ? "migrations applied" : "schema already up to date"
  );
  closeDb();
  process.exit(0);
} catch (err) {
  logger.fatal({ err }, "migration run failed");
  process.exit(1);
}
