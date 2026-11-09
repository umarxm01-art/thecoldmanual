"use strict";
const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), os = require("os"), path = require("path");
const { resolveStatic } = require("../src/http/static");
const dist = fs.mkdtempSync(path.join(os.tmpdir(), "osi-dist-")), w = (f, c) => { fs.mkdirSync(path.dirname(path.join(dist, f)), { recursive: true }); fs.writeFileSync(path.join(dist, f), c); };
w("index.html", "app"); w("assets/a.js", "x"); w("site/index.html", "landing"); w("site/css/a.css", "c"); w("fonts/f.woff", "f"); fs.writeFileSync(path.join(path.dirname(dist), "secret.txt"), "no");
test("static routes", () => {
  assert.equal(resolveStatic(dist, "/").redirect, "/site/");
  assert.equal(resolveStatic(dist, "/app").redirect, "/app/");
  assert.ok(resolveStatic(dist, "/site/").file.endsWith(path.join("site", "index.html")));
  assert.ok(resolveStatic(dist, "/app/").file.endsWith("index.html") && !resolveStatic(dist, "/app/").file.includes("site"));
  assert.ok(resolveStatic(dist, "/app/#/l/1.1".split("#")[0]).file);
  assert.ok(resolveStatic(dist, "/app/team/members").file.endsWith("index.html"), "client-side route falls back to the app");
  assert.match(resolveStatic(dist, "/app/assets/a.js").headers["Cache-Control"], /immutable/);
  assert.equal(resolveStatic(dist, "/app/fonts/f.woff").headers["Content-Type"], "font/woff");
  assert.equal(resolveStatic(dist, "/app/missing.js").status, 404);
  assert.equal(resolveStatic(dist, "/nothing"), null);
});
test("static: no path traversal", () => {
  for (const p of ["/app/../../secret.txt", "/app/..%2f..%2fsecret.txt", "/site/../../secret.txt", "/site/%2e%2e/%2e%2e/secret.txt", "/app/a%00.js"]) { const r = resolveStatic(dist, p); assert.ok(!r || !r.file, p); }
});
