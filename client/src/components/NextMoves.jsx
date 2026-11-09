import React, { useMemo } from "react";
import { nextMoves, trackStats, sprintStats } from "../../../shared/skills.mjs";
import { StuckNudge } from "../pages/Upgrades.jsx";
import { taskLink, startTrack, tickTask } from "../pages/Track.jsx";
import { buildCatalog, store } from "../bootstrap.js";
import { useStoreVersion } from "../hooks.js";
import TrackLine from "./TrackLine.jsx";
import { waLink } from "../contact.js";

/* true on a member's first visit: no lessons done, plan not started, and they haven't chosen to look around */
export function isFresh(kv) {
  const O = window.OSI, done = kv.done || {};
  return !O.L.some((l) => done[l.id]) && !(kv.trk && kv.trk.start) && !kv.home_full;
}
const rerender = () => window.dispatchEvent(new Event("osi-rerender"));

/* the one thing a new member sees: what this is, how a day works, and a single button to start */
function Welcome() {
  const O = window.OSI, TR = O.TRACK || { days: [], checkpoints: [] }, cfg = window.OSI_CFG || {}, d1 = TR.days[0];
  const yt = String(cfg.welcomeVideo || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  const wa = waLink("Hi, I just joined The Cold Manual and have a question before I start.");
  return <section className="welcome" aria-labelledby="wl-h">
    {yt ? <div className="wl-video"><iframe src={"https://www.youtube-nocookie.com/embed/" + yt[1] + "?rel=0"} title="How to use The Cold Manual" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div> : null}
    <h2 id="wl-h">Your first step: start day 1 of the plan</h2>
    <p>Don't try to read everything. The plan tells you what to do each day, and each job opens the lesson or tool you need.</p>
    <ol className="wl-steps">
      <li><b>One short list of jobs a day.</b><span>About 1 to 2 hours. Tick them off as you go, and the plan keeps your place if you miss a day.</span></li>
      <li><b>Offer first, then outreach.</b><span>Days 1 to 3 cover your numbers, your market and your offer. Outreach starts on day 8, once you have a list and your words ready.</span></li>
      <li><b>Everything is saved.</b><span>Your answers, notes and leads are on your account, on your phone and your laptop.</span></li>
    </ol>
    {d1 ? <p className="wl-d1"><span>Day 1</span>{d1.t}{d1.mins ? " · about " + d1.mins + " minutes" : ""}</p> : null}
    <div className="row">
      <button type="button" className="btn primary" onClick={() => { startTrack(); rerender(); }}>Start day 1 today</button>
      <button type="button" className="linkish small" onClick={() => { store.set("home_full", 1); rerender(); }}>Look around first</button>
    </div>
    {wa ? <p className="small muted wl-help">Stuck or unsure? <a href={wa} target="_blank" rel="noopener">Message us on WhatsApp</a>.</p> : null}
  </section>;
}

const ICON = { placement: "Skill check", lesson: "Lesson", roleplay: "Roleplay", review: "Review", drill: "Drill", track: "30 days" };

export function useMoves(limit) {
  const v = useStoreVersion();
  return useMemo(() => nextMoves(store.all(), buildCatalog(), limit || 3), [v, limit]);
}

/* a small progress ring: n of t, drawn in the brand blue */
function Ring({ n, t, label }) {
  const r = 22, c = 2 * Math.PI * r, f = t ? Math.min(1, n / t) : 0;
  return <div className="ring" role="img" aria-label={label}>
    <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r={r} className="ring-bg" /><circle cx="26" cy="26" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - f)} /></svg>
    <span><b>{n}</b>/{t}</span>
  </div>;
}

const SI = {
  book: '<path d="M4 4.5h5a2 2 0 0 1 2 2V16a1.5 1.5 0 0 0-1.5-1.5H4zM16 4.5h-5a2 2 0 0 0-2 2V16a1.5 1.5 0 0 1 1.5-1.5H16z"/>',
  flame: '<path d="M10 17c3 0 5-2 5-4.8 0-3.2-2.6-4.6-3.3-8.2-1.6 1.3-2.2 3-2.2 4.4-1-.6-1.6-1.6-1.8-2.6C6.3 7.3 5 9.4 5 12.2C5 15 7 17 10 17z"/>',
  chat: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H5.5A1.5 1.5 0 0 1 4 11.5z"/>',
  cal: '<rect x="3.5" y="4.5" width="13" height="12" rx="1.5"/><path d="M3.5 8.5h13M7 3v3M13 3v3"/>'
};
const Icon = ({ k }) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SI[k] }} />;

/* four numbers that show the member is moving: lessons, streak, conversations, meetings */
function Stats({ trk }) {
  const O = window.OSI, kv = store.all(), done = kv.done || {}, n = O.L.filter((l) => done[l.id]).length;
  const sp = sprintStats(kv.t_sprint), convos = trk.started ? trk.convos : sp ? sp.convos : 0, booked = trk.started ? trk.booked : sp ? sp.booked : 0;
  const tiles = [
    { k: "book", v: n + "/" + O.L.length, l: "lessons done", href: "#/programs" },
    { k: "flame", v: sp ? sp.streak : 0, l: (sp && sp.streak === 1 ? "day" : "days") + " outreach streak", href: "#/track" },
    { k: "chat", v: convos, l: "conversations logged", href: "#/track" },
    { k: "cal", v: booked, l: "meetings booked", href: "#/track" }
  ];
  return <ul className="stats" aria-label="Your numbers">{tiles.map((x) => <li key={x.k}><a href={x.href}><span className="st-ic"><Icon k={x.k} /></span><b>{x.v}</b><span>{x.l}</span></a></li>)}</ul>;
}

/* Today: the day's jobs from the 30-day plan, ticked here or done anywhere in the platform */
function TodayCard({ trk }) {
  const O = window.OSI, TR = O.TRACK || { days: [], checkpoints: [] };
  if (!TR.days.length) return null;
  if (!trk.started) {
    return <section className="today-card" aria-labelledby="td-h">
      <div className="today-h"><div><p className="sys">Your 30 days have not started</p><h2 id="td-h">Start the plan to your first client</h2></div></div>
      <p className="muted">Thirty days across the four pillars: your offer first, then outreach, booking meetings and closing. Each day has a short list of jobs, and each job opens the lesson or tool you need.</p>
      <TrackLine TR={TR} st={trk} />
      <div className="row"><button type="button" className="btn primary" onClick={startTrack}>Start day 1 today</button><a className="btn" href="#/track">See the 30 days</a></div>
    </section>;
  }
  const dnum = trk.next || trk.day, day = TR.days[dnum - 1], ds = trk.days[dnum - 1];
  if (!day || !ds) return null;
  const tick = (store.get("trk", {}) || {}).tick || {}, P = O.pillarOfDay ? O.pillarOfDay(dnum) : null;
  const left = ds.tasks.filter((x) => !x).length, catchUp = dnum < trk.day;
  return <section className="today-card" aria-labelledby="td-h">
    <div className="today-h">
      <div><p className="sys">{catchUp ? "Catch up: day " + dnum + " (today is day " + trk.day + ")" : dnum > trk.day ? "Today's done. Working ahead: day " + dnum : "Day " + trk.day + " of " + trk.total}{P ? <> · <a href={"#/pillar/" + P.k}>{P.n ? "Pillar " + P.n + ": " + P.t : P.t}</a></> : null}</p>
        <h2 id="td-h">{day.t}</h2></div>
      <Ring n={ds.tasks.filter(Boolean).length} t={ds.tasks.length} label={ds.tasks.filter(Boolean).length + " of " + ds.tasks.length + " jobs done today"} />
    </div>
    <TrackLine TR={TR} st={trk} />
    <p className="muted">{day.goal}{day.mins ? " About " + day.mins + " minutes." : ""}</p>
    <ul className="today-jobs">{day.tasks.map((task, i) => {
      const key = dnum + "." + i, isDone = ds.tasks[i], manual = !!tick[key], link = taskLink(task, O);
      return <li key={key} className={isDone ? "on" : ""}>
        <input type="checkbox" id={"tj-" + key} checked={isDone} disabled={isDone && !manual} onChange={(e) => tickTask(key, e.target.checked)} />
        <label htmlFor={"tj-" + key}>{task.t}</label>
        {link ? <a className="btn sm" href={link.href}>{task.k === "l" ? "Read" : task.k === "s" ? "Log it" : "Open"}</a> : null}
      </li>;
    })}</ul>
    <div className="today-foot-row"><p className="today-foot">{left ? left + " job" + (left === 1 ? "" : "s") + " left today." : ds.done ? "Today is done. Good work." : "Jobs done. Fill in today's answer on the plan to finish the day."}{day.out && !ds.outOk ? <> <a href="#/track">Write today's answer</a></> : null}</p><a className="btn sm" href="#/track">Open the plan</a></div>
  </section>;
}

/* the member's outreach sequence: the one they built in the cadence builder, or the standard cold sequence */
function SequenceCard() {
  const O = window.OSI, saved = store.get("t_cadence", null), CAD = O.CAD || {};
  const key = saved && CAD[saved.type] ? saved.type : CAD.cold ? "cold" : Object.keys(CAD)[0];
  const c = CAD[key]; if (!c || !c.steps) return null;
  const steps = c.steps.slice(0, 7);
  return <section className="seq" aria-labelledby="sq-h">
    <div className="section-head"><h2 id="sq-h">{saved ? "Your outreach sequence" : "Every channel, one sequence"}</h2><a href="#/t/cadence">{saved ? "Edit in the cadence builder" : "Build yours"}</a></div>
    <p className="muted small">{saved ? c.label + (saved.name ? " for " + saved.name : "") + ". " : "The standard sequence for a cold prospect. "}Stop the moment they reply, and carry on in that channel.</p>
    <ol className="seq-list">{steps.map((s, i) => <li key={i}><span className="d">Day {s.day + 1}</span><b>{s.ch}</b><span className="a">{s.a}</span></li>)}</ol>
    {c.steps.length > steps.length ? <p className="small muted">{c.steps.length - steps.length} more touches in the cadence builder.</p> : null}
  </section>;
}

export default function NextMoves() {
  const all = useMoves(4); /* hooks first, so the welcome can swap in without changing their order */
  if (isFresh(store.all())) return <Welcome />;
  const trk = trackStats(store.all(), window.OSI.TRACK);
  /* once the plan has started, today's jobs sit in the Today card, so the list skips the plan's own move */
  const moves = (trk.started ? all.filter((m) => m.type !== "track") : all).slice(0, 3);
  return (<>
    <Stats trk={trk} />
    <TodayCard trk={trk} />
    <StuckNudge trk={trk} />
    <section className="moves" aria-labelledby="mv-h">
      <h2 id="mv-h">Your next moves</h2>
      <ol className="mv-list">
        {moves.map((m, i) => (
          <li key={i}><a href={m.href}><span className="tag">{ICON[m.type] || "Next"}</span><b>{m.title}</b><span className="muted small">{m.why}</span></a></li>
        ))}
      </ol>
    </section>
    <SequenceCard />
  </>);
}
