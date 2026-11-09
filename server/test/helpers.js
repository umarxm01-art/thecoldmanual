"use strict";
const fs = require("fs"), os = require("os"), path = require("path");
const { buildConfig } = require("../src/config");
const { createMemoryDb } = require("../src/db/memory");
const { createDispatcher } = require("../src/http/dispatch");
const { loadContent } = require("../src/content");

const FIXTURE = {
  P: [{ id: 1, title: "Foundations", sub: "s", blurb: "b" }, { id: 3, title: "Cold Calling", sub: "s", blurb: "b" }],
  L: [{ id: "1.1", p: 1, n: 1, t: "Math" }, { id: "3.1", p: 3, n: 1, t: "First ten seconds" }, { id: "3.2", p: 3, n: 2, t: "Openers" }, { id: "8.2", p: 8, n: 2, t: "Ladder" }],
  PB: [{ id: "a" }], OBJ: [{}, {}], NICHES: [{ id: "n" }], TOOLS: [{ key: "funnel", title: "Funnel", desc: "d" }],
  TRACK: { days: [{ d: 1, t: "Know your numbers", goal: "g", tasks: [{ k: "l", id: "1.1" }, { k: "c", t: "manual" }], out: { k: "goal", l: "Goal" } }, { d: 2, t: "Pick", goal: "g", tasks: [{ k: "t", id: "funnel" }] }], checkpoints: [{ day: 1, id: "offer", rule: { outs: ["goal"] } }, { day: 2, id: "client", rule: { flag: "client" } }] },
  RP: [{ id: "owner-call", title: "Owner call", beats: [{ p: "x", opts: [{ tag: "Opening", s: 2 }, { tag: "Questions", s: 1 }, { tag: "Value", s: 0 }] }] }]
};
function setup(over) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "osi-")), "content.json"); fs.writeFileSync(file, JSON.stringify(FIXTURE));
  let t = 1700000000000; const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const cfg = Object.assign(buildConfig({ NODE_ENV: "test", SESSION_SECRET: "x".repeat(40), WEBHOOK_SECRET: "hook-secret" }), over || {});
  const db = createMemoryDb(clock.now), d = createDispatcher({ db, cfg, content: loadContent(file), now: clock.now });
  let n = 0;
  async function call(method, url, body, opt) {
    opt = opt || {}; const headers = { "x-requested-with": "osi" };
    if (opt.cookie) headers.cookie = opt.cookie; if (opt.headers) Object.assign(headers, opt.headers); if (opt.noCsrf) delete headers["x-requested-with"];
    const r = await d.handle({ method, url, headers, ip: opt.ip || "10.0.0." + (opt.ipn || 1), body: body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body) });
    let json = null; try { json = JSON.parse(r.body); } catch (e) { /* not json */ }
    const sc = (r.cookies || []).filter((c) => c.startsWith(cfg.cookieName + "="))[0];
    return { status: r.status, json, text: r.body, headers: r.headers, cookie: sc ? sc.split(";")[0] : null, setCookie: sc || null };
  }
  async function admin() {
    await db.createUser({ email: "admin@x.com", name: "Admin", passHash: await require("../src/util/crypto").hashPassword("adminpassword1"), role: "admin" });
    const r = await call("POST", "/api/auth/login", { email: "admin@x.com", password: "adminpassword1" }); return r.cookie;
  }
  async function member(email, code, extra) {
    const r = await call("POST", "/api/auth/register", Object.assign({ email, name: email.split("@")[0], password: "password-12345", code }, extra || {}), { ipn: ++n + 100 });
    return r;
  }
  return { db, cfg, call, admin, member, clock, d };
}
module.exports = { setup, FIXTURE };
