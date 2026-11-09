"use strict";
/* In-memory repository. Same interface as db/mongo.js. Used by the tests and for trying the app without MongoDB. */
const crypto = require("crypto");
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const id = () => crypto.randomBytes(12).toString("hex");

function createMemoryDb(now) {
  now = now || Date.now;
  const users = new Map(), codes = new Map(), orgs = new Map(), kv = new Map(); /* kv: userId -> Map(key -> {j, t}) */
  const out = (x) => clone(x);

  return {
    kind: "memory",
    async close() {},
    /* users */
    async createUser(u) {
      const email = String(u.email).toLowerCase();
      for (const x of users.values()) if (x.email === email) { const e = new Error("duplicate"); e.code = "DUPLICATE"; throw e; }
      const doc = Object.assign({ role: "member", orgId: null, tokenVersion: 0, teamConsent: false, disabled: false, lastLoginAt: null }, u, { id: id(), email, createdAt: now() });
      users.set(doc.id, doc); return out(doc);
    },
    async getUser(i) { return out(users.get(i) || null); },
    async getUserByEmail(email) { email = String(email).toLowerCase(); for (const x of users.values()) if (x.email === email) return out(x); return null; },
    async updateUser(i, patch) { const u = users.get(i); if (!u) return null; Object.assign(u, patch); return out(u); },
    async listUsers(o) {
      o = o || {}; let a = [...users.values()];
      if (o.orgId !== undefined) a = a.filter((x) => x.orgId === o.orgId);
      if (o.role) a = a.filter((x) => x.role === o.role);
      if (o.q) { const q = String(o.q).toLowerCase(); a = a.filter((x) => x.email.includes(q) || String(x.name).toLowerCase().includes(q)); }
      a.sort((x, y) => y.createdAt - x.createdAt);
      const total = a.length, skip = o.skip || 0, limit = o.limit || 50;
      return { items: out(a.slice(skip, skip + limit)), total };
    },
    async deleteUser(i) { users.delete(i); kv.delete(i); },
    /* access codes */
    async createCode(c) {
      if (codes.size && [...codes.values()].some((x) => x.code === c.code)) { const e = new Error("duplicate"); e.code = "DUPLICATE"; throw e; }
      const doc = Object.assign({ maxUses: 1, uses: 0, role: "member", orgId: null, note: "", ref: "", expiresAt: null, disabled: false }, c, { id: id(), createdAt: now() });
      codes.set(doc.id, doc); return out(doc);
    },
    async getCode(i) { return out(codes.get(i) || null); },
    async getCodeByCode(code) { for (const x of codes.values()) if (x.code === code) return out(x); return null; },
    async getCodeByRef(ref) { if (!ref) return null; for (const x of codes.values()) if (x.ref === ref) return out(x); return null; },
    async claimCode(code) {
      for (const x of codes.values()) {
        if (x.code !== code) continue;
        if (x.disabled || (x.expiresAt && x.expiresAt <= now()) || x.uses >= x.maxUses) return null;
        x.uses += 1; return out(x);
      }
      return null;
    },
    async releaseCode(i) { const x = codes.get(i); if (x && x.uses > 0) x.uses -= 1; },
    async updateCode(i, patch) { const x = codes.get(i); if (!x) return null; Object.assign(x, patch); return out(x); },
    async listCodes(o) { o = o || {}; let a = [...codes.values()]; if (o.orgId !== undefined) a = a.filter((x) => x.orgId === o.orgId); a.sort((x, y) => y.createdAt - x.createdAt); return out(a.slice(0, o.limit || 500)); },
    async deleteCode(i) { codes.delete(i); },
    /* organisations */
    async createOrg(o) { const doc = Object.assign({ seats: 1, joinCodeId: null, ref: "" }, o, { id: id(), createdAt: now() }); orgs.set(doc.id, doc); return out(doc); },
    async getOrg(i) { return out(orgs.get(i) || null); },
    async updateOrg(i, patch) { const o = orgs.get(i); if (!o) return null; Object.assign(o, patch); return out(o); },
    async listOrgs() { return out([...orgs.values()].sort((x, y) => y.createdAt - x.createdAt)); },
    async deleteOrg(i) { orgs.delete(i); },
    /* per-user key/value store (progress, notes, tool entries). Values are kept as JSON text. */
    async kvAll(u) { const m = kv.get(u), r = {}; if (m) for (const [k, v] of m) r[k] = JSON.parse(v.j); return r; },
    async kvSet(u, k, value) { if (!kv.has(u)) kv.set(u, new Map()); kv.get(u).set(k, { j: JSON.stringify(value), t: now() }); },
    async kvDel(u, k) { const m = kv.get(u); if (m) m.delete(k); },
    async kvDelAll(u) { kv.delete(u); },
    async kvCount(u) { const m = kv.get(u); return m ? m.size : 0; },
    async kvHas(u, k) { const m = kv.get(u); return !!(m && m.has(k)); },
    async kvMany(userIds, keys) { const r = {}; userIds.forEach((u) => { r[u] = {}; const m = kv.get(u); if (m) keys.forEach((k) => { if (m.has(k)) r[u][k] = JSON.parse(m.get(k).j); }); }); return r; },
    async kvLastUpdated(userIds) { const r = {}; userIds.forEach((u) => { const m = kv.get(u); let t = 0; if (m) for (const v of m.values()) if (v.t > t) t = v.t; r[u] = t || null; }); return r; }
  };
}
module.exports = { createMemoryDb };
