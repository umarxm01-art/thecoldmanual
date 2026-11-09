"use strict";
const fs = require("fs"), crypto = require("crypto");

/* Loads the gated course content and derives what the server needs from it. */
function loadContent(file) {
  const j = JSON.parse(fs.readFileSync(file, "utf8")), qa = j.QA || [];
  delete j.QA; /* the answer bank stays on the server: members get one answer at a time */
  const raw = JSON.stringify(j);
  const lessonIds = j.L.map((l) => l.id), lessonTitles = {}; j.L.forEach((l) => { lessonTitles[l.id] = l.t; });
  const scenarios = j.RP.map((s) => { const t = {}; s.beats.forEach((b) => b.opts.forEach((o) => { t[o.tag] = 1; })); return { id: s.id, title: s.title, tags: Object.keys(t) }; });
  const catalog = { lessonIds, lessonTitles, scenarios, track: j.TRACK && j.TRACK.days ? { days: j.TRACK.days, checkpoints: j.TRACK.checkpoints } : null };
  const meta = {
    counts: { programs: j.P.length, lessons: j.L.length, playbooks: j.PB.length, objections: j.OBJ.length, tools: (j.TOOLS || []).length, niches: j.NICHES.length, scenarios: j.RP.length },
    programs: j.P.map((p) => ({ id: p.id, title: p.title, sub: p.sub, blurb: p.blurb, lessons: j.L.filter((l) => l.p === p.id).length })),
    tools: (j.TOOLS || []).map((t) => ({ title: t.title, desc: t.desc }))
  };
  return { raw, etag: '"' + crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16) + '"', catalog, meta, qa, lessons: j.L };
}
module.exports = { loadContent };
