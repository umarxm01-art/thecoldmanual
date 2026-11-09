"use strict";
/* Express adapter: same dispatcher and static resolver as the test server, with Express handling the socket, body size and proxy headers. */
const express = require("express");
const path = require("path");
const { createDispatcher } = require("./http/dispatch");
const { resolveStatic } = require("./http/static");

function createApp({ db, cfg, content }) {
  const app = express(), d = createDispatcher({ db, cfg, content }), dist = path.resolve(cfg.clientDist);
  app.disable("x-powered-by");
  if (cfg.trustProxy) app.set("trust proxy", 1);
  app.use(express.text({ type: () => true, limit: "1200kb" }));
  app.use(async (req, res, next) => {
    try {
      const r = await d.handle({ method: req.method, url: req.originalUrl, headers: req.headers, ip: req.ip, body: typeof req.body === "string" && req.body ? req.body : null });
      if (!r) return next();
      Object.keys(r.headers).forEach((k) => res.setHeader(k, r.headers[k]));
      if (r.cookies && r.cookies.length) res.setHeader("Set-Cookie", r.cookies);
      res.status(r.status).send(r.body);
    } catch (e) { next(e); }
  });
  app.use((req, res) => {
    const s = resolveStatic(dist, req.path);
    Object.keys(d.securityHeaders).forEach((k) => res.setHeader(k, d.securityHeaders[k]));
    if (!s) return res.status(404).type("text/plain").send("Not found");
    if (s.redirect) return res.redirect(302, s.redirect);
    if (!s.file) return res.sendStatus(s.status || 404);
    Object.keys(s.headers).forEach((k) => res.setHeader(k, s.headers[k]));
    res.sendFile(s.file, { dotfiles: "deny" });
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    Object.keys(d.securityHeaders).forEach((k) => res.setHeader(k, d.securityHeaders[k]));
    res.setHeader("Cache-Control", "no-store");
    /* body parser errors (too large, bad encoding) are the client's fault: answer with their status, so the app stops retrying */
    const status = err && (err.status || err.statusCode);
    if (status >= 400 && status < 500) return res.status(status).json({ error: status === 413 ? "That entry is too large." : "The request could not be read." });
    console.error("[server]", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Something went wrong on our side. Try again." });
  });
  return app;
}
module.exports = { createApp };
