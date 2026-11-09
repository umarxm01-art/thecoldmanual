"use strict";
/* Framework-free request dispatcher. The Express adapter and the test adapter both call handle(). */
const routes = require("../handlers/index");
const { HttpError, parseCookies, serializeCookie, createLimiter } = require("../util/misc");
const { verify } = require("../util/crypto");

const compiled = routes.map((r) => ({ r, parts: r.p.split("/").filter(Boolean) }));
function match(path) {
  const segs = path.split("/").filter(Boolean), hits = [];
  for (const c of compiled) {
    if (c.parts.length !== segs.length) continue;
    const params = {}; let ok = true;
    for (let i = 0; i < segs.length; i++) {
      if (c.parts[i][0] === ":") { try { params[c.parts[i].slice(1)] = decodeURIComponent(segs[i]); } catch (e) { ok = false; break; } }
      else if (c.parts[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) hits.push({ route: c.r, params });
  }
  return hits;
}

function securityHeaders(cfg) {
  const h = {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com; media-src 'self' blob:; frame-src https://www.youtube-nocookie.com; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=()", "Cross-Origin-Opener-Policy": "same-origin"
  };
  if (cfg.prod) h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return h;
}

function createDispatcher({ db, cfg, content, now }) {
  now = now || Date.now; const limit = createLimiter(now), base = securityHeaders(cfg);

  async function authenticate(headers) {
    const tok = parseCookies(headers.cookie)[cfg.cookieName]; if (!tok) return null;
    const p = verify(tok, cfg.secret, now()); if (!p) return null;
    const u = await db.getUser(p.sub); if (!u || u.disabled || (u.tokenVersion || 0) !== p.tv) return null;
    return u;
  }
  function reply(status, body, extra) { return Object.assign({ status, headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, base), body: JSON.stringify(body), cookies: [] }, extra); }

  /* req: { method, url, headers (lower-case keys), ip, body (string or null) } */
  async function handle(req) {
    const u = new URL(req.url, "http://x"), path = u.pathname.replace(/\/+$/, "") || "/";
    if (!path.startsWith("/api/")) return null;
    try {
      const gen = limit("all:" + req.ip, 10 * 60 * 1000, 1200);
      if (!gen.ok) throw new HttpError(429, "Too many requests. Wait a moment and try again.", { retryAfter: gen.retryAfter });
      const hits = match(path); if (!hits.length) throw new HttpError(404, "Not found.");
      const hit = hits.filter((h) => h.route.m === req.method)[0];
      if (!hit) throw new HttpError(405, "Method not allowed.");
      const r = hit.route;
      if (req.method !== "GET" && req.method !== "HEAD" && !r.noCsrf && req.headers["x-requested-with"] !== "osi") throw new HttpError(403, "Request blocked.");
      if (r.limit) { const l = limit(r.limit.name + ":" + req.ip, r.limit.windowMs, r.limit.max); if (!l.ok) throw new HttpError(429, "Too many attempts. Try again in " + Math.ceil(l.retryAfter / 60) + " minute(s).", { retryAfter: l.retryAfter }); }
      let body = null;
      if (req.body) { try { body = JSON.parse(req.body); } catch (e) { throw new HttpError(400, "Invalid JSON."); } if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Send a JSON object."); }
      let user = null;
      if (r.a !== "none") {
        user = await authenticate(req.headers);
        if (!user) throw new HttpError(401, "Please log in.");
        if (r.a === "admin" && user.role !== "admin") throw new HttpError(403, "Admins only.");
        if (r.a === "manager" && user.role !== "manager") throw new HttpError(403, "Team managers only.");
      }
      const ctx = { db, cfg, content, now, ip: req.ip, headers: req.headers, params: hit.params, query: Object.fromEntries(u.searchParams), body, user };
      const out = (await r.h(ctx)) || {};
      const cookies = (out.cookies || []).map((c) => serializeCookie(c.name, c.value, { maxAge: c.maxAge, secure: cfg.prod }));
      if (out.raw) {
        const h = Object.assign({ "Content-Type": out.raw.type, "Cache-Control": "private, no-cache" }, base);
        if (out.raw.filename) h["Content-Disposition"] = 'attachment; filename="' + out.raw.filename + '"';
        if (out.raw.etag) { h.ETag = out.raw.etag; if (req.headers["if-none-match"] === out.raw.etag) return { status: 304, headers: h, body: "", cookies }; }
        return { status: 200, headers: h, body: out.raw.text, cookies };
      }
      return reply(out.status || 200, out.body == null ? {} : out.body, { cookies });
    } catch (e) {
      if (e instanceof HttpError) { const x = reply(e.status, { error: e.message }); if (e.extra && e.extra.retryAfter) x.headers["Retry-After"] = String(e.extra.retryAfter); return x; }
      console.error("[api] " + req.method + " " + path + ":", e && e.stack ? e.stack : e);
      return reply(500, { error: "Something went wrong on our side. Try again." });
    }
  }
  return { handle, securityHeaders: base };
}
module.exports = { createDispatcher, securityHeaders };
