/* The Cold Manual: skill scoring, personalised path and team stats. Pure functions, used by the client and the server. */
export const SKILLS = [
  { key: "Opening", label: "Opening", blurb: "The first ten seconds of a call, email or message." },
  { key: "Questions", label: "Questions", blurb: "Finding the problem and its cost before you pitch." },
  { key: "Objections", label: "Objections", blurb: "Acknowledging and clarifying before you answer." },
  { key: "Next step", label: "Next step", blurb: "Booking, confirming and following up." },
  { key: "Value", label: "Value", blurb: "Showing what the offer is worth on their numbers." },
  { key: "Tone", label: "Tone", blurb: "Pace, listening and talk ratio." }
];

/* lessons that build each skill */
export const SKILL_LESSONS = {
  Opening: ["3.1", "3.2", "3.5", "3.6", "4.4", "5.3", "6.2"],
  Questions: ["2.3", "7.2", "8.1", "8.2", "8.3", "8.4", "8.5"],
  Objections: ["3.4", "4.6", "10.3", "10.4", "10.5", "10.7"],
  "Next step": ["4.5", "7.3", "7.4", "7.5", "7.7", "10.2", "10.6", "10.8", "11.3"],
  Value: ["1.2", "1.4", "1.6", "9.1", "9.2", "9.3", "9.4", "9.5", "10.1"],
  Tone: ["1.3", "3.3", "3.7", "8.6", "11.4"]
};

export function levelOf(score) {
  if (score == null) return "Not measured";
  return score >= 70 ? "Strong" : score >= 40 ? "Developing" : "Learning";
}

function isNum(v) { return typeof v === "number" && isFinite(v); }
function mean(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function clamp(n) { return Math.max(0, Math.min(100, n)); }

/* catalog = { lessonIds: [...], scenarios: [{ id, tags: [...] }] }. Without a catalog, every mapped lesson counts. */
export function computeSkills(kv, catalog) {
  kv = obj(kv); var done = obj(kv.done), quiz = obj(kv.quiz), rp = obj(kv.rp), pl = obj(kv.pl), plScores = obj(pl.scores), drAvg = drillAverage(kv.dr);
  var have = catalog && catalog.lessonIds ? {} : null;
  if (have) catalog.lessonIds.forEach(function (id) { have[id] = 1; });
  var scores = {}, parts = {}, vals = [];
  SKILLS.forEach(function (s) {
    var k = s.key, items = [], p = {};
    if (isNum(plScores[k])) { p.placement = clamp(Math.round(plScores[k])); items.push([p.placement, 2]); }
    var rv = [];
    Object.keys(rp).forEach(function (id) { var t = obj(obj(rp[id]).tags); if (isNum(t[k])) rv.push(clamp(t[k])); });
    if (rv.length) { p.roleplay = Math.round(mean(rv)); items.push([p.roleplay, 3]); }
    if (k === "Tone" && drAvg != null) { p.drills = drAvg; items.push([drAvg, 2]); }
    var ids = SKILL_LESSONS[k].filter(function (id) { return !have || have[id]; }), completed = ids.filter(function (id) { return done[id]; });
    if (completed.length) {
      var q = completed.map(function (id) { return quiz[id]; }).filter(isNum), comp = completed.length / ids.length * 100;
      p.lessons = Math.round(q.length ? 0.5 * comp + 0.5 * clamp(mean(q) * 100) : comp);
      items.push([p.lessons, 1]);
    }
    var w = 0, t = 0; items.forEach(function (i) { t += i[0] * i[1]; w += i[1]; });
    scores[k] = w ? Math.round(t / w) : null; parts[k] = p; if (scores[k] != null) vals.push(scores[k]);
  });
  return { scores: scores, parts: parts, overall: vals.length ? Math.round(mean(vals)) : null };
}

/* English call drills: average of each drill's latest score */
export function drillAverage(dr) {
  dr = obj(dr); var v = Object.keys(dr).map(function (k) { return obj(dr[k]).last; }).filter(isNum);
  return v.length ? Math.round(mean(v.map(clamp))) : null;
}

/* daily outreach summary for the team dashboard. Same rules as the daily log in the 30-day plan. */
function isoOf(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
var SPRINT_CH = ["dials", "emails", "dms", "looms", "fu"];
export function sprintStats(sp, now) {
  sp = obj(sp); var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(sp.start || "")), log = obj(sp.log), t = obj(sp.t);
  if (!m || !Object.keys(log).length) return null;
  var st = new Date(+m[1], +m[2] - 1, +m[3]), td = new Date(now || Date.now()); td.setHours(0, 0, 0, 0);
  var daily = SPRINT_CH.reduce(function (a, c) { return a + (isNum(+t[c]) ? +t[c] : 0); }, 0), work = function (d) { var w = d.getDay(); return sp.days === "7" ? true : sp.days === "6" ? w !== 0 : w > 0 && w < 6; };
  var att = 0, tgt = 0, booked = 0, convos = 0, hits = 0, workDays = 0, streak = 0, run = true;
  var days = [];
  for (var i = 0; i < 30; i++) { var d = new Date(st.getTime()); d.setDate(d.getDate() + i); days.push(d); }
  days.forEach(function (d) { var e = log[isoOf(d)]; if (e) { e = obj(e); SPRINT_CH.forEach(function (c) { att += +e[c] || 0; }); booked += +e.booked || 0; convos += +e.convos || 0; } });
  var past = days.filter(function (d) { return d.getTime() <= td.getTime(); });
  past.forEach(function (d) { var e = log[isoOf(d)], isToday = d.getTime() === td.getTime(); if (!work(d) || (isToday && !e)) return; workDays++; tgt += daily; var a = e ? SPRINT_CH.reduce(function (x, c) { return x + (+obj(e)[c] || 0); }, 0) : 0; if (daily && a >= daily) hits++; });
  for (var j = past.length - 1; j >= 0 && run; j--) { var d2 = past[j], e2 = log[isoOf(d2)]; if (!work(d2)) continue; var a2 = e2 ? SPRINT_CH.reduce(function (x, c) { return x + (+obj(e2)[c] || 0); }, 0) : 0; if (d2.getTime() === td.getTime() && !(daily && a2 >= daily)) continue; if (daily && a2 >= daily) streak++; else run = false; }
  var day = Math.min(30, Math.max(0, Math.floor((td - st) / 86400000) + 1));
  return { day: day, pct: tgt ? Math.round(att / tgt * 100) : null, touches: att, convos: convos, booked: booked, hits: hits, workDays: workDays, streak: streak };
}

/* ---- First client in 30 days ---- */
function dayDiff(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function parseIso(x) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(x || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
var SPRINT_TOUCH = ["dials", "emails", "dms", "looms", "fu"];
export var TOOL_ALIAS = { icp: "offer.who", emailwriter: "messages.email", dmbuilder: "messages.linkedin", videoscript: "messages.video", scripts: "messages.call", reminders: "messages.reminder" };
/* is one track task done? kv is the member's saved data; date is the calendar date of that track day */
export function trackTaskDone(task, kv, tick, key, dateIso) {
  kv = obj(kv); if (obj(tick)[key]) return true;
  var sp = obj(kv.t_sprint);
  switch (task && task.k) {
    case "l": return !!obj(kv.done)[task.id];
    case "t": {
      /* old tool names map to the tool that replaced them; "messages.email" means the message builder was used for email */
      var al = TOOL_ALIAS[task.id] || task.id, p = al.split(".");
      if (kv["t_" + task.id] != null && task.id !== p[0]) return true;
      return p[1] ? !!obj(obj(kv["t_" + p[0]]).used)[p[1]] : kv["t_" + p[0]] != null;
    }
    case "d": var dr = obj(obj(kv.dr)[task.id]); return isNum(dr.runs) && dr.runs > 0;
    case "r": return obj(kv.rp)[task.id] != null;
    case "s":
      if (task.id === "setup") return !!sp.started || Object.keys(obj(sp.log)).length > 0;
      var e = obj(obj(sp.log)[dateIso]); return SPRINT_TOUCH.some(function (c) { return (+e[c] || 0) > 0; });
    default: return false;
  }
}
export function trackStats(kv, track, now) {
  kv = obj(kv); track = obj(track); var days = Array.isArray(track.days) ? track.days : [], cps = Array.isArray(track.checkpoints) ? track.checkpoints : [];
  var t = obj(kv.trk), st = parseIso(t.start); if (!st || !days.length) return { started: false, total: days.length };
  var td = new Date(now || Date.now()); td.setHours(0, 0, 0, 0);
  var elapsed = dayDiff(st, td), today = Math.max(1, Math.min(days.length, elapsed + 1)), tick = obj(t.tick), out = obj(t.out), flag = obj(t.flag);
  var dd = days.map(function (d) {
    var date = new Date(st.getTime()); date.setDate(date.getDate() + d.d - 1); var dIso = isoOf(date);
    var tasks = (d.tasks || []).map(function (task, i) { return trackTaskDone(task, kv, tick, d.d + "." + i, dIso); });
    var outOk = !d.out || String(out[d.out.k] == null ? "" : out[d.out.k]).trim() !== "";
    return { d: d.d, date: dIso, tasks: tasks, done: tasks.every(Boolean) && outOk, outOk: outOk };
  });
  var sp = obj(kv.t_sprint), convos = 0, booked = 0;
  Object.keys(obj(sp.log)).forEach(function (k) { var dt = parseIso(k); if (dt && dt >= st) { var e = obj(sp.log[k]); convos += +e.convos || 0; booked += +e.booked || 0; } });
  var checks = cps.map(function (c) {
    var r = obj(c.rule), ok = true;
    if (r.outs) ok = ok && r.outs.every(function (k) { return String(out[k] == null ? "" : out[k]).trim() !== ""; });
    if (r.leads) ok = ok && (+String(out.leads || "").replace(/[^0-9.]/g, "") || 0) >= r.leads;
    if (r.convos) ok = ok && convos >= r.convos;
    if (r.booked) ok = ok && booked >= r.booked;
    if (r.flag) ok = ok && !!flag[r.flag];
    return { id: c.id, day: c.day, passed: ok };
  });
  var doneDays = dd.filter(function (x) { return x.done; }).length, behind = dd.filter(function (x) { return x.d < today && !x.done; }).length;
  var next = dd.filter(function (x) { return !x.done; })[0];
  return { started: true, start: t.start, day: today, finished: elapsed >= days.length, total: days.length, days: dd, doneDays: doneDays, behind: behind, todayDone: dd[today - 1] ? dd[today - 1].done : false,
    next: next ? next.d : null, checkpoints: checks, passed: checks.filter(function (c) { return c.passed; }).length, convos: convos, booked: booked, client: !!flag.client };
}

export function nextMoves(kv, catalog, limit) {
  limit = limit || 3; kv = obj(kv); var done = obj(kv.done), rp = obj(kv.rp), moves = [];
  var titles = (catalog && catalog.lessonTitles) || {}, scen = (catalog && catalog.scenarios) || [];
  var have = catalog && catalog.lessonIds ? {} : null; if (have) catalog.lessonIds.forEach(function (id) { have[id] = 1; });
  var trk = catalog && catalog.track ? trackStats(kv, catalog.track) : null;
  if (trk && trk.started && trk.next) { var td0 = catalog.track.days[trk.next - 1]; moves.push({ type: "track", href: "#/track", title: "Day " + trk.next + ": " + td0.t, why: trk.behind ? "First client in 30 days. You are " + trk.behind + " day" + (trk.behind === 1 ? "" : "s") + " behind, so start here." : "First client in 30 days: " + td0.goal }); }
  else if (trk && !trk.started) moves.push({ type: "track", href: "#/track", title: "Start the First client in 30 days track", why: "A day-by-day plan from picking a niche to signing a client." });
  /* next unfinished lesson, then a call to practise, then a drill: no scores, just the next useful thing */
  var ids = (catalog && catalog.lessonIds) || [], nl = ids.filter(function (id) { return !done[id]; })[0];
  if (nl && moves.length < limit) moves.push({ type: "lesson", href: "#/l/" + nl, title: "Lesson " + nl + (titles[nl] ? ": " + titles[nl] : ""), why: "The next lesson in your modules." });
  /* rotate the practice suggestion (catalog.rotate, e.g. the day of the year) so email and DM roleplays come up as often as calls */
  var rot = catalog && isNum(catalog.rotate) && scen.length ? Math.abs(Math.floor(catalog.rotate)) % scen.length : 0, order = scen.slice(rot).concat(scen.slice(0, rot));
  var fresh = order.filter(function (x) { return !rp[x.id]; })[0] || order.filter(function (x) { var r = obj(rp[x.id]); return !isNum(r.best) || r.best < 80; })[0];
  if (fresh && moves.length < limit) moves.push({ type: "roleplay", href: "#/rp/" + fresh.id, title: "Roleplay: " + (fresh.title || fresh.id), why: rp[fresh.id] ? "Your best run is " + obj(rp[fresh.id]).best + "%. Aim for 80% or more." : "Practise this conversation before you have it for real." });
  if (moves.length < limit && drillAverage(kv.dr) == null) moves.push({ type: "drill", href: "#/drills", title: "Try a communication drill", why: "Say real sales lines out loud and get scored on pace and clarity." });
  if (!moves.length) moves.push({ type: "review", href: "#/review", title: "Check one of your own emails or call transcripts", why: "You have covered every skill. Keep practising on real work." });
  return moves.slice(0, limit);
}

/* one member's numbers for the team dashboard */
export function memberStats(kv, catalog, now) {
  kv = obj(kv); var done = obj(kv.done), quiz = obj(kv.quiz), rp = obj(kv.rp), ids = (catalog && catalog.lessonIds) || Object.keys(done);
  var n = ids.filter(function (id) { return done[id]; }).length;
  var qv = ids.map(function (id) { return quiz[id]; }).filter(isNum);
  var runs = 0, lasts = []; Object.keys(rp).forEach(function (id) { var r = obj(rp[id]); if (isNum(r.runs)) runs += r.runs; if (isNum(r.last)) lasts.push(r.last); });
  var sk = computeSkills(kv, catalog), dr = obj(kv.dr), drRuns = 0; Object.keys(dr).forEach(function (id) { if (isNum(obj(dr[id]).runs)) drRuns += obj(dr[id]).runs; });
  var tr = catalog && catalog.track ? trackStats(kv, catalog.track, now) : null;
  return { track: tr && tr.started ? { day: tr.day, doneDays: tr.doneDays, total: tr.total, passed: tr.passed, checkpoints: tr.checkpoints.length, behind: tr.behind, client: tr.client } : null, drillAvg: drillAverage(kv.dr), drillRuns: drRuns, sprint: sprintStats(kv.t_sprint, now), done: n, total: ids.length, pct: ids.length ? Math.round(n / ids.length * 100) : 0, avgQuiz: qv.length ? Math.round(mean(qv) * 100) : null, rpRuns: runs, rpAvg: lasts.length ? Math.round(mean(lasts)) : null, placement: !!kv.pl, skills: sk.scores, overall: sk.overall };
}
