"use strict";
/* MongoDB repository (Mongoose 8). Same interface as db/memory.js. Run `npm run test:db` with MONGODB_URI set to check it. */
const mongoose = require("mongoose");
const { Schema } = mongoose;

function dupGuard(e) { if (e && e.code === 11000) { const x = new Error("duplicate"); x.code = "DUPLICATE"; throw x; } throw e; }
function toDoc(d) {
  if (!d) return null; const o = d.toObject ? d.toObject() : d;
  o.id = String(o._id); delete o._id; delete o.__v;
  ["createdAt", "lastLoginAt", "expiresAt"].forEach((k) => { if (o[k] instanceof Date) o[k] = o[k].getTime(); });
  return o;
}
const valid = (i) => mongoose.isValidObjectId(i);

async function createMongoDb(uri) {
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 }).asPromise();
  const User = conn.model("User", new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, name: String, passHash: String,
    role: { type: String, enum: ["member", "manager", "admin"], default: "member" }, orgId: { type: String, default: null, index: true },
    tokenVersion: { type: Number, default: 0 }, teamConsent: { type: Boolean, default: false }, disabled: { type: Boolean, default: false }, mustChangePassword: { type: Boolean, default: false },
    createdAt: { type: Number, default: () => Date.now() }, lastLoginAt: { type: Number, default: null }
  }, { minimize: false }));
  const Code = conn.model("AccessCode", new Schema({
    code: { type: String, required: true, unique: true }, maxUses: { type: Number, default: 1 }, uses: { type: Number, default: 0 },
    role: { type: String, default: "member" }, orgId: { type: String, default: null, index: true }, note: String, ref: { type: String, default: "", index: true },
    expiresAt: { type: Number, default: null }, disabled: { type: Boolean, default: false }, createdAt: { type: Number, default: () => Date.now() }
  }));
  const Org = conn.model("Org", new Schema({ name: String, seats: Number, joinCodeId: { type: String, default: null }, ref: { type: String, default: "" }, createdAt: { type: Number, default: () => Date.now() } }));
  /* values are stored as JSON text because lesson ids like "1.1" are used as object keys and MongoDB field names are fussy about dots */
  const Kv = conn.model("Kv", new Schema({ userId: { type: String, required: true }, key: { type: String, required: true }, j: String, t: Number }));
  Kv.schema.index({ userId: 1, key: 1 }, { unique: true });
  await Promise.all([User.init(), Code.init(), Org.init(), Kv.init()]);

  return {
    kind: "mongo",
    async close() { await conn.close(); },
    async createUser(u) { try { return toDoc(await User.create(Object.assign({}, u, { createdAt: Date.now() }))); } catch (e) { return dupGuard(e); } },
    async getUser(i) { return valid(i) ? toDoc(await User.findById(i).lean()) : null; },
    async getUserByEmail(email) { return toDoc(await User.findOne({ email: String(email).toLowerCase() }).lean()); },
    async updateUser(i, patch) { return valid(i) ? toDoc(await User.findByIdAndUpdate(i, { $set: patch }, { new: true }).lean()) : null; },
    async listUsers(o) {
      o = o || {}; const f = {};
      if (o.orgId !== undefined) f.orgId = o.orgId; if (o.role) f.role = o.role;
      if (o.q) { const q = String(o.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); f.$or = [{ email: new RegExp(q, "i") }, { name: new RegExp(q, "i") }]; }
      const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(o.skip || 0).limit(o.limit || 50).lean(), User.countDocuments(f)]);
      return { items: items.map(toDoc), total };
    },
    async deleteUser(i) { if (!valid(i)) return; await Promise.all([User.deleteOne({ _id: i }), Kv.deleteMany({ userId: i })]); },
    async createCode(c) { try { return toDoc(await Code.create(Object.assign({}, c, { createdAt: Date.now() }))); } catch (e) { return dupGuard(e); } },
    async getCode(i) { return valid(i) ? toDoc(await Code.findById(i).lean()) : null; },
    async getCodeByCode(code) { return toDoc(await Code.findOne({ code }).lean()); },
    async getCodeByRef(ref) { return ref ? toDoc(await Code.findOne({ ref }).lean()) : null; },
    async claimCode(code) {
      const t = Date.now();
      return toDoc(await Code.findOneAndUpdate({ code, disabled: false, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: t } }] }, { $expr: { $lt: ["$uses", "$maxUses"] } }] }, { $inc: { uses: 1 } }, { new: true }).lean());
    },
    async releaseCode(i) { if (valid(i)) await Code.updateOne({ _id: i, uses: { $gt: 0 } }, { $inc: { uses: -1 } }); },
    async updateCode(i, patch) { return valid(i) ? toDoc(await Code.findByIdAndUpdate(i, { $set: patch }, { new: true }).lean()) : null; },
    async listCodes(o) { o = o || {}; const f = {}; if (o.orgId !== undefined) f.orgId = o.orgId; return (await Code.find(f).sort({ createdAt: -1 }).limit(o.limit || 500).lean()).map(toDoc); },
    async deleteCode(i) { if (valid(i)) await Code.deleteOne({ _id: i }); },
    async createOrg(o) { return toDoc(await Org.create(Object.assign({}, o, { createdAt: Date.now() }))); },
    async getOrg(i) { return valid(i) ? toDoc(await Org.findById(i).lean()) : null; },
    async updateOrg(i, patch) { return valid(i) ? toDoc(await Org.findByIdAndUpdate(i, { $set: patch }, { new: true }).lean()) : null; },
    async listOrgs() { return (await Org.find({}).sort({ createdAt: -1 }).lean()).map(toDoc); },
    async deleteOrg(i) { if (valid(i)) await Org.deleteOne({ _id: i }); },
    async kvAll(u) { const r = {}; (await Kv.find({ userId: u }).lean()).forEach((d) => { r[d.key] = JSON.parse(d.j); }); return r; },
    async kvSet(u, k, value) { await Kv.updateOne({ userId: u, key: k }, { $set: { j: JSON.stringify(value), t: Date.now() } }, { upsert: true }); },
    async kvDel(u, k) { await Kv.deleteOne({ userId: u, key: k }); },
    async kvDelAll(u) { await Kv.deleteMany({ userId: u }); },
    async kvCount(u) { return Kv.countDocuments({ userId: u }); },
    async kvHas(u, k) { return !!(await Kv.exists({ userId: u, key: k })); },
    async kvMany(userIds, keys) {
      const r = {}; userIds.forEach((u) => { r[u] = {}; });
      (await Kv.find({ userId: { $in: userIds }, key: { $in: keys } }).lean()).forEach((d) => { r[d.userId][d.key] = JSON.parse(d.j); });
      return r;
    },
    async kvLastUpdated(userIds) {
      const r = {}; userIds.forEach((u) => { r[u] = null; });
      (await Kv.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", t: { $max: "$t" } } }])).forEach((d) => { r[d._id] = d.t || null; });
      return r;
    }
  };
}
module.exports = { createMongoDb };
