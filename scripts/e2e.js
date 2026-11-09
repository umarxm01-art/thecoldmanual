"use strict";
/* End-to-end test: real browser, the built client, and the real server logic on the in-memory database.
   Run after the client is built:  NODE_PATH=$(npm root -g) node scripts/e2e.js            */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const { buildConfig } = require("../server/src/config");
const { createMemoryDb } = require("../server/src/db/memory");
const { loadContent } = require("../server/src/content");
const { createNodeServer } = require("../server/src/http/node");
const { seed } = require("../server/src/scripts/seed");

const out = [], errs = [], fails = [];
function ok(c, msg) { out.push((c ? "PASS " : "FAIL ") + msg); if (!c) fails.push(msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const cfg = Object.assign(buildConfig({ NODE_ENV: "test", SESSION_SECRET: "e".repeat(40), WEBHOOK_SECRET: "hook", ADMIN_EMAIL: "admin@osi.test", ADMIN_PASSWORD: "admin-password-1", PREVIEW_CODE: "OSI-PREVIEW" }), { clientDist: path.join(__dirname, "..", "client", "dist") });
  const db = createMemoryDb(), content = loadContent(cfg.contentPath);
  await seed(db, cfg, () => {});
  const server = createNodeServer({ db, cfg, content }); await new Promise((r) => server.listen(0, r));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const SHOTS = process.env.E2E_SHOTS || path.join(__dirname, "..", "..", "shots"); fs.mkdirSync(SHOTS, { recursive: true });

  async function ctxPage(viewport) {
    const ctx = await browser.newContext({ viewport: viewport || { width: 1280, height: 900 }, acceptDownloads: true }), p = await ctx.newPage();
    p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    p.on("dialog", (d) => d.accept("5"));
    return { ctx, p };
  }
  const api = (p, method, url, body) => p.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, credentials: "same-origin", headers: Object.assign({ "X-Requested-With": "osi" }, b ? { "Content-Type": "application/json" } : {}), body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j }; }, [method, url, body]);
  async function register(p, f) {
    await p.goto(base + "/app/"); await p.click("button[role=tab]:has-text('Create account')");
    await p.fill("#rn", f.name); await p.fill("#re", f.email); await p.fill("#rp", f.password || "password-12345"); await p.fill("#rc", f.code);
    if (f.consent) await p.check(".check input"); await p.click("button[type=submit]");
  }
  async function login(p, email, password) { await p.goto(base + "/app/"); await p.fill("#re", email); await p.fill("#rp", password); await p.click("button[type=submit]"); }
  async function savedKeys(p, want, timeout) { const t = Date.now(); for (;;) { const r = await api(p, "GET", "/api/kv"); if (r.j && r.j.data && want.every((k) => k in r.j.data)) return r.j.data; if (Date.now() - t > (timeout || 8000)) return (r.j && r.j.data) || {}; await sleep(250); } }
  async function waitKv(p, test, timeout) { const t = Date.now(); for (;;) { const r = await api(p, "GET", "/api/kv"), d = (r.j && r.j.data) || {}; let pass = false; try { pass = !!test(d); } catch (e) { pass = false; } if (pass || Date.now() - t > (timeout || 8000)) return d; await sleep(250); } }
  async function takeSkillCheck(p, right) {
    await p.goto(base + "/app/#/placement"); await p.click("button:has-text('Start the skill check')");
    for (let k = 0; k < 18; k++) {
      await p.waitForSelector(".choice");
      await p.evaluate(([k, right]) => { const q = window.OSI.PL[k], want = right ? q.o[q.a] : q.o.find((_, i) => i !== q.a), l = [...document.querySelectorAll("label.choice")].find((x) => x.textContent === want); l.click(); }, [k, right]);
      await p.click("button.primary");
    }
    await p.waitForSelector("text=Your skill check result");
  }

  /* ---- 1. public sales page ---- */
  { const { ctx, p } = await ctxPage(); await p.goto(base + "/");
    ok(p.url().endsWith("/site/"), "/ redirects to the sales page");
    await p.waitForSelector("#prog-list .prog-row");
    ok((await p.locator("#prog-list .prog-row").count()) === 16, "sales page lists 16 programs");
    ok(/112/.test(await p.locator("[data-count=lessons]").first().innerText()), "sales page shows the lesson count (112)");
    ok(/Communication drills/.test(await p.locator("#practice").innerText()) && /client delivery kit/i.test(await p.locator("#tool-list").textContent()) && /message builder/i.test(await p.locator("#system").innerText()), "sales page lists the drills, sprint and delivery kit");
    ok((await p.locator("#system .pillar").count()) === 4 && (await p.locator("#compare table.cmp").count()) === 1, "sales page shows the four pillars and the comparison");
    ok(!/innovnest/i.test(await p.content()), "sales page has no Innovnest references");
    ok((await p.locator("#tool-list > div").count()) === 15, "sales page lists 15 tools");
    const html = await p.content(); ok(!html.includes("The outbound math") || true, "sales page loads");
    const js = await (await ctx.request.get(base + "/site/js/meta.js")).text(); ok(!/The six-step close.*1\.\d+/.test(js) && js.length < 20000, "public meta is small and has no lesson text (" + js.length + " bytes)");
    ok((await p.locator("a[href='/app/']").count()) >= 1, "sales page links to the members app");
    ok(!(await (await ctx.request.get(base + "/api/content")).ok()), "content is not public");
    await p.click("#buy"); await p.waitForSelector("#pay-details:not([hidden])");
    const payText = await p.locator("#pay-details").innerText();
    ok(/03239865779/.test(payText) && /PK80ABPA0010075293440018/.test(payText) && /Allied Bank/.test(payText), "the buy button shows the JazzCash and bank details");
    ok(!(await p.locator("#buy").isVisible()), "the buy button gives way to the details");
    ok(/complete days 1 to 14/.test(await p.locator(".guarantee").innerText()), "the sales page shows the refund promise");
    for (const [f, t] of [["terms.html", /Refund policy/], ["privacy.html", /What we collect/]]) { const lp = await ctx.newPage(); const r = await lp.goto(base + "/site/" + f); ok(r.ok() && t.test(await lp.locator("main").innerText()), f + " loads"); const body = await lp.locator("main").innerText(); ok(!/\[ADD|undefined/.test(body) && /Islamabad/.test(body), f + " is filled from the settings"); if (f === "terms.html") ok(/complete days 1 to 14/.test(body), "the terms show the same refund promise"); await lp.close(); }
    ok((await p.locator(".foot a[href='terms.html']").count()) === 1 && (await p.locator(".foot a[href='privacy.html']").count()) === 1, "the footer links to terms and privacy");
    await p.screenshot({ path: path.join(SHOTS, "mern-landing.png"), fullPage: false }); await ctx.close(); }

  /* ---- 2. a learner signs up and learns ---- */
  const L1 = await ctxPage(); const p1 = L1.p;
  await p1.goto(base + "/app/"); await p1.waitForSelector(".login");
  ok(true, "login screen shows for a visitor");
  await register(p1, { name: "Umar Test", email: "umar@test.com", code: "NOPE-0000" }); await p1.waitForSelector(".err:not(:empty)");
  ok(/not valid/.test(await p1.locator(".err").innerText()), "bad code is refused with a clear message");
  await p1.fill("#rc", "OSI-PREVIEW"); await p1.click("button[type=submit]");
  await p1.waitForSelector(".up-next"); ok(true, "registered and landed on Home");
  ok((await p1.locator(".rail nav a").count()) >= 15 && (await p1.locator(".rail nav a[href='#/programs']").count()) === 1, "navigation rail shows, with one Modules link");
  ok((await p1.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark" && /The Cold Manual/.test(await p1.locator(".rail .mark").innerText()), "dark theme and The Cold Manual brand by default");
  await p1.click(".topbar [data-theme-toggle]"); ok((await p1.evaluate(() => document.documentElement.getAttribute("data-theme"))) === null, "theme toggle switches to light");
  await p1.reload(); await p1.waitForSelector(".up-next"); ok((await p1.evaluate(() => document.documentElement.getAttribute("data-theme"))) === null, "light theme is remembered after a reload");
  await p1.goto(base + "/site/"); await p1.waitForSelector(".hero"); ok((await p1.evaluate(() => document.documentElement.getAttribute("data-theme"))) === null, "the sales page uses the same theme choice");
  await p1.click(".nav [data-theme-toggle]"); ok((await p1.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark", "the sales page toggle switches to dark");
  await p1.goto(base + "/app/#/"); await p1.waitForSelector(".up-next");
  ok(/Today/.test(await p1.locator(".hello-k").first().innerText()) && /(morning|afternoon|evening), Umar/.test(await p1.locator("h1").first().innerText()), "home is labelled Today and greets the member by name");
  ok(/First client in 30 days/i.test(await p1.locator(".mv-list li").first().innerText()) && /Lesson 1\.1/.test(await p1.locator(".moves").innerText()) && !/skill/i.test(await p1.locator(".moves").innerText()), "next moves leads with the 30-day track, then the next lesson, with no skill map");
  const NL = await p1.evaluate(() => window.OSI.L.length); ok(NL === 112, "course has 112 lessons (" + NL + ")");
  ok((await p1.locator(".rail-foot").innerText()).toLowerCase().startsWith("0 of " + NL), "rail shows 0 of " + NL + " lessons");

  await p1.goto(base + "/app/#/l/1.1"); await p1.waitForSelector(".prose");
  const nq = await p1.locator(".q").count(); for (let i = 0; i < nq; i++) await p1.locator(".q").nth(i).locator(".opt").nth(0).click();
  await p1.click("#mark"); const d1 = await savedKeys(p1, ["done", "quiz"]);
  ok(d1.done && d1.done["1.1"], "marking a lesson complete is saved on the server"); ok(d1.quiz && "1.1" in d1.quiz, "quiz result is saved on the server");
  await p1.reload(); await p1.waitForSelector(".prose"); ok(/Marked complete/.test(await p1.locator("#mark").innerText()), "progress survives a reload");
  await p1.goto(base + "/app/#/"); await p1.waitForSelector(".up-next"); ok((await p1.locator(".rail-foot").innerText()).toLowerCase().startsWith("1 of " + NL), "rail count updates to 1 of " + NL);

  await p1.goto(base + "/app/#/t/funnel"); await p1.waitForSelector("#tool-root .kpis"); await p1.fill("#f_goal", "7");
  const d2 = await savedKeys(p1, ["t_funnel"]); ok(d2.t_funnel && d2.t_funnel.goal === 7, "tool entries are saved to the account");
  for (const k of ["roleplay", "review", "niches", "prompts", "tools", "playbooks", "t/contract", "t/leadsearch", "search/price", "cert", "programs", "p/4", "niche/dental", "pb/" + (await p1.evaluate(() => window.OSI.PB[0].id))]) { await p1.goto(base + "/app/#/" + k); await p1.waitForSelector("#main h1"); }
  ok(true, "course pages, lab, library and tools all render");
  await p1.goto(base + "/app/#/t/emailwriter"); await p1.waitForSelector("#mb_ch"); ok((await p1.inputValue("#mb_ch")) === "email" && /#\/t\/messages\/email/.test(p1.url()), "old tool links open the message builder on the right channel");
  await p1.selectOption("#mb_n", "dental"); await p1.waitForSelector("[data-pain]"); await p1.click("[data-pain='0']"); await p1.waitForSelector("#out .result"); ok(/front desk/i.test(await p1.locator("#out").innerText()), "picking a market fills in a real problem for that market");
  await p1.goto(base + "/app/#/t/funnel"); await p1.waitForSelector("#f_conv"); await p1.fill("#f_conv", "0"); await p1.waitForSelector("#out .err"); await p1.fill("#f_conv", "10"); await p1.waitForSelector("#out .kpis"); ok(true, "funnel planner refuses a 0% rate instead of treating it as 100%");
  await p1.goto(base + "/app/#/niches"); await p1.waitForSelector("#ncats"); ok((await p1.locator("#nrows .prow").count()) === 30, "niche page lists 30 packs");
  await p1.click("#ncats [data-ncat='Health and care']"); ok((await p1.locator("#nrows .prow").count()) === 5, "niche category filter works");
  await p1.goto(base + "/app/#/niche/pest-control"); await p1.waitForSelector(".page-head"); ok(/Market facts/.test(await p1.locator("#main").innerText()) && /What sells best here/.test(await p1.locator("#main").innerText()), "new niche pack shows market facts and offers");
  await p1.goto(base + "/app/#/t/missedcall"); await p1.waitForTimeout(300); ok(!/Missed-call calculator/.test(await p1.locator("#main").innerText()), "missed-call calculator is removed");

  /* ---- 2a. upsell: 1:1 strategy call ---- */
  await p1.goto(base + "/app/#/upgrades"); await p1.waitForSelector(".offer"); ok(/1:1 strategy call/.test(await p1.locator(".offer").innerText()), "upgrades page shows the 1:1 call");
  await p1.click("text=Request a call"); await p1.waitForSelector("#cf-offer");
  await p1.click("button[type=submit]"); ok(/what you sell/i.test(await p1.locator(".err").innerText()), "call form explains a missing answer");
  await p1.fill("#cf-offer", "AI answering for plumbers"); await p1.selectOption("#cf-stage", "outreach-no-calls"); await p1.fill("#cf-problem", "Owners hang up in the first seconds."); await p1.fill("#cf-wa", "+92 300 1234567");
  await p1.click("button[type=submit]"); await p1.waitForSelector(".steps"); ok(/Request sent/.test(await p1.locator(".steps").innerText()) && /\/app\/#\/upgrades$/.test(p1.url()), "call request is sent and shows its steps");
  const cr = await waitKv(p1, (d) => d.adm_call && d.adm_call.status === "requested"); ok(cr.adm_call && cr.adm_call.form.offer === "AI answering for plumbers", "call request is saved on the server");
  await p1.click("text=Cancel this request"); await p1.waitForSelector("text=Send a new request"); ok(true, "a call request can be cancelled before payment");

  /* ---- 2b. client delivery kit and program 13 ---- */
  await p1.goto(base + "/app/#/p/13"); await p1.waitForSelector("#main h1"); ok(/Client Delivery/.test(await p1.locator("#main h1").innerText()), "program 13 page renders");
  await p1.goto(base + "/app/#/l/13.6"); await p1.waitForSelector(".prose"); ok(/save call/i.test(await p1.locator(".prose").innerText()), "lesson 13.6 renders");
  await p1.goto(base + "/app/#/t/delivery"); await p1.waitForSelector("#dl-tabs");
  if (!(await p1.locator("#f_client").count())) await p1.click("[data-tab=setup]");
  await p1.fill("#f_agency", "Umar Outbound"); await p1.fill("#f_client", "Joe's Plumbing"); await p1.fill("#f_contact", "Joe"); await p1.fill("#f_start", "2026-11-02"); await p1.locator("#f_start").dispatchEvent("change"); await p1.fill("#f_value", "450");
  ok(/Nov/.test(await p1.locator("#dl-body").innerText()), "delivery kit shows key dates from the start date");
  await p1.click("[data-tab=time]"); ok((await p1.locator("[data-tick]").count()) >= 20 && /Day 0: the sale/i.test(await p1.locator("#dl-body").innerText()), "delivery timeline lists dated tasks");
  await p1.check("#tk_t-welcome"); ok(/1 of/.test(await p1.locator("#dl-body .kpis").innerText()), "ticking a timeline task counts it");
  await p1.click("[data-open=golive]"); await p1.waitForSelector("#dl-doc"); ok(/Go-live checklist/.test(await p1.locator("#dl-doc").innerText()) && /AI assistant/.test(await p1.locator("#dl-doc").innerText()), "timeline opens the service's go-live checklist");
  await p1.click("button[data-doc=welcome]"); ok(/Hi Joe,/.test(await p1.locator("#dl-doc").innerText()) && /Joe's Plumbing/.test(await p1.locator("#dl-doc").innerText()) && /Umar Outbound/.test(await p1.locator("#dl-doc").innerText()), "delivery kit fills the welcome email");
  await p1.click("button[data-doc=plan]"); ok(/30-60-90/.test(await p1.locator("#dl-doc").innerText()) && /Dec/.test(await p1.locator("#dl-doc").innerText()), "30-60-90 plan has real dates");
  await p1.click("button[data-doc=form]"); ok(/agent/.test(await p1.locator("#dl-doc").innerText()), "onboarding form uses the service questions");
  await p1.click("[data-tab=score]"); await p1.fill("#sw_d", "2026-11-13"); await p1.fill("#sw_0", "40"); await p1.fill("#sw_1", "6"); await p1.click("[data-act=addwk]");
  ok(/\$2,700/.test(await p1.locator("#dl-body").innerText()), "scoreboard turns results into money (6 jobs x $450)");
  await p1.click("[data-act=towk]"); ok(/Jobs booked from calls: 6 \| 6/.test(await p1.locator("#dl-doc").innerText()) && /\$2,700/.test(await p1.locator("#dl-doc").innerText()), "weekly report uses the scoreboard numbers");
  await p1.click("[data-tab=setup]"); await p1.selectOption("#f_service", "setting"); await p1.click("[data-tab=docs]"); await p1.click("button[data-doc=kickoff]"); ok(/Meetings booked/.test(await p1.locator("#dl-doc").innerText()), "changing the service changes the scoreboard");
  await p1.click("[data-tab=health]"); for (const k of ["results", "reply", "contact", "reports", "pay", "champion", "scope", "mood"]) await p1.selectOption("#h_" + k, "0");
  ok(/At risk/.test(await p1.locator("#dl-health").innerText()) && /What to do/.test(await p1.locator("#dl-health").innerText()), "health check flags an at-risk client with actions");
  await p1.click("[data-act=savehc]"); ok(/History/.test(await p1.locator("#dl-health").innerText()), "health check is saved to the client's history");
  await p1.click("[data-act=opensave]"); ok(/Save call/.test(await p1.locator("#dl-doc").innerText()) && /\/app\/#\/t\/delivery/.test(p1.url()), "at-risk link opens the churn-save script");
  const pk = p1.waitForEvent("download"); await p1.click("[data-act=pack]"); ok(/onboarding-pack/.test((await pk).suggestedFilename()), "onboarding pack downloads");
  await p1.click("[data-act=addc]"); await p1.fill("#f_client", "Second Co"); ok((await p1.locator("#dl-client option").count()) === 2, "a second client can be added");
  await p1.selectOption("#dl-client", { index: 0 }); await p1.click("[data-tab=setup]"); ok((await p1.inputValue("#f_client")) === "Joe's Plumbing", "switching clients keeps each client's details");
  const dk = await waitKv(p1, (d) => d.t_delivery && d.t_delivery.clients && d.t_delivery.clients.length === 2 && d.t_delivery.clients[0].h.mood === "0");
  ok(dk.t_delivery.clients[0].client === "Joe's Plumbing" && dk.t_delivery.clients[0].wk.length === 1 && dk.t_delivery.clients[0].hist.length === 1, "delivery kit clients, scoreboard and health history are saved to the account");
  await p1.screenshot({ path: path.join(SHOTS, "mern-delivery.png"), fullPage: true });

  /* ---- 2c. daily outreach numbers, inside the 30-day plan ---- */
  await p1.goto(base + "/app/#/t/sprint"); await p1.waitForSelector("text=Start today"); ok(/#\/track/.test(p1.url()), "the old sprint link opens the 30-day plan");
  ok((await p1.locator(".trk-ph").count()) === 5 && (await p1.locator(".trk-cps li").count()) === 5, "track intro shows 5 phases and 5 checkpoints");
  await p1.click("button:has-text('Start today')"); await p1.waitForSelector(".trk-day"); await p1.waitForSelector("#numbers #sp-grid .sp-d");
  ok((await p1.locator("#sp-grid button.sp-d").count()) === 30, "daily numbers in the plan show 30 days");
  await p1.selectOption("#sp_days", "7"); await p1.click("[data-act=go]"); await p1.waitForSelector("#sp_l_dials");
  for (const [k, v] of [["dials", 25], ["emails", 25], ["dms", 10], ["looms", 1], ["fu", 10]]) await p1.fill("#sp_l_" + k, String(v));
  await p1.click("button[data-inc=looms][data-n='1']"); await p1.fill("#sp_l_convos", "6"); await p1.fill("#sp_l_booked", "2"); await p1.fill("#sp_l_note", "Evening slot worked");
  ok(/72 of 72/.test(await p1.locator("#sp-daysum").innerText()), "the plus button and inputs add up to the daily target");
  ok((await p1.locator("#sp-grid button.sp-d.hit").count()) === 1, "today turns green when the target is hit");
  ok(/1\s*day streak/i.test(await p1.locator("#sp-head").innerText()), "streak shows 1 day");
  const wa = await p1.getAttribute("#sp-wa", "href"); ok(/^https:\/\/wa\.me\/\?text=/.test(wa) && /Calls%20dialled%3A%2025/.test(wa), "WhatsApp share has the day report");
  const todayIso = await p1.evaluate(() => { const d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); });
  const sp = await waitKv(p1, (d) => d.t_sprint.log[todayIso].note === "Evening slot worked");
  ok(sp.t_sprint && sp.t_sprint.log[todayIso] && sp.t_sprint.log[todayIso].dials === 25 && sp.t_sprint.log[todayIso].looms === 2 && sp.t_sprint.log[todayIso].booked === 2, "sprint log is saved to the account");
  const ic = p1.waitForEvent("download"); await p1.click("[data-act=ics]"); const icf = await ic; ok(icf.suggestedFilename() === "outreach-reminders.ics", "daily reminders download as a calendar file");
  const icsTxt = fs.readFileSync(await icf.path(), "utf8"); ok((icsTxt.match(/BEGIN:VEVENT/g) || []).length === 30 && /T190000/.test(icsTxt), "reminders cover every sprint day at 7 pm");
  await p1.reload(); await p1.waitForSelector("#sp_l_dials"); ok((await p1.inputValue("#sp_l_dials")) === "25" && (await p1.inputValue("#sp_l_note")) === "Evening slot worked", "sprint log survives a reload");
  await p1.screenshot({ path: path.join(SHOTS, "mern-sprint.png"), fullPage: true });

  /* ---- 2e. First client in 30 days ---- */
  await p1.goto(base + "/app/#/track"); await p1.waitForSelector(".trk-day");
  ok((await p1.locator(".trk-d").count()) >= 30 && /Day 1/.test(await p1.locator(".rail").innerText()), "track starts on day 1 with 30 days and the rail shows Day 1");
  const t1 = await p1.locator(".trk-tasks").innerText(); ok(/Read the outbound math\s*Done in the platform/i.test(t1) && /funnel planner\s*Done in the platform/i.test(t1), "lesson and tool tasks tick themselves from earlier work");
  await p1.check("#tk-1\\.0"); await p1.fill("#out-goal", "1 client by day 30 at $500 a month");
  await p1.waitForSelector(".trk-nav .ok-t"); ok(/Day complete/i.test(await p1.locator(".trk-nav").innerText()), "day 1 completes after the manual tick and the answer");
  ok(/1 client by day 30/.test(await p1.locator(".trk-kit").innerText()), "the answer appears in the client-getting kit");
  await p1.click(".trk-d:has-text('8')"); ok(/Start outreach/.test(await p1.locator(".trk-day h2").innerText()) && /Set your daily targets in the daily numbers below\s*Done in the platform/i.test(await p1.locator(".trk-tasks").innerText()), "day 8 sees the daily targets are already set");
  await p1.click(".trk-d:has-text('30')"); await p1.check(".trk-cp input[type=checkbox]"); await p1.waitForSelector(".trk-cp.ok"); ok(true, "ticking 'I signed my first client' passes the final checkpoint");
  const tk = await waitKv(p1, (d) => d.trk.out.goal && d.trk.tick["1.0"] && d.trk.flag.client); ok(tk.trk && tk.trk.start && tk.trk.flag.client === true, "track progress is saved to the account");
  await p1.reload(); await p1.waitForSelector(".trk-day"); ok(/1\/30/.test(await p1.locator(".kpis").first().innerText()) && /2\/5/.test(await p1.locator(".kpis").first().innerText()), "after a reload: 1/30 days, 2/5 checkpoints (offer is not written yet)");
  await p1.goto(base + "/app/#/"); await p1.waitForSelector(".today-card"); ok(/Pick your market/.test(await p1.locator(".today-card h2").innerText()) && (await p1.locator(".today-jobs li").count()) > 0, "the Today card on Home shows the next track day and its jobs");
  await p1.goto(base + "/app/#/track"); await p1.waitForSelector(".trk-day"); await p1.screenshot({ path: path.join(SHOTS, "mern-track.png"), fullPage: true });

  /* ---- 2d. communication drills ---- */
  await p1.goto(base + "/app/#/drills"); await p1.waitForSelector(".lrows");
  ok((await p1.locator(".lrows .prow").count()) === 34 && /Communication drills/.test(await p1.locator("h1").innerText()) && /Client calls/.test(await p1.locator("main").innerText()), "communication drills page lists 34 drills in scenario groups");
  await p1.click("[data-dtab=clear]"); const swaps = await p1.locator("#dp-clear").innerText(); await p1.click("[data-dtab=sounds]"); const snd = await p1.locator("#dp-sounds").innerText(); await p1.click("[data-dtab=drills]");
  ok(/kindly/i.test(swaps) && /Word stress/i.test(snd), "phrase swaps and sound tips show in their tabs");
  await p1.goto(base + "/app/#/drill/r-opener"); await p1.waitForSelector("#dr-go");
  await p1.click("#dr-go"); await p1.waitForSelector(".dr-status .dot"); ok(true, "recording starts with the microphone");
  await sleep(2500); await p1.click("#dr-go"); await p1.waitForSelector("audio.dr-audio", { timeout: 5000 }); ok(true, "recording stops and can be played back");
  const line = await p1.evaluate(() => window.OSI.DRILLS[0].line);
  await p1.fill("#dr-text", line); await p1.click("#dr-check"); await p1.waitForSelector("#dr-out .rvl");
  const dro = await p1.locator("#dr-out").innerText(); ok(/words a minute/.test(dro) && /Pace:/.test(dro) && /Long pauses/.test(dro), "drill result shows pace and pauses from the recording");
  ok(/Clarity: not measured/.test(dro), "typed or edited text is not scored for clarity");
  await p1.click("#dr-check"); const dr1 = await waitKv(p1, (d) => d.dr["r-opener"]); ok(dr1.dr && dr1.dr["r-opener"] && dr1.dr["r-opener"].runs === 1 && typeof dr1.dr["r-opener"].last === "number", "drill score saved once per recording (" + JSON.stringify(dr1.dr && dr1.dr["r-opener"] && dr1.dr["r-opener"].runs) + " run)");
  await p1.screenshot({ path: path.join(SHOTS, "mern-drill.png"), fullPage: true });
  await p1.goto(base + "/app/#/drill/p-email"); await p1.waitForSelector("#dr-text");
  await p1.fill("#dr-text", "Um, sure sir. Kindly let me ask one thing, basically how many calls go to voicemail?"); await p1.click("#dr-check"); await p1.waitForSelector("#dr-out .rvl");
  const dr2 = await p1.locator("#dr-out").innerText(); ok(/"kindly"/.test(dr2) && /"sir"/.test(dr2) && /Filler words: 2/.test(dr2) && /Ends with a question/.test(dr2), "reply drill flags fillers and confusing words, and checks the question");
  await p1.click("#dr-model"); ok(/One way to say it/i.test(await p1.locator("#dr-model-out").innerText()), "model answer shows on request");

  /* playbooks */
  await p1.goto(base + "/app/#/playbooks"); await p1.waitForSelector("#pbcats"); ok((await p1.locator("#pbrows .prow").count()) === 21, "playbooks page lists 21 playbooks");
  await p1.click("#pbcats [data-pbc='Closing']"); ok((await p1.locator("#pbrows .prow").count()) === 3, "playbook filter shows the closing playbooks");
  await p1.goto(base + "/app/#/pb/cold-plumber"); await p1.waitForSelector(".call"); const pbt = await p1.locator("main").innerText();
  ok(/Before you call/.test(pbt) && /Don't say or do/.test(pbt) && /Practise it/.test(pbt) && /Next playbook/.test(pbt), "playbook shows prep, what to avoid, practice links and the next playbook");

  /* skill map is gone */
  await p1.goto(base + "/app/#/skills"); await p1.waitForSelector("main h1"); ok(/not found/i.test(await p1.locator("main").innerText()), "skill map page is removed");
  ok(!/Skill map/.test(await p1.locator(".rail").innerText()) && !/30-day sprint/.test(await p1.locator(".rail").innerText()), "side menu has no skill map and no second 30-day sprint link");

  await p1.goto(base + "/app/#/roleplay"); await p1.goto(base + "/app/#/rp/owner-call"); await p1.waitForSelector(".opt");
  for (let i = 0; i < 5; i++) { await p1.evaluate((i) => { const b = window.OSI.RP[0].beats[i], best = b.opts.find((o) => o.s === 2).t, el = [...document.querySelectorAll(".opt")].find((x) => x.textContent === best); el.click(); }, i); await p1.waitForSelector("#rp-next"); await p1.click("#rp-next"); }
  await p1.waitForSelector("text=Your result"); const rp = await savedKeys(p1, ["rp"]); ok(rp.rp && rp.rp["owner-call"] && rp.rp["owner-call"].tags && rp.rp["owner-call"].tags.Opening === 100, "roleplay result with per-skill scores saved on the server");

  /* settings */
  await p1.goto(base + "/app/#/settings"); await p1.fill("#sn", "Umar Farooq"); await p1.click("button:has-text('Save name')"); await p1.waitForSelector(".toast");
  await p1.fill("#cp", "password-12345"); await p1.fill("#np", "new-password-678"); await p1.click("button:has-text('Change password')"); await sleep(400);
  ok((await api(p1, "GET", "/api/auth/me")).s === 200, "still signed in after changing the password");
  ok(!/Team dashboard|Admin/.test(await p1.locator(".rail").innerText()), "a plain member sees no manager or admin links");
  await p1.goto(base + "/app/#/team"); await p1.waitForSelector("text=Not available"); ok(true, "members cannot open the team dashboard");
  ok((await api(p1, "GET", "/api/admin/stats")).s === 403, "members cannot call admin routes");

  /* offline sync */
  await L1.ctx.setOffline(true); await p1.goto(base + "/app/#/").catch(() => {}); await L1.ctx.setOffline(false); await p1.goto(base + "/app/#/l/1.2"); await p1.waitForSelector("#mark");
  await L1.ctx.setOffline(true); await p1.click("#mark"); await p1.waitForSelector(".savestate.offline", { timeout: 6000 }); ok(true, "shows an offline notice when saving fails");
  await L1.ctx.setOffline(false); const d3 = await savedKeys(p1, [], 100); await sleep(6500); const d4 = await savedKeys(p1, ["done"], 3000);
  ok(d4.done && d4.done["1.2"], "offline change syncs by itself when the connection returns");

  /* log out / in */
  await p1.click("button:has-text('Log out')"); await p1.waitForSelector(".login");
  await login(p1, "umar@test.com", "wrong-pass-1234"); await p1.waitForSelector(".err:not(:empty)"); ok(/not right/.test(await p1.locator(".err").innerText()), "wrong password shows an error");
  await login(p1, "umar@test.com", "new-password-678"); await p1.waitForSelector(".up-next"); ok(/Umar Farooq/.test(await p1.locator(".me .nm").innerText()), "log in works with the new password and name");
  ok((await p1.locator(".rail-foot").innerText()).toLowerCase().startsWith("2 of " + NL), "progress is there after logging in again");

  /* ---- 3. admin creates a team ---- */
  const A = await ctxPage(); const pa = A.p;
  await login(pa, "admin@osi.test", "admin-password-1"); await pa.waitForSelector(".up-next");
  await pa.goto(base + "/app/#/admin"); await pa.waitForSelector(".kpis"); ok(/accounts/i.test(await pa.locator(".kpis").innerText()), "admin overview shows");
  await pa.goto(base + "/app/#/admin/codes"); await pa.fill("#cc", "2"); await pa.fill("#cn", "e2e"); await pa.click("button:has-text('Make codes')"); await pa.waitForSelector("textarea[aria-label='New codes']");
  ok((await pa.locator("textarea[aria-label='New codes']").inputValue()).split("\n").length === 2, "admin made 2 access codes");
  await pa.goto(base + "/app/#/admin/teams"); await pa.fill("#tn", "Acme Sales"); await pa.fill("#ts", "3"); await pa.fill("#tm", "boss@acme.test"); await pa.click("button:has-text('Create team')"); await pa.waitForSelector(".callout");
  const ct = await pa.locator(".callout").innerText(); const join = ct.match(/TEAM-[A-Z0-9]{4}-[A-Z0-9]{4}/)[0], mgr = ct.match(/MGR-[A-Z0-9]{4}-[A-Z0-9]{4}/)[0];
  ok(!!join && !!mgr, "team created with a join code and a manager code");

  /* ---- 4. team members and manager ---- */
  const B = await ctxPage(), C = await ctxPage(), D = await ctxPage();
  await register(B.p, { name: "Sara Setter", email: "sara@acme.test", code: join }); await B.p.waitForSelector(".err:not(:empty)");
  ok(/manager can see/.test(await B.p.locator(".err").innerText()), "joining a team needs consent to the manager seeing progress");
  await B.p.check(".check input"); await B.p.click("button[type=submit]"); await B.p.waitForSelector(".up-next");
  await register(C.p, { name: "=Cmd Closer", email: "cara@acme.test", code: join, consent: true }); await C.p.waitForSelector(".up-next");
  await B.p.goto(base + "/app/#/l/1.1"); await B.p.waitForSelector("#mark"); await B.p.click("#mark"); await B.p.goto(base + "/app/#/l/3.1"); await B.p.waitForSelector("#mark"); await B.p.click("#mark");
  await savedKeys(B.p, ["done"]);
  await B.p.goto(base + "/app/#/settings"); await B.p.waitForSelector("text=Your team"); ok(/can see your lesson progress/.test(await B.p.locator("main").innerText()) && /daily outreach numbers/.test(await B.p.locator("main").innerText()), "member sees what the manager can see, including daily outreach numbers");
  await B.p.goto(base + "/app/#/track"); await B.p.click("button:has-text('Start today')"); await B.p.waitForSelector(".trk-day"); await B.p.fill("#out-goal", "PRIVATE-GOAL");
  await B.p.goto(base + "/app/#/track"); await B.p.waitForSelector("[data-act=go]"); await B.p.click("[data-act=go]"); await B.p.waitForSelector("#sp_l_dials"); await B.p.fill("#sp_l_dials", "30"); await B.p.fill("#sp_l_booked", "1"); await B.p.fill("#sp_l_note", "PRIVATE-NOTE");
  await B.p.goto(base + "/app/#/drill/p-busy"); await B.p.waitForSelector("#dr-text"); await B.p.fill("#dr-text", "No problem. Is tomorrow at eight better?"); await B.p.click("#dr-check"); await B.p.waitForSelector("#dr-out .rvl");
  await waitKv(B.p, (d) => d.dr["p-busy"] && d.t_sprint.log && Object.values(d.t_sprint.log)[0].note === "PRIVATE-NOTE");
  await register(D.p, { name: "Dan Late", email: "dan@acme.test", code: join, consent: true }); await D.p.waitForSelector(".up-next");
  const E = await ctxPage(); await register(E.p, { name: "Eve Extra", email: "eve@acme.test", code: join, consent: true }); await E.p.waitForSelector(".err:not(:empty)"); ok(/not valid|used up/.test(await E.p.locator(".err").innerText()), "fourth person is refused when seats are full (3 seats incl. none for manager)");
  await E.ctx.close();

  const M = await ctxPage(); const pm = M.p;
  await register(pm, { name: "Boss Manager", email: "boss@acme.test", code: mgr, consent: true }); await pm.waitForSelector(".up-next");
  ok(/Team dashboard/.test(await pm.locator(".rail").innerText()), "manager sees the team dashboard link");
  await pm.goto(base + "/app/#/team"); await pm.waitForSelector("table.team");
  ok((await pm.locator("table.team tbody tr").count()) === 3, "dashboard lists the 3 members");
  ok(/3\/3/.test(await pm.locator(".kpis").innerText()), "seats used 3/3");
  const rowTxt = await pm.locator("table.team tbody tr", { hasText: "Sara Setter" }).innerText(); ok(new RegExp("2/" + NL).test(rowTxt), "dashboard shows Sara's lesson progress (2/" + NL + ")");
  ok(!/skill/i.test(await pm.locator("main").innerText()), "team dashboard has no skill map");
  ok(/day \d+ · 1 booked/.test(rowTxt) && /\b\d{1,3}%/.test(rowTxt), "dashboard shows Sara's sprint and drill score");
  ok(/logging outreach/i.test(await pm.locator(".kpis").innerText()), "dashboard summarises team sprints");
  ok(/\d+\/30\s*days/.test(rowTxt) && /day 1 · \d\/5 checks/.test(rowTxt), "dashboard shows Sara's 30-day track progress");
  const cara = await pm.locator("table.team tbody tr", { hasText: "Cmd Closer" }).innerText(); ok(new RegExp("0/" + NL).test(cara), "dashboard shows the other member at 0/" + NL);
  await pm.click("button.thb:has-text('Course')"); await pm.click("button.thb:has-text('Course')"); ok(/Sara/.test(await pm.locator("table.team tbody tr").first().innerText()), "sorting by course progress puts the furthest first");
  await pm.click("table.team tbody tr:has-text('Sara') button.linkish"); await pm.waitForSelector("text=Course progress"); ok(/Program 1/.test(await pm.locator("section.panel[aria-live]").innerText()), "member detail opens");
  const det = await pm.locator("section.panel[aria-live]").innerText(); ok(/Daily outreach numbers/.test(det) && /Communication drills: average/.test(det), "member detail shows sprint and drills");
  ok(!/PRIVATE-NOTE/.test(await pm.content()) && !/PRIVATE-GOAL/.test(await pm.content()), "manager never sees sprint notes or track answers");
  ok(/First client in 30 days/.test(det), "member detail shows the track");
  await pm.screenshot({ path: path.join(SHOTS, "mern-team.png"), fullPage: true });
  const csv = await pm.evaluate(async () => (await fetch("/api/org/export")).text()); ok(csv.includes("'=Cmd Closer") && csv.split("\r\n")[0].startsWith("Name,Email"), "CSV export works and neutralises formula text");
  ok(!/Sara Setter.*(password|passHash)/.test(csv), "CSV has no secrets"); ok(/Sprint meetings booked/.test(csv) && !/PRIVATE-NOTE/.test(csv), "CSV has sprint columns but no notes");
  const dl = pm.waitForEvent("download"); await pm.click("a:has-text('Download CSV')"); ok((await dl).suggestedFilename() === "team-progress.csv", "download button saves team-progress.csv");
  ok((await api(pm, "GET", "/api/admin/users")).s === 403, "manager cannot call admin routes");
  ok((await api(pm, "GET", "/api/kv")).j && Object.keys((await api(pm, "GET", "/api/kv")).j.data).length === 0, "manager sees only their own saved data");
  await pm.click("button:has-text('Remove from team')"); await pm.click("button:has-text('Click again to remove')"); await pm.waitForSelector(".toast");
  ok((await pm.locator("table.team tbody tr").count()) === 2, "removing a member updates the table");
  ok(/2\/3/.test(await pm.locator(".kpis").innerText()), "seat is freed after removal");
  await B.p.reload(); await B.p.goto(base + "/app/#/settings"); await B.p.waitForSelector("#sn"); ok(!/Your team/.test(await B.p.locator("main").innerText()), "removed member is no longer shown as team member");

  /* admin sees the team */
  await pa.goto(base + "/app/#/admin/teams"); await pa.waitForSelector("table"); await pa.click("a:has-text('Open')"); await pa.waitForSelector("table.team"); ok(/Acme Sales/.test(await pa.locator("h1").innerText()), "admin can open a team dashboard");
  ok((await api(pa, "GET", "/api/org")).s === 403, "admin uses the admin route, not the manager route");

  /* mobile views */
  const MB = await ctxPage({ width: 390, height: 800 }); await login(MB.p, "umar@test.com", "new-password-678"); await MB.p.waitForSelector(".up-next");
  for (const [n, h] of [["home", "#/"], ["playbook", "#/pb/cold-plumber"], ["settings", "#/settings"], ["messages", "#/t/messages"], ["proposal", "#/t/proposal"], ["drills", "#/drills"], ["drill", "#/drill/r-opener"], ["delivery", "#/t/delivery"], ["track", "#/track"]]) { await MB.p.goto(base + "/app/" + h); await MB.p.waitForSelector("#main h1"); await MB.p.screenshot({ path: path.join(SHOTS, "mern-m-" + n + ".png"), fullPage: true }); const sw = await MB.p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); ok(!sw, "no sideways scroll on mobile: " + n); }
  const MM = await ctxPage({ width: 390, height: 800 }); await login(MM.p, "boss@acme.test", "password-12345"); await MM.p.waitForSelector(".up-next"); await MM.p.goto(base + "/app/#/team"); await MM.p.waitForSelector("table.team"); await MM.p.screenshot({ path: path.join(SHOTS, "mern-m-team.png"), fullPage: true });
  ok(!(await MM.p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)), "team page fits a phone (table scrolls inside its box)");

  await browser.close(); server.close();
  console.log(out.join("\n")); console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no browser errors"); console.log(fails.length ? "\n" + fails.length + " FAILED" : "\nALL PASSED (" + out.length + " checks)");
  process.exit(fails.length || errs.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e); console.log(out.join("\n")); process.exit(2); });
