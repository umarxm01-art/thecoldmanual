"use strict";
class HttpError extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra || null; } }

function parseCookies(header) {
  const out = {}; String(header || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i < 1) return; const k = p.slice(0, i).trim(); try { out[k] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* ignore bad cookie */ } });
  return out;
}
function serializeCookie(name, value, o) {
  o = o || {}; let s = name + "=" + encodeURIComponent(value) + "; Path=" + (o.path || "/");
  if (o.maxAge != null) s += "; Max-Age=" + Math.floor(o.maxAge);
  if (o.httpOnly !== false) s += "; HttpOnly";
  if (o.secure) s += "; Secure";
  s += "; SameSite=" + (o.sameSite || "Lax");
  return s;
}
function str(v, max) { return typeof v === "string" ? v.trim().slice(0, max || 200) : ""; }
function isEmail(s) { return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
const KV_KEY = /^[a-z0-9_]{1,40}$/;
function intIn(v, min, max, dflt) { const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v; return Number.isInteger(n) && n >= min && n <= max ? n : dflt; }

/* sliding-window limiter (single process). Behind several instances, use a shared store instead. */
function createLimiter(now) {
  const hits = new Map(); now = now || Date.now;
  return function hit(key, windowMs, max) {
    const t = now(), arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (arr.length >= max) { hits.set(key, arr); return { ok: false, retryAfter: Math.ceil((windowMs - (t - arr[0])) / 1000) }; }
    arr.push(t); hits.set(key, arr);
    if (hits.size > 20000) for (const [k, v] of hits) if (!v.length || t - v[v.length - 1] > windowMs) hits.delete(k);
    return { ok: true };
  };
}

function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; /* stop spreadsheet formula injection */
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCsv(rows) { return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n"; }

module.exports = { HttpError, parseCookies, serializeCookie, str, isEmail, KV_KEY, intIn, createLimiter, toCsv };
