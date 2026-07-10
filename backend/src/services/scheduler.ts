import { db } from "../db";
import { nowIso } from "../utils/datetime";
import { logger } from "../utils/logger";

/**
 * Lightweight in-process job scheduler. Each job runs on a fixed interval;
 * timers are `unref()`-ed so they never keep the process alive during
 * shutdown. Errors in one run are logged and never crash the loop.
 */
export interface Job {
  name: string;
  intervalMs: number;
  run: () => void | Promise<void>;
}

const timers: NodeJS.Timeout[] = [];

/** Remove expired / revoked refresh tokens and used / expired email tokens. */
function purgeExpiredTokens(): void {
  const now = nowIso();
  const refresh = db
    .prepare("DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked_at IS NOT NULL")
    .run(now);
  const email = db
    .prepare("DELETE FROM email_tokens WHERE expires_at < ? OR used_at IS NOT NULL")
    .run(now);
  if (refresh.changes || email.changes) {
    logger.debug(
      { refreshTokens: refresh.changes, emailTokens: email.changes },
      "token cleanup"
    );
  }
}

export const JOBS: Job[] = [
  { name: "purge-expired-tokens", intervalMs: 60 * 60 * 1000, run: purgeExpiredTokens },
];

async function runJob(job: Job): Promise<void> {
  try {
    await job.run();
  } catch (err) {
    logger.error({ err, job: job.name }, "scheduled job failed");
  }
}

export function startScheduler(): void {
  for (const job of JOBS) {
    // Kick off shortly after boot, then on the interval. The one-shot kickoff is
    // tracked too so stopScheduler() can cancel it — otherwise a job could still
    // fire in the first few seconds after a shutdown was requested.
    const kickoff = setTimeout(() => void runJob(job), 5_000);
    kickoff.unref();
    timers.push(kickoff);
    const timer = setInterval(() => void runJob(job), job.intervalMs);
    timer.unref();
    timers.push(timer);
  }
  logger.debug({ jobs: JOBS.map((j) => j.name) }, "scheduler started");
}

export function stopScheduler(): void {
  // clearTimeout and clearInterval are interchangeable on Node timer handles.
  while (timers.length) {
    const t = timers.pop();
    if (t) clearTimeout(t);
  }
}
