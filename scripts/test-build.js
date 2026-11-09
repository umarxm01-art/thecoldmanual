"use strict";
/* Builds the client WITHOUT Vite, using esbuild, into client/dist (same layout Vite produces). Used for tests in places where Vite cannot be installed.
   Usage: NODE_PATH=<global node_modules> node scripts/test-build.js */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const root = path.join(__dirname, "..");
function sh(c) { cp.execSync(c, { cwd: root, stdio: "inherit" }); }
sh("node scripts/export-content.js && node scripts/build-legacy.js && node scripts/build-site.js");
let esbuild; try { esbuild = require("esbuild"); } catch (e) { esbuild = require(process.env.ESBUILD_PATH || "/opt/npm-tools/node_modules/esbuild"); }
const dist = path.join(root, "client", "dist");
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
esbuild.buildSync({ entryPoints: [path.join(root, "client", "src", "main.jsx")], bundle: true, outdir: path.join(dist, "assets"), entryNames: "main", format: "esm", jsx: "automatic", minify: true, loader: { ".woff": "file" }, define: { "process.env.NODE_ENV": '"production"' }, nodePaths: (process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean), logLevel: "warning" });
(function copy(src, dst) { fs.mkdirSync(dst, { recursive: true }); fs.readdirSync(src, { withFileTypes: true }).forEach((e) => { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d); }); })(path.join(root, "client", "public"), dist);
let html = fs.readFileSync(path.join(root, "client", "index.html"), "utf8");
html = html.replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/app/assets/main.css">\n<script type="module" src="/app/assets/main.js"></script>');
fs.writeFileSync(path.join(dist, "index.html"), html);
console.log("client built to client/dist (esbuild)");
