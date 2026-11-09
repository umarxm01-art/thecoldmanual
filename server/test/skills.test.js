const test = require("node:test"), assert = require("node:assert");
let S; test.before(async () => { S = await import("../../shared/skills.mjs"); });
const cat = { lessonIds: ["3.1", "3.2", "3.5", "3.6", "4.4", "5.3", "6.2", "2.3", "7.2", "8.1", "8.2", "8.3", "8.4", "8.5", "3.4", "4.6", "10.3", "10.4", "10.5", "4.5", "7.3", "7.4", "7.5", "10.2", "10.6", "11.3", "1.2", "1.4", "9.1", "9.2", "9.3", "9.4", "9.5", "10.1", "1.3", "3.3", "8.6", "11.4"], scenarios: [{ id: "a", title: "A", tags: ["Opening", "Questions"] }, { id: "b", title: "B", tags: ["Objections", "Next step"] }] };

test("empty data: no scores; next moves are the first lesson, a roleplay and a drill", () => {
  const r = S.computeSkills({}, cat); assert.equal(r.overall, null); assert.ok(Object.values(r.scores).every(v => v === null));
  const m = S.nextMoves({}, cat); assert.equal(m.length, 3); assert.equal(m[0].type, "lesson"); assert.equal(m[0].href, "#/l/" + cat.lessonIds[0]);
  assert.ok(m.every(x => x.type !== "placement"), "no skill check move");
});
test("placement, roleplay and lessons are weighted 2:3:1", () => {
  const kv = { pl: { scores: { Opening: 100 } }, rp: { a: { tags: { Opening: 40 } } }, done: { "3.1": 1 }, quiz: { "3.1": 1 } };
  const r = S.computeSkills(kv, cat);
  // lessons part: 1 of 7 done => comp 14.28, quiz 100 => 57. Weighted (100*2 + 40*3 + 57*1) / 6 = 62.8
  assert.equal(r.parts.Opening.lessons, 57); assert.equal(r.scores.Opening, 63);
});
test("scores are clamped and bad input is ignored", () => {
  const r = S.computeSkills({ pl: { scores: { Opening: 500, Tone: "x" } }, rp: { a: { tags: { Questions: -5 } } }, done: [], quiz: null }, cat);
  assert.equal(r.scores.Opening, 100); assert.equal(r.scores.Tone, null); assert.equal(r.scores.Questions, 0);
});
test("next moves skip finished lessons and played roleplays", () => {
  const kv = { done: { [cat.lessonIds[0]]: 1 }, rp: { a: { best: 90, runs: 1 } } };
  const m = S.nextMoves(kv, cat, 2);
  assert.equal(m[0].href, "#/l/" + cat.lessonIds[1]); assert.equal(m[1].type, "roleplay"); assert.notEqual(m[1].href, "#/rp/a");
});
test("a mastered learner gets a review move", () => {
  const done = {}; cat.lessonIds.forEach(id => done[id] = 1);
  const m = S.nextMoves({ pl: { scores: {} }, done, rp: { a: { tags: { Opening: 100, Questions: 100 } }, b: { tags: { Objections: 100, "Next step": 100 } } } }, cat, 3);
  assert.ok(m.every(x => x.type === "review" || x.type === "roleplay" || x.type === "drill"));
  const m2 = S.nextMoves({ pl: { scores: {} }, done, dr: { x: { last: 90, runs: 1 } }, rp: { a: { tags: { Opening: 100, Questions: 100 } }, b: { tags: { Objections: 100, "Next step": 100 } } } }, cat, 3);
  assert.ok(m2.every(x => x.type !== "drill"), "no drill move once drills are done");
});
test("English drills feed the Tone skill with weight 2", () => {
  assert.equal(S.drillAverage({}), null); assert.equal(S.drillAverage({ a: { last: 80 }, b: { last: 60 }, c: { last: "x" } }), 70);
  const r = S.computeSkills({ pl: { scores: { Tone: 40 } }, dr: { a: { last: 100 } } }, cat);
  assert.equal(r.parts.Tone.drills, 100); assert.equal(r.scores.Tone, 70); /* (40*2 + 100*2) / 4 */
  assert.equal(r.parts.Opening.drills, undefined, "drills only count for Tone");
  const m = S.nextMoves({}, cat, 3);
  assert.ok(m.some(x => x.type === "drill"), "no drills yet suggests a drill");
});
test("sprint stats count working days, target, streak and bookings", () => {
  assert.equal(S.sprintStats(null), null); assert.equal(S.sprintStats({ start: "2026-10-05", log: {} }), null);
  const t = { dials: 10, emails: 10, dms: 0, looms: 0, fu: 0 }; /* 20 a day; 2026-10-05 is a Monday */
  const log = { "2026-10-05": { dials: 10, emails: 10, convos: 3, booked: 1 }, "2026-10-06": { dials: 10, emails: 5 }, "2026-10-07": { dials: 12, emails: 10, booked: 2 }, "2026-10-08": { dials: 10, emails: 10 }, "2026-10-11": { dials: 5 } };
  const now = new Date(2026, 9, 12, 15).getTime(); /* Monday the 12th, nothing logged yet today */
  const r = S.sprintStats({ start: "2026-10-05", days: "5", t, log }, now);
  assert.equal(r.day, 8); assert.equal(r.workDays, 5); /* Mon to Fri, today not counted until logged */
  assert.equal(r.touches, 82); assert.equal(r.pct, 82); /* 82 of 5 x 20 (the Sunday extra counts as work done) */
  assert.equal(r.hits, 3); assert.equal(r.streak, 0); /* Friday the 9th was missed */
  assert.equal(r.booked, 3); assert.equal(r.convos, 3);
  const r2 = S.sprintStats({ start: "2026-10-05", days: "5", t, log }, new Date(2026, 9, 8, 20).getTime());
  assert.equal(r2.streak, 2); assert.equal(r2.hits, 3);
});
test("member stats include drills and sprint", () => {
  const st = S.memberStats({ dr: { a: { last: 50, runs: 2 }, b: { last: 70, runs: 1 } }, t_sprint: { start: "2026-10-05", t: { dials: 10 }, log: { "2026-10-05": { dials: 10, booked: 1 } } } }, cat, new Date(2026, 9, 5, 22).getTime());
  assert.equal(st.drillAvg, 60); assert.equal(st.drillRuns, 3); assert.equal(st.sprint.day, 1); assert.equal(st.sprint.pct, 100); assert.equal(st.sprint.booked, 1); assert.equal(st.sprint.streak, 1);
});
test("member stats", () => {
  const st = S.memberStats({ done: { "3.1": 1, "3.2": 1 }, quiz: { "3.1": 1, "3.2": 0.5 }, rp: { a: { runs: 2, last: 80 }, b: { runs: 1, last: 60 } }, pl: { scores: {} } }, cat);
  assert.equal(st.done, 2); assert.equal(st.total, 38); assert.equal(st.avgQuiz, 75); assert.equal(st.rpRuns, 3); assert.equal(st.rpAvg, 70); assert.equal(st.placement, true);
});

const TRACK = { days: [
  { d: 1, t: "One", goal: "g1", tasks: [{ k: "l", id: "1.1" }, { k: "t", id: "funnel" }, { k: "c", t: "manual" }], out: { k: "goal", l: "Goal" } },
  { d: 2, t: "Two", goal: "g2", tasks: [{ k: "d", id: "r-opener" }, { k: "r", id: "owner-call" }] },
  { d: 3, t: "Three", goal: "g3", tasks: [{ k: "s", id: "setup" }, { k: "s", id: "log" }] }
], checkpoints: [{ day: 1, id: "a", rule: { outs: ["goal"] } }, { day: 3, id: "b", rule: { convos: 3, booked: 1 } }, { day: 3, id: "c", rule: { flag: "client" } }, { day: 2, id: "d", rule: { leads: 100 } }] };
const iso3 = (d) => d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
test("track: not started, then auto ticks from lessons, tools, drills, roleplay and sprint", () => {
  assert.equal(S.trackStats({}, TRACK).started, false);
  const start = new Date(2026, 9, 5), now = new Date(2026, 9, 7, 12).getTime(), d3 = iso3(new Date(2026, 9, 7));
  let kv = { trk: { start: "2026-10-05", tick: {}, out: {}, flag: {} } };
  let r = S.trackStats(kv, TRACK, now);
  assert.equal(r.day, 3); assert.equal(r.doneDays, 0); assert.equal(r.behind, 2); assert.equal(r.next, 1); assert.equal(r.passed, 0);
  kv = { trk: { start: "2026-10-05", tick: { "1.2": 1 }, out: { goal: "1 client" }, flag: {} }, done: { "1.1": 1 }, t_funnel: { goal: 1 }, dr: { "r-opener": { runs: 1 } }, rp: { "owner-call": { best: 80 } } };
  r = S.trackStats(kv, TRACK, now);
  assert.deepEqual(r.days[0].tasks, [true, true, true]); assert.equal(r.days[0].done, true); assert.equal(r.days[1].done, true); assert.equal(r.next, 3); assert.equal(r.behind, 0);
  assert.equal(r.checkpoints.find((c) => c.id === "a").passed, true);
  kv.t_sprint = { started: true, log: { [d3]: { dials: 5, convos: 3, booked: 1 }, "2026-10-01": { dials: 50, convos: 9, booked: 4 } } };
  r = S.trackStats(kv, TRACK, now);
  assert.equal(r.days[2].done, true); assert.equal(r.doneDays, 3); assert.equal(r.convos, 3, "sprint days before the track starts do not count"); assert.equal(r.booked, 1);
  assert.equal(r.checkpoints.find((c) => c.id === "b").passed, true); assert.equal(r.checkpoints.find((c) => c.id === "c").passed, false);
  kv.trk.flag.client = true; kv.trk.out.leads = "120 leads"; r = S.trackStats(kv, TRACK, now); assert.equal(r.passed, 4); assert.equal(r.client, true);
  void start;
});
test("track: an empty answer keeps the day open, and a manual tick can be removed", () => {
  const kv = { trk: { start: "2026-10-05", tick: { "1.0": 1, "1.1": 1, "1.2": 1 }, out: { goal: "  " } } };
  const r = S.trackStats(kv, TRACK, new Date(2026, 9, 5).getTime()); assert.equal(r.days[0].done, false); assert.equal(r.days[0].outOk, false);
  assert.equal(S.trackStats({ trk: { start: "2026-10-05" } }, TRACK, new Date(2026, 10, 30).getTime()).day, 3, "day is capped at the track length");
});
test("track: next moves put today's track day first, or offer to start", () => {
  const c = Object.assign({}, cat, { track: TRACK });
  assert.equal(S.nextMoves({}, c, 3)[0].type, "track"); assert.match(S.nextMoves({}, c, 3)[0].title, /Start/);
  const m = S.nextMoves({ trk: { start: iso3(new Date()) } }, c, 3); assert.equal(m[0].type, "track"); assert.match(m[0].title, /^Day 1: One/);
  const st = S.memberStats({ trk: { start: iso3(new Date()), flag: { client: true } } }, c); assert.equal(st.track.day, 1); assert.equal(st.track.client, true); assert.equal(st.track.total, 3);
});
