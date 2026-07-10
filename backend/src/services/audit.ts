import { db } from "../db";
import { uuid } from "../utils/ids";
import { nowIso } from "../utils/datetime";
import { logger } from "../utils/logger";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Append an immutable audit record. Never throws into the caller — an auditing
 * failure must not break the business operation, so it is logged and swallowed.
 */
export function writeAudit(input: AuditInput): void {
  try {
    db.prepare(
      `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, ip, metadata, created_at)
       VALUES (@id, @actorId, @action, @targetType, @targetId, @ip, @metadata, @createdAt)`
    ).run({
      id: uuid(),
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      ip: input.ip ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: nowIso(),
    });
  } catch (err) {
    logger.error({ err, action: input.action }, "failed to write audit log");
  }
}
