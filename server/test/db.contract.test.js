"use strict";
/* Runs the same checks against every repository. The Mongo run needs a database:  MONGODB_URI=mongodb://127.0.0.1:27017/osi-test npm run test:db  (it empties that database first). */
const test = require("node:test"), assert = require("node:assert");

const targets = [["memory", async () => require("../src/db/memory").createMemoryDb()]];
if (process.env.MONGODB_URI) targets.push(["mongo", async () => { const db = await require("../src/db/mongo").createMongoDb(process.env.MONGODB_URI); await require("mongoose").connection; return db; }]);

for (const [name, make] of targets) {
  test(name + ": users", async () => {
    const db = await make();
    const u = await db.createUser({ email: "A@X.com", name: "Ann", passHash: "h", role: "member" });
    assert.equal(u.email, "a@x.com"); assert.ok(u.id); assert.equal(u.tokenVersion, 0); assert.equal(u.disabled, false);
    await assert.rejects(db.createUser({ email: "a@x.com", name: "Dup", passHash: "h" }), (e) => e.code === "DUPLICATE");
    assert.equal((await db.getUserByEmail("A@x.COM")).id, u.id); assert.equal(await db.getUser("nope"), null);
    assert.equal((await db.updateUser(u.id, { name: "Anne", tokenVersion: 2 })).name, "Anne");
    await db.createUser({ email: "b@x.com", name: "Bob", passHash: "h", role: "manager", orgId: "o1" });
    assert.equal((await db.listUsers({ q: "ann" })).total, 1); assert.equal((await db.listUsers({ role: "manager" })).items[0].email, "b@x.com");
    assert.equal((await db.listUsers({ orgId: "o1" })).total, 1); assert.equal((await db.listUsers({ orgId: null })).total, 1);
    assert.equal((await db.listUsers({ limit: 1 })).items.length, 1);
    await db.deleteUser(u.id); assert.equal(await db.getUser(u.id), null); await db.close();
  });
  test(name + ": codes are claimed atomically and can be released", async () => {
    const db = await make();
    await db.createCode({ code: "C1", maxUses: 3 });
    await assert.rejects(db.createCode({ code: "C1" }), (e) => e.code === "DUPLICATE");
    const r = await Promise.all(Array.from({ length: 10 }, () => db.claimCode("C1")));
    assert.equal(r.filter(Boolean).length, 3, "exactly maxUses claims win");
    assert.equal((await db.getCodeByCode("C1")).uses, 3);
    await db.releaseCode((await db.getCodeByCode("C1")).id); assert.equal((await db.getCodeByCode("C1")).uses, 2);
    assert.ok(await db.claimCode("C1")); assert.equal(await db.claimCode("C1"), null); assert.equal(await db.claimCode("MISSING"), null);
    const c2 = await db.createCode({ code: "C2", maxUses: 5, expiresAt: Date.now() - 1000 }); assert.equal(await db.claimCode("C2"), null);
    await db.updateCode(c2.id, { expiresAt: null, disabled: true }); assert.equal(await db.claimCode("C2"), null);
    await db.updateCode(c2.id, { disabled: false }); assert.ok(await db.claimCode("C2"));
    await db.releaseCode(c2.id); await db.releaseCode(c2.id); assert.equal((await db.getCode(c2.id)).uses, 0, "uses never goes below zero");
    await db.createCode({ code: "C3", ref: "pay_9" }); assert.equal((await db.getCodeByRef("pay_9")).code, "C3"); assert.equal(await db.getCodeByRef(""), null);
    await db.createCode({ code: "C4", orgId: "o9" }); assert.equal((await db.listCodes({ orgId: "o9" })).length, 1);
    await db.deleteCode((await db.getCodeByCode("C4")).id); assert.equal(await db.getCodeByCode("C4"), null); await db.close();
  });
  test(name + ": organisations", async () => {
    const db = await make(), o = await db.createOrg({ name: "Acme", seats: 5 });
    assert.equal((await db.getOrg(o.id)).seats, 5); assert.equal((await db.updateOrg(o.id, { seats: 8, joinCodeId: "x" })).seats, 8);
    assert.equal((await db.listOrgs()).length, 1); await db.deleteOrg(o.id); assert.equal(await db.getOrg(o.id), null); await db.close();
  });
  test(name + ": key/value store keeps dotted keys and is isolated per user", async () => {
    const db = await make();
    await db.kvSet("u1", "done", { "1.1": 123, "3.2": 456 }); await db.kvSet("u1", "quiz", { "1.1": 0.5 }); await db.kvSet("u2", "done", { "1.1": 1 });
    assert.deepEqual(await db.kvAll("u1"), { done: { "1.1": 123, "3.2": 456 }, quiz: { "1.1": 0.5 } });
    await db.kvSet("u1", "done", { "1.1": 9 }); assert.deepEqual((await db.kvAll("u1")).done, { "1.1": 9 }); assert.equal(await db.kvCount("u1"), 2);
    assert.equal(await db.kvHas("u1", "quiz"), true); assert.equal(await db.kvHas("u1", "nope"), false);
    const many = await db.kvMany(["u1", "u2", "u3"], ["done", "quiz"]); assert.deepEqual(many.u2, { done: { "1.1": 1 } }); assert.deepEqual(many.u3, {});
    const t = await db.kvLastUpdated(["u1", "u3"]); assert.ok(t.u1 > 0); assert.equal(t.u3, null);
    await db.kvDel("u1", "quiz"); assert.equal(await db.kvCount("u1"), 1); await db.kvDelAll("u1"); assert.equal(await db.kvCount("u1"), 0); assert.equal(await db.kvCount("u2"), 1);
    await db.kvSet("u2", "t_funnel", { goal: 4, nested: { "a.b": [1, 2] } }); assert.deepEqual((await db.kvAll("u2")).t_funnel, { goal: 4, nested: { "a.b": [1, 2] } });
    await db.close();
  });
}
