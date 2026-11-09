"use strict";
/* Plain Node http adapter. Used by the tests and by `npm run dev:memory`; production uses the Express adapter. */
const http = require("http"), fs = require("fs");
const { createDispatcher } = require("./dispatch");
const { resolveStatic } = require("./static");

function createNodeServer(opts) {
  const d = createDispatcher(opts), dist = require("path").resolve(opts.cfg.clientDist);
  return http.createServer((req, res) => {
    const chunks = []; let size = 0, dead = false;
    req.on("data", (c) => { size += c.length; if (size > 1200 * 1024) { dead = true; res.writeHead(413); res.end(); req.destroy(); } else chunks.push(c); });
    req.on("end", async () => {
      if (dead) return;
      const ip = opts.cfg.trustProxy && req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0].trim() : req.socket.remoteAddress;
      const r = await d.handle({ method: req.method, url: req.url, headers: req.headers, ip, body: chunks.length ? Buffer.concat(chunks).toString("utf8") : null });
      if (r) { const h = Object.assign({}, r.headers); if (r.cookies && r.cookies.length) h["Set-Cookie"] = r.cookies; res.writeHead(r.status, h); return res.end(r.body); }
      const s = resolveStatic(dist, new URL(req.url, "http://x").pathname);
      const hdr = d.securityHeaders;
      if (!s) { res.writeHead(404, Object.assign({ "Content-Type": "text/plain" }, hdr)); return res.end("Not found"); }
      if (s.redirect) { res.writeHead(302, Object.assign({ Location: s.redirect }, hdr)); return res.end(); }
      if (!s.file) { res.writeHead(s.status || 404, hdr); return res.end(); }
      res.writeHead(200, Object.assign({}, hdr, s.headers)); fs.createReadStream(s.file).pipe(res);
    });
  });
}
module.exports = { createNodeServer };
