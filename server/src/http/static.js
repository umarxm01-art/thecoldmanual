"use strict";
const fs = require("fs"), path = require("path");

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".map": "application/json" };

/* Maps a URL to a file inside the built client:
     /            -> redirect to /site/ (the sales page)
     /site/...    -> dist/site/...
     /app/<file>  -> dist/<file>         (assets, fonts, images)
     /app/<route> -> dist/index.html     (the members app, client-side routing) */
function resolveStatic(dist, urlPath) {
  let p; try { p = decodeURIComponent(urlPath); } catch (e) { return { status: 400 }; }
  if (p.indexOf("\0") > -1) return { status: 400 };
  if (p === "/") return { redirect: "/site/" };
  let rel;
  if (p === "/app") return { redirect: "/app/" };
  if (p === "/site") return { redirect: "/site/" };
  if (p.startsWith("/site/")) { rel = p.endsWith("/") ? p.slice(1) + "index.html" : p.slice(1); }
  else if (p.startsWith("/app/")) { const r = p.slice(5); rel = /\.[a-z0-9]+$/i.test(r) ? r : "index.html"; }
  else return null;
  const file = path.resolve(dist, rel);
  if (file !== dist && !file.startsWith(dist + path.sep)) return { status: 404 };
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return { status: 404 };
  const ext = path.extname(file).toLowerCase();
  const immutable = p.startsWith("/app/assets/");
  return { file, headers: { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache" } };
}
module.exports = { resolveStatic, MIME };
