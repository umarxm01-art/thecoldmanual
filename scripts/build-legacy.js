"use strict";
/* Joins the course code into one classic script (client/public/legacy.js). It is not bundled, so the course code runs exactly as written. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const parts = ["core.js", "tools.js", "extras.js", "app.js"].map((f) => "/* ---- " + f + " ---- */\n" + fs.readFileSync(path.join(root, "legacy", "code", f), "utf8"));
const out = path.join(root, "client", "public", "legacy.js");
fs.writeFileSync(out, parts.join("\n;\n")); console.log("legacy.js " + Math.round(fs.statSync(out).size / 1024) + " KB");
