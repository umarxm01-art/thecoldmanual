"use strict";
const { HttpError, str, isEmail } = require("../util/misc");
const C = require("../util/crypto");

const pub = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, orgId: u.orgId || null, teamConsent: !!u.teamConsent, mustChangePassword: !!u.mustChangePassword, createdAt: u.createdAt });

function sessionCookie(ctx, user) {
  const exp = Math.floor(ctx.now() / 1000) + ctx.cfg.cookieDays * 86400;
  return { name: ctx.cfg.cookieName, value: C.sign({ sub: user.id, tv: user.tokenVersion || 0, exp }, ctx.cfg.secret), maxAge: ctx.cfg.cookieDays * 86400 };
}
const clearCookie = (ctx) => ({ name: ctx.cfg.cookieName, value: "", maxAge: 0 });

function checkPassword(pw, email) {
  if (typeof pw !== "string" || pw.length < 10) throw new HttpError(400, "Use a password of at least 10 characters.");
  if (pw.length > 128) throw new HttpError(400, "That password is too long (128 characters at most).");
  if (email && pw.toLowerCase() === email.toLowerCase()) throw new HttpError(400, "Your password cannot be your email address.");
}

async function register(ctx) {
  const b = ctx.body || {}, email = str(b.email, 254).toLowerCase(), name = str(b.name, 60), code = str(b.code, 64).toUpperCase();
  if (!isEmail(email)) throw new HttpError(400, "Enter a valid email address.");
  if (!name) throw new HttpError(400, "Enter your name. It appears on your certificate.");
  checkPassword(b.password, email);
  if (!code) throw new HttpError(400, "Enter your access code.");
  if (await ctx.db.getUserByEmail(email)) throw new HttpError(409, "An account with this email already exists. Log in instead.");
  const claimed = await ctx.db.claimCode(code);
  if (!claimed) throw new HttpError(400, "That access code is not valid, has expired, or has been used up.");
  try {
    let org = null;
    if (claimed.orgId) {
      org = await ctx.db.getOrg(claimed.orgId);
      if (!org) throw new HttpError(400, "That team no longer exists. Ask your manager for a new code.");
      if (!b.teamConsent) throw new HttpError(400, "Please confirm that you understand your team manager can see your progress.");
    }
    const user = await ctx.db.createUser({ email, name, passHash: await C.hashPassword(b.password), role: claimed.role === "manager" ? "manager" : "member", orgId: claimed.orgId || null, teamConsent: !!claimed.orgId });
    return { status: 201, body: { user: pub(user), org: org ? { id: org.id, name: org.name } : null }, cookies: [sessionCookie(ctx, user)] };
  } catch (e) {
    await ctx.db.releaseCode(claimed.id); /* give the code back if registration failed */
    if (e && e.code === "DUPLICATE") throw new HttpError(409, "An account with this email already exists. Log in instead.");
    throw e;
  }
}

async function login(ctx) {
  const b = ctx.body || {}, email = str(b.email, 254).toLowerCase(), pw = typeof b.password === "string" ? b.password.slice(0, 128) : "";
  const user = isEmail(email) ? await ctx.db.getUserByEmail(email) : null;
  const ok = user ? await C.verifyPassword(pw, user.passHash) : await C.fakeVerify(pw);
  if (!user || !ok) throw new HttpError(401, "Email or password is not right.");
  if (user.disabled) throw new HttpError(403, "This account is disabled. Contact support.");
  const u = await ctx.db.updateUser(user.id, { lastLoginAt: ctx.now() });
  const org = u.orgId ? await ctx.db.getOrg(u.orgId) : null;
  return { body: { user: pub(u), org: org ? { id: org.id, name: org.name } : null }, cookies: [sessionCookie(ctx, u)] };
}

async function me(ctx) {
  const org = ctx.user.orgId ? await ctx.db.getOrg(ctx.user.orgId) : null;
  return { body: { user: pub(ctx.user), org: org ? { id: org.id, name: org.name } : null } };
}
async function logout(ctx) { return { body: { ok: true }, cookies: [clearCookie(ctx)] }; }
async function logoutAll(ctx) { await ctx.db.updateUser(ctx.user.id, { tokenVersion: (ctx.user.tokenVersion || 0) + 1 }); return { body: { ok: true }, cookies: [clearCookie(ctx)] }; }

async function changePassword(ctx) {
  const b = ctx.body || {};
  if (!(await C.verifyPassword(typeof b.current === "string" ? b.current : "", ctx.user.passHash))) throw new HttpError(400, "Your current password is not right.");
  checkPassword(b.next, ctx.user.email);
  const u = await ctx.db.updateUser(ctx.user.id, { passHash: await C.hashPassword(b.next), tokenVersion: (ctx.user.tokenVersion || 0) + 1, mustChangePassword: false });
  return { body: { ok: true }, cookies: [sessionCookie(ctx, u)] }; /* other devices are signed out, this one stays in */
}
async function profile(ctx) {
  const name = str((ctx.body || {}).name, 60); if (!name) throw new HttpError(400, "Enter your name.");
  return { body: { user: pub(await ctx.db.updateUser(ctx.user.id, { name })) } };
}
async function leaveTeam(ctx) {
  const u = ctx.user; if (!u.orgId) throw new HttpError(400, "You are not in a team.");
  if (u.role === "manager") throw new HttpError(400, "Team managers cannot leave. Ask the platform admin to change your role.");
  const org = await ctx.db.getOrg(u.orgId);
  await ctx.db.updateUser(u.id, { orgId: null, teamConsent: false });
  if (org && org.joinCodeId) await ctx.db.releaseCode(org.joinCodeId);
  return { body: { user: pub(await ctx.db.getUser(u.id)), org: null } };
}

module.exports = { register, login, me, logout, logoutAll, changePassword, profile, leaveTeam, pub };
