import fs from "node:fs";
import path from "node:path";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { nowIso } from "../utils/datetime";

/**
 * Email delivery. When SMTP is configured (SMTP_HOST + SMTP_PORT) real mail is
 * sent. Otherwise every message is written to a JSON file in the outbox dir and
 * logged — so verification / reset / receipt flows are fully exercisable in
 * development and tests without external credentials.
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!env.smtpConfigured) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

function writeToOutbox(msg: MailMessage): void {
  fs.mkdirSync(env.outboxDir, { recursive: true });
  const safe = msg.to.replace(/[^a-z0-9]+/gi, "_");
  const file = path.join(
    env.outboxDir,
    `${Date.now()}-${safe}.json`
  );
  fs.writeFileSync(
    file,
    JSON.stringify({ from: env.MAIL_FROM, ...msg, sentAt: nowIso() }, null, 2)
  );
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const transport = getTransport();
  if (transport) {
    try {
      await transport.sendMail({ from: env.MAIL_FROM, ...msg });
      logger.info({ to: msg.to, subject: msg.subject }, "email sent via SMTP");
      return;
    } catch (err) {
      logger.error({ err, to: msg.to }, "SMTP send failed — falling back to outbox");
    }
  }
  writeToOutbox(msg);
  logger.info(
    { to: msg.to, subject: msg.subject, outbox: env.outboxDir },
    "email captured to outbox"
  );
}
