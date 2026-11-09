"use strict";
const { HttpError, str, isEmail, intIn } = require("../util/misc");
const { safeEqual } = require("../util/crypto");
const admin = require("./admin");

/* Payment provider (or Zapier/Make) calls this after a successful payment. Safe to retry: the same `reference` returns the same codes. */
async function payment(ctx) {
  if (!ctx.cfg.webhookSecret) throw new HttpError(404, "Not found.");
  const given = ctx.headers["x-webhook-secret"] || "";
  if (!given || !safeEqual(given, ctx.cfg.webhookSecret)) throw new HttpError(401, "Unauthorised.");
  const b = ctx.body || {}, email = str(b.email, 254).toLowerCase(), ref = str(b.reference, 100), plan = b.plan === "team" ? "team" : "individual";
  if (!isEmail(email)) throw new HttpError(400, "A valid buyer email is required.");
  if (b.product === "call") return { body: Object.assign({ product: "call" }, await require("./offers").markPaid(ctx, email, ref)) };
  if (ref) {
    const prior = (await ctx.db.getCodeByRef(ref)) || (await ctx.db.getCodeByRef(ref + ":join"));
    if (prior) {
      if (plan === "individual") return { body: { plan, code: prior.code, repeated: true } };
      const o = await ctx.db.getOrg(prior.orgId), jc = o && o.joinCodeId ? await ctx.db.getCode(o.joinCodeId) : null;
      const mc = (await ctx.db.listCodes({ orgId: prior.orgId })).filter((c) => c.role === "manager" && c.ref === ref)[0];
      return { body: { plan, org: o && { id: o.id, name: o.name, seats: o.seats }, joinCode: jc && jc.code, managerCode: mc ? mc.code : null, repeated: true } };
    }
  }
  if (plan === "individual") {
    const c = await admin.newCode(ctx, { maxUses: 1, role: "member", orgId: null, note: "Purchase: " + email, ref });
    return { status: 201, body: { plan, code: c.code } };
  }
  const seats = intIn(b.seats, 1, 10000, null); if (seats == null) throw new HttpError(400, "Seats must be a whole number from 1 to 10000.");
  const name = str(b.orgName, 100) || email;
  const r = await admin.createOrgWith(ctx, name, seats, email, ref);
  return { status: 201, body: { plan, org: { id: r.org.id, name: r.org.name, seats: r.org.seats }, joinCode: r.joinCode, managerCode: r.managerCode, managerAssigned: r.managerAssigned } };
}
module.exports = { payment };
