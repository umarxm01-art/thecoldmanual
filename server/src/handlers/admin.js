"use strict";
const { HttpError, str, isEmail, intIn } = require("../util/misc");
const C = require("../util/crypto");
const org = require("./org");
const { pub } = require("./auth");

const codeOut = (c) => ({ id: c.id, code: c.code, uses: c.uses, maxUses: c.maxUses, role: c.role, orgId: c.orgId, note: c.note, disabled: !!c.disabled, expiresAt: c.expiresAt, createdAt: c.createdAt });

async function newCode(ctx, fields, prefix) {
  for (let i = 0; i < 6; i++) { try { return await ctx.db.createCode(Object.assign({ code: C.randomCode(prefix || "OSI") }, fields)); } catch (e) { if (!e || e.code !== "DUPLICATE") throw e; } }
  throw new HttpError(500, "Could not create a unique code. Try again.");
}

async function stats(ctx) {
  const [all, members, managers, admins, orgs, codes] = await Promise.all([ctx.db.listUsers({ limit: 1 }), ctx.db.listUsers({ role: "member", limit: 1 }), ctx.db.listUsers({ role: "manager", limit: 1 }), ctx.db.listUsers({ role: "admin", limit: 1 }), ctx.db.listOrgs(), ctx.db.listCodes()]);
  return { body: { users: all.total, members: members.total, managers: managers.total, admins: admins.total, orgs: orgs.length, codes: { total: codes.length, active: codes.filter((c) => !c.disabled && c.uses < c.maxUses).length, uses: codes.reduce((a, c) => a + c.uses, 0) } } };
}

async function listCodes(ctx) { return { body: { codes: (await ctx.db.listCodes()).map(codeOut) } }; }
async function createCodes(ctx) {
  const b = ctx.body || {}, count = intIn(b.count, 1, 200, 1), maxUses = intIn(b.maxUses, 1, 100000, 1), note = str(b.note, 100);
  let expiresAt = null; if (b.expiresAt) { expiresAt = Date.parse(b.expiresAt); if (!isFinite(expiresAt) || expiresAt <= ctx.now()) throw new HttpError(400, "Expiry must be a future date."); }
  const out = []; for (let i = 0; i < count; i++) out.push(codeOut(await newCode(ctx, { maxUses, note, expiresAt, role: "member", orgId: null })));
  return { status: 201, body: { codes: out } };
}
async function patchCode(ctx) {
  const c = await ctx.db.getCode(ctx.params.id); if (!c) throw new HttpError(404, "Code not found.");
  const b = ctx.body || {}, patch = {};
  if (typeof b.disabled === "boolean") patch.disabled = b.disabled;
  if (b.maxUses !== undefined) { const n = intIn(b.maxUses, 1, 100000, null); if (n == null || n < c.uses) throw new HttpError(400, "Max uses cannot be below the number already used (" + c.uses + ")."); patch.maxUses = n; }
  if (b.note !== undefined) patch.note = str(b.note, 100);
  return { body: { code: codeOut(await ctx.db.updateCode(c.id, patch)) } };
}
async function deleteCode(ctx) { await ctx.db.deleteCode(ctx.params.id); return { body: { ok: true } }; }

async function listUsers(ctx) {
  const q = ctx.query, r = await ctx.db.listUsers({ q: str(q.q, 100), skip: intIn(q.skip, 0, 1e6, 0), limit: intIn(q.limit, 1, 100, 50) });
  return { body: { total: r.total, users: r.items.map((u) => Object.assign(pub(u), { disabled: !!u.disabled, lastLoginAt: u.lastLoginAt })) } };
}
/* for refund requests: did they complete days 1 to 14 of the 30-day plan? */
async function refundCheck(ctx) {
  const u = await target(ctx), S = await require("../shared")(), kv = await ctx.db.kvAll(u.id), t = S.trackStats(kv, ctx.content.catalog.track, ctx.now());
  const first = (t.days || []).slice(0, 14);
  return { body: { joinedAt: u.createdAt, started: !!t.started, start: t.start || null, done: first.filter((d) => d.done).length, of: 14, notDone: first.filter((d) => !d.done).map((d) => d.d) } };
}
async function target(ctx) { const u = await ctx.db.getUser(ctx.params.id); if (!u) throw new HttpError(404, "User not found."); return u; }
async function patchUser(ctx) {
  const u = await target(ctx), b = ctx.body || {}, patch = {};
  if (typeof b.disabled === "boolean") { if (u.id === ctx.user.id) throw new HttpError(400, "You cannot disable your own account."); patch.disabled = b.disabled; if (b.disabled) patch.tokenVersion = (u.tokenVersion || 0) + 1; }
  if (b.name !== undefined) { const n = str(b.name, 60); if (!n) throw new HttpError(400, "Name cannot be empty."); patch.name = n; }
  return { body: { user: pub(await ctx.db.updateUser(u.id, patch)) } };
}
async function resetPassword(ctx) {
  const u = await target(ctx), temp = C.randomPassword();
  await ctx.db.updateUser(u.id, { passHash: await C.hashPassword(temp), tokenVersion: (u.tokenVersion || 0) + 1, mustChangePassword: true }); /* they pick their own password at the next login */
  return { body: { tempPassword: temp } };
}
async function deleteUser(ctx) {
  const u = await target(ctx); if (u.id === ctx.user.id) throw new HttpError(400, "You cannot delete your own account.");
  if (u.orgId && u.role === "member") { const o = await ctx.db.getOrg(u.orgId); if (o && o.joinCodeId) await ctx.db.releaseCode(o.joinCodeId); }
  await ctx.db.deleteUser(u.id); return { body: { ok: true } };
}

async function listOrgs(ctx) {
  const orgs = await ctx.db.listOrgs(), out = [];
  for (const o of orgs) {
    const [m, mg] = await Promise.all([ctx.db.listUsers({ orgId: o.id, role: "member", limit: 1 }), ctx.db.listUsers({ orgId: o.id, role: "manager", limit: 10 })]);
    const jc = o.joinCodeId ? await ctx.db.getCode(o.joinCodeId) : null;
    out.push({ id: o.id, name: o.name, seats: o.seats, members: m.total, managers: mg.items.map((x) => ({ name: x.name, email: x.email })), joinCode: jc ? jc.code : null, createdAt: o.createdAt });
  }
  return { body: { orgs: out } };
}
/* creates a team: the org, a join code for learners and a manager (existing account or a one-use manager code) */
async function createOrgWith(ctx, name, seats, managerEmail, ref) {
  const o = await ctx.db.createOrg({ name, seats, ref: ref || "" });
  const jc = await newCode(ctx, { maxUses: seats, role: "member", orgId: o.id, note: "Team join code: " + name, ref: ref ? ref + ":join" : "" }, "TEAM");
  await ctx.db.updateOrg(o.id, { joinCodeId: jc.id });
  let managerCode = null, assigned = false;
  const existing = managerEmail ? await ctx.db.getUserByEmail(managerEmail) : null;
  if (existing && existing.role !== "admin" && (!existing.orgId || existing.orgId === o.id)) { await ctx.db.updateUser(existing.id, { role: "manager", orgId: o.id, teamConsent: true }); assigned = true; }
  else managerCode = await newCode(ctx, { maxUses: 1, role: "manager", orgId: o.id, note: "Manager for " + name + (managerEmail ? " (" + managerEmail + ")" : ""), ref: ref || "" }, "MGR");
  return { org: Object.assign({}, o, { joinCodeId: jc.id }), joinCode: jc.code, managerCode: managerCode ? managerCode.code : null, managerAssigned: assigned };
}
async function createOrg(ctx) {
  const b = ctx.body || {}, name = str(b.name, 100), seats = intIn(b.seats, 1, 10000, null), email = str(b.managerEmail, 254).toLowerCase();
  if (!name) throw new HttpError(400, "Enter the team name."); if (seats == null) throw new HttpError(400, "Seats must be a whole number from 1 to 10000.");
  if (email && !isEmail(email)) throw new HttpError(400, "Enter a valid manager email, or leave it empty.");
  if (email) { const u = await ctx.db.getUserByEmail(email); if (u && u.role === "admin") throw new HttpError(409, "That account is a platform admin. Use another email for the manager."); if (u && u.orgId) throw new HttpError(409, "That person is already in a team."); }
  return { status: 201, body: await createOrgWith(ctx, name, seats, email) };
}
async function patchOrg(ctx) {
  const o = await ctx.db.getOrg(ctx.params.id); if (!o) throw new HttpError(404, "Team not found.");
  const b = ctx.body || {}, patch = {};
  if (b.name !== undefined) { const n = str(b.name, 100); if (!n) throw new HttpError(400, "Name cannot be empty."); patch.name = n; }
  if (b.seats !== undefined) {
    const n = intIn(b.seats, 1, 10000, null), cnt = (await ctx.db.listUsers({ orgId: o.id, role: "member", limit: 1 })).total;
    if (n == null) throw new HttpError(400, "Seats must be a whole number from 1 to 10000."); if (n < cnt) throw new HttpError(409, "This team already has " + cnt + " members. Remove some before lowering seats.");
    patch.seats = n; if (o.joinCodeId) await ctx.db.updateCode(o.joinCodeId, { maxUses: n });
  }
  return { body: { org: await ctx.db.updateOrg(o.id, patch) } };
}
async function deleteOrg(ctx) {
  const o = await ctx.db.getOrg(ctx.params.id); if (!o) throw new HttpError(404, "Team not found.");
  for (const u of (await ctx.db.listUsers({ orgId: o.id, limit: 5000 })).items) await ctx.db.updateUser(u.id, { orgId: null, teamConsent: false, role: u.role === "manager" ? "member" : u.role });
  for (const c of await ctx.db.listCodes({ orgId: o.id })) await ctx.db.updateCode(c.id, { disabled: true });
  await ctx.db.deleteOrg(o.id); return { body: { ok: true } };
}

module.exports = { refundCheck, stats, listCodes, createCodes, patchCode, deleteCode, listUsers, patchUser, resetPassword, deleteUser, listOrgs, createOrg, patchOrg, deleteOrg, createOrgWith, newCode, codeOut, orgAdmin: org.admin };
