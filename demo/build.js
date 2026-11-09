"use strict";
/* Builds a browser-only demo into demo/out/ (run after `npm run build`): node demo/build.js
   Needs esbuild (npm i -D esbuild, or the copy Vite installs). */
const fs = require("fs"), path = require("path");
const esbuild = require("esbuild");
const root = path.join(__dirname, ".."), out = path.join(__dirname, "out"), pub = path.join(root, "client", "public");
const S = (f) => path.join(__dirname, "shims", f);
const shim = { name: "demo-shims", setup(b) {
  b.onResolve({ filter: /^crypto$/ }, () => ({ path: S("crypto-node.js") }));
  b.onResolve({ filter: /^(fs|http|https|os)$/ }, () => ({ path: S("empty.js") }));
  b.onResolve({ filter: /^path$/ }, () => ({ path: S("path.js") }));
  b.onResolve({ filter: /util[\\/]crypto(\.js)?$/ }, (a) => (a.importer.includes(path.join("server", "src")) ? { path: S("util-crypto.js") } : undefined));
  b.onResolve({ filter: /db[\\/]mongo(\.js)?$/ }, () => ({ path: S("empty.js") }));
} };
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, "assets"), { recursive: true });
function copyDir(a, b) { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), t = path.join(b, f); if (fs.statSync(s).isDirectory()) copyDir(s, t); else fs.copyFileSync(s, t); } }
copyDir(pub, out);
esbuild.build({ entryPoints: [path.join(__dirname, "entry.js")], bundle: true, minify: true, format: "esm", platform: "browser", target: "es2020", outdir: path.join(out, "assets"), entryNames: "index",
  jsx: "automatic", loader: { ".js": "jsx" }, define: { "process.env.NODE_ENV": '"production"', "process.env": "{}", __dirname: '"/"', "require.main": "undefined" }, plugins: [shim], logLevel: "warning", nodePaths: (process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean) }).then(() => {
  const rel = (s) => s.replace(/(["'(])\/app\/(img|fonts)\//g, "$1$2/").replace(/"\/site\/(terms|privacy)\.html"/g, '"site/$1.html"').replace(/href="\/site\/"/g, 'href="site/index.html"').replace(/"\/site\/"/g, '"site/index.html"');
  const js = path.join(out, "assets", "index.js"); fs.writeFileSync(js, rel(fs.readFileSync(js, "utf8")));
  fs.writeFileSync(path.join(out, "app-fonts.css"), fs.readFileSync(path.join(out, "app-fonts.css"), "utf8").replace(/\/app\/fonts\//g, "fonts/"));
  let html = fs.readFileSync(path.join(root, "client", "index.html"), "utf8").replace(/\/app\//g, "").replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="assets/index.css">\n<script type="module" src="assets/index.js"></script>').replace("<title>The Cold Manual</title>", "<title>The Cold Manual Demo</title>");
  fs.writeFileSync(path.join(out, "index.html"), html);
  const sh = path.join(out, "site", "index.html"); fs.writeFileSync(sh, fs.readFileSync(sh, "utf8").replace(/href="\/app\/"/g, 'href="../index.html"').replace(/href="\/site\/"/g, 'href="index.html"'));
  console.log("demo built in demo/out");
}).catch((e) => { console.error(e); process.exit(1); });
