"use strict";
/* Browser demo version of server/src/util/crypto.js. Same exports. NOT for production: the real server uses scrypt and Node's HMAC. */
const { sha256, hmac, hex } = require("./sha256");
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function rnd(n) { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] % n; }
function salt() { let s = ""; for (let i = 0; i < 16; i++) s += ALPHA[rnd(ALPHA.length)]; return s; }
async function hashPassword(pw) { const s = salt(); return ["demo", s, hex(sha256(s + ":" + pw))].join("$"); }
async function verifyPassword(pw, stored) { const p = String(stored || "").split("$"); return p.length === 3 && p[0] === "demo" && hex(sha256(p[1] + ":" + pw)) === p[2]; }
async function fakeVerify() { return false; }
const b64u = (s) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return atob(s); };
const utf8b64u = (str) => b64u(String.fromCharCode.apply(null, Array.from(new TextEncoder().encode(str))));
const sig = (body, secret) => b64u(String.fromCharCode.apply(null, Array.from(hmac(secret, body))));
function sign(payload, secret) { const body = utf8b64u(JSON.stringify(payload)); return body + "." + sig(body, secret); }
function verify(token, secret, nowMs) {
  const parts = String(token || "").split("."); if (parts.length !== 2 || sig(parts[0], secret) !== parts[1]) return null;
  let p; try { const bin = unb64u(parts[0]); p = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))); } catch (e) { return null; }
  if (!p || typeof p.exp !== "number" || p.exp * 1000 < (nowMs == null ? Date.now() : nowMs)) return null;
  return p;
}
function safeEqual(a, b) { return String(a) === String(b); }
function randomCode(prefix, groups, size) { const g = []; for (let i = 0; i < (groups || 2); i++) { let s = ""; for (let j = 0; j < (size || 4); j++) s += ALPHA[rnd(ALPHA.length)]; g.push(s); } return [prefix || "OSI"].concat(g).join("-"); }
function randomPassword() { let s = ""; for (let i = 0; i < 14; i++) s += ALPHA[rnd(ALPHA.length)]; return s; }
module.exports = { hashPassword, verifyPassword, fakeVerify, sign, verify, safeEqual, randomCode, randomPassword };
