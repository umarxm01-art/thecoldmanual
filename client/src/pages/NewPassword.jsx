import React, { useState } from "react";
import { api } from "../api.js";

/* Shown after logging in with a temporary password from the admin: the member picks their own before going further. */
export default function NewPassword({ me, onDone, onLogout }) {
  const [f, setF] = useState({ current: "", next: "", again: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setErr("");
    if (!f.current) return setErr("Enter the temporary password we sent you.");
    if (f.next.length < 10) return setErr("Use a password of at least 10 characters.");
    if (f.next !== f.again) return setErr("The two new passwords don't match.");
    if (f.next === f.current) return setErr("Pick a new password, not the temporary one.");
    setBusy(true);
    try { await api("POST", "/auth/password", { current: f.current, next: f.next }); onDone(); }
    catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <div className="login single">
      <form className="login-form" onSubmit={submit} noValidate>
        <a className="mark light login-top" href="/site/"><img src="/app/img/logo-light.svg" alt="" width="24" height="24" /><b>The Cold Manual</b></a>
        <h1>Pick a new password</h1>
        <p>You logged in with a temporary password. Choose your own now so only you know it. Your progress is safe.</p>
        <div className="field"><label htmlFor="np-cur">Temporary password</label><input id="np-cur" type="password" autoComplete="current-password" value={f.current} onChange={set("current")} /></div>
        <div className="field"><label htmlFor="np-new">New password</label><input id="np-new" type="password" autoComplete="new-password" value={f.next} onChange={set("next")} /><div className="hint">At least 10 characters.</div></div>
        <div className="field"><label htmlFor="np-again">New password again</label><input id="np-again" type="password" autoComplete="new-password" value={f.again} onChange={set("again")} /></div>
        <p className="err" role="alert">{err}</p>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "One moment..." : "Save and continue"}</button>
        <p className="muted small">Signed in as {me.user.email}. <button type="button" className="linkish" onClick={onLogout}>Log out</button></p>
      </form>
    </div>
  );
}
