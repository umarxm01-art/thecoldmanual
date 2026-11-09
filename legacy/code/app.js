/* The Cold Manual: members app (router, views, progress) */
(function () {
  var O = window.OSI, C = O.cfg, esc = O.esc, root = document.getElementById("root");
  O.L.sort(O.lessonSort);
  var ICON = {
    search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>',
    check: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 6.2 2.4 2.4 4.6-5"/></svg>',
    menu: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
  };
  var LOGO = '<img src="img/logo.svg" alt="" width="32" height="32">', LOGOL = '<img src="img/logo-light.svg" alt="" width="32" height="32">';

  /* ---------- state ---------- */
  function done() { return O.store.get("done", {}); }
  function quiz() { return O.store.get("quiz", {}); }
  function notes() { return O.store.get("notes", {}); }
  function bms() { return O.store.get("bm", {}); }
  function auth() { return O.store.get("auth", null); }
  function lessonsOf(p) { return O.L.filter(function (l) { return l.p === p; }); }
  function progOf(p) { var ls = lessonsOf(p), d = done(); return { n: ls.filter(function (l) { return d[l.id]; }).length, t: ls.length }; }
  function totalDone() { var d = done(); return O.L.filter(function (l) { return d[l.id]; }).length; }
  function nextLesson() { var d = done(); return O.L.filter(function (l) { return !d[l.id]; })[0] || null; }
  function getL(id) { return O.L.filter(function (l) { return l.id === id; })[0]; }
  function tools(key) { var r = O.toolRef ? O.toolRef(key) : null, k = r ? r.key : key; return O.TOOLS.filter(function (t) { return t.key === k; })[0]; }
  function toolHref(key) { var r = O.toolRef ? O.toolRef(key) : null; return r ? r.href : "#/t/" + key; }
  function pg(n, t) { return t ? Math.round(n / t * 100) : 0; }

  /* ---------- the four pillars: every module, tool and practice page belongs to one ---------- */
  var PILLARS = O.PILLARS = [
    { k: "offer", n: 1, t: "Offer", h: "Build an offer people want", sub: "Pick a market with a real problem and the money to fix it, turn what you do into one clear offer, and price it so you earn well from every client.", mods: [1, 14, 15], days: [1, 3],
      tools: ["offer"], practice: [["#/niches", "Niche packs", "Market facts, what sells and lead sources for 30 markets"], ["#/prompts", "Prompt library", "Prompts for research and writing your offer"]] },
    { k: "outreach", n: 2, t: "Outreach", h: "Reach owners on every channel", sub: "Build a clean list, then run cold email, LinkedIn, Facebook, Instagram, calls, video and referrals as one sequence for each prospect.", mods: [2, 3, 4, 5, 6, 16], days: [4, 14],
      tools: ["leadsearch", "messages", "cadence", "emailcheck"], practice: [["#/drills", "Communication drills", "Openers, gatekeepers, voicemails and video intros"], ["#/rp/email-brushoff", "Roleplay: “Just send me an email”", "Keep the conversation going when they brush you off"], ["#/review", "Call and email review", "Score a cold email, DM or call before you send it"]] },
    { k: "setting", n: 3, t: "Appointment setting", h: "Turn replies into booked meetings", sub: "Find out quickly whether they want the problem fixed, book a short meeting while they're interested and make sure they turn up.", mods: [7], days: [15, 21],
      tools: ["replies", "qualifier", "leads", "funnel"], practice: [["#/rp/dm-howmuch", "Roleplay: “How much is it?” in a DM", "Book the meeting instead of quoting in a message"], ["#/rp/email-reply", "Roleplay: “We already have someone”", "Stay curious and keep the door open"], ["#/drills", "Booking drills", "Confirming, rebooking and no-show calls"]] },
    { k: "closing", n: 4, t: "Closing", h: "Close the deal, then keep the client", sub: "Ask the questions in the right order, agree on the fix, say the price once, handle objections calmly and know what to do after they pay.", mods: [8, 9, 10], days: [22, 30],
      tools: ["discovery", "proposal", "objections", "scorecard"], practice: [["#/rp/price-think", "Roleplay: Price and “I'll think about it”", "Hold your price without pushing"], ["#/t/objections", "Objection bank", "36 objections with a reply and a question to ask next"], ["#/playbooks", "Playbooks", "Annotated discovery and closing calls"]] },
    { k: "grow", n: 0, t: "Run and grow", h: "Run it like a business", sub: "Measure your numbers, set up your tools and build the routine that keeps clients coming.", mods: [11, 12, 13], days: null,
      tools: ["contract", "delivery"], practice: [["#/playbooks", "Playbooks", "Kickoff calls and client conversations"]] }
  ];
  var PICON = {
    offer: '<path d="M10.5 3.5H16a.5.5 0 0 1 .5.5v5.5L9.2 16.8a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z"/><circle cx="13" cy="7" r="1.3"/>',
    outreach: '<path d="M17 3 8.5 11.5M17 3l-5.2 14-3.3-5.5L3 8.2z"/>',
    setting: '<rect x="3" y="4.5" width="14" height="12.5" rx="1.5"/><path d="M3 8.5h14M7 3v3M13 3v3M7.5 12.5l1.8 1.8 3.5-3.6"/>',
    closing: '<path d="M4 10.5 8 14.5 16 5.5"/>',
    grow: '<path d="M3 16.5h14M5.5 13.5v-3M9.5 13.5V8M13.5 13.5V5"/>'
  };
  function picon(k) { return '<svg class="pi" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PICON[k] || "") + "</svg>"; }
  O.pillarIcon = picon;
  function pillarByKey(k) { return PILLARS.filter(function (x) { return x.k === k; })[0]; }
  function pillarOfModule(id) { return PILLARS.filter(function (x) { return x.mods.indexOf(id) >= 0; })[0] || PILLARS[0]; }
  function pillarOfDay(d) { return PILLARS.filter(function (x) { return x.days && d >= x.days[0] && d <= x.days[1]; })[0] || PILLARS[0]; }
  function pillarProg(x) { var n = 0, t = 0; x.mods.forEach(function (m) { var pr = progOf(m); n += pr.n; t += pr.t; }); return { n: n, t: t }; }
  function pillarName(x) { return x.n ? "Pillar " + x.n + ": " + x.t : x.t; }
  /* which pillar the member is working on: the 30-day plan's day if they started it, otherwise their next lesson */
  function currentPillar() {
    var t = O.store.get("trk", null), nx = nextLesson();
    if (t && t.start) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.start); if (m) { var st = new Date(+m[1], +m[2] - 1, +m[3]), td = new Date(); td.setHours(0, 0, 0, 0); var day = Math.max(1, Math.min(30, Math.round((td - st) / 86400000) + 1)); return pillarOfDay(day); } }
    return nx ? pillarOfModule(nx.p) : PILLARS[3];
  }
  O.pillarOfDay = pillarOfDay; O.pillarOfModule = pillarOfModule; O.currentPillar = function () { return currentPillar(); };
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  /* ---------- login ---------- */
  function renderLogin(msg) {
    document.title = "Log in | The Cold Manual";
    root.innerHTML = '<div class="login"><div class="login-side"><a class="mark light" href="index.html">' + LOGOL + "<b>The Cold Manual</b></a><div><h1>Welcome back</h1><p>Pick up where you left off. Your progress, notes and tool entries are saved on this device.</p></div><p class=\"small\" style=\"margin:0\">Not a member yet? <a href=\"index.html#price\">Get access</a></p></div>" +
      '<form class="login-form" id="lf" novalidate><h2>Log in</h2><div class="field"><label for="le">Email</label><input id="le" type="email" autocomplete="email" required></div><div class="field"><label for="lc">Access code</label><input id="lc" type="password" autocomplete="current-password" required></div><button class="btn primary" type="submit">Log in</button><p class="err" id="lerr" role="alert">' + esc(msg || "") + '</p><p class="preview-note">Preview build. The access code is checked in this page, so it is not secure. Replace it with real accounts before you sell (see DEPLOY.md).</p></form></div>';
    document.getElementById("lf").addEventListener("submit", function (e) {
      e.preventDefault();
      var em = document.getElementById("le").value.trim().toLowerCase(), cd = document.getElementById("lc").value.trim(), err = document.getElementById("lerr");
      if (!validEmail(em)) { err.textContent = "Enter a valid email address."; return; }
      var ok = (C.accessCodes || []).some(function (c) { return c === cd; });
      if (!ok) { err.textContent = "That access code is not right. Check your purchase email."; return; }
      O.store.set("auth", { email: em, t: Date.now() });
      if (!O.store.get("name", "")) O.store.set("name", em.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }));
      location.hash = "#/"; boot();
    });
    document.getElementById("le").focus();
  }

  /* ---------- shell ---------- */
  var RAIL_OPEN = false;
  function shell(route, inner, crumbs) {
    var d = totalDone(), name = O.store.get("name", "Member"), ini = (name.trim().charAt(0) || "M").toUpperCase();
    function a(href, label, key, right) { return '<a href="#/' + href + '"' + (route === key || route.indexOf(key + "/") === 0 && key ? ' aria-current="page"' : "") + "><span>" + label + "</span>" + (right ? '<span class="n">' + right + "</span>" : "") + "</a>"; }
    var cur = route.split("/");
    var rail = '<aside class="rail" id="rail" aria-label="Main"><a class="mark light" href="#/">' + LOGOL + "<b>The Cold Manual</b></a><nav>" +
      '<h5>Learn</h5><a href="#/"' + (route === "" ? ' aria-current="page"' : "") + "><span>Home</span></a>" +
      O.P.map(function (p) { var pr = progOf(p.id); return '<a href="#/p/' + p.id + '"' + ((cur[0] === "p" && cur[1] == p.id) || (cur[0] === "l" && cur[1].split(".")[0] == p.id) ? ' aria-current="page"' : "") + "><span>" + p.id + ". " + esc(p.title) + '</span><span class="n">' + pr.n + "/" + pr.t + "</span></a>"; }).join("") +
      '<h5>Practise</h5><a href="#/playbooks"' + (cur[0] === "playbooks" || cur[0] === "pb" ? ' aria-current="page"' : "") + "><span>Playbooks</span></a>" +
      '<a href="#/t/objections"' + (route === "t/objections" ? ' aria-current="page"' : "") + "><span>Objection bank</span></a>" +
      '<a href="#/roleplay"' + (cur[0] === "roleplay" || cur[0] === "rp" || cur[0] === "rpai" ? ' aria-current="page"' : "") + "><span>Roleplay lab</span></a>" +
      '<a href="#/review"' + (cur[0] === "review" ? ' aria-current="page"' : "") + "><span>Call and email review</span></a>" +
      '<a href="#/tools"' + (cur[0] === "tools" || (cur[0] === "t" && cur[1] !== "objections") ? ' aria-current="page"' : "") + "><span>Tools</span></a>" +
      '<h5>Library</h5><a href="#/niches"' + (cur[0] === "niches" || cur[0] === "niche" ? ' aria-current="page"' : "") + "><span>Niche packs</span></a>" +
      '<a href="#/prompts"' + (cur[0] === "prompts" ? ' aria-current="page"' : "") + "><span>Prompt library</span></a>" +
      '<a href="#/t/contract"' + (route === "t/contract" ? ' aria-current="page"' : "") + "><span>Contract kit</span></a>" +
      '<h5>Reference</h5><a href="#/cert"' + (cur[0] === "cert" ? ' aria-current="page"' : "") + "><span>Certificate</span></a>" +
      '<a href="#/settings"' + (cur[0] === "settings" ? ' aria-current="page"' : "") + "><span>Settings</span></a></nav>" +
      '<p class="rail-foot">' + d + " of " + O.L.length + " lessons complete.</p></aside>";
    var top = '<header class="topbar"><button type="button" class="btn sm menu" id="menu" aria-label="Open menu" aria-expanded="false" aria-controls="rail">' + ICON.menu + '</button><form class="search" id="sf" role="search"><label class="sr" for="sq">Search the platform</label>' + ICON.search + '<input id="sq" type="search" placeholder="Search lessons, objections, tools" autocomplete="off"></form><span class="spacer"></span><div class="me"><span class="nm">' + esc(name) + '</span><span class="av" aria-hidden="true">' + esc(ini) + "</span></div></header>";
    root.innerHTML = '<div class="app">' + rail + '<div><a class="sr" href="#main">Skip to content</a>' + top + '<main class="main" id="main" tabindex="-1">' + (crumbs ? '<nav class="crumbs" aria-label="Breadcrumb">' + crumbs + "</nav>" : "") + inner + "</main></div></div>";
    var rl = document.getElementById("rail"), mb = document.getElementById("menu");
    function setRail(o) { RAIL_OPEN = o; rl.classList.toggle("open", o); mb.setAttribute("aria-expanded", String(o)); }
    mb.addEventListener("click", function () { setRail(!RAIL_OPEN); });
    rl.addEventListener("click", function (e) { if (e.target.closest("a")) setRail(false); });
    document.addEventListener("keydown", function esch(e) { if (e.key === "Escape" && RAIL_OPEN) setRail(false); });
    document.getElementById("sf").addEventListener("submit", function (e) { e.preventDefault(); var q = document.getElementById("sq").value.trim(); if (q) location.hash = "#/search/" + encodeURIComponent(q); });
  }

  /* ---------- views ---------- */
  /* module boxes: one binder divider per program, with its colour tab */
  function modBoxes(long, ids) {
    var nx = nextLesson();
    return '<ul class="mods">' + O.P.filter(function (p) { return !ids || ids.indexOf(p.id) >= 0; }).slice().sort(function (a, b) { return O.modRank(a.id) - O.modRank(b.id); }).map(function (p) {
      var pr = progOf(p.id), pc = pg(pr.n, pr.t), fin = pr.t && pr.n === pr.t, now = nx && nx.p === p.id;
      var act = fin ? "Done" : pr.n ? "Continue" : "Start";
      return '<li class="mod-box' + (fin ? " done" : "") + (now ? " now" : "") + '" data-m="' + p.id + '"><h3><a href="#/p/' + p.id + '">' + esc(p.title) + "</a></h3>" + (long ? "<p>" + esc(p.blurb) + "</p>" : "") + '<div class="foot"><div class="bar" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + esc(p.title) + ' progress"><i style="width:' + pc + '%"></i></div><span>' + pr.n + " of " + pr.t + " lessons</span><b>" + act + "</b></div></li>";
    }).join("") + "</ul>";
  }
  /* the four pillars (plus run and grow) as a row of progress boxes */
  function pillarStrip(cur) {
    return '<ol class="pillars">' + PILLARS.map(function (x) { var pr = pillarProg(x), pc = pg(pr.n, pr.t), on = cur && cur.k === x.k;
      return '<li class="pillar' + (on ? " now" : "") + (pr.t && pr.n === pr.t ? " done" : "") + '"><a href="#/pillar/' + x.k + '"><span class="pn">' + picon(x.k) + '</span><span class="pnum">' + (x.n ? "Pillar " + x.n : "Then") + '</span><b>' + esc(x.t) + '</b><span class="pl">' + (on ? "You are here" : pr.n + " of " + pr.t + " lessons") + '</span><span class="bar" aria-hidden="true"><i style="width:' + pc + '%"></i></span></a></li>'; }).join("") + "</ol>";
  }
  function pillarSection(x, long) {
    var pr = pillarProg(x);
    return '<section class="pillar-sec" id="pl-' + x.k + '"><div class="section-head"><h2><a href="#/pillar/' + x.k + '">' + esc(pillarName(x)) + '</a></h2><p>' + pr.n + " of " + pr.t + " lessons</p></div>" + (long ? '<p class="pillar-sub">' + esc(x.sub) + "</p>" : "") + modBoxes(long, x.mods) + "</section>";
  }
  function vPillar(k) {
    var x = pillarByKey(k); if (!x) return v404();
    document.title = x.t + " | The Cold Manual";
    var pr = pillarProg(x), pc = pg(pr.n, pr.t), cur = currentPillar(), i = PILLARS.indexOf(x), nxp = PILLARS[i + 1];
    var h = '<div class="mod-head pillar-head"><span class="pillar-ic" aria-hidden="true">' + picon(x.k) + '</span><p class="sys">' + (x.n ? "Pillar " + x.n + " of 4" : "After the four pillars") + (cur.k === x.k ? " · You are here" : "") + "</p><h1>" + esc(x.h) + "</h1><p>" + esc(x.sub) + '</p><div class="prog"><div class="bar"><i style="width:' + pc + '%"></i></div><span>' + pr.n + " of " + pr.t + " lessons done</span></div></div>";
    h += '<div class="section-head"><h2>Modules</h2></div>' + modBoxes(true, x.mods);
    h += '<div class="section-head"><h2>Tools for this step</h2><a href="#/tools">All tools</a></div><div class="lrows tool-list">' + x.tools.map(function (key) { var t = tools(key); return t ? '<a class="prow" href="#/t/' + t.key + '"><b>' + esc(t.title) + "</b><span>" + esc(t.desc) + "</span></a>" : ""; }).join("") + "</div>";
    h += '<div class="section-head"><h2>Practise it</h2></div><div class="lrows tool-list">' + x.practice.map(function (p) { return '<a class="prow" href="' + p[0] + '"><b>' + esc(p[1]) + "</b><span>" + esc(p[2]) + "</span></a>"; }).join("") + "</div>";
    h += '<p class="help-line">Stuck on this step? <a href="#/upgrades">Book a 1:1 strategy call</a> and we’ll work through it with you.</p>';
    if (nxp) h += '<p class="row"><a class="btn" href="#/pillar/' + nxp.k + '">Next: ' + esc(pillarName(nxp)) + "</a></p>";
    return { html: h, route: "pillar/" + k, crumbs: '<a href="#/programs">Modules</a> / ' + esc(pillarName(x)) };
  }
  var QI = {
    play: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 3.5h9l3 3V16.5H4z"/><path d="M7 9h6M7 12h4"/></svg>',
    obj: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-3.5 3v-3a2 2 0 0 1-2-2z"/><path d="M10 6.5v2.5M10 11.2v.1"/></svg>',
    role: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5 5 5c-.6.6-.6 1.6 0 2.4a19 19 0 0 0 7.6 7.6c.8.6 1.8.6 2.4 0l1.5-1.5-2.8-2.3-1.6 1a10 10 0 0 1-4.3-4.3l1-1.6z"/></svg>',
    mic: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7.5" y="3" width="5" height="9" rx="2.5"/><path d="M4.5 10a5.5 5.5 0 0 0 11 0M10 15.5V17.5"/></svg>',
    sprint: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="13" height="12" rx="1.5"/><path d="M3.5 8.5h13M7 3v3M13 3v3M7 12l2 2 4-4"/></svg>',
    niche: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 17s5.5-5 5.5-9.2a5.5 5.5 0 0 0-11 0C4.5 12 10 17 10 17z"/><circle cx="10" cy="7.8" r="2"/></svg>',
    review: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 8 14.5 16 5.5"/></svg>',
    kit: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="10" rx="1.5"/><path d="M7.5 6V4.5h5V6M3 10.5h14"/></svg>'
  };
  function vHome() {
    document.title = "Home | The Cold Manual";
    var nx = nextLesson(), d = totalDone(), mins = 0, dn = done();
    O.L.forEach(function (l) { if (dn[l.id]) mins += l.min; });
    var qs = quiz(), qk = Object.keys(qs), qavg = qk.length ? Math.round(qk.reduce(function (s, k) { return s + qs[k]; }, 0) / qk.length * 100) : null;
    var line = d ? "You've finished " + d + " of " + O.L.length + " lessons (" + mins + " minutes of reading)" + (qavg == null ? "." : ", with an average quiz score of " + qavg + "%.") : "Your " + O.L.length + " lessons are in " + O.P.length + " modules. Start with the first one.";
    var hr = new Date().getHours(), first = String(O.store.get("name", "") || "").trim().split(/\s+/)[0];
    var hi = (hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening") + (first ? ", " + first : "");
    var h = '<div class="hello"><p class="hello-k">Today</p><h1>' + esc(hi) + "</h1><p>" + esc(line) + "</p></div>";
    /* first visit: nothing done and the plan not started. Show one welcome with one next step; the rest appears once they start or choose to look around */
    if (!d && !(O.store.get("trk", {}) || {}).start && !O.store.get("home_full", false)) {
      return { html: '<div class="hello"><p class="hello-k">Welcome</p><h1>' + esc(first ? "Welcome, " + first : "Welcome") + '</h1></div><div id="next-moves"></div>', route: "" };
    }
    if (nx) {
      var started = d > 0, np = O.P[nx.p - 1];
      h += '<section class="up-next" data-m="' + nx.p + '"><div><p class="kicker">' + (started ? "Pick up where you left off in " : "Start here, in ") + "<b>" + esc(np.title) + "</b></p><h2>" + esc(nx.id + " " + nx.t) + "</h2><p>" + esc(nx.idea) + '</p><p class="meta">About ' + nx.min + ' minutes to read, plus a short quiz.</p></div><a class="btn primary" href="#/l/' + nx.id + '">' + (started ? "Continue lesson" : "Start lesson " + nx.id) + "</a></section>";
    } else h += '<section class="up-next"><div><h2>You have finished every lesson</h2><p>Download your certificate, then keep the tools in your weekly routine.</p></div><a class="btn primary" href="#/cert">Open certificate</a></section>';
    var cur = currentPillar();
    h = h.replace('<section class="up-next"', '<div id="next-moves"></div><section class="up-next"');
    h += '<div class="section-head"><h2>Your four pillars</h2><a href="#/programs">All modules</a></div>' + pillarStrip(cur);
    h += '<div class="section-head"><h2>' + esc(pillarName(cur)) + '</h2><a href="#/pillar/' + cur.k + '">Tools and practice for this step</a></div>' + modBoxes(false, cur.mods);
    var bm = bms(), saved = O.L.filter(function (l) { return bm[l.id]; });
    if (saved.length) h += '<div class="section-head"><h2>Saved lessons</h2></div><div class="lrows">' + saved.map(lrow).join("") + "</div>";
    return { html: h, route: "" };
  }
  function lrow(l) {
    var d = done()[l.id], nx = nextLesson(), isNext = nx && nx.id === l.id;
    return '<a class="lrow' + (isNext ? " next" : "") + '" data-m="' + l.p + '" href="#/l/' + l.id + '"><span class="id">' + l.id + '</span><span class="tt">' + esc(l.t) + '<span class="ds">' + esc(l.idea) + '</span></span><span class="mn">' + (isNext ? "Up next" : l.min + " min") + '</span><span class="ck' + (d ? " on" : "") + '" role="img" aria-label="' + (d ? "Complete" : "Not complete") + '">' + (d ? ICON.check : "") + "</span></a>";
  }
  function vPrograms() {
    document.title = "Modules | The Cold Manual";
    return { html: '<div class="page-head"><h1>Modules</h1><p>' + O.P.length + " modules in four pillars: offer, outreach, appointment setting and closing, then running it as a business. Work through them in order, or skip ahead when you need a specific skill this week.</p></div>" + pillarStrip(currentPillar()) + PILLARS.map(function (x) { return pillarSection(x, true); }).join(""), route: "programs" };
  }
  function vProgram(id) {
    var p = O.P[id - 1]; if (!p) return v404();
    document.title = p.title + " | The Cold Manual";
    var pr = progOf(p.id);
    return { html: '<div class="mod-head" data-m="' + p.id + '"><span class="no" aria-hidden="true">' + p.id + "</span><h1>" + esc(p.title) + "</h1><p>" + esc(p.blurb) + '</p><div class="prog"><div class="bar"><i style="width:' + pg(pr.n, pr.t) + '%"></i></div><span>' + pr.n + " of " + pr.t + ' lessons done</span></div></div><div class="lrows">' + lessonsOf(p.id).map(lrow).join("") + "</div>", route: "p/" + id, crumbs: '<a href="#/programs">Modules</a> / ' + esc(p.title) };
  }
  function vLesson(id) {
    var l = getL(id); if (!l) return v404();
    document.title = l.t + " | The Cold Manual";
    var m = O.md(l.md), idx = O.L.indexOf(l), prev = O.L[idx - 1], next = O.L[idx + 1], dn = done()[l.id], bm = bms()[l.id], p = O.P[l.p - 1], tl = l.tool ? (tools(l.tool) || (O.TOOL_ALIAS[l.tool] === "#/track" ? { key: l.tool, title: "" } : null)) : null;
    var h = '<article class="lesson" data-m="' + l.p + '"><div><a class="mod-line" href="#/p/' + p.id + '">Module ' + p.id + ": " + esc(p.title) + "</a><h1>" + esc(l.t) + '</h1><div class="lesson-meta"><span>Lesson ' + l.id + "</span><span>About " + l.min + ' minutes</span></div><p class="idea">' + esc(l.idea) + '</p><div class="prose">' + m.html + (l.call ? O.callHtml(l.call, { R: "Rep", P: "Prospect" }) : "") + "</div>";
    h += '<section class="practice"><h3>Do this today</h3><p>' + esc(l.drill) + "</p>" + (tl ? '<a class="btn sm" href="' + toolHref(l.tool) + '">' + (O.TOOL_ALIAS[l.tool] === "#/track" ? "Log it in your 30-day plan" : "Open " + esc(tl.title)) + "</a>" : "") + "</section>";
    h += '<section class="quiz" id="quiz" aria-label="Check your understanding"><h3>Check your understanding</h3>' + l.quiz.map(function (q, i) { return '<div class="q" data-q="' + i + '"><p class="qt">' + (i + 1) + ". " + esc(q[0]) + '</p><div role="group" aria-label="Answers">' + q[1].map(function (o, j) { return '<button type="button" class="opt" data-o="' + j + '">' + esc(o) + "</button>"; }).join("") + '</div><div class="why-box" hidden></div></div>'; }).join("") + '<p id="qres" class="muted" role="status"></p></section>';
    h += '<section class="notes"><label for="nt">Your notes</label><textarea id="nt" placeholder="What will you change after this lesson?">' + esc(notes()[l.id] || "") + "</textarea></section>";
    h += '<div class="lesson-actions no-print"><div class="row"><button type="button" class="btn ' + (dn ? "" : "primary") + '" id="mark">' + (dn ? "Marked complete (undo)" : "Mark complete") + '</button><button type="button" class="btn" id="bm" aria-pressed="' + !!bm + '">' + (bm ? "Saved" : "Save lesson") + "</button></div><div class=\"row\">" + (prev ? '<a class="btn sm" href="#/l/' + prev.id + '">Previous</a>' : "") + (next ? '<a class="btn sm signal" href="#/l/' + next.id + '">Next lesson</a>' : '<a class="btn sm signal" href="#/cert">Certificate</a>') + "</div></div></div>";
    h += '<aside class="lesson-aside" aria-label="On this page"><h5>On this page</h5><ol>' + m.outline.map(function (o) { return '<li><a href="#/l/' + l.id + '" data-jump="' + o.id + '">' + esc(o.t) + "</a></li>"; }).join("") + (l.call ? '<li><a href="#/l/' + l.id + '" data-jump="callx">Annotated call</a></li>' : "") + '<li><a href="#/l/' + l.id + '" data-jump="quiz">Quiz</a></li></ol>' + "</aside></article>";
    return { html: h, route: "l/" + id, crumbs: '<a href="#/programs">Modules</a> / <a href="#/p/' + p.id + '">' + esc(p.title) + "</a> / Lesson " + l.id, after: function () { lessonBind(l); } };
  }
  function lessonBind(l) {
    var qwrap = document.getElementById("quiz"), ans = {}, right = 0;
    var firstCall = document.querySelector(".prose .call"); if (firstCall) firstCall.id = "callx";
    qwrap.addEventListener("click", function (e) {
      var b = e.target.closest(".opt"); if (!b) return;
      var qe = b.closest(".q"), qi = +qe.getAttribute("data-q"), q = l.quiz[qi];
      if (ans[qi] != null) return;
      var oj = +b.getAttribute("data-o"); ans[qi] = oj;
      Array.prototype.forEach.call(qe.querySelectorAll(".opt"), function (x, j) { x.disabled = true; if (j === q[2]) x.classList.add("ok"); else if (j === oj) x.classList.add("no"); });
      var w = qe.querySelector(".why-box"); w.hidden = false; w.innerHTML = "<b>" + (oj === q[2] ? "Right. " : "Not quite. ") + "</b>" + O.inline(q[3]);
      if (oj === q[2]) right++;
      if (Object.keys(ans).length === l.quiz.length) {
        var sc = right / l.quiz.length, qs = quiz(); qs[l.id] = Math.max(qs[l.id] || 0, sc); O.store.set("quiz", qs);
        document.getElementById("qres").innerHTML = "You scored " + right + " of " + l.quiz.length + '. <button type="button" class="btn sm" id="retry">Try again</button>';
        document.getElementById("retry").addEventListener("click", function () { render(); });
      }
    });
    var nt = document.getElementById("nt"), tm;
    nt.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { var n = notes(); n[l.id] = nt.value; O.store.set("notes", n); }, 300); });
    nt.addEventListener("blur", function () { var n = notes(); n[l.id] = nt.value; O.store.set("notes", n); });
    document.getElementById("mark").addEventListener("click", function () { var d = done(); if (d[l.id]) delete d[l.id]; else d[l.id] = Date.now(); O.store.set("done", d); O.ui.toast(d[l.id] ? "Lesson complete" : "Marked incomplete"); render(true); });
    document.getElementById("bm").addEventListener("click", function () { var b = bms(); if (b[l.id]) delete b[l.id]; else b[l.id] = true; O.store.set("bm", b); O.ui.toast(b[l.id] ? "Saved" : "Removed"); render(true); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-jump]"), function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var t = document.getElementById(a.getAttribute("data-jump")); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }); });
  }
  function vPlaybooks() {
    document.title = "Playbooks | The Cold Manual";
    var cats = (O.PB_CATS || []).filter(function (c) { return O.PB.some(function (p) { return p.cat === c; }); });
    function rows(c) { return O.PB.filter(function (p) { return c === "All" || p.cat === c; }).map(function (p) { return '<a class="prow" href="#/pb/' + p.id + '"><b>' + esc(p.title) + "</b><span>" + esc(p.situation) + "</span></a>"; }).join(""); }
    var h = '<div class="page-head"><h1>Playbooks</h1><p>' + O.PB.length + " real-world calls and conversations, line by line, with a note on why each line works. Read one, then say it out loud in your own words.</p></div>" +
      (cats.length ? '<div class="filters" role="group" aria-label="Filter playbooks" id="pbcats">' + ["All"].concat(cats).map(function (c, i) { return '<button type="button" data-pbc="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="lrows" id="pbrows">' + rows("All") + "</div>";
    return { html: h, route: "playbooks", after: function () {
      var bar = document.getElementById("pbcats"); if (!bar) return;
      bar.addEventListener("click", function (e) { var b = e.target.closest("[data-pbc]"); if (!b) return; Array.prototype.forEach.call(bar.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", String(x === b)); }); document.getElementById("pbrows").innerHTML = rows(b.getAttribute("data-pbc")); });
    } };
  }
  function vPlaybook(id) {
    var p = O.PB.filter(function (x) { return x.id === id; })[0]; if (!p) return v404();
    document.title = p.title + " | The Cold Manual";
    function ul(a) { return "<ul>" + a.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>"; }
    var rp = p.rp && O.RP ? O.RP.filter(function (x) { return x.id === p.rp; })[0] : null, dr = p.drill && O.DRILLS ? O.DRILLS.filter(function (x) { return x.id === p.drill; })[0] : null;
    var idx = O.PB.indexOf(p), nx = O.PB[idx + 1];
    var h = '<div class="page-head"><h1>' + esc(p.title) + "</h1><p>" + esc(p.situation) + "</p></div>" +
      '<dl class="pb-setup"><div><dt>Your goal</dt><dd>' + esc(p.goal) + "</dd></div>" + (p.setting ? "<div><dt>When and where</dt><dd>" + esc(p.setting) + "</dd></div>" : "") + "</dl>" +
      (p.prep && p.prep.length ? '<div class="panel"><h2>Before you call</h2>' + ul(p.prep) + "</div>" : "") +
      O.callHtml({ title: p.title, meta: "Example, with notes", turns: p.turns, names: p.names || { R: "You", P: "Prospect" } }) +
      '<div class="pb-two">' + (p.avoid && p.avoid.length ? '<div class="panel"><h2>Don\'t say or do</h2>' + ul(p.avoid) + "</div>" : "") + '<div class="panel"><h2>Take away</h2>' + ul(p.take) + "</div></div>" +
      (rp || dr ? '<div class="panel"><h2>Practise it</h2><div class="row">' + (rp ? '<a class="btn primary" href="#/rp/' + rp.id + '">Roleplay: ' + esc(rp.title) + "</a>" : "") + (dr ? '<a class="btn" href="#/drill/' + dr.id + '">Communication drill: ' + esc(dr.title) + "</a>" : "") + "</div></div>" : "") +
      '<p class="muted small">Names and businesses are examples. Adapt the wording to your offer, and never claim results you cannot show.</p>' + (nx ? '<p><a class="btn sm" href="#/pb/' + nx.id + '">Next playbook: ' + esc(nx.title) + "</a></p>" : "");
    return { html: h, route: "pb/" + id, crumbs: '<a href="#/playbooks">Playbooks</a> / ' + esc(p.title) };
  }
  function vTools() {
    document.title = "Tools | The Cold Manual";
    var row = function (t) { return '<a class="prow" href="#/t/' + t.key + '"><b>' + esc(t.title) + "</b><span>" + esc(t.desc) + "</span></a>"; }, seen = {};
    var body = PILLARS.map(function (x) { var ts = x.tools.map(tools).filter(Boolean); ts.forEach(function (t) { seen[t.key] = 1; }); return '<div class="section-head"><h2><a href="#/pillar/' + x.k + '">' + esc(pillarName(x)) + '</a></h2><p>' + ts.length + " tool" + (ts.length === 1 ? "" : "s") + '</p></div><div class="lrows tool-list">' + ts.map(row).join("") + "</div>"; }).join("");
    var rest = O.TOOLS.filter(function (t) { return !seen[t.key]; });
    if (rest.length) body += '<div class="section-head"><h2>More tools</h2></div><div class="lrows tool-list">' + rest.map(row).join("") + "</div>";
    return { html: '<div class="page-head"><h1>Tools</h1><p>' + O.TOOLS.length + " working tools, sorted by the pillar they help with. Your entries are saved to your account.</p></div>" + body, route: "tools" };
  }
  function vTool(key, sub) {
    var al = O.TOOL_ALIAS[key];
    if (al && al.charAt(0) === "#") { location.replace(al); return { html: "", route: al.slice(2) }; }
    if (al) { var ap = al.split("/"); key = ap[0]; sub = sub || ap[1]; try { history.replaceState(null, "", "#/t/" + key + (sub ? "/" + sub : "")); } catch (e) {} }
    var t = tools(key); if (!t) return v404();
    document.title = t.title + " | The Cold Manual";
    var rel = t.lessons.map(function (id) { var l = getL(id); return l ? '<a href="#/l/' + l.id + '">' + l.id + " " + esc(l.t) + "</a>" : ""; }).filter(Boolean).join(", ");
    return { html: '<div class="page-head"><h1>' + esc(t.title) + "</h1><p>" + esc(t.desc) + (rel ? " Related: " + rel + "." : "") + '</p></div><div id="tool-root"></div>', route: "t/" + key, crumbs: '<a href="#/tools">Tools</a> / ' + esc(t.title), after: function () { t.render(document.getElementById("tool-root"), { sub: sub || "" }); } };
  }
  function vSearch(q) {
    q = decodeURIComponent(q || ""); document.title = "Search | The Cold Manual";
    var s = q.toLowerCase(), words = s.split(/\s+/).filter(Boolean);
    function hit(txt) { txt = txt.toLowerCase(); return words.every(function (w) { return txt.indexOf(w) > -1; }); }
    var L = O.L.filter(function (l) { return hit(l.t + " " + l.idea + " " + l.md + " " + l.drill); }),
      OB = O.OBJ.filter(function (o) { return hit(o.q + " " + o.reply + " " + o.means); }),
      PB = O.PB.filter(function (p) { return hit(p.title + " " + p.situation + " " + p.turns.map(function (t) { return t[1]; }).join(" ")); }),
      TT = O.TOOLS.filter(function (t) { return hit(t.title + " " + t.desc); });
    var n = L.length + OB.length + PB.length + TT.length, h = '<div class="page-head"><h1>Search</h1><p>' + n + ' result' + (n === 1 ? "" : "s") + ' for "' + esc(q) + '".</p></div>';
    if (!n) h += '<div class="panel"><p style="margin:0">Nothing found. Try a shorter word, such as "price", "voicemail" or "LinkedIn", or <a href="#/ask/' + encodeURIComponent(q) + '">ask the manual</a>.</p></div>';
    if (L.length) h += '<div class="section-head"><h2>Lessons</h2></div><div class="lrows">' + L.map(lrow).join("") + "</div>";
    if (OB.length) h += '<div class="section-head"><h2>Objections</h2></div><div class="lrows">' + OB.map(function (o) { return '<a class="prow" href="#/t/objections"><b>' + esc(o.q) + "</b><span>" + esc(o.cat) + ": " + esc(o.reply.slice(0, 120)) + "...</span></a>"; }).join("") + "</div>";
    if (PB.length) h += '<div class="section-head"><h2>Playbooks</h2></div><div class="lrows">' + PB.map(function (p) { return '<a class="prow" href="#/pb/' + p.id + '"><b>' + esc(p.title) + "</b><span>" + esc(p.situation) + "</span></a>"; }).join("") + "</div>";
    if (TT.length) h += '<div class="section-head"><h2>Tools</h2></div><div class="lrows">' + TT.map(function (t) { return '<a class="prow" href="#/t/' + t.key + '"><b>' + esc(t.title) + "</b><span>" + esc(t.desc) + "</span></a>"; }).join("") + "</div>";
    return { html: h, route: "search", after: function () { var i = document.getElementById("sq"); if (i) i.value = q; } };
  }
  function vCert() {
    document.title = "Certificate | The Cold Manual";
    var d = totalDone(), all = d === O.L.length, name = O.store.get("name", "Member");
    if (!all) return { html: '<div class="page-head"><h1>Certificate</h1><p>Complete all ' + O.L.length + " lessons to unlock your certificate of completion. You have finished " + d + '.</p></div><div class="bar lg" style="max-width:420px"><i style="width:' + pg(d, O.L.length) + '%"></i></div><p style="margin-top:20px"><a class="btn primary" href="#/">Continue learning</a></p>', route: "cert" };
    var last = 0, dn = done(); Object.keys(dn).forEach(function (k) { last = Math.max(last, dn[k]); });
    return { html: '<div class="cert"><a class="mark" href="#/">' + LOGO + "<b>The Cold Manual</b></a><h1>Certificate of completion</h1><p>This certifies that</p><div class=\"who\">" + esc(name) + "</div><p>has completed all " + O.L.length + " lessons across " + O.P.length + " programs of The Cold Manual training in appointment setting and closing.</p><ul>" + O.P.map(function (p) { return "<li>" + esc(p.title) + "</li>"; }).join("") + '</ul><p class="muted">Completed ' + new Date(last || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + '</p></div><p class="no-print" style="text-align:center;margin-top:24px"><button type="button" class="btn primary" onclick="window.print()">Print or save as PDF</button></p>', route: "cert" };
  }
  function vSettings() {
    document.title = "Settings | The Cold Manual";
    var a = auth() || {};
    return { html: '<div class="page-head"><h1>Settings</h1></div><div class="panel"><h2>Your name</h2><p class="muted">Shown on your certificate.</p><div class="field" style="max-width:360px"><label for="sn">Name</label><input id="sn" value="' + esc(O.store.get("name", "")) + '"></div></div>' +
      '<div class="panel"><h2>Back up or move your data</h2><p class="muted">Your progress, notes and tool entries are saved to your account. Export them to keep your own copy.</p><div class="row"><button type="button" class="btn" id="ex">Export data</button><label class="btn" for="im" style="margin:0">Import data</label><input id="im" type="file" accept="application/json" class="sr"></div></div>' +
      '<div class="panel"><h2>Account</h2><p class="muted">Logged in as ' + esc(a.email || "") + '.</p><div class="row"><button type="button" class="btn" id="lo">Log out</button><button type="button" class="btn danger" id="rs">Reset all progress</button></div><p class="err" id="rsmsg"></p></div>', route: "settings", after: function () {
        document.getElementById("sn").addEventListener("input", function (e) { O.store.set("name", e.target.value); });
        document.getElementById("ex").addEventListener("click", function () { var o = O.store.all(); delete o.auth; O.ui.download("cold-manual-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(o, null, 2), "application/json"); });
        document.getElementById("im").addEventListener("change", function (e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { var o = JSON.parse(r.result); if (!o || typeof o !== "object") throw 0; delete o.auth; O.store.load(o); O.ui.toast("Imported"); render(); } catch (x) { O.ui.toast("That file could not be read"); } }; r.readAsText(f); });
        document.getElementById("lo").addEventListener("click", function () { O.store.del("auth"); boot(); });
        var armed = false; document.getElementById("rs").addEventListener("click", function () { var b = this; if (!armed) { armed = true; b.textContent = "Click again to erase everything"; document.getElementById("rsmsg").textContent = "This removes progress, notes and tool entries on this device."; return; } var keep = auth(), nm = O.store.get("name", ""); Object.keys(O.store.all()).forEach(function (k) { O.store.del(k); }); O.store.set("auth", keep); O.store.set("name", nm); O.ui.toast("Progress reset"); location.hash = "#/"; render(); });
      } };
  }
  function v404() { document.title = "Not found | The Cold Manual"; return { html: '<div class="page-head"><h1>Page not found</h1><p>That page does not exist. <a href="#/">Go home</a>.</p></div>', route: "404" }; }

  /* ---------- router ---------- */
  function render(keep) {
    var y = window.scrollY, a = auth();
    if (!a) { renderLogin(); return; }
    var h = (location.hash || "#/").replace(/^#\/?/, ""), seg = h.split("/"), v;
    switch (seg[0]) {
      case "": v = vHome(); break;
      case "programs": v = vPrograms(); break;
      case "pillar": v = vPillar(seg[1]); break;
      case "p": v = vProgram(+seg[1]); break;
      case "l": v = vLesson(seg[1]); break;
      case "playbooks": v = vPlaybooks(); break;
      case "pb": v = vPlaybook(seg[1]); break;
      case "tools": v = vTools(); break;
      case "t": v = vTool(seg[1], seg[2]); break;
      case "search": v = vSearch(seg.slice(1).join("/")); break;
      case "cert": v = vCert(); break;
      case "settings": v = vSettings(); break;
      default: v = (O.views && O.views[seg[0]] && O.views[seg[0]](seg.slice(1))) || v404();
    }
    shell(v.route, v.html, v.crumbs);
    if (v.after) v.after();
    var mn = document.getElementById("main"); if (mn) { window.scrollTo(0, keep === true ? y : 0); }
  }
  function boot() { render(); }
  if (window.OSI_EMBED) {
    /* embedded in another shell (the MERN client): expose the views and let the host re-render */
    render = function () { window.dispatchEvent(new Event("osi-rerender")); };
    O.appViews = { home: vHome, programs: vPrograms, pillar: vPillar, p: vProgram, l: vLesson, playbooks: vPlaybooks, pb: vPlaybook, tools: vTools, t: vTool, search: vSearch, cert: vCert, notFound: v404 };
    return;
  }
  window.addEventListener("hashchange", function () { render(false); var mn = document.getElementById("main"); if (mn) mn.focus({ preventScroll: true }); });
  boot();
})();
