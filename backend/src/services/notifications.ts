import { db } from "../db";
import { uuid } from "../utils/ids";
import { nowIso } from "../utils/datetime";

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: string | null;
  read_at: string | null;
  created_at: string;
}

export function createNotification(input: NotificationInput): void {
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
     VALUES (@id, @userId, @type, @title, @body, @data, @createdAt)`
  ).run({
    id: uuid(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    data: input.data ? JSON.stringify(input.data) : null,
    createdAt: nowIso(),
  });
}

function toDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ? (JSON.parse(row.data) as Record<string, unknown>) : null,
    read: row.read_at !== null,
    createdAt: row.created_at,
  };
}

export function listNotifications(userId: string, limit = 30): NotificationDto[] {
  const rows = db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(userId, limit) as NotificationRow[];
  return rows.map(toDto);
}

export function unreadCount(userId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL`
    )
    .get(userId) as { n: number };
  return row.n;
}

export function markRead(userId: string, ids?: string[]): number {
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const result = db
      .prepare(
        `UPDATE notifications SET read_at = ?
         WHERE user_id = ? AND read_at IS NULL AND id IN (${placeholders})`
      )
      .run(nowIso(), userId, ...ids);
    return result.changes;
  }
  const result = db
    .prepare(
      `UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`
    )
    .run(nowIso(), userId);
  return result.changes;
}
