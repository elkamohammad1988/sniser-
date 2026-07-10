/**
 * Portfolio screenshot capture.
 *
 * Uses the locally-installed Chrome via puppeteer-core (no Chromium download).
 * Loads the live production deployment, primes localStorage so the cookie
 * banner / auth state are in the right shape, captures retina PNGs at
 * desktop + mobile viewports, and writes them to `portfolio/`.
 *
 *   node scripts/portfolio-shots.mjs [--base=https://...] [--local]
 *
 *   --local   targets http://localhost:5173 (start `npm run dev` first)
 *   --base    custom base URL
 */

import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "portfolio");
fs.mkdirSync(OUT, { recursive: true });

// ─── Config ──────────────────────────────────────────────────────────────
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split("=");
    return [k.replace(/^--/, ""), v ?? true];
  })
);

const PROD_URL = "https://frontend-rho-seven-25.vercel.app";
const LOCAL_URL = "http://localhost:5173";
const BASE = args.get("base") || (args.get("local") ? LOCAL_URL : PROD_URL);

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No Chrome found. Install Chrome or pass --executable=/path/to/chrome");
  process.exit(1);
}

console.log(`▶ Base URL: ${BASE}`);
console.log(`▶ Chrome:   ${executablePath}`);
console.log(`▶ Output:   ${OUT}\n`);

// ─── Viewport presets ────────────────────────────────────────────────────
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// ─── Helpers ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Primes localStorage before the app boots so:
 *   - the cookie banner stays dismissed
 *   - we can choose anonymous vs signed-in for a given shot
 */
async function primeStorage(page, { signedIn = false, walletConnected = false } = {}) {
  await page.evaluateOnNewDocument(
    (params) => {
      try {
        localStorage.setItem("sniser:cookie-consent", "accepted");
        if (params.signedIn) {
          const session = {
            user: {
              id: "deadbeef",
              name: "Alex Carter",
              email: "alex@sniser.com",
              createdAt: "2026-01-15T00:00:00.000Z",
            },
            wallet: params.walletConnected
              ? {
                  provider: "MetaMask",
                  address: "0x1a2b3c4d5e6f7890abcdef1234567890fedcba98",
                  connectedAt: "2026-01-15T00:00:00.000Z",
                }
              : null,
          };
          localStorage.setItem("sniser:session:v1", JSON.stringify(session));
        }
      } catch {
        /* private browsing — ignore */
      }
    },
    { signedIn, walletConnected }
  );
}

async function newPage(browser, viewport, opts) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await primeStorage(page, opts);
  return page;
}

async function gotoAndSettle(page, urlPath, { delay = 1500 } = {}) {
  const url = BASE.replace(/\/$/, "") + urlPath;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
  // Let entrance animations finish (fadeUp/stagger ~700ms).
  await sleep(delay);
}

async function shoot(page, name, { fullPage = false } = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage, type: "png", omitBackground: false });
  const size = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`  ✓ ${name}.png  (${size} kB)`);
}

async function clickByText(page, text) {
  // Find the first visible element whose innerText matches and click it.
  const handle = await page.evaluateHandle((t) => {
    const all = Array.from(document.querySelectorAll("button, a"));
    return all.find((el) => el.innerText.trim().toLowerCase() === t.toLowerCase()) || null;
  }, text);
  const el = handle.asElement();
  if (!el) throw new Error(`No element with text "${text}"`);
  await el.click();
  await sleep(700);
}

// ─── Capture pipeline ────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-blink-features=AutomationControlled"],
});

const tasks = [
  // ─── Desktop ──────────────────────────────────────────────────────────
  {
    name: "01-artist-hero-desktop",
    desc: "Artist page hero — primary thumbnail material",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/");
      await shoot(p, "01-artist-hero-desktop");
      await p.close();
    },
  },
  {
    name: "02-artist-full-desktop",
    desc: "Artist page full-page (hero + cards + how-it-works)",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/", { delay: 2000 });
      await shoot(p, "02-artist-full-desktop", { fullPage: true });
      await p.close();
    },
  },
  {
    name: "03-viewer-hero-desktop",
    desc: "Viewer page hero with illustration",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/viewer");
      await shoot(p, "03-viewer-hero-desktop");
      await p.close();
    },
  },
  {
    name: "04-viewer-step-cards",
    desc: "Viewer step 2 (verify access) — dark card with phone illustration",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/viewer", { delay: 2000 });
      await p.evaluate(() => document.getElementById("viewer-steps")?.scrollIntoView({ behavior: "instant" }));
      await sleep(1200);
      await shoot(p, "04-viewer-step-cards");
      await p.close();
    },
  },
  {
    name: "05-browse-marketplace-desktop",
    desc: "Marketplace top — tabs + filters + card grid",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/browse", { delay: 2000 });
      await shoot(p, "05-browse-marketplace-desktop");
      await p.close();
    },
  },
  {
    name: "06-browse-marketplace-full",
    desc: "Marketplace full-page (every card visible) — great for long thumbnails",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/browse", { delay: 2000 });
      await shoot(p, "06-browse-marketplace-full", { fullPage: true });
      await p.close();
    },
  },
  {
    name: "07-auth-modal-signup",
    desc: "Sign up modal — proves real form flow",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/");
      await clickByText(p, "Sign up");
      await sleep(800);
      await shoot(p, "07-auth-modal-signup");
      await p.close();
    },
  },
  {
    name: "08-wallet-modal",
    desc: "Connect Wallet modal — Web3 credibility shot",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/");
      await clickByText(p, "Connect Wallet");
      await sleep(800);
      await shoot(p, "08-wallet-modal");
      await p.close();
    },
  },
  {
    name: "09-purchase-modal",
    desc: "Purchase confirm modal — the proof-of-product shot",
    run: async () => {
      const p = await newPage(browser, DESKTOP, { signedIn: true, walletConnected: true });
      await gotoAndSettle(p, "/browse", { delay: 2000 });
      // Click the first "Buy access" button.
      await clickByText(p, "Buy access");
      await sleep(900);
      await shoot(p, "09-purchase-modal");
      await p.close();
    },
  },
  {
    name: "10-signed-in-navbar",
    desc: "Navbar with user avatar + wallet pill — session state proof",
    run: async () => {
      const p = await newPage(browser, DESKTOP, { signedIn: true, walletConnected: true });
      await gotoAndSettle(p, "/browse");
      // Crop to top 200px (navbar area) for a punchy detail shot.
      await p.screenshot({
        path: path.join(OUT, "10-signed-in-navbar.png"),
        clip: { x: 0, y: 0, width: 1440 * 2, height: 220 * 2 },
        captureBeyondViewport: false,
      });
      console.log(`  ✓ 10-signed-in-navbar.png  (cropped)`);
      await p.close();
    },
  },
  {
    name: "11-faq-page",
    desc: "FAQ accordion — content depth shot",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/faq", { delay: 1500 });
      await shoot(p, "11-faq-page");
      await p.close();
    },
  },
  {
    name: "12-about-page",
    desc: "About — values + team + stats",
    run: async () => {
      const p = await newPage(browser, DESKTOP);
      await gotoAndSettle(p, "/about", { delay: 1500 });
      await shoot(p, "12-about-page", { fullPage: true });
      await p.close();
    },
  },

  // ─── Mobile ────────────────────────────────────────────────────────────
  {
    name: "20-artist-hero-mobile",
    desc: "Artist hero on iPhone 14-class viewport",
    run: async () => {
      const p = await newPage(browser, MOBILE);
      await gotoAndSettle(p, "/");
      await shoot(p, "20-artist-hero-mobile");
      await p.close();
    },
  },
  {
    name: "21-mobile-drawer",
    desc: "Mobile drawer open — proves responsive nav",
    run: async () => {
      const p = await newPage(browser, MOBILE);
      await gotoAndSettle(p, "/");
      // Tap hamburger by aria-label.
      await p.evaluate(() => {
        document.querySelector('[aria-label="Open menu"]')?.click();
      });
      await sleep(700);
      await shoot(p, "21-mobile-drawer");
      await p.close();
    },
  },
  {
    name: "22-browse-mobile",
    desc: "Browse marketplace on mobile",
    run: async () => {
      const p = await newPage(browser, MOBILE);
      await gotoAndSettle(p, "/browse", { delay: 2000 });
      await shoot(p, "22-browse-mobile", { fullPage: true });
      await p.close();
    },
  },
  {
    name: "23-auth-modal-mobile",
    desc: "Sign-up modal on mobile",
    run: async () => {
      const p = await newPage(browser, MOBILE);
      await gotoAndSettle(p, "/");
      // Open mobile drawer, then click Sign up.
      await p.evaluate(() => document.querySelector('[aria-label="Open menu"]')?.click());
      await sleep(500);
      await clickByText(p, "Sign up");
      await sleep(700);
      await shoot(p, "23-auth-modal-mobile");
      await p.close();
    },
  },
];

console.log(`Capturing ${tasks.length} shots…\n`);
for (const t of tasks) {
  try {
    console.log(`▸ ${t.name} — ${t.desc}`);
    await t.run();
  } catch (err) {
    console.error(`  ✗ ${t.name} failed: ${err.message}`);
  }
}

await browser.close();
console.log(`\n✅ Done. Files written to: ${OUT}`);
