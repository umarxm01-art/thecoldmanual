"use strict";
/* "Ask the manual": the bank answers first, and questions it can't answer are saved for the admin to review.
   Questions are stored without any member id. Edits and new answers live under one reserved store (STORE), so the database needs no new tables. */
const { HttpError } = require("../util/misc");
const { buildIndex, search, tokens } = require("../ask/match");

const STORE = "__qa", MAX_Q = 500, MAX_STORED = 5000;
const caches = new WeakMap();
const baseOf = (ctx) => ctx.content.qa || [];
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const pub = (e) => ({ id: e.id, q: e.q, a: e.a, links: e.links || [] });

/* removes contact details and links from what gets saved */
const redact = (s) => String(s).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]").replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "[link]").replace(/\+?\d[\d\s().-]{6,}\d/g, "[number]");
const clean = (v, max, label) => {
  const s = String(v == null ? "" : v).replace(/\u0000/g, "").trim();
  if (!s) throw new HttpError(400, "Add " + label + " first.");
  if (s.length > max) throw new HttpError(413, "That is too long. Keep " + label + " under " + max + " characters.");
  return s;
};
const altsOf = (v) => (Array.isArray(v) ? v : String(v == null ? "" : v).split("\n")).map((x) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 30);

/* the bank = the starting answers, with the admin's edits and additions on top */
async function bank(ctx) {
  let c = caches.get(ctx.db);
  if (c && c.content === ctx.content) return c;
  const stored = await ctx.db.kvAll(STORE), edits = {};
  Object.keys(stored).forEach((k) => { if (k.startsWith("o:")) edits[k.slice(2)] = stored[k]; });
  const all = baseOf(ctx).map((e) => Object.assign({}, e, edits[e.id] || {}));
  Object.keys(edits).forEach((id) => { if (edits[id].src === "added") all.push(Object.assign({ id, alts: [], k: "", links: [] }, edits[id])); });
  c = { content: ctx.content, all, byId: new Map(all.map((e) => [e.id, e])), index: buildIndex(all.filter((e) => !e.hidden)) };
  caches.set(ctx.db, c);
  return c;
}
const refresh = (ctx) => caches.delete(ctx.db);

async function logQuestion(ctx, question, kind, answerId) {
  const safe = redact(question).slice(0, MAX_Q), words = tokens(safe);
  if (!words.length) return null;
  const id = hash(words.slice().sort().join(" ")), key = "q:" + id;
  const prev = ((await ctx.db.kvMany([STORE], [key]))[STORE] || {})[key];
  if (!prev && (await ctx.db.kvCount(STORE)) >= MAX_STORED) return null;
  const doc = prev || { id, q: safe, n: 0, first: ctx.now(), status: "open", kind, draft: "" };
  doc.n += 1; doc.last = ctx.now();
  if (kind === "wrong") { doc.kind = "wrong"; if (answerId) doc.answerId = answerId; if (doc.status === "answered") doc.status = "open"; }
  else if (doc.status === "answered") doc.status = "open"; /* its answer no longer matches, for example it was hidden */
  await ctx.db.kvSet(STORE, key, doc);
  return doc;
}

async function ask(ctx) {
  const q = clean(ctx.body && ctx.body.q, MAX_Q, "your question"), b = await bank(ctx), r = search(b.index, q, 3);
  if (r.status === "none") await logQuestion(ctx, q, "none");
  return { body: { status: r.status, matches: r.top.map((x) => pub(x.e)) } };
}

/* the member says none of the choices fit, or the answer didn't help */
async function miss(ctx) {
  const q = clean(ctx.body && ctx.body.q, MAX_Q, "your question");
  await logQuestion(ctx, q, ctx.body.kind === "wrong" ? "wrong" : "partial", ctx.body.id ? String(ctx.body.id).slice(0, 80) : "");
  return { body: { ok: true } };
}

/* lessons most related to a question, given to the AI so it answers the way the course teaches */
const lessonIndexes = new WeakMap();
function relatedLessons(ctx, question, n) {
  const list = ctx.content.lessons || [];
  let idx = lessonIndexes.get(ctx.content);
  if (!idx) { idx = buildIndex(list.map((l) => ({ id: l.id, q: l.t + " " + (l.idea || ""), alts: [], l }))); lessonIndexes.set(ctx.content, idx); }
  const words = new Set(tokens(question));
  return idx.docs.map((d) => { let s = 0; d.variants[0].forEach((t) => { if (words.has(t)) s += idx.idf(t); }); return { l: d.e.l, s }; }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.l);
}

async function saveDraft(ctx, question, draft) {
  const doc = await logQuestion(ctx, question, "none"); if (!doc) return;
  doc.n = Math.max(1, doc.n - 1); doc.draft = draft; doc.status = doc.status === "rejected" ? "rejected" : "open";
  await ctx.db.kvSet(STORE, "q:" + doc.id, doc);
}

/* ---------- admin ---------- */
async function questions(ctx) {
  const stored = await ctx.db.kvAll(STORE), b = await bank(ctx);
  const items = Object.keys(stored).filter((k) => k.startsWith("q:")).map((k) => stored[k]);
  const open = items.filter((x) => x.status === "open").sort((x, y) => y.n - x.n || y.last - x.last).slice(0, 200);
  open.forEach((x) => { x.near = search(b.index, x.q, 3).top.map((t) => ({ id: t.e.id, q: t.e.q })); });
  return { body: { items: open, counts: { open: items.filter((x) => x.status === "open").length, answered: items.filter((x) => x.status === "answered").length, rejected: items.filter((x) => x.status === "rejected").length },
    bank: { total: b.all.filter((e) => !e.hidden).length, checked: b.all.filter((e) => e.checked && !e.hidden).length, hidden: b.all.filter((e) => e.hidden).length, added: b.all.filter((e) => e.src === "added").length } } };
}
async function question(ctx) {
  const key = "q:" + ctx.params.id, doc = ((await ctx.db.kvMany([STORE], [key]))[STORE] || {})[key];
  if (!doc) throw new HttpError(404, "That question was not found.");
  return { key, doc };
}
function linksFrom(ctx, lessons) {
  const titles = ctx.content.catalog.lessonTitles;
  return String(lessons || "").split(/[\s,]+/).filter(Boolean).map((id) => { if (!titles[id]) throw new HttpError(400, "There is no lesson " + id + "."); return ["#/l/" + id, "Lesson " + id + ": " + titles[id]]; });
}
async function approve(ctx) {
  const { key, doc } = await question(ctx), b = ctx.body || {};
  const q = clean(b.q || doc.q, 300, "the question"), a = clean(b.a, 4000, "the answer"), id = "a-" + doc.id;
  await ctx.db.kvSet(STORE, "o:" + id, { src: "added", q, a, alts: altsOf(b.alts).concat(q === doc.q ? [] : [doc.q]), k: "", links: linksFrom(ctx, b.lessons), checked: true });
  doc.status = "answered"; doc.answerId = id;
  await ctx.db.kvSet(STORE, key, doc); refresh(ctx);
  return { body: { ok: true, id } };
}
async function editOf(ctx, id) { const e = (await bank(ctx)).byId.get(id); if (!e) throw new HttpError(404, "That answer was not found."); return { e, saved: (((await ctx.db.kvMany([STORE], ["o:" + id]))[STORE] || {})["o:" + id]) || {} }; }
async function merge(ctx) {
  const { key, doc } = await question(ctx), into = String((ctx.body || {}).into || ""), { e, saved } = await editOf(ctx, into);
  await ctx.db.kvSet(STORE, "o:" + into, Object.assign(saved, { alts: (e.alts || []).concat([doc.q]).slice(-30) }));
  doc.status = "answered"; doc.answerId = into;
  await ctx.db.kvSet(STORE, key, doc); refresh(ctx);
  return { body: { ok: true } };
}
async function reject(ctx) { const { key, doc } = await question(ctx); doc.status = "rejected"; await ctx.db.kvSet(STORE, key, doc); return { body: { ok: true } }; }

async function answers(ctx) {
  const b = await bank(ctx), q = String(ctx.query.q || "").toLowerCase().trim(), show = ctx.query.show || "all";
  let a = b.all;
  if (show === "unchecked") a = a.filter((e) => !e.checked && !e.hidden); else if (show === "hidden") a = a.filter((e) => e.hidden); else if (show === "added") a = a.filter((e) => e.src === "added"); else if (show === "common") a = a.filter((e) => e.src === "common");
  if (q) a = a.filter((e) => [e.q, e.a].concat(e.alts || []).join(" ").toLowerCase().indexOf(q) > -1);
  const skip = Math.max(0, Math.floor(+ctx.query.skip) || 0), limit = Math.max(1, Math.min(100, Math.floor(+ctx.query.limit) || 30));
  return { body: { total: a.length, items: a.slice(skip, skip + limit).map((e) => ({ id: e.id, src: e.src, q: e.q, a: e.a, alts: e.alts || [], links: e.links || [], checked: !!e.checked, hidden: !!e.hidden })) } };
}
async function patchAnswer(ctx) {
  const id = ctx.params.id, { saved } = await editOf(ctx, id), b = ctx.body || {};
  if (b.q !== undefined) saved.q = clean(b.q, 300, "the question");
  if (b.a !== undefined) saved.a = clean(b.a, 4000, "the answer");
  if (b.alts !== undefined) saved.alts = altsOf(b.alts);
  if (b.checked !== undefined) saved.checked = !!b.checked;
  if (b.hidden !== undefined) saved.hidden = !!b.hidden;
  await ctx.db.kvSet(STORE, "o:" + id, saved); refresh(ctx);
  return { body: { ok: true } };
}

module.exports = { ask, miss, relatedLessons, saveDraft, questions, approve, merge, reject, answers, patchAnswer, MAX_Q };
