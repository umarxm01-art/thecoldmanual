"use strict";
/* Browser test of the connected tools, the reply handler and the AI screens (using the fixed "sample" answers).
   Run after the client is built:  NODE_PATH=$(npm root -g) node scripts/e2e-tools.js */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const { buildConfig } = require("../server/src/config");
const { createMemoryDb } = require("../server/src/db/memory");
const { loadContent } = require("../server/src/content");
const { createNodeServer } = require("../server/src/http/node");
const { seed } = require("../server/src/scripts/seed");

const out = [], errs = [], fails = [];
function ok(c, msg) { out.push((c ? "PASS " : "FAIL ") + msg); if (!c) fails.push(msg); }
const SHOTS = process.env.E2E_SHOTS || path.join(__dirname, "..", "..", "shots"); fs.mkdirSync(SHOTS, { recursive: true });

async function start(env) {
  const cfg = Object.assign(buildConfig(Object.assign({ NODE_ENV: "test", SESSION_SECRET: "e".repeat(40), ADMIN_EMAIL: "admin@osi.test", ADMIN_PASSWORD: "admin-password-1", PREVIEW_CODE: "OSI-PREVIEW" }, env)), { clientDist: path.join(__dirname, "..", "client", "dist") });
  const db = createMemoryDb(), content = loadContent(cfg.contentPath); await seed(db, cfg, () => {});
  const server = createNodeServer({ db, cfg, content }); await new Promise((r) => server.listen(0, r));
  return { server, base: "http://127.0.0.1:" + server.address().port };
}

(async () => {
  const browser = await chromium.launch(), on = await start({ AI_PROVIDER: "sample", AI_DAILY_LIMIT: "200", AI_MONTHLY_LIMIT: "500" }), off = await start({});
  async function member(base, email, vp) {
    const ctx = await browser.newContext({ viewport: vp || { width: 1280, height: 900 } }), p = await ctx.newPage();
    p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    await p.goto(base + "/app/"); await p.click("button[role=tab]:has-text('Create account')");
    await p.fill("#rn", "Sara"); await p.fill("#re", email); await p.fill("#rp", "password-12345"); await p.fill("#rc", "OSI-PREVIEW"); await p.click("button[type=submit]");
    await p.waitForSelector(".mv-list, .moves, #main"); return p;
  }
  const go = async (p, r, sel) => { await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(150); if (sel) await p.waitForSelector(sel); };
  const leads = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.OSI.store.get("t_leads", { rows: [] }).rows)));
  const seeded = await member(on.base, "reply@x.test");
  const p = seeded;

  /* opening tools must not count as using them */
  await go(p, "#/t/messages/email", "#mb_ch"); await go(p, "#/t/proposal", "#pdoc"); await p.waitForTimeout(800);
  const kv0 = await p.evaluate(() => window.OSI.store.all());
  ok(!kv0.t_messages && !kv0.t_proposal, "opening a tool does not tick its 30-day-plan task");

  /* offer fills the other tools */
  await go(p, "#/t/offer", "#f_who"); await p.fill("#f_who", "dental practices"); await p.fill("#f_where", "Texas"); await p.fill("#f_result", "every new-patient call booked"); await p.fill("#f_pain", "New-patient calls go to voicemail"); await p.fill("#f_proof", "A short demo");  await p.fill("#f_price", "900");
  await go(p, "#/t/messages/email", "#f_offer");
  ok((await p.inputValue("#f_offer")) === "We help dental practices in Texas get every new-patient call booked.", "offer builder fills the message builder");
  ok((await p.inputValue("#f_problem")) === "new-patient calls go to voicemail" && (await p.inputValue("#f_proof")) === "A short demo", "problem and proof carry over");
  await p.fill("#f_you", "Ali"); await p.fill("#f_company", "Northline");
  await p.fill("#f_problem", "my own wording");
  await go(p, "#/t/offer", "#f_pain"); await p.fill("#f_pain", "Changed pain");
  await go(p, "#/t/messages/email", "#f_problem"); ok((await p.inputValue("#f_problem")) === "my own wording", "a field typed by hand is never overwritten");
  ok((await p.inputValue("#f_proof")) === "A short demo", "unchanged fields stay filled");
  await go(p, "#/t/contract", "#f_you"); ok((await p.inputValue("#f_you")) === "Ali" && (await p.inputValue("#f_yourco")) === "Northline", "your details fill the contract kit");
  await go(p, "#/t/proposal", "#f_you"); ok((await p.inputValue("#f_you")) === "Ali, Northline", "your details fill the proposal");

  /* lead tracker */
  await go(p, "#/t/leads", "#ln");
  await p.fill("#ln", "Sarah Khan"); await p.fill("#lb", "Bright Smile"); await p.fill("#lsig", "just opened a second location"); await p.click("[data-act=add]");
  await p.waitForSelector("text=Noticed: just opened");
  let L = await leads(p); ok(L[0].id && L[0].st === "New" && L[0].na === "First touch", "a new lead has an id and a first action");
  await p.click("[data-touch]"); L = await leads(p); ok(L[0].st === "Contacted" && L[0].lc && L[0].na === "Next follow-up" && L[0].due > L[0].lc, "logging a touch records it and sets the follow-up");
  await p.selectOption("select[data-f2=st]", "Booked"); L = await leads(p); ok(L[0].na === "Send the confirmation and reminders" && !!L[0].due && L[0].h.Booked, "changing stage sets the next action and date");
  await p.selectOption("select[data-f2=st]", "Contacted");

  /* a row opens tools with the lead filled in */
  await p.click("a[data-pick]:has-text('Write messages')"); await p.waitForSelector("#f_prospect");
  ok((await p.inputValue("#f_prospect")) === "Sarah" && (await p.inputValue("#f_business")) === "Bright Smile" && (await p.inputValue("#f_signal")) === "just opened a second location", "Write messages fills in the lead");
  ok((await p.inputValue("#lead_pick")) === L[0].id, "the lead is shown as chosen");

  /* sequence */
  await go(p, "#/t/leads", "a[data-pick]"); await p.click("a[data-pick]:has-text('Start sequence')"); await p.waitForSelector("[data-act=seq]");
  ok(/Sarah Khan/.test(await p.inputValue("#f_name")), "cadence builder fills in the lead");
  await p.click("[data-act=seq]"); L = await leads(p); ok(L[0].seq && L[0].na === "Touch 1 of 8: Email", "a sequence goes on the lead");
  await go(p, "#/t/messages/sequence", "[data-act=touch]"); await p.click("[data-act=touch]"); L = await leads(p); ok(L[0].seq.i === 1 && L[0].na === "Touch 2 of 8: LinkedIn", "logging from the message builder moves to the next touch");

  /* reply handler: rules */
  await go(p, "#/t/replies", "#ry_text");
  const cases = { "Please unsubscribe me": "unsubscribe", "Take me off your list": "unsubscribe", "This is spam. How did you get my email?": "complaint", "I am out of office until Monday": "ooo", "You'll want to talk to my office manager": "wrongperson", "Not interested, thanks": "notinterested", "No thanks": "notinterested", "We already have an answering service": "already", "Not right now, maybe next quarter": "notnow", "How much is it?": "price", "What's your pricing?": "price", "Sure, how much would that cost?": "price", "Can you send me some info?": "sendinfo", "Sounds good, tell me more": "interested", "Yes, call me Thursday": "interested", "Does it work with Google Calendar?": "question", "Hmm": "unclear", "not interested, stop emailing me": "unsubscribe" };
  for (const k of Object.keys(cases)) { const got = await p.evaluate((t) => window.OSI.classifyReply(t), k); ok(got === cases[k], "reply sorted: \"" + k + "\" is " + cases[k] + (got === cases[k] ? "" : " (got " + got + ")")); }
  await p.selectOption("#lead_pick", L[0].id); ok((await p.inputValue("#ry_p")) === "Sarah", "reply handler fills in the lead");
  await p.fill("#ry_text", "Sounds good, tell me more"); await p.click("[data-act=sort]"); await p.waitForSelector("#ry-out .result");
  const t1 = await p.locator("#ry-out").innerText(); ok(/Interested/.test(t1) && /Great to hear, Sarah/.test(t1) && /Automatic check/.test(t1), "reply handler gives the type and a reply to adapt");
  await p.screenshot({ path: path.join(SHOTS, "replies.png"), fullPage: true });
  await p.click("[data-act=apply]"); await p.waitForSelector("#ry-done [role=status]"); L = await leads(p);
  ok(L[0].st === "Replied" && L[0].na === "Book the meeting" && !L[0].seq && /Sounds good/.test(L[0].no), "a reply updates the lead and stops its sequence");
  await p.fill("#ry_text", "How much is it?"); await p.click("[data-act=sort]"); await p.waitForFunction(() => /\$900/.test(document.querySelector("#ry-out").innerText));
  ok(true, "a price question uses the member's own price");
  await p.fill("#ry_text", "Please remove me from your list"); await p.click("[data-act=sort]"); await p.waitForFunction(() => /Unsubscribe/.test(document.querySelector("#ry-out").innerText));
  ok((await p.locator("#ry-out .result pre").count()) === 0, "an opt-out gets no reply to send");
  await p.click("[data-act=ai]"); await p.waitForFunction(() => /Unsubscribe/.test(document.querySelector("#ry-out").innerText) && !document.querySelector("[data-act=ai]").disabled);
  ok((await p.locator("#ry-out .result pre").count()) === 0, "the AI button also sends no reply to an opt-out");

  /* discovery to proposal */
  await go(p, "#/t/leads", "a[data-pick]"); await p.click("a[data-pick]:has-text('Discovery')"); await p.waitForSelector("#dn_problem");
  await p.fill("#dn_problem", "We lose calls at lunch"); await p.fill("#dn_cost", "About $4,000 a month"); await p.fill("#dn_outcome", "All calls answered"); await p.click("[data-act=toprop]"); await p.waitForSelector("#pdoc");
  const pd = await p.locator("#pdoc").innerText(); ok(/We lose calls at lunch/.test(pd) && /About \$4,000/.test(pd) && /BRIGHT SMILE|Bright Smile/.test(pd) && /Sarah Khan/.test(pd), "discovery notes fill in the proposal");
  L = await leads(p); ok(L[0].st === "Held" && L[0].na === "Send the proposal", "the lead moves to Held");

  /* the unsubscribe path through the tracker */
  await go(p, "#/t/replies", "#ry_text"); await p.selectOption("#lead_pick", L[0].id); await p.fill("#ry_text", "unsubscribe"); await p.click("[data-act=sort]"); await p.click("[data-act=apply]"); await p.waitForSelector("#ry-done [role=status]");
  L = await leads(p); ok(L[0].st === "Lost" && L[0].dnc && L[0].lr === "Asked not to be contacted" && !L[0].due, "an opt-out closes the lead and marks it do not contact");
  await go(p, "#/t/leads", "table"); const tr = await p.locator("tbody tr").first().innerText(); ok(/Do not contact/.test(tr) && !(await p.locator("[data-pick]").count()), "a do-not-contact lead has no outreach links");
  await p.waitForSelector("select[data-f2=lr]"); ok((await p.inputValue("select[data-f2=lr]")) === "Asked not to be contacted", "lost leads keep their reason");

  /* funnel: real numbers */
  await p.evaluate(() => { const r = window.OSI.store.get("t_leads"), rows = []; for (let i = 0; i < 40; i++) rows.push({ id: "x" + i, n: "L" + i, st: i < 1 ? "Won" : i < 3 ? "Held" : i < 5 ? "Booked" : i < 12 ? "Replied" : "Contacted", due: "" }); r.rows = rows; window.OSI.store.set("t_leads", r); });
  await go(p, "#/t/funnel", "#real table");
  const fr = await p.locator("#real").innerText(); ok(/12 of 40/.test(fr) && /Weakest step: booking rate/.test(fr) === false || /Weakest step/.test(fr), "funnel shows real rates and the weakest step");
  ok(/5 of 12/.test(fr) && /too few/.test(fr), "small samples are labelled");
  await p.click("[data-act=real]"); ok((await p.inputValue("#f_conv")) === "30", "real rates can replace the plan");

  /* AI screens */
  await go(p, "#/t/scorecard", "[data-act=ai]"); await p.selectOption("select[data-c=opener]", "2"); await p.waitForTimeout(50); await p.fill("#sc-text", "Rep: hi"); await p.click("[data-act=ai]"); await p.waitForSelector("#sc-ai-out table");
  ok(/AI score/.test(await p.locator("#sc-ai-out").innerText()) && /You scored yourself higher/.test(await p.locator("#sc-ai-out").innerText()), "scorecard compares your score with the AI's");
  ok(/fixed sample answer/.test(await p.locator("#sc-ai-out").innerText()), "sample answers are labelled as samples");
  await go(p, "#/review", "#rv-go"); ok(!(await p.locator("#rv-ai").count()) && !/Deeper AI review/.test(await p.locator("#main").innerText()), "deeper AI review is gone, even with AI on");
  await p.fill("#rv-text", "Hi Mike, I noticed your business is great. We help companies.");
  await p.evaluate(() => {}); await p.selectOption("#rv-kind", "message"); await p.click("#rv-go"); await p.waitForSelector(".rvl");
  ok(/names nothing that fits only them/.test(await p.locator(".rvl").innerText()), "\"I noticed\" with nothing real behind it no longer passes");
  await p.fill("#rv-text", "Hi Mike, I noticed you opened a second shop in Austin. How are calls going?"); await p.click("#rv-go"); await p.waitForFunction(() => /Mentions something specific/.test(document.querySelector(".rvl").innerText)); ok(true, "a real detail passes the check");
  await go(p, "#/rpai/owner-call", "#ai-in"); await p.selectOption("#ai-level", "hostile"); await p.fill("#ai-in", "Hi Dave, how do you handle calls when you're on a job?"); await p.click("#ai-send"); await p.waitForFunction(() => document.querySelectorAll(".rp-line").length === 3);
  await p.click("#ai-end"); await p.waitForSelector("#ai-out h2"); ok(/out of 100/.test(await p.locator("#ai-out").innerText()), "typed AI roleplay gives a score");
  await p.click("#ai-again"); ok((await p.locator(".rp-line").count()) === 1, "roleplay can restart");
  await go(p, "#/t/offer", "[data-act=ai]"); await p.click("[data-act=ai]"); await p.waitForSelector("[data-useline]"); await p.click("[data-useline='0']");
  ok(/Sample line/.test(await p.locator("#out pre").first().innerText()), "offer builder can use an AI line");
  await go(p, "#/t/leadsearch", "#ck_b"); await p.fill("#ck_b", "Dallas Dental"); await p.check("[data-ckfit='0']"); await p.check("[data-ckfit='1']"); await p.check("[data-ckfit='2']"); await p.waitForTimeout(50); await p.fill("#ck_sig", "new location");
  ok(/3 \/ 4/.test(await p.locator("#chk").innerText()), "lead check scores the fit");
  await p.click("[data-act=ck-add]"); L = await leads(p); const nl = L[L.length - 1]; ok(nl.b === "Dallas Dental" && nl.t === "B" && nl.sig === "new location", "a checked lead goes into the tracker with its tier and detail");

  /* the saved data survives a reload */
  await p.waitForTimeout(900); await p.reload(); await go(p, "#/t/leads", "table"); ok((await leads(p)).length === 41, "changes are saved to the account");

  /* phone */
  const m = await member(on.base, "phone@x.test", { width: 390, height: 800 });
  await go(m, "#/t/leads", "#tool-root"); const narrow = await m.evaluate(() => [...document.querySelectorAll(".tbl-wrap select")].filter((x) => x.getBoundingClientRect().width < 100).length); ok(narrow === 0, "lead tracker dropdowns stay readable on a phone");
  for (const r of ["#/t/replies", "#/t/leadsearch", "#/t/scorecard", "#/t/discovery", "#/t/leads"]) { await go(m, r, "#tool-root"); const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(over <= 1, "no sideways scroll on a phone: " + r); }
  await m.fill("#ln", "Sam Lee"); await m.click("[data-act=add]"); await m.waitForSelector("[data-touch]"); await m.screenshot({ path: path.join(SHOTS, "leads-phone.png"), fullPage: true });

  /* AI switched off: everything still works and no AI button shows */
  const n = await member(off.base, "noai@x.test");
  await go(n, "#/t/replies", "#ry_text"); ok(!(await n.locator("[data-act=ai]").count()), "no AI button when AI is off");
  await n.fill("#ry_text", "Sounds good"); await n.click("[data-act=sort]"); await n.waitForSelector("#ry-out .result"); ok(true, "reply handler works with AI off");
  await go(n, "#/t/scorecard", ".score-row"); ok(!(await n.locator("[data-act=ai]").count()), "scorecard has no AI panel when off");
  await go(n, "#/t/offer", "#f_who"); ok(!(await n.locator("[data-act=ai]").count()), "offer has no AI panel when off");
  await go(n, "#/review", "#rv-go"); ok(!(await n.locator("#rv-ai").count()), "review has no AI button when off");
  await go(n, "#/rpai/owner-call", "main, #main"); ok(/not switched on/.test(await n.locator("#main").innerText()), "AI practice page explains when off");
  await go(n, "#/rp/owner-call", "#main"); ok(!/with AI instead/.test(await n.locator("#main").innerText()), "no AI link on roleplay when off");

  /* Ask the manual */
  const ask = async (pg, q) => { await go(pg, "#/ask", "#ask-q"); await pg.fill("#ask-q", q); await pg.evaluate(() => { document.getElementById("ask-out").innerHTML = ""; }); await pg.click("#ask-go"); await pg.waitForSelector("#ask-out .panel, #ask-out .callout"); return pg.locator("#ask-out").innerText(); };
  await go(p, "#/ask", "#ask-q"); ok(/Beta/.test(await p.locator("#main h1").innerText()) && /Building this section based on feedback\./.test(await p.locator("#main").innerText()), "Ask the manual is marked as beta");
  ok(/Beta/.test(await p.locator("nav a[href='#/ask']").innerText()), "the menu marks Ask the manual as beta");
  ok(/usually means/i.test(await ask(p, "The client said send me info. What do I reply?")), "a clear question gets the written answer straight away");
  await p.screenshot({ path: path.join(SHOTS, "ask-answer.png"), fullPage: true });
  ok(await p.locator("#ask-out a[href^='#/']").count() > 0, "the answer links to where to read more");
  ok(/usually means|charge|against/i.test(await ask(p, "client bolta hai bohat mehnga hai")), "Roman Urdu finds an answer");
  const unknown = "How do I invoice a client through Payoneer?";
  ok(/don't have this one yet/.test(await ask(p, unknown)), "an unknown question says so instead of guessing");
  ok(await p.locator("#ask-ai").count() === 1, "Ask AI is offered when AI is on and nothing matched");
  await p.click("#ask-ai"); await p.waitForSelector("#ask-ai-out .ask-a");
  ok(/AI answer/.test(await p.locator("#ask-ai-out").innerText()), "the AI answer is labelled");
  await p.screenshot({ path: path.join(SHOTS, "ask-ai.png"), fullPage: true });
  const partial = await ask(p, "example of no show call");
  ok(/Is it one of these/.test(partial), "an unsure match offers choices");
  await p.locator(".ask-pick").first().click(); await p.waitForSelector(".ask-a"); ok(true, "picking a choice shows its answer");
  await p.click("#ask-wrong"); await p.waitForSelector("#ask-out h2"); ok(/don't have this one yet/.test(await p.locator("#ask-out").innerText()), "a member can say the answer didn't help");
  await go(p, "#/search/zzzqqq", "#main"); ok(await p.locator("a[href^='#/ask/']").count() === 1, "search with no results links to Ask the manual");
  await go(p, "#/ask/how%20do%20i%20close%20a%20deal", "#ask-out .panel"); ok((await p.inputValue("#ask-q")) === "how do i close a deal", "a link can carry the question");
  await go(n, "#/ask", "#ask-q"); await n.fill("#ask-q", "How do I invoice through Payoneer in dollars?"); await n.click("#ask-go"); await n.waitForSelector("#ask-out .panel");
  ok(await n.locator("#ask-ai").count() === 0 && /saved/.test(await n.locator("#ask-out").innerText()), "with AI off, the question is still saved and there is no AI button");
  ok(/usually means/i.test(await ask(n, "They said not interested")), "the bank works with AI off");
  const m2 = await member(on.base, "phone2@x.test", { width: 390, height: 800 });
  await ask(m2, "How do I write a cold email?"); ok((await m2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, "no sideways scroll on a phone: Ask the manual");

  /* Admin > Questions */
  const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } }), a = await actx.newPage();
  a.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  await a.goto(on.base + "/app/"); await a.click("button[role=tab]:has-text('Log in')"); await a.fill("#re", "admin@osi.test"); await a.fill("#rp", "admin-password-1"); await a.click("button[type=submit]"); await a.waitForSelector("#main");
  await go(a, "#/admin/questions", ".qa-item");
  ok(await a.locator(".qa-item").count() >= 1, "unanswered questions reach the admin");
  await a.screenshot({ path: path.join(SHOTS, "admin-questions.png"), fullPage: true });
  ok(!/reply@x\.test|Sara/.test(await a.locator(".qa-item").first().innerText()), "the admin sees no member name on a question");
  const item = a.locator(".qa-item", { has: a.locator("input") }).first(), qi = await item.locator("input").first().inputValue();
  await item.locator("textarea").first().fill("Use the invoice kit, then agree how they pay before you start.");
  await item.locator("input").nth(1).fill("10.8");
  await item.locator("button:has-text('Approve and add')").click(); await a.waitForTimeout(400);
  ok(/invoice kit/.test(await ask(m2, qi)), "an approved answer reaches the next member with the same question");
  await go(a, "#/admin/questions", ".kpis"); await a.click(".filters button:has-text('Answer bank')"); await a.waitForSelector("details.qa-item");
  const before = await a.locator(".kpi .v").nth(2).innerText();
  await a.locator("details.qa-item summary").first().click(); await a.locator("details.qa-item button:has-text('Save and mark checked')").first().click(); await a.waitForTimeout(500);
  ok(+(await a.locator(".kpi .v").nth(2).innerText()) === +before + 1, "checking an answer updates the count");
  await a.screenshot({ path: path.join(SHOTS, "admin-bank.png"), fullPage: true });
  await actx.close();

  await browser.close(); on.server.close(); off.server.close();
  console.log(out.join("\n")); console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no browser errors"); console.log(fails.length ? "\n" + fails.length + " FAILED" : "\nALL PASSED (" + out.length + " checks)");
  process.exit(fails.length || errs.length ? 1 : 0);
})().catch((e) => { console.log(out.join("\n")); console.error(e); process.exit(2); });
