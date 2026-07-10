import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { getDb, closeDb } from "./db";
import { runMigrations } from "./db/migrate";
import { seedDatabase } from "./db/seed";
import { startScheduler, stopScheduler } from "./services/scheduler";

async function bootstrap(): Promise<void> {
  // Open the database and bring the schema up to date before serving traffic.
  getDb();
  if (env.DB_AUTO_MIGRATE) runMigrations();
  if (env.DB_AUTO_SEED) {
    try {
      await seedDatabase();
    } catch (err) {
      logger.error({ err }, "seed failed");
    }
  }

  const app = createApp();
  startScheduler();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, prefix: `${env.API_PREFIX}/v1` },
      `Sniser API listening on http://localhost:${env.PORT}`
    );
  });

  function shutdown(signal: NodeJS.Signals) {
    logger.warn({ signal }, "shutdown signal received");
    stopScheduler();
    server.close((err) => {
      if (err) {
        logger.error({ err }, "error closing server");
        process.exit(1);
      }
      closeDb();
      logger.info("server closed gracefully");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandled rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception — exiting");
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.fatal({ err }, "failed to start server");
  process.exit(1);
});
