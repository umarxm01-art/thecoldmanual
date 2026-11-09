"use strict";
const crypto = require("crypto");

const N = 16384, KEYLEN = 64;
function scrypt(pw, salt, n) {
  return new Promise((res, rej) => crypto.scrypt(pw, salt, KEYLEN, { N: n, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));
}
async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, N);
  return ["scrypt", N, salt.toString("base64"), key.toString("base64")].join("$");
}
async function verifyPassword(pw, stored) {
  const p = String(stored || "").split("$");
  if (p.length !== 4 || p[0] !== "scrypt") return false;
  let key; try { key = await scrypt(pw, Buffer.from(p[2], "base64"), +p[1]); } catch (e) { return false; } /* a damaged stored hash fails the login instead of crashing it */
  const want = Buffer.from(p[3], "base64");
  return key.length === want.length && crypto.timingSafeEqual(key, want);
}
let DUMMY = null;
/* spend the same time when the user does not exist, so login timing does not reveal accounts */
async function fakeVerify(pw) { DUMMY = DUMMY || (await hashPassword("dummy-password")); await verifyPassword(pw, DUMMY); return false; }

function b64u(buf) { return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function sign(payload, secret) {
  const body = b64u(JSON.stringify(payload));
  return body + "." + b64u(crypto.createHmac("sha256", secret).update(body).digest());
}
function verify(token, secret, nowMs) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const want = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  let got; try { got = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64"); } catch (e) { return null; }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  let p; try { p = JSON.parse(Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch (e) { return null; }
  if (!p || typeof p.exp !== "number" || p.exp * 1000 < (nowMs == null ? Date.now() : nowMs)) return null;
  return p;
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(prefix, groups, size) {
  const g = []; for (let i = 0; i < (groups || 2); i++) { let s = ""; for (let j = 0; j < (size || 4); j++) s += ALPHA[crypto.randomInt(ALPHA.length)]; g.push(s); }
  return [prefix || "OSI"].concat(g).join("-");
}
function randomPassword() { let s = ""; for (let i = 0; i < 14; i++) s += ALPHA[crypto.randomInt(ALPHA.length)]; return s; }

module.exports = { hashPassword, verifyPassword, fakeVerify, sign, verify, safeEqual, randomCode, randomPassword };
