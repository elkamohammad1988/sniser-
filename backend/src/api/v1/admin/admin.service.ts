import { db } from "../../../db";
import { nowIso } from "../../../utils/datetime";
import { toUnits } from "../../../utils/money";
import { resolvePage, paginationMeta } from "../../../utils/pagination";
import { ApiError } from "../../../utils/ApiError";
import { writeAudit } from "../../../services/audit";
import { revokeAllForUser } from "../../../services/session";
import { catalogCache } from "../../../utils/cache";

export function platformStats() {
  const users = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN role = 'artist' THEN 1 ELSE 0 END) AS artists,
         SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins,
         SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended
       FROM users`
    )
    .get() as { total: number; artists: number | null; admins: number | null; suspended: number | null };

  const content = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
       FROM content`
    )
    .get() as { total: number; published: number | null };

  const sales = db
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(SUM(price_cents + fee_cents), 0) AS gross_cents FROM purchases"
    )
    .get() as { count: number; gross_cents: number };

  const tickets = db
    .prepare("SELECT COUNT(*) AS open FROM contact_tickets WHERE status != 'closed'")
    .get() as { open: number };

  const listings = db
    .prepare("SELECT COUNT(*) AS active FROM resale_listings WHERE status = 'active'")
    .get() as { active: number };

  return {
    users: {
      total: users.total,
      artists: users.artists ?? 0,
      admins: users.admins ?? 0,
      suspended: users.suspended ?? 0,
    },
    content: { total: content.total, published: content.published ?? 0 },
    sales: { count: sales.count, grossVolume: toUnits(sales.gross_cents), currency: "USDC" },
    tickets: { open: tickets.open },
    resale: { active: listings.active },
  };
}

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  email_verified: number;
  created_at: string;
  purchases: number;
}

export function listUsers(query: {
  role: string;
  status: string;
  q?: string;
  page: number;
  pageSize: number;
}) {
  const { page, pageSize, offset } = resolvePage(query.page, query.pageSize, 100, 25);
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (query.role !== "all") {
    clauses.push("u.role = @role");
    params.role = query.role;
  }
  if (query.status !== "all") {
    clauses.push("u.status = @status");
    params.status = query.status;
  }
  if (query.q) {
    clauses.push("(u.email LIKE @q OR u.name LIKE @q)");
    params.q = `%${query.q}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM users u ${where}`).get(params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.status, u.email_verified, u.created_at,
              (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id) AS purchases
       FROM users u ${where}
       ORDER BY u.created_at DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset }) as AdminUserRow[];

  const items = rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    status: r.status,
    emailVerified: r.email_verified === 1,
    purchases: r.purchases,
    createdAt: r.created_at,
  }));

  return { items, pagination: paginationMeta(page, pageSize, total) };
}

export function updateUser(
  actorId: string,
  userId: string,
  patch: { role?: string; status?: string },
  ip?: string | null
) {
  const target = db.prepare("SELECT id, role, status FROM users WHERE id = ?").get(userId) as
    | { id: string; role: string; status: string }
    | undefined;
  if (!target) throw ApiError.notFound("User not found");

  if (userId === actorId && patch.status === "suspended") {
    throw ApiError.badRequest("You can't suspend your own account");
  }
  if (userId === actorId && patch.role && patch.role !== "admin") {
    throw ApiError.badRequest("You can't remove your own admin role");
  }

  const role = patch.role ?? target.role;
  const status = patch.status ?? target.status;

  db.prepare("UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?").run(
    role,
    status,
    nowIso(),
    userId
  );

  // Suspending kills active sessions immediately.
  if (status === "suspended") revokeAllForUser(userId);

  writeAudit({
    actorId,
    action: "admin.update_user",
    targetType: "user",
    targetId: userId,
    ip,
    metadata: { role, status },
  });

  return { id: userId, role, status };
}

interface TicketRow {
  id: string;
  reference: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  created_at: string;
}

export function listTickets(query: { status: string; page: number; pageSize: number }) {
  const { page, pageSize, offset } = resolvePage(query.page, query.pageSize, 100, 25);
  const where = query.status === "all" ? "" : "WHERE status = @status";
  const params: Record<string, unknown> = query.status === "all" ? {} : { status: query.status };

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM contact_tickets ${where}`).get(params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT id, reference, name, email, topic, message, status, created_at
       FROM contact_tickets ${where}
       ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset }) as TicketRow[];

  const items = rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    name: r.name,
    email: r.email,
    topic: r.topic,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
  }));

  return { items, pagination: paginationMeta(page, pageSize, total) };
}

export function updateTicket(actorId: string, ticketId: string, status: string, ip?: string | null) {
  const result = db
    .prepare("UPDATE contact_tickets SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, nowIso(), ticketId);
  if (result.changes === 0) throw ApiError.notFound("Ticket not found");
  writeAudit({ actorId, action: "admin.update_ticket", targetType: "ticket", targetId: ticketId, ip, metadata: { status } });
  return { id: ticketId, status };
}

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip: string | null;
  metadata: string | null;
  created_at: string;
  actor_email: string | null;
}

export function listAudit(query: { action?: string; page: number; pageSize: number }) {
  const { page, pageSize, offset } = resolvePage(query.page, query.pageSize, 100, 25);
  const where = query.action ? "WHERE a.action LIKE @action" : "";
  const params: Record<string, unknown> = query.action ? { action: `${query.action}%` } : {};

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM audit_logs a ${where}`).get(params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT a.*, u.email AS actor_email
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ${where}
       ORDER BY a.created_at DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset }) as AuditRow[];

  const items = rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorEmail: r.actor_email,
    targetType: r.target_type,
    targetId: r.target_id,
    ip: r.ip,
    metadata: r.metadata ? (JSON.parse(r.metadata) as Record<string, unknown>) : null,
    createdAt: r.created_at,
  }));

  return { items, pagination: paginationMeta(page, pageSize, total) };
}

/** Admin can force-invalidate the catalog cache after data corrections. */
export function flushCatalogCache(): void {
  catalogCache.invalidate();
}
