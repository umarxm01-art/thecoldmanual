/* Connects the React app to the course code in legacy.js (loaded as a classic script before this module). */
import { createStore } from "./store.js";

export const store = createStore();
export const O = () => window.OSI;
const ARRAYS = ["P", "L", "PB", "PB_CATS", "OBJ", "CAD", "SC", "SCR", "CAL", "OBJ_CATS", "RP", "NICHES", "NICHE_CATS", "PROMPTS", "PROMPT_RULES", "DRILLS", "CLEAR", "CLEAR_FLAGS", "SOUNDS"];

export function installStore() { window.OSI.store = store; }

/* course content comes from the server after login and is put where the course code expects it */
export function applyContent(c) {
  const o = window.OSI;
  ARRAYS.forEach((k) => { o[k] = c[k] || []; });
  o.RP_TAGS = c.RP_TAGS || {};
  o.DLV = c.DLV || { services: [], templates: [], health: [] };
  o.TRACK = c.TRACK || { title: "First client in 30 days", days: [], phases: [], checkpoints: [] };
  o.L.sort(o.lessonSort || ((a, b) => a.p - b.p || a.n - b.n));
  o.PL = c.PL || [];
}

export function buildCatalog() {
  const o = window.OSI, titles = {};
  o.L.forEach((l) => { titles[l.id] = l.t; });
  return {
    lessonIds: o.L.map((l) => l.id), lessonTitles: titles, rotate: Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000), track: o.TRACK && o.TRACK.days && o.TRACK.days.length ? o.TRACK : null,
    scenarios: o.RP.map((s) => { const t = {}; s.beats.forEach((b) => b.opts.forEach((x) => { t[x.tag] = 1; })); return { id: s.id, title: s.title, tags: Object.keys(t) }; })
  };
}
