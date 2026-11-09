"use strict";
const { HttpError, toCsv } = require("../util/misc");
const C = require("../util/crypto");
const shared = require("../shared");

const KEYS = ["done", "quiz", "rp", "pl", "dr", "t_sprint", "trk", "t_funnel", "t_icp", "t_offer", "t_stack", "t_leadsearch", "t_leads", "t_scripts", "t_emailwriter", "t_dmbuilder", "t_emailcheck", "t_cadence", "t_videoscript", "t_qualifier", "t_reminders", "t_discovery", "t_proposal", "t_contract", "t_delivery", "t_messages"];
const DAY = 86400000;

async function loadOrg(ctx, orgId) {
  const org = orgId ? await ctx.db.getOrg(orgId) : null;
  if (!org) throw new HttpError(404, "Team not found.");
  return org;
}
async function memberRows(ctx, org) {
  const S = await shared();
  const members = (await ctx.db.listUsers({ orgId: org.id, role: "member", limit: 1000 })).items, ids = members.map((m) => m.id);
  const [kv, last] = await Promise.all([ctx.db.kvMany(ids, KEYS), ctx.db.kvLastUpdated(ids)]);
  return members.map((m) => Object.assign({ id: m.id, name: m.name, email: m.email, joinedAt: m.createdAt, lastActive: Math.max(m.lastLoginAt || 0, last[m.id] || 0) || null, disabled: !!m.disabled }, S.memberStats(kv[m.id], ctx.content.catalog, ctx.now())));
}
function summarise(S, org, rows, now) {
  const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  const teamSkills = {}; S.SKILLS.forEach((s) => { teamSkills[s.key] = avg(rows.map((r) => r.skills[s.key]).filter((v) => v != null)); });
  const measured = S.SKILLS.map((s) => s.key).filter((k) => teamSkills[k] != null).sort((a, b) => teamSkills[a] - teamSkills[b]);
  const sp = rows.map((r) => r.sprint).filter(Boolean);
  return { sprinting: sp.length, sprintBooked: sp.reduce((a, x) => a + x.booked, 0), sprintAvg: avg(sp.map((x) => x.pct).filter((v) => v != null)), members: rows.length, seats: org.seats, seatsLeft: Math.max(0, org.seats - rows.length), avgCompletion: avg(rows.map((r) => r.pct)), active7: rows.filter((r) => r.lastActive && now - r.lastActive < 7 * DAY).length, placementTaken: rows.filter((r) => r.placement).length, avgOverall: avg(rows.map((r) => r.overall).filter((v) => v != null)), teamSkills, weakestSkill: measured[0] || null };
}
async function overview(ctx, org) {
  const S = await shared(), rows = await memberRows(ctx, org);
  const jc = org.joinCodeId ? await ctx.db.getCode(org.joinCodeId) : null;
  const managers = (await ctx.db.listUsers({ orgId: org.id, role: "manager", limit: 50 })).items.map((m) => ({ id: m.id, name: m.name, email: m.email }));
  return { org: { id: org.id, name: org.name, seats: org.seats }, joinCode: jc ? { code: jc.code, uses: jc.uses, maxUses: jc.maxUses, disabled: jc.disabled } : null, managers, summary: summarise(S, org, rows, ctx.now()), members: rows, skills: S.SKILLS.map((s) => ({ key: s.key, label: s.label })) };
}
async function rotate(ctx, org) {
  const count = (await ctx.db.listUsers({ orgId: org.id, role: "member", limit: 1 })).total;
  if (org.joinCodeId) await ctx.db.updateCode(org.joinCodeId, { disabled: true });
  let code = null;
  for (let i = 0; i < 5 && !code; i++) { try { code = await ctx.db.createCode({ code: C.randomCode("TEAM"), maxUses: org.seats, uses: count, role: "member", orgId: org.id, note: "Team join code" }); } catch (e) { if (!e || e.code !== "DUPLICATE") throw e; } }
  if (!code) throw new HttpError(500, "Could not create a code. Try again.");
  await ctx.db.updateOrg(org.id, { joinCodeId: code.id });
  return { code: code.code, uses: code.uses, maxUses: code.maxUses, disabled: false };
}
async function inOrg(ctx, org, userId) {
  const u = await ctx.db.getUser(userId);
  if (!u || u.orgId !== org.id || u.role !== "member") throw new HttpError(404, "Member not found.");
  return u;
}
async function removeMember(ctx, org) {
  const u = await inOrg(ctx, org, ctx.params.uid || ctx.params.id);
  await ctx.db.updateUser(u.id, { orgId: null, teamConsent: false });
  if (org.joinCodeId) await ctx.db.releaseCode(org.joinCodeId);
  return { ok: true };
}
async function memberDetail(ctx, org) {
  const S = await shared(), u = await inOrg(ctx, org, ctx.params.uid || ctx.params.id), kv = (await ctx.db.kvMany([u.id], KEYS))[u.id], cat = ctx.content.catalog;
  const sk = S.computeSkills(kv, cat), done = kv.done || {}, byP = {};
  cat.lessonIds.forEach((id) => { const p = id.split(".")[0]; byP[p] = byP[p] || { id: +p, done: 0, total: 0 }; byP[p].total++; if (done[id]) byP[p].done++; });
  const last = (await ctx.db.kvLastUpdated([u.id]))[u.id];
  return { member: { id: u.id, name: u.name, email: u.email, joinedAt: u.createdAt, lastActive: Math.max(u.lastLoginAt || 0, last || 0) || null }, stats: S.memberStats(kv, cat, ctx.now()), skills: sk, rp: kv.rp || {}, scenarios: cat.scenarios, placementAt: kv.pl && kv.pl.at ? kv.pl.at : null, programs: Object.values(byP).sort((a, b) => a.id - b.id) };
}
async function exportCsv(ctx, org) {
  const S = await shared(), rows = await memberRows(ctx, org), d = (t) => (t ? new Date(t).toISOString().slice(0, 10) : "");
  const head = ["Name", "Email", "Joined", "Last active", "Lessons done", "Lessons total", "Completion %", "Average quiz %", "Roleplay runs", "Roleplay average %"].concat(["Drills average %", "Drill attempts", "Sprint day", "Sprint % of target", "Sprint touches", "Sprint conversations", "Sprint meetings booked", "Track day", "Track days complete", "Track checkpoints passed", "First client signed"]);
  const data = rows.map((r) => [r.name, r.email, d(r.joinedAt), d(r.lastActive), r.done, r.total, r.pct, r.avgQuiz, r.rpRuns, r.rpAvg].concat([r.drillAvg, r.drillRuns]).concat(r.sprint ? [r.sprint.day, r.sprint.pct, r.sprint.touches, r.sprint.convos, r.sprint.booked] : ["", "", "", "", ""]).concat(r.track ? [r.track.day, r.track.doneDays, r.track.passed, r.track.client ? "yes" : "no"] : ["", "", "", ""]));
  return { raw: { type: "text/csv; charset=utf-8", filename: "team-progress.csv", text: toCsv([head].concat(data)) } };
}

/* manager routes use their own team; admin routes pass the team id in the path */
const asManager = (fn) => async (ctx) => { if (!ctx.user.orgId) throw new HttpError(404, "You are not managing a team."); return fn(ctx, await loadOrg(ctx, ctx.user.orgId)); };
const asAdmin = (fn) => async (ctx) => fn(ctx, await loadOrg(ctx, ctx.params.id));
const wrap = (fn) => async (ctx, org) => { const r = await fn(ctx, org); return r && r.raw ? r : { body: r }; };

const ops = { overview: wrap(overview), rotate: wrap(rotate), removeMember: wrap(removeMember), memberDetail: wrap(memberDetail), exportCsv: wrap(exportCsv) };
module.exports = {
  manager: { overview: asManager(ops.overview), rotate: asManager(ops.rotate), removeMember: asManager(ops.removeMember), memberDetail: asManager(ops.memberDetail), exportCsv: asManager(ops.exportCsv) },
  admin: { overview: asAdmin(ops.overview), rotate: asAdmin(ops.rotate), removeMember: asAdmin(ops.removeMember), memberDetail: asAdmin(ops.memberDetail), exportCsv: asAdmin(ops.exportCsv) },
  overview, rotate
};
