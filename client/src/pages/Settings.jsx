import React, { useState } from "react";
import { api } from "../api.js";
import { store } from "../bootstrap.js";

function toast(m) { if (window.OSI && window.OSI.ui) window.OSI.ui.toast(m); }

export default function Settings({ me, setMe }) {
  const [name, setName] = useState(me.user.name), [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState({}), [armed, setArmed] = useState(false);
  const note = (k, v) => setMsg((m) => ({ ...m, [k]: v }));

  async function saveName(e) {
    e.preventDefault(); note("name", "");
    try { const r = await api("PATCH", "/auth/profile", { name }); setMe({ ...me, user: r.user }); store.setName(r.user.name); toast("Saved"); } catch (x) { note("name", x.message); }
  }
  async function savePw(e) {
    e.preventDefault(); note("pw", "");
    try { await api("POST", "/auth/password", pw); setPw({ current: "", next: "" }); toast("Password changed. Other devices were signed out."); } catch (x) { note("pw", x.message); }
  }
  async function signOutAll() { try { await api("POST", "/auth/logout-all", {}); window.location.hash = ""; window.location.reload(); } catch (x) { note("all", x.message); } }
  async function leave() { try { const r = await api("POST", "/auth/leave-team", {}); setMe({ ...me, user: r.user, org: null }); toast("You left the team"); } catch (x) { note("team", x.message); } }
  function download() {
    const blob = new Blob([JSON.stringify(store.all(), null, 2)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "cold-manual-my-data-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function reset() {
    if (!armed) { setArmed(true); return; }
    try { await store.flush(); await api("POST", "/kv/reset", { confirm: "RESET" }); store.hydrate({}, me.user.name, me.user.email); setArmed(false); toast("Progress erased"); } catch (x) { note("reset", x.message); }
  }

  return <>
    <div className="page-head"><h1>Settings</h1></div>
    <form className="panel" onSubmit={saveName}><h2>Your name</h2><p className="muted">Shown on your certificate and to your team manager.</p>
      <div className="field" style={{ maxWidth: 360 }}><label htmlFor="sn">Name</label><input id="sn" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <p className="err" role="alert">{msg.name}</p><button className="btn" type="submit">Save name</button></form>
    <form className="panel" onSubmit={savePw}><h2>Password</h2><p className="muted">Signed in as {me.user.email}. Changing your password signs out your other devices.</p>
      <div className="fields" style={{ maxWidth: 560 }}><div className="field"><label htmlFor="cp">Current password</label><input id="cp" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /><div className="hint">At least 10 characters.</div></div></div>
      <p className="err" role="alert">{msg.pw}</p><button className="btn" type="submit">Change password</button></form>
    {me.org && <div className="panel"><h2>Your team</h2><p>You are part of <b>{me.org.name}</b>. {me.user.role === "manager" ? "You manage this team." : "Your team manager can see your lesson progress, quiz, roleplay and communication drill scores, your progress on the First client in 30 days track and your 30-day daily outreach numbers (touches, conversations and meetings booked). They cannot see your notes, your recordings, your track answers or anything else you type into tools."}</p>
      {me.user.role === "member" && <><p className="err" role="alert">{msg.team}</p><button className="btn" onClick={leave}>Leave this team</button></>}</div>}
    <div className="panel"><h2>Your data</h2><p className="muted">Progress, notes and tool entries are saved to your account.</p>
      <div className="row"><button className="btn" onClick={download}>Download my data</button><button className="btn danger" onClick={reset}>{armed ? "Click again to erase everything" : "Reset all progress"}</button></div>
      <p className="err" role="alert">{msg.reset || (armed ? "This erases progress, notes, skill check and tool entries. It cannot be undone." : "")}</p></div>
    <div className="panel"><h2>Devices</h2><p className="muted">Sign out everywhere if you lost a device or used a shared computer.</p><p className="err" role="alert">{msg.all}</p><button className="btn" onClick={signOutAll}>Sign out of all devices</button></div>
  </>;
}
