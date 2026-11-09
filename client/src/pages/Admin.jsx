import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { ago, fmtDate } from "../hooks.js";
import Team from "./Team.jsx";
import Questions from "./Questions.jsx";

const copy = (t) => (window.OSI && window.OSI.ui ? window.OSI.ui.copy(t) : navigator.clipboard.writeText(t));
const TABS = [["", "Overview"], ["questions", "Questions"], ["calls", "Call requests"], ["codes", "Access codes"], ["users", "Members"], ["teams", "Teams"]];

export default function Admin({ seg }) {
  const tab = seg[1] || "";
  if (tab === "team" && seg[2]) return <Team base={"/admin/orgs/" + seg[2]} admin />;
  return <>
    <div className="page-head"><h1>Admin</h1><p>Questions, codes, members and teams.</p></div>
    <nav className="tabs" aria-label="Admin sections">{TABS.map(([k, l]) => <a key={k} href={"#/admin" + (k ? "/" + k : "")} aria-current={tab === k ? "page" : undefined}>{l}</a>)}</nav>
    {tab === "" && <Overview />}{tab === "questions" && <Questions />}{tab === "calls" && <Calls />}{tab === "codes" && <Codes />}{tab === "users" && <Users />}{tab === "teams" && <Teams />}
  </>;
}

function useLoad(path) {
  const [d, setD] = useState(null), [err, setErr] = useState("");
  const load = useCallback(() => api("GET", path).then(setD, (e) => setErr(e.message)), [path]);
  useEffect(() => { load(); }, [load]);
  return [d, load, err, setErr];
}

function Overview() {
  const [s, , err] = useLoad("/admin/stats");
  if (err) return <p className="err">{err}</p>; if (!s) return <p>Loading...</p>;
  return <div className="kpis">{[["users", "accounts"], ["members", "learners"], ["managers", "team managers"], ["orgs", "teams"]].map(([k, l]) => <div className="kpi" key={k}><div className="v">{s[k]}</div><div className="l">{l}</div></div>)}
    <div className="kpi"><div className="v">{s.codes.active}</div><div className="l">active codes ({s.codes.uses} uses)</div></div></div>;
}

function Codes() {
  const [d, load, err, setErr] = useLoad("/admin/codes"), [f, setF] = useState({ count: 1, maxUses: 1, note: "", expiresAt: "" }), [made, setMade] = useState([]);
  async function create(e) {
    e.preventDefault(); setErr("");
    try { const r = await api("POST", "/admin/codes", { count: +f.count, maxUses: +f.maxUses, note: f.note, expiresAt: f.expiresAt || undefined }); setMade(r.codes.map((c) => c.code)); load(); } catch (x) { setErr(x.message); }
  }
  async function toggle(c) { try { await api("PATCH", "/admin/codes/" + c.id, { disabled: !c.disabled }); load(); } catch (x) { setErr(x.message); } }
  return <>
    <form className="panel" onSubmit={create}><h2>Make codes</h2>
      <div className="fields"><div className="field"><label htmlFor="cc">How many codes</label><input id="cc" type="number" min="1" max="200" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></div>
        <div className="field"><label htmlFor="cm">Uses per code</label><input id="cm" type="number" min="1" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} /><div className="hint">1 for a single buyer</div></div>
        <div className="field"><label htmlFor="cn">Note</label><input id="cn" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Launch batch" /></div>
        <div className="field"><label htmlFor="ce">Expires (optional)</label><input id="ce" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div></div>
      <p className="err" role="alert">{err}</p><button className="btn primary" type="submit">Make codes</button>
      {made.length > 0 && <div style={{ marginTop: 14 }}><textarea readOnly rows={Math.min(8, made.length + 1)} value={made.join("\n")} aria-label="New codes" style={{ width: "100%" }} /><button type="button" className="btn sm" onClick={() => copy(made.join("\n"))}>Copy all</button></div>}
    </form>
    {d && <div className="tbl-wrap"><table><thead><tr><th>Code</th><th>Used</th><th>Note</th><th>Status</th><th></th></tr></thead><tbody>
      {d.codes.filter((c) => !c.orgId).map((c) => <tr key={c.id}><td><code>{c.code}</code></td><td>{c.uses}/{c.maxUses}</td><td>{c.note}{c.expiresAt ? <span className="muted small"> · expires {fmtDate(c.expiresAt)}</span> : null}</td><td>{c.disabled ? "Disabled" : c.uses >= c.maxUses ? "Used up" : "Active"}</td><td><button className="btn sm" onClick={() => copy(c.code)}>Copy</button> <button className="btn sm" onClick={() => toggle(c)}>{c.disabled ? "Enable" : "Disable"}</button></td></tr>)}
    </tbody></table></div>}
    <p className="muted small">Team join and manager codes are created with each team and are not listed here.</p>
  </>;
}

function Users() {
  const [q, setQ] = useState(""), [d, setD] = useState(null), [err, setErr] = useState(""), [temp, setTemp] = useState(null), [armed, setArmed] = useState(null), [refund, setRefund] = useState(null);
  const load = useCallback(() => api("GET", "/admin/users?limit=100&q=" + encodeURIComponent(q)).then(setD, (e) => setErr(e.message)), [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  async function act(fn) { setErr(""); try { await fn(); load(); } catch (x) { setErr(x.message); } }
  return <>
    <div className="field" style={{ maxWidth: 360 }}><label htmlFor="uq">Search by name or email</label><input id="uq" type="search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <p className="err" role="alert">{err}</p>
    {temp && (() => { const msg = "Your temporary password for The Cold Manual is " + temp.pw + " . Log in at " + window.location.origin + "/app/ with " + temp.email + " and you'll be asked to pick a new password straight away."; return <div className="callout warn"><b>Temporary password for {temp.email}</b><p><code>{temp.pw}</code> <button className="btn sm" onClick={() => copy(temp.pw)}>Copy password</button></p><p className="small">Message to send them on WhatsApp:</p><p className="small"><q>{msg}</q> <button className="btn sm" onClick={() => copy(msg)}>Copy message</button></p><p className="small muted">Only send it to the number or email you already know is theirs. It is shown once. They must pick a new password when they log in, and their other devices are signed out.</p></div>; })()}
    {d && <><p className="muted small">{d.total} account{d.total === 1 ? "" : "s"}</p><div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Last login</th><th></th></tr></thead><tbody>
      {d.users.map((u) => <tr key={u.id}><td><b>{u.name}</b><div className="muted small">{u.email}</div></td><td>{u.role}{u.disabled ? " (disabled)" : ""}</td><td>{ago(u.lastLoginAt)}</td>
        <td><button className="btn sm" onClick={() => act(() => api("PATCH", "/admin/users/" + u.id, { disabled: !u.disabled }))}>{u.disabled ? "Enable" : "Disable"}</button>{" "}
          <button className="btn sm" onClick={() => act(async () => { const r = await api("POST", "/admin/users/" + u.id + "/reset-password", {}); setTemp({ email: u.email, pw: r.tempPassword }); })}>Reset password</button>{" "}
          <button className="btn sm" onClick={() => act(async () => { const r = await api("GET", "/admin/users/" + u.id + "/refund-check"); setRefund({ id: u.id, r }); })}>Refund check</button>{" "}
          <button className="btn sm danger" onClick={() => armed === u.id ? (setArmed(null), act(() => api("DELETE", "/admin/users/" + u.id))) : setArmed(u.id)}>{armed === u.id ? "Confirm delete" : "Delete"}</button>
          {refund && refund.id === u.id && <p className="small" role="status" style={{ marginBottom: 0 }}>Joined {fmtDate(refund.r.joinedAt)}. {refund.r.started ? `Plan started ${refund.r.start}. Days 1 to 14: ${refund.r.done} of ${refund.r.of} complete.${refund.r.notDone.length ? " Not complete: " + refund.r.notDone.join(", ") + "." : ""}` : "The 30-day plan hasn't been started."}</p>}</td></tr>)}
    </tbody></table></div></>}
  </>;
}

function Teams() {
  const [d, load, err, setErr] = useLoad("/admin/orgs"), [f, setF] = useState({ name: "", seats: 10, managerEmail: "" }), [made, setMade] = useState(null), [armed, setArmed] = useState(null);
  async function create(e) {
    e.preventDefault(); setErr(""); setMade(null);
    try { const r = await api("POST", "/admin/orgs", { name: f.name, seats: +f.seats, managerEmail: f.managerEmail }); setMade(r); setF({ name: "", seats: 10, managerEmail: "" }); load(); } catch (x) { setErr(x.message); }
  }
  return <>
    <form className="panel" onSubmit={create}><h2>New team</h2>
      <div className="fields"><div className="field"><label htmlFor="tn">Team name</label><input id="tn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="ts">Learner seats</label><input id="ts" type="number" min="1" value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} /></div>
        <div className="field"><label htmlFor="tm">Manager email</label><input id="tm" type="email" value={f.managerEmail} onChange={(e) => setF({ ...f, managerEmail: e.target.value })} /><div className="hint">If they already have an account they become the manager. Otherwise you get a one-use manager code.</div></div></div>
      <p className="err" role="alert">{err}</p><button className="btn primary" type="submit">Create team</button>
      {made && <div className="callout" style={{ marginTop: 14 }}><b>{made.org.name} is ready</b><p>Learner join code: <code>{made.joinCode}</code> <button type="button" className="btn sm" onClick={() => copy(made.joinCode)}>Copy</button></p>
        {made.managerCode ? <p>Manager code (one use): <code>{made.managerCode}</code> <button type="button" className="btn sm" onClick={() => copy(made.managerCode)}>Copy</button></p> : <p>The manager's existing account now has the team dashboard.</p>}</div>}
    </form>
    {d && <div className="tbl-wrap"><table><thead><tr><th>Team</th><th>Seats</th><th>Join code</th><th>Managers</th><th></th></tr></thead><tbody>
      {d.orgs.map((o) => <tr key={o.id}><td><b>{o.name}</b><div className="muted small">Created {fmtDate(o.createdAt)}</div></td><td>{o.members}/{o.seats}</td><td><code>{o.joinCode}</code></td><td>{o.managers.map((m) => m.email).join(", ") || "none yet"}</td>
        <td><a className="btn sm" href={"#/admin/team/" + o.id}>Open</a>{" "}
          <button className="btn sm" onClick={async () => { const s = window.prompt("Seats for " + o.name, o.seats); if (s) try { await api("PATCH", "/admin/orgs/" + o.id, { seats: +s }); load(); } catch (x) { setErr(x.message); } }}>Seats</button>{" "}
          <button className="btn sm danger" onClick={async () => { if (armed !== o.id) return setArmed(o.id); setArmed(null); try { await api("DELETE", "/admin/orgs/" + o.id); load(); } catch (x) { setErr(x.message); } }}>{armed === o.id ? "Confirm delete" : "Delete"}</button></td></tr>)}
    </tbody></table></div>}
  </>;
}

const STAGE = { "not-started": "Not started outreach", "outreach-no-calls": "Reaching out, no calls", "calls-no-closes": "Calls, no closes", closing: "Closing some deals", scaling: "Building a team or system" };
const ST = [["requested", "Requested"], ["paid", "Paid"], ["booked", "Booked"], ["done", "Done"], ["cancelled", "Cancelled"]];
function Calls() {
  const [f, setF] = useState(""), [d, load, err, setErr] = useLoad("/admin/requests" + (f ? "?status=" + f : ""));
  async function patch(r, body) { setErr(""); try { await api("PATCH", "/admin/requests/" + r.uid, body); load(); } catch (x) { setErr(x.message); } }
  const list = d ? d.requests : null;
  return <>
    <div className="filters" role="group" aria-label="Filter by status">{[["", "All"]].concat(ST).map(([k, l]) => <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
    {err && <p className="err" role="alert">{err}</p>}
    {!list ? <p>Loading...</p> : !list.length ? <div className="panel"><p style={{ margin: 0 }}>No call requests{f ? " with this status" : " yet"}. They appear here when a member sends one from Upgrades.</p></div> :
      list.map((r) => <div className="panel req" key={r.uid}>
        <div className="row between"><div><b>{r.name}</b> <span className="muted small">{r.email}, sent {fmtDate(r.at)}</span></div>
          <select aria-label={"Status for " + r.name} value={r.status} onChange={(e) => patch(r, { status: e.target.value })} style={{ width: "auto" }}>{ST.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <dl className="req-form">
          <dt>Sells</dt><dd>{r.form.offer}</dd>
          <dt>Stage</dt><dd>{STAGE[r.form.stage] || r.form.stage}</dd>
          <dt>Holding them back</dt><dd>{r.form.problem}</dd>
          {r.form.goal && <><dt>Wants from the call</dt><dd>{r.form.goal}</dd></>}
          <dt>WhatsApp</dt><dd><a href={"https://wa.me/" + r.form.whatsapp.replace(/[^0-9]/g, "")} target="_blank" rel="noopener noreferrer">{r.form.whatsapp}</a> <button type="button" className="btn sm" onClick={() => copy(r.form.whatsapp)}>Copy</button></dd>
          <dt>Best time</dt><dd>{{ morning: "Morning (9am to 12pm PKT)", afternoon: "Afternoon (12pm to 5pm PKT)", evening: "Evening (5pm to 10pm PKT)", any: "Any time" }[r.form.slot] || r.form.slot}</dd>
        </dl>
        <div className="fields">
          <div className="field"><label htmlFor={"w-" + r.uid}>Booked for</label><input id={"w-" + r.uid} defaultValue={r.when || ""} placeholder="Tue 4 Nov, 7pm PKT" onBlur={(e) => e.target.value !== (r.when || "") && patch(r, { when: e.target.value })} /></div>
          <div className="field"><label htmlFor={"n-" + r.uid}>Note to the member</label><input id={"n-" + r.uid} defaultValue={r.note || ""} placeholder="Shown on their Upgrades page" onBlur={(e) => e.target.value !== (r.note || "") && patch(r, { note: e.target.value })} /></div>
        </div>
      </div>)}
  </>;
}
