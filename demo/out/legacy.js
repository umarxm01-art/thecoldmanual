/* ---- core.js ---- */
/* The Cold Manual: namespace, storage, helpers, mini-markdown */
(function () {
  var OSI = window.OSI = window.OSI || {};
  OSI.P = []; OSI.L = []; OSI.M = []; OSI.PB = []; OSI.OBJ = []; OSI.CAD = []; OSI.SCR = []; OSI.TOOLS = []; OSI.SC = [];
  OSI.cfg = window.OSI_CFG || {};

  /* ---- storage (all keys prefixed, all calls guarded) ---- */
  var PRE = "osi_";
  OSI.store = {
    get: function (k, d) { try { var v = localStorage.getItem(PRE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(PRE + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(PRE + k); } catch (e) {} },
    all: function () {
      var o = {};
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(PRE) === 0) o[k.slice(PRE.length)] = JSON.parse(localStorage.getItem(k)); } } catch (e) {}
      return o;
    },
    load: function (o) { Object.keys(o || {}).forEach(function (k) { OSI.store.set(k, o[k]); }); }
  };

  OSI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  OSI.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };

  /* inline: **bold**, *italic*, [text](#/route) or (https://...) */
  function inline(s) {
    s = OSI.esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>");
    s = s.replace(/\[([^\]]+)\]\((#[^)\s]+|https?:\/\/[^)\s]+)\)/g, function (m, t, u) {
      return '<a href="' + u + '"' + (u.charAt(0) === "#" ? "" : ' target="_blank" rel="noopener"') + ">" + t + "</a>";
    });
    return s;
  }
  OSI.inline = inline;

  /* block mini-markdown. ## heading, - bullets, 1. list, > note, !> warning, | tables, blank line = paragraph */
  OSI.md = function (src) {
    var lines = String(src).replace(/\r/g, "").split("\n"), out = [], i = 0, outline = [];
    function para(buf) { if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>"); }
    var buf = [];
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*$/.test(ln)) { para(buf); buf = []; i++; continue; }
      var m;
      if ((m = ln.match(/^##\s+(.*)$/))) { para(buf); buf = []; var id = OSI.slug(m[1]); outline.push({ id: id, t: m[1] }); out.push('<h3 id="' + id + '">' + inline(m[1]) + "</h3>"); i++; continue; }
      if (/^[-*]\s+/.test(ln)) { para(buf); buf = []; var li = []; while (i < lines.length && /^[-*]\s+/.test(lines[i])) { li.push("<li>" + inline(lines[i].replace(/^[-*]\s+/, "")) + "</li>"); i++; } out.push("<ul>" + li.join("") + "</ul>"); continue; }
      if (/^\d+\.\s+/.test(ln)) { para(buf); buf = []; var ol = []; while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { ol.push("<li>" + inline(lines[i].replace(/^\d+\.\s+/, "")) + "</li>"); i++; } out.push("<ol>" + ol.join("") + "</ol>"); continue; }
      if (/^!?>\s?/.test(ln)) {
        para(buf); buf = []; var warn = ln.charAt(0) === "!", nb = [];
        while (i < lines.length && /^!?>\s?/.test(lines[i])) { nb.push(lines[i].replace(/^!?>\s?/, "")); i++; }
        var head = nb.shift() || ""; out.push('<div class="callout' + (warn ? " warn" : "") + '"><b>' + inline(head) + "</b>" + (nb.length ? "<p>" + inline(nb.join(" ")) + "</p>" : "") + "</div>"); continue;
      }
      if (/^\|/.test(ln)) {
        para(buf); buf = []; var rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i].replace(/^\||\|\s*$/g, "").split("|").map(function (c) { return c.trim(); })); i++; }
        var h = rows.shift(); if (rows.length && /^[-: ]+$/.test(rows[0].join(""))) rows.shift();
        out.push('<div class="tbl-wrap"><table class="tbl"><thead><tr>' + h.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>"); continue;
      }
      buf.push(ln.trim()); i++;
    }
    para(buf);
    return { html: out.join("\n"), outline: outline };
  };

  /* annotated call: turns = [who, text, tag?, why?]; who "R" rep, "P" prospect */
  OSI.callHtml = function (c, names) {
    names = names || { R: "Rep", P: "Prospect" };
    var h = '<div class="call"><div class="call-head"><b>' + OSI.esc(c.title) + "</b><span>" + OSI.esc(c.meta || "") + "</span></div>";
    c.turns.forEach(function (t) {
      var who = t[0], why = t[2] ? '<div class="why"><span class="tag">' + OSI.esc(t[2]) + "</span><p>" + inline(t[3] || "") + "</p></div>" : "";
      h += '<div class="turn' + (who === "P" ? " them" : "") + '"><div class="line"><span class="who">' + OSI.esc(c.names ? c.names[who] : names[who]) + '</span><p class="say">' + inline(t[1]) + "</p></div>" + why + "</div>";
    });
    return h + "</div>";
  };

  /* data helpers used by data files */
  /* the order modules are studied in: the three offer modules first, then outreach to delivery */
  OSI.MOD_ORDER = [1, 14, 15, 2, 3, 4, 5, 6, 16, 7, 8, 9, 10, 11, 12, 13];
  OSI.modRank = function (p) { var i = OSI.MOD_ORDER.indexOf(p); return i < 0 ? 100 + p : i; };
  OSI.lessonSort = function (a, b) { return OSI.modRank(a.p) - OSI.modRank(b.p) || a.n - b.n; };
  OSI.prog = function (id, title, sub, blurb) { OSI.P.push({ id: id, title: title, sub: sub, blurb: blurb }); };
  OSI.lesson = function (o) { o.id = o.p + "." + o.n; OSI.L.push(o); };
  OSI.byId = function (id) { return OSI.L.filter(function (l) { return l.id === id; })[0]; };
})();

;
/* ---- tools.js ---- */
/* The Cold Manual: working tools. Each tool renders into a root element and saves its inputs to the member's account. */
(function (O) {
  var esc = O.esc;
  function num(v) { var n = parseFloat(String(v).replace(/,/g, "")); return isFinite(n) ? n : 0; }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function f1(n) { return (Math.round(n * 10) / 10).toLocaleString("en-US"); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  O.ui = {
    toast: function (msg) {
      var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
      document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1800);
    },
    copy: function (text) {
      function done() { O.ui.toast("Copied"); }
      function fallback() {
        var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { O.ui.toast("Select the text and copy it"); }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    },
    download: function (name, text, type) {
      var b = new Blob([text], { type: type || "text/plain" }), a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500);
    },
    /* print one element only (a proposal, a contract), not the form around it */
    printEl: function (el) {
      if (!el) { window.print(); return; }
      var off = function () { document.body.classList.remove("printing"); el.classList.remove("print-area"); window.removeEventListener("afterprint", off); };
      document.body.classList.add("printing"); el.classList.add("print-area"); window.addEventListener("afterprint", off);
      window.print();
    },
    /* a Word-compatible file built from the document's HTML */
    downloadDoc: function (name, title, html) {
      var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#171717}h1{font-size:18pt;margin:0 0 6pt}h2{font-size:12pt;margin:14pt 0 4pt}p{margin:0 0 6pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6pt;vertical-align:top;text-align:left}.muted{color:#555}</style></head><body>' + html + "</body></html>";
      O.ui.download(name, "﻿" + doc, "application/msword");
    }
  };

  function fieldsHtml(defs, S) {
    return '<div class="fields">' + defs.map(function (d) {
      var v = S[d.k] == null ? "" : S[d.k], id = "f_" + d.k, c = d.w ? " wide" : "", ctl, ph = d.ph ? ' placeholder="' + esc(d.ph) + '"' : "";
      if (d.t === "select") ctl = '<select id="' + id + '" data-k="' + d.k + '">' + d.o.map(function (o) { var val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? " selected" : "") + ">" + esc(lab) + "</option>"; }).join("") + "</select>";
      else if (d.t === "textarea") ctl = '<textarea id="' + id + '" data-k="' + d.k + '"' + ph + ">" + esc(v) + "</textarea>";
      else ctl = '<input id="' + id + '" data-k="' + d.k + '" type="' + (d.t === "number" ? "number" : "text") + '"' + (d.t === "number" ? ' step="any" inputmode="decimal"' : "") + ph + ' value="' + esc(v) + '">';
      return '<div class="field' + c + '"><label for="' + id + '">' + esc(d.l) + "</label>" + ctl + (d.h ? '<div class="hint">' + esc(d.h) + "</div>" : "") + "</div>";
    }).join("") + "</div>";
  }
  function bind(root, defs, S, save, update) {
    $$("[data-k]", root).forEach(function (el) {
      var d = defs.filter(function (x) { return x.k === el.getAttribute("data-k"); })[0]; if (!d) return;
      var h = function () { S[d.k] = d.t === "number" ? num(el.value) : el.value; save(); update(d.k); };
      el.addEventListener("input", h); if (el.tagName === "SELECT") el.addEventListener("change", h);
    });
  }
  function kpi(v, l, cls) { return '<div class="kpi"><div class="v ' + (cls || "") + '">' + esc(v) + '</div><div class="l">' + esc(l) + "</div></div>"; }
  function actions(list) { return '<div class="row no-print">' + list.map(function (a) { return '<button type="button" class="btn sm ' + (a.c || "") + '" data-act="' + a.id + '">' + esc(a.t) + "</button>"; }).join("") + "</div>"; }
  function onAct(root, map) { root.addEventListener("click", function (e) { var b = e.target.closest("[data-act]"); if (b && map[b.getAttribute("data-act")]) map[b.getAttribute("data-act")](b); }); }
  function load(key, d) { var s = O.store.get("t_" + key, null); var o = {}; Object.keys(d).forEach(function (k) { o[k] = d[k]; }); if (s && typeof s === "object" && !Array.isArray(s)) Object.keys(s).forEach(function (k) { o[k] = s[k]; }); return o; }
  function saver(key, S) { return function () { O.store.set("t_" + key, S); }; }
  function fill(tpl, v) { return tpl.replace(/\{\{(\w+)\}\}/g, function (m, k) { return v[k] ? v[k] : "[" + k + "]"; }); }
  function tool(key, title, desc, lessons, fn) { O.TOOLS.push({ key: key, title: title, desc: desc, lessons: lessons || [], render: fn }); }
  function isoDate(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fromIso(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function nice(d) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function stop(s) { s = String(s || "").trim(); return /[.!?]$/.test(s) ? s : s + "."; }
  function words(t) { return (String(t).match(/\S+/g) || []).length; }
  function useMark(S, k, save) { S.used = S.used || {}; if (!S.used[k]) { S.used[k] = 1; save(); } }

  /* ---------- AI help: every feature uses one server route. All tools still work when it is off. ---------- */
  var aiState = { enabled: false, sample: false, left: null };
  O.ai = {
    configure: function (s) { s = s || {}; aiState.enabled = !!s.enabled; aiState.sample = !!s.sample; aiState.left = s.left == null ? null : s.left; },
    on: function () { return aiState.enabled; },
    post: function (payload) {
      return fetch("/api/ai", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Requested-With": "osi" }, body: JSON.stringify(payload) }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401) window.dispatchEvent(new Event("osi-unauth"));
          if (!r.ok) throw new Error(j.error || "The AI service isn't available right now. Try again.");
          if (j.left != null) aiState.left = j.left;
          return j;
        });
      }, function () { throw new Error("You seem to be offline. Check your connection and try again."); });
    },
    note: function () { return '<p class="muted small">' + (aiState.sample ? "<b>Preview:</b> this is a fixed sample answer. No AI is connected here." : "AI can be wrong. Check every fact before you use it.") + (aiState.left != null ? " " + fmt(aiState.left) + " AI checks left." : "") + "</p>"; },
    hint: '<p class="muted small">The AI button sends what you typed here to our AI provider. Leave out anything private.</p>',
    run: function (btn, payload, out, done) {
      var t = btn.textContent; btn.disabled = true; btn.textContent = "Working...";
      O.ai.post(payload).then(function (r) { btn.disabled = false; btn.textContent = t; done(r); }, function (e) { btn.disabled = false; btn.textContent = t; out.innerHTML = '<p class="callout warn">' + esc(e.message) + "</p>"; });
    }
  };

  /* ---------- Shared details: your own details and offer are typed once and fill the other tools ---------- */
  function me() { return O.store.get("t_me", null) || {}; }
  function saveMe(p) { var m = me(), ch = false; Object.keys(p).forEach(function (k) { if (p[k] !== m[k]) { m[k] = p[k]; ch = true; } }); if (ch) O.store.set("t_me", m); }
  /* fills a field only while it is empty or still holds the value filled in last time, so anything typed by hand stays */
  function autoFill(S, src) {
    S._auto = S._auto || {};
    Object.keys(src).forEach(function (k) { var v = src[k]; if (!v) return; if (!S[k] || S[k] === S._auto[k]) { S[k] = v; S._auto[k] = v; } });
  }
  function syncInputs(root, S) { $$("[data-k]", root).forEach(function (el) { var v = S[el.getAttribute("data-k")]; el.value = v == null ? "" : v; }); }
  function lower1(s) { s = String(s || "").trim(); return s ? s.charAt(0).toLowerCase() + s.slice(1) : ""; }
  function offerData() { return O.store.get("t_offer", null) || {}; }
  function offerBase(S) { return S.who && S.result ? "We help " + S.who + (S.where ? " in " + S.where : "") + " get " + S.result + (S.time ? " " + S.time : "") : ""; }
  function offerLine() { var o = offerData(); return String(o.customLine || offerBase(o)).replace(/\.$/, ""); }

  /* ---------- Leads: the tracker's rows, shared with the tools that work on one lead ---------- */
  var STAGE_NEXT = { New: ["First touch", 0], Contacted: ["Next follow-up", 3], Replied: ["Reply within the hour", 0], Qualified: ["Book the meeting", 0], Booked: ["Send the confirmation and reminders", 0], Held: ["Send the proposal", 0], Proposal: ["Follow up on the proposal", 2], Won: ["Send the contract and book the kickoff", 0], Lost: ["", null] };
  var LOST_WHY = ["No reply", "Price", "No budget", "Bad timing", "Happy with what they have", "No need", "Not the decision maker", "Chose someone else", "Asked not to be contacted", "Other"];
  var LEAD_RANK = ["Contacted", "Replied", "Qualified", "Booked", "Held", "Proposal", "Won"];
  function addBiz(days) { var d = new Date(); d.setDate(d.getDate() + days); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return isoDate(d); }
  function newLeadId() { return "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function seqStep(seq, i) {
    var c = O.CAD[seq.type] || O.CAD.multi, s = c.steps[i]; if (!s) return null;
    var d = fromIso(seq.start); if (isNaN(d.getTime())) d = new Date();
    d.setDate(d.getDate() + s.day - c.steps[0].day); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return { step: s, due: isoDate(d), total: c.steps.length };
  }
  O.leads = {
    rows: function () { var S = O.store.get("t_leads", null); if (!S || !Array.isArray(S.rows)) return []; var ch = false; S.rows.forEach(function (r) { if (!r.id) { r.id = newLeadId(); ch = true; } }); if (ch) O.store.set("t_leads", S); return S.rows; },
    get: function (id) { return id ? O.leads.rows().filter(function (r) { return r.id === id; })[0] || null : null; },
    open: function () { return O.leads.rows().filter(function (r) { return r.st !== "Won" && r.st !== "Lost"; }); },
    change: function (id, fn) { O.leads.rows(); var S = O.store.get("t_leads", null), r = S && S.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return null; fn(r); O.store.set("t_leads", S); return r; },
    setStage: function (r, st) {
      r.st = st; r.h = r.h || {}; if (!r.h[st]) r.h[st] = isoDate(new Date());
      var x = STAGE_NEXT[st]; if (x) { r.na = x[0]; r.due = x[1] == null ? "" : addBiz(x[1]); }
      if (st !== "New" && st !== "Contacted") r.seq = null; /* a reply on any channel stops the sequence */
      if (st !== "Lost") r.lr = "";
    },
    startSeq: function (r, type, start, tz) { r.seq = { type: type, start: start, tz: tz, i: 0 }; var s = seqStep(r.seq, 0); if (s) { r.na = "Touch 1 of " + s.total + ": " + s.step.ch; r.due = s.due; } },
    /* the member did the next touch: record it and line up the one after */
    touch: function (r) {
      r.lc = isoDate(new Date());
      if (r.st === "New") { r.st = "Contacted"; r.h = r.h || {}; if (!r.h.Contacted) r.h.Contacted = r.lc; }
      if (r.seq) {
        r.seq.i++; var s = seqStep(r.seq, r.seq.i);
        if (s) { r.na = "Touch " + (r.seq.i + 1) + " of " + s.total + ": " + s.step.ch; r.due = s.due < r.lc ? r.lc : s.due; } else { r.seq = null; r.na = "Sequence finished: close it or mark it Lost"; r.due = addBiz(3); }
      } else { r.na = STAGE_NEXT.Contacted[0]; r.due = addBiz(3); }
    },
    reached: function (r, st) {
      if (r.h && r.h[st]) return true;
      if (r.st === "Lost") return st === "Contacted"; /* older lost leads have no history, so only count that they were contacted */
      return LEAD_RANK.indexOf(r.st) >= LEAD_RANK.indexOf(st);
    },
    /* real rates from the tracker */
    stats: function () {
      var R = O.leads.rows(), c = function (st) { return R.filter(function (r) { return O.leads.reached(r, st); }).length; };
      var contacted = c("Contacted"), replied = c("Replied"), booked = c("Booked"), held = c("Held"), won = c("Won");
      return { contacted: contacted, replied: replied, booked: booked, held: held, won: won, rates: [
        { k: "conv", n: "Conversation rate", from: contacted, to: replied }, { k: "book", n: "Booking rate", from: replied, to: booked }, { k: "show", n: "Show rate", from: booked, to: held }, { k: "close", n: "Close rate", from: held, to: won }] };
    }
  };
  function leadName(r) { return r.n + (r.b ? " (" + r.b + ")" : ""); }
  function firstName(r) { return String(r.n || "").trim().split(/\s+/)[0] || ""; }
  function leadPick(S) {
    var L = O.leads.open();
    if (!L.length) return '<p class="muted small">Add a lead to the <a href="#/t/leads">lead tracker</a> and you can fill this in from it.</p>';
    return '<div class="field" style="max-width:420px"><label for="lead_pick">Fill in from a lead</label><select id="lead_pick"><option value="">No lead</option>' + L.slice(0, 300).map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === S.leadId ? " selected" : "") + ">" + esc(leadName(r)) + "</option>"; }).join("") + "</select></div>";
  }
  /* runs apply when a lead is chosen here, or when the member arrived from a row in the tracker */
  function onLeadPick(root, S, save, apply) {
    root.addEventListener("change", function (e) { if (e.target.id !== "lead_pick") return; S.leadId = e.target.value; var r = O.leads.get(S.leadId); if (r) apply(r); save(); });
    if (O.pickLead) { var r = O.leads.get(O.pickLead); O.pickLead = null; if (r) { S.leadId = r.id; apply(r); save(); var el = $("#lead_pick", root); if (el) el.value = r.id; } }
  }

  /* old tool names still open the tool that replaced them */
  O.TOOL_ALIAS = { emailwriter: "messages/email", dmbuilder: "messages/linkedin", videoscript: "messages/video", scripts: "messages/call", reminders: "messages/reminder", icp: "offer/who", sprint: "#/track", stack: "#/l/12.1" };
  O.toolRef = function (id) {
    var a = O.TOOL_ALIAS[id] || String(id).replace(".", "/"); if (a.charAt(0) === "#") return { href: a, title: a === "#/track" ? "Daily numbers in your 30-day plan" : "Lesson 12.1", key: id };
    var p = a.split("/"), t = O.TOOLS.filter(function (x) { return x.key === p[0]; })[0];
    return t ? { href: "#/t/" + p[0] + (p[1] ? "/" + p[1] : ""), title: t.title, key: t.key, sub: p[1] || "" } : null;
  };

  /* niche packs feed examples into the writing tools */
  function nicheOpts() { return [["", "Any market"]].concat((O.NICHES || []).map(function (n) { return [n.id, n.name]; })); }
  function niche(id) { return (O.NICHES || []).filter(function (n) { return n.id === id; })[0] || null; }

  /* salesy words: matched as whole words, so "freelance" is not "free" */
  var SALESY = ["free", "guarantee", "guaranteed", "act now", "limited time", "urgent", "click here", "risk-free", "winner", "no obligation", "buy now", "cash", "earn"];
  function emailFlags(t) {
    var f = [], body = t.split("\n").slice(2).join(" "), w = words(body), low = t.toLowerCase();
    if (w > 90) f.push("Long: " + w + " words. Aim for 50 to 90.");
    SALESY.forEach(function (x) { if (new RegExp("(^|[^a-z])" + x.replace(/[-]/g, "\\-") + "([^a-z]|$)").test(low)) f.push('Reads like an ad: "' + x + '".'); });
    ["100%", "!!!", "$$$"].forEach(function (x) { if (low.indexOf(x) > -1) f.push('Reads like an ad: "' + x + '".'); });
    if ((t.match(/https?:\/\//g) || []).length > 1) f.push("More than one link.");
    return f;
  }

  /* time zones: US send times shown with the Pakistan time next to them */
  var USTZ = [["America/New_York", "Eastern (New York, Florida)"], ["America/Chicago", "Central (Texas, Illinois)"], ["America/Denver", "Mountain (Colorado, Utah)"], ["America/Phoenix", "Arizona"], ["America/Los_Angeles", "Pacific (California, Washington)"]];
  function tzOffsetMin(utcMs, tz) {
    try {
      var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - utcMs) / 60000;
    } catch (e) { return tz === "Asia/Karachi" ? 300 : -300; }
  }
  /* a wall-clock time in a time zone, as a UTC timestamp */
  function zoned(d, hh, mm, tz) { var g = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm), u = g - tzOffsetMin(g, tz) * 60000; return g - tzOffsetMin(u, tz) * 60000; }
  function clock(utcMs, tz, withDay) { try { return new Date(utcMs).toLocaleString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", weekday: withDay ? "short" : undefined }); } catch (e) { return ""; } }
  O.tzHelp = { zoned: zoned, clock: clock, USTZ: USTZ };

  /* ---------- Funnel planner: every channel counts, not just dials ---------- */
  tool("funnel", "Funnel planner", "Work backwards from the clients you want to how many new people to contact each day across email, calls and social, and see which rate to improve first.", ["1.1", "11.2", "15.1", "2.10"], function (root) {
    var D = { goal: 2, close: 25, show: 70, book: 30, conv: 10, touches: 8, days: 22 }, S = load("funnel", D), save = saver("funnel", S);
    if (S.conn != null && S.conv == null) S.conv = S.conn;
    var defs = [
      { k: "goal", l: "New clients wanted per month", t: "number" },
      { k: "close", l: "Close rate (% of meetings held that become clients)", t: "number" },
      { k: "show", l: "Show rate (% of booked meetings that happen)", t: "number" },
      { k: "book", l: "Booking rate (% of conversations that book a meeting)", t: "number", h: "A conversation is a real reply or a real call with the right person." },
      { k: "conv", l: "Conversation rate (% of people you contact)", t: "number", h: "Across every channel in your sequence. Around 5 to 15% is common for a good multichannel sequence; email alone is often 1 to 3%." },
      { k: "touches", l: "Touches per person in your sequence", t: "number", h: "The two-week sequence in lesson 2.10 has 8." },
      { k: "days", l: "Working days per month", t: "number" }];
    root.innerHTML = '<div class="panel"><h2>Your numbers</h2>' + fieldsHtml(defs, S) + '</div><div id="real"></div><div id="out"></div>';
    /* the member's real numbers from the lead tracker, next to the course's starting rates */
    var RATE_FIX = {
      conv: { l: "4.4", t: "Better first messages", a: ["#/review", "Check your messages in the review tool"], b: ["#/t/leadsearch", "Check your list with the lead search builder"] },
      book: { l: "7.3", t: "Booking the meeting", a: ["#/t/replies", "Work through replies in the reply handler"], b: ["#/rp/dm-howmuch", "Roleplay: “How much is it?”"] },
      show: { l: "7.4", t: "Meetings that show up", a: ["#/t/messages/reminder", "Write your meeting reminders"], b: ["#/drill/r-confirm", "Drill: confirming the meeting"] },
      close: { l: "10.1", t: "Closing", a: ["#/rp/price-think", "Roleplay: price and “I'll think about it”"], b: ["#/t/objections", "Practise the objection bank"] }
    };
    function actual() {
      var st = O.leads.stats(), MIN = 10, rows = st.rates.map(function (r) { var pc = r.from ? r.to / r.from * 100 : null; return { k: r.k, n: r.n, from: r.from, to: r.to, pc: pc, sure: r.from >= MIN, ref: D[r.k] }; });
      if (!st.contacted) return '<div class="panel"><h2>Your real numbers</h2><p class="muted" style="margin:0">Nothing yet. Log your outreach in the <a href="#/t/leads">lead tracker</a> and your real rates will appear here.</p></div>';
      var sure = rows.filter(function (r) { return r.sure; }), weak = sure.slice().sort(function (a, b) { return a.pc / a.ref - b.pc / b.ref; })[0], fix = weak && RATE_FIX[weak.k];
      return '<div class="panel"><h2>Your real numbers</h2><p class="muted small">From your lead tracker. A rate needs at least ' + MIN + " people behind it before it means much.</p><div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Rate</th><th>People</th><th>Yours</th><th>Starting point</th></tr></thead><tbody>" +
        rows.map(function (r) { return '<tr class="' + (weak && weak.k === r.k ? "hl" : "") + '"><td>' + r.n + "</td><td>" + r.to + " of " + r.from + "</td><td>" + (r.pc == null ? "-" : r.sure ? f1(r.pc) + "%" : f1(r.pc) + '% <span class="muted small">(too few)</span>') + "</td><td>" + r.ref + "%</td></tr>"; }).join("") + "</tbody></table></div>" +
        (weak ? '<div class="focus"><b>Weakest step: ' + esc(weak.n.toLowerCase()) + " at " + f1(weak.pc) + "%.</b> Fix this one first: read lesson " + '<a href="#/l/' + fix.l + '">' + fix.l + "</a>, then " + '<a href="' + fix.a[0] + '">' + esc(lower1(fix.a[1])) + '</a> or <a href="' + fix.b[0] + '">' + esc(lower1(fix.b[1])) + "</a>.</div>" : '<p class="small">Keep logging. You need at least ' + MIN + " people behind a rate to see your weakest step.</p>") +
        (sure.length ? '<div class="row"><button type="button" class="btn sm" data-act="real">Use my real rates in the plan</button></div>' : "") + "</div>";
    }
    function need(r) { return S.goal / (r.close / 100) / (r.show / 100) / (r.book / 100) / (r.conv / 100); }
    function calc() {
      var bad = ["close", "show", "book", "conv"].filter(function (k) { return !(S[k] > 0) || S[k] > 100; });
      if (bad.length || !(S.goal > 0) || !(S.days > 0)) { $("#out", root).innerHTML = '<div class="panel"><p class="err" style="margin:0">Every rate needs a number between 1 and 100, and the goal and working days need to be above 0.</p></div>'; return; }
      var held = S.goal / (S.close / 100), booked = held / (S.show / 100), conv = booked / (S.book / 100), people = conv / (S.conv / 100), perDay = people / S.days, touchDay = perDay * Math.max(1, S.touches || 1);
      var base = { close: S.close, show: S.show, book: S.book, conv: S.conv };
      var rows = [["conv", "Conversation rate", "4.4"], ["book", "Booking rate", "7.3"], ["show", "Show rate", "7.4"], ["close", "Close rate", "10.1"]].map(function (x) { var r = JSON.parse(JSON.stringify(base)); r[x[0]] = Math.min(100, r[x[0]] * 1.2); return { k: x[0], n: x[1], l: x[2], v: need(r) }; }).sort(function (a, b) { return a.v - b.v; });
      $("#out", root).innerHTML = '<div class="panel"><h2>What you need each month</h2><div class="kpis">' + kpi(fmt(held), "meetings held") + kpi(fmt(booked), "meetings booked") + kpi(fmt(conv), "conversations") + kpi(fmt(people), "people to contact") + "</div>" +
        '<h3>Each working day</h3><div class="kpis">' + kpi(fmt(Math.ceil(perDay)), "new people into your sequence") + kpi(fmt(Math.ceil(touchDay)), "touches a day once follow-ups stack up") + "</div><p class=\"muted small\">Touches a day counts first messages plus follow-ups. In week one it is lower, because follow-ups have not started yet.</p></div>" +
        '<div class="panel"><h2>Which rate to improve first</h2><p class="muted">If one rate improved by a fifth (for example 10% to 12%), the people you need to contact each month would fall to:</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rate</th><th>People to contact</th><th>Saved</th><th>Lesson</th></tr></thead><tbody>' +
        rows.map(function (r, i) { return '<tr class="' + (i === 0 ? "hl" : "") + '"><td>' + r.n + "</td><td>" + fmt(r.v) + "</td><td>" + fmt(people - r.v) + '</td><td><a href="#/l/' + r.l + '">' + r.l + "</a></td></tr>"; }).join("") + '</tbody></table></div><div class="focus"><b>Start with ' + rows[0].n.toLowerCase() + ".</b> A small gain there saves the most work. Practise the matching lesson, then measure again in two weeks.</div></div>";
    }
    bind(root, defs, S, save, calc); calc();
    $("#real", root).innerHTML = actual();
    onAct(root, { real: function () { O.leads.stats().rates.forEach(function (r) { if (r.from >= 10 && r.to > 0) S[r.k] = Math.round(r.to / r.from * 1000) / 10; }); save(); syncInputs(root, S); calc(); O.ui.toast("Plan updated with your real rates"); } });
  });

  /* ---------- Offer builder: who you serve, the offer, plain checks with fixes ---------- */
  tool("offer", "Offer builder", "Write down who you serve and what you promise. Check your offer on the four things buyers weigh, with a fix for the weakest, and get the one-line offer and target you will use in every message.", ["1.2", "14.1", "14.2", "14.7", "2.1"], function (root) {
    var old = O.store.get("t_icp", null) || {};
    var S = load("offer", { who: old.who || "", where: old.where || "", buyer: old.buyer || "", pain: old.pain || "", trigger: old.trigger || "", result: "", time: "", work: "", proof: "", risk: "", cost: "", price: "", a: {}, fit: [false, false, false, false] }), save = saver("offer", S);
    if (!S.a || typeof S.a !== "object") S.a = {};
    var who = [{ k: "who", l: "Who you serve: type and size", t: "text", w: 1, ph: "Dental practices with 2 to 6 dentists" }, { k: "where", l: "Where", t: "text", ph: "Texas" }, { k: "buyer", l: "Who decides", t: "text", ph: "The practice owner or manager" }, { k: "pain", l: "Their problem, in their words", t: "text", w: 1, ph: "New-patient calls go to voicemail when the front desk is busy" }, { k: "trigger", l: "Why now: the signal that makes them ready", t: "text", w: 1, ph: "Just opened a second location, or hiring a receptionist" }];
    var off = [{ k: "result", l: "The result they get", t: "text", w: 1, ph: "Every new-patient call answered and booked" }, { k: "time", l: "How soon they see a first result", t: "text", ph: "Within 14 days" }, { k: "work", l: "What you do so they don't have to", t: "text", w: 1, ph: "We set it up, write the scripts and report weekly" }, { k: "proof", l: "Proof you can show (only real proof)", t: "text", w: 1, ph: "A demo, a case study, or a pilot" }, { k: "risk", l: "How you lower their risk", t: "text", w: 1, ph: "30-day pilot, cancel any time" }, { k: "cost", l: "What the problem costs them each month", t: "number", h: "Their number, or a careful estimate you can explain." }, { k: "price", l: "Your price each month", t: "number" }];
    /* the four things a buyer weighs (lessons 1.2 and 14.2), two plain checks each */
    var GW = [["result", "The result", "up"], ["sure", "How sure they are it will work", "up"], ["wait", "How long until they see it", "down"], ["effort", "Effort, risk and hassle for them", "down"]];
    var Q = [
      ["specific", "result", "Is the result specific: a number, or an outcome they can see?", "Name the result the way the buyer would say it, with a number if you can: \"20 more booked consultations a month\" beats \"better marketing\"."],
      ["known", "result", "Is it a problem they already know they have, and worth real money?", "Sell the problem they already complain about. Read their reviews and job ads for their words, and tie it to money they recognise."],
      ["proof", "sure", "Can you show proof or show the work before they pay?", "No results yet? A short audit, a mock-up, a two-minute walkthrough video, or a small paid pilot. Never invent results or testimonials."],
      ["simple", "sure", "Can you explain how it works, step by step, in one minute?", "Write your process as three to five plain steps. A clear plan is believable; \"we'll do our best\" is not."],
      ["fast", "wait", "Do they see a first result within 30 days?", "Promise the earliest win you can deliver: a page live in 7 days, the first leads by Friday."],
      ["steps", "wait", "Can they see progress every week?", "Split the work into a fast first step and the rest, and send a short weekly update."],
      ["easy", "effort", "Do you do most of the work?", "Take jobs off their plate: setup, writing, reporting. The less they have to do, learn or change, the easier the yes."],
      ["safe", "effort", "Is it low risk for them to say yes?", "Add a pilot, a short first term, or a promise you can actually keep (lessons 1.6 and 15.3)."]];
    function draw() {
      var ratio = S.cost > 0 && S.price > 0 ? S.price / S.cost : null;
      root.innerHTML = '<div class="panel"><h2>1. Who you serve</h2>' + fieldsHtml(who, S) + '</div><div class="panel"><h2>2. Your offer</h2>' + fieldsHtml(off, S) + '<p class="small" id="ratio"></p></div>' +
        '<div class="panel"><h2>3. Check your offer</h2><p class="muted small">Answer honestly. A "no" is useful: it shows what to fix first.</p>' + GW.map(function (g) { return '<h3>' + esc(g[1]) + ' <span class="muted small">(you want it to go ' + g[2] + ')</span></h3>' + Q.filter(function (q) { return q[1] === g[0]; }).map(function (q) { var v = S.a[q[0]]; return '<div class="score-row"><span>' + esc(q[2]) + '</span><select data-q="' + q[0] + '" aria-label="' + esc(q[2]) + '"><option value="">Choose</option><option value="0"' + (v === 0 ? " selected" : "") + '>No</option><option value="1"' + (v === 1 ? " selected" : "") + '>Partly</option><option value="2"' + (v === 2 ? " selected" : "") + ">Yes</option></select></div>"; }).join(""); }).join("") + '<div id="verdict"></div></div>' +
        '<div class="panel"><h2>4. Test one prospect</h2>' + ["Fits who you serve, in the right place", "Shows the problem or the signal right now", "Can pay your price", "You can reach the person who decides (email, phone or social)"].map(function (c, i) { return '<label class="chk"><input type="checkbox" data-fit="' + i + '"' + (S.fit[i] ? " checked" : "") + "><span>" + esc(c) + "</span></label>"; }).join("") + '<p class="small" id="fit"></p></div>' + aiBox() + '<div id="out"></div>';
      bind(root, who, S, save, function () { useMark(S, "who", save); soft(); });
      bind(root, off, S, save, soft);
      $$("[data-q]", root).forEach(function (el) { el.addEventListener("change", function () { S.a[el.getAttribute("data-q")] = el.value === "" ? null : +el.value; useMark(S, "score", save); save(); soft(); }); });
      $$("[data-fit]", root).forEach(function (el) { el.addEventListener("change", function () { S.fit[+el.getAttribute("data-fit")] = el.checked; save(); soft(); }); });
      soft();
    }
    function soft() {
      var ratio = S.cost > 0 && S.price > 0 ? S.price / S.cost : null;
      $("#ratio", root).innerHTML = ratio == null ? "Add the cost and your price to see how they compare." : "Your price is <b>" + Math.round(ratio * 100) + "%</b> of what the problem costs them. " + (ratio <= 0.33 ? "That is an easy decision for them." : ratio <= 0.6 ? "Workable, but show the cost clearly in every proposal." : "Hard to justify. Lower the price, pick bigger buyers, or find a bigger problem.");
      var answered = Q.filter(function (q) { return S.a[q[0]] != null; }), score = answered.reduce(function (a, q) { return a + S.a[q[0]]; }, 0);
      var gs = GW.map(function (g) { var t = 0; Q.forEach(function (q) { if (q[1] === g[0]) t += S.a[q[0]] || 0; }); return { g: g, t: t }; }), low = gs.slice().sort(function (a, b) { return a.t - b.t; })[0];
      var fixes = Q.filter(function (q) { return q[1] === low.g[0] && S.a[q[0]] !== 2; });
      $("#verdict", root).innerHTML = answered.length < Q.length ? '<p class="muted small">' + answered.length + " of " + Q.length + " answered.</p>" :
        '<div class="kpis">' + gs.map(function (x) { return kpi(x.t + " / 4", x.g[1], x.t >= 3 ? "up" : x.t <= 1 ? "down" : ""); }).join("") + "</div>" + (score < 16 ? '<div class="focus"><b>Fix first: ' + esc(low.g[1].toLowerCase()) + ".</b><ul>" + fixes.map(function (q) { return "<li>" + esc(q[3]) + "</li>"; }).join("") + "</ul></div>" : '<div class="focus"><b>Every check is a yes.</b> Test it on ten real prospects and listen to how they react.</div>');
      var n = S.fit.filter(Boolean).length;
      $("#fit", root).innerHTML = "<b>" + n + " / 4</b>: " + (n === 4 ? "contact this one first." : n === 3 ? "worth contacting, after the perfect fits." : "skip for now.");
      var line = S.customLine ? stop(S.customLine) : "We help " + (S.who || "[who you serve]") + (S.where ? " in " + S.where : "") + " get " + (S.result || "[the result]") + (S.time ? " " + S.time.replace(/^within/i, "within") : "") + (S.work ? ", and " + S.work.charAt(0).toLowerCase() + S.work.slice(1) : "") + "." + (S.risk ? " " + stop(cap(S.risk)) : "");
      var target = "Target: " + (S.who || "[who]") + (S.where ? " in " + S.where : "") + ". Problem: " + (S.pain || "[problem]") + ". Best timing: " + (S.trigger || "[signal]") + ". Speak to: " + (S.buyer || "[who decides]") + ".";
      root._t = line + "\n\n" + target;
      $("#out", root).innerHTML = '<div class="result"><div class="result-h"><h3>Your offer in one line</h3><button type="button" class="btn sm" data-c="o">Copy</button></div><pre>' + esc(line) + '</pre></div><div class="result"><div class="result-h"><h3>Your target in one line</h3><button type="button" class="btn sm" data-c="t">Copy</button></div><pre>' + esc(target) + '</pre></div><p class="muted small">These fill in the <a href="#/t/messages">message builder</a>, the <a href="#/t/proposal">proposal builder</a> and the <a href="#/t/replies">reply handler</a> for you.' + (S.customLine ? ' <button type="button" class="linkish" data-act="ai-clear">Go back to the automatic line</button>' : "") + "</p>";
      root._o = line; root._g = target;
    }
    function aiBox() { return O.ai.on() ? '<div class="panel"><h2>5. Challenge it</h2><p class="muted small">Get the questions a careful buyer would ask, and three tighter versions of your one line.</p><div class="row"><button type="button" class="btn sm" data-act="ai">Challenge my offer</button></div><div id="off-ai"></div>' + O.ai.hint + "</div>" : ""; }
    root.addEventListener("click", function (e) {
      var u = e.target.closest("[data-useline]");
      if (u) { S.customLine = root._lines[+u.getAttribute("data-useline")]; save(); soft(); O.ui.toast("Line saved. The other tools will use it."); return; }
      if (e.target.closest("[data-act='ai-clear']")) { S.customLine = ""; save(); soft(); return; }
      var a = e.target.closest("[data-act='ai']"); if (!a) return;
      var out = $("#off-ai", root), GN = { result: "the result", sure: "how sure they are", wait: "how long they wait", effort: "effort and risk" };
      O.ai.run(a, { mode: "offer", fields: { who: S.who, where: S.where, buyer: S.buyer, pain: S.pain, trigger: S.trigger, result: S.result, time: S.time, work: S.work, proof: S.proof, risk: S.risk, cost: S.cost, price: S.price } }, out, function (r) {
        root._lines = r.lines || [];
        out.innerHTML = '<div class="focus"><b>Weakest: ' + esc(GN[r.weakest] || "") + ".</b> " + esc(r.verdict || "") + "</div>" + (r.challenges && r.challenges.length ? "<h3>What a buyer would ask</h3><ul>" + r.challenges.map(function (c) { return "<li>" + esc(c.problem) + " <b>" + esc(c.question) + "</b></li>"; }).join("") + "</ul>" : "") +
          (root._lines.length ? "<h3>Tighter one-liners</h3>" + root._lines.map(function (l, i) { return '<div class="result"><div class="result-h"><h3>Version ' + (i + 1) + '</h3><button type="button" class="btn sm" data-useline="' + i + '">Use this line</button></div><pre>' + esc(l) + "</pre></div>"; }).join("") : "") + O.ai.note();
      });
    });
    root.addEventListener("click", function (e) { var c = e.target.closest("[data-c]"); if (c) O.ui.copy(c.getAttribute("data-c") === "o" ? root._o : root._g); });
    draw();
  });

  /* ---------- Message builder: one tool for every channel (replaces five separate writers) ---------- */
  var MCH = [["sequence", "Full two-week sequence"], ["email", "Cold email"], ["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["call", "Calls and voicemail"], ["video", "Video message"], ["reminder", "Meeting reminders"]];
  var MF = {
    prospect: { l: "Prospect first name", ph: "Sarah" }, business: { l: "Their business", ph: "Bright Smile Dental" }, you: { l: "Your name", ph: "Ali" }, company: { l: "Your company", ph: "Northline" },
    topic: { l: "The area you help with, in a few words", ph: "new-patient calls", h: "Used in subject lines and questions: \"how do you handle ___ today?\"", w: 1 },
    problem: { l: "The likely problem, in one sentence", ph: "busy front desks miss new-patient calls", h: "Write it the way an owner would say it.", w: 1 },
    signal: { l: "Something real you noticed about them", ph: "you just opened a second location", h: "A signal or personal line (lesson 2.8). Must be true.", w: 1 },
    offer: { l: "What you do, in one sentence", ph: "We answer and book every new-patient call", w: 1 }, proof: { l: "One true proof line (optional)", ph: "Only a real result or a real pilot offer", w: 1 },
    idea: { l: "One useful idea for the follow-up", ph: "a text-back within 60 seconds books most missed callers", w: 1 },
    time1: { l: "Time option 1", ph: "Thursday at 9" }, time2: { l: "Time option 2", ph: "Friday at 2" }, phone: { l: "Your US phone number", ph: "(512) 555-0143" },
    address: { l: "Your postal address (email footer)", w: 1, h: "US law (CAN-SPAM) asks for a physical address in commercial email." },
    show: { l: "What you show on screen", ph: "their Google listing and website", w: 1 }, cons: { l: "What it means for them", ph: "new patients book the next practice that answers. It is fixable without hiring", w: 1 },
    meet: { l: "Meeting day and time (their time zone)", ph: "Thursday at 9 am Central" }, how: { l: "How you will meet", ph: "I'll call you on this number" }, metric: { l: "One number to ask them to bring", ph: "how many new-patient calls you get a week", w: 1 }
  };
  var MFIELDS = {
    email: ["prospect", "business", "you", "company", "topic", "problem", "signal", "offer", "proof", "idea", "time1", "time2", "address"],
    linkedin: ["prospect", "business", "you", "topic", "problem", "signal", "time1", "time2"],
    call: ["prospect", "business", "you", "company", "topic", "problem", "phone", "time1", "time2"],
    video: ["prospect", "business", "you", "show", "signal", "cons", "time1", "time2"],
    reminder: ["prospect", "business", "you", "meet", "how", "metric"]
  };
  MFIELDS.facebook = MFIELDS.linkedin; MFIELDS.instagram = MFIELDS.linkedin;
  MFIELDS.sequence = ["prospect", "business", "you", "company", "topic", "problem", "signal", "offer", "proof", "idea", "phone", "show", "cons", "time1", "time2", "address"];

  function msgSets(S) {
    var v = function (k) { return String(S[k] || "").trim() || "[" + MF[k].l.toLowerCase().replace(/ \(.*\)$/, "").replace(/\bus\b/, "US") + "]"; };
    var p = v("prospect"), bz = v("business"), y = v("you"), co = String(S.company || "").trim(), tp = v("topic"), pr = v("problem"), sg = v("signal"), t1 = v("time1"), t2 = v("time2");
    var proof = S.proof ? " " + stop(cap(S.proof)) : "", sig = stop(cap(sg)), prob = stop(cap(pr));
    var foot = "\n\n" + y + (co ? "\n" + co : "") + (S.address ? "\n" + S.address : "") + "\nIf you'd rather not hear from me, just reply \"no thanks\".";
    var E = {
      v1: ["First email: signal first", "Subject: " + tp.toLowerCase() + " at " + bz + "\n\nHi " + p + ",\n\n" + sig + " " + prob + "\n\n" + stop(v("offer")) + proof + "\n\nWorth a 10-minute look " + t1 + " or " + t2 + "?" + foot],
      v2: ["First email: problem first", "Subject: question about " + tp.toLowerCase() + "\n\nHi " + p + ",\n\n" + prob + " Is that something you see at " + bz + "?\n\n" + stop(v("offer")) + proof + "\n\nIf it is, I can show you how it would work for " + bz + " in 10 minutes, " + t1 + " or " + t2 + "." + foot],
      v3: ["First email: question only", "Subject: " + bz.toLowerCase() + "\n\nHi " + p + ",\n\n" + sig + " How are you handling " + tp + " at the moment?" + foot],
      f1: ["Follow-up, day 4 (same thread)", "Hi " + p + ",\n\nOne idea on " + tp + " that works for businesses like yours: " + stop(v("idea")) + "\n\nHappy to show how it would look at " + bz + " if that's useful.\n\n" + y],
      f2: ["Follow-up, day 8 (offer a video)", "Hi " + p + ",\n\nEasier to show than explain. Want me to record a 60-second video on how " + bz + " could handle " + tp + "? Reply \"yes\" and I'll send it.\n\n" + y],
      f3: ["Break-up, day 14", "Hi " + p + ",\n\nI haven't heard back, so I'll stop here. Should I close your file, or is " + tp + " worth a look later in the year?\n\n" + y]
    };
    var L = {
      connect: ["Connection note", "Hi " + p + ", " + sg + ". I work with businesses like " + bz + " on " + tp + ". Happy to connect.", 200],
      m1: ["Message 1 (after they accept)", "Thanks for connecting, " + p + ". Quick question: how do you handle " + tp + " at " + bz + " today?"],
      m2: ["Message 2 (about day 7, or send as a voice note)", p + ", one thing I keep hearing from owners: " + pr + ". Does that match what you see?"],
      m3: ["Message 3 (the ask)", "Would it help if I showed you how that could work at " + bz + "? Ten minutes " + t1 + " or " + t2 + "?"],
      close: ["Polite close", "No worries if the timing's off, " + p + ". I'll leave it here. All the best with " + bz + "."]
    };
    var F = { first: ["First message (after you've engaged in a group or on a post)", "Hi " + p + ", " + sg + ". I've got a couple of ideas on " + tp + " that worked for similar businesses. Want me to share them?"], fu: ["Follow-up (about day 3)", "Hi " + p + ", I put the ideas in a short note. First, how do you handle " + tp + " at " + bz + " today?"], ask: ["The ask", "Easier to show than type. Ten minutes " + t1 + " or " + t2 + "?"], close: ["Polite close", "No problem, " + p + ". I'll leave it here. All the best."] };
    var I = { first: ["First DM (reply to a story or post)", "Hi " + p + ", " + sg + ". Quick question: how do you keep on top of " + tp + " when it gets busy?"], fu: ["Follow-up (about day 3)", "Hi " + p + ", did that make sense? Curious how you handle it at " + bz + "."], ask: ["The ask", "Easier to show than type. Ten minutes on a call " + t1 + " or " + t2 + "?"], close: ["Polite close", "All good, " + p + ". I'll leave it here. Wishing you a great month."] };
    var C = {
      perm: ["Opener: ask permission", "Hi " + p + ", it's " + y + (co ? " from " + co : "") + ". This is a cold call, so I'll be quick. Can I take 30 seconds to tell you why I'm calling, and you tell me if it's worth carrying on?"],
      prob: ["Opener: lead with the problem", "Hi " + p + ", it's " + y + ". We haven't spoken before. I'm calling because a lot of owners tell me " + pr + ". Is that something you deal with at " + bz + ", or not really?"],
      gate: ["Front desk or gatekeeper", "Hi, it's " + y + ". I'm looking for whoever looks after " + tp + ". Is that " + p + ", or someone else?"],
      vm: ["Voicemail (about 20 seconds)", "Hi " + p + ", it's " + y + (co ? " from " + co : "") + ". I'm calling about " + tp + " at " + bz + ". I'll send you a short email too. My number is " + v("phone") + ". Again, it's " + y + ", " + v("phone") + "."],
      book: ["Booking ask", "It sounds worth a proper look. How about 15 minutes " + t1 + " or " + t2 + "? I'll show you exactly how it would work for " + bz + "."],
      email: ["If they say \"just send me an email\"", "Happy to. So I send the right thing: what's the one thing you'd want to see about " + tp + "?"],
      notnow: ["If they say \"not interested\"", "That's fair, most people aren't when a stranger calls. Out of interest, is " + tp + " already sorted at " + bz + ", or just not a priority right now?"]
    };
    var show = v("show"), parts = [["Hook", "Hi " + p + ", I made this quick video for " + bz + "."], ["Show: " + show, "I was looking at " + show + " and noticed " + sg + "."], ["Insight", "That usually means " + v("cons") + "."], ["Ask", "If it's useful, I can show you how that would look for " + bz + ". Ten minutes " + t1 + " or " + t2 + ", whichever suits you."]];
    var Vline = "Subject: quick video for " + bz + "\n\nHi " + p + ", I made a 45-second video about " + bz + ". Worth a look? [link]\n\n" + y;
    var meet = v("meet"), how = v("how");
    var R = { conf: ["Right after booking", "Hi " + p + ", confirming " + meet + " for 15 minutes on " + bz + ". " + stop(cap(how)) + " Reply YES to confirm, or tell me if you need to move it. - " + y], d1: ["24 hours before", "Hi " + p + ", a reminder for " + meet + ". To make it useful, could you reply with roughly " + v("metric") + "? - " + y], h2: ["2 hours before", "Hi " + p + ", see you at " + meet + ". " + stop(cap(how)) + " - " + y], late: ["5 minutes after the start (if they're not there)", "Hi " + p + ", I'm ready for our " + meet + " call. Shall I call you now, or would another time be better? - " + y] };
    return { E: E, L: L, F: F, I: I, C: C, V: parts, Vline: Vline, R: R };
  }

  tool("messages", "Message builder", "Pick a channel and your market. Get cold emails, LinkedIn, Facebook and Instagram messages, call openers and voicemails, a video script, meeting reminders, or the whole two-week sequence, all from the same details.", ["2.9", "2.10", "3.8", "4.4", "4.9", "5.3", "5.7", "6.2", "7.4"], function (root, opt) {
    var S = load("messages", { ch: "sequence", niche: "", used: {}, time1: "Thursday at 9", time2: "Friday at 2" }), save = saver("messages", S);
    if (!S.migrated) { /* bring over what members typed into the old separate writers */
      ["emailwriter", "dmbuilder", "videoscript", "scripts", "reminders"].forEach(function (k) { var o = O.store.get("t_" + k, null) || {}; ["prospect", "you", "company", "business", "address", "offer", "proof", "time1", "time2", "phone", "show", "cons"].forEach(function (f) { if (!S[f] && o[f]) S[f] = o[f]; }); if (!S.signal && (o.observation || o.hook || o.obs)) S.signal = o.observation || o.hook || o.obs; if (!S.problem && o.problem && k === "emailwriter") S.problem = o.problem; });
      S.migrated = 1;
    }
    if (opt && opt.sub && MFIELDS[opt.sub]) S.ch = opt.sub;
    var mm = me(), off = offerData(); autoFill(S, { you: mm.you, company: mm.company, phone: mm.phone, address: mm.address, offer: offerLine() ? offerLine() + "." : "", problem: lower1(off.pain), proof: off.proof });
    var ME_KEYS = { you: 1, company: 1, phone: 1, address: 1 };
    function defsFor(ch) { var n = niche(S.niche); return MFIELDS[ch].map(function (k) { var f = MF[k], ph = f.ph; if (n && k === "problem") ph = n.pain[0].replace(/\.$/, "").toLowerCase(); return { k: k, l: f.l, t: "text", w: f.w, ph: ph, h: f.h }; }); }
    function draw() {
      var n = niche(S.niche);
      root.innerHTML = '<div class="panel"><div class="fields"><div class="field"><label for="mb_ch">Channel</label><select id="mb_ch">' + MCH.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === S.ch ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join("") + '</select></div><div class="field"><label for="mb_n">Your market</label><select id="mb_n">' + nicheOpts().map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === S.niche ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div></div>" + leadPick(S) +
        (S._auto && (S._auto.offer || S._auto.problem) ? '<p class="muted small">Your offer and problem are filled in from the <a href="#/t/offer">offer builder</a>. Change them here if this prospect needs something different.</p>' : "") +
        (n ? '<div class="callout"><b>' + esc(n.name) + ": " + esc(n.tag) + "</b><p>" + esc(n.angle) + " <strong>Best channels:</strong> " + esc(n.channels) + (n.time ? " <strong>When:</strong> " + esc(n.time) : "") + '</p><p class="small"><strong>Use a common problem:</strong> ' + n.pain.map(function (x, i) { return '<button type="button" class="linkish" data-pain="' + i + '">' + esc(x) + "</button>"; }).join(" · ") + "</p></div>" : "") +
        '</div><div class="panel"><h2>Details</h2>' + fieldsHtml(defsFor(S.ch), S) + '</div><div id="out"></div>';
      var defs = defsFor(S.ch); bind(root, defs, S, save, function (k) { if (ME_KEYS[k]) { var p = {}; p[k] = S[k]; saveMe(p); } mark(); out(); });
      out();
    }
    function mark() { useMark(S, S.ch, save); if (S.ch === "sequence") ["email", "call", "linkedin", "video"].forEach(function (k) { useMark(S, k, save); }); }
    function block(id, title, text, extra) { return '<div class="result"><div class="result-h"><h3>' + esc(title) + (extra || "") + '</h3><button type="button" class="btn sm" data-copy="' + id + '">Copy</button></div><pre>' + esc(text) + "</pre></div>"; }
    function out() {
      var M = msgSets(S), h = "", map = {}, ch = S.ch;
      function add(id, title, text, extra, after) { map[id] = text; h += block(id, title, text, extra) + (after || ""); }
      function emailBlock(id, x) { var fl = emailFlags(x[1]), w = words(x[1].split("\n").slice(2).join(" ")); add(id, x[0], x[1], ' <span class="tag">' + w + " words</span>", fl.length ? '<p class="small" style="color:var(--alert);margin:-6px 0 14px">' + esc(fl.join(" ")) + "</p>" : ""); }
      function dmBlock(id, x) { var nn = x[1].length, over = x[2] && nn > x[2]; add(id, x[0], x[1], ' <span class="tag' + (over ? " alert" : "") + '">' + nn + (x[2] ? " / " + x[2] : "") + " characters</span>", over ? '<p class="small" style="color:var(--alert);margin:-6px 0 14px">Too long for a connection note. Shorten it.</p>' : ""); }
      if (ch === "email") { ["v1", "v2", "v3"].forEach(function (k) { emailBlock(k, M.E[k]); }); var tp = String(S.topic || "[topic]").toLowerCase(), bz = String(S.business || "[business]").toLowerCase(); h += '<div class="panel"><h3 style="margin-top:0">Subject lines to test</h3><ul>' + [tp, "question about " + tp, bz, "idea for " + bz, (S.prospect || "[name]").toLowerCase() + ", quick question"].map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul><p class="muted small" style="margin:0">Short, lower case, no tricks. It should look like an email from a person.</p></div>'; ["f1", "f2", "f3"].forEach(function (k) { emailBlock(k, M.E[k]); }); h += '<p class="muted small">Salesy words will not send you to spam on their own; your sender reputation matters far more (lesson 4.8). They do make an email read like an ad. Run the pre-flight checklist before any campaign.</p>'; }
      else if (ch === "linkedin") Object.keys(M.L).forEach(function (k) { dmBlock(k, M.L[k]); });
      else if (ch === "facebook") Object.keys(M.F).forEach(function (k) { dmBlock(k, M.F[k]); });
      else if (ch === "instagram") Object.keys(M.I).forEach(function (k) { dmBlock(k, M.I[k]); });
      else if (ch === "call") { Object.keys(M.C).forEach(function (k) { add(k, M.C[k][0], M.C[k][1]); }); h += '<p class="muted small">Talk tracks, not scripts: learn the shape, then say it in your own words (lesson 3.8). Call in their business hours and follow the US calling rules (lesson 7.6).</p>'; }
      else if (ch === "video") { var tot = 0; M.V.forEach(function (x, i) { var s = Math.round(words(x[1]) / 2.5); tot += s; add("p" + i, x[0], x[1], ' <span class="tag">about ' + s + " sec</span>"); }); var script = M.V.map(function (x) { return x[1]; }).join("\n\n"); map.all = script; h = '<div class="panel"><div class="kpis">' + kpi("about " + tot + " sec", "spoken length", tot > 60 ? "down" : "up") + kpi(String(words(script)), "words") + '</div><div class="row"><button type="button" class="btn sm primary" data-copy="all">Copy whole script</button></div></div>' + h; add("line", "Message that carries the link", M.Vline); add("thumb", "Thumbnail text", (S.prospect || "[name]") + ", quick idea for " + (S.business || "[business]")); }
      else if (ch === "reminder") { Object.keys(M.R).forEach(function (k) { add(k, M.R[k][0], M.R[k][1]); }); h += '<p class="muted small">Text or WhatsApp only people who gave you their number for this meeting, and send from a US number (lesson 7.4 and 7.6).</p>'; }
      else {
        var SEQ = [["Day 1", "Email", M.E.v2], ["Day 1", "LinkedIn", M.L.connect], ["Day 3", "Call", M.C.prob], ["Day 3", "Voicemail if no answer", M.C.vm], ["Day 4", "Email, same thread", M.E.f1], ["Day 6", "Video", ["45-second video script", M.V.map(function (x) { return x[1]; }).join("\n\n") + "\n\n---\n" + M.Vline]], ["Day 8", "LinkedIn or Instagram", M.L.m1], ["Day 10", "Call, different time of day", M.C.perm], ["Day 14", "Email: polite close", M.E.f3]];
        h += '<div class="panel"><p style="margin:0">The two-week sequence from lesson 2.10, written for this prospect. Stop the moment they reply on any channel and carry on there. To get the dates and send times, use the <a href="#/t/cadence">cadence builder</a>.</p></div>';
        SEQ.forEach(function (x, i) { add("s" + i, x[0] + " · " + x[1], x[2][1]); });
        map.all = SEQ.map(function (x) { return x[0].toUpperCase() + " · " + x[1] + "\n" + x[2][1]; }).join("\n\n====\n\n");
        h = '<div class="row" style="margin-bottom:12px"><button type="button" class="btn sm primary" data-copy="all">Copy the whole sequence</button></div>' + h;
      }
      if (ch !== "sequence" && ch !== "video") { map.all = Object.keys(map).map(function (k) { return map[k]; }).join("\n\n----\n\n"); h += '<div class="row no-print"><button type="button" class="btn sm" data-copy="all">Copy all</button></div>'; }
      h += '<p class="muted small">Every line must be true. Edit the first line for each person, and never send identical messages in bulk.</p>';
      var lead = O.leads.get(S.leadId); if (lead) h = '<div class="row no-print" style="margin-bottom:12px"><button type="button" class="btn sm" data-act="touch">I sent it: log the touch for ' + esc(lead.n) + "</button></div>" + h;
      root._map = map; $("#out", root).innerHTML = h;
    }
    root.addEventListener("change", function (e) {
      if (e.target.id === "mb_ch") { S.ch = e.target.value; save(); draw(); try { history.replaceState(null, "", "#/t/messages/" + S.ch); } catch (x) {} }
      if (e.target.id === "mb_n") { S.niche = e.target.value; save(); draw(); }
    });
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-act='touch']")) { var lr = O.leads.change(S.leadId, O.leads.touch); if (lr) O.ui.toast("Logged. Next: " + (lr.na || "see the lead tracker")); return; }
      var c = e.target.closest("[data-copy]"); if (c && root._map) { O.ui.copy(root._map[c.getAttribute("data-copy")] || ""); mark(); }
      var pn = e.target.closest("[data-pain]"); if (pn) { var n = niche(S.niche); if (n) { S.problem = n.pain[+pn.getAttribute("data-pain")].replace(/\.$/, ""); S.problem = S.problem.charAt(0).toLowerCase() + S.problem.slice(1); save(); draw(); } }
    });
    draw();
    onLeadPick(root, S, save, function (r) { S.prospect = firstName(r); if (r.b) S.business = r.b; S.signal = r.sig || ""; draw(); });
  });

  /* ---------- Cadence builder: dated plan with send times in their time zone and in Pakistan ---------- */
  function slotFor(step) {
    var w = String(step.when).toLowerCase(), c = String(step.ch).toLowerCase();
    if (/late afternoon|different time/.test(w)) return [16, 30]; if (/early morning/.test(w)) return [7, 30]; if (/mid-morning/.test(w)) return [9, 30]; if (/midday|lunch/.test(w)) return [12, 0]; if (/evening/.test(w)) return [18, 0]; if (/morning/.test(w)) return [8, 0];
    if (c.indexOf("email") > -1) return [7, 30]; if (c.indexOf("call") > -1) return [9, 30]; if (c.indexOf("video") > -1) return [10, 30]; return [12, 0];
  }
  tool("cadence", "Cadence builder", "Pick a sequence, a start date and your prospect's time zone. Get a dated touch-by-touch plan with the send time in their time zone and yours, ready to copy or add to your calendar.", ["2.10", "3.6", "10.6", "11.3"], function (root) {
    var S = load("cadence", { type: "multi", start: isoDate(new Date()), name: "", tz: "America/Chicago" }), save = saver("cadence", S);
    if (!O.CAD[S.type]) S.type = "multi";
    var defs = [{ k: "name", l: "Prospect or batch name", t: "text", ph: "Dallas dentists, batch 1" }, { k: "type", l: "Sequence", t: "select", o: Object.keys(O.CAD).map(function (k) { return [k, O.CAD[k].label]; }) }, { k: "start", l: "Start date", t: "text", h: "Format YYYY-MM-DD" }, { k: "tz", l: "Prospect's time zone", t: "select", o: USTZ }];
    root.innerHTML = '<div class="panel"><h2>Setup</h2>' + leadPick(S) + fieldsHtml(defs, S) + '</div><div id="out"></div><div id="cad-lead"></div>';
    var rows = [];
    function biz(d) { var x = new Date(d.getTime()); if (x.getDay() === 6) x.setDate(x.getDate() + 2); if (x.getDay() === 0) x.setDate(x.getDate() + 1); return x; }
    function calc() {
      var c = O.CAD[S.type] || O.CAD.multi, st = fromIso(S.start); if (isNaN(st.getTime())) st = new Date();
      var first = c.steps[0] ? c.steps[0].day : 0;
      rows = c.steps.map(function (s) { var d = new Date(st.getTime()); d.setDate(d.getDate() + s.day - first); d = biz(d); var sl = slotFor(s), u = zoned(d, sl[0], sl[1], S.tz); return { d: d, s: s, n: s.day - first + 1, u: u, theirs: clock(u, S.tz), ours: clock(u, "Asia/Karachi", true) }; });
      $("#out", root).innerHTML = '<div class="panel"><h2>' + esc(c.label) + (S.name ? " for " + esc(S.name) : "") + '</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Their time</th><th>Your time (Pakistan)</th><th>Channel</th><th>What to do</th></tr></thead><tbody>' + rows.map(function (r) { return "<tr><td><b>" + esc(nice(r.d)) + '</b><br><span class="muted small">Day ' + r.n + "</span></td><td>" + esc(r.theirs) + "</td><td>" + esc(r.ours) + "</td><td>" + esc(r.s.ch) + "</td><td>" + esc(r.s.a) + "</td></tr>"; }).join("") + '</tbody></table></div><p class="muted small">Weekend dates move to Monday. Times are good default slots for each channel; calls go in their business hours. Write each message in the <a href="#/t/messages/sequence">message builder</a>. Check consent and calling-hour rules for every channel (lesson 7.6).</p>' + actions([{ id: "copy", t: "Copy plan", c: "primary" }, { id: "ics", t: "Add to my calendar (.ics)" }, { id: "print", t: "Print" }]) + "</div>";
    }
    function leadBox() { var r = O.leads.get(S.leadId); $("#cad-lead", root).innerHTML = r ? '<div class="panel no-print"><p class="small">Put this sequence on ' + esc(r.n) + "'s row in the lead tracker. Each time you log a touch, the next one and its date are set for you. A reply stops it.</p>" + actions([{ id: "seq", t: "Start this sequence for " + r.n, c: "primary" }]) + "</div>" : ""; }
    bind(root, defs, S, save, function () { calc(); leadBox(); }); calc(); leadBox();
    onLeadPick(root, S, save, function (r) { S.name = leadName(r); syncInputs(root, S); calc(); leadBox(); });
    function plain() { return rows.map(function (r) { return nice(r.d) + " | their time " + r.theirs + " | Pakistan " + r.ours + " | " + r.s.ch + " | " + r.s.a; }).join("\n"); }
    onAct(root, { seq: function () { var st = fromIso(S.start), r = O.leads.change(S.leadId, function (x) { O.leads.startSeq(x, S.type, isNaN(st.getTime()) ? isoDate(new Date()) : S.start, S.tz); }); if (r) O.ui.toast("Started. Next: " + r.na); }, copy: function () { O.ui.copy(plain()); }, print: function () { O.ui.printEl($("#out .panel", root)); }, ics: function () {
      function z(ms) { var x = new Date(ms); return x.getUTCFullYear() + ("0" + (x.getUTCMonth() + 1)).slice(-2) + ("0" + x.getUTCDate()).slice(-2) + "T" + ("0" + x.getUTCHours()).slice(-2) + ("0" + x.getUTCMinutes()).slice(-2) + "00Z"; }
      function icsText(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
      var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Cold Manual//Cadence//EN"];
      rows.forEach(function (r, i) { L.push("BEGIN:VEVENT", "UID:tcm-cad-" + z(r.u) + "-" + i + "@thecoldmanual", "DTSTAMP:" + z(Date.now()), "DTSTART:" + z(r.u), "DURATION:PT15M", "SUMMARY:" + icsText((S.name ? S.name + ": " : "") + r.s.ch), "DESCRIPTION:" + icsText(r.s.a), "END:VEVENT"); });
      L.push("END:VCALENDAR"); O.ui.download("cadence.ics", L.join("\r\n"), "text/calendar"); } });
  });

  /* ---------- Lead search builder ---------- */
  tool("leadsearch", "Lead search builder", "Type a business type and a place. Get ready-to-use searches for maps, the web, LinkedIn, Facebook, Instagram and buying signals such as hiring and ads, with links that open in a new tab.", ["2.2", "2.3", "12.2", "2.8", "16.2"], function (root) {
    var S = load("leadsearch", { biz: "", city: "", titles: "owner OR founder OR \"general manager\"", kw: "" }), save = saver("leadsearch", S);
    var defs = [{ k: "biz", l: "Business type (singular)", t: "text", ph: "dentist", h: "For example: dentist, roofing contractor, real estate agent, law firm" }, { k: "city", l: "City or region", t: "text", ph: "Dallas, TX" }, { k: "kw", l: "Industry keyword for LinkedIn", t: "text", ph: "dental", h: "Leave empty to use the business type" }, { k: "titles", l: "Job titles to find", t: "text", w: 1, h: "Boolean format works: owner OR founder OR \"general manager\"" }];
    root.innerHTML = '<div class="panel"><h2>What are you looking for?</h2>' + fieldsHtml(defs, S) + '</div><div id="out"></div><div id="chk"></div>';
    function enc(s) { return encodeURIComponent(s); }
    function calc() {
      if (!String(S.biz).trim() || !String(S.city).trim()) { $("#out", root).innerHTML = '<div class="panel"><p class="muted" style="margin:0">Type a business type and a city to build your searches.</p></div>'; return; }
      var b = S.biz.trim(), c = S.city.trim(), k = (S.kw || b).trim(), t = S.titles || "owner", town = c.split(",")[0].trim();
      var L = [
        ["Google Maps", b + " in " + c, "https://www.google.com/maps/search/" + enc(b + " in " + c), "Sort by newest reviews. Open the website and the phone number. Skip chains and franchises."],
        ["Google web search", "\"" + b + "\" \"" + town + "\" -jobs -directory -franchise", "https://www.google.com/search?q=" + enc("\"" + b + "\" \"" + town + "\" -jobs -directory -franchise"), "Finds small independent businesses that directories miss."],
        ["LinkedIn people", "(" + t + ") AND (" + k + ") AND " + town, "https://www.linkedin.com/search/results/people/?keywords=" + enc("(" + t + ") AND (" + k + ") AND " + town), "Filter by location and connection level. Save the profile URL, not just the name."],
        ["Facebook pages", b + " " + town, "https://www.facebook.com/search/pages?q=" + enc(b + " " + town), "Look for pages that post often and answer comments. Message the page or the owner's profile."],
        ["Instagram", b + " " + town, "https://www.instagram.com/explore/search/keyword/?q=" + enc(b + " " + town), "Check the latest post date. Accounts active in the last 30 days reply faster."],
        ["Signal: hiring for the phones or front desk", "hiring (receptionist OR \"front desk\" OR \"customer service\" OR dispatcher) \"" + b + "\" \"" + town + "\"", "https://www.google.com/search?q=" + enc("hiring (receptionist OR \"front desk\" OR \"customer service\" OR dispatcher) \"" + b + "\" \"" + town + "\""), "A business hiring for the phones usually has a response problem right now."],
        ["Signal: hiring for sales or marketing", b + " sales OR marketing", "https://www.indeed.com/jobs?q=" + enc(b + " sales OR marketing") + "&l=" + enc(c), "Hiring for growth means they want more customers and have budget to get them."],
        ["Signal: running ads", b + " " + town, "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=" + enc(b + " " + town), "Paying for ads means paying for leads. How fast they follow up decides whether that money is wasted."],
        ["Signal: just opened or expanded", "\"" + b + "\" \"" + town + "\" (\"grand opening\" OR \"now open\" OR \"new location\")", "https://www.google.com/search?q=" + enc("\"" + b + "\" \"" + town + "\" (\"grand opening\" OR \"now open\" OR \"new location\")") + "&tbs=qdr:m3", "Results from the last three months. New locations need new customers fast."]
      ];
      root._L = L;
      $("#out", root).innerHTML = L.map(function (x, i) { return '<div class="result"><div class="result-h"><h3>' + esc(x[0]) + '</h3><span class="row"><a class="btn sm" href="' + esc(x[2]) + '" target="_blank" rel="noopener noreferrer">Open</a><button type="button" class="btn sm" data-c="' + i + '">Copy search</button></span></div><pre>' + esc(x[1]) + '</pre><p class="muted small">' + esc(x[3]) + "</p></div>"; }).join("") +
        '<div class="panel"><h3 style="margin-top:0">Quick qualify before you add a lead</h3><ul><li>A real person or role to contact, and an email, phone or profile you can verify.</li><li>Evidence they are active: recent reviews, posts or ads.</li><li>A visible gap: slow replies, no booking link, unanswered messages, weak reviews about response.</li><li>You can say one true sentence about them.</li></ul></div><p class="muted small">Search pages change often. If a link does not give results, copy the search text into the site\'s own search box. Only collect public business information, and follow each site\'s rules.</p>';
    }
    /* check one lead before it goes in the tracker */
    var FITQ = ["Fits who you serve, in the right place", "Shows the problem or a buying signal right now", "Looks able to pay your price", "You can reach the person who decides"];
    S.chk = S.chk || { b: "", n: "", w: "", text: "", sig: "", fit: [false, false, false, false] };
    function chkDraw() {
      var c = S.chk, n = c.fit.filter(Boolean).length, tier = n === 4 ? "A" : n === 3 ? "B" : "C", word = n === 4 ? "Good fit. Contact this one first." : n === 3 ? "Worth contacting, after the perfect fits." : "Skip it for now, unless you find more.";
      $("#chk", root).innerHTML = '<div class="panel"><h2>Check a lead: good fit or skip?</h2><div class="fields"><div class="field"><label for="ck_b">Business</label><input id="ck_b" value="' + esc(c.b) + '"></div><div class="field"><label for="ck_n">Contact name</label><input id="ck_n" value="' + esc(c.n) + '"></div><div class="field wide"><label for="ck_w">Website or profile link</label><input id="ck_w" value="' + esc(c.w) + '"></div></div>' +
        FITQ.map(function (q, i) { return '<label class="chk"><input type="checkbox" data-ckfit="' + i + '"' + (c.fit[i] ? " checked" : "") + "><span>" + esc(q) + "</span></label>"; }).join("") + '<p class="small"><b>' + n + " / 4:</b> " + word + '</p><div class="field"><label for="ck_sig">One true detail you can mention</label><input id="ck_sig" value="' + esc(c.sig) + '" placeholder="You just opened a second location"><div class="hint">Something you actually saw. It goes into your messages for this lead.</div></div>' +
        (O.ai.on() ? '<details class="ck-ai"><summary>Paste what you found and ask AI</summary><div class="field"><label for="ck_text">Text from their website, reviews or posts</label><textarea id="ck_text" rows="5">' + esc(c.text) + '</textarea></div><div class="row"><button type="button" class="btn sm" data-act="fit">Check with AI</button></div><div id="ck-ai"></div>' + O.ai.hint + "</details>" : "") +
        '<div class="row"><button type="button" class="btn primary" data-act="ck-add">Add to lead tracker as tier ' + tier + "</button></div></div>";
    }
    root.addEventListener("input", function (e) { var m = { ck_b: "b", ck_n: "n", ck_w: "w", ck_sig: "sig", ck_text: "text" }[e.target.id]; if (m) { S.chk[m] = e.target.value; save(); } });
    root.addEventListener("change", function (e) { if (e.target.hasAttribute && e.target.hasAttribute("data-ckfit")) { S.chk.fit[+e.target.getAttribute("data-ckfit")] = e.target.checked; save(); chkDraw(); } });
    root.addEventListener("click", function (e) {
      var u = e.target.closest("[data-usedetail]"); if (u) { S.chk.sig = root._det[+u.getAttribute("data-usedetail")]; save(); $("#ck_sig", root).value = S.chk.sig; O.ui.toast("Added"); return; }
      var a = e.target.closest("[data-act]"); if (!a) return; var k = a.getAttribute("data-act"), c = S.chk;
      if (k === "ck-add") {
        if (!c.b.trim() && !c.n.trim()) { O.ui.toast("Add the business or a name"); return; }
        var n = c.fit.filter(Boolean).length, L = O.store.get("t_leads", null) || { rows: [] }, nm = c.n.trim() || c.b.trim(), dup = L.rows.some(function (r) { return String(r.n).toLowerCase() === nm.toLowerCase() && String(r.b || "").toLowerCase() === c.b.trim().toLowerCase(); });
        if (dup) { O.ui.toast("That lead is already in your tracker"); return; }
        L.rows.push({ id: newLeadId(), n: nm, b: c.b.trim(), e: "", p: "", w: c.w.trim(), sig: c.sig.trim(), c: "Email", t: n === 4 ? "A" : n === 3 ? "B" : "C", v: "", st: "New", na: "First touch", due: isoDate(new Date()) });
        O.store.set("t_leads", L); S.chk = { b: "", n: "", w: "", text: "", sig: "", fit: [false, false, false, false] }; save(); chkDraw(); O.ui.toast("Added to your lead tracker");
      }
      if (k === "fit") {
        var o = offerData(), out = $("#ck-ai", root), VW = { good: "Good fit", maybe: "Maybe", skip: "Skip" };
        O.ai.run(a, { mode: "fit", business: c.b, text: c.text, target: offerBase(o) || o.who || "", problem: o.pain || "" }, out, function (r) {
          root._det = (r.details || []).map(function (d) { return d.line; });
          out.innerHTML = '<div class="focus"><b>' + esc(VW[r.verdict] || "") + ".</b> " + esc((r.reasons || []).join(" ")) + "</div>" + (r.details && r.details.length ? "<h3>True details you could use</h3>" + r.details.map(function (d, i) { return '<div class="result"><div class="result-h"><h3>Detail ' + (i + 1) + '</h3><button type="button" class="btn sm" data-usedetail="' + i + '">Use this</button></div><pre>' + esc(d.line) + '</pre><p class="muted small">From the text: “' + esc(d.source) + "”</p></div>"; }).join("") : '<p class="small">It found no detail it could quote from what you pasted. Paste more, or look for a recent post or review.</p>') + O.ai.note();
        });
      }
    });
    chkDraw();
    bind(root, defs, S, save, calc); calc();
    root.addEventListener("click", function (e) { var c = e.target.closest("[data-c]"); if (c) O.ui.copy(root._L[+c.getAttribute("data-c")][1]); });
  });

  /* ---------- Cold email pre-flight checklist (numbers match lesson 4.8) ---------- */
  tool("emailcheck", "Cold email pre-flight checklist", "Tick every item before you send a campaign. Catch the setup mistakes that send mail to spam. The numbers match lesson 4.8.", ["4.2", "4.8", "12.3", "16.3"], function (root) {
    var G = [
      ["Domains and mailboxes", ["I send from separate domains that look like my brand, never my main business domain", "My sending domains redirect to my main website", "I have 2 or 3 mailboxes per domain, each with a real person's name and photo"]],
      ["Authentication", ["SPF is set up", "DKIM is set up", "DMARC is set up, starting with a monitoring policy", "I tested all three with a DNS or mail checker, and they match my From address"]],
      ["Warm-up and volume", ["Each new mailbox warmed up for 2 to 3 weeks before the first campaign", "I start at about 20 to 30 cold emails a day per mailbox", "I never push one mailbox past about 50 a day. For more volume I add mailboxes", "I raise volume slowly, and only while bounces and complaints stay low"]],
      ["List", ["Every address is verified", "Bounces stay under about 2 percent", "One list is for one type of buyer", "Duplicates and everyone who opted out are removed"]],
      ["Message", ["Plain text, about 50 to 90 words", "Zero or one link, no images, no attachments", "A truthful subject line and a clear, honest sender name", "An easy way to opt out, plus my company name and postal address"]],
      ["Tracking and monitoring", ["Open tracking is off", "I use a custom tracking domain if I track clicks", "Google Postmaster Tools is set up, and spam complaints stay under 0.1% (never 0.3%)", "I check bounces, replies and complaints every week"]],
      ["Replies", ["Sequences stop when someone replies, on any channel", "I have saved replies for each reply type (SOP 16.7)", "I answer positive replies within the hour in their business hours", "Opt-outs go on one suppression list straight away"]]
    ];
    var S = load("emailcheck", { ck2: {} }), save = saver("emailcheck", S), total = 0;
    if (!S.ck2) S.ck2 = {};
    G.forEach(function (g) { total += g[1].length; });
    function draw() {
      var n = Object.keys(S.ck2).filter(function (k) { return S.ck2[k]; }).length, pc = Math.round(n / total * 100);
      root.innerHTML = '<div class="panel"><div class="row between"><b>' + n + " of " + total + ' ready</b><span class="muted">' + pc + '%</span></div><div class="bar lg" style="margin-top:8px"><i style="width:' + pc + '%"></i></div><p class="muted small" style="margin:10px 0 0">' + (n === total ? "Everything is ticked. Send a small test first, then build up." : "Do not send a campaign until every box is ticked.") + "</p></div>" +
        G.map(function (g, gi) { return '<div class="panel"><h3 style="margin-top:0">' + esc(g[0]) + "</h3>" + g[1].map(function (t, i) { var k = gi + "_" + i; return '<label class="chk' + (S.ck2[k] ? " done" : "") + '"><input type="checkbox" data-k="' + k + '"' + (S.ck2[k] ? " checked" : "") + "><span>" + esc(t) + "</span></label>"; }).join("") + "</div>"; }).join("");
      $$("[data-k]", root).forEach(function (el) { el.addEventListener("change", function () { S.ck2[el.getAttribute("data-k")] = el.checked; save(); var y = window.scrollY; draw(); window.scrollTo(0, y); }); });
    }
    draw();
  });

  /* ---------- Lead tracker: replies, channels, deal value, CSV import ---------- */
  var LST = ["New", "Contacted", "Replied", "Qualified", "Booked", "Held", "Proposal", "Won", "Lost"], LCH = ["Email", "Call", "LinkedIn", "Facebook", "Instagram", "Video", "Referral", "Other"];
  O.LEAD_LIMIT = 900 * 1024;
  function csvParse(text) {
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { row.push(cur); cur = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
  }
  tool("leads", "Lead tracker", "Your pipeline: who, which channel, what stage, what it's worth and what happens next. Import leads from a CSV, search, and export any time. Saved to your account.", ["11.1", "2.2", "16.2", "16.7"], function (root) {
    O.leads.rows();
    var S = load("leads", { rows: [] }), save = saver("leads", S), filt = "All", q = "", show = 100, msg = "";
    S.rows.forEach(function (r) { if (r.st === undefined) r.st = "New"; });
    function bytes() { try { return new Blob([JSON.stringify(S)]).size; } catch (e) { return JSON.stringify(S).length; } }
    /* the lead's next jobs, each opening the right tool with this lead filled in */
    function leadExtras(r) {
      var today = isoDate(new Date()), bits = [];
      if (r.dnc) return '<br><span class="tag alert">Do not contact</span>';
      if (r.sig) bits.push('<span class="muted small">Noticed: ' + esc(r.sig) + "</span>");
      var info = []; if (r.lc) info.push("Last contact " + r.lc); if (r.seq) { var c = O.CAD[r.seq.type] || O.CAD.multi; info.push("Touch " + Math.min(r.seq.i + 1, c.steps.length) + " of " + c.steps.length); }
      if (info.length) bits.push('<span class="muted small">' + esc(info.join(" · ")) + "</span>");
      var go = [];
      if (r.st !== "Won" && r.st !== "Lost") {
        if (r.st === "New" || r.st === "Contacted") go.push('<button type="button" class="linkish" data-touch="' + esc(r.id) + '">Log a touch</button>');
        if (r.st === "New" || r.st === "Contacted") { go.push('<a href="#/t/messages/sequence" data-pick="' + esc(r.id) + '">Write messages</a>'); if (!r.seq) go.push('<a href="#/t/cadence" data-pick="' + esc(r.id) + '">Start sequence</a>'); }
        go.push('<a href="#/t/replies" data-pick="' + esc(r.id) + '">They replied</a>');
        if (["Replied", "Qualified", "Booked", "Held"].indexOf(r.st) > -1) go.push('<a href="#/t/discovery" data-pick="' + esc(r.id) + '">Discovery</a>');
        if (["Held", "Proposal"].indexOf(r.st) > -1) go.push('<a href="#/t/proposal" data-pick="' + esc(r.id) + '">Proposal</a>');
      }
      if (r.st === "Won") go.push('<a href="#/t/contract" data-pick="' + esc(r.id) + '">Contract</a>');
      if (go.length) bits.push('<span class="small lead-go">' + go.join("") + "</span>");
      return bits.length ? "<br>" + bits.join("<br>") : "";
    }
    function draw() {
      var low = q.toLowerCase(), today = isoDate(new Date());
      var isDue = function (r) { return r.due && r.due <= today && r.st !== "Won" && r.st !== "Lost"; };
      var rows = S.rows.filter(function (r) { return (filt === "All" || (filt === "Due" ? isDue(r) : r.st === filt)) && (!low || [r.n, r.b, r.e, r.p, r.w, r.na, r.no].join(" ").toLowerCase().indexOf(low) > -1); });
      var counts = {}, open = 0, won = 0; S.rows.forEach(function (r) { counts[r.st] = (counts[r.st] || 0) + 1; var v = +r.v || 0; if (r.st === "Won") won += v; else if (["Booked", "Held", "Proposal"].indexOf(r.st) > -1) open += v; });
      var due = S.rows.filter(function (r) { return r.due && r.due <= today && r.st !== "Won" && r.st !== "Lost"; }).length, used = bytes(), pct = Math.round(used / O.LEAD_LIMIT * 100);
      var h = '<div class="kpis">' + kpi(fmt(S.rows.length), "leads") + kpi(fmt(due), "next actions due today or late", due ? "down" : "") + kpi("$" + fmt(open), "monthly value in booked, held and proposal") + kpi("$" + fmt(won), "monthly value won", won ? "up" : "") + "</div>";
      h += '<details class="panel"' + (S.rows.length ? "" : " open") + '><summary><b>Add a lead</b></summary><div class="fields" style="margin-top:12px"><div class="field"><label for="ln">Name</label><input id="ln"></div><div class="field"><label for="lb">Business</label><input id="lb"></div><div class="field"><label for="le">Email</label><input id="le" inputmode="email"></div><div class="field"><label for="lp">Phone</label><input id="lp" inputmode="tel"></div><div class="field"><label for="lw">Website or profile link</label><input id="lw"></div><div class="field"><label for="lsig">Something real you noticed (optional)</label><input id="lsig"></div><div class="field"><label for="lc">First channel</label><select id="lc">' + LCH.map(function (c) { return "<option>" + c + "</option>"; }).join("") + '</select></div><div class="field"><label for="lt">Tier</label><select id="lt"><option>A</option><option>B</option><option>C</option></select></div><div class="field"><label for="lv">Value per month ($, optional)</label><input id="lv" inputmode="decimal"></div></div><div class="row"><button type="button" class="btn primary" data-act="add">Add lead</button><label class="btn sm" for="limp" style="cursor:pointer">Import from CSV</label><input type="file" id="limp" accept=".csv,text/csv" hidden></div><p class="muted small">CSV import reads columns such as Name, First name, Company or Business, Email, Phone, Website or LinkedIn, Signal, Notes. Duplicates (same email, phone or name and business) are skipped.</p></details>';
      if (msg) h += '<p class="small" role="status">' + esc(msg) + "</p>";
      h += '<div class="row between" style="align-items:flex-end"><div class="filters" role="group" aria-label="Filter by stage">' + ["All", "Due"].concat(LST).map(function (s) { var cn = s === "Due" ? due : counts[s]; return '<button type="button" data-f="' + s + '" aria-pressed="' + (s === filt) + '">' + s + (s !== "All" && cn ? " " + cn : "") + "</button>"; }).join("") + '</div><div class="field" style="max-width:260px;margin:0"><label for="lq">Search</label><input id="lq" value="' + esc(q) + '" placeholder="Name, business, email"></div></div>';
      if (!rows.length) h += '<div class="panel"><p class="muted" style="margin:0">' + (S.rows.length ? "No leads match." : "No leads yet. Add your first lead above, or import a CSV.") + "</p></div>";
      else h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Lead</th><th>Channel</th><th>Stage</th><th>$ / month</th><th>Next action</th><th>Due</th><th></th></tr></thead><tbody>' + rows.slice(0, show).map(function (r) { var i = S.rows.indexOf(r); return "<tr><td><b>" + esc(r.n) + "</b> <span class=\"tag\">" + esc(r.t || "B") + '</span><br><span class="muted small">' + esc([r.b, r.e, r.p].filter(Boolean).join(" · ")) + (r.w ? ' · <a href="' + esc(/^https?:\/\//.test(r.w) ? r.w : "https://" + r.w) + '" target="_blank" rel="noopener noreferrer">link</a>' : "") + '</span>' + leadExtras(r) + '</td><td><select data-i="' + i + '" data-f2="c" aria-label="Channel for ' + esc(r.n) + '">' + LCH.map(function (c) { return "<option" + (c === r.c ? " selected" : "") + ">" + c + "</option>"; }).join("") + '</select></td><td><select data-i="' + i + '" data-f2="st" aria-label="Stage for ' + esc(r.n) + '">' + LST.map(function (s) { return "<option" + (s === r.st ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select>' + (r.st === "Lost" ? '<select data-i="' + i + '" data-f2="lr" style="margin-top:6px" aria-label="Why ' + esc(r.n) + ' was lost"><option value="">Why lost?</option>' + LOST_WHY.map(function (w) { return "<option" + (w === r.lr ? " selected" : "") + ">" + w + "</option>"; }).join("") + "</select>" : "") + '</td><td><input data-i="' + i + '" data-f2="v" value="' + esc(r.v || "") + '" inputmode="decimal" style="width:90px" aria-label="Monthly value for ' + esc(r.n) + '"></td><td><input data-i="' + i + '" data-f2="na" value="' + esc(r.na || "") + '" aria-label="Next action for ' + esc(r.n) + '"></td><td><input data-i="' + i + '" data-f2="due" value="' + esc(r.due || "") + '" placeholder="YYYY-MM-DD" style="width:120px;' + (r.due && r.due < today && r.st !== "Won" && r.st !== "Lost" ? "border-color:var(--alert)" : "") + '" aria-label="Due date for ' + esc(r.n) + '"></td><td><button type="button" class="btn sm danger" data-del="' + i + '" aria-label="Delete ' + esc(r.n) + '">Delete</button></td></tr>'; }).join("") + "</tbody></table></div>" + (rows.length > show ? '<p><button type="button" class="btn sm" data-act="more">Show ' + Math.min(100, rows.length - show) + " more of " + (rows.length - show) + "</button></p>" : "");
      var why = {}; S.rows.forEach(function (r) { if (r.st === "Lost" && r.lr) why[r.lr] = (why[r.lr] || 0) + 1; });
      var whyK = Object.keys(why).sort(function (a, b) { return why[b] - why[a]; });
      if (whyK.length) h += '<p class="small" style="margin-top:12px"><b>Why you lose deals:</b> ' + whyK.slice(0, 3).map(function (k) { return esc(k) + " (" + why[k] + ")"; }).join(", ") + "</p>";
      if (S.rows.length) h += '<div class="row" style="margin-top:14px"><button type="button" class="btn sm" data-act="csv">Export CSV</button><button type="button" class="btn sm" data-act="archive">Export and remove won and lost leads</button></div>';
      h += '<p class="muted small">Storage used: ' + pct + "% (about " + fmt(S.rows.length ? Math.floor(O.LEAD_LIMIT / (used / S.rows.length)) : 4000) + " leads fit)." + (pct >= 80 ? " <b>Nearly full.</b> Export and remove won and lost leads to make room." : "") + "</p>";
      root.innerHTML = h;
      $$("[data-f2]", root).forEach(function (el) { el.addEventListener("change", function () { var r = S.rows[+el.getAttribute("data-i")], f = el.getAttribute("data-f2"); if (f === "st") O.leads.setStage(r, el.value); else r[f] = f === "v" ? (num(el.value) || "") : el.value; save(); if (f === "st" || f === "c" || f === "lr") draw(); }); });
      var qi = $("#lq", root); qi.addEventListener("input", function () { q = qi.value; show = 100; var pos = qi.selectionStart; draw(); var n = $("#lq", root); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
      $("#limp", root).addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { importCsv(String(rd.result || "")); }; rd.readAsText(f); });
    }
    function key(r) { return [String(r.e || "").toLowerCase(), String(r.p || "").replace(/\D/g, ""), (String(r.n || "") + "|" + String(r.b || "")).toLowerCase()]; }
    function importCsv(text) {
      var rows = csvParse(text); if (rows.length < 2) { msg = "That file has no rows to import."; draw(); return; }
      var hd = rows[0].map(function (x) { return String(x).trim().toLowerCase(); });
      function col(names) { for (var i = 0; i < hd.length; i++) for (var j = 0; j < names.length; j++) if (hd[i] === names[j] || hd[i].replace(/[^a-z]/g, "") === names[j].replace(/[^a-z]/g, "")) return i; return -1; }
      var c = { n: col(["name", "full name", "contact", "contact name"]), fn: col(["first name", "firstname"]), lnm: col(["last name", "lastname"]), b: col(["business", "company", "company name", "organization", "account"]), e: col(["email", "email address", "work email"]), p: col(["phone", "phone number", "mobile", "telephone"]), w: col(["website", "url", "linkedin", "linkedin url", "profile"]), sig: col(["signal", "personalization", "personalisation", "icebreaker", "first line"]), no: col(["notes", "note"]) };
      var seen = {}; S.rows.forEach(function (r) { key(r).forEach(function (k, i) { if (k && k !== "|" && (i < 2 ? k.length > 3 : true)) seen[k] = 1; }); });
      var added = 0, dup = 0, full = false;
      rows.slice(1).forEach(function (r) {
        if (full) return; var g = function (i) { return i > -1 ? String(r[i] || "").trim().slice(0, 200) : ""; };
        var nm = g(c.n) || [g(c.fn), g(c.lnm)].filter(Boolean).join(" ") || g(c.b); if (!nm) return;
        var row = { id: newLeadId(), n: nm, b: g(c.b), e: g(c.e), p: g(c.p), w: g(c.w), sig: g(c.sig), no: g(c.no), c: "Email", t: "B", st: "New", na: "First touch", due: isoDate(new Date()) };
        var ks = key(row); if (ks.some(function (k, i) { return k && k !== "|" && (i < 2 ? k.length > 3 : true) && seen[k]; })) { dup++; return; }
        ks.forEach(function (k, i) { if (k && k !== "|" && (i < 2 ? k.length > 3 : true)) seen[k] = 1; });
        S.rows.push(row); added++; if (bytes() > O.LEAD_LIMIT) { S.rows.pop(); added--; full = true; }
      });
      msg = "Imported " + added + " lead" + (added === 1 ? "" : "s") + (dup ? ", skipped " + dup + " duplicate" + (dup === 1 ? "" : "s") : "") + "." + (full ? " Storage is full, so the rest were not added. Export and remove won and lost leads first." : "");
      save(); draw();
    }
    function csvOut(list) { var qq = function (s) { s = String(s == null ? "" : s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }; return ["Name,Business,Email,Phone,Link,Channel,Tier,Stage,Value per month,Next action,Due,Notes,Noticed,Last contact,Lost reason,Do not contact"].concat(list.map(function (r) { return [r.n, r.b, r.e, r.p, r.w, r.c, r.t, r.st, r.v, r.na, r.due, r.no, r.sig, r.lc, r.lr, r.dnc ? "Yes" : ""].map(qq).join(","); })).join("\n"); }
    root.addEventListener("click", function (e) {
      var pk = e.target.closest("[data-pick]"); if (pk) { O.pickLead = pk.getAttribute("data-pick"); return; }
      var tc = e.target.closest("[data-touch]"); if (tc) { var tr = S.rows.filter(function (x) { return x.id === tc.getAttribute("data-touch"); })[0]; if (tr) { O.leads.touch(tr); save(); draw(); } return; }
      var f = e.target.closest("[data-f]"), a = e.target.closest("[data-act]"), d = e.target.closest("[data-del]");
      if (f) { filt = f.getAttribute("data-f"); show = 100; draw(); }
      if (d) { S.rows.splice(+d.getAttribute("data-del"), 1); save(); draw(); }
      if (!a) return; var k = a.getAttribute("data-act");
      if (k === "add") { var n = $("#ln", root).value.trim(); if (!n) { O.ui.toast("Add a name"); return; } var row = { id: newLeadId(), sig: $("#lsig", root).value.trim(), n: n, b: $("#lb", root).value.trim(), e: $("#le", root).value.trim(), p: $("#lp", root).value.trim(), w: $("#lw", root).value.trim(), c: $("#lc", root).value, t: $("#lt", root).value, v: num($("#lv", root).value) || "", st: "New", na: "First touch", due: isoDate(new Date()) }; S.rows.push(row); if (bytes() > O.LEAD_LIMIT) { S.rows.pop(); msg = "Storage is full. Export and remove won and lost leads to make room."; } else msg = ""; save(); draw(); }
      if (k === "more") { show += 100; draw(); }
      if (k === "csv") O.ui.download("leads.csv", csvOut(S.rows), "text/csv");
      if (k === "archive") { var closed = S.rows.filter(function (r) { return r.st === "Won" || r.st === "Lost"; }); if (!closed.length) { msg = "No won or lost leads to remove."; draw(); return; } O.ui.download("leads-closed-" + isoDate(new Date()) + ".csv", csvOut(closed), "text/csv"); S.rows = S.rows.filter(function (r) { return closed.indexOf(r) < 0; }); msg = "Exported and removed " + closed.length + " closed leads."; save(); draw(); }
    });
    draw();
  });

  /* ---------- Reply handler: what a reply means and what to do next (SOP 16.7) ---------- */
  /* order matters: anything that asks to stop is checked first */
  var RT = [
    { k: "unsubscribe", l: "Unsubscribe", re: /\b(unsubscribe|remove me|take me off|stop (emailing|messaging|texting|calling|contacting)|do not (contact|email|call|message)|don'?t (contact|email|call|message) me|opt(ed)? out)\b/i, means: "They asked not to be contacted. This is not an objection to handle.", goal: "Remove them from every sequence and channel straight away. Don't reply.", st: "Lost", lr: "Asked not to be contacted", na: "Removed: do not contact again", due: null, stop: 1 },
    { k: "complaint", l: "Complaint", re: /\b(scam|spam|spamming|harass\w*|report you|how did you get (my|this)|who gave you|stop bothering|leave me alone)\b/i, means: "They're annoyed about being contacted. Any selling now makes it worse.", goal: "Answer honestly if they asked a question, say sorry once, and stop.", st: "Lost", lr: "Asked not to be contacted", na: "Removed: do not contact again", due: null, tpl: "Sorry about that, {p}. I found {b} through [where you really found them]. I won't contact you again." },
    { k: "ooo", l: "Out of office", re: /\b(out of (the )?office|ooo|automatic reply|auto.?reply|away until|on vacation|on leave|limited access to email)\b/i, means: "An automatic message. A person hasn't read your email yet.", goal: "Don't answer it. Follow up after the date they return.", st: null, na: "Follow up after they return", due: 7 },
    { k: "wrongperson", l: "Wrong person", re: /\b(wrong person|not the right person|not my (area|department)|doesn'?t handle|don'?t handle|you('| wi)ll? (want|need) to (talk|speak)|talk to (my|our)|speak (to|with) (my|our)|contact (my|our)|reach out to (my|our)|(he|she|they) handles?)\b/i, means: "They may be pointing you to the right person, which is useful.", goal: "Thank them and ask who handles it.", st: "Replied", na: "Contact the right person", due: 0, tpl: "Thanks, {p}. Who's the best person to talk to about {t}? Happy to mention you pointed me their way, if that's okay." },
    { k: "notinterested", l: "Not interested", re: /\b(not interested|no thanks|no thank you|not for (us|me)|we'?re (all )?good|we are (all )?good|we'?ll pass|i'?ll pass|don'?t need|do not need|no need)\b/i, means: "Most often it's bad timing or a poor fit, not a reason to argue.", goal: "Accept it politely. One light question is fine, then close it.", st: "Lost", lr: "No need", na: "", due: null, tpl: "No problem, {p}, thanks for letting me know. Out of interest, is {t} already sorted at {b}, or just not a priority right now?" },
    { k: "already", l: "Already has someone", re: /\b(already (have|use|got|work with|using)|have (someone|a (guy|company|person|team|vendor|provider))|we use|in.?house|happy with)\b/i, means: "They have a current way of doing this. It may be working, or it may not.", goal: "Don't argue or compare. Stay curious and keep the door open.", st: "Replied", na: "Answer their reply", due: 0, tpl: "Good to hear you've got that covered, {p}. How's it working for you on {t}? If it's all good, I'll leave you to it." },
    { k: "notnow", l: "Not now", re: /\b(not (right )?now|not at the moment|maybe later|too busy|busy right now|next (week|month|quarter|year|spring|summer|fall|winter)|after (the )?(holiday|season|summer|new year)|circle back|reach (back )?out (in|later)|check back|follow up (in|later)|bad time)\b/i, means: "Interested enough to answer, but it isn't a priority yet. These are often next quarter's clients.", goal: "Agree, ask when to come back, and set a dated reminder.", st: "Contacted", na: "Check back at the time they said", due: 30, stop: 1, tpl: "No problem, {p}. When would be a better time for me to check back: next month, or later in the year?" },
    { k: "price", l: "Price question", re: /\b(how much|what('?s| is| are| does) (the |your )?(price|cost|pricing|rate|fee)|what (does|would) it cost|pricing|price|cost|rates?|fees?)\b/i, means: "They're curious, and they may be testing whether it's worth their time. A price with no context is easy to dismiss.", goal: "Don't dodge. Give an honest short answer if you can, ask one question, and offer a short call.", st: "Replied", na: "Book the meeting", due: 0, obj: 1, tpl: "Good question, {p}. {price} What's going on with {t} right now that made you ask? I have {t1} or {t2} if a quick call is easier." },
    { k: "sendinfo", l: "Asked for more info", re: /\b(send (me |us |over )?(some |more )?(info|information|details|something|a (brochure|deck|pdf|link))|email me|more (info|information|details)|send it over|have a website)\b/i, means: "It can be real interest or a polite way to end the thread. A question tells you which.", goal: "Send one short thing that fits them, and ask what they'd most want to see.", st: "Replied", na: "Send the info and book the meeting", due: 0, obj: 1, tpl: "Happy to, {p}. So I send the right thing: what's the one thing you'd want to see about {t}?" },
    { k: "interested", l: "Interested", re: /\b(interested|sounds (good|great|interesting)|tell me more|let'?s (talk|chat|do it)|yes|sure|ok(ay)?|happy to (chat|talk)|call me|give me a call|when (can|are)|set up a (call|time)|book|how does (it|this|that) work|what do you (do|have in mind))\b/i, means: "They're open to talking. Speed matters more than a perfect message.", goal: "One short reply: one question and two times. No sales pitch.", st: "Replied", na: "Book the meeting", due: 0, tpl: "Great to hear, {p}. Quick question so the call's useful: {q} I have {t1} or {t2} your time, or tell me what suits you." },
    { k: "question", l: "Question", re: /\?/, means: "They want something cleared up before they decide.", goal: "Answer briefly and truthfully, then ask for the call.", st: "Replied", na: "Answer their question", due: 0, obj: 1, tpl: "Thanks for asking, {p}. [Your short, true answer.] Would it be easier to go through it on a quick call? I have {t1} or {t2}." }
  ];
  var RT_OTHER = { k: "unclear", l: "Not sure", means: "It isn't clear what they mean. Don't guess: ask.", goal: "Ask one simple question that moves things on.", st: "Replied", na: "Answer their reply", due: 0, obj: 1, tpl: "Thanks for coming back to me, {p}. Just so I don't waste your time: is {t} something you're looking at right now?" };
  O.classifyReply = function (t) { return classifyReply(t).k; };
  var RSTOP = { a: 1, an: 1, the: 1, and: 1, or: 1, to: 1, of: 1, is: 1, it: 1, we: 1, i: 1, you: 1, your: 1, my: 1, our: 1, that: 1, this: 1, for: 1, on: 1, in: 1, at: 1, me: 1, us: 1, do: 1, have: 1, just: 1, not: 1, be: 1, are: 1, so: 1, but: 1, with: 1, what: 1, how: 1, if: 1 };
  function classifyReply(t) { for (var i = 0; i < RT.length; i++) if (RT[i].re.test(t)) return RT[i]; return RT_OTHER; }
  function matchObjections(t) {
    var w = String(t).toLowerCase().match(/[a-z']{3,}/g) || []; w = w.filter(function (x) { return !RSTOP[x]; });
    if (!w.length) return [];
    return O.OBJ.map(function (o) { var q = o.q.toLowerCase(), s = 0; w.forEach(function (x) { if (q.indexOf(x) > -1) s++; }); return { o: o, s: s }; }).filter(function (x) { return x.s >= 2; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 2).map(function (x) { return x.o; });
  }
  tool("replies", "Reply handler", "Paste a prospect's reply from any channel. See what type it is, what it probably means, a reply to adapt and what to do next, then update the lead in one click.", ["16.7", "4.6", "7.3", "3.4"], function (root) {
    var S = load("replies", { text: "", channel: "Email", prospect: "", business: "", leadId: "" }), save = saver("replies", S), cur = null;
    function details() {
      var o = offerData(), m = O.store.get("t_messages", null) || {}, r = O.leads.get(S.leadId);
      return { p: S.prospect || (r ? firstName(r) : "") || "[name]", b: S.business || (r && r.b) || "[their business]", t: String(m.topic || o.pain || "[the area you help with]").replace(/\.$/, ""), t1: m.time1 || "[time option 1]", t2: m.time2 || "[time option 2]", price: o.price > 0 ? "It's usually around $" + fmt(o.price) + " a month, depending on the setup." : "[Your honest price or range.]", q: "[one question about their problem]?" };
    }
    function fillReply(tpl) { var d = details(); return String(tpl || "").replace(/\{(\w+)\}/g, function (m, k) { return d[k] != null ? d[k] : m; }); }
    function shell() {
      root.innerHTML = '<div class="panel"><div class="fields">' + '<div class="field wide">' + leadPick(S) + '</div><div class="field"><label for="ry_ch">Where they replied</label><select id="ry_ch">' + LCH.map(function (c) { return "<option" + (c === S.channel ? " selected" : "") + ">" + c + "</option>"; }).join("") + '</select></div><div class="field"><label for="ry_p">Their first name</label><input id="ry_p" value="' + esc(S.prospect) + '"></div><div class="field wide"><label for="ry_text">Their reply</label><textarea id="ry_text" rows="6" placeholder="Paste exactly what they wrote">' + esc(S.text) + '</textarea></div></div><div class="row"><button type="button" class="btn primary" data-act="sort">Work it out</button>' + (O.ai.on() ? '<button type="button" class="btn sm" data-act="ai">Draft with AI</button>' : "") + "</div>" + (O.ai.on() ? O.ai.hint : "") + '</div><div id="ry-out"></div>';
    }
    /* x: the type, what it means, the draft, and what happens to the lead */
    function show(x) {
      cur = x; var r = O.leads.get(S.leadId), obs = x.objs || [], h = '<div class="panel"><div class="row between"><h2 style="margin:0">' + esc(x.l) + "</h2>" + (x.ai ? '<span class="tag">AI draft</span>' : '<span class="tag">Automatic check</span>') + "</div><p>" + esc(x.means) + '</p><div class="focus"><b>What to do:</b> ' + esc(x.goal) + "</div></div>";
      if (x.tpl) h += '<div class="result"><div class="result-h"><h3>Reply to adapt (' + esc(S.channel) + ')</h3><button type="button" class="btn sm" data-act="copy">Copy</button></div><pre>' + esc(x.tpl) + '</pre></div><p class="muted small">Fill in every [bracket] and check that each line is true. Change it so it sounds like you.</p>';
      if (x.ask) h += '<p class="small"><b>The question to ask:</b> ' + esc(x.ask) + "</p>";
      if (obs.length) h += '<div class="panel"><h3 style="margin-top:0">From the objection bank</h3>' + obs.map(function (o) { return '<div class="flag"><q>' + esc(o.q) + "</q><p>" + esc(o.means) + " <b>Ask:</b> " + esc(o.ask) + "</p></div>"; }).join("") + '<p class="small" style="margin:0"><a href="#/t/objections">Open the objection bank</a></p></div>';
      var due = x.due == null ? "" : addBiz(x.due), plan = (x.st ? "Stage: " + x.st + ". " : "") + (x.na ? "Next: " + x.na + (due ? " by " + due : "") + "." : "");
      h += '<div class="panel"><h3 style="margin-top:0">Update the lead</h3><p class="small">' + esc(plan) + "</p>" + (r ? '<div class="row"><button type="button" class="btn primary" data-act="apply">Update ' + esc(r.n) + '</button></div><div id="ry-done"></div>' : '<p class="muted small" style="margin:0">Choose a lead above to update it in one click.</p>') + "</div>";
      if (x.ai) h += O.ai.note();
      $("#ry-out", root).innerHTML = h;
    }
    function ruleCheck() {
      var t = S.text.trim(), out = $("#ry-out", root); if (!t) { out.innerHTML = '<p class="callout warn">Paste their reply first.</p>'; return; }
      var c = classifyReply(t); useMark(S, "sorted", save);
      show({ k: c.k, l: c.l, means: c.means, goal: c.goal, tpl: c.tpl ? fillReply(c.tpl) : "", st: c.st, lr: c.lr, na: c.na, due: c.due, stop: c.stop, objs: c.obj || c.k === "already" || c.k === "notnow" ? matchObjections(t) : [] });
    }
    root.addEventListener("input", function (e) { if (e.target.id === "ry_text") { S.text = e.target.value; save(); } if (e.target.id === "ry_p") { S.prospect = e.target.value; save(); } });
    root.addEventListener("change", function (e) { if (e.target.id === "ry_ch") { S.channel = e.target.value; save(); } });
    root.addEventListener("click", function (e) {
      var a = e.target.closest("[data-act]"); if (!a) return; var k = a.getAttribute("data-act");
      if (k === "sort") ruleCheck();
      if (k === "copy" && cur) O.ui.copy(cur.tpl);
      if (k === "ai") {
        var t = S.text.trim(), out = $("#ry-out", root); if (!t) { out.innerHTML = '<p class="callout warn">Paste their reply first.</p>'; return; }
        var o = offerData(), d = details(), mm = me();
        O.ai.run(a, { mode: "reply", text: t, channel: S.channel, prospect: d.p, you: mm.you || "", offer: offerLine(), price: o.price > 0 ? "$" + o.price + " a month" : "", times: d.t1 + " or " + d.t2 }, out, function (r) {
          var c = RT.concat([RT_OTHER]).filter(function (x) { return x.k === r.type; })[0] || RT_OTHER;
          useMark(S, "ai", save);
          show({ ai: !r.local, k: r.type, l: c.l, means: r.meaning || c.means, goal: c.goal, tpl: r.draft || "", ask: r.ask || "", st: r.type === "unsubscribe" || r.type === "complaint" ? "Lost" : r.nextStage, lr: r.nextStage === "Lost" || r.type === "unsubscribe" || r.type === "complaint" ? c.lr || "Other" : "", na: r.nextAction || c.na, due: r.nextStage === "Lost" || r.type === "unsubscribe" || r.type === "complaint" ? null : r.dueDays == null ? c.due : r.dueDays, stop: c.stop, objs: matchObjections(t) });
        });
      }
      if (k === "apply" && cur) {
        var x = cur, today = isoDate(new Date()), line = today + " replied (" + S.channel + "): " + S.text.trim().replace(/\s+/g, " ").slice(0, 200);
        var done = O.leads.change(S.leadId, function (r) {
          r.lc = r.lc || today; if (x.stop) r.seq = null;
          if (x.st) O.leads.setStage(r, x.st);
          if (x.st === "Lost") r.lr = x.lr || "Other";
          if (x.k === "unsubscribe" || x.lr === "Asked not to be contacted") r.dnc = true;
          r.na = x.na || r.na || ""; r.due = x.due == null ? (x.st === "Lost" ? "" : r.due) : addBiz(x.due);
          r.no = (line + (r.no ? "\n" + r.no : "")).slice(0, 2000);
        });
        if (done) { $("#ry-done", root).innerHTML = '<p class="small" role="status">' + esc(done.n) + ' is updated. <a href="#/t/leads">Open the lead tracker</a></p>'; save(); }
      }
    });
    shell();
    onLeadPick(root, S, save, function (r) { S.prospect = firstName(r); S.business = r.b || ""; var f = $("#ry_p", root); if (f) f.value = S.prospect; if (LCH.indexOf(r.c) > -1) { S.channel = r.c; var c = $("#ry_ch", root); if (c) c.value = r.c; } });
  });

  /* 3. Objection bank + drill */
  tool("objections", "Objection bank", "36 objections with what they usually mean, a reply to adapt, and a question to ask. Includes a random drill.", ["3.4", "10.3"], function (root) {
    var cat = "All", q = "", drill = null, reveal = false;
    function list() { return O.OBJ.filter(function (o) { return (cat === "All" || o.cat === cat) && (!q || (o.q + " " + o.reply + " " + o.means).toLowerCase().indexOf(q) > -1); }); }
    function draw() {
      var items = list(), cats = ["All"].concat(O.OBJ_CATS);
      var h = '<div class="panel"><div class="row between"><div class="filters" role="group" aria-label="Filter by type">' + cats.map(function (c) { return '<button type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + "</button>"; }).join("") + '</div><button type="button" class="btn sm primary" data-act="drill">Drill me</button></div><div class="field" style="max-width:420px"><label for="oq">Search</label><input id="oq" value="' + esc(q) + '" placeholder="Try: price, partner, robot"></div></div>';
      if (drill) {
        h += '<div class="panel" style="border-color:var(--border-active)"><h2>Drill</h2><p style="font-size:1.2rem" class="idea">' + esc(drill.q) + '</p><p class="muted">Say your reply out loud, then check it.</p>' + (reveal ? '<div class="result"><div class="result-h"><h3>Usually means</h3></div><pre>' + esc(drill.means) + '</pre></div><div class="result"><div class="result-h"><h3>Reply to adapt</h3></div><pre>' + esc(drill.reply) + '</pre></div><div class="result"><div class="result-h"><h3>Question to ask</h3></div><pre>' + esc(drill.ask) + "</pre></div>" : "") + '<div class="row"><button type="button" class="btn sm" data-act="reveal">' + (reveal ? "Hide answer" : "Show answer") + '</button><button type="button" class="btn sm primary" data-act="drill">Next objection</button><button type="button" class="btn sm" data-act="stop">Stop drill</button></div></div>';
      }
      h += '<p class="muted small">' + items.length + " of " + O.OBJ.length + " shown.</p>";
      h += items.map(function (o) { return '<div class="result"><div class="result-h"><h3>' + esc(o.q) + '</h3><span class="tag">' + esc(o.cat) + '</span></div><p class="muted small" style="margin:0 0 6px"><b>Usually means:</b> ' + esc(o.means) + '</p><pre>' + esc(o.reply) + '</pre><p class="small" style="margin:8px 0 0"><b>Ask:</b> ' + esc(o.ask) + '</p><div class="row no-print" style="margin-top:8px"><button type="button" class="btn sm" data-copy="' + O.OBJ.indexOf(o) + '">Copy reply</button></div></div>'; }).join("");
      root.innerHTML = h;
      var qi = $("#oq", root); qi.addEventListener("input", function () { q = qi.value.toLowerCase(); var pos = qi.selectionStart; draw(); var n = $("#oq", root); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
    }
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-cat]"); if (c) { cat = c.getAttribute("data-cat"); draw(); return; }
      var cp = e.target.closest("[data-copy]"); if (cp) { O.ui.copy(O.OBJ[+cp.getAttribute("data-copy")].reply); return; }
      var a = e.target.closest("[data-act]"); if (!a) return; var k = a.getAttribute("data-act");
      if (k === "drill") { var p = list(); if (!p.length) p = O.OBJ; drill = p[Math.floor(Math.random() * p.length)]; reveal = false; draw(); }
      if (k === "reveal") { reveal = !reveal; draw(); }
      if (k === "stop") { drill = null; draw(); }
    });
    draw();
  });

  /* ---------- Deal qualifier: the course's own models, lesson 7.2 before booking and lesson 9.3 before the price ---------- */
  var QM = {
    book: { l: "Before booking (lesson 7.2)", must: ["pain", "desire"], a: [
      ["situation", "Situation", "Do you know how they handle it today?", "How are you handling this right now?"],
      ["pain", "Pain and impact", "Do you know how often it happens and what it costs?", "Roughly how often does that happen in a busy week? What's a typical customer worth to you?"],
      ["desire", "Desire", "Have they said they want it fixed?", "Is that something you'd like to fix, or is it just part of the business?"],
      ["support", "Support", "Do you know who else has a say?", "Who else would weigh in on something like this?"],
      ["timing", "Timing", "Do you know when they'd want it working?", "If it made sense, when would you want it running?"]] },
    price: { l: "Before the price (lesson 9.3)", must: ["pain", "desire", "support"], a: [
      ["pain", "Pain", "Have they described the problem in their own words?", "What has this cost you so far?"],
      ["doubt", "Doubt", "Do you know what they tried before, and why it failed?", "Why do you think it didn't work last time?"],
      ["inaction", "Cost of doing nothing", "Have they said what happens if nothing changes?", "What happens if nothing changes in the next few months?"],
      ["desire", "Desire", "Have they said what would be different if it were fixed?", "If this were fixed, what would be different for you?"],
      ["money", "Money", "Do you know they can and will spend to fix it?", "Have you put money into fixing this before?"],
      ["support", "Support", "Is everyone who decides on board?", "Who else has a say, and how do they feel about it?"],
      ["trust", "Trust", "Do they believe you can do it?", "What would you need to see to feel sure this would work?"]] }
  };
  tool("qualifier", "Deal qualifier", "Check a deal against the course's own questions: five areas before you book (lesson 7.2) and the seven buying beliefs before you give a price (lesson 9.3). Unknowns become your next questions. Keep several deals in one place.", ["7.2", "9.3"], function (root) {
    var S = load("qualifier", { deals: null, sel: 0 }), save = saver("qualifier", S);
    if (!Array.isArray(S.deals) || !S.deals.length) S.deals = [{ name: S.deal || "", mode: "book", v: {}, n: {} }];
    function D() { return S.deals[S.sel] || S.deals[0]; }
    function draw() {
      var d = D(); if (!QM[d.mode]) d.mode = "book"; var M = QM[d.mode], score = 0, unk = [];
      M.a.forEach(function (a) { var x = +d.v[a[0]] || 0; score += x; if (x < 2) unk.push(a); });
      var miss = M.must.filter(function (k) { return (+d.v[k] || 0) < 2; }).map(function (k) { return M.a.filter(function (a) { return a[0] === k; })[0][1].toLowerCase(); });
      var h = '<div class="panel"><div class="row between" style="align-items:flex-end"><div class="field" style="max-width:360px;margin:0"><label for="dsel">Deal</label><select id="dsel">' + S.deals.map(function (x, i) { return '<option value="' + i + '"' + (i === S.sel ? " selected" : "") + ">" + esc(x.name || "Deal " + (i + 1)) + "</option>"; }).join("") + '</select></div><div class="row"><button type="button" class="btn sm" data-act="new">New deal</button>' + (S.deals.length > 1 ? '<button type="button" class="btn sm danger" data-act="del">Delete this deal</button>' : "") + '</div></div><div class="field" style="max-width:420px;margin:14px 0 10px"><label for="dn">Deal name</label><input id="dn" value="' + esc(d.name) + '" placeholder="Sarah, Bright Smile Dental"></div>' +
        '<div class="filters" role="group" aria-label="Stage">' + Object.keys(QM).map(function (k) { return '<button type="button" data-mode="' + k + '" aria-pressed="' + (k === d.mode) + '">' + QM[k].l + "</button>"; }).join("") + "</div>" +
        M.a.map(function (a) { var x = d.v[a[0]] || 0; return '<div class="score-row" style="align-items:flex-start"><span><b>' + a[1] + '</b><br><span class="muted small">' + a[2] + '</span><br><input data-n="' + a[0] + '" value="' + esc(d.n[a[0]] || "") + '" placeholder="What they said, in their words" aria-label="Notes for ' + a[1] + '" style="margin-top:6px"></span><select data-v="' + a[0] + '" aria-label="' + a[1] + ' status"><option value="0"' + (x === 0 ? " selected" : "") + '>Unknown</option><option value="1"' + (x === 1 ? " selected" : "") + '>Partly</option><option value="2"' + (x === 2 ? " selected" : "") + ">They said it</option></select></div>"; }).join("") +
        '<div class="kpis">' + kpi(score + " / " + M.a.length * 2, "deal clarity", score >= M.a.length * 2 - 2 ? "up" : score <= M.a.length ? "down" : "") + kpi(String(unk.length), "still to confirm", unk.length ? "down" : "up") + "</div></div>";
      h += '<div class="panel"><h2>' + (miss.length ? "Not ready yet" : d.mode === "book" ? "Worth booking" : "Ready for the price") + "</h2><p>" + (miss.length ? "Still missing: <b>" + esc(miss.join(", ")) + "</b>. A deal without these is a hope, not a deal." : d.mode === "book" ? "They have the problem and want it fixed. Book the meeting, with everyone who decides." : "Pain, desire and support are in place. Present the fix in their words, then say the price once.") + "</p>" + (unk.length ? "<h3>Ask next</h3><ul>" + unk.map(function (a) { return "<li><b>" + a[1] + ":</b> " + esc(a[3]) + "</li>"; }).join("") + "</ul>" : "") + (d.mode === "price" ? '<p class="muted small" style="margin:0">Bigger company with several people involved? Also find out who controls the money, how they will decide, who inside wants this, and what else they are considering (lesson 9.3).</p>' : "") + "</div>";
      root.innerHTML = h;
      $("#dn", root).addEventListener("input", function (e) { D().name = e.target.value; save(); });
      $$("[data-v]", root).forEach(function (el) { el.addEventListener("change", function () { D().v[el.getAttribute("data-v")] = +el.value; save(); draw(); }); });
      $$("[data-n]", root).forEach(function (el) { el.addEventListener("input", function () { D().n[el.getAttribute("data-n")] = el.value; save(); }); });
      $("#dsel", root).addEventListener("change", function (e) { S.sel = +e.target.value; save(); draw(); });
    }
    root.addEventListener("click", function (e) { var m = e.target.closest("[data-mode]"); if (m) { D().mode = m.getAttribute("data-mode"); save(); draw(); } });
    onAct(root, { "new": function () { S.deals.push({ name: "", mode: "book", v: {}, n: {} }); S.sel = S.deals.length - 1; save(); draw(); }, del: function () { S.deals.splice(S.sel, 1); S.sel = 0; save(); draw(); } });
    draw();
  });

  /* ---------- Discovery question builder ---------- */
  tool("discovery", "Discovery question builder", "Generate the full question sequence for your prospect: a call frame, then connect, situation, problem, desired outcome, consequence and commitment questions, plus a summary of the gap to finish. Pick your market to add its own questions.", ["8.2", "8.3", "8.4", "8.5"], function (root) {
    var S = load("discovery", { prospect: "", niche: "", topic: "", metric: "", unit: "", value: "", outcome: "" }), save = saver("discovery", S);
    if (S.topic === "calls after hours" && S.metric === "calls missed a month") { S.topic = ""; S.metric = ""; S.unit = ""; S.value = ""; S.outcome = ""; } /* clear the old plumbing defaults */
    var defs = [{ k: "prospect", l: "Prospect first name", t: "text", ph: "Sarah" }, { k: "niche", l: "Your market (adds its own questions)", t: "select", o: nicheOpts() }, { k: "topic", l: "Area to explore", t: "text", ph: "new-patient enquiries" }, { k: "metric", l: "What to measure", t: "text", ph: "enquiries that never book" }, { k: "unit", l: "What one lost sale is called", t: "text", ph: "new patient" }, { k: "value", l: "Typical value of one ($)", t: "number", ph: "1500" }, { k: "outcome", l: "Their ideal outcome", t: "text", ph: "every enquiry answered and booked" }];
    autoFill(S, { outcome: lower1(offerData().result) });
    root.innerHTML = '<div class="panel"><h2>Setup</h2>' + leadPick(S) + fieldsHtml(defs, S) + '</div><div id="out"></div><div id="dn"></div>';
    /* notes taken on the call, kept per lead, which fill in the proposal */
    function notes() { S.notes = S.notes || {}; var k = S.leadId || "_"; S.notes[k] = S.notes[k] || { problem: "", cost: "", outcome: "" }; return S.notes[k]; }
    function notesDraw() {
      var nt = notes(), r = O.leads.get(S.leadId);
      $("#dn", root).innerHTML = '<div class="panel no-print"><h2>Your notes from the call</h2><p class="muted small">Use their own words. These fill in the proposal' + (r ? " for " + esc(r.n) : "") + '.</p><div class="fields"><div class="field wide"><label for="dn_problem">The problem, in their words</label><textarea id="dn_problem" rows="3">' + esc(nt.problem) + '</textarea></div><div class="field wide"><label for="dn_cost">What it costs them, using their number</label><input id="dn_cost" value="' + esc(nt.cost) + '"></div><div class="field wide"><label for="dn_outcome">What they want instead</label><input id="dn_outcome" value="' + esc(nt.outcome) + '"></div></div>' + actions([{ id: "toprop", t: "Build the proposal from these notes", c: "primary" }]) + "</div>";
    }
    root.addEventListener("input", function (e) { var m = { dn_problem: "problem", dn_cost: "cost", dn_outcome: "outcome" }[e.target.id]; if (m) { notes()[m] = e.target.value; save(); } });
    function calc() {
      var t = S.topic || "this area", m = S.metric || "the number", u = S.unit || "customer", p = S.prospect || "there", oc = S.outcome || "that was fixed", val = S.value > 0 ? "$" + fmt(S.value) : "[value]", n = niche(S.niche);
      var G = [["Frame the call", ["Thanks for making time, " + p + ". We've got about 30 minutes. I'd like to ask some questions about " + t + ", and you can ask me anything. If it looks like we can help, I'll show you how and what it costs. If not, I'll tell you. Either way, at the end you can tell me yes, no, or it's not for you. Is that fair?"]],
        ["Connect", ["What made you want to take a look at this?", "What's been going on with " + t + " lately?"]],
        ["Situation (keep it short)", ["Walk me through how " + t + " works today.", "Who handles it, and what do they use?"]],
        ["Problem", ["How's that working for you?", "What's not working about it the way you'd like?", "How long has it been like that?", "What have you tried, and why didn't that work?", "Roughly how many " + m + "?", "What is one " + u + " worth to you? About " + val + ", or more?"].concat(n ? n.ask : [])],
        ["Desired outcome", ["If " + oc + ", what would be different for you?", "Why is that important to you, personally?"]],
        ["Consequences", ["What happens if this is still the same in six months?", "How long can it keep going like this?"]],
        ["Commitment", ["Is this something you want to fix, or is it just part of running the business?", "How important is it to fix it now, rather than later?", "What's stopped you fixing it before now?"]],
        ["Say the gap back", ["So today " + m + " cost you about " + val + " each, and you want " + oc + ". Did I get that right?"]]];
      $("#out", root).innerHTML = G.map(function (g) { return '<div class="result"><div class="result-h"><h3>' + esc(g[0]) + '</h3></div><ul style="margin:0">' + g[1].map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + "</ul></div>"; }).join("") + actions([{ id: "copy", t: "Copy all", c: "primary" }, { id: "print", t: "Print" }]);
      root._t = G.map(function (g) { return g[0].toUpperCase() + "\n" + g[1].map(function (q) { return "- " + q; }).join("\n"); }).join("\n\n");
    }
    bind(root, defs, S, save, calc); calc();
    notesDraw();
    onLeadPick(root, S, save, function (r) { S.prospect = firstName(r); syncInputs(root, S); calc(); notesDraw(); });
    onAct(root, { copy: function () { O.ui.copy(root._t); }, print: function () { O.ui.printEl($("#out", root)); }, toprop: function () {
      var nt = notes(), r = O.leads.get(S.leadId), P = O.store.get("t_proposal", null) || {};
      if (nt.problem) P.problem = nt.problem; if (nt.cost) P.cost = nt.cost; if (nt.outcome) P.outcome = nt.outcome;
      if (r) { P.leadId = r.id; P.client = r.n; if (r.b) P.clientco = r.b; O.leads.change(r.id, function (x) { if (["New", "Contacted", "Replied", "Qualified", "Booked"].indexOf(x.st) > -1) O.leads.setStage(x, "Held"); }); }
      O.store.set("t_proposal", P); save(); location.hash = "#/t/proposal";
    } });
  });

  /* ---------- Proposal builder: a laid-out one-page document ---------- */
  tool("proposal", "Proposal builder", "A one-page, three-option proposal from your discovery notes, laid out as a proper document. Print it, save it as a PDF or download it for Word.", ["9.4", "14.5", "15.5"], function (root) {
    var S = load("proposal", { client: "", clientco: "", you: "", problem: "", cost: "", outcome: "", when: "", o1n: "Core", o1p: "", o1i: "", o2n: "Growth", o2p: "", o2i: "", o3n: "Premium", o3p: "", o3i: "", terms: "", start: "", date: "" }), save = saver("proposal", S);
    var defs = [{ k: "client", l: "Client name", t: "text" }, { k: "clientco", l: "Client business", t: "text" }, { k: "you", l: "Your name and company", t: "text" }, { k: "problem", l: "The problem, in their words", t: "textarea", w: 1 }, { k: "cost", l: "What it costs them", t: "text", w: 1, h: "Use their number, labelled as an estimate" }, { k: "outcome", l: "Outcome you will deliver", t: "text", w: 1 }, { k: "when", l: "By when", t: "text" }, { k: "o1n", l: "Option 1 name", t: "text" }, { k: "o1p", l: "Option 1 price", t: "text" }, { k: "o1i", l: "Option 1 includes (one item per line)", t: "textarea", w: 1 }, { k: "o2n", l: "Option 2 name (recommended)", t: "text" }, { k: "o2p", l: "Option 2 price", t: "text" }, { k: "o2i", l: "Option 2 includes (one item per line)", t: "textarea", w: 1 }, { k: "o3n", l: "Option 3 name", t: "text" }, { k: "o3p", l: "Option 3 price", t: "text" }, { k: "o3i", l: "Option 3 includes (one item per line)", t: "textarea", w: 1 }, { k: "terms", l: "Terms (payment, cancellation)", t: "textarea", w: 1, h: "Have your standard terms checked by a qualified professional." }, { k: "start", l: "Start date", t: "text" }, { k: "date", l: "Decision needed by", t: "text" }];
    var pm = me(); autoFill(S, { you: [pm.you, pm.company].filter(Boolean).join(", "), outcome: offerData().result });
    root.innerHTML = '<div class="panel no-print"><h2>Details</h2>' + leadPick(S) + fieldsHtml(defs, S) + "</div>" + actions([{ id: "print", t: "Print or save as PDF", c: "primary" }, { id: "doc", t: "Download for Word" }, { id: "copy", t: "Copy as text" }]) + '<article class="doc-sheet" id="pdoc"></article>';
    function v(k, ph) { return S[k] && String(S[k]).trim() ? String(S[k]).trim() : "[" + ph + "]"; }
    function lines(s) { return String(s || "").split(/\n+/).map(function (x) { return x.replace(/^[-•]\s*/, "").trim(); }).filter(Boolean); }
    function html() {
      var opt = [1, 2, 3].map(function (i) { var it = lines(S["o" + i + "i"]); return '<td class="' + (i === 2 ? "rec" : "") + '"><p class="doc-k">' + (i === 2 ? "Recommended" : "Option " + i) + "</p><h3>" + esc(v("o" + i + "n", "option name")) + '</h3><p class="doc-price">' + esc(v("o" + i + "p", "price")) + "</p><ul>" + (it.length ? it : ["[what is included]"]).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></td>"; }).join("");
      return '<header class="doc-head"><p class="doc-k">Proposal</p><h1>' + esc(v("clientco", "client business")) + '</h1><p class="muted">Prepared for ' + esc(v("client", "client name")) + " by " + esc(v("you", "your name and company")) + "</p></header>" +
        "<h2>The problem</h2><p>" + esc(v("problem", "the problem, in their words")) + "</p><h2>What it costs today</h2><p>" + esc(v("cost", "the cost")) + "</p><h2>The outcome</h2><p>" + esc(v("outcome", "the outcome")) + (S.when ? ", by " + esc(S.when) : "") + "</p>" +
        '<h2>Your options</h2><table class="doc-opts"><tr>' + opt + "</tr></table><h2>Terms</h2><p>" + esc(v("terms", "payment and cancellation terms")).replace(/\n/g, "<br>") + "</p>" +
        '<h2>Next step</h2><p>Start date: ' + esc(v("start", "start date")) + ". To go ahead, reply with the option you choose by " + esc(v("date", "date")) + " and I will hold your start date.</p><p class=\"doc-sign\">Accepted: ______________________ &nbsp; Option: ______ &nbsp; Date: __________</p>";
    }
    function text() {
      var t = ["PROPOSAL FOR " + v("clientco", "client business").toUpperCase(), "Prepared for " + v("client", "client name") + " by " + v("you", "you"), "", "The problem", v("problem", "problem"), "", "What it costs today", v("cost", "cost"), "", "The outcome", v("outcome", "outcome") + (S.when ? ", by " + S.when : ""), "", "Your options"];
      [1, 2, 3].forEach(function (i) { t.push("", i + ". " + v("o" + i + "n", "option") + (i === 2 ? " (recommended)" : "") + ": " + v("o" + i + "p", "price")); lines(S["o" + i + "i"]).forEach(function (x) { t.push("- " + x); }); });
      t.push("", "Terms", v("terms", "terms"), "", "Start date: " + v("start", "date"), "Please reply with your choice by " + v("date", "date") + " and I will hold your start date.");
      return t.join("\n");
    }
    function calc() { $("#pdoc", root).innerHTML = html(); }
    bind(root, defs, S, save, calc); calc();
    onLeadPick(root, S, save, function (r) { S.client = r.n; S.clientco = r.b || ""; var d = O.store.get("t_discovery", null), nt = d && d.notes && d.notes[r.id]; if (nt) { if (nt.problem) S.problem = nt.problem; if (nt.cost) S.cost = nt.cost; if (nt.outcome) S.outcome = nt.outcome; } syncInputs(root, S); calc(); });
    onAct(root, { copy: function () { O.ui.copy(text()); }, print: function () { O.ui.printEl($("#pdoc", root)); }, doc: function () { O.ui.downloadDoc("proposal.doc", "Proposal", html()); } });
  });

  /* ---------- Scorecard: calls, cold emails and social messages ---------- */
  var SCT = {
    call: { l: "Call", c: null },
    email: { l: "Cold email", c: [["subj", "Subject is short, plain and truthful"], ["them", "First line is about them, not me"], ["one", "One clear problem, not a list"], ["short", "Under 90 words"], ["ask", "One small, easy ask"], ["reply", "Easy to answer with a one-line reply"], ["links", "No more than one link, no images"], ["true", "Every claim is true and checkable"], ["human", "Reads like a person wrote it"], ["optout", "Opt-out line and postal address included"]] },
    dm: { l: "Social message", c: [["first", "First line is personal and true"], ["len", "Short: under about 300 characters"], ["q", "Ends with one easy question"], ["nopitch", "No pitch in the first message"], ["nolink", "No link in the first message"], ["voice", "Sounds natural read out loud"], ["fast", "Replied within a few hours"], ["new", "Each follow-up adds something new"], ["stop", "Stopped after three or four touches"], ["log", "Logged in the lead tracker"]] }
  };
  /* where to practise each habit once it is your weakest */
  var HABIT_FIX = {
    opener: ["#/drill/r-opener", "Drill: cold call opener"], reason: ["#/drill/r-whyyou", "Drill: opener built on your research"], tone: ["#/drills", "Communication drills"], talk: ["#/drill/p-whatelse", "Drill: go one level deeper"], questions: ["#/drill/r-consequence", "Drill: a consequence question"], listen: ["#/drill/p-sayback", "Drill: say back what you heard"], objection: ["#/drill/p-expensive", "Drill: “That's more than I expected”"], ask: ["#/drill/r-ask", "Drill: ask for the decision"], next: ["#/drill/p-close", "Drill: ask for the next step"], notes: ["#/t/leads", "Log it in the lead tracker"],
    subj: ["#/review", "Check it in the review tool"], them: ["#/t/leadsearch", "Find one true detail with the lead search builder"], one: ["#/review", "Check it in the review tool"], short: ["#/review", "Check it in the review tool"], reply: ["#/l/4.4", "Lesson 4.4"], links: ["#/t/emailcheck", "Cold email pre-flight checklist"], "true": ["#/l/2.9", "Lesson 2.9"], human: ["#/review", "Check it in the review tool"], optout: ["#/t/emailcheck", "Cold email pre-flight checklist"],
    first: ["#/t/leadsearch", "Find one true detail with the lead search builder"], len: ["#/review", "Check it in the review tool"], q: ["#/review", "Check it in the review tool"], nopitch: ["#/rp/dm-howmuch", "Roleplay: “How much is it?”"], nolink: ["#/review", "Check it in the review tool"], voice: ["#/drills", "Communication drills"], fast: ["#/t/replies", "Reply handler"], "new": ["#/t/messages/linkedin", "Message builder"], stop: ["#/t/cadence", "Cadence builder"], log: ["#/t/leads", "Lead tracker"]
  };
  tool("scorecard", "Scorecard", "Score a call, a cold email or a social message out of 20 against ten habits. See which habit is weakest across everything you score.", ["11.4", "3.3", "4.4", "5.3"], function (root) {
    var S = load("scorecard", { hist: [], type: "call" }), save = saver("scorecard", S), cur = {}, paste = "", aiLast = null, aiHtml = "";
    function crit(t) { return t === "call" ? O.SC.map(function (c) { return [c.key, c.label]; }) : SCT[t].c; }
    function aiPanel(C) {
      if (!O.ai.on()) return "";
      var h = '<div class="panel"><h2>Get a second opinion</h2><p class="muted small">Paste the ' + esc(SCT[S.type].l.toLowerCase()) + ' and compare your score with the AI\'s.</p><div class="field"><label for="sc-text">Paste it here</label><textarea id="sc-text" rows="6">' + esc(paste) + '</textarea></div><div class="row"><button type="button" class="btn sm" data-act="ai">Score with AI</button></div><div id="sc-ai-out"></div>' + O.ai.hint;
      return h + "</div>";
    }
    function aiResult(r) {
      var C = crit(S.type), tot = 0, gaps = 0; aiLast = r.scores;
      var rows = C.map(function (c) { var a = r.scores[c[0]] || 0, y = cur[c[0]]; tot += a; var gap = y != null && y - a >= 1; if (gap) gaps++; return '<tr class="' + (gap ? "hl" : "") + '"><td>' + esc(c[1]) + "</td><td>" + (y == null ? "-" : y) + "</td><td>" + a + '</td><td class="small">' + esc(r.notes[c[0]] || "") + "</td></tr>"; }).join("");
      return "<h3>AI score: " + tot + " / 20</h3><p>" + esc(r.summary || "") + (gaps ? " <b>You scored yourself higher on " + gaps + " habit" + (gaps === 1 ? "" : "s") + ".</b> Those are worth a closer look." : "") + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Habit</th><th>You</th><th>AI</th><th>Why</th></tr></thead><tbody>' + rows + "</tbody></table></div>" + O.ai.note();
    }
    function draw() {
      var C = crit(S.type), tot = 0, n = 0; C.forEach(function (c) { if (cur[c[0]] != null) { tot += cur[c[0]]; n++; } });
      var h = '<div class="panel"><div class="filters" role="group" aria-label="What are you scoring?">' + Object.keys(SCT).map(function (k) { return '<button type="button" data-type="' + k + '" aria-pressed="' + (k === S.type) + '">' + SCT[k].l + "</button>"; }).join("") + '</div><div class="field" style="max-width:420px;margin:12px 0 10px"><label for="cl">Label</label><input id="cl" placeholder="Sarah, Tuesday 9:10"></div>' + C.map(function (c) { return '<div class="score-row"><span>' + esc(c[1]) + '</span><select data-c="' + c[0] + '" aria-label="' + esc(c[1]) + '"><option value="">Choose</option><option value="0"' + (cur[c[0]] === 0 ? " selected" : "") + '>0 Missed</option><option value="1"' + (cur[c[0]] === 1 ? " selected" : "") + '>1 Partly</option><option value="2"' + (cur[c[0]] === 2 ? " selected" : "") + ">2 Done well</option></select></div>"; }).join("") + '<div class="kpis"><div class="kpi"><div class="v">' + tot + ' / 20</div><div class="l">' + n + ' of 10 scored</div></div></div><button type="button" class="btn primary" data-act="save"' + (n < 10 ? " disabled" : "") + ">Save this score</button></div>";
      h += aiPanel(C);
      var hist = S.hist.filter(function (x) { return (x.type || "call") === S.type; });
      if (hist.length) {
        var avg = C.map(function (c) { var s = 0; hist.forEach(function (x) { s += x.s[c[0]] || 0; }); return { c: c, a: s / hist.length }; }).sort(function (a, b) { return a.a - b.a; });
        h += '<div class="panel"><h2>Your pattern: ' + esc(SCT[S.type].l.toLowerCase()) + "s</h2><p>Weakest habit across " + hist.length + " scored: <b>" + esc(avg[0].c[1]) + "</b> (average " + f1(avg[0].a) + " of 2). Fix this one first" + (HABIT_FIX[avg[0].c[0]] ? ': <a href="' + HABIT_FIX[avg[0].c[0]][0] + '">' + esc(HABIT_FIX[avg[0].c[0]][1]) + "</a>" : "") + ".</p><div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Date</th><th>Label</th><th>Score</th><th></th></tr></thead><tbody>" + hist.slice().reverse().map(function (x) { return "<tr><td>" + esc(x.d) + "</td><td>" + esc(x.l) + "</td><td>" + x.t + " / 20" + (x.a != null ? ' <span class="muted small">(AI ' + x.a + ")</span>" : "") + '</td><td><button type="button" class="btn sm danger" data-del="' + S.hist.indexOf(x) + '">Delete</button></td></tr>'; }).join("") + "</tbody></table></div></div>";
      }
      root.innerHTML = h;
      var aiOut = $("#sc-ai-out", root); if (aiOut) aiOut.innerHTML = aiHtml;
      var stx = $("#sc-text", root); if (stx) stx.addEventListener("input", function () { paste = stx.value; });
      $$("[data-c]", root).forEach(function (el) { el.addEventListener("change", function () { cur[el.getAttribute("data-c")] = el.value === "" ? null : +el.value; var lab = $("#cl", root).value; draw(); $("#cl", root).value = lab; }); });
    }
    root.addEventListener("click", function (e) {
      var ty = e.target.closest("[data-type]"); if (ty) { S.type = ty.getAttribute("data-type"); cur = {}; aiLast = null; aiHtml = ""; paste = ""; save(); draw(); return; }
      var ab = e.target.closest("[data-act='ai']"); if (ab) { var so = $("#sc-ai-out", root); O.ai.run(ab, { mode: "score", type: S.type, text: paste, criteria: crit(S.type).map(function (c) { return { k: c[0], l: c[1] }; }) }, so, function (r) { aiHtml = aiResult(r); so.innerHTML = aiHtml; }); return; }
      var a = e.target.closest("[data-act='save']"), d = e.target.closest("[data-del]");
      if (a) { var t = 0; crit(S.type).forEach(function (c) { t += cur[c[0]] || 0; }); S.hist.push({ d: isoDate(new Date()), type: S.type, l: $("#cl", root).value || SCT[S.type].l, t: t, s: JSON.parse(JSON.stringify(cur)), a: aiLast ? Object.keys(aiLast).reduce(function (n, k) { return n + (aiLast[k] || 0); }, 0) : undefined }); if (S.hist.length > 300) S.hist = S.hist.slice(-300); cur = {}; aiLast = null; aiHtml = ""; paste = ""; save(); draw(); O.ui.toast("Score saved"); }
      if (d) { S.hist.splice(+d.getAttribute("data-del"), 1); save(); draw(); }
    });
    draw();
  });

  /* ---------- Contract and invoice kit ---------- */
  function docHtml(text) {
    /* plain document text to simple HTML: the first line is the title, short capitalised lines are headings, "1. Heading." starts a clause */
    var out = [], ls = String(text).split("\n"), first = true;
    ls.forEach(function (raw) {
      var l = raw.trim(); if (!l) return;
      if (first) { out.push("<h1>" + esc(l) + "</h1>"); first = false; return; }
      if (/^[A-Z][A-Z ]{3,}$/.test(l)) { out.push("<h2>" + esc(cap(l.toLowerCase())) + "</h2>"); return; }
      var m = /^(\d+\.\s[^.]{2,60}\.)\s(.*)$/.exec(l); if (m) { out.push("<p><b>" + esc(m[1]) + "</b> " + esc(m[2]) + "</p>"); return; }
      if (/^- /.test(l)) { out.push("<p>&bull; " + esc(l.slice(2)) + "</p>"); return; }
      if (/^[A-Z][^.:]{2,40}$/.test(l) && l.split(" ").length <= 6) { out.push("<h2>" + esc(l) + "</h2>"); return; }
      out.push("<p>" + esc(l) + "</p>");
    });
    return out.join("");
  }
  tool("contract", "Contract and invoice kit", "Fill in the details and get a plain-language service agreement, a commission agreement, a one-page scope or an invoice. Print it, save it as a PDF, or download it for Word.", ["10.4", "9.4", "15.2"], function (root) {
    var D = { doc: "service", you: "", yourco: "", client: "", clientco: "", service: "Outbound appointment setting by email, phone and social messages for the Client's business", fee: "USD 1,500 per month", term: "3", pay: "7", notice: "30", start: "", law: "", qa: "A conversation with a person who has the authority and the need to buy, who agrees to a scheduled call or meeting with the Client, and who fits the profile in the agreed target list", pct: "10", period: "12", perappt: "", invno: "001", qty: "1", rate: "1500", cur: "USD", desc: "Appointment setting, monthly retainer", bank: "" }, S = load("contract", D), save = saver("contract", S);
    if (S.service === "Outbound appointment setting by phone, email and social messages for the Client's business") S.service = D.service;
    var defs = [{ k: "doc", l: "Document", t: "select", o: [["service", "Service agreement"], ["commission", "Commission agreement (setter or closer)"], ["scope", "One-page scope of work"], ["invoice", "Invoice"]] }, { k: "you", l: "Your name", t: "text" }, { k: "yourco", l: "Your business name", t: "text" }, { k: "client", l: "Client contact name", t: "text" }, { k: "clientco", l: "Client business name", t: "text" }, { k: "service", l: "What you will do", t: "textarea", w: 1 }, { k: "fee", l: "Fee (with currency and period)", t: "text", h: "For example: USD 1,500 per month" }, { k: "term", l: "Initial term (months)", t: "text" }, { k: "pay", l: "Payment due within (days)", t: "text" }, { k: "notice", l: "Notice to end (days)", t: "text" }, { k: "start", l: "Start date", t: "text" }, { k: "law", l: "Governing law (country or US state)", t: "text", h: "Usually the client's state. Ask a lawyer if unsure." }, { k: "qa", l: "What counts as a qualified appointment", t: "textarea", w: 1 }, { k: "pct", l: "Commission (%)", t: "text", h: "Commission agreement only" }, { k: "period", l: "Commission paid for (months after the appointment)", t: "text", h: "Commission agreement only" }, { k: "perappt", l: "Price per qualified appointment (optional)", t: "text" }, { k: "invno", l: "Invoice number", t: "text" }, { k: "desc", l: "Invoice description", t: "text" }, { k: "qty", l: "Invoice quantity", t: "number" }, { k: "rate", l: "Invoice rate", t: "number" }, { k: "cur", l: "Invoice currency", t: "text" }, { k: "bank", l: "Payment instructions (invoice)", t: "textarea", w: 1, h: "For example your Payoneer or bank details, or a payment link." }];
    var cm = me(); autoFill(S, { you: cm.you, yourco: cm.company });
    root.innerHTML = '<div class="callout warn no-print"><b>Template, not legal advice</b><p>These are plain-language starting points. Laws differ by country and state. Have a qualified lawyer review the final text before you rely on it.</p></div><div class="panel no-print"><h2>Details</h2>' + leadPick(S) + fieldsHtml(defs, S) + "</div>" + actions([{ id: "print", t: "Print or save as PDF", c: "primary" }, { id: "doc", t: "Download for Word" }, { id: "copy", t: "Copy as text" }]) + '<article class="doc-sheet" id="cdoc"></article>';
    function v(k, ph) { return S[k] && String(S[k]).trim() ? String(S[k]).trim() : "[" + (ph || k) + "]"; }
    function make() {
      var d = S.doc, A = v("yourco", "your business"), B = v("clientco", "client business"), date = v("start", "start date");
      var sig = "\nSIGNED\n\n" + A + "\nName: " + v("you", "your name") + "\nSignature: ____________________   Date: __________\n\n" + B + "\nName: " + v("client", "client name") + "\nSignature: ____________________   Date: __________\n";
      if (d === "scope") return "SCOPE OF WORK\n\nProvider: " + A + "\nClient: " + B + "\nStart date: " + date + "\n\nWhat we will do\n" + v("service") + "\n\nWhat counts as a qualified appointment\n" + v("qa") + "\n\nWhat we need from the Client\n- Access to the information, accounts and approvals we agree.\n- Approval of messages within 2 working days.\n- Calendar availability for appointments we book.\n\nFee\n" + v("fee") + ". Payment due within " + v("pay") + " days of invoice.\n\nReporting\nA short weekly update: contacts made, replies, appointments booked.\n\nWhat is not included\nAnything not listed above, such as ad spend, software subscriptions the Client chooses, or closing the sale.\n\nNo guarantee\nWe do the work described. We cannot guarantee a number of appointments, sales or a particular result.\n" + sig;
      if (d === "invoice") { var tot = num(S.qty) * num(S.rate), c = String(S.cur || "").trim() ? String(S.cur).trim() + " " : ""; return "INVOICE " + v("invno") + "\n\nFrom: " + A + ", " + v("you", "your name") + "\nTo: " + B + ", attention " + v("client", "client name") + "\nDate: " + date + "\nPayment due within " + v("pay") + " days\n\nDescription: " + v("desc") + "\nQuantity: " + num(S.qty) + "\nRate: " + c + fmt(num(S.rate)) + "\nTotal due: " + c + fmt(tot) + "\n\nPayment instructions\n" + v("bank", "bank or payment details") + "\n\nThank you.\n"; }
      var common = "\n4. Client responsibilities. The Client will give accurate information, approve messages promptly, and confirm that any contact lists or consents they supply were obtained lawfully. The Provider will follow the calling, messaging and email laws that apply to the work it does.\n\n5. No guarantee. The Provider will do the work described. It does not guarantee a number of appointments, sales or any particular result.\n\n6. Confidentiality and data. Each party will keep the other's confidential information private and use it only for this agreement. Personal data is handled only as needed for the work and as the law requires.\n\n7. Ownership. Messages, scripts and lists created specifically for the Client belong to the Client once the Provider has been paid in full. The Provider keeps its own methods, templates and tools.\n\n8. Independent contractor. The Provider works as an independent contractor, not as an employee.\n\n9. Limit of liability. Except where the law does not allow it, each party's total liability under this agreement is limited to the fees paid in the three months before the claim.\n\n10. Law. This agreement is governed by the law of " + v("law", "country or state") + ".\n\n11. Whole agreement. This is the whole agreement between the parties. Changes must be in writing and signed by both.\n";
      if (d === "commission") return "COMMISSION AGREEMENT\n\nThis agreement is between " + A + " (the \"Provider\") and " + B + " (the \"Client\"), starting on " + date + ".\n\n1. Work. " + v("service") + ".\n\n2. Qualified appointment. " + v("qa") + ".\n\n3. Commission. The Client pays the Provider " + v("pct") + "% of the value actually received from each deal that comes from an appointment the Provider books, for " + v("period", "number of") + " months after the appointment." + (String(S.perappt || "").trim() ? " The Client also pays " + S.perappt + " for each qualified appointment booked, within " + v("pay") + " days of the appointment." : "") + " The Client will share a monthly sales report so commission can be checked. Commission is due within " + v("pay") + " days of the Client receiving payment.\n" + common + "\n12. Ending the agreement. Either party may end this agreement with " + v("notice") + " days' written notice. Commission stays payable on deals that come from appointments booked before the end date.\n" + sig;
      return "SERVICE AGREEMENT\n\nThis agreement is between " + A + " (the \"Provider\") and " + B + " (the \"Client\"), starting on " + date + ".\n\n1. Services. " + v("service") + ".\n\n2. Qualified appointment. Where the Provider is paid for appointments, " + v("qa") + ".\n\n3. Fees and payment. The Client pays " + v("fee") + ". Invoices are due within " + v("pay") + " days. Late amounts may stop the work until paid.\n" + common + "\n12. Term and ending. The initial term is " + v("term") + " months. After that it continues month to month. Either party may end it with " + v("notice") + " days' written notice. Fees are due for work done up to the end date.\n" + sig;
    }
    function draw() { $("#cdoc", root).innerHTML = docHtml(make()); }
    bind(root, defs, S, save, function (k) { if (k === "you") saveMe({ you: S.you }); if (k === "yourco") saveMe({ company: S.yourco }); draw(); }); draw();
    onLeadPick(root, S, save, function (r) { S.client = r.n; S.clientco = r.b || ""; syncInputs(root, S); draw(); });
    onAct(root, { copy: function () { O.ui.copy(make()); }, doc: function () { O.ui.downloadDoc("cold-manual-" + S.doc + ".doc", S.doc, docHtml(make())); }, print: function () { O.ui.printEl($("#cdoc", root)); } });
  });

  /* 25. Client delivery kit: several clients, a dated delivery timeline, templates, a weekly scoreboard and a health check */
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function nextBiz(d) { var x = new Date(d.getTime()); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; }
  tool("delivery", "Client delivery kit", "Run every client from one place: a dated delivery timeline from the sale to renewal, go-live checklists per service, 27 templates filled with the client's details, a weekly scoreboard that turns results into money, and a health check that tells you who is at risk and what to do.", ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"], function (root) {
    var DL = O.DLV || { services: [], templates: [], health: [], timeline: [] };
    if (!DL.services.length) { root.innerHTML = '<p class="muted">The delivery kit is not available right now.</p>'; return; }
    var TL = DL.timeline || [], MAXC = 25;
    function blank() { return { id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), client: "", contact: "", service: DL.services[0].id, start: isoDate(new Date()), term: 3, fee: "", value: "", kpi: "", target: "", reportDay: "Monday", channel: "email", reply: "4 working hours", h: {}, hist: [], ticks: {}, wk: [] }; }
    var S = load("delivery", { agency: "", me: "", cur: "", clients: [], tab: "setup", doc: "welcome" }), save = saver("delivery", S);
    /* move a v2.4 single-client kit into the client list */
    if (!Array.isArray(S.clients) || !S.clients.length) {
      var c0 = blank(); ["client", "contact", "service", "start", "term", "fee", "kpi", "target", "reportDay", "channel", "reply", "h"].forEach(function (k) { if (S[k] != null && S[k] !== "") c0[k] = S[k]; });
      ["client", "contact", "service", "start", "term", "fee", "kpi", "target", "reportDay", "channel", "reply", "h"].forEach(function (k) { delete S[k]; });
      S.clients = [c0]; S.cur = c0.id;
    }
    S.clients.forEach(function (c) { if (!c.h || typeof c.h !== "object") c.h = {}; if (!Array.isArray(c.hist)) c.hist = []; if (!c.ticks || typeof c.ticks !== "object") c.ticks = {}; if (!Array.isArray(c.wk)) c.wk = []; });
    function C() { return S.clients.filter(function (c) { return c.id === S.cur; })[0] || S.clients[0]; }
    if (!S.clients.some(function (c) { return c.id === S.cur; })) S.cur = S.clients[0].id;
    var meDefs = [{ k: "agency", l: "Your business name", t: "text" }, { k: "me", l: "Your name", t: "text" }];
    var defs = [
      { k: "client", l: "Client business", t: "text" }, { k: "contact", l: "Client contact (first name)", t: "text" },
      { k: "service", l: "Service", t: "select", o: DL.services.map(function (s) { return [s.id, s.label]; }) },
      { k: "start", l: "Start date", t: "text", h: "Format YYYY-MM-DD. Every date in the kit comes from this." }, { k: "term", l: "Term (months)", t: "number" },
      { k: "fee", l: "Monthly fee", t: "text", h: "For example $1,500" },
      { k: "value", l: "Value of one result ($)", t: "number", h: "For example their average job value. Turns results into money in reports." },
      { k: "kpi", l: "Main number to move", t: "text", h: "Leave empty to use the service's main number." }, { k: "target", l: "Target in 90 days", t: "text", h: "For example 15 extra booked jobs a month" },
      { k: "reportDay", l: "Weekly report day", t: "select", o: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
      { k: "channel", l: "Main channel for updates", t: "text", h: "For example email, or one WhatsApp group" }, { k: "reply", l: "Your reply time", t: "text" }
    ];
    var TABS = [["setup", "Client details"], ["time", "Timeline"], ["docs", "Templates"], ["score", "Scoreboard"], ["health", "Health check"]];
    var groups = []; DL.templates.forEach(function (t) { if (groups.indexOf(t.g) < 0) groups.push(t.g); });
    function svc(c) { c = c || C(); return DL.services.filter(function (s) { return s.id === c.service; })[0] || DL.services[0]; }
    function startOf(c) { var st = fromIso(c.start); return isNaN(st.getTime()) ? new Date() : st; }
    function endOf(c) { var end = new Date(startOf(c).getTime()); end.setMonth(end.getMonth() + (Math.max(1, Math.round(+c.term || 3)))); return addDays(end, -1); }
    function money(n) { return "$" + fmt(n); }
    function totals(c) { var s = svc(c), t = s.kpis.map(function () { return 0; }); c.wk.forEach(function (w) { (w.v || []).forEach(function (x, i) { if (i < t.length) t[i] += +x || 0; }); }); return t; }
    function valueSoFar(c) { var s = svc(c), v = +c.value || 0, t = totals(c)[s.money || 0] || 0; if (!c.wk.length || !v) return "[results] x [value of one result]"; return money(t * v) + " (" + fmt(t) + " x " + money(v) + " per " + s.unit + ")"; }
    function vars(c) {
      c = c || C(); var s = svc(c), st = startOf(c), end = endOf(c);
      function val(k, ph) { return c[k] != null && String(c[k]).trim() ? String(c[k]).trim() : "[" + ph + "]"; }
      return { agency: S.agency && S.agency.trim() ? S.agency.trim() : "[your business]", me: S.me && S.me.trim() ? S.me.trim() : "[your name]", client: val("client", "client business"), contact: val("contact", "first name"), service: s.label, unit: s.unit,
        start: nice(st), formDue: nice(addDays(st, 1)), kickoff: nice(nextBiz(addDays(st, 4))), launch: nice(nextBiz(addDays(st, 12))), d30: nice(nextBiz(addDays(st, 30))), d60: nice(nextBiz(addDays(st, 60))), d90: nice(nextBiz(addDays(st, 90))),
        endDate: nice(end), renewDate: nice(nextBiz(addDays(end, -30))), renewCall: nice(nextBiz(addDays(end, -14))), term: String(Math.max(1, Math.round(+c.term || 3))),
        fee: val("fee", "monthly fee"), value: +c.value ? money(+c.value) : "[value of one result]", kpi: c.kpi && c.kpi.trim() ? c.kpi.trim() : s.kpis[s.money || 0], target: val("target", "target"),
        reportDay: c.reportDay || "Monday", channel: val("channel", "channel"), reply: val("reply", "reply time"), firstWin: s.firstWin, valueSoFar: valueSoFar(c) };
    }
    function kpiRows(c) {
      var s = svc(c), t = totals(c), last = c.wk.length ? c.wk[c.wk.length - 1] : null, main = s.money || 0;
      return s.kpis.map(function (k, i) { return "- " + k + ": " + (last && last.v && last.v[i] !== "" && last.v[i] != null ? fmt(+last.v[i] || 0) : "[this week]") + " | " + (c.wk.length ? fmt(t[i]) : "[total]") + " | " + (i === main && c.target ? c.target : "[goal]"); }).join("\n");
    }
    function make(id, c) {
      c = c || C(); var t = DL.templates.filter(function (x) { return x.id === id; })[0] || DL.templates[0], v = vars(c), s = svc(c), b = t.body;
      if (b === "@form") b = "Onboarding form: {{client}}\nPlease answer by {{formDue}}. Short answers are fine.\n\nBusiness basics\n1. Your services, service area and hours:\n2. Average job or deal value, and your busiest season:\n\nAbout this service ({{service}})\n" + s.questions.map(function (q, i) { return (i + 3) + ". " + q; }).join("\n") + "\n\nGoal\n" + (s.questions.length + 3) + ". If we speak in 90 days and you're happy, what number changed?\n\nBrand and voice\n" + (s.questions.length + 4) + ". Words you use with customers, and words to avoid:\n\nPeople\n" + (s.questions.length + 5) + ". Who approves work, and who is our day-to-day contact?\n\nAccess\n" + (s.questions.length + 6) + ". Who will send each login, and by when?";
      else if (b === "@access") b = "Access checklist: {{client}}\nPlease send by {{formDue}} through a password manager share or another secure method. Never by plain email.\n\n" + s.access.map(function (a) { return "[ ] " + a; }).join("\n") + "\n\nOwner on your side: [name]\nOwner on our side: {{me}}";
      else if (b === "@golive") b = "Go-live checklist: {{client}} ({{service}})\nTarget go-live: {{launch}}\n\n" + s.golive.map(function (a) { return "[ ] " + a; }).join("\n") + "\n\nAlways\n[ ] Everything the client's customers will see is approved in writing\n[ ] The client knows what to expect in the first week, and who to tell if something looks wrong\n[ ] The scoreboard numbers can be counted from day one\n\nWhat usually goes wrong with this service:\n" + s.risks.map(function (r) { return "- " + r; }).join("\n");
      else if (b === "@plan") b = "30-60-90 day plan: {{client}}\nGoal: {{kpi}} to {{target}} by {{d90}}\n\nDays 1-30 (to {{d30}}): set up and first win\n- Kickoff on {{kickoff}}, access and approvals complete\n- Go live around {{launch}} after the go-live checklist\n- First win within 14 days: {{firstWin}}\n- Weekly report every {{reportDay}} from the first week\n- 30-day review on {{d30}}\n\nDays 31-60 (to {{d60}}): improve\n- Fix the weakest number on the scoreboard\n- Test one change at a time and report what it did\n- Day-60 review on {{d60}}: \"If we keep going, what would you want next?\"\n\nDays 61-90 (to {{d90}}): prove and renew\n- Push the main number toward the target\n- Show results in money: results x {{value}} per {{unit}}\n- 90-day review on {{d90}} with the plan for the next term\n\nAssumptions: [for example, 40 or more inbound calls a month]\nRisks we watch:\n" + s.risks.map(function (r) { return "- " + r; }).join("\n");
      b = b.replace("@kpis", s.kpis.map(function (k) { return "           - " + k; }).join("\n")).replace("@kpirows", kpiRows(c)).replace("@upsells", s.upsells.map(function (u) { return "- " + u; }).join("\n"));
      return fill(b, v);
    }
    function due(c, it) { var st = startOf(c); return it.end != null ? nextBiz(addDays(endOf(c), -it.end)) : it.d === 0 ? st : nextBiz(addDays(st, it.d)); }
    function timeline(c) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      return TL.map(function (it) { var d = due(c, it), done = !!c.ticks[it.k], late = !done && d.getTime() < today.getTime(), soon = !done && !late && d.getTime() - today.getTime() <= 3 * 86400000; return { it: it, d: d, done: done, late: late, soon: soon }; }).sort(function (a, b) { return a.d - b.d; });
    }
    function hScore(c) { var hs = DL.health, n = hs.filter(function (q) { return c.h[q.k] != null && c.h[q.k] !== ""; }).length, tot = hs.reduce(function (a, q) { return a + (+c.h[q.k] || 0); }, 0); return n ? Math.round(tot / (n * 2) * 100) : null; }
    function band(p) { return p == null ? null : p >= 75 ? ["Healthy", "up", "Keep the rhythm. This is a good moment to ask for a referral or a review."] : p >= 45 ? ["Watch", "", "Book a call this week. Ask what would make the next month a clear win."] : ["At risk", "down", "Call within 48 hours and use the churn-save script. Don't wait for the review."]; }

    function sumHtml() { var c = C(), late = timeline(c).filter(function (x) { return x.late; }).length, p = hScore(c), b = band(p); return S.clients.length + " client" + (S.clients.length === 1 ? "" : "s") + " · " + (late ? "<b>" + late + " overdue task" + (late === 1 ? "" : "s") + "</b>" : "nothing overdue") + " · health: " + (b ? esc(b[0]) + " (" + p + "%)" : "not checked yet"); }
    function sum() { var el = $("#dl-sum", root); if (el) el.innerHTML = sumHtml(); }
    function head() {
      var c = C();
      return '<div class="panel"><h2>Your details</h2>' + fieldsHtml(meDefs, S) + '</div><div class="panel"><div class="row between"><div class="field" style="min-width:220px;flex:1"><label for="dl-client">Client</label><select id="dl-client">' + S.clients.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === c.id ? " selected" : "") + ">" + esc(x.client || "New client") + "</option>"; }).join("") + '</select></div><div class="row no-print"><button type="button" class="btn sm primary" data-act="addc"' + (S.clients.length >= MAXC ? " disabled" : "") + '>Add client</button><button type="button" class="btn sm" data-act="delc">Remove client</button></div></div>' +
        '<p class="muted small" id="dl-sum">' + sumHtml() + '</p><div class="filters" role="tablist" aria-label="Delivery kit sections" id="dl-tabs">' + TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (S.tab === t[0]) + '" aria-selected="' + (S.tab === t[0]) + '">' + esc(t[1]) + "</button>"; }).join("") + '</div></div><div id="dl-body"></div>';
    }
    function draw() { root.innerHTML = head(); bind(root, meDefs, S, save, function () { refreshDoc(); }); body(); }
    function body() {
      var c = C(), el = $("#dl-body", root), t = S.tab;
      if (t === "setup") {
        var v = vars(c);
        el.innerHTML = '<div class="panel"><h2>Client details</h2>' + fieldsHtml(defs, c) + '</div><div class="panel"><h2>Key dates</h2><div class="tbl-wrap"><table class="tbl"><tbody>' + [["Start", v.start], ["Kickoff", v.kickoff], ["Go-live (target)", v.launch], ["30-day review", v.d30], ["Day-60 review", v.d60], ["90-day review", v.d90], ["Renewal email", v.renewDate], ["Term ends", v.endDate]].map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td><b>" + esc(r[1]) + "</b></td></tr>"; }).join("") + '</tbody></table></div><p class="muted small">Change the start date or term and every date in the timeline and templates moves with it.</p></div>';
        bind(el, defs, c, save, function () { var o = $("#dl-client", root); if (o) o.options[o.selectedIndex].textContent = c.client || "New client"; });
        Array.prototype.forEach.call(el.querySelectorAll("[data-k=start],[data-k=term]"), function (x) { x.addEventListener("change", function () { body(); }); });
      } else if (t === "time") {
        var tl = timeline(c), done = tl.filter(function (x) { return x.done; }).length, late = tl.filter(function (x) { return x.late; }), next = tl.filter(function (x) { return !x.done; })[0], gs = [];
        TL.forEach(function (it) { if (gs.indexOf(it.g) < 0) gs.push(it.g); });
        el.innerHTML = '<div class="panel"><h2>Delivery timeline for ' + esc(vars(c).client) + '</h2><div class="kpis">' + kpi(done + " of " + tl.length, "tasks done", done === tl.length ? "up" : "") + kpi(String(late.length), "overdue", late.length ? "down" : "up") + kpi(next ? nice(next.d) : "Done", next ? "next: " + next.it.t.slice(0, 48) + (next.it.t.length > 48 ? "..." : "") : "every task complete") + "</div>" +
          gs.map(function (g) { return '<div class="dl-group"><span>' + esc(g) + '</span><ul class="trk-tasks">' + tl.filter(function (x) { return x.it.g === g; }).map(function (x) { return '<li class="' + (x.done ? "on" : "") + '"><input type="checkbox" id="tk_' + x.it.k + '" data-tick="' + x.it.k + '"' + (x.done ? " checked" : "") + '><label for="tk_' + x.it.k + '">' + esc(x.it.t) + ' <span class="muted small">' + esc(nice(x.d)) + "</span>" + (x.late ? ' <span class="tag alert">Overdue</span>' : x.soon ? ' <span class="tag solid">Due soon</span>' : "") + "</label>" + (x.it.doc ? '<button type="button" class="btn sm" data-open="' + x.it.doc + '">Template</button>' : "<span></span>") + "</li>"; }).join("") + "</ul></div>"; }).join("") +
          actions([{ id: "ics", t: "Add open tasks to my calendar" }, { id: "print", t: "Print" }]) + "</div>";
      } else if (t === "docs") {
        el.innerHTML = '<div class="panel"><h2>Templates</h2><div id="dl-pick"></div><div id="dl-out"></div></div>'; pick();
      } else if (t === "score") {
        var s = svc(c), tt = totals(c), today = isoDate(new Date());
        el.innerHTML = '<div class="panel"><h2>Weekly scoreboard</h2><p class="muted">Log the numbers each week before you write the report. The weekly report, reviews and renewal email use them, and results are turned into money with the value of one result (' + esc(vars(c).value) + ' per ' + esc(s.unit) + ').</p><div class="fields"><div class="field"><label for="sw_d">Week ending</label><input id="sw_d" value="' + today + '"></div>' + s.kpis.map(function (k, i) { return '<div class="field"><label for="sw_' + i + '">' + esc(k) + '</label><input id="sw_' + i + '" type="number" step="any" inputmode="decimal"></div>'; }).join("") + "</div>" + actions([{ id: "addwk", t: "Add this week", c: "primary" }]) + "</div>" +
          (c.wk.length ? '<div class="panel"><div class="kpis">' + kpi(String(c.wk.length), "weeks logged") + kpi(fmt(tt[s.money || 0]), s.kpis[s.money || 0].toLowerCase() + " so far", "up") + kpi(+c.value ? money(tt[s.money || 0] * c.value) : "Add a value", "value so far", "up") + '</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Week ending</th>' + s.kpis.map(function (k) { return "<th>" + esc(k) + "</th>"; }).join("") + '<th></th></tr></thead><tbody>' + c.wk.map(function (w, wi) { return "<tr><td>" + esc(w.d) + "</td>" + s.kpis.map(function (k, i) { return "<td>" + (w.v && w.v[i] !== "" && w.v[i] != null ? fmt(+w.v[i] || 0) : "-") + "</td>"; }).join("") + '<td><button type="button" class="btn sm" data-delwk="' + wi + '">Remove</button></td></tr>'; }).join("") + "<tr><td><b>Total</b></td>" + tt.map(function (x) { return "<td><b>" + fmt(x) + "</b></td>"; }).join("") + "<td></td></tr></tbody></table></div>" + actions([{ id: "towk", t: "Write this week's report", c: "primary" }, { id: "csvwk", t: "Download CSV" }]) + "</div>" : '<p class="muted small">No weeks logged yet.</p>');
      } else health();
    }
    function pick() {
      var t = DL.templates.filter(function (x) { return x.id === S.doc; })[0] || DL.templates[0];
      $("#dl-pick", root).innerHTML = groups.map(function (g) { return '<div class="dl-group"><span>' + esc(g) + '</span><div class="filters" role="group" aria-label="' + esc(g) + '">' + DL.templates.filter(function (x) { return x.g === g; }).map(function (x) { return '<button type="button" data-doc="' + x.id + '" aria-pressed="' + (x.id === t.id) + '">' + esc(x.t) + "</button>"; }).join("") + "</div></div>"; }).join("");
      $("#dl-out", root).innerHTML = '<div class="result"><div class="result-h"><h3>' + esc(t.t) + '</h3><span class="tag">' + esc(t.g) + '</span></div><p class="muted small" style="margin:0 0 8px">' + esc(fill(t.use, vars())) + '</p><pre id="dl-doc"></pre>' + actions([{ id: "copy", t: "Copy", c: "primary" }, { id: "dl", t: "Download" }, { id: "pack", t: "Download the full onboarding pack" }, { id: "print", t: "Print" }]) + "</div>";
      $("#dl-doc", root).textContent = make(t.id);
    }
    function refreshDoc() { var dd = $("#dl-doc", root); if (dd) dd.textContent = make(S.doc); }
    function health() {
      var c = C(), hs = DL.health, el = $("#dl-body", root), n = hs.filter(function (q) { return c.h[q.k] != null && c.h[q.k] !== ""; }).length, pct = hScore(c), b = band(pct);
      var weak = hs.filter(function (q) { return c.h[q.k] === "0" || c.h[q.k] === "1"; }).sort(function (a, z) { return (+c.h[a.k]) - (+c.h[z.k]); });
      el.innerHTML = '<div class="panel" id="dl-health"><h2>Client health check</h2><p class="muted">Answer eight questions about <b>' + esc(vars(c).client) + '</b>. Check every client once a month and save the result, so you can see the trend.</p><div class="fields">' + hs.map(function (q) { return '<div class="field"><label for="h_' + q.k + '">' + esc(q.l) + '</label><select id="h_' + q.k + '" data-h="' + q.k + '"><option value="">Choose</option>' + q.o.map(function (o) { return '<option value="' + o[0] + '"' + (c.h[q.k] === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>"; }).join("") + "</div>" +
        (b ? '<div class="kpis">' + kpi(pct + "%", "health score (" + n + " of " + hs.length + " answered)", b[1]) + kpi(b[0], "status", b[1]) + '</div><div class="focus"><b>' + esc(b[0]) + ".</b> " + esc(b[2]) + (b[0] === "At risk" ? ' <a href="#" data-act="opensave">Open the churn-save script</a>.' : "") + "</div>" +
          (weak.length ? '<h3>What to do</h3><ul>' + weak.map(function (q) { return "<li><b>" + esc(q.l) + (c.h[q.k] === "0" ? " (act now)" : " (watch)") + ":</b> " + esc(q.a) + "</li>"; }).join("") + "</ul>" : "") + actions([{ id: "savehc", t: "Save this month's check", c: "primary" }]) : '<p class="muted small">Score appears once you answer.</p>') +
        (c.hist.length ? '<h3>History</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Score</th><th>Status</th></tr></thead><tbody>' + c.hist.slice(-12).reverse().map(function (x) { return "<tr><td>" + esc(x.d) + "</td><td>" + x.p + "%</td><td>" + esc(x.b) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "") + "</div>" +
        '<div class="panel"><h2>All clients</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Client</th><th>Health</th><th>Overdue tasks</th><th>Term ends</th></tr></thead><tbody>' + S.clients.map(function (x) { var p = hScore(x), bb = band(p), lt = timeline(x).filter(function (y) { return y.late; }).length; return "<tr><td>" + esc(x.client || "New client") + "</td><td>" + (bb ? esc(bb[0]) + " (" + p + "%)" : "-") + "</td><td>" + lt + "</td><td>" + esc(nice(endOf(x))) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    }
    function go(tab) { S.tab = tab; save(); Array.prototype.forEach.call(root.querySelectorAll("[data-tab]"), function (b) { var on = b.getAttribute("data-tab") === tab; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-selected", String(on)); }); body(); }
    function openDoc(id) { S.doc = id; save(); go("docs"); var o = $("#dl-out", root); if (o && o.scrollIntoView) o.scrollIntoView({ behavior: "smooth", block: "start" }); }

    root.addEventListener("click", function (e) {
      var tb = e.target.closest("[data-tab]"); if (tb) { go(tb.getAttribute("data-tab")); return; }
      var b = e.target.closest("[data-doc]"); if (b) { S.doc = b.getAttribute("data-doc"); save(); pick(); return; }
      var op = e.target.closest("[data-open]"); if (op) { openDoc(op.getAttribute("data-open")); return; }
      var dw = e.target.closest("[data-delwk]"); if (dw) { C().wk.splice(+dw.getAttribute("data-delwk"), 1); save(); body(); return; }
      if (e.target.closest('[data-act="opensave"]')) { e.preventDefault(); openDoc("save"); }
    });
    root.addEventListener("change", function (e) {
      var h = e.target.closest("[data-h]"); if (h) { C().h[h.getAttribute("data-h")] = h.value; save(); health(); sum(); return; }
      var tk = e.target.closest("[data-tick]"); if (tk) { var c = C(); if (tk.checked) c.ticks[tk.getAttribute("data-tick")] = isoDate(new Date()); else delete c.ticks[tk.getAttribute("data-tick")]; save(); body(); sum(); return; }
      if (e.target.id === "dl-client") { S.cur = e.target.value; save(); draw(); }
    });
    onAct(root, {
      addc: function () { if (S.clients.length >= MAXC) { O.ui.toast("Up to " + MAXC + " clients"); return; } var c = blank(); S.clients.push(c); S.cur = c.id; S.tab = "setup"; save(); draw(); var f = $("#f_client", root); if (f) f.focus(); },
      delc: function () { var c = C(); if (S.clients.length === 1) { var n = blank(); S.clients = [n]; S.cur = n.id; } else { S.clients = S.clients.filter(function (x) { return x.id !== c.id; }); S.cur = S.clients[0].id; } save(); draw(); O.ui.toast("Client removed"); },
      copy: function () { O.ui.copy(make(S.doc)); }, dl: function () { O.ui.download("delivery-" + S.doc + ".txt", make(S.doc)); }, print: function () { window.print(); },
      pack: function () { var ids = ["welcome", "form", "access", "kickoff", "comms", "plan"], sep = "\n\n" + new Array(41).join("=") + "\n\n"; O.ui.download("onboarding-pack-" + O.slug(vars().client || "client") + ".txt", ids.map(function (i) { return make(i); }).join(sep)); },
      addwk: function () { var c = C(), s = svc(c), d = ($("#sw_d", root).value || "").trim(), v = s.kpis.map(function (k, i) { var x = $("#sw_" + i, root).value; return x === "" ? "" : num(x); });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { O.ui.toast("Use the format YYYY-MM-DD"); return; } if (v.every(function (x) { return x === ""; })) { O.ui.toast("Enter at least one number"); return; }
        c.wk = c.wk.filter(function (w) { return w.d !== d; }); c.wk.push({ d: d, v: v }); c.wk.sort(function (a, b) { return a.d < b.d ? -1 : 1; }); if (c.wk.length > 60) c.wk = c.wk.slice(-60); save(); body(); O.ui.toast("Week saved"); },
      towk: function () { openDoc("weekly"); },
      csvwk: function () { var c = C(), s = svc(c); O.ui.download("scoreboard-" + O.slug(vars().client || "client") + ".csv", [["Week ending"].concat(s.kpis)].concat(c.wk.map(function (w) { return [w.d].concat(s.kpis.map(function (k, i) { return w.v && w.v[i] !== "" ? w.v[i] : ""; })); })).map(function (r) { return r.map(function (x) { x = String(x); if (/^[=+\-@]/.test(x)) x = "'" + x; return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(","); }).join("\n"), "text/csv"); },
      savehc: function () { var c = C(), p = hScore(c); if (p == null) return; var d = isoDate(new Date()); c.hist = c.hist.filter(function (x) { return x.d !== d; }); c.hist.push({ d: d, p: p, b: band(p)[0] }); if (c.hist.length > 36) c.hist = c.hist.slice(-36); save(); health(); sum(); O.ui.toast("Health check saved"); },
      ics: function () { var c = C(), nm = vars(c).client, L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Cold Manual//EN"];
        function z(x) { return x.getFullYear() + ("0" + (x.getMonth() + 1)).slice(-2) + ("0" + x.getDate()).slice(-2); }
        timeline(c).filter(function (x) { return !x.done; }).forEach(function (x, i) { var e = addDays(x.d, 1); L.push("BEGIN:VEVENT", "UID:dlv-" + c.id + "-" + x.it.k + "@coldmanual", "DTSTAMP:" + z(new Date()) + "T000000Z", "DTSTART;VALUE=DATE:" + z(x.d), "DTEND;VALUE=DATE:" + z(e), "SUMMARY:" + (nm + ": " + x.it.t).replace(/[,;\n]/g, " "), "END:VEVENT"); });
        L.push("END:VCALENDAR"); O.ui.download("delivery-" + O.slug(nm || "client") + ".ics", L.join("\r\n"), "text/calendar"); }
    });
    draw();
  });


  /* ---------- Daily outreach numbers (shown inside the 30-day plan) ---------- */
  var SPR_CH = [["dials", "Calls dialled"], ["emails", "Cold emails sent"], ["dms", "Social messages"], ["looms", "Video messages"], ["fu", "Follow-ups"]];
  var SPR_PRESET = {
    starter: { l: "Part-time starter (about 2 hours a day)", t: { dials: 25, emails: 25, dms: 10, looms: 2, fu: 10 } },
    setter: { l: "Full-time appointment setter", t: { dials: 80, emails: 40, dms: 20, looms: 5, fu: 25 } },
    agency: { l: "Agency owner doing outreach", t: { dials: 20, emails: 50, dms: 15, looms: 5, fu: 15 } },
    custom: { l: "Custom targets", t: null }
  };
  O.sprintCalc = function (S, today) {
    var st = fromIso(S.start); if (isNaN(st.getTime())) st = new Date(); st.setHours(0, 0, 0, 0);
    today = today || new Date(); var td = new Date(today.getTime()); td.setHours(0, 0, 0, 0);
    var tgt = SPR_CH.reduce(function (a, c) { return a + (+(S.t || {})[c[0]] || 0); }, 0), days = [], log = S.log || {};
    function work(d) { var w = d.getDay(); return S.days === "7" ? true : S.days === "6" ? w !== 0 : w > 0 && w < 6; }
    for (var i = 0; i < 30; i++) {
      var d = addDays(st, i), iso = isoDate(d), e = log[iso] || null, att = e ? SPR_CH.reduce(function (a, c) { return a + (+e[c[0]] || 0); }, 0) : 0, wk = work(d), past = d.getTime() <= td.getTime();
      var pct = wk && tgt ? Math.round(att / tgt * 100) : null, stt = !wk ? (att ? "extra" : "off") : !past ? "next" : d.getTime() === td.getTime() && !(pct >= 100) ? "today" : pct >= 100 ? "hit" : pct >= 70 ? "close" : "miss";
      days.push({ i: i, d: d, iso: iso, e: e, att: att, work: wk, past: past, pct: pct, st: stt });
    }
    var upto = days.filter(function (x) { return x.past; }), workUpto = upto.filter(function (x) { return x.work && (x.st !== "today" || x.e); });
    var tot = {}, tTo = {}; SPR_CH.forEach(function (c) { tot[c[0]] = 0; tTo[c[0]] = workUpto.length * (+(S.t || {})[c[0]] || 0); });
    var convos = 0, booked = 0; days.forEach(function (x) { if (!x.e) return; SPR_CH.forEach(function (c) { tot[c[0]] += +x.e[c[0]] || 0; }); convos += +x.e.convos || 0; booked += +x.e.booked || 0; });
    var attTot = SPR_CH.reduce(function (a, c) { return a + tot[c[0]]; }, 0), tgtTo = workUpto.length * tgt;
    var streak = 0; for (var j = upto.length - 1; j >= 0; j--) { var x = upto[j]; if (!x.work) continue; if (x.st === "today") continue; if (x.st === "hit") streak++; else break; }
    var dayNo = Math.min(30, Math.max(0, Math.floor((td - st) / 86400000) + 1));
    return { days: days, dayNo: dayNo, started: td >= st, ended: dayNo >= 30 && td > days[29].d, daily: tgt, tot: tot, tTo: tTo, attTot: attTot, tgtTo: tgtTo, pctTo: tgtTo ? Math.round(attTot / tgtTo * 100) : null, convos: convos, booked: booked, streak: streak, hits: workUpto.filter(function (x) { return x.st === "hit"; }).length, workTotal: days.filter(function (x) { return x.work; }).length, workUpto: workUpto.length };
  };
  O.sprintRender = function (root, opt) {
    opt = opt || {};
    var D = { start: isoDate(new Date()), preset: "starter", days: "5", t: JSON.parse(JSON.stringify(SPR_PRESET.starter.t)), log: {}, sel: "", remind: "19:00", wa: "", past: [] };
    var S = load("sprint", D), save = saver("sprint", S); if (opt.start && S.start !== opt.start) { S.start = opt.start; save(); } if (!S.log || typeof S.log !== "object") S.log = {}; if (!S.t) S.t = JSON.parse(JSON.stringify(SPR_PRESET.starter.t)); if (!Array.isArray(S.past)) S.past = [];
    root.innerHTML = '<div id="sp-setup"></div><div id="sp-head"></div><div class="panel" id="sp-log"></div><div class="panel" id="sp-grid"></div><div class="panel" id="sp-tot"></div><div class="panel" id="sp-tools"></div>';
    function today() { return isoDate(new Date()); }
    function C() { return O.sprintCalc(S); }
    function setup() {
      var open = !S.started;
      $("#sp-setup", root).innerHTML = '<details class="panel"' + (open ? " open" : "") + '><summary><b>Daily targets</b> <span class="muted small">' + esc(SPR_PRESET[S.preset] ? SPR_PRESET[S.preset].l : "Custom") + " · starts " + esc(nice(fromIso(S.start))) + '</span></summary><div class="fields" style="margin-top:14px">' +
        (opt.start ? "" : '<div class="field"><label for="sp_start">Start date</label><input id="sp_start" data-s="start" value="' + esc(S.start) + '"><div class="hint">Format YYYY-MM-DD</div></div>') +
        '<div class="field"><label for="sp_preset">Targets</label><select id="sp_preset" data-s="preset">' + Object.keys(SPR_PRESET).map(function (k) { return '<option value="' + k + '"' + (S.preset === k ? " selected" : "") + ">" + esc(SPR_PRESET[k].l) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="sp_days">Working days</label><select id="sp_days" data-s="days">' + [["5", "Monday to Friday"], ["6", "Monday to Saturday"], ["7", "Every day"]].map(function (o) { return '<option value="' + o[0] + '"' + (S.days === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>" +
        SPR_CH.map(function (c) { return '<div class="field"><label for="sp_t_' + c[0] + '">' + esc(c[1]) + ' a day</label><input id="sp_t_' + c[0] + '" type="number" min="0" inputmode="numeric" data-t="' + c[0] + '" value="' + (+S.t[c[0]] || 0) + '"></div>'; }).join("") +
        '</div><p class="muted small">Not doing a channel? Set it to 0. US business hours (9 am to 5 pm Eastern) are 7 pm to 3 am in Pakistan from November to March and 6 pm to 2 am from March to November, so most calling happens in your evening. If you joined through a team, your manager sees these numbers, not your notes.</p><div class="row"><button type="button" class="btn sm primary" data-act="go">' + (S.started ? "Save targets" : "Save my targets") + "</button></div></details>";
    }
    function head(c) {
      $("#sp-head", root).innerHTML = '<div class="kpis">' + (opt.start ? "" : kpi(c.dayNo ? "Day " + c.dayNo : "Not started", c.ended ? "finished" : c.dayNo ? "of 30" : "starts " + nice(fromIso(S.start)))) + kpi(String(c.streak), "day streak on target", c.streak >= 3 ? "up" : "") + kpi(c.pctTo == null ? "–" : c.pctTo + "%", "of target so far", c.pctTo == null ? "" : c.pctTo >= 100 ? "up" : c.pctTo < 70 ? "down" : "") + kpi(String(c.booked), "meetings booked") + "</div>";
    }
    function logForm(c) {
      var inSprint = c.days.filter(function (x) { return x.past; }).map(function (x) { return x.iso; });
      if (!S.sel || inSprint.indexOf(S.sel) < 0) S.sel = inSprint.indexOf(today()) > -1 ? today() : inSprint[inSprint.length - 1] || "";
      var el = $("#sp-log", root);
      if (!S.sel) { el.innerHTML = "<h2>Daily log</h2><p class=\"muted\">The log opens on day 1. Set up your targets above, then come back on " + esc(nice(fromIso(S.start))) + ".</p>"; return; }
      var day = c.days.filter(function (x) { return x.iso === S.sel; })[0], e = S.log[S.sel] || {};
      el.innerHTML = '<div class="row between"><h2 style="margin:0">Log for ' + esc(nice(day.d)) + (S.sel === today() ? " (today)" : "") + '</h2><label class="small">Day <select id="sp_sel" aria-label="Choose a day to log">' + inSprint.map(function (iso) { return '<option value="' + iso + '"' + (iso === S.sel ? " selected" : "") + ">" + esc(nice(fromIso(iso))) + "</option>"; }).join("") + "</select></label></div>" +
        (day.work ? "" : '<p class="muted small">This is a day off in your plan. Anything you log counts as extra.</p>') +
        '<div class="sp-rows">' + SPR_CH.map(function (c2) { var a = +e[c2[0]] || 0, t = +S.t[c2[0]] || 0; if (!t && !a) return ""; var p = t ? Math.min(100, Math.round(a / t * 100)) : 100;
          return '<div class="sp-row"><label for="sp_l_' + c2[0] + '">' + esc(c2[1]) + '</label><div class="sp-in"><button type="button" class="btn sm" data-inc="' + c2[0] + '" data-n="-1" aria-label="One less">−</button><input id="sp_l_' + c2[0] + '" type="number" min="0" inputmode="numeric" data-l="' + c2[0] + '" value="' + (a || "") + '" placeholder="0"><button type="button" class="btn sm" data-inc="' + c2[0] + '" data-n="1" aria-label="One more">+</button></div><span class="sp-of">' + (t ? "of " + t : "extra") + '</span><div class="bar"><i style="width:' + p + '%"></i></div></div>'; }).join("") + "</div>" +
        '<div class="fields" style="margin-top:12px"><div class="field"><label for="sp_l_convos">Conversations (a real person engaged)</label><input id="sp_l_convos" type="number" min="0" inputmode="numeric" data-l="convos" value="' + (+e.convos || "") + '" placeholder="0"></div><div class="field"><label for="sp_l_booked">Meetings booked</label><input id="sp_l_booked" type="number" min="0" inputmode="numeric" data-l="booked" value="' + (+e.booked || "") + '" placeholder="0"></div><div class="field wide"><label for="sp_l_note">Note: what worked, what to change tomorrow</label><input id="sp_l_note" data-l="note" value="' + esc(e.note || "") + '"></div></div>' +
        '<p class="small" id="sp-daysum"></p>';
      daySum(c);
    }
    function daySum(c) {
      var day = c.days.filter(function (x) { return x.iso === S.sel; })[0], el = $("#sp-daysum", root); if (!day || !el) return;
      var att = SPR_CH.reduce(function (a, ch) { return a + (+(S.log[S.sel] || {})[ch[0]] || 0); }, 0);
      el.innerHTML = day.work ? "<b>" + att + " of " + c.daily + "</b> touches (" + (c.daily ? Math.round(att / c.daily * 100) : 0) + "%). " + (att >= c.daily ? "Target hit. Well done." : att >= c.daily * 0.7 ? "Close. Finish with follow-ups, they are the quickest touches." : "Keep going. Do the hardest channel first.") : "<b>" + att + "</b> extra touches.";
    }
    function grid(c) {
      var lab = { hit: "Target hit", close: "70% or more", miss: "Under 70%", off: "Day off", extra: "Day off, extra work", next: "Coming up", today: "Today, not logged yet" };
      $("#sp-grid", root).innerHTML = '<h2>' + (opt.start ? "Targets hit each day" : "Your 30 days") + '</h2><div class="sp-grid" role="list">' + c.days.map(function (x) { return '<button type="button" role="listitem" class="sp-d ' + x.st + (x.iso === S.sel ? " sel" : "") + '" data-day="' + x.iso + '"' + (x.past ? "" : " disabled") + ' title="' + esc(nice(x.d) + ": " + lab[x.st] + (x.work && x.past ? " (" + x.att + " of " + c.daily + ")" : "")) + '"><b>' + (x.i + 1) + "</b><span>" + esc(x.d.toLocaleDateString("en-US", { weekday: "short" })) + "</span></button>"; }).join("") + '</div><div class="sp-key small">' + ["hit", "close", "miss", "off", "next"].map(function (k) { return '<span><i class="sp-d ' + k + '"></i>' + lab[k] + "</span>"; }).join("") + "</div>";
    }
    function totals(c) {
      var rows = SPR_CH.filter(function (ch) { return c.tTo[ch[0]] || c.tot[ch[0]]; }).map(function (ch) { var t = c.tTo[ch[0]], d = c.tot[ch[0]]; return { k: ch[0], n: ch[1], t: t, d: d, gap: t - d, p: t ? Math.round(d / t * 100) : null }; });
      var worst = rows.filter(function (r) { return r.gap > 0; }).sort(function (a, b) { return (a.p == null ? 999 : a.p) - (b.p == null ? 999 : b.p); })[0];
      var cr = c.attTot ? c.convos / c.attTot * 100 : 0, br = c.convos ? c.booked / c.convos * 100 : 0, tips = [];
      var lastWork = c.days.filter(function (x) { return x.past && x.work && x.st !== "today"; }).slice(-3);
      if (lastWork.length === 3 && lastWork.every(function (x) { return x.st === "miss"; })) tips.push("Three missed days in a row. Do not quit: cut your targets by a quarter for the next three days, hit them, then step back up.");
      if (worst) tips.push("Biggest gap: <b>" + esc(worst.n.toLowerCase()) + "</b> (" + worst.gap + " behind). Do it first tomorrow, before anything else.");
      if (c.attTot >= 150 && cr < 5) tips.push("Few conversations for the work done (" + f1(cr) + "%). Check your list quality and your openers: <a href=\"#/l/3.1\">lesson 3.1</a> and the <a href=\"#/t/leadsearch\">lead search builder</a>.");
      if (c.convos >= 20 && br < 10) tips.push("Conversations are not turning into meetings (" + f1(br) + "%). Work on the ask: <a href=\"#/l/7.3\">lesson 7.3</a> and the <a href=\"#/roleplay\">roleplay lab</a>.");
      if (!tips.length && c.workUpto) tips.push("On track. Keep the same time slot every day. Consistency beats big days.");
      $("#sp-tot", root).innerHTML = "<h2>So far</h2>" + (c.workUpto ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Channel</th><th>Target so far</th><th>Done</th><th>Gap</th><th>%</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr class="' + (worst && r.k === worst.k ? "hl" : "") + '"><td>' + esc(r.n) + "</td><td>" + fmt(r.t) + "</td><td>" + fmt(r.d) + "</td><td>" + (r.gap > 0 ? fmt(r.gap) : "–") + "</td><td>" + (r.p == null ? "–" : r.p + "%") + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<div class="kpis">' + kpi(fmt(c.attTot), "touches") + kpi(fmt(c.convos), "conversations") + kpi(c.attTot ? f1(cr) + "%" : "–", "conversation rate") + kpi(c.convos ? f1(br) + "%" : "–", "booking rate") + kpi(c.hits + "/" + c.workUpto, "days on target") + "</div>" : '<p class="muted">Totals appear after your first working day.</p>') +
        (tips.length ? '<div class="focus">' + tips.join("<br>") + "</div>" : "") + '<p class="muted small">Put your real rates into the <a href="#/t/funnel">funnel planner</a> to see what to improve first.</p>';
    }
    function report(c) {
      var day = c.days.filter(function (x) { return x.iso === S.sel; })[0], e = S.log[S.sel] || {}; if (!day) return "";
      return ["Outreach, day " + (day.i + 1) + " of 30 (" + nice(day.d) + ")"].concat(SPR_CH.filter(function (ch) { return +S.t[ch[0]] || +e[ch[0]]; }).map(function (ch) { return ch[1] + ": " + (+e[ch[0]] || 0) + (+S.t[ch[0]] ? " / " + S.t[ch[0]] : ""); }), ["Conversations: " + (+e.convos || 0) + ", meetings booked: " + (+e.booked || 0), "Streak: " + c.streak + " days. Sprint so far: " + (c.pctTo == null ? "–" : c.pctTo + "%") + " of target."], e.note ? ["Note: " + e.note] : []).join("\n");
    }
    function toolsPanel(c) {
      var wa = String(S.wa || "").replace(/[^0-9]/g, ""), txt = report(c), href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(txt);
      $("#sp-tools", root).innerHTML = '<h2>Stay on it</h2><div class="fields"><div class="field"><label for="sp_rem">Daily reminder time (your time)</label><input id="sp_rem" type="time" data-s="remind" value="' + esc(S.remind || "19:00") + '"></div><div class="field"><label for="sp_wa">Accountability partner on WhatsApp (optional)</label><input id="sp_wa" data-s="wa" inputmode="tel" placeholder="923001234567" value="' + esc(S.wa || "") + '"><div class="hint">Country code and number, digits only. Leave empty to choose the chat in WhatsApp.</div></div></div>' +
        '<div class="row no-print">' + (S.sel ? '<a class="btn sm primary" id="sp-wa" href="' + esc(href) + '" target="_blank" rel="noopener">Share this day on WhatsApp</a><button type="button" class="btn sm" data-act="copyday">Copy day report</button>' : "") + '<button type="button" class="btn sm" data-act="ics">Download daily reminders</button><button type="button" class="btn sm" data-act="csv">Download log (CSV)</button>' + (opt.start ? "" : '<button type="button" class="btn sm danger" data-act="new">Start a new round</button>') + '</div><p class="err small" id="sp-msg"></p>' +
        (S.past.length ? '<h3>Past rounds</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Started</th><th>Of target</th><th>Conversations</th><th>Meetings booked</th></tr></thead><tbody>' + S.past.map(function (p) { return "<tr><td>" + esc(nice(fromIso(p.start))) + "</td><td>" + (p.pct == null ? "–" : p.pct + "%") + "</td><td>" + (+p.convos || 0) + "</td><td>" + (+p.booked || 0) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "");
    }
    function all() { var c = C(); setup(); head(c); logForm(c); grid(c); totals(c); toolsPanel(c); }
    function soft() { var c = C(); head(c); grid(c); totals(c); daySum(c); var a = $("#sp-wa", root); if (a) { var wa = String(S.wa || "").replace(/[^0-9]/g, ""); a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(report(c)); } }
    var armed = false;
    root.addEventListener("input", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-l")) { var k = t.getAttribute("data-l"), e2 = S.log[S.sel] = S.log[S.sel] || {}; if (k === "note") e2.note = t.value.slice(0, 300); else e2[k] = Math.max(0, Math.round(num(t.value))); var bar = t.closest(".sp-row"); if (bar && +S.t[k]) bar.querySelector(".bar i").style.width = Math.min(100, Math.round((e2[k] || 0) / S.t[k] * 100)) + "%"; save(); soft(); }
      else if (t.hasAttribute("data-t")) { S.t[t.getAttribute("data-t")] = Math.max(0, Math.round(num(t.value))); S.preset = "custom"; var ps = $("#sp_preset", root); if (ps) ps.value = "custom"; save(); }
      else if (t.getAttribute("data-s") === "start") { if (!isNaN(fromIso(t.value).getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(t.value)) { S.start = t.value; save(); } }
      else if (t.getAttribute("data-s") === "wa" || t.getAttribute("data-s") === "remind") { S[t.getAttribute("data-s")] = t.value; save(); soft(); }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.id === "sp_sel") { S.sel = t.value; save(); all(); }
      else if (t.getAttribute("data-s") === "preset") { S.preset = t.value; if (SPR_PRESET[t.value].t) S.t = JSON.parse(JSON.stringify(SPR_PRESET[t.value].t)); save(); setup(); }
      else if (t.getAttribute("data-s") === "days") { S.days = t.value; save(); }
    });
    root.addEventListener("click", function (e) {
      var d = e.target.closest("[data-day]"); if (d && !d.disabled) { S.sel = d.getAttribute("data-day"); save(); all(); var lg = $("#sp-log", root); if (lg && lg.scrollIntoView) lg.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      var b = e.target.closest("[data-inc]"); if (b) { var k = b.getAttribute("data-inc"), e2 = S.log[S.sel] = S.log[S.sel] || {}; e2[k] = Math.max(0, (+e2[k] || 0) + (+b.getAttribute("data-n"))); var inp = $("#sp_l_" + k, root); if (inp) inp.value = e2[k] || ""; var bar = b.closest(".sp-row"); if (bar && +S.t[k]) bar.querySelector(".bar i").style.width = Math.min(100, Math.round(e2[k] / S.t[k] * 100)) + "%"; save(); soft(); }
    });
    onAct(root, {
      go: function () { S.started = true; save(); all(); O.ui.toast("Targets saved"); },
      copyday: function () { O.ui.copy(report(C())); },
      csv: function () { var c = C(), rows = [["Date", "Day", "Working day"].concat(SPR_CH.map(function (ch) { return ch[1]; }), ["Conversations", "Meetings booked", "Note"])]; c.days.forEach(function (x) { var e = x.e || {}; rows.push([x.iso, x.i + 1, x.work ? "yes" : "no"].concat(SPR_CH.map(function (ch) { return +e[ch[0]] || 0; }), [+e.convos || 0, +e.booked || 0, e.note || ""])); }); O.ui.download("outreach-log.csv", rows.map(function (r) { return r.map(function (v) { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n"), "text/csv"); },
      ics: function () {
        var c = C(), tm = String(S.remind || "19:00").split(":"), hh = ("0" + (+tm[0] || 0)).slice(-2), mm = ("0" + (+tm[1] || 0)).slice(-2), L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Cold Manual//Sprint//EN"];
        function z(x) { return x.getFullYear() + ("0" + (x.getMonth() + 1)).slice(-2) + ("0" + x.getDate()).slice(-2); }
        c.days.filter(function (x) { return x.work && x.d >= new Date(new Date().setHours(0, 0, 0, 0)); }).forEach(function (x) { L.push("BEGIN:VEVENT", "UID:tcm-day-" + z(x.d) + "@thecoldmanual", "DTSTAMP:" + z(new Date()) + "T000000Z", "DTSTART:" + z(x.d) + "T" + hh + mm + "00", "DURATION:PT30M", "SUMMARY:Outreach day " + (x.i + 1) + ": " + c.daily + " touches", "DESCRIPTION:" + SPR_CH.filter(function (ch) { return +S.t[ch[0]]; }).map(function (ch) { return ch[1] + " " + S.t[ch[0]]; }).join(" / ") + ". Log it in The Cold Manual.", "BEGIN:VALARM", "TRIGGER:-PT0M", "ACTION:DISPLAY", "DESCRIPTION:Outreach block", "END:VALARM", "END:VEVENT"); });
        L.push("END:VCALENDAR"); if (L.length < 5) { $("#sp-msg", root).textContent = "No working days left in this plan."; return; } O.ui.download("outreach-reminders.ics", L.join("\r\n"), "text/calendar");
      },
      new: function (b) {
        if (!armed) { armed = true; b.textContent = "Click again to start a new sprint"; $("#sp-msg", root).textContent = "Your current round is kept as a summary under Past rounds."; return; }
        var c = C(); if (Object.keys(S.log).length) { S.past.unshift({ start: S.start, pct: c.pctTo, convos: c.convos, booked: c.booked }); S.past = S.past.slice(0, 6); }
        S.log = {}; S.start = today(); S.sel = ""; S.started = false; armed = false; save(); all(); O.ui.toast("New round ready");
      }
    });
    all();
  };
})(window.OSI);

;
/* ---- extras.js ---- */
/* The Cold Manual: practice lab (roleplay, review) and library (niche packs, prompts). Views are registered on OSI.views. */
(function (O) {
  var esc = O.esc, V = O.views = {}, CP = [];
  function cp(t) { CP.push(t); return CP.length - 1; }
  function copyBtn(t, label) { return '<button type="button" class="btn sm" data-cp="' + cp(t) + '">' + esc(label || "Copy") + "</button>"; }
  function bindCopy() { var m = document.getElementById("main"); if (!m) return; m.addEventListener("click", function (e) { var b = e.target.closest("[data-cp]"); if (b) O.ui.copy(CP[+b.getAttribute("data-cp")]); }); }
  function words(t) { return (String(t).match(/\S+/g) || []).length; }
  function lessonLink(id) { var l = O.byId(id); return l ? '<a href="#/l/' + id + '">' + id + " " + esc(l.t) + "</a>" : ""; }

  /* ================= ROLEPLAY LAB ================= */
  function rpStore() { return O.store.get("rp", {}); }
  V.roleplay = function () {
    document.title = "Roleplay lab | The Cold Manual";
    var st = rpStore();
    var rows = O.RP.map(function (s) {
      var r = st[s.id], best = r ? '<span class="tag">Best ' + r.best + "%</span>" : "";
      return '<a class="prow" href="#/rp/' + s.id + '"><b>' + esc(s.title) + " " + best + "</b><span>" + esc(s.channel) + " · " + esc(s.level) + ". " + esc(s.goal) + "</span></a>";
    }).join("");
    var ai = O.ai.on() ? '<div class="callout"><b>AI practice is on</b><p>Open any scenario and choose "Practise this scenario with AI" to talk to the prospect in your own words.</p></div>' : "";
    return { html: '<div class="page-head"><h1>Roleplay lab</h1><p>Six live situations. Read the prospect, choose your reply, and see why each option works or fails. Your score shows which skill to fix first.</p></div>' + ai + '<div class="lrows">' + rows + '</div><p class="muted small">The built-in scenarios use scripted answers and scoring written for this course. They do not use AI.</p>', route: "roleplay" };
  };

  function shuffle(a) { var r = a.slice(), i, j, t; for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; } return r; }

  V.rp = function (seg) {
    var s = O.RP.filter(function (x) { return x.id === seg[0]; })[0];
    if (!s) return null;
    document.title = s.title + " | The Cold Manual";
    return {
      html: '<div class="page-head"><h1>' + esc(s.title) + "</h1><p>" + esc(s.setting) + " <b>Goal:</b> " + esc(s.goal) + '</p></div><div id="rp-root"></div>',
      route: "rp/" + s.id, crumbs: '<a href="#/roleplay">Roleplay lab</a> / ' + esc(s.title),
      after: function () { runRp(s, document.getElementById("rp-root")); }
    };
  };

  function runRp(s, root) {
    var step = 0, picks = [], orders = s.beats.map(function (b) { return shuffle(b.opts.map(function (_, i) { return i; })); }), answered = false;
    function transcript() {
      var h = "";
      for (var i = 0; i < step; i++) {
        var o = s.beats[i].opts[picks[i]];
        h += '<div class="rp-line them"><span>Prospect</span><p>' + esc(s.beats[i].p) + '</p></div><div class="rp-line me"><span>You</span><p>' + esc(o.t) + "</p></div>";
      }
      return h;
    }
    function draw() {
      var b = s.beats[step], h = '<div class="panel rp-persona"><b>Who you are talking to</b><p>' + esc(s.persona) + "</p></div>";
      h += '<div class="rp-thread" aria-live="polite">' + transcript() + '<div class="rp-line them"><span>Prospect</span><p>' + esc(b.p) + "</p></div></div>";
      h += '<p class="muted small">Beat ' + (step + 1) + " of " + s.beats.length + ". Say your reply out loud, then choose the closest option.</p><div id=\"rp-opts\">";
      orders[step].forEach(function (i) { h += '<button type="button" class="opt" data-i="' + i + '">' + esc(b.opts[i].t) + "</button>"; });
      h += '</div><div id="rp-fb"></div>';
      root.innerHTML = h; answered = false;
      if (O.ai.on()) root.innerHTML += '<p class="small"><a href="#/rpai/' + s.id + '">Practise this scenario with AI instead</a></p>';
    }
    function showFeedback(i) {
      var b = s.beats[step], o = b.opts[i], btns = root.querySelectorAll(".opt");
      Array.prototype.forEach.call(btns, function (el) {
        var k = +el.getAttribute("data-i"); el.disabled = true;
        if (b.opts[k].s === 2) el.className += " ok"; else if (k === i) el.className += " no";
      });
      var label = o.s === 2 ? "Strong" : o.s === 1 ? "Okay" : "Weak";
      var best = b.opts.filter(function (x) { return x.s === 2; })[0];
      var h = '<div class="why-box"><b>' + label + " · " + esc(o.tag) + ".</b> " + esc(o.fb);
      if (o.s < 2) h += "<br><b>Stronger:</b> " + esc(best.t) + " <i>(" + esc(best.fb) + ")</i>";
      h += '</div><div class="row" style="margin-top:12px"><button type="button" class="btn" id="rp-next">' + (step === s.beats.length - 1 ? "See my result" : "Next") + "</button></div>";
      document.getElementById("rp-fb").innerHTML = h;
      var nx = document.getElementById("rp-next"); if (nx) nx.focus();
    }
    function result() {
      var max = s.beats.length * 2, tot = 0, tags = {};
      picks.forEach(function (p, i) { var o = s.beats[i].opts[p]; tot += o.s; tags[o.tag] = tags[o.tag] || { g: 0, m: 0 }; tags[o.tag].g += o.s; tags[o.tag].m += 2; });
      var pc = Math.round(tot / max * 100), st = rpStore(), prev = st[s.id];
      var tp = {}; Object.keys(tags).forEach(function (k) { tp[k] = Math.round(tags[k].g / tags[k].m * 100); }); st[s.id] = { best: Math.max(pc, prev ? prev.best : 0), runs: (prev ? prev.runs : 0) + 1, last: pc, tags: tp }; O.store.set("rp", st);
      var weak = Object.keys(tags).sort(function (a, b) { return tags[a].g / tags[a].m - tags[b].g / tags[b].m; })[0];
      var verdict = pc >= 85 ? "Ready for a live call." : pc >= 60 ? "Solid. Fix the weak spots, then run it again." : "Run it again after you review the lesson below.";
      var h = '<div class="panel"><h2>Your result: ' + pc + "%</h2><p>" + verdict + "</p>";
      h += Object.keys(tags).map(function (k) { var p = Math.round(tags[k].g / tags[k].m * 100); return '<div class="bar-row"><span>' + esc(k) + '</span><div class="bar"><i style="width:' + p + '%"></i></div><b>' + p + "%</b></div>"; }).join("");
      if (weak && tags[weak].g < tags[weak].m) { var T = O.RP_TAGS[weak]; h += '<p style="margin-top:14px"><b>Weakest skill: ' + esc(weak) + ".</b> Review " + lessonLink(T.lesson) + ".</p>"; }
      h += '</div><div class="row"><button type="button" class="btn" id="rp-again">Run it again</button><a class="btn" href="#/roleplay">All scenarios</a></div>';
      root.innerHTML = '<div class="rp-thread">' + transcript() + "</div>" + h;
      document.getElementById("rp-again").addEventListener("click", function () { step = 0; picks = []; orders = s.beats.map(function (b) { return shuffle(b.opts.map(function (_, i) { return i; })); }); draw(); });
    }
    root.addEventListener("click", function (e) {
      var o = e.target.closest(".opt");
      if (o && !answered && !o.disabled) { answered = true; var i = +o.getAttribute("data-i"); picks[step] = i; showFeedback(i); return; }
      if (e.target.id === "rp-next") { step++; if (step >= s.beats.length) result(); else draw(); }
    });
    draw();
  }

  /* typed AI practice. The server holds the persona: the page sends only the scenario id. */
  V.rpai = function (seg) {
    var s = O.RP.filter(function (x) { return x.id === seg[0]; })[0];
    if (!s) return null;
    document.title = "AI practice | The Cold Manual";
    if (!O.ai.on()) return { html: '<div class="page-head"><h1>AI practice</h1><p>AI practice is not switched on yet. The scripted version of this scenario works the same way.</p></div><p><a class="btn" href="#/rp/' + s.id + '">Use the scripted scenario</a></p>', route: "roleplay" };
    return {
      html: '<div class="page-head"><h1>AI practice: ' + esc(s.title) + "</h1><p>" + esc(s.setting) + " <b>Goal:</b> " + esc(s.goal) + '</p></div><div id="ai-root"></div>',
      route: "rp/" + s.id, crumbs: '<a href="#/roleplay">Roleplay lab</a> / ' + esc(s.title),
      after: function () {
        var root = document.getElementById("ai-root"), log, busy, ended, level = O.store.get("rpai_level", "busy"), MAX = 16, result = "";
        function reset() { log = [{ role: "prospect", text: s.beats[0].p }]; busy = false; ended = false; result = ""; }
        function draw(msg) {
          root.innerHTML = '<div class="field" style="max-width:260px"><label for="ai-level">How hard</label><select id="ai-level">' + [["friendly", "Friendly"], ["busy", "Busy"], ["hostile", "Hostile"]].map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === level ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + '</select></div><div class="rp-thread" aria-live="polite">' + log.map(function (m) { return '<div class="rp-line ' + (m.role === "prospect" ? "them" : "me") + '"><span>' + (m.role === "prospect" ? "Prospect" : "You") + "</span><p>" + esc(m.text) + "</p></div>"; }).join("") + "</div>" +
            (msg ? '<p class="small" role="status">' + esc(msg) + "</p>" : "") +
            (ended ? '<p class="callout"><b>The prospect ended the conversation.</b> Score it and see why, or try again.</p>' : '<div class="field"><label for="ai-in">Your reply</label><textarea id="ai-in" rows="3"></textarea></div>') +
            '<div class="row">' + (ended ? "" : '<button type="button" class="btn" id="ai-send">Send</button>') + '<button type="button" class="btn sm" id="ai-end">End and score</button><button type="button" class="btn sm" id="ai-again">Start again</button></div><div id="ai-out">' + result + '</div><p class="muted small">Each reply counts as one AI check and goes to our AI provider. AI answers can be wrong, so treat the feedback as a second opinion.</p>';
          var sb = document.getElementById("ai-send"); if (sb) sb.addEventListener("click", send);
          document.getElementById("ai-end").addEventListener("click", end);
          document.getElementById("ai-again").addEventListener("click", function () { reset(); draw(""); });
          document.getElementById("ai-level").addEventListener("change", function (e) { level = e.target.value; O.store.set("rpai_level", level); });
        }
        function send() {
          var ta = document.getElementById("ai-in"), t = ta.value.trim(); if (!t || busy) return;
          if (log.length >= MAX) { draw("That's a long practice. End it and get your score."); return; }
          busy = true; log.push({ role: "rep", text: t }); draw("Thinking...");
          O.ai.post({ mode: "roleplay", scenario: s.id, difficulty: level, transcript: log }).then(function (r) { log.push({ role: "prospect", text: String(r.reply || "...") }); ended = !!r.ended; busy = false; draw(""); }, function (e) { busy = false; log.pop(); draw(e.message); document.getElementById("ai-in").value = t; });
        }
        function end() {
          if (busy || log.length < 3) { draw("Have at least one exchange first."); return; }
          busy = true; draw("Scoring...");
          O.ai.post({ mode: "roleplay-score", scenario: s.id, transcript: log }).then(function (r) {
            busy = false;
            var hist = O.store.get("rpai", {}), h = hist[s.id] || { runs: 0, best: 0 }; h.runs++; h.best = Math.max(h.best, r.score || 0); h.last = r.score || 0; hist[s.id] = h; O.store.set("rpai", hist);
            result = '<div class="panel"><h2>Feedback</h2><div class="kpis"><div class="kpi"><div class="v">' + (r.score || 0) + '</div><div class="l">out of 100 (your best: ' + h.best + ")</div></div></div><p>" + esc(r.summary || "No feedback returned.") + "</p>" + (r.didWell && r.didWell.length ? "<h3>What worked</h3><ul>" + r.didWell.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + (r.fixes && r.fixes.length ? "<h3>Say this instead</h3>" + r.fixes.map(function (f) { return '<div class="flag"><q>' + esc(f.quote) + "</q><p>" + esc(f.better) + "</p></div>"; }).join("") : "") + (r.tip ? '<div class="focus"><b>Next attempt:</b> ' + esc(r.tip) + "</div>" : "") + O.ai.note() + "</div>";
            draw("");
          }, function (e) { busy = false; draw(e.message); });
        }
        reset(); draw("");
      }
    };
  };

  /* ================= CALL AND EMAIL REVIEW ================= */
  var SPAM = ["free", "guarantee", "guaranteed", "act now", "limited time", "urgent", "click here", "100%", "risk-free", "winner", "$$$", "no obligation", "once in a lifetime", "buy now", "cash"];
  var BUZZ = ["revolutionary", "synergy", "cutting-edge", "cutting edge", "world-class", "game-changer", "game changer", "leverage", "best-in-class", "turnkey", "next-generation", "state-of-the-art", "disrupt"];
  var BAD_OPEN = ["hope this email finds you", "hope you're well", "hope you are well", "hope you're doing well", "i hope you", "my name is", "i wanted to reach out", "i'm reaching out", "i am reaching out", "we are a leading", "we're a leading", "allow me to introduce", "i'd like to introduce"];
  var WEAK = ["just checking in", "just following up", "sorry to bother", "sorry to disturb", "hope you're well", "touch base", "circle back", "to be honest", "if you have a minute", "pick your brain"];
  var FILLER = /\b(um+|uh+|you know|basically|actually|honestly|kind of|sort of)\b/gi;

  function item(label, status, note) { return { label: label, status: status, note: note }; }
  function firstWords(t, n) { var w = t.trim().split(/\s+/); return w.slice(0, n).join(" ") + (w.length > n ? "..." : ""); }

  function aEmail(subject, text) {
    var it = [], fl = [], low = text.toLowerCase(), w = words(text), i;
    if (w >= 40 && w <= 120) it.push(item("Length", "pass", w + " words. Short enough to read in ten seconds."));
    else if (w < 40) it.push(item("Length", "warn", w + " words. Very short; make sure there is a reason to reply."));
    else if (w <= 160) it.push(item("Length", "warn", w + " words. Aim for 50 to 100."));
    else it.push(item("Length", "fail", w + " words. Cut it in half. Nobody reads a long cold email."));
    if (subject != null && subject.trim()) {
      var sw = words(subject), sl = subject.length, caps = subject.replace(/[^A-Za-z]/g, "").length > 4 && subject === subject.toUpperCase();
      if (/^(re|fw|fwd):/i.test(subject.trim())) it.push(item("Subject line", "fail", "A fake reply or forward prefix is deceptive and may break the law. Remove it."));
      else if (caps || /!/.test(subject)) it.push(item("Subject line", "fail", "Capitals and exclamation marks look like spam. Use plain lower case."));
      else if (sw <= 6 && sl <= 50) it.push(item("Subject line", "pass", sw + " words. Short and plain."));
      else if (sw <= 9) it.push(item("Subject line", "warn", sw + " words. Under six reads better on a phone."));
      else it.push(item("Subject line", "fail", sw + " words. Too long. It will be cut off on mobile."));
    } else it.push(item("Subject line", "warn", "No subject entered. Add one to check it."));
    var openHit = BAD_OPEN.filter(function (p) { return low.slice(0, 220).indexOf(p) > -1; });
    if (openHit.length) { it.push(item("Opening", "fail", "Starts with \"" + openHit[0] + "\". Open with something about them or their problem.")); }
    else it.push(item("Opening", "pass", "No stock opening line."));
    var you = (low.match(/\b(you|your|yours|you're)\b/g) || []).length, me = (low.match(/\b(i|we|our|my|me|us|i'm|we're|i'll)\b/g) || []).length;
    if (you >= me) it.push(item("About them, not you", "pass", you + " you-words against " + me + " I/we-words."));
    else if (you >= me * 0.6) it.push(item("About them, not you", "warn", "More I/we than you (" + me + " to " + you + "). Cut the talk about your company."));
    else it.push(item("About them, not you", "fail", "Mostly about you (" + me + " I/we-words, " + you + " you-words). Rewrite around their problem."));
    var q = (text.match(/\?/g) || []).length;
    if (q === 0) it.push(item("One clear question", "fail", "No question. Finish with one easy question or next step."));
    else if (q <= 2) it.push(item("One clear question", "pass", q + (q === 1 ? " question." : " questions.") + " Clear ask."));
    else it.push(item("One clear question", "warn", q + " questions. Pick one ask."));
    var ph = text.match(/\[[^\]]{1,40}\]|\{\{[^}]+\}\}/);
    if (ph) it.push(item("Placeholders filled", "fail", "Unfilled placeholder: " + ph[0] + ". Fix before sending."));
    else it.push(item("Placeholders filled", "pass", "No leftover brackets."));
    var sp = SPAM.filter(function (x) { return low.indexOf(x) > -1; }), bz = BUZZ.filter(function (x) { return low.indexOf(x) > -1; });
    if (sp.length) it.push(item("Spam-style words", "warn", "Found: " + sp.join(", ") + "."));
    else it.push(item("Spam-style words", "pass", "None found."));
    if (bz.length) it.push(item("Buzzwords", "warn", "Found: " + bz.join(", ") + ". Say the plain thing."));
    var ex = (text.match(/!/g) || []).length;
    if (ex > 1) it.push(item("Exclamation marks", "warn", ex + " found. Keep it calm."));
    var links = (text.match(/https?:\/\/|www\./gi) || []).length;
    if (links === 0) it.push(item("Links", "pass", "No links. Good for a first email."));
    else if (links === 1) it.push(item("Links", "warn", "One link. Consider removing it from a first email."));
    else it.push(item("Links", "fail", links + " links. Remove all but one, ideally all."));
    if (/(reply stop|unsubscribe|opt out|opt-out|not hear from me|no more emails|stop emails)/.test(low)) it.push(item("Opt-out line", "pass", "There is an opt-out line."));
    else it.push(item("Opt-out line", "warn", "Add a simple opt-out line and your postal address. US law expects both (lesson 4.1)."));
    text.split("\n").forEach(function (ln) { var l = ln.toLowerCase().trim(); if (!l) return; if (BAD_OPEN.some(function (p) { return l.indexOf(p) > -1; })) fl.push([ln.trim(), "Stock opening line."]); else if (SPAM.some(function (x) { return l.indexOf(x) > -1; })) fl.push([ln.trim(), "Spam-style wording."]); else if (/\[[^\]]{1,40}\]|\{\{[^}]+\}\}/.test(ln)) fl.push([ln.trim(), "Unfilled placeholder."]); });
    return { items: it, flags: fl };
  }

  function aDm(kind, text) {
    var it = [], fl = [], low = text.toLowerCase(), n = text.trim().length, lim = kind === "connection" ? 200 : 300;
    if (n <= lim) it.push(item("Length", "pass", n + " characters (limit " + lim + ")."));
    else if (kind === "connection") it.push(item("Length", "fail", n + " characters. Connection notes are cut at about 200."));
    else if (n <= 500) it.push(item("Length", "warn", n + " characters. First messages over 300 feel like an email."));
    else it.push(item("Length", "fail", n + " characters. Too long for a first message."));
    /* words like "noticed" prove nothing on their own: look for a name or a number after the greeting */
    var says = /(saw|noticed|read|liked|loved|congrat|your (post|video|story|review|team|work|article|talk))/.test(low), named = /\d/.test(text.replace(/^\s*(hi|hello|hey)\b[^,.!\n]*[,.!\n]?/i, "")) || /[a-z,]\s+[A-Z][a-z]+/.test(text.replace(/^\s*(hi|hello|hey)\b[^,.!\n]*[,.!\n]?/i, "").replace(/\bI\b/g, ""));
    if (says && named) it.push(item("Specific to them", "pass", "Mentions something specific. Make sure it is true and fits only them."));
    else if (says) it.push(item("Specific to them", "warn", "It says you noticed something, but names nothing that fits only them. Add the real detail."));
    else it.push(item("Specific to them", "warn", "Nothing specific to them. Add one real detail you noticed."));
    if (/\?/.test(text)) it.push(item("Ends with a question", "pass", "Easy to reply to."));
    else it.push(item("Ends with a question", kind === "connection" ? "warn" : "fail", kind === "connection" ? "Fine for a note, but add a question in your first message." : "No question. Give them something easy to answer."));
    if (/https?:\/\/|www\.|\.com/.test(low)) it.push(item("No link", "fail", "Links in a first message look like spam. Remove it."));
    else it.push(item("No link", "pass", "No link."));
    if (/\b(our service|we offer|we provide|we help companies|book a (call|demo)|schedule a (call|demo)|pricing|discount|limited time|special offer)\b/.test(low)) it.push(item("No early pitch", "warn", "Reads like a pitch. Start with a question, pitch later."));
    else it.push(item("No early pitch", "pass", "No early pitch."));
    if (/hope (you('| a)re|this|all)/.test(low)) it.push(item("No filler greeting", "warn", "\"Hope you are well\" signals a template. Cut it."));
    var emo = 0; try { emo = (text.match(new RegExp("[\\u{1F300}-\\u{1FAFF}\\u2600-\\u27BF]", "gu")) || []).length; } catch (e) {}
    if (emo > 2) it.push(item("Emoji", "warn", emo + " emojis. Use none or one."));
    return { items: it, flags: fl };
  }

  function parseCall(text) {
    var turns = [], cur = null;
    text.split(/\r?\n/).forEach(function (ln) {
      var m = ln.match(/^\s*(rep|you|me|r|agent|caller|sales|setter|seller)\s*[:\-]\s*(.*)$/i), p = ln.match(/^\s*(prospect|them|p|customer|client|owner|lead|buyer)\s*[:\-]\s*(.*)$/i);
      if (m) { cur = { who: "R", t: m[2] }; turns.push(cur); }
      else if (p) { cur = { who: "P", t: p[2] }; turns.push(cur); }
      else if (cur && ln.trim()) cur.t += " " + ln.trim();
    });
    return turns;
  }

  function aCall(text) {
    var T = parseCall(text);
    if (T.filter(function (t) { return t.who === "R"; }).length < 2 || T.filter(function (t) { return t.who === "P"; }).length < 1) return { error: "Label each line with \"Rep:\" or \"Prospect:\" and include at least a few exchanges." };
    var it = [], fl = [], rw = 0, pw = 0, rq = 0, longest = 0, repText = "";
    T.forEach(function (t) { var w = words(t.t); if (t.who === "R") { rw += w; rq += (t.t.match(/\?/g) || []).length; repText += " " + t.t; if (w > longest) longest = w; if (w > 80) fl.push([firstWords(t.t, 24), "Monologue of " + w + " words. Break it up with a question."]); } else pw += w; });
    var ratio = Math.round(rw / Math.max(1, rw + pw) * 100);
    it.push(item("Talk ratio", ratio <= 45 ? "pass" : ratio <= 60 ? "warn" : "fail", "You spoke " + ratio + "% of the words. Aim for under 45%."));
    it.push(item("Questions asked", rq >= 5 ? "pass" : rq >= 2 ? "warn" : "fail", rq + " questions from you. A full call usually needs five or more."));
    it.push(item("Longest turn", longest <= 45 ? "pass" : longest <= 80 ? "warn" : "fail", "Your longest turn was " + longest + " words. Keep most turns under 40."));
    var fillers = (repText.match(FILLER) || []).length, fr = fillers / Math.max(1, rw) * 100;
    it.push(item("Filler words", fr <= 2 ? "pass" : fr <= 4 ? "warn" : "fail", fillers + " filler words (" + Math.round(fr * 10) / 10 + " per 100 words)."));
    var weak = WEAK.filter(function (x) { return repText.toLowerCase().indexOf(x) > -1; });
    if (weak.length) { it.push(item("Weak phrases", "warn", "Found: " + weak.join(", ") + ".")); T.forEach(function (t) { if (t.who === "R") WEAK.forEach(function (x) { if (t.t.toLowerCase().indexOf(x) > -1) fl.push([firstWords(t.t, 24), "Weak phrase: \"" + x + "\"."]); }); }); }
    else it.push(item("Weak phrases", "pass", "None found."));
    var OBJ = /(too expensive|expensive|price|cost|not interested|no budget|we're busy|i'm busy|too busy|send me|email me|think about|already have|already use|call me back|not now|no time|don't need|not looking)/i, ACK = /^(fair|that's fair|that makes sense|makes sense|i understand|i hear|sounds like|it sounds like|of course|understood|totally|no problem|that's reasonable|good question|appreciate|thanks|sure|okay|ok)\b/i;
    var obj = 0, acked = 0;
    T.forEach(function (t, i) { if (t.who === "P" && OBJ.test(t.t) && T[i + 1] && T[i + 1].who === "R") { obj++; var r = T[i + 1].t, qi = r.indexOf("?"), early = qi > -1 && words(r.slice(0, qi)) <= 25; if (ACK.test(r.trim()) || early) acked++; else fl.push([firstWords(r, 24), "Answered an objection (\"" + firstWords(t.t, 8) + "\") without acknowledging it first."]); } });
    if (obj === 0) it.push(item("Objection handling", "warn", "No clear objections found in this call to check."));
    else it.push(item("Objection handling", acked === obj ? "pass" : acked * 2 >= obj ? "warn" : "fail", acked + " of " + obj + " objections were acknowledged or clarified before you answered."));
    var tail = T.filter(function (t) { return t.who === "R"; }).slice(-3).map(function (t) { return t.t; }).join(" ");
    var dated = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|\bat \d|\d ?(am|pm)|o'clock)/i.test(tail);
    it.push(item("Dated next step", dated ? "pass" : "fail", dated ? "You agreed a day or time near the end." : "No day or time near the end. Always leave with a dated next step."));
    return { items: it, flags: fl.slice(0, 8), stats: { ratio: ratio } };
  }

  var EX = {
    email: { s: "Quick question about your business!!!", t: "Hi John,\n\nI hope this email finds you well. My name is Alex and I wanted to reach out because we are a leading provider of revolutionary AI solutions that guarantee more calls for plumbers.\n\nWe offer a free trial and our world-class team will leverage cutting-edge technology to grow your business. Click here: www.example.com\n\nLet me know if you are interested!\n\nAlex" },
    connection: { s: "", t: "Hi Sam, I help plumbing companies get far more leads and more booked jobs using our AI service. Would love to connect and tell you about our pricing, our free trial and a special offer for this month only." },
    message: { s: "", t: "Hi Sam, hope you're doing well! I wanted to tell you about our amazing AI service that books more jobs for plumbers. We offer great pricing and a free demo. You can book a demo here: www.example.com 🔥🚀😀" },
    call: { s: "", t: "Rep: Hi Dave, how are you doing today? Hope I'm not catching you at a bad time!\nProspect: Who is this?\nRep: It's Alex from Acme. We are a leading provider of AI call answering. Our system answers 24/7, books jobs into your calendar, sends texts, integrates with your CRM and gives you a dashboard so you can see everything that happens, and it's very affordable compared with hiring someone.\nProspect: Sounds expensive. I'm busy, send me an email.\nRep: Sure, what's your email?\nProspect: dave@example.com\nRep: Great, I'll send it over. Talk soon." }
  };

  /* Ask the manual: the written answers first. AI is only used when the member asks for it. */
  V.ask = function (seg) {
    document.title = "Ask the manual | The Cold Manual";
    return {
      html: '<div class="page-head"><h1>Ask the manual <span class="tag beta-tag">Beta</span></h1><p class="beta-note">Building this section based on feedback.</p><p>Ask anything about getting clients or using the course, in English or Roman Urdu. You get the closest written answer and where to read more.</p></div><form class="panel" id="ask-f"><div class="field"><label for="ask-q">Your question</label><textarea id="ask-q" rows="3" maxlength="500" placeholder="The client said send me info. What do I reply?"></textarea></div><div class="row"><button type="submit" class="btn primary" id="ask-go">Ask</button></div><p class="muted small" style="margin-bottom:0">Questions without an answer are saved, without your name, so we can write one. Please leave out private client details.</p></form><div id="ask-out" aria-live="polite"></div>',
      route: "ask",
      after: function () {
        var f = document.getElementById("ask-f"), ta = document.getElementById("ask-q"), out = document.getElementById("ask-out"), btn = document.getElementById("ask-go"), asked = "";
        function post(path, body) {
          return fetch("/api" + path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Requested-With": "osi" }, body: JSON.stringify(body) }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) { if (r.status === 401) window.dispatchEvent(new Event("osi-unauth")); if (!r.ok) throw new Error(j.error || "Something went wrong. Try again."); return j; });
          }, function () { throw new Error("You seem to be offline. Check your connection and try again."); });
        }
        function paras(t) { return String(t).split(/\n{2,}/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join(""); }
        function links(l) { return l && l.length ? '<h3>Read next</h3><ul class="ask-links">' + l.map(function (x) { return '<li><a href="' + esc(x[0]) + '">' + esc(x[1]) + "</a></li>"; }).join("") + "</ul>" : ""; }
        function answerHtml(m) { return '<div class="panel ask-a"><h2>' + esc(m.q) + "</h2>" + paras(m.a) + links(m.links) + '<p class="small" style="margin-bottom:0"><button type="button" class="linkish" id="ask-wrong" data-id="' + esc(m.id) + '">This didn\'t answer my question</button></p></div>'; }
        function noAnswer() {
          var h = '<div class="panel"><h2>We don\'t have this one yet</h2><p>Your question is saved, so we can write an answer. Meanwhile, <a href="#/search/' + encodeURIComponent(asked) + '">search the lessons</a>' + (O.store ? ' or <a href="#/upgrades">book a 1:1 call</a>' : "") + ".</p>";
          if (O.ai.on()) h += '<div class="row"><button type="button" class="btn" id="ask-ai">Ask AI</button></div>' + O.ai.hint;
          out.innerHTML = h + '<div id="ask-ai-out"></div></div>';
        }
        function send() {
          asked = ta.value.trim(); if (!asked) { out.innerHTML = '<p class="callout warn">Type your question first.</p>'; ta.focus(); return; }
          btn.disabled = true; btn.textContent = "Looking...";
          post("/ask", { q: asked }).then(function (r) {
            btn.disabled = false; btn.textContent = "Ask";
            if (r.status === "clear") { out.innerHTML = answerHtml(r.matches[0]); return; }
            if (r.status === "partial") {
              out.innerHTML = '<div class="panel"><h2>Is it one of these?</h2><div class="lrows">' + r.matches.map(function (m, i) { return '<button type="button" class="prow ask-pick" data-i="' + i + '"><b>' + esc(m.q) + "</b></button>"; }).join("") + '</div><p class="small" style="margin-bottom:0"><button type="button" class="linkish" id="ask-none">None of these</button></p></div>';
              out._m = r.matches; return;
            }
            noAnswer();
          }, function (e) { btn.disabled = false; btn.textContent = "Ask"; out.innerHTML = '<p class="callout warn">' + esc(e.message) + "</p>"; });
        }
        f.addEventListener("submit", function (e) { e.preventDefault(); send(); });
        out.addEventListener("click", function (e) {
          var pick = e.target.closest(".ask-pick"); if (pick) { out.innerHTML = answerHtml(out._m[+pick.getAttribute("data-i")]); return; }
          if (e.target.closest("#ask-none")) { post("/ask/miss", { q: asked, kind: "partial" }).catch(function () {}); noAnswer(); return; }
          var w = e.target.closest("#ask-wrong"); if (w) { post("/ask/miss", { q: asked, kind: "wrong", id: w.getAttribute("data-id") }).catch(function () {}); noAnswer(); return; }
          var a = e.target.closest("#ask-ai"); if (a) {
            var o = document.getElementById("ask-ai-out");
            O.ai.run(a, { mode: "ask", q: asked }, o, function (r) {
              o.innerHTML = r.offTopic ? '<p class="callout">That\'s outside what the manual covers.</p>' : '<div class="ask-a"><p class="tag">AI answer</p>' + paras(r.answer) + links(r.links) + "</div>" + O.ai.note();
            });
          }
        });
        if (seg && seg[0]) { try { ta.value = decodeURIComponent(seg.join("/")); } catch (x) { ta.value = seg.join("/"); } send(); }
      }
    };
  };

  V.review = function () {
    document.title = "Call and email review | The Cold Manual";
    return {
      html: '<div class="page-head"><h1>Call and email review</h1><p>Paste an email, a direct message or a call transcript. You get a scored checklist and the lines to fix. The checks run in your browser. Nothing is sent anywhere unless you choose the AI review.</p></div><div id="rv-root"></div>',
      route: "review",
      after: function () {
        var root = document.getElementById("rv-root"), S = O.store.get("rv", { kind: "email", subject: "", text: "" });
        root.innerHTML = '<div class="panel"><div class="fields"><div class="field"><label for="rv-kind">What are you checking?</label><select id="rv-kind"><option value="email">Cold email</option><option value="connection">Connection note (LinkedIn)</option><option value="message">First message (DM)</option><option value="call">Call transcript</option></select></div><div class="field" id="rv-sub-wrap"><label for="rv-sub">Subject line</label><input id="rv-sub" type="text"></div><div class="field wide"><label for="rv-text">Paste it here</label><textarea id="rv-text" rows="10"></textarea><div class="hint" id="rv-hint"></div></div></div><div class="row"><button type="button" class="btn" id="rv-go">Check it</button><button type="button" class="btn sm" id="rv-ex">Load a weak example</button>' + "</div></div><div id=\"rv-out\"></div>";
        var kind = document.getElementById("rv-kind"), sub = document.getElementById("rv-sub"), tx = document.getElementById("rv-text"), hint = document.getElementById("rv-hint");
        kind.value = S.kind; sub.value = S.subject; tx.value = S.text;
        function sync() { document.getElementById("rv-sub-wrap").style.display = kind.value === "email" ? "" : "none"; hint.textContent = kind.value === "call" ? "Start each line with Rep: or Prospect:. Longer calls give better checks." : kind.value === "connection" ? "About 200 characters is the limit on most accounts." : ""; }
        function save() { S = { kind: kind.value, subject: sub.value, text: tx.value }; O.store.set("rv", S); }
        function run() {
          save(); var t = tx.value.trim(), out = document.getElementById("rv-out");
          if (!t) { out.innerHTML = '<p class="callout warn">Paste some text first.</p>'; return; }
          var r = kind.value === "email" ? aEmail(sub.value, t) : kind.value === "call" ? aCall(t) : aDm(kind.value, t);
          if (r.error) { out.innerHTML = '<p class="callout warn">' + esc(r.error) + "</p>"; return; }
          var pts = 0; r.items.forEach(function (x) { pts += x.status === "pass" ? 2 : x.status === "warn" ? 1 : 0; });
          var pc = Math.round(pts / (r.items.length * 2) * 100), word = pc >= 80 ? "Strong" : pc >= 55 ? "Solid, fix the red items" : "Needs work";
          var h = '<div class="panel"><div class="kpis"><div class="kpi"><div class="v">' + pc + '%</div><div class="l">' + word + "</div></div>" + '<div class="kpi"><div class="v">' + r.items.filter(function (x) { return x.status === "fail"; }).length + '</div><div class="l">to fix</div></div></div>';
          h += '<ul class="rvl">' + r.items.map(function (x) { return '<li><span class="st ' + x.status + '">' + (x.status === "pass" ? "Pass" : x.status === "warn" ? "Check" : "Fix") + "</span><div><b>" + esc(x.label) + "</b><p>" + esc(x.note) + "</p></div></li>"; }).join("") + "</ul></div>";
          if (r.flags.length) h += '<div class="panel"><h2>Lines to look at</h2>' + r.flags.map(function (f) { return '<div class="flag"><q>' + esc(f[0]) + "</q><p>" + esc(f[1]) + "</p></div>"; }).join("") + "</div>";
          h += '<p class="muted small">These are automatic checks against the rules in the course. They cannot judge whether your offer is right for the person. Use them as a first pass, then read it out loud.</p>';
          out.innerHTML = h;
        }
        kind.addEventListener("change", function () { sync(); save(); });
        sub.addEventListener("input", save); tx.addEventListener("input", save);
        document.getElementById("rv-go").addEventListener("click", run);
        document.getElementById("rv-ex").addEventListener("click", function () { var e = EX[kind.value]; sub.value = e.s; tx.value = e.t; run(); });
        sync(); if (S.text) run();
      }
    };
  };

  /* ================= NICHE PACKS ================= */
  V.niches = function () {
    document.title = "Niche packs | The Cold Manual";
    var cats = (O.NICHE_CATS && O.NICHE_CATS.length ? O.NICHE_CATS : []).filter(function (c) { return O.NICHES.some(function (n) { return n.cat === c; }); });
    O.NICHES.forEach(function (n) { if (n.cat && cats.indexOf(n.cat) < 0) cats.push(n.cat); });
    function rows(c) { return O.NICHES.filter(function (n) { return c === "All" || n.cat === c; }).map(function (n) { return '<a class="prow" href="#/niche/' + n.id + '" data-ncat="' + esc(n.cat || "") + '"><b>' + esc(n.name) + "</b><span>" + esc(n.tag) + (n.facts && n.facts.length ? ' <em class="tag">market data</em>' : "") + "</span></a>"; }).join(""); }
    var h = '<div class="page-head"><h1>Niche packs</h1><p>' + O.NICHES.length + " markets with who to contact, the problem they feel, what to sell them, a call opener, an email, a message, answers to their usual objections and where to find leads. Open one, edit the brackets, and use it.</p></div>" +
      (cats.length ? '<div class="filters" role="group" aria-label="Filter by market" id="ncats">' + ["All"].concat(cats).map(function (c, i) { return '<button type="button" data-ncat="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="lrows" id="nrows">' + rows("All") + '</div><p class="muted small">Worked examples in the packs are illustrations. Market data is sourced and dated in each pack; always use your client\'s real figures.</p>';
    return { html: h, route: "niches", after: function () { var root = document;
      var bar = root.querySelector("#ncats"); if (!bar) return;
      bar.addEventListener("click", function (e) { var b = e.target.closest("[data-ncat]"); if (!b) return; var c = b.getAttribute("data-ncat");
        Array.prototype.forEach.call(bar.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        root.querySelector("#nrows").innerHTML = rows(c); });
    } };
  };
  V.niche = function (seg) {
    var n = O.NICHES.filter(function (x) { return x.id === seg[0]; })[0]; if (!n) return null;
    document.title = n.name + " | The Cold Manual";
    function sec(title, body) { return '<div class="panel"><h2>' + esc(title) + "</h2>" + body + "</div>"; }
    function ul(a) { return "<ul>" + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
    function pre(t, label) { return '<div class="result"><div class="result-h"><h3>' + esc(label) + "</h3>" + copyBtn(t) + "</div><pre>" + esc(t) + "</pre></div>"; }
    var h = '<div class="page-head"><h1>' + esc(n.name) + "</h1><p>" + esc(n.tag) + "</p></div>" +
      sec("Who buys and why", "<p><b>Decision maker:</b> " + esc(n.buyer) + "</p><p><b>Their problems:</b></p>" + ul(n.pain) + "<p><b>Angle:</b> " + esc(n.angle) + "</p><p><b>Worked example:</b> " + esc(n.math) + "</p><p><b>Best channels:</b> " + esc(n.channels) + "</p>") +
      (n.facts && n.facts.length ? sec("Market facts", '<ul class="nfacts">' + n.facts.map(function (f) { return "<li>" + esc(f[0]) + ' <span class="muted small">Source: ' + (f[2] ? '<a href="' + esc(f[2]) + '" target="_blank" rel="noopener noreferrer">' + esc(f[1]) + "</a>" : esc(f[1])) + "</span></li>"; }).join("") + '</ul><p class="muted small">Checked October 2026. Use these to understand the market, then ask the prospect for their own numbers.</p>') : "") +
      (n.offers && n.offers.length ? sec("What sells best here", ul(n.offers)) : "") +
      sec("Say it", pre(n.call, "Call opener") + pre(n.email, "First email") + pre(n.dm, "First message")) +
      sec("When they push back", n.obj.map(function (o) { return '<div class="result"><div class="result-h"><h3>"' + esc(o[0]) + '"</h3>' + copyBtn(o[1]) + "</div><p>" + esc(o[1]) + "</p></div>"; }).join("")) +
      sec("Discovery questions", ul(n.ask)) +
      sec("Where to find them", "<p>" + esc(n.src) + "</p><p><b>Timing:</b> " + esc(n.time) + "</p>") +
      '<div class="callout warn"><b>Watch for</b><p>' + esc(n.watch) + '</p></div><p><a class="btn sm" href="#/t/leadsearch">Open the lead search builder</a> <a class="btn sm" href="#/roleplay">Practise in the roleplay lab</a></p>';
    return { html: h, route: "niches", crumbs: '<a href="#/niches">Niche packs</a> / ' + esc(n.name), after: bindCopy };
  };

  /* ================= PROMPT LIBRARY ================= */
  V.prompts = function () {
    document.title = "Prompt library | The Cold Manual";
    var groups = {}, order = [];
    O.PROMPTS.forEach(function (p) { if (!groups[p.g]) { groups[p.g] = []; order.push(p.g); } groups[p.g].push(p); });
    var h = '<div class="page-head"><h1>Prompt library</h1><p>' + O.PROMPTS.length + " prompts to paste into any AI assistant. Replace the brackets with your real details.</p></div>";
    h += '<div class="callout"><b>Four rules</b><ul>' + O.PROMPT_RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></div>";
    order.forEach(function (g) { h += "<h2>" + esc(g) + "</h2>" + groups[g].map(function (p) { return '<div class="result"><div class="result-h"><h3>' + esc(p.t) + '</h3>' + copyBtn(p.p) + "</div><p class=\"muted small\">" + esc(p.use) + "</p><pre>" + esc(p.p) + "</pre></div>"; }).join(""); });
    return { html: h, route: "prompts", after: bindCopy };
  };

  /* ================= ENGLISH CALL DRILLS ================= */
  function drStore() { return O.store.get("dr", {}); }
  var NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
  function normWords(t) {
    return String(t || "").toLowerCase().replace(/[’']/g, "").replace(/-/g, " ").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).map(function (w) { return NUMW[w] != null ? String(NUMW[w]) : w; });
  }
  function lcs(a, b) { var m = a.length, n = b.length, prev = new Array(n + 1).fill(0), cur, i, j; for (i = 1; i <= m; i++) { cur = new Array(n + 1).fill(0); for (j = 1; j <= n; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]); prev = cur; } return prev[n]; }
  var FILLERS = ["um", "umm", "uh", "uhh", "uhm", "erm", "er", "ah", "hmm", "you know", "i mean", "basically", "actually", "literally", "sort of", "kind of"];
  function countPhrase(words, p) { var pw = p.split(" "), n = 0; for (var i = 0; i + pw.length <= words.length; i++) { var ok = true; for (var j = 0; j < pw.length; j++) if (words[i + j] !== pw[j]) { ok = false; break; } if (ok) n++; } return n; }
  /* a = { text, dur, speak, pauses, heard (speech recognition produced the text, not typed), audio } */
  O.drillAnalyse = function (d, a) {
    var words = normWords(a.text), wc = words.length, items = [], pen = 0, clarity = null, wpm = null;
    if (!wc) return { error: "Nothing to check yet. Record your answer, or type what you said." };
    if (a.audio && a.speak >= 1.5) {
      wpm = Math.round(wc / (a.speak / 60));
      var dist = wpm < 125 ? 125 - wpm : wpm > 170 ? wpm - 170 : 0, pp = Math.min(25, Math.round(dist * 0.6)); pen += pp;
      items.push(item("Pace: " + wpm + " words a minute", dist === 0 ? "pass" : dist <= 20 ? "warn" : "fail", dist === 0 ? "Clear, confident pace for a call." : wpm > 170 ? "Too fast for a first call. Slow down and pause after your reason for calling." : "A little slow. Keep the energy up and shorten the pauses inside sentences."));
    }
    var fl = []; FILLERS.forEach(function (f) { var n = countPhrase(words, f); if (n) fl.push(f + (n > 1 ? " x" + n : "")); });
    var flN = FILLERS.reduce(function (s, f) { return s + countPhrase(words, f); }, 0), fp = Math.min(25, flN * 5); pen += fp;
    items.push(item("Filler words" + (flN ? ": " + flN : ""), !flN ? "pass" : flN <= 2 ? "warn" : "fail", !flN ? "None found." + (a.heard ? " Speech recognition often drops \"um\" and \"uh\", so listen to your recording too." : "") : "Found: " + fl.join(", ") + ". Replace them with a short pause."));
    var wj = " " + words.join(" ") + " ", weak = (O.CLEAR_FLAGS || []).filter(function (f) { return wj.indexOf(" " + f[0] + " ") > -1; }), wp = Math.min(24, weak.length * 8); pen += wp;
    items.push(item("Words that confuse US owners", weak.length ? "fail" : "pass", weak.length ? weak.map(function (f) { return "\"" + f[0] + "\": " + f[1]; }).join(" ") : "None found."));
    if (a.audio) {
      var lp = Math.max(0, a.pauses - 1), pp2 = Math.min(20, lp * 4); pen += pp2;
      items.push(item("Long pauses: " + a.pauses, a.pauses <= 1 ? "pass" : a.pauses <= 3 ? "warn" : "fail", a.pauses <= 1 ? "Smooth delivery." : "Pauses over 1.2 seconds in the middle of speaking sound unsure. Practise the line until it flows. (Pauses after a question are good, so ignore this if that is where they were.)"));
      var dur = Math.round(a.dur), lp2 = dur > d.secs * 1.8 ? 20 : dur > d.secs * 1.3 ? 10 : 0; pen += lp2;
      items.push(item("Length: " + dur + " seconds", lp2 === 0 ? "pass" : lp2 === 10 ? "warn" : "fail", lp2 === 0 ? "Within the time a busy owner gives you (" + d.secs + " seconds or less is the aim)." : "Aim for " + d.secs + " seconds or less. Cut words, not the pauses."));
    }
    if (d.ask) { var tail = words.slice(-15), q = /\?\s*$/.test(String(a.text).trim()) || tail.some(function (w) { return /^(what|how|would|could|can|is|are|do|does|did|when|which|who|where|should|mind|got)$/.test(w); }); if (!q) pen += 15;
      items.push(item("Ends with a question", q ? "pass" : "fail", q ? "Good. A question hands the call back to them." : "End with a short question so the prospect talks next.")); }
    if (d.time) { var tm = words.some(function (w) { return /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|morning|afternoon|evening|am|pm|noon|oclock|\d+)$/.test(w); }); if (!tm) pen += 15;
      items.push(item("Offers a specific time", tm ? "pass" : "fail", tm ? "Good. A specific time is easier to say yes to." : "Offer a day and a time, ideally two options.")); }
    if (d.mode === "read") {
      if (a.heard) { var tw = normWords(d.line); clarity = Math.round(lcs(tw, words) / tw.length * 100);
        items.unshift(item("Clarity: " + clarity + "% of the line understood", clarity >= 90 ? "pass" : clarity >= 75 ? "warn" : "fail", clarity >= 90 ? "A US listener would follow you easily." : "Some words were not understood. Compare the line with what was heard, then work on those words and the sound tips below.")); }
      else items.unshift(item("Clarity: not measured", "warn", "Clarity is measured from live speech recognition in Chrome or Edge. Typed or edited text is not scored for clarity."));
    }
    var delivery = Math.max(0, 100 - pen), score = clarity == null ? delivery : Math.round(0.6 * delivery + 0.4 * clarity);
    return { score: score, wpm: wpm, fillers: flN, clarity: clarity, items: items };
  };
  function drMean(st) { var v = Object.keys(st).map(function (k) { return st[k] && st[k].last; }).filter(function (x) { return typeof x === "number"; }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null; }
  V.drills = function () {
    document.title = "Communication drills | The Cold Manual";
    var st = drStore(), avg = drMean(st), done = Object.keys(st).filter(function (k) { return st[k] && st[k].runs; }).length;
    var GROUPS = []; O.DRILLS.forEach(function (d) { var g = d.g || "More drills"; if (GROUPS.indexOf(g) < 0) GROUPS.push(g); });
    var ORDER = ["Opening the call", "Gatekeepers and voicemail", "Discovery questions", "Objections", "Booking and closing", "Client calls"]; GROUPS.sort(function (a, b) { return (ORDER.indexOf(a) < 0 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) < 0 ? 99 : ORDER.indexOf(b)); });
    function rows(g) { return O.DRILLS.filter(function (d) { return (d.g || "More drills") === g; }).map(function (d) { var r = st[d.id], best = r && r.best != null ? '<span class="tag">Best ' + r.best + "%</span>" : ""; return '<a class="prow" href="#/drill/' + d.id + '"><b>' + esc(d.title) + " " + best + "</b><span>" + (d.mode === "read" ? "Read it out loud. " : "Reply in your own words. ") + esc(d.sit) + "</span></a>"; }).join(""); }
    var gcount = function (g) { return O.DRILLS.filter(function (d) { return (d.g || "More drills") === g; }).length; };
    var gdone = function (g) { return O.DRILLS.filter(function (d) { return (d.g || "More drills") === g && st[d.id] && st[d.id].runs; }).length; };
    var tab = drTab(), TABS = [["drills", "Drills"], ["clear", "Words that confuse US owners"], ["sounds", "Sounds and stress"]];
    var h = '<div class="page-head"><h1>Communication drills</h1><p>' + O.DRILLS.length + ' speaking moments from real sales conversations: openers, voicemails, video intros, discovery, objections, booking and client calls. Say each one out loud and get measured on pace, filler words, pauses and, for read-aloud lines, how easily a US listener would follow you.</p></div>' +
      '<div class="kpis"><div class="kpi"><div class="v">' + (avg == null ? "–" : avg + "%") + '</div><div class="l">average score</div></div><div class="kpi"><div class="v">' + done + "/" + O.DRILLS.length + '</div><div class="l">drills tried</div></div></div>' +
      '<div class="tabs" role="tablist" aria-label="Drill sections">' + TABS.map(function (t) { return '<button type="button" role="tab" id="dt-' + t[0] + '" aria-controls="dp-' + t[0] + '" aria-selected="' + (tab === t[0]) + '" class="' + (tab === t[0] ? "on" : "") + '" data-dtab="' + t[0] + '">' + esc(t[1]) + "</button>"; }).join("") + "</div>" +
      '<div role="tabpanel" id="dp-drills" aria-labelledby="dt-drills"' + (tab === "drills" ? "" : " hidden") + '>' +
        '<div class="callout"><b>How it works</b><p>Allow the microphone, press Record and speak. Chrome and Edge also show a live transcript, which is used to score clarity. Your recording stays in this browser tab and is never uploaded. Only the scores are saved to your account.</p></div>' +
        '<p class="muted">Two kinds of drill: <b>read it out loud</b> (say the line exactly, best for pace and clarity) and <b>reply in your own words</b> (the prospect says something and you answer as you would in a real conversation).</p>' +
        GROUPS.map(function (g, i) { return '<details class="dr-group"' + (i === 0 ? " open" : "") + '><summary><span>' + esc(g) + '</span><span class="muted small">' + gdone(g) + " of " + gcount(g) + ' tried</span></summary><div class="lrows">' + rows(g) + "</div></details>"; }).join("") +
      "</div>" +
      '<div role="tabpanel" id="dp-clear" aria-labelledby="dt-clear"' + (tab === "clear" ? "" : " hidden") + '><p class="muted">These are normal in Pakistan and many other countries, but they make a US owner work harder to follow you, on the phone and in writing. Swap them out.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Say this</th><th>Instead of</th><th>Why</th></tr></thead><tbody>' + O.CLEAR.map(function (c) { return "<tr><td><b>" + esc(c[0]) + "</b></td><td>" + esc(c[1]) + "</td><td>" + esc(c[2]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div role="tabpanel" id="dp-sounds" aria-labelledby="dt-sounds"' + (tab === "sounds" ? "" : " hidden") + '>' + O.SOUNDS.map(function (s) { return '<div class="result"><div class="result-h"><h3>' + esc(s[0]) + '</h3></div><p class="small" style="margin:0 0 6px">' + esc(s[1]) + "</p><pre>" + esc(s[2]) + "</pre></div>"; }).join("") +
      '<p class="muted small">Your accent is fine. The goal is to be easy to understand on a call or a video, not to sound American.</p></div>';
    return { html: h, route: "drills", after: function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-dtab]"), function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-dtab"); try { sessionStorage.setItem("osi_drtab", k); } catch (e) {} 
        Array.prototype.forEach.call(document.querySelectorAll("[data-dtab]"), function (x) { var on = x === b; x.setAttribute("aria-selected", String(on)); x.classList.toggle("on", on); var pn = document.getElementById("dp-" + x.getAttribute("data-dtab")); if (pn) pn.hidden = !on; }); }); });
    } };
  };
  function drTab() { try { return sessionStorage.getItem("osi_drtab") || "drills"; } catch (e) { return "drills"; } }
  V.drill = function (args) {
    var d = O.DRILLS.filter(function (x) { return x.id === args[0]; })[0]; if (!d) return null;
    document.title = d.title + " | Communication drills | The Cold Manual";
    var i = O.DRILLS.indexOf(d), nx = O.DRILLS[i + 1];
    var top = '<div class="page-head"><h1>' + esc(d.title) + '</h1><p>' + esc(d.sit) + "</p></div>" +
      (d.mode === "read" ? '<div class="panel drill-line"><span class="tag">Say this</span><p class="say-big">' + esc(d.line) + '</p><p class="muted small">Aim: ' + d.secs + " seconds or less, about 130 to 165 words a minute.</p></div>"
        : '<div class="panel drill-line"><span class="tag">The prospect says</span><p class="say-big">' + (d.them ? "“" + esc(d.them) + "”" : "(Voicemail beep)") + '</p><p class="muted small">Answer in your own words. Aim: ' + d.secs + " seconds or less." + (d.ask ? " End with a question." : "") + (d.time ? " Offer a specific time." : "") + "</p></div>");
    return { html: top + '<div id="dr-root"></div><p class="row">' + (nx ? '<a class="btn" href="#/drill/' + nx.id + '">Next drill</a>' : "") + '<a class="btn" href="#/drills">All drills</a>' + (d.lesson ? ' <a class="btn" href="#/l/' + d.lesson + '">Related lesson ' + d.lesson + "</a>" : "") + "</p>", route: "drills", crumbs: '<a href="#/drills">Communication drills</a> / ' + esc(d.title), after: function () { runDrill(d, document.getElementById("dr-root")); } };
  };
  function runDrill(d, root) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    var state = { rec: false, text: "", heard: false, edited: false, audio: false, dur: 0, speak: 0, pauses: 0, url: null }, live = null;
    function hist() { var r = drStore()[d.id]; return r && r.hist && r.hist.length ? '<div class="panel"><h2>Your last attempts</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Score</th><th>Pace</th><th>Fillers</th>' + (d.mode === "read" ? "<th>Clarity</th>" : "") + "</tr></thead><tbody>" + r.hist.map(function (x) { return "<tr><td>" + esc(new Date(x.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })) + "</td><td><b>" + x.s + "%</b></td><td>" + (x.w == null ? "–" : x.w + " wpm") + "</td><td>" + x.f + "</td>" + (d.mode === "read" ? "<td>" + (x.c == null ? "–" : x.c + "%") + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table></div></div>" : ""; }
    function draw() {
      root.innerHTML = '<div class="panel"><div class="row">' + (canRec ? '<button type="button" class="btn primary" id="dr-go">' + (state.rec ? "Stop" : state.audio ? "Record again" : "Record") + "</button>" : "") + '<span class="dr-status" id="dr-status" role="status" aria-live="polite">' + (state.rec ? '<i class="dot"></i> Recording... <span id="dr-t">0</span>s' : canRec ? "" : "Recording is not available in this browser. Type what you would say and check it.") + "</span></div>" +
        '<div class="field wide" style="margin-top:12px"><label for="dr-text">' + (SR ? "What was heard (you can correct it)" : "What you said (type it)") + '</label><textarea id="dr-text" rows="4" placeholder="' + (SR ? "Your words appear here as you speak." : "Type your answer here.") + '">' + esc(state.text) + "</textarea></div>" +
        (state.url ? '<audio controls src="' + state.url + '" class="dr-audio"></audio>' : "") +
        '<div class="row"><button type="button" class="btn sm" id="dr-check">Check it</button>' + (d.mode === "reply" ? '<button type="button" class="btn sm" id="dr-model">Show a model answer</button>' : "") + '</div><div id="dr-model-out"></div></div><div id="dr-out"></div>' + hist();
      var go = document.getElementById("dr-go"); if (go) go.addEventListener("click", function () { state.rec ? stop() : start(); });
      var tx = document.getElementById("dr-text"); tx.addEventListener("input", function () { state.text = tx.value; state.edited = true; });
      document.getElementById("dr-check").addEventListener("click", function () { state.text = tx.value; result(); });
      var mb = document.getElementById("dr-model"); if (mb) mb.addEventListener("click", function () { document.getElementById("dr-model-out").innerHTML = '<div class="result"><div class="result-h"><h3>One way to say it</h3></div><pre>' + esc(d.line) + '</pre><p class="muted small">Use it to compare, not to memorise word for word.</p></div>'; });
    }
    var media = null, mr = null, chunks = [], ac = null, timer = null, recog = null, t0 = 0;
    function start() {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        media = stream; chunks = []; if (state.url) URL.revokeObjectURL(state.url); state = { rec: true, text: "", heard: false, edited: false, audio: true, dur: 0, speak: 0, pauses: 0, url: null, saved: false }; draw();
        try { mr = new MediaRecorder(stream); mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); }; mr.start(250); } catch (e) { mr = null; }
        var AC = window.AudioContext || window.webkitAudioContext, an = null, buf = null;
        try { ac = new AC(); var src = ac.createMediaStreamSource(stream); an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an); buf = new Float32Array(an.fftSize); } catch (e) { an = null; }
        var first = null, last = null, silStart = null, noise = [], thr = 0.02; t0 = performance.now();
        timer = setInterval(function () {
          var t = (performance.now() - t0) / 1000, el = document.getElementById("dr-t"); if (el) el.textContent = Math.round(t);
          if (an) { an.getFloatTimeDomainData(buf); var s = 0; for (var k = 0; k < buf.length; k++) s += buf[k] * buf[k]; var rms = Math.sqrt(s / buf.length);
            if (t < 0.4) { noise.push(rms); thr = Math.max(0.015, (noise.reduce(function (a, b) { return a + b; }, 0) / noise.length) * 3); }
            else if (rms > thr) { if (first == null) first = t; if (silStart != null && t - silStart > 1.2 && last != null) state.pauses++; silStart = null; last = t; }
            else if (first != null && silStart == null) silStart = t; }
          state.dur = t; state.speak = first != null && last != null ? Math.max(0, last - first) : 0;
          if (t > Math.min(90, d.secs * 3)) stop();
        }, 50);
        if (SR) { try { recog = new SR(); recog.lang = "en-US"; recog.continuous = true; recog.interimResults = true; var fin = "";
          recog.onresult = function (e) { var interim = ""; for (var r = e.resultIndex; r < e.results.length; r++) { if (e.results[r].isFinal) fin += e.results[r][0].transcript + " "; else interim += e.results[r][0].transcript; } state.text = (fin + interim).trim(); state.heard = !!state.text; var tx = document.getElementById("dr-text"); if (tx) tx.value = state.text; };
          recog.onerror = function () {}; recog.start(); } catch (e) { recog = null; } }
      }, function () { canRec = false; draw(); document.getElementById("dr-status").textContent = "The microphone is blocked. Allow it in your browser's site settings, or type what you would say and check it."; });
    }
    function stop() {
      if (!state.rec) return; state.rec = false; clearInterval(timer);
      if (recog) { try { recog.stop(); } catch (e) {} }
      function finish() {
        if (media) media.getTracks().forEach(function (tr) { tr.stop(); }); if (ac) { try { ac.close(); } catch (e) {} }
        if (chunks.length) { state.url = URL.createObjectURL(new Blob(chunks, { type: (mr && mr.mimeType) || "audio/webm" })); }
        draw(); if (state.text) result(); else document.getElementById("dr-out").innerHTML = '<p class="callout">' + (SR ? "Nothing was transcribed. Check your microphone, or type what you said and press Check it." : "Type what you said in the box, then press Check it.") + "</p>";
      }
      if (mr && mr.state !== "inactive") { mr.onstop = function () { setTimeout(finish, recog ? 700 : 0); }; mr.stop(); } else setTimeout(finish, recog ? 700 : 0);
    }
    function result() {
      var heard = state.heard && !state.edited, r = O.drillAnalyse(d, { text: state.text, dur: state.dur, speak: state.speak, pauses: state.pauses, heard: heard, audio: state.audio });
      var out = document.getElementById("dr-out"); if (r.error) { out.innerHTML = '<p class="callout warn">' + esc(r.error) + "</p>"; return; }
      var all = drStore(), cur = all[d.id] || { runs: 0, best: null, hist: [] };
      var entry = { s: r.score, w: r.wpm, f: r.fillers, c: r.clarity, at: Date.now() };
      if (!state.saved) { cur.runs = (cur.runs || 0) + 1; cur.hist = [entry].concat(cur.hist || []).slice(0, 5); state.saved = true; } else { cur.hist = [entry].concat((cur.hist || []).slice(1)).slice(0, 5); }
      cur.last = r.score; cur.best = Math.max.apply(null, cur.hist.map(function (x) { return x.s; }).concat(cur.best == null ? [] : [cur.best])); cur.at = Date.now(); all[d.id] = cur; O.store.set("dr", all);
      var word = r.score >= 80 ? "Call-ready" : r.score >= 60 ? "Nearly there" : "Keep practising";
      out.innerHTML = '<div class="panel"><div class="kpis"><div class="kpi"><div class="v">' + r.score + '%</div><div class="l">' + word + '</div></div><div class="kpi"><div class="v">' + (r.wpm == null ? "–" : r.wpm) + '</div><div class="l">words a minute</div></div><div class="kpi"><div class="v">' + r.fillers + '</div><div class="l">filler words</div></div>' + (d.mode === "read" ? '<div class="kpi"><div class="v">' + (r.clarity == null ? "–" : r.clarity + "%") + '</div><div class="l">clarity</div></div>' : "") + '</div><ul class="rvl">' + r.items.map(function (x) { return '<li><span class="st ' + x.status + '">' + (x.status === "pass" ? "Pass" : x.status === "warn" ? "Check" : "Fix") + "</span><div><b>" + esc(x.label) + "</b><p>" + esc(x.note) + "</p></div></li>"; }).join("") + '</ul><p class="muted small">Saved to your account. Best: ' + cur.best + "%. Do each drill three times in a row, and listen back to your recording each time.</p></div>";
      var hp = root.querySelectorAll(".panel"); var hh = hist(); var old = hp[hp.length - 1]; if (old && old.querySelector("h2") && /last attempts/.test(old.querySelector("h2").textContent)) old.outerHTML = hh; else if (hh) out.insertAdjacentHTML("afterend", hh);
    }
    draw();
  }

  O.practiceStats = function () { var s = rpStore(), k = Object.keys(s); return { done: k.length, total: O.RP.length }; };
  O.bindCopy = bindCopy;
})(window.OSI);

;
/* ---- app.js ---- */
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
