/**
 * One-off retry of 23-auth-modal-mobile that failed because the drawer's
 * staggered child wasn't focusable when clickByText scanned the DOM.
 * This time we wait longer + click via Promise.race on a stable selector.
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "portfolio");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

// Prime cookie consent so banner doesn't cover the modal.
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem("sniser:cookie-consent", "accepted");
  } catch {}
});

await page.goto("https://frontend-rho-seven-25.vercel.app/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));

// Open the drawer.
await page.evaluate(() => {
  const btn = document.querySelector('[aria-label="Open menu"]');
  if (btn) btn.click();
});
await new Promise((r) => setTimeout(r, 1200));

// Click the Sign up button. The drawer renders multiple buttons — the primary
// (green) one whose text is "Sign up" is what we want.
const clicked = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const signup = buttons.find((b) => b.textContent?.trim() === "Sign up" && !b.disabled);
  if (signup) {
    signup.click();
    return true;
  }
  return false;
});

if (!clicked) {
  console.error("Still could not find Sign up button");
  await browser.close();
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: path.join(OUT, "23-auth-modal-mobile.png"), type: "png" });
console.log("✓ 23-auth-modal-mobile.png saved");
await browser.close();
