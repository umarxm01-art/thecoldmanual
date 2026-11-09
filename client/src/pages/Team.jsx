import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { ago, fmtDate } from "../hooks.js";

const toast = (m) => window.OSI && window.OSI.ui && window.OSI.ui.toast(m);
function SkillBar({ score }) { const v = score == null ? 0 : Math.max(0, Math.min(100, score)); return <div className="bar" role="img" aria-label={score == null ? "not measured" : v + "%"}><i style={{ width: v + "%" }} /></div>; }
const copy = (t) => (window.OSI && window.OSI.ui ? window.OSI.ui.copy(t) : navigator.clipboard.writeText(t));
const pc = (v) => (v == null ? "–" : v + "%");
const heat = (v) => (v == null ? "heat none" : v >= 70 ? "heat hi" : v >= 40 ? "heat mid" : "heat lo");

/* base is "/org" for a manager, or "/admin/orgs/<id>" when a platform admin opens a team */
export default function Team({ base, admin }) {
  const [d, setD] = useState(null), [err, setErr] = useState(""), [sort, setSort] = useState({ k: "name", dir: 1 }), [open, setOpen] = useState(null), [detail, setDetail] = useState(null), [armed, setArmed] = useState(false), [busy, setBusy] = useState(false);

  const load = useCallback(() => api("GET", base).then(setD, (e) => setErr(e.message)), [base]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!open) { setDetail(null); return; } setDetail(null); setArmed(false); api("GET", base + "/members/" + open).then(setDetail, (e) => { setErr(e.message); setOpen(null); }); }, [open, base]);

  const rows = useMemo(() => {
    if (!d) return [];
    const val = { name: (r) => r.name.toLowerCase(), pct: (r) => r.pct, quiz: (r) => (r.avgQuiz == null ? -1 : r.avgQuiz), rp: (r) => (r.rpAvg == null ? -1 : r.rpAvg), overall: (r) => (r.overall == null ? -1 : r.overall), active: (r) => r.lastActive || 0, drills: (r) => (r.drillAvg == null ? -1 : r.drillAvg), track: (r) => (r.track ? r.track.doneDays * 10 + r.track.passed : -1), sprint: (r) => (r.sprint && r.sprint.pct != null ? r.sprint.pct : -1) }[sort.k];
    return d.members.slice().sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir);
  }, [d, sort]);

  if (err && !d) return <div className="page-head"><h1>Team dashboard</h1><p className="err" role="alert">{err}</p></div>;
  if (!d) return <div className="page-head"><h1>Team dashboard</h1><p>Loading...</p></div>;
  const s = d.summary, th = (k, label) => <th scope="col" aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}><button type="button" className="thb" onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : 1 })}>{label}{sort.k === k ? (sort.dir === 1 ? " ▲" : " ▼") : ""}</button></th>;

  async function rotate() { if (!window.confirm("Make a new join code? The old code stops working.")) return; setBusy(true); try { await api("POST", base + "/code/rotate", {}); await load(); toast("New code ready"); } catch (e) { setErr(e.message); } setBusy(false); }
  async function remove() {
    if (!armed) return setArmed(true);
    try { await api("DELETE", base + "/members/" + open, undefined); setOpen(null); await load(); toast("Removed from the team"); } catch (e) { setErr(e.message); }
  }
  const origin = window.location.origin + "/app/";

  return <>
    <div className="page-head"><h1>{d.org.name}</h1><p>{admin ? <a href="#/admin/teams">All teams</a> : "Team dashboard"}. Progress and practice for everyone on this team.</p></div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="kpis">
      <div className="kpi"><div className="v">{s.members}/{s.seats}</div><div className="l">seats used</div></div>
      <div className="kpi"><div className="v">{pc(s.avgCompletion)}</div><div className="l">average course completion</div></div>
      <div className="kpi"><div className="v">{s.active7}</div><div className="l">active in the last 7 days</div></div>
      <div className="kpi"><div className="v">{s.sprinting ? pc(s.sprintAvg) : "–"}</div><div className="l">{s.sprinting ? s.sprinting + " logging outreach, avg of target" : "nobody logging outreach yet"}</div></div>
      <div className="kpi"><div className="v">{s.sprintBooked || 0}</div><div className="l">meetings booked (logged)</div></div>
    </div>

    <section className="panel"><h2>Invite your team</h2>
      {d.joinCode && !d.joinCode.disabled ? <>
        <p>Share this code and the sign-up address. Each person creates their own account.</p>
        <div className="row"><code className="code">{d.joinCode.code}</code><button className="btn sm" onClick={() => copy(d.joinCode.code)}>Copy code</button><button className="btn sm" onClick={() => copy(origin)}>Copy sign-up address</button><button className="btn sm" disabled={busy} onClick={rotate}>Get a new code</button></div>
        <p className="muted small">{s.seatsLeft} of {s.seats} seats left. People see a notice that you can view their progress before they join.</p>
      </> : <><p>No active join code.</p><button className="btn sm" disabled={busy} onClick={rotate}>Create a join code</button></>}
    </section>

    <div className="row between"><h2 style={{ margin: "8px 0" }}>Members</h2><a className="btn sm" href={"/api" + base + "/export"} download>Download CSV</a></div>
    {d.members.length === 0 ? <div className="panel"><p style={{ margin: 0 }}>Nobody has joined yet. Share the join code above.</p></div> :
      <div className="tbl-wrap"><table className="team">
        <thead><tr>{th("name", "Name")}{th("pct", "Course")}{th("quiz", "Quizzes")}{th("rp", "Roleplay")}{th("track", "30-day track")}{th("drills", "Drills")}{th("sprint", "Outreach")}{th("active", "Last active")}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className={open === r.id ? "sel" : ""}>
          <td><button type="button" className="linkish" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}><b>{r.name}</b></button><div className="muted small">{r.email}</div></td>
          <td><div className="mini"><SkillBar score={r.pct} /><span>{r.done}/{r.total}</span></div></td>
          <td>{pc(r.avgQuiz)}</td><td>{pc(r.rpAvg)}{r.rpRuns ? <span className="muted small"> ({r.rpRuns} runs)</span> : null}</td>          <td>{r.track ? <><b>{r.track.doneDays}/{r.track.total}</b> days<div className="muted small">day {r.track.day} · {r.track.passed}/{r.track.checkpoints} checks{r.track.client ? " · client signed" : ""}</div></> : "–"}</td>
          <td>{pc(r.drillAvg)}</td>
          <td>{r.sprint ? <><b>{pc(r.sprint.pct)}</b><div className="muted small">day {r.sprint.day} · {r.sprint.booked} booked</div></> : "–"}</td>
          <td>{ago(r.lastActive)}</td></tr>)}</tbody></table></div>}

    {open && <section className="panel" aria-live="polite">
      {!detail ? <p>Loading...</p> : <>
        <div className="row between"><h2 style={{ margin: 0 }}>{detail.member.name}</h2><button className="btn sm" onClick={() => setOpen(null)}>Close</button></div>
        <p className="muted small">{detail.member.email} · joined {fmtDate(detail.member.joinedAt)} · last active {ago(detail.member.lastActive)}</p>
        <div className="cols2">
          <div><h3>Course progress</h3>{detail.programs.map((p) => <div className="bar-row" key={p.id}><span>Program {p.id}</span><SkillBar score={p.total ? Math.round(p.done / p.total * 100) : 0} /><b>{p.done}/{p.total}</b></div>)}</div>
        </div>
        <h3>Roleplay results</h3>
        {Object.keys(detail.rp).length === 0 ? <p className="muted">No roleplay runs yet.</p> : <ul className="plain">{detail.scenarios.filter((x) => detail.rp[x.id]).map((x) => <li key={x.id}>{x.title}: best {detail.rp[x.id].best}%, last {detail.rp[x.id].last}%, {detail.rp[x.id].runs} run{detail.rp[x.id].runs === 1 ? "" : "s"}</li>)}</ul>}
        <h3>First client in 30 days</h3>
        {!detail.stats.track ? <p className="muted">Has not started the track.</p> : <div className="kpis">
          <div className="kpi"><div className="v">Day {detail.stats.track.day}</div><div className="l">of {detail.stats.track.total}</div></div>
          <div className="kpi"><div className="v">{detail.stats.track.doneDays}/{detail.stats.track.total}</div><div className="l">days complete</div></div>
          <div className="kpi"><div className="v">{detail.stats.track.passed}/{detail.stats.track.checkpoints}</div><div className="l">checkpoints passed</div></div>
          <div className="kpi"><div className={"v" + (detail.stats.track.behind ? " down" : "")}>{detail.stats.track.behind}</div><div className="l">days behind</div></div>
          <div className="kpi"><div className={"v" + (detail.stats.track.client ? " up" : "")}>{detail.stats.track.client ? "Yes" : "Not yet"}</div><div className="l">first client signed</div></div>
        </div>}
        <h3>Daily outreach numbers</h3>
        {!detail.stats.sprint ? <p className="muted">No outreach logged yet.</p> : <div className="kpis">
          <div className="kpi"><div className="v">Day {detail.stats.sprint.day}</div><div className="l">of 30</div></div>
          <div className="kpi"><div className="v">{pc(detail.stats.sprint.pct)}</div><div className="l">of target so far</div></div>
          <div className="kpi"><div className="v">{detail.stats.sprint.hits}/{detail.stats.sprint.workDays}</div><div className="l">days on target</div></div>
          <div className="kpi"><div className="v">{detail.stats.sprint.streak}</div><div className="l">day streak</div></div>
          <div className="kpi"><div className="v">{detail.stats.sprint.touches}</div><div className="l">touches</div></div>
          <div className="kpi"><div className="v">{detail.stats.sprint.convos}</div><div className="l">conversations</div></div>
          <div className="kpi"><div className="v">{detail.stats.sprint.booked}</div><div className="l">meetings booked</div></div>
        </div>}
        <p className="muted small">Communication drills: {detail.stats.drillAvg == null ? "none yet" : "average " + detail.stats.drillAvg + "% over " + detail.stats.drillRuns + " attempt" + (detail.stats.drillRuns === 1 ? "" : "s")}.</p>
        <button className="btn danger sm" onClick={remove}>{armed ? "Click again to remove from the team" : "Remove from team"}</button>
        {armed && <p className="muted small">They keep their account and progress, and you lose access to it. The seat is freed.</p>}
      </>}
    </section>}
  </>;
}
