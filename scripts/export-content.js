"use strict";
/* Builds server/content/content.json from the course data files. Run: npm run content */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const files = { code: ["core.js"], data: ["programs", "lessons-1", "lessons-2", "lessons-3", "lessons-4", "lessons-5", "lessons-6", "lessons-7", "lessons-8", "lessons-9", "lessons-10", "lessons-11", "data-1", "data-2", "extras-roleplay", "extras-niches", "extras-niches-2", "extras-prompts", "extras-delivery", "extras-drills", "extras-track"] };

const sandbox = { console, setTimeout, clearTimeout }; sandbox.window = sandbox; sandbox.document = {}; sandbox.OSI_CFG = {}; sandbox.navigator = {};
vm.createContext(sandbox);
function run(file) { vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file }); }
run(path.join(root, "legacy", "code", "core.js"));
files.data.forEach((f) => run(path.join(root, "legacy", "data", f + ".js")));
run(path.join(root, "legacy", "code", "tools.js")); /* registers tool titles; the tool code itself ships in the client */
const O = sandbox.OSI;

O.L.sort(O.lessonSort);
const ids = {}; let bad = [];
O.L.forEach((l) => { if (ids[l.id]) bad.push("duplicate lesson " + l.id); ids[l.id] = 1; });
O.TOOLS.forEach((t) => t.lessons.forEach((i) => { if (!ids[i]) bad.push("tool " + t.key + " links to missing lesson " + i); }));
const SK = require("fs").readFileSync(path.join(root, "shared", "skills.mjs"), "utf8"), mapped = SK.match(/"\d+\.\d+"/g) || [];
mapped.forEach((m) => { if (!ids[m.replace(/"/g, "")]) bad.push("skill map links to missing lesson " + m); });
const PL = require(path.join(root, "content-src", "placement.js"));
if (PL.length !== 18) bad.push("placement should have 18 questions, has " + PL.length);
PL.forEach((p, i) => { if (!p.o || p.a < 0 || p.a >= p.o.length) bad.push("placement " + i + " has a bad answer index"); });
(O.DRILLS || []).forEach((d) => { if (d.lesson && !ids[d.lesson]) bad.push("drill " + d.id + " links to missing lesson " + d.lesson); if (!d.line || !d.secs) bad.push("drill " + d.id + " needs a line and secs"); });
const tk = new Set(O.TOOLS.map((t) => t.key)), dk = new Set((O.DRILLS || []).map((d) => d.id)), rk = new Set((O.RP || []).map((r) => r.id));
if (!O.TRACK || O.TRACK.days.length !== 30) bad.push("the 30-day track needs 30 days");
(O.TRACK ? O.TRACK.days : []).forEach((d, i) => { if (d.d !== i + 1) bad.push("track day " + (i + 1) + " is out of order"); (d.tasks || []).forEach((t) => {
  if (t.k === "l" && !ids[t.id]) bad.push("track day " + d.d + " links to missing lesson " + t.id);
  if (t.k === "t" && !tk.has(String(O.TOOL_ALIAS[t.id] || t.id).split(/[./]/)[0])) bad.push("track day " + d.d + " links to missing tool " + t.id);
  if (t.k === "d" && !dk.has(t.id)) bad.push("track day " + d.d + " links to missing drill " + t.id);
  if (t.k === "r" && !rk.has(t.id)) bad.push("track day " + d.d + " links to missing roleplay " + t.id); }); });
if (!O.DLV || !O.DLV.services.length || !O.DLV.templates.length) bad.push("delivery kit data is missing");
O.L.forEach((l) => { const k = String(O.TOOL_ALIAS[l.tool] || l.tool || "").split("/")[0]; if (l.tool && k !== "#" && !O.TOOLS.some((t) => t.key === k)) bad.push("lesson " + l.id + " links to missing tool " + l.tool); });
let QA = []; try { QA = require(path.join(root, "content-src", "answers.js")).build(O); } catch (e) { bad.push(e.message); }
if (bad.length) { console.error("Content problems:\n - " + bad.join("\n - ")); process.exit(1); }

const out = { QA: QA, P: O.P, L: O.L, PB: O.PB, PB_CATS: O.PB_CATS, OBJ: O.OBJ, OBJ_CATS: O.OBJ_CATS, CAD: O.CAD, SC: O.SC, SCR: O.SCR, CAL: O.CAL, RP: O.RP, RP_TAGS: O.RP_TAGS, NICHES: O.NICHES, NICHE_CATS: O.NICHE_CATS, PROMPTS: O.PROMPTS, PROMPT_RULES: O.PROMPT_RULES, DLV: O.DLV, DRILLS: O.DRILLS, CLEAR: O.CLEAR, CLEAR_FLAGS: O.CLEAR_FLAGS, SOUNDS: O.SOUNDS, TRACK: O.TRACK, PL, TOOLS: O.TOOLS.map((t) => ({ key: t.key, title: t.title, desc: t.desc, lessons: t.lessons })) };
["CAL", "OBJ_CATS", "SCR", "SC", "CAD"].forEach((k) => { if (out[k] == null) { console.error("Missing " + k); process.exit(1); } });
const dest = path.join(root, "server", "content", "content.json");
fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, JSON.stringify(out));
console.log("answer bank: " + QA.length + " answers");
console.log("content.json: " + out.P.length + " programs, " + out.L.length + " lessons, " + out.PB.length + " playbooks, " + out.OBJ.length + " objections, " + out.RP.length + " scenarios, " + out.NICHES.length + " niches, " + out.PL.length + " placement questions, " + out.DRILLS.length + " drills, " + out.DLV.templates.length + " delivery templates, " + out.TOOLS.length + " tools (" + Math.round(fs.statSync(dest).size / 1024) + " KB)");
