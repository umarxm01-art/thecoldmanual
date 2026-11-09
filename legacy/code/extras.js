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
