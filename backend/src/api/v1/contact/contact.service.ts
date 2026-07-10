import { db } from "../../../db";
import { uuid, reference } from "../../../utils/ids";
import { nowIso } from "../../../utils/datetime";
import { logger } from "../../../utils/logger";
import { createNotification } from "../../../services/notifications";
import { writeAudit } from "../../../services/audit";
import { sendMail } from "../../../services/email";
import * as templates from "../../../services/emailTemplates";
import type { ContactBody } from "./contact.schema";

export interface ContactContext {
  ip?: string | null;
  userId?: string | null;
}

export interface ContactReceipt {
  ticketId: string;
  receivedAt: string;
}

function notifyAdmins(ref: string, topic: string): void {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: string }[];
  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      type: "contact_ticket",
      title: "New contact message",
      body: `A ${topic} enquiry arrived (${ref}).`,
      data: { reference: ref, topic },
    });
  }
}

export async function submit(input: ContactBody, ctx: ContactContext): Promise<ContactReceipt> {
  const now = nowIso();
  const ref = reference("SNS");

  // Honeypot tripped → look successful to the bot, but store nothing.
  if (input.website && input.website.trim() !== "") {
    logger.warn({ ip: ctx.ip }, "contact honeypot tripped");
    return { ticketId: ref, receivedAt: now };
  }

  db.prepare(
    `INSERT INTO contact_tickets (id, reference, user_id, name, email, topic, message, status, ip, created_at, updated_at)
     VALUES (@id, @reference, @userId, @name, @email, @topic, @message, 'open', @ip, @now, @now)`
  ).run({
    id: uuid(),
    reference: ref,
    userId: ctx.userId ?? null,
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    ip: ctx.ip ?? null,
    now,
  });

  notifyAdmins(ref, input.topic);
  writeAudit({ actorId: ctx.userId ?? null, action: "contact.submit", targetType: "ticket", targetId: ref, ip: ctx.ip, metadata: { topic: input.topic } });

  const ack = templates.contactAck(input.name, ref);
  await sendMail({ ...ack, to: input.email });

  return { ticketId: ref, receivedAt: now };
}
