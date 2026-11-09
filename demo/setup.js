/* Browser-only demo of The Cold Manual.
   The real API code (server/src/http/dispatch.js and the handlers) runs in the page against the in-memory database,
   and window.fetch is routed to it. Nothing is sent anywhere. Everything resets when the page reloads. */
import contentJson from "../server/content/content.json";
const { buildConfig } = require("../server/src/config");
const { createMemoryDb } = require("../server/src/db/memory");
const { createDispatcher } = require("../server/src/http/dispatch");
const { seed } = require("../server/src/scripts/seed");

if (!globalThis.Buffer) globalThis.Buffer = { byteLength: (s) => new TextEncoder().encode(String(s)).length };

export const DEMO = { password: "demo-pass-123", admin: "admin@demo.test", manager: "boss@demo.test", member: "sara@demo.test", code: "OSI-PREVIEW" };

function makeContent(j) {
  const lessonIds = j.L.map((l) => l.id), lessonTitles = {}; j.L.forEach((l) => { lessonTitles[l.id] = l.t; });
  const scenarios = j.RP.map((s) => { const t = {}; s.beats.forEach((b) => b.opts.forEach((o) => { t[o.tag] = 1; })); return { id: s.id, title: s.title, tags: Object.keys(t) }; });
  const meta = {
    counts: { programs: j.P.length, lessons: j.L.length, playbooks: j.PB.length, objections: j.OBJ.length, tools: (j.TOOLS || []).length, niches: j.NICHES.length, scenarios: j.RP.length },
    programs: j.P.map((p) => ({ id: p.id, title: p.title, sub: p.sub, blurb: p.blurb, lessons: j.L.filter((l) => l.p === p.id).length })),
    tools: (j.TOOLS || []).map((t) => ({ title: t.title, desc: t.desc }))
  };
  const qa = j.QA || []; j = Object.assign({}, j); delete j.QA;
  return { qa, lessons: j.L, raw: JSON.stringify(j), etag: '"demo"', catalog: { lessonIds, lessonTitles, scenarios, track: j.TRACK && j.TRACK.days ? { days: j.TRACK.days, checkpoints: j.TRACK.checkpoints } : null }, meta };
}

const cfg = buildConfig({ NODE_ENV: "development", SESSION_SECRET: "demo-secret-demo-secret-demo-secret-0001", PREVIEW_CODE: DEMO.code, ADMIN_EMAIL: DEMO.admin, ADMIN_PASSWORD: DEMO.password, AI_PROVIDER: "sample" });
const db = createMemoryDb(), content = makeContent(contentJson), d = createDispatcher({ db, cfg, content });
let ipn = 0;
const nextIp = () => "10.9." + Math.floor(++ipn / 250) + "." + (ipn % 250);

function jarHeader(jar) { return Object.keys(jar).map((k) => k + "=" + jar[k]).join("; "); }
function takeCookies(jar, cookies) {
  (cookies || []).forEach((c) => { const first = c.split(";")[0], i = first.indexOf("="), k = first.slice(0, i), v = first.slice(i + 1); if (/Max-Age=0\b/i.test(c) || v === "") delete jar[k]; else jar[k] = v; });
}
async function raw(jar, method, url, body) {
  const headers = { "x-requested-with": "osi", "content-type": "application/json" }; const ch = jarHeader(jar); if (ch) headers.cookie = ch;
  const r = await d.handle({ method, url, headers, ip: nextIp(), body: body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body) });
  if (r) takeCookies(jar, r.cookies); return r;
}
async function call(jar, method, url, body) { const r = await raw(jar, method, url, body); let j = null; try { j = JSON.parse(r.body); } catch (e) { /* not json */ } if (r.status >= 400) throw new Error(method + " " + url + " " + r.status + " " + (j && j.error)); return j; }

/* ---- sample team with real progress, so the dashboards have something to show ---- */
function iso(dt) { return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
function sprint(daysAgo, scale, booked) {
  const t = { dials: 25, emails: 25, dms: 10, looms: 2, fu: 10 }, st = new Date(); st.setHours(0, 0, 0, 0); st.setDate(st.getDate() - daysAgo);
  const log = {}; for (let i = 0; i < daysAgo; i++) { const dt = new Date(st.getTime()); dt.setDate(dt.getDate() + i); if (dt.getDay() === 0) continue; const f = scale[i % scale.length];
    log[iso(dt)] = { dials: Math.round(25 * f), emails: Math.round(25 * f), dms: Math.round(10 * f), looms: f >= 1 ? 2 : 1, fu: Math.round(10 * f), convos: Math.round(4 * f), booked: booked[i % booked.length] }; }
  return { start: iso(st), preset: "starter", days: "6", t, log, sel: "", remind: "19:00", wa: "", past: [], started: true };
}
function lessons(ids, quizScore) { const done = {}, quiz = {}, now = Date.now(); ids.forEach((id, i) => { done[id] = now - (ids.length - i) * 3600000; quiz[id] = quizScore[i % quizScore.length]; }); return { done, quiz }; }
function placement(scores) { const PL = contentJson.PL; return { at: Date.now() - 6 * 86400000, scores, answers: PL.map((q, i) => (i % 4 ? q.a : (q.a + 1) % q.o.length)) }; }
const ALL = contentJson.L.map((l) => l.id);

async function seedDemo() {
  await seed(db, cfg, () => {});
  const admin = {}; await call(admin, "POST", "/api/auth/login", { email: DEMO.admin, password: DEMO.password });
  const team = await call(admin, "POST", "/api/admin/orgs", { name: "Acme Outreach", seats: 5, managerEmail: DEMO.manager });
  const boss = {}; await call(boss, "POST", "/api/auth/register", { name: "Bilal (Manager)", email: DEMO.manager, password: DEMO.password, code: team.managerCode, teamConsent: true });
  const people = [
    { name: "Sara Setter", email: DEMO.member, l: ALL.slice(0, 22), q: [1, 1, 0.5], pl: { Opening: 85, Questions: 60, Objections: 70, "Next step": 75, Value: 55, Tone: 65 }, rp: { "owner-call": { best: 90, runs: 3, last: 85, tags: { Opening: 100, Questions: 70, Tone: 80 } }, "email-brushoff": { best: 75, runs: 1, last: 75, tags: { Objections: 75, "Next step": 70 } } }, dr: { "r-opener": { last: 82, best: 86, runs: 4 }, "p-email": { last: 74, best: 74, runs: 2 } }, sp: sprint(9, [1.1, 1, 0.9, 1.2, 0.8, 1], [0, 1, 0, 1, 0, 0]), trk: { ago: 10, out: { goal: "1 client by day 30 at $500 a month", niche: "Plumbers with 3 to 10 trucks in Texas", offer: "We answer every after-hours call, so missed calls become booked jobs", leads: "140", opener: "Hi Dave, it's Sara. We haven't spoken. I'm calling because plumbers tell me they lose jobs after hours.", brushoff: "Happy to. So I send something useful, how many calls go to voicemail in a busy week?" } } },
    { name: "Ali Closer", email: "ali@demo.test", l: ALL.slice(0, 9).concat(["10.1", "10.2", "10.3"]), q: [1, 0.5], pl: { Opening: 55, Questions: 70, Objections: 80, "Next step": 60, Value: 75, Tone: 50 }, rp: { "price-think": { best: 70, runs: 2, last: 65, tags: { Objections: 70, Value: 60 } } }, dr: { "p-think": { last: 58, best: 63, runs: 3 } }, sp: sprint(6, [0.6, 0.7, 0.5, 0.8], [0, 0, 1, 0]), trk: { ago: 6, out: { goal: "2 clients this month", niche: "Roofers in Florida", offer: "Storm-season call answering for roofers" } } },
    { name: "Hina Khan", email: "hina@demo.test", l: ALL.slice(0, 4), q: [0.5, 0], pl: { Opening: 35, Questions: 40, Objections: 30, "Next step": 45, Value: 38, Tone: 42 }, rp: {}, dr: {}, sp: null }
  ];
  for (const p of people) {
    const jar = {}; await call(jar, "POST", "/api/auth/register", { name: p.name, email: p.email, password: DEMO.password, code: team.joinCode, teamConsent: true });
    const lq = lessons(p.l, p.q);
    const put = (k, v) => call(jar, "PUT", "/api/kv/" + k, { value: v });
    await put("done", lq.done); await put("quiz", lq.quiz); await put("pl", placement(p.pl));
    if (Object.keys(p.rp).length) await put("rp", p.rp);
    if (Object.keys(p.dr).length) await put("dr", p.dr);
    if (p.sp) await put("t_sprint", p.sp);
    if (p.trk) { const st = new Date(); st.setHours(0, 0, 0, 0); st.setDate(st.getDate() - p.trk.ago + 1); const tick = {}; for (let dd = 1; dd < p.trk.ago; dd++) tick[dd + ".0"] = tick[dd + ".1"] = tick[dd + ".2"] = tick[dd + ".3"] = 1;
      await put("trk", { start: iso(st), tick, out: p.trk.out, flag: {} }); }
    if (p.email === "ali@demo.test") await call(jar, "POST", "/api/offers/call", { offer: "Storm-season call answering for roofers in Florida", stage: "calls-no-closes", problem: "I get owners on calls but they say they'll think about it and go quiet.", goal: "A closing script I trust.", whatsapp: "+92 321 5550101", slot: "evening" });
  }
}
const ready = seedDemo().catch((e) => { console.error("Demo setup failed", e); });

/* ---- route the app's API calls to the in-page server ---- */
const browserJar = {}, realFetch = window.fetch.bind(window);
function apiPath(input) {
  const u = typeof input === "string" ? input : input && input.url; if (!u) return null;
  const url = new URL(u, window.location.href); if (url.origin !== window.location.origin) return null;
  const i = url.pathname.indexOf("/api/"); return i < 0 ? null : url.pathname.slice(i) + url.search;
}
window.fetch = async function (input, init) {
  const p = apiPath(input); if (!p) return realFetch(input, init);
  await ready; init = init || {};
  const h = {}; new Headers(init.headers || {}).forEach((v, k) => { h[k] = v; }); const ch = jarHeader(browserJar); if (ch) h.cookie = ch;
  const r = await d.handle({ method: (init.method || "GET").toUpperCase(), url: p, headers: h, ip: "10.8.0.1", body: init.body == null ? null : String(init.body) });
  takeCookies(browserJar, r.cookies);
  const status = r.status || 200, hdrs = new Headers(); Object.keys(r.headers || {}).forEach((k) => { if (k.toLowerCase() !== "set-cookie") hdrs.set(k, r.headers[k]); });
  return new Response(status === 204 || status === 304 ? null : r.body, { status, headers: hdrs });
};

/* file downloads from the API (team CSV) */
document.addEventListener("click", async (e) => {
  const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
  const p = apiPath(a.getAttribute("href")); if (!p) return;
  e.preventDefault();
  const r = await window.fetch(p), blob = await r.blob(), cd = r.headers.get("content-disposition") || "", m = /filename="?([^";]+)"?/.exec(cd);
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = m ? m[1] : "download"; document.body.appendChild(link); link.click(); setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 500);
});

/* ---- demo panel ---- */
function panel() {
  const css = document.createElement("style");
  css.textContent = ".demo-pill{position:fixed;right:14px;bottom:14px;z-index:80;font-family:var(--sans);max-width:min(340px,calc(100vw - 28px))}" +
    ".demo-pill summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;margin-left:auto;padding:8px 12px;border-radius:4px;background:var(--surface);border:1px solid var(--signal-line);color:var(--signal-text);font:600 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;box-shadow:0 0 20px var(--signal-glow);float:right}" +
    ".demo-pill summary::-webkit-details-marker{display:none}.demo-pill summary::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--signal)}" +
    ".demo-pill .box{clear:both;margin-bottom:8px;padding:14px 16px;border-radius:6px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);font-size:.84rem;color:var(--text-2)}" +
    ".demo-pill .box b{color:var(--text)}.demo-pill table{width:100%;border-collapse:collapse;margin:8px 0;font-family:var(--mono);font-size:11.5px}.demo-pill td{padding:4px 0;vertical-align:top}.demo-pill td:first-child{color:var(--muted);padding-right:10px;white-space:nowrap}" +
    ".demo-pill details[open] summary{float:none;display:flex;width:max-content}.demo-pill a{color:var(--signal-text)}";
  document.head.appendChild(css);
  const el = document.createElement("div"); el.className = "demo-pill";
  el.innerHTML = '<details><summary>Demo</summary><div class="box"><b>Demo mode.</b> Everything runs in this browser tab and resets when you reload. No data is sent anywhere.<table>' +
    "<tr><td>New member</td><td>Create account with code " + DEMO.code + "</td></tr>" +
    [["Member", DEMO.member], ["Team manager", DEMO.manager], ["Admin", DEMO.admin]].map((r) => '<tr><td>' + r[0] + '</td><td><a href="#" data-fill="' + r[1] + '">' + r[1] + "</a></td></tr>").join("") +
    "<tr><td>Password</td><td>" + DEMO.password + "</td></tr></table>" +
    'Click an account to fill in the login form. Sales page: <a href="site/index.html">open it</a>.</div></details>';
  document.body.appendChild(el);
  el.addEventListener("click", (e) => {
    const f = e.target.closest("[data-fill]"); if (!f) return; e.preventDefault();
    const fill = () => { const set = (id, v) => { const i = document.getElementById(id); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v); i.dispatchEvent(new Event("input", { bubbles: true })); return true; };
      if (set("re", f.getAttribute("data-fill"))) { set("rp", DEMO.password); el.querySelector("details").open = false; const btn = document.querySelector(".login-form button[type=submit]"); if (btn) btn.focus(); } };
    const tab = [...document.querySelectorAll(".login-form [role=tab]")].find((t) => /log in/i.test(t.textContent));
    if (!document.querySelector(".login-form")) { if (window.OSI && window.OSI.ui) window.OSI.ui.toast("Log out first, then pick an account"); return; }
    if (tab && tab.getAttribute("aria-selected") !== "true") { tab.click(); setTimeout(fill, 60); } else fill();
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", panel); else panel();
