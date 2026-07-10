import { env } from "../config/env";
import type { MailMessage } from "./email";

const BRAND = "#A6E84D";
const BG = "#1C1F24";
const CARD = "#262A30";

/**
 * Escape HTML special characters so user- or artist-controlled values (names,
 * release titles, references) can never inject markup into an email body.
 * The plaintext (`text`) variants are inherently safe and left as-is.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BG};font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#e9eaec">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;color:#fff;margin-bottom:24px">
      Sni<span style="color:${BRAND}">ser</span>
    </div>
    <div style="background:${CARD};border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fff">${heading}</h1>
      ${bodyHtml}
    </div>
    <p style="margin:20px 4px;font-size:12px;color:#8b8f96">
      Sniser — money for your music. You are receiving this because an account
      action was requested for this address.
    </p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:${BG};font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;margin:8px 0">${label}</a>`;
}

export function verifyEmail(name: string, token: string): MailMessage {
  const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to: "",
    subject: "Confirm your Sniser email",
    text: `Hi ${name}, confirm your email: ${link}`,
    html: layout(
      "Confirm your email",
      `<p style="color:#c7c9cd">Hi ${esc(name)}, welcome to Sniser. Confirm your email to unlock purchases and payouts.</p>${button(link, "Verify email")}<p style="font-size:12px;color:#8b8f96">This link expires in 24 hours.</p>`
    ),
  };
}

export function resetPassword(name: string, token: string): MailMessage {
  const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to: "",
    subject: "Reset your Sniser password",
    text: `Hi ${name}, reset your password: ${link}`,
    html: layout(
      "Reset your password",
      `<p style="color:#c7c9cd">Hi ${esc(name)}, we received a request to reset your password. If it wasn't you, ignore this email.</p>${button(link, "Choose a new password")}<p style="font-size:12px;color:#8b8f96">This link expires in 1 hour.</p>`
    ),
  };
}

export function purchaseReceipt(
  name: string,
  title: string,
  total: string,
  reference: string
): MailMessage {
  return {
    to: "",
    subject: `Receipt — ${title}`,
    text: `Hi ${name}, your purchase of "${title}" for ${total} is confirmed. Ref ${reference}.`,
    html: layout(
      "Purchase confirmed",
      `<p style="color:#c7c9cd">Hi ${esc(name)}, your access pass for <strong style="color:#fff">${esc(title)}</strong> is now in your library.</p>
       <table style="width:100%;font-size:14px;color:#c7c9cd;margin:12px 0">
         <tr><td>Total paid</td><td style="text-align:right;color:#fff">${esc(total)}</td></tr>
         <tr><td>Reference</td><td style="text-align:right;color:#fff">${esc(reference)}</td></tr>
       </table>${button(`${env.APP_URL}/library`, "Open library")}`
    ),
  };
}

export function saleNotification(
  name: string,
  title: string,
  net: string
): MailMessage {
  return {
    to: "",
    subject: `You made a sale — ${title}`,
    text: `Hi ${name}, your resale listing for "${title}" sold. ${net} was credited to your wallet.`,
    html: layout(
      "You made a sale",
      `<p style="color:#c7c9cd">Nice — your listing for <strong style="color:#fff">${esc(title)}</strong> just sold. <strong style="color:${BRAND}">${esc(net)}</strong> was credited to your wallet.</p>${button(`${env.APP_URL}/wallet`, "View wallet")}`
    ),
  };
}

export function contactAck(name: string, reference: string): MailMessage {
  return {
    to: "",
    subject: `We got your message (${reference})`,
    text: `Hi ${name}, thanks for reaching out. Your reference is ${reference}. We'll reply within 1–2 business days.`,
    html: layout(
      "Thanks for reaching out",
      `<p style="color:#c7c9cd">Hi ${esc(name)}, we received your message and our team will get back to you within 1–2 business days.</p><p style="color:#c7c9cd">Your reference: <strong style="color:#fff">${esc(reference)}</strong></p>`
    ),
  };
}
