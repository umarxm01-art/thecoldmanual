"use strict";
const fs = require("fs"), path = require("path");

function loadEnvFile(file) {
  try {
    fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((l) => {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m || process.env[m[1]] !== undefined) return;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    });
  } catch (e) { /* no .env file is fine */ }
}

function buildAi(env) {
  const provider = String(env.AI_PROVIDER || "").toLowerCase(), apiKey = env.AI_API_KEY || "";
  const model = env.AI_MODEL || (provider === "anthropic" ? "claude-haiku-5-5" : "");
  const live = (provider === "anthropic" || provider === "openai") && !!apiKey && !!model;
  return { enabled: live || provider === "sample", provider, apiKey, model, dailyLimit: +env.AI_DAILY_LIMIT || 5, monthlyLimit: +env.AI_MONTHLY_LIMIT || 30 };
}

function buildConfig(env) {
  env = env || process.env;
  const prod = env.NODE_ENV === "production";
  const cfg = {
    prod,
    port: +env.PORT || 4000,
    mongoUri: env.MONGODB_URI || "mongodb://127.0.0.1:27017/outbound-si",
    secret: env.SESSION_SECRET || "",
    cookieName: "osi_token",
    cookieDays: 30,
    webhookSecret: env.WEBHOOK_SECRET || "",
    adminEmail: (env.ADMIN_EMAIL || "").toLowerCase(),
    adminPassword: env.ADMIN_PASSWORD || "",
    previewCode: env.PREVIEW_CODE || "",
    trustProxy: env.TRUST_PROXY === "1" || env.TRUST_PROXY === "true",
    contentPath: env.CONTENT_PATH || path.join(__dirname, "..", "content", "content.json"),
    clientDist: env.CLIENT_DIST || path.join(__dirname, "..", "..", "client", "dist"),
    maxKvKeys: 200, maxKvBytes: 1024 * 1024,
    /* AI help (review, typed roleplay, scorecard, offer, lead check, replies). Off until AI_PROVIDER and AI_API_KEY are set. */
    ai: buildAi(env),
    /* upsells: set these in .env */
    offers: { call: { enabled: env.CALL_ENABLED !== "0", price: env.CALL_PRICE || "Rs 10,000", minutes: +env.CALL_MINUTES || 60, payUrl: env.CALL_PAY_URL || "", bookUrl: env.CALL_BOOK_URL || "" } }
  };
  if (prod && cfg.secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 random characters in production.");
  if (!cfg.secret) cfg.secret = "dev-only-secret-change-me-dev-only-secret";
  return cfg;
}
module.exports = { buildConfig, loadEnvFile };
