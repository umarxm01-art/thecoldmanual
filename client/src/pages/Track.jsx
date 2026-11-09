import React, { useEffect, useRef, useState } from "react";
import { trackStats } from "../../../shared/skills.mjs";
import { store } from "../bootstrap.js";
import { useStoreVersion } from "../hooks.js";
import TrackLine from "../components/TrackLine.jsx";

/* First client in 30 days: a guided day-by-day track through the course. Saved as `trk`. */
const iso = (d) => d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
const nice = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""; };
const copy = (t) => window.OSI && window.OSI.ui && window.OSI.ui.copy(t);
const toast = (t) => window.OSI && window.OSI.ui && window.OSI.ui.toast(t);

export function taskLink(task, O) {
  if (task.k === "l") { const l = O.byId ? O.byId(task.id) : null; return { href: "#/l/" + task.id, label: "Lesson " + task.id + (l ? ": " + l.t : "") }; }
  if (task.k === "t") { const r = O.toolRef ? O.toolRef(task.id) : null; return { href: r ? r.href : "#/t/" + task.id, label: r ? r.title : "Open the tool" }; }
  if (task.k === "d") return { href: "#/drill/" + task.id, label: "Open the drill" };
  if (task.k === "r") return { href: "#/rp/" + task.id, label: "Open the roleplay" };
  if (task.k === "s") return { href: "#/track", label: "Log your daily numbers", numbers: true };
  if (task.k === "p") return { href: task.href, label: "Open" };
  return null;
}

/* shared with the Today card on Home */
export function startTrack() { store.set("trk", { start: iso(new Date()), tick: {}, out: {}, flag: {} }); toast("Track started. Day 1 is ready."); }
export function tickTask(key, on) { const cur = store.get("trk", {}) || {}, t = Object.assign({}, cur.tick || {}); if (on) t[key] = 1; else delete t[key]; store.set("trk", Object.assign({}, cur, { tick: t })); }

/* the daily outreach log lives inside the plan; its course code renders into this box */
function DailyNumbers({ start }) {
  const ref = useRef(null);
  useEffect(() => { const O = window.OSI; if (ref.current && O && O.sprintRender) { ref.current.innerHTML = ""; O.sprintRender(ref.current, { start }); } }, [start]);
  return <div ref={ref} />;
}
const toNumbers = () => { const el = document.getElementById("numbers"); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

export default function Track() {
  useStoreVersion();
  const O = window.OSI, TR = O.TRACK || { days: [], phases: [], checkpoints: [] }, kv = store.all(), trk = kv.trk || null;
  const st = trackStats(kv, TR);
  const [sel, setSel] = useState(null), [armed, setArmed] = useState(false);
  useEffect(() => { if (st.started && sel == null) setSel(st.next && st.next <= st.day ? st.next : st.day); }, [st.started]); // eslint-disable-line react-hooks/exhaustive-deps

  function save(patch) { const cur = store.get("trk", {}) || {}; store.set("trk", Object.assign({}, cur, patch)); }
  function start() { store.set("trk", { start: iso(new Date()), tick: {}, out: {}, flag: {} }); setSel(1); toast("Track started. Day 1 is ready."); }
  function tick(key, on) { const cur = store.get("trk", {}) || {}, t = Object.assign({}, cur.tick || {}); if (on) t[key] = 1; else delete t[key]; save({ tick: t }); }
  function setOut(k, v) { const cur = store.get("trk", {}) || {}; save({ out: Object.assign({}, cur.out || {}, { [k]: v.slice(0, 400) }) }); }
  function setFlag(k, v) { const cur = store.get("trk", {}) || {}; save({ flag: Object.assign({}, cur.flag || {}, { [k]: v }) }); if (v) toast("First client signed"); }
  function restart() { if (!armed) { setArmed(true); return; } store.del("trk"); setArmed(false); setSel(null); toast("Track reset"); }

  const phaseOf = (d) => TR.phases.find((p) => d >= p.from && d <= p.to) || TR.phases[0];

  if (!st.started) return <>
    <div className="page-head"><h1>{TR.title}</h1><p>Thirty days, from picking a niche to signing your first client. Each day has a few jobs. Every job opens the lesson, tool, drill or daily log you need, and ticks itself off once you've done the work.</p></div>
    <section className="trk-intro">
      <TrackLine TR={TR} st={st} />
      <div className="trk-start">
        <p>Plan on one to two hours a day. From day 8 most of that is outreach: you set daily targets for each channel and log what you did on this page. Miss a day and the plan keeps your place.</p>
        <div className="row"><button type="button" className="btn primary" onClick={start}>Start today</button></div>
      </div>
      <div><h2>Five parts</h2><div className="trk-phases">{TR.phases.map((p) => <div className="trk-ph" key={p.n}><span className="sys">Days {p.from}–{p.to}</span><b>{p.t}</b><span className="small muted">{p.sub}</span></div>)}</div></div>
      <div className="trk-side"><h2>Five checkpoints</h2><ul className="trk-cps">{TR.checkpoints.map((c) => <li key={c.id}><span className="tag">Day {c.day}</span><div><b>{c.t}</b><span className="small muted">{c.need}</span></div></li>)}</ul></div>
    </section>
  </>;

  const day = TR.days[(sel || st.day) - 1] || TR.days[0], ds = st.days[day.d - 1], ph = phaseOf(day.d), cp = TR.checkpoints.find((c) => c.day === day.d), cps = st.checkpoints.find((c) => cp && c.id === cp.id);
  const outs = TR.days.filter((d) => d.out), trkOut = (trk && trk.out) || {};
  const kitText = outs.map((d) => d.out.l + ": " + (trkOut[d.out.k] || "–")).join("\n");
  const pct = Math.round(st.doneDays / st.total * 100);

  return <>
    <div className="page-head"><p className="sys">Started {nice(st.start)}</p><h1>{TR.title}</h1><p>{st.finished ? "Your 30 days are up. Finish any open days, review your kit and plan month two." : "Day " + st.day + " of 30. Work through today's tasks, then log your outreach below."}</p></div>

    <div className="kpis">
      <div className="kpi"><div className="v">Day {st.day}</div><div className="l">of {st.total}</div></div>
      <div className="kpi"><div className="v">{st.doneDays}/{st.total}</div><div className="l">days complete</div></div>
      <div className="kpi"><div className={"v" + (st.passed ? " up" : "")}>{st.passed}/{st.checkpoints.length}</div><div className="l">checkpoints passed</div></div>
      <div className="kpi"><div className="v">{st.convos}</div><div className="l">conversations</div></div>
      <div className="kpi"><div className={"v" + (st.booked ? " up" : "")}>{st.booked}</div><div className="l">meetings booked</div></div>
    </div>

    {st.behind > 0 && st.next && <div className="focus trk-behind"><b>You are {st.behind} day{st.behind === 1 ? "" : "s"} behind.</b> That is normal. Do day {st.next} next, then keep going. <button type="button" className="btn sm" onClick={() => setSel(st.next)}>Go to day {st.next}</button></div>}

    <section className="panel">
      <div className="row between"><h2 style={{ margin: 0 }}>Your 30 days</h2><span className="sys">{pct}% complete</span></div>
      <div className="trk-map">{TR.phases.map((p) => <div className="trk-phase" key={p.n} style={{ "--days": p.to - p.from + 1 }}>
        <span className="sys">{p.t}</span>
        <div className="trk-days">{TR.days.filter((d) => d.d >= p.from && d.d <= p.to).map((d) => { const x = st.days[d.d - 1], c = TR.checkpoints.find((k) => k.day === d.d), cs = c && st.checkpoints.find((k) => k.id === c.id);
          const state = x.done ? "done" : d.d === st.day ? "today" : d.d < st.day ? "late" : "next";
          return <button type="button" key={d.d} className={"trk-d " + state + (d.d === day.d ? " sel" : "") + (c ? " cp" : "")} onClick={() => setSel(d.d)} aria-pressed={d.d === day.d} title={"Day " + d.d + ": " + d.t + (c ? " (checkpoint: " + c.t + (cs && cs.passed ? ", passed" : "") + ")" : "")}>
            <b>{d.d}</b>{c ? <i className={"flag" + (cs && cs.passed ? " ok" : "")} aria-hidden="true" /> : null}</button>; })}</div>
      </div>)}</div>
      <div className="sp-key small"><span><i className="trk-d done" />Done</span><span><i className="trk-d today" />Today</span><span><i className="trk-d late" />Open, catch up</span><span><i className="flag ok" />Checkpoint</span></div>
    </section>

    <section className="result trk-day" aria-labelledby="trk-h">
      <div className="result-h"><h3>Day {day.d}, part {ph.n}: {ph.t}</h3><span className="tag">{day.d === st.day ? "Today, " : ""}{nice(ds.date)}</span></div>
      <div className="trk-body">
        <h2 id="trk-h">{day.t}</h2>
        <p className="muted">{day.goal} <span className="sys">About {day.mins} min</span></p>
        <ul className="trk-tasks">{day.tasks.map((task, i) => { const key = day.d + "." + i, done = ds.tasks[i], manual = !!((trk && trk.tick) || {})[key], link = taskLink(task, O), auto = task.k !== "c" && task.k !== "p";
          return <li key={key} className={done ? "on" : ""}>
            <input type="checkbox" id={"tk-" + key} checked={done} disabled={done && !manual} onChange={(e) => tick(key, e.target.checked)} />
            <label htmlFor={"tk-" + key}>{task.t}{done && !manual && auto ? <span className="tag pass">Done in the platform</span> : null}</label>
            {link ? (link.numbers ? <button type="button" className="btn sm" onClick={toNumbers}>Log</button> : <a className="btn sm" href={link.href}>{task.k === "l" ? "Read" : "Open"}</a>) : null}
          </li>; })}</ul>
        {day.out && <div className="field trk-out"><label htmlFor={"out-" + day.out.k}>{day.out.l}</label>
          <input id={"out-" + day.out.k} inputMode={day.out.num ? "numeric" : undefined} placeholder={day.out.ph} value={trkOut[day.out.k] || ""} onChange={(e) => setOut(day.out.k, e.target.value)} />
          <div className="hint">Saved to your kit below.</div></div>}
        {cp && <div className={"trk-cp" + (cps && cps.passed ? " ok" : "")}>
          <span className="tag">{cps && cps.passed ? "Checkpoint passed" : "Checkpoint"}</span><b>{cp.t}</b><span className="small muted">{cp.need}</span>
          {cp.rule && cp.rule.flag === "client" && <label className="check"><input type="checkbox" checked={!!(trk && trk.flag && trk.flag.client)} onChange={(e) => setFlag("client", e.target.checked)} /> I signed my first client</label>}
          {cp.rule && (cp.rule.convos || cp.rule.booked) ? <span className="sys">So far: {st.convos} conversations, {st.booked} booked</span> : null}
          {!(cps && cps.passed) && day.d <= st.day ? <span className="small">Stuck on this checkpoint? <a href="#/upgrades">A 1:1 strategy call</a> works through it with you.</span> : null}
        </div>}
        <div className="row between trk-nav">
          <button type="button" className="btn sm" disabled={day.d === 1} onClick={() => setSel(day.d - 1)}>Previous day</button>
          <span className={"sys" + (ds.done ? " ok-t" : "")}>{ds.done ? "Day complete" : ds.tasks.filter(Boolean).length + " of " + ds.tasks.length + " tasks done" + (day.out && !ds.outOk ? ", answer still empty" : "")}</span>
          <button type="button" className="btn sm primary" disabled={day.d === TR.days.length} onClick={() => setSel(day.d + 1)}>Next day</button>
        </div>
      </div>
    </section>

    <section id="numbers" className="trk-numbers" aria-labelledby="num-h">
      <div className="section-head"><h2 id="num-h">Your daily outreach numbers</h2><p>Set a daily target for each channel once, then log what you did each day. Your conversations and meetings here count towards the checkpoints.</p></div>
      <DailyNumbers start={st.start} />
    </section>

    <section className="panel">
      <div className="row between"><h2 style={{ margin: 0 }}>Your client-getting kit</h2><button type="button" className="btn sm" onClick={() => copy(kitText)}>Copy all</button></div>
      <p className="muted small">Everything you write in the track, in one place. Use it in your scripts, emails and proposals.</p>
      <dl className="trk-kit">{outs.map((d) => <React.Fragment key={d.out.k}><dt><span className="sys">Day {d.d}</span>{d.out.l}</dt><dd>{trkOut[d.out.k] ? trkOut[d.out.k] : <button type="button" className="linkish muted" onClick={() => setSel(d.d)}>Not written yet. Go to day {d.d}</button>}</dd></React.Fragment>)}</dl>
      <h3>Checkpoints</h3>
      <ul className="trk-cps">{TR.checkpoints.map((c) => { const s = st.checkpoints.find((k) => k.id === c.id); return <li key={c.id}><span className={"tag" + (s && s.passed ? " pass" : "")}>{s && s.passed ? "Passed" : "Day " + c.day}</span><div><b>{c.t}</b><span className="small muted">{c.need}</span></div></li>; })}</ul>
    </section>

    <p className="row"><button type="button" className="btn sm danger" onClick={restart}>{armed ? "Click again to restart from day 1" : "Restart the track"}</button>{armed && <span className="small muted">Your ticks and answers are cleared. Lessons, tools and your outreach log stay as they are.</span>}</p>
  </>;
}
