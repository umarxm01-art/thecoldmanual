"use strict";
const test = require("node:test"), assert = require("node:assert");
const { setup } = require("./helpers");
const C = require("../src/util/crypto");

async function userWithCode(t, email, opts) {
  const ck = await t.admin();
  const c = await t.call("POST", "/api/admin/codes", Object.assign({ count: 1 }, opts || {}), { cookie: ck });
  const r = await t.member(email, c.json.codes[0].code);
  return { ck, code: c.json.codes[0], r, cookie: r.cookie };
}

test("register needs a valid, unused code and sets a session cookie", async () => {
  const t = setup(), ck = await t.admin();
  assert.equal((await t.member("a@x.com", "")).status, 400);
  assert.equal((await t.member("a@x.com", "NOPE")).status, 400);
  const bad = await t.call("POST", "/api/auth/register", { email: "not-an-email", name: "A", password: "password-12345", code: "X" });
  assert.equal(bad.status, 400);
  const short = await t.call("POST", "/api/auth/register", { email: "a@x.com", name: "A", password: "short", code: "X" });
  assert.match(short.json.error, /10 characters/);
  const c = (await t.call("POST", "/api/admin/codes", { count: 1 }, { cookie: ck })).json.codes[0];
  const ok = await t.member("a@x.com", c.code.toLowerCase());
  assert.equal(ok.status, 201); assert.equal(ok.json.user.role, "member"); assert.ok(ok.cookie);
  assert.match(ok.setCookie, /HttpOnly/); assert.match(ok.setCookie, /SameSite=Lax/);
  assert.ok(!JSON.stringify(ok.json).includes("passHash"));
  assert.equal((await t.member("b@x.com", c.code)).status, 400, "single-use code is used up");
  const me = await t.call("GET", "/api/auth/me", undefined, { cookie: ok.cookie });
  assert.equal(me.json.user.email, "a@x.com");
});

test("a code is given back when registration fails", async () => {
  const t = setup(), ck = await t.admin();
  const c = (await t.call("POST", "/api/admin/codes", { count: 1 }, { cookie: ck })).json.codes[0];
  assert.equal((await t.member("a@x.com", c.code)).status, 201);
  const c2 = (await t.call("POST", "/api/admin/codes", { count: 1 }, { cookie: ck })).json.codes[0];
  assert.equal((await t.member("a@x.com", c2.code)).status, 409, "duplicate email");
  const after = (await t.call("GET", "/api/admin/codes", undefined, { cookie: ck })).json.codes.find((x) => x.id === c2.id);
  assert.equal(after.uses, 0);
  assert.equal((await t.member("c@x.com", c2.code)).status, 201);
});

test("login, wrong password, disabled account, and rate limit", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com");
  const bad = await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "wrong-password" });
  assert.equal(bad.status, 401); assert.equal(bad.json.error, (await t.call("POST", "/api/auth/login", { email: "nobody@x.com", password: "wrong-password" })).json.error);
  assert.equal((await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "password-12345" })).status, 200);
  const id = u.r.json.user.id;
  await t.call("PATCH", "/api/admin/users/" + id, { disabled: true }, { cookie: u.ck });
  assert.equal((await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "password-12345" })).status, 403);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: u.cookie })).status, 401, "existing session is cut off");
  let last; for (let i = 0; i < 12; i++) last = await t.call("POST", "/api/auth/login", { email: "z@x.com", password: "x" }, { ipn: 99 });
  assert.equal(last.status, 429); assert.ok(last.headers["Retry-After"]);
});

test("mutating requests need the CSRF header; bad JSON is rejected", async () => {
  const t = setup();
  assert.equal((await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "x" }, { noCsrf: true })).status, 403);
  assert.equal((await t.call("POST", "/api/auth/login", "{not json")).status, 400);
  assert.equal((await t.call("POST", "/api/auth/login", "[1]")).status, 400);
  assert.equal((await t.call("GET", "/api/nope")).status, 404);
  assert.equal((await t.call("DELETE", "/api/auth/me")).status, 405);
});

test("sessions: tampered, expired and signed-out tokens are refused", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com");
  const tok = u.cookie.split("=")[1];
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: "osi_token=" + tok.slice(0, -2) + "xx" })).status, 401);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: "osi_token=garbage" })).status, 401);
  const out = await t.call("POST", "/api/auth/logout-all", {}, { cookie: u.cookie });
  assert.equal(out.status, 200); assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: u.cookie })).status, 401);
  const re = await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "password-12345" });
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: re.cookie })).status, 200);
  t.clock.advance(31 * 86400 * 1000);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: re.cookie })).status, 401, "30 day expiry");
});

test("changing the password signs other devices out and keeps this one", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com");
  const other = await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "password-12345" });
  assert.equal((await t.call("POST", "/api/auth/password", { current: "nope", next: "another-pass-123" }, { cookie: u.cookie })).status, 400);
  assert.equal((await t.call("POST", "/api/auth/password", { current: "password-12345", next: "short" }, { cookie: u.cookie })).status, 400);
  const ch = await t.call("POST", "/api/auth/password", { current: "password-12345", next: "another-pass-123" }, { cookie: u.cookie });
  assert.equal(ch.status, 200);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: other.cookie })).status, 401);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: ch.cookie })).status, 200);
  assert.equal((await t.call("POST", "/api/auth/login", { email: "a@x.com", password: "another-pass-123" })).status, 200);
});

test("kv store: save, read, delete, limits, reset", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com"), o = { cookie: u.cookie };
  assert.equal((await t.call("GET", "/api/kv")).status, 401);
  assert.equal((await t.call("PUT", "/api/kv/done", { value: { "1.1": 123 } }, o)).status, 200);
  assert.deepEqual((await t.call("GET", "/api/kv", undefined, o)).json.data, { done: { "1.1": 123 } });
  assert.equal((await t.call("PUT", "/api/kv/Bad-Key", { value: 1 }, o)).status, 400);
  assert.equal((await t.call("PUT", "/api/kv/x", {}, o)).status, 400);
  assert.equal((await t.call("PUT", "/api/kv/big", { value: "x".repeat(1025 * 1024) }, o)).status, 413);
  for (let i = 0; i < 199; i++) await t.db.kvSet(u.r.json.user.id, "k" + i, 1);
  assert.equal((await t.call("PUT", "/api/kv/extra", { value: 1 }, o)).status, 409);
  assert.equal((await t.call("PUT", "/api/kv/done", { value: { "1.1": 2 } }, o)).status, 200, "updating an existing key is fine at the cap");
  assert.equal((await t.call("DELETE", "/api/kv/k1", undefined, o)).status, 200);
  assert.equal((await t.call("POST", "/api/kv/reset", {}, o)).status, 400);
  assert.equal((await t.call("POST", "/api/kv/reset", { confirm: "RESET" }, o)).status, 200);
  assert.deepEqual((await t.call("GET", "/api/kv", undefined, o)).json.data, {});
});

test("users cannot read each other's data", async () => {
  const t = setup(), a = await userWithCode(t, "a@x.com");
  const c = (await t.call("POST", "/api/admin/codes", { count: 1 }, { cookie: a.ck })).json.codes[0], b = await t.member("b@x.com", c.code);
  await t.call("PUT", "/api/kv/notes", { value: { x: "secret" } }, { cookie: a.cookie });
  assert.deepEqual((await t.call("GET", "/api/kv", undefined, { cookie: b.cookie })).json.data, {});
});

test("content is gated and cacheable", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com");
  assert.equal((await t.call("GET", "/api/content")).status, 401);
  const r = await t.call("GET", "/api/content", undefined, { cookie: u.cookie }); assert.equal(r.status, 200); assert.equal(r.json.L.length, 4);
  const again = await t.call("GET", "/api/content", undefined, { cookie: u.cookie, headers: { "if-none-match": r.headers.ETag } }); assert.equal(again.status, 304);
  const meta = await t.call("GET", "/api/public/meta"); assert.equal(meta.json.counts.lessons, 4); assert.ok(!meta.text.includes("First ten seconds"), "public meta never leaks lesson text");
});

test("role checks: members cannot use admin or manager routes", async () => {
  const t = setup(), u = await userWithCode(t, "a@x.com"), o = { cookie: u.cookie };
  for (const [m, p] of [["GET", "/api/admin/stats"], ["GET", "/api/admin/users"], ["POST", "/api/admin/codes"], ["GET", "/api/admin/orgs"]]) assert.equal((await t.call(m, p, m === "POST" ? {} : undefined, o)).status, 403, p);
  assert.equal((await t.call("GET", "/api/org", undefined, o)).status, 403);
  assert.equal((await t.call("GET", "/api/admin/stats")).status, 401);
});

test("admin: codes, users, stats", async () => {
  const t = setup(), ck = await t.admin(), o = { cookie: ck };
  const made = await t.call("POST", "/api/admin/codes", { count: 3, maxUses: 5, note: "launch" }, o); assert.equal(made.json.codes.length, 3);
  assert.match(made.json.codes[0].code, /^OSI-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal((await t.call("POST", "/api/admin/codes", { count: 1, expiresAt: "2001-01-01" }, o)).status, 400);
  const id = made.json.codes[0].id;
  assert.equal((await t.call("PATCH", "/api/admin/codes/" + id, { disabled: true }, o)).json.code.disabled, true);
  assert.equal((await t.member("a@x.com", made.json.codes[0].code)).status, 400, "disabled code");
  await t.member("b@x.com", made.json.codes[1].code);
  assert.equal((await t.call("PATCH", "/api/admin/codes/" + made.json.codes[1].id, { maxUses: 0 }, o)).status, 400);
  const st = await t.call("GET", "/api/admin/stats", undefined, o); assert.equal(st.json.users, 2); assert.equal(st.json.admins, 1);
  const list = await t.call("GET", "/api/admin/users?q=b@x", undefined, o); assert.equal(list.json.users.length, 1);
  const uid = list.json.users[0].id;
  const rp = await t.call("POST", "/api/admin/users/" + uid + "/reset-password", {}, o);
  const li = await t.call("POST", "/api/auth/login", { email: "b@x.com", password: rp.json.tempPassword });
  assert.equal(li.status, 200); assert.equal(li.json.user.mustChangePassword, true, "temp password forces a new one");
  const cp = await t.call("POST", "/api/auth/password", { current: rp.json.tempPassword, next: "my-own-password-1" }, { cookie: li.cookie });
  assert.equal(cp.status, 200);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: cp.cookie })).json.user.mustChangePassword, false, "cleared once they pick their own");
  assert.equal((await t.call("DELETE", "/api/admin/users/" + uid, undefined, o)).status, 200);
  assert.equal((await t.call("PATCH", "/api/admin/users/" + (await t.db.getUserByEmail("admin@x.com")).id, { disabled: true }, o)).status, 400, "cannot disable yourself");
});

async function teamSetup(t, seats, email) {
  const ck = await t.admin(), o = { cookie: ck };
  const r = await t.call("POST", "/api/admin/orgs", { name: "Acme Sales", seats, managerEmail: email || "boss@acme.com" }, o);
  assert.equal(r.status, 201); return { ck, o, org: r.json.org, joinCode: r.json.joinCode, managerCode: r.json.managerCode };
}

test("teams: manager code, join code, consent, seats", async () => {
  const t = setup(), tm = await teamSetup(t, 2);
  assert.ok(tm.managerCode && tm.joinCode);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true }); assert.equal(boss.json.user.role, "manager");
  const noConsent = await t.member("s1@acme.com", tm.joinCode); assert.equal(noConsent.status, 400); assert.match(noConsent.json.error, /manager can see/);
  assert.equal((await t.member("s1@acme.com", tm.joinCode, { teamConsent: true })).status, 201);
  assert.equal((await t.member("s2@acme.com", tm.joinCode, { teamConsent: true })).status, 201);
  assert.equal((await t.member("s3@acme.com", tm.joinCode, { teamConsent: true })).status, 400, "no seats left");
  const ov = await t.call("GET", "/api/org", undefined, { cookie: boss.cookie });
  assert.equal(ov.json.summary.members, 2); assert.equal(ov.json.summary.seatsLeft, 0); assert.equal(ov.json.joinCode.code, tm.joinCode);
  assert.equal((await t.call("PATCH", "/api/admin/orgs/" + tm.org.id, { seats: 1 }, tm.o)).status, 409);
  assert.equal((await t.call("PATCH", "/api/admin/orgs/" + tm.org.id, { seats: 3 }, tm.o)).status, 200);
  assert.equal((await t.member("s3@acme.com", tm.joinCode, { teamConsent: true })).status, 201);
});

test("teams: an existing account can be made manager", async () => {
  const t = setup(), u = await userWithCode(t, "boss@acme.com");
  const r = await t.call("POST", "/api/admin/orgs", { name: "Acme", seats: 5, managerEmail: "boss@acme.com" }, { cookie: u.ck });
  assert.equal(r.json.managerAssigned, true); assert.equal(r.json.managerCode, null);
  assert.equal((await t.call("GET", "/api/org", undefined, { cookie: u.cookie })).status, 200);
  assert.equal((await t.call("POST", "/api/admin/orgs", { name: "Other", seats: 5, managerEmail: "boss@acme.com" }, { cookie: u.ck })).status, 409, "already in a team");
});

test("team dashboard shows progress, skills and exports CSV safely", async () => {
  const t = setup(), tm = await teamSetup(t, 5);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true });
  const s1 = await t.member("=cmd@acme.com", tm.joinCode, { teamConsent: true, name: "=HYPERLINK(1)" });
  const s2 = await t.member("s2@acme.com", tm.joinCode, { teamConsent: true });
  const put = (c, k, v) => t.call("PUT", "/api/kv/" + k, { value: v }, { cookie: c });
  await put(s1.cookie, "done", { "1.1": 1, "3.1": 1 }); await put(s1.cookie, "quiz", { "1.1": 1, "3.1": 0.5 });
  await put(s1.cookie, "pl", { at: 5, scores: { Opening: 90, Questions: 30, Objections: 50, "Next step": 60, Value: 70, Tone: 80 } });
  await put(s1.cookie, "rp", { "owner-call": { best: 100, runs: 2, last: 80, tags: { Opening: 100, Questions: 50 } } });
  const ov = (await t.call("GET", "/api/org", undefined, { cookie: boss.cookie })).json;
  const row = ov.members.find((m) => m.id === s1.json.user.id);
  assert.equal(row.done, 2); assert.equal(row.total, 4); assert.equal(row.pct, 50); assert.equal(row.avgQuiz, 75); assert.equal(row.rpRuns, 2); assert.equal(row.placement, true);
  assert.equal(row.skills.Opening, 88); // (90*2 + 100*3 + 50*1) / 6
  assert.equal(ov.summary.placementTaken, 1); assert.equal(ov.summary.weakestSkill, "Questions");
  const other = ov.members.find((m) => m.id === s2.json.user.id); assert.equal(other.done, 0); assert.equal(other.skills.Opening, null);
  const det = await t.call("GET", "/api/org/members/" + s1.json.user.id, undefined, { cookie: boss.cookie });
  assert.equal(det.status, 200); assert.equal(det.json.programs.find((p) => p.id === 1).done, 1); assert.ok(!JSON.stringify(det.json).includes("passHash"));
  const csv = await t.call("GET", "/api/org/export", undefined, { cookie: boss.cookie });
  assert.match(csv.headers["Content-Type"], /text\/csv/); assert.match(csv.headers["Content-Disposition"], /attachment/);
  assert.ok(csv.text.includes("'=HYPERLINK(1)"), "formula injection guarded"); assert.ok(csv.text.split("\r\n")[0].startsWith("Name,Email"));
});

test("team dashboard shows drill and sprint numbers but never sprint notes", async () => {
  const t = setup(), tm = await teamSetup(t, 5);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true });
  const s1 = await t.member("s1@acme.com", tm.joinCode, { teamConsent: true });
  const put = (c, k, v) => t.call("PUT", "/api/kv/" + k, { value: v }, { cookie: c });
  /* dates come from the test clock in local time, so the test works in any time zone; every day is a working day */
  const iso = (d) => d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2), today = new Date(t.clock.now()), yday = new Date(today.getTime() - 86400000);
  await put(s1.cookie, "t_sprint", { start: iso(yday), days: "7", t: { dials: 10, emails: 10 }, log: { [iso(yday)]: { dials: 10, emails: 10, convos: 4, booked: 1, note: "SECRET-NOTE-123" }, [iso(today)]: { dials: 6, emails: 4, booked: 1 } } });
  await put(s1.cookie, "dr", { "r-opener": { last: 70, best: 80, runs: 2 }, "p-who": { last: 90, best: 90, runs: 1 } });
  const ov = (await t.call("GET", "/api/org", undefined, { cookie: boss.cookie })).json, row = ov.members.find((m) => m.id === s1.json.user.id);
  assert.equal(row.drillAvg, 80); assert.equal(row.drillRuns, 3);
  assert.equal(row.sprint.day, 2); assert.equal(row.sprint.touches, 30); assert.equal(row.sprint.pct, 75); assert.equal(row.sprint.booked, 2); assert.equal(row.sprint.hits, 1);
  assert.equal(ov.summary.sprinting, 1); assert.equal(ov.summary.sprintBooked, 2);
  assert.ok(!JSON.stringify(ov).includes("SECRET-NOTE"), "overview has no notes");
  const det = (await t.call("GET", "/api/org/members/" + s1.json.user.id, undefined, { cookie: boss.cookie })).json;
  assert.equal(det.stats.sprint.convos, 4); assert.equal(det.skills.parts.Tone.drills, 80); assert.ok(!JSON.stringify(det).includes("SECRET-NOTE"), "detail has no notes");
  const csv = (await t.call("GET", "/api/org/export", undefined, { cookie: boss.cookie })).text;
  assert.ok(csv.split("\r\n")[0].includes("Sprint meetings booked")); assert.ok(!csv.includes("SECRET-NOTE"), "CSV has no notes");
});

test("teams are isolated from each other", async () => {
  const t = setup(), a = await teamSetup(t, 3, "boss-a@x.com"), ck = a.ck;
  const b = (await t.call("POST", "/api/admin/orgs", { name: "Beta", seats: 3, managerEmail: "boss-b@x.com" }, { cookie: ck })).json;
  const bossA = await t.member("boss-a@x.com", a.managerCode, { teamConsent: true }), bossB = await t.member("boss-b@x.com", b.managerCode, { teamConsent: true });
  const sB = await t.member("sb@x.com", b.joinCode, { teamConsent: true });
  assert.equal((await t.call("GET", "/api/org/members/" + sB.json.user.id, undefined, { cookie: bossA.cookie })).status, 404);
  assert.equal((await t.call("DELETE", "/api/org/members/" + sB.json.user.id, undefined, { cookie: bossA.cookie })).status, 404);
  assert.equal((await t.call("GET", "/api/org", undefined, { cookie: bossB.cookie })).json.members.length, 1);
  assert.equal((await t.call("GET", "/api/org", undefined, { cookie: bossA.cookie })).json.members.length, 0);
});

test("removing a member or leaving frees the seat; rotate gives a fresh code", async () => {
  const t = setup(), tm = await teamSetup(t, 1);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true });
  const s1 = await t.member("s1@acme.com", tm.joinCode, { teamConsent: true });
  assert.equal((await t.member("s2@acme.com", tm.joinCode, { teamConsent: true })).status, 400);
  assert.equal((await t.call("DELETE", "/api/org/members/" + s1.json.user.id, undefined, { cookie: boss.cookie })).status, 200);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: s1.cookie })).json.user.orgId, null, "removed member keeps their account");
  const s2 = await t.member("s2@acme.com", tm.joinCode, { teamConsent: true }); assert.equal(s2.status, 201);
  assert.equal((await t.call("POST", "/api/auth/leave-team", {}, { cookie: s2.cookie })).status, 200);
  const rot = await t.call("POST", "/api/org/code/rotate", {}, { cookie: boss.cookie }); assert.notEqual(rot.json.code, tm.joinCode);
  assert.equal((await t.member("old@acme.com", tm.joinCode, { teamConsent: true })).status, 400, "old code is dead");
  assert.equal((await t.member("new@acme.com", rot.json.code, { teamConsent: true })).status, 201);
  assert.equal((await t.call("POST", "/api/auth/leave-team", {}, { cookie: boss.cookie })).status, 400, "managers cannot leave");
});

test("deleting a team unlinks everyone", async () => {
  const t = setup(), tm = await teamSetup(t, 3);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true }), s = await t.member("s@acme.com", tm.joinCode, { teamConsent: true });
  assert.equal((await t.call("DELETE", "/api/admin/orgs/" + tm.org.id, undefined, tm.o)).status, 200);
  const me = (await t.call("GET", "/api/auth/me", undefined, { cookie: boss.cookie })).json.user; assert.equal(me.role, "member"); assert.equal(me.orgId, null);
  assert.equal((await t.call("GET", "/api/org", undefined, { cookie: boss.cookie })).status, 403);
  assert.equal((await t.member("late@acme.com", tm.joinCode, { teamConsent: true })).status, 400);
  assert.equal((await t.call("GET", "/api/auth/me", undefined, { cookie: s.cookie })).json.user.orgId, null);
});

test("payment webhook: secret, idempotency, individual and team", async () => {
  const t = setup();
  const h = { headers: { "x-webhook-secret": "hook-secret" }, noCsrf: true };
  assert.equal((await t.call("POST", "/api/webhooks/payment", { email: "b@x.com" }, { noCsrf: true })).status, 401);
  assert.equal((await t.call("POST", "/api/webhooks/payment", { email: "b@x.com" }, { noCsrf: true, headers: { "x-webhook-secret": "nope" } })).status, 401);
  const one = await t.call("POST", "/api/webhooks/payment", { email: "b@x.com", reference: "pay_1" }, h); assert.equal(one.status, 201);
  const again = await t.call("POST", "/api/webhooks/payment", { email: "b@x.com", reference: "pay_1" }, h); assert.equal(again.json.code, one.json.code); assert.equal(again.json.repeated, true);
  assert.equal((await t.member("buyer@x.com", one.json.code)).status, 201);
  const team = await t.call("POST", "/api/webhooks/payment", { email: "hr@corp.com", plan: "team", seats: 4, orgName: "Corp", reference: "pay_2" }, h);
  assert.equal(team.status, 201); assert.ok(team.json.joinCode && team.json.managerCode);
  const rep = await t.call("POST", "/api/webhooks/payment", { email: "hr@corp.com", plan: "team", seats: 4, orgName: "Corp", reference: "pay_2" }, h);
  assert.equal(rep.json.joinCode, team.json.joinCode); assert.equal(rep.json.managerCode, team.json.managerCode);
  assert.equal((await t.call("POST", "/api/webhooks/payment", { email: "hr@corp.com", plan: "team", seats: 0 }, h)).status, 400);
  const off = setup({ webhookSecret: "" }); assert.equal((await off.call("POST", "/api/webhooks/payment", { email: "b@x.com" }, { noCsrf: true, headers: { "x-webhook-secret": "x" } })).status, 404);
});

test("passwords are stored hashed and compared safely", async () => {
  const h = await C.hashPassword("correct horse battery"); assert.ok(h.startsWith("scrypt$")); assert.ok(!h.includes("correct"));
  assert.equal(await C.verifyPassword("correct horse battery", h), true); assert.equal(await C.verifyPassword("wrong", h), false); assert.equal(await C.verifyPassword("x", "garbage"), false);
});

test("team dashboard shows track progress but never the member's track answers", async () => {
  const t = setup(), tm = await teamSetup(t, 5);
  const boss = await t.member("boss@acme.com", tm.managerCode, { teamConsent: true });
  const s1 = await t.member("s1@acme.com", tm.joinCode, { teamConsent: true });
  const put = (c, k, v) => t.call("PUT", "/api/kv/" + k, { value: v }, { cookie: c });
  const d = new Date(t.clock.now()), today = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  await put(s1.cookie, "trk", { start: today, tick: { "1.1": 1 }, out: { goal: "SECRET-GOAL-42" }, flag: { client: true } });
  await put(s1.cookie, "done", { "1.1": 1 }); await put(s1.cookie, "t_funnel", { goal: 2, note: "SECRET-TOOL" });
  const ov = (await t.call("GET", "/api/org", undefined, { cookie: boss.cookie })).json, row = ov.members.find((m) => m.id === s1.json.user.id);
  assert.deepEqual(row.track, { day: 1, doneDays: 2, total: 2, passed: 2, checkpoints: 2, behind: 0, client: true });
  const all = JSON.stringify(ov) + JSON.stringify((await t.call("GET", "/api/org/members/" + s1.json.user.id, undefined, { cookie: boss.cookie })).json) + (await t.call("GET", "/api/org/export", undefined, { cookie: boss.cookie })).text;
  assert.ok(!all.includes("SECRET-GOAL") && !all.includes("SECRET-TOOL"), "answers and tool entries stay private");
  assert.ok(all.includes("Track days complete"), "CSV has track columns");
});

test("1:1 call upsell: request, guard, admin queue, webhook payment, cancel", async () => {
  const t = setup(), ac = await t.admin();
  const code = (await t.call("POST", "/api/admin/codes", { count: 2 }, { cookie: ac })).json.codes;
  const m = (await t.member("m@x.com", code[0].code)).cookie, m2 = (await t.member("m2@x.com", code[1].code)).cookie;
  const off = await t.call("GET", "/api/offers", undefined, { cookie: m }); assert.equal(off.status, 200); assert.equal(off.json.call.enabled, true); assert.ok(off.json.call.price);
  const bad = await t.call("POST", "/api/offers/call", { offer: "x" }, { cookie: m }); assert.equal(bad.status, 400);
  const form = { offer: "AI answering for plumbers", stage: "outreach-no-calls", problem: "Owners hang up in the first seconds.", whatsapp: "+92 300 1234567", slot: "evening" };
  const r = await t.call("POST", "/api/offers/call", form, { cookie: m }); assert.equal(r.status, 201); assert.equal(r.json.request.status, "requested");
  assert.equal((await t.call("POST", "/api/offers/call", form, { cookie: m })).status, 409, "one open request at a time");
  assert.equal((await t.call("PUT", "/api/kv/adm_call", { value: { status: "done" } }, { cookie: m })).status, 403, "members cannot edit it");
  assert.equal((await t.call("DELETE", "/api/kv/adm_call", undefined, { cookie: m })).status, 403);
  assert.equal((await t.call("GET", "/api/admin/requests", undefined, { cookie: m })).status, 403);
  const list = await t.call("GET", "/api/admin/requests", undefined, { cookie: ac }); assert.equal(list.json.requests.length, 1); assert.equal(list.json.requests[0].email, "m@x.com");
  const h = { headers: { "x-webhook-secret": "hook-secret" }, noCsrf: true };
  const paid = await t.call("POST", "/api/webhooks/payment", { email: "m@x.com", product: "call", reference: "pay_c1" }, h); assert.equal(paid.json.changed, true);
  assert.equal((await t.call("GET", "/api/kv", undefined, { cookie: m })).json.data.adm_call.status, "paid");
  const uid = list.json.requests[0].uid;
  const p = await t.call("PATCH", "/api/admin/requests/" + uid, { status: "booked", when: "Tue 7pm", note: "See you then" }, { cookie: ac }); assert.equal(p.json.request.status, "booked"); assert.equal(p.json.request.when, "Tue 7pm");
  assert.equal((await t.call("POST", "/api/offers/call/cancel", {}, { cookie: m })).status, 409, "paid requests are not cancelled from the app");
  await t.call("POST", "/api/kv/reset", { confirm: "RESET" }, { cookie: m });
  assert.equal((await t.call("GET", "/api/kv", undefined, { cookie: m })).json.data.adm_call.status, "booked", "reset keeps the request");
  await t.call("POST", "/api/offers/call", form, { cookie: m2 });
  assert.equal((await t.call("POST", "/api/offers/call/cancel", {}, { cookie: m2 })).json.request.status, "cancelled");
  assert.equal((await t.call("GET", "/api/admin/requests?status=cancelled", undefined, { cookie: ac })).json.requests.length, 1);
});
