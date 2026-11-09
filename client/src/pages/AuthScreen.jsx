import React, { useState } from "react";
import { api } from "../api.js";
import { waLink, mailLink, cfg } from "../contact.js";

/* help when a member can't log in: WhatsApp first, email if no number is set */
function HelpLink({ text, subject, children }) {
  const wa = waLink(text), mail = mailLink(subject, text);
  const href = wa || mail; if (!href) return null;
  return <a href={href} target={wa ? "_blank" : undefined} rel={wa ? "noopener" : undefined}>{children || (wa ? "Message us on WhatsApp" : "Email " + cfg().supportEmail)}</a>;
}

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", code: "", teamConsent: false });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [forgot, setForgot] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setErr("Enter a valid email address.");
    if (mode === "register") {
      if (!f.name.trim()) return setErr("Enter your name. It appears on your certificate.");
      if (f.password.length < 10) return setErr("Use a password of at least 10 characters.");
      if (!f.code.trim()) return setErr("Enter the access code from your purchase email or your team manager.");
    } else if (!f.password) return setErr("Enter your password.");
    setBusy(true);
    try {
      const r = mode === "login" ? await api("POST", "/auth/login", { email: f.email, password: f.password }) : await api("POST", "/auth/register", { email: f.email, name: f.name, password: f.password, code: f.code, teamConsent: f.teamConsent });
      onAuthed(r);
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <div className="login">
      <div className="login-side">
        <a className="mark light" href="/site/"><img src="/app/img/logo-light.svg" alt="" width="24" height="24" /><b>The Cold Manual</b></a>
        <div className="login-sheet" aria-hidden="true">
          <div className="ls-head"><b>One prospect, two weeks</b><span>From the manual</span></div>
          <ol>
            <li><span>Day 1</span><b>Email</b><em>A short note about one problem you noticed</em></li>
            <li><span>Day 2</span><b>LinkedIn</b><em>Connection request, one line, no pitch</em></li>
            <li><span>Day 4</span><b>Call</b><em>"I sent you an email on Monday about the missed calls."</em></li>
            <li><span>Day 6</span><b>Video</b><em>60 seconds recorded on their own website</em></li>
            <li><span>Day 9</span><b>Email</b><em>Reply to your first email with one useful idea</em></li>
          </ol>
          <p className="ls-foot">Offer, outreach, appointment setting, closing. Every channel, one conversation.</p>
        </div>
        <p className="small">Need help? <HelpLink text="Hi, I need help with my Cold Manual account." subject="Help with my account" /></p>
      </div>
      <form className="login-form" onSubmit={submit} noValidate>
        <a className="mark light login-top" href="/site/"><img src="/app/img/logo-light.svg" alt="" width="24" height="24" /><b>The Cold Manual</b></a>
        <h1>{mode === "login" ? "Log in" : "Start your training"}</h1>
        <p>{mode === "login" ? "Pick up where you left off. Your progress, notes and tool entries are saved to your account, so they're the same on your phone and your laptop." : "You'll need the access code from your purchase email, or the one your team manager gave you."}</p>
        <div className="seg" role="tablist" aria-label="Log in or create an account">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); setForgot(false); }}>Log in</button>
          <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setErr(""); setForgot(false); }}>Create account</button>
        </div>
        {mode === "register" && <div className="field"><label htmlFor="rn">Your name</label><input id="rn" autoComplete="name" value={f.name} onChange={set("name")} /></div>}
        <div className="field"><label htmlFor="re">Email</label><input id="re" type="email" autoComplete="email" value={f.email} onChange={set("email")} /></div>
        <div className="field"><label htmlFor="rp">Password</label><input id="rp" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} />{mode === "register" && <div className="hint">At least 10 characters.</div>}{mode === "login" && <button type="button" className="linkish small forgot-btn" aria-expanded={forgot} onClick={() => setForgot(!forgot)}>Forgot your password?</button>}</div>
        {mode === "login" && forgot && <div className="forgot" role="region" aria-label="Reset your password">
          <b>We'll reset it for you</b>
          <ol>
            <li>Send us the email address you signed up with.</li>
            <li>We check it's your account and send you a temporary password, usually within a few hours (10am to 10pm Pakistan time).</li>
            <li>Log in with it. You'll be asked to pick a new password straight away.</li>
          </ol>
          <HelpLink text={"Hi, I forgot my password for The Cold Manual. My account email is: " + (f.email.trim() || "")} subject="Forgot my password">{waLink() ? "Message us on WhatsApp" : "Email us"}</HelpLink>
        </div>}
        {mode === "register" && <>
          <div className="field"><label htmlFor="rc">Access code</label><input id="rc" autoComplete="off" value={f.code} onChange={set("code")} placeholder="OSI-XXXX-XXXX" /></div>
          <label className="check"><input type="checkbox" checked={f.teamConsent} onChange={set("teamConsent")} /><span>My code came from my team or employer. I understand my team manager can see my progress, my scores, my 30-day track and daily outreach numbers.</span></label>
        </>}
        <p className="err" role="alert">{err}</p>
        {mode === "register" && <p className="muted small">By creating an account, you agree to our <a href="/site/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="/site/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "One moment..." : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
    </div>
  );
}
