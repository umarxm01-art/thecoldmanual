"use strict";
/* Builds the public sales page into client/public/site/ . It gets counts and titles only, never lesson text. Run: npm run build:site */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), src = path.join(root, "site-src"), dest = path.join(root, "client", "public", "site");
const content = JSON.parse(fs.readFileSync(path.join(root, "server", "content", "content.json"), "utf8"));
const { loadContent } = require(path.join(root, "server", "src", "content.js"));
const meta = loadContent(path.join(root, "server", "content", "content.json")).meta;

fs.rmSync(dest, { recursive: true, force: true });
["css", "fonts", "img", "js"].forEach((d) => fs.mkdirSync(path.join(dest, d), { recursive: true }));
["css", "fonts", "img"].forEach((d) => fs.readdirSync(path.join(src, d)).forEach((f) => fs.copyFileSync(path.join(src, d, f), path.join(dest, d, f))));
fs.copyFileSync(path.join(root, "client", "src", "styles", "brand.css"), path.join(dest, "css", "brand.css")); /* one design system for the app and the sales page */
fs.copyFileSync(path.join(src, "theme.js"), path.join(dest, "theme.js"));
fs.copyFileSync(path.join(src, "config.js"), path.join(dest, "js", "config.js"));
fs.copyFileSync(path.join(src, "core.js"), path.join(dest, "js", "core.js"));
fs.writeFileSync(path.join(dest, "js", "meta.js"), "window.OSI_META = " + JSON.stringify(meta) + ";\n");
const method = fs.readFileSync(path.join(src, "method.txt"), "utf8").trim();
fs.writeFileSync(path.join(dest, "js", "landing.js"), fs.readFileSync(path.join(src, "landing.js"), "utf8").replace("/*METHOD*/", method));

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
html = html.replace(/<script src="js\/[^"]+"><\/script>\s*/g, "");
html = html.replace("</body>", '<script src="js/config.js"></script>\n<script src="js/core.js"></script>\n<script src="js/meta.js"></script>\n<script src="js/landing.js"></script>\n</body>');
html = html.replace(/href="app\.html"/g, 'href="/app/"').replace(/href="index\.html"/g, 'href="/site/"');
fs.writeFileSync(path.join(dest, "index.html"), html);
["terms.html", "privacy.html"].forEach((f) => fs.copyFileSync(path.join(src, f), path.join(dest, f)));
fs.copyFileSync(path.join(src, "legal.js"), path.join(dest, "js", "legal.js"));
/* the portal shows the same WhatsApp number and support email as the sales page */
const vm = require("vm"), sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(src, "config.js"), "utf8"), sb);
const sc = sb.window.OSI_CFG || {}, pc = { name: sc.name || "The Cold Manual", whatsapp: String(sc.whatsapp || "").replace(/\D/g, ""), supportEmail: sc.supportEmail || "", welcomeVideo: sc.welcomeVideo || "" };
fs.writeFileSync(path.join(root, "client", "public", "embed-config.js"), "/* Loaded before the course code. Marks the page as hosted by the React app. Written by scripts/build-site.js from site-src/config.js: edit that file, not this one. */\nwindow.OSI_EMBED = true;\nwindow.OSI_CFG = " + JSON.stringify(pc) + ";\n");
console.log("site built: " + meta.counts.lessons + " lessons, " + meta.counts.tools + " tools shown as counts");
void content;
