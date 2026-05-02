import "dotenv/config";
import { createHmac } from "crypto";
import express from "express";
import puppeteer, { type Browser } from "puppeteer";
import { type PnlCardPayload, renderPnlCardHtmlDocument } from "./pnlCard.js";

const MAX_AGE_SECONDS = 86400;
const CARD_WIDTH = 392;
const PORT = Number(process.env.PORT ?? 5000);

function log(tag: string, msg: string, extra?: unknown) {
  const ts = new Date().toISOString();
  if (extra !== undefined) {
    console.log(`[${ts}] [${tag}] ${msg}`, extra);
  } else {
    console.log(`[${ts}] [${tag}] ${msg}`);
  }
}

// ─── Browser singleton ────────────────────────────────────────────────────────
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    log("browser", "launching Chromium...");
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    (await browserPromise);
    log("browser", "Chromium ready");
  }
  return browserPromise;
}

// ─── Telegram initData verification ──────────────────────────────────────────
function verifyInitData(initData: string): string | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  const userParam = params.get("user");
  if (!userParam) return null;

  try {
    const user = JSON.parse(userParam);
    return String(user.id);
  } catch {
    return null;
  }
}

// ─── Payload validation ───────────────────────────────────────────────────────
function isValidCardPayload(value: unknown): value is PnlCardPayload {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.pnl === "number" && Number.isFinite(card.pnl) &&
    typeof card.pnlPercent === "number" && Number.isFinite(card.pnlPercent) &&
    typeof card.stake === "number" && Number.isFinite(card.stake) &&
    typeof card.username === "string" && card.username.trim().length > 0
  );
}

// ─── Puppeteer render ─────────────────────────────────────────────────────────
async function renderCardImage(card: PnlCardPayload): Promise<Buffer> {
  log("render", `starting render for user="${card.username}" pnl=${card.pnl}`);
  const t0 = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: CARD_WIDTH + 32, height: 760, deviceScaleFactor: 2 });
    await page.setContent(renderPnlCardHtmlDocument(card), { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    const root = await page.$("#card-root");
    if (!root) throw new Error("Card root not found");
    const image = await root.screenshot({ type: "png" });
    const buf = Buffer.isBuffer(image) ? image : Buffer.from(image);
    log("render", `done in ${Date.now() - t0}ms (${buf.length} bytes)`);
    return buf;
  } finally {
    await page.close();
  }
}

// ─── Background render + Telegram send ───────────────────────────────────────
async function renderAndSend(
  card: PnlCardPayload,
  chatId: string,
  botToken: string,
  caption: string | undefined,
): Promise<void> {
  let imageBuffer: Buffer;
  try {
    imageBuffer = await renderCardImage(card);
  } catch (err) {
    log("render", "FAILED", err);
    return;
  }

  log("telegram", `sending photo to chat_id=${chatId}`);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }), "pnl-card.png");
  if (caption) form.append("caption", caption);

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const tgJson = await tgRes.json() as { ok: boolean; description?: string };
  if (tgJson.ok) {
    log("telegram", `photo delivered to chat_id=${chatId}`);
  } else {
    log("telegram", `sendPhoto FAILED: ${tgJson.description}`);
  }
}

// ─── Express server ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method !== "OPTIONS") {
    log("http", `${req.method} ${req.path}`);
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: Math.floor(process.uptime()), browser: browserPromise !== null });
});

app.options("/send-card", (_req, res) => { res.sendStatus(200); });

app.post("/send-card", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { initData, card, caption } = body;

  if (typeof initData !== "string" || !initData) {
    log("send-card", "rejected: missing initData");
    res.status(400).json({ error: "initData required" });
    return;
  }
  if (!isValidCardPayload(card)) {
    log("send-card", "rejected: invalid card payload");
    res.status(400).json({ error: "card payload required" });
    return;
  }

  const chatId = verifyInitData(initData);
  if (!chatId) {
    log("send-card", "rejected: invalid or expired initData");
    res.status(401).json({ error: "Invalid or expired initData" });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    log("send-card", "rejected: bot token not configured");
    res.status(500).json({ error: "Bot token not configured" });
    return;
  }

  log("send-card", `accepted for chat_id=${chatId} user="${(card as PnlCardPayload).username}" pnl=${(card as PnlCardPayload).pnl}`);
  res.status(200).json({ ok: true });

  renderAndSend(card, chatId, botToken, typeof caption === "string" ? caption : undefined)
    .catch((err) => log("send-card", "background task FAILED", err));
});

app.listen(PORT, () => {
  log("server", `pnl-card-service listening on port ${PORT}`);
});
