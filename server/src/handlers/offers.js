"use strict";
/* Upsells. The 1:1 strategy call: a member sends a short request, pays through your payment link, then books a time.
   The request lives in the member's own store under "adm_call". Members can read it but only the server writes it. */
const { HttpError, str } = require("../util/misc");

const KEY = "adm_call";
const STAGES = ["not-started", "outreach-no-calls", "calls-no-closes", "closing", "scaling"];
const SLOTS = ["morning", "afternoon", "evening", "any"];
const STATUS = ["requested", "paid", "booked", "done", "cancelled"];
const OPEN = ["requested", "paid", "booked"];

function callOffer(cfg) {
  const c = cfg.offers && cfg.offers.call ? cfg.offers.call : {};
  return { enabled: c.enabled !== false, price: c.price || "Rs 10,000", minutes: c.minutes || 60, payUrl: c.payUrl || "", bookUrl: c.bookUrl || "", credit: c.credit !== false };
}
async function offers(ctx) { return { body: { call: callOffer(ctx.cfg) } }; }

async function requestCall(ctx) {
  const off = callOffer(ctx.cfg); if (!off.enabled) throw new HttpError(404, "1:1 calls are not available right now.");
  const cur = (await ctx.db.kvAll(ctx.user.id))[KEY];
  if (cur && OPEN.includes(cur.status)) throw new HttpError(409, "You already have a call request in progress.");
  const b = ctx.body || {};
  const form = {
    offer: str(b.offer, 200), stage: STAGES.includes(b.stage) ? b.stage : "", problem: str(b.problem, 1200), goal: str(b.goal, 600),
    whatsapp: str(b.whatsapp, 30), slot: SLOTS.includes(b.slot) ? b.slot : "any"
  };
  if (!form.offer) throw new HttpError(400, "Tell us what you sell, and to whom.");
  if (!form.stage) throw new HttpError(400, "Choose where you are right now.");
  if (form.problem.length < 10) throw new HttpError(400, "Describe what's holding you back in a sentence or two.");
  if (!/^[+0-9 ()-]{7,30}$/.test(form.whatsapp)) throw new HttpError(400, "Enter a WhatsApp number we can reach you on.");
  const at = ctx.now(), r = { id: "c" + at.toString(36), at, status: "requested", form, note: "", hist: [{ s: "requested", at }] };
  await ctx.db.kvSet(ctx.user.id, KEY, r);
  return { status: 201, body: { request: r, call: off } };
}

async function cancelCall(ctx) {
  const cur = (await ctx.db.kvAll(ctx.user.id))[KEY];
  if (!cur || cur.status !== "requested") throw new HttpError(409, "Only a request that hasn't been paid for can be cancelled here. Reply to us on WhatsApp instead.");
  cur.status = "cancelled"; cur.hist = (cur.hist || []).concat([{ s: "cancelled", at: ctx.now() }]);
  await ctx.db.kvSet(ctx.user.id, KEY, cur);
  return { body: { request: cur } };
}

async function adminList(ctx) {
  const r = await ctx.db.listUsers({ limit: 5000 }), ids = r.items.map((u) => u.id), kv = await ctx.db.kvMany(ids, [KEY]);
  const want = STATUS.includes(ctx.query.status) ? ctx.query.status : "";
  const list = r.items.filter((u) => kv[u.id] && kv[u.id][KEY]).map((u) => Object.assign({ uid: u.id, name: u.name, email: u.email }, kv[u.id][KEY]))
    .filter((x) => !want || x.status === want).sort((a, b) => b.at - a.at);
  return { body: { requests: list } };
}

async function adminPatch(ctx) {
  const u = await ctx.db.getUser(ctx.params.uid); if (!u) throw new HttpError(404, "Member not found.");
  const cur = (await ctx.db.kvAll(u.id))[KEY]; if (!cur) throw new HttpError(404, "This member has no call request.");
  const b = ctx.body || {};
  if (b.status !== undefined) {
    if (!STATUS.includes(b.status)) throw new HttpError(400, "Unknown status.");
    if (b.status !== cur.status) { cur.status = b.status; cur.hist = (cur.hist || []).concat([{ s: b.status, at: ctx.now() }]); }
  }
  if (b.note !== undefined) cur.note = str(b.note, 300);
  if (b.when !== undefined) cur.when = str(b.when, 60);
  await ctx.db.kvSet(u.id, KEY, cur);
  return { body: { request: Object.assign({ uid: u.id, name: u.name, email: u.email }, cur) } };
}

/* called by the payment webhook with product "call" */
async function markPaid(ctx, email, ref) {
  const u = await ctx.db.getUserByEmail(email); if (!u) return { matched: false };
  const cur = (await ctx.db.kvAll(u.id))[KEY]; if (!cur || cur.status !== "requested") return { matched: true, changed: false };
  cur.status = "paid"; cur.ref = ref || ""; cur.hist = (cur.hist || []).concat([{ s: "paid", at: ctx.now() }]);
  await ctx.db.kvSet(u.id, KEY, cur);
  return { matched: true, changed: true };
}

module.exports = { offers, requestCall, cancelCall, adminList, adminPatch, markPaid, KEY, callOffer };
