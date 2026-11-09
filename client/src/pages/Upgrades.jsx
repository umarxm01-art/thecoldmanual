import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { store } from "../bootstrap.js";
import { useStoreVersion, fmtDate } from "../hooks.js";

/* Upsells. For now there is one: the 1:1 strategy call. */
const STAGES = [["not-started", "I haven't started outreach yet"], ["outreach-no-calls", "I'm reaching out but not booking calls"], ["calls-no-closes", "I'm booking calls but not closing"], ["closing", "I'm closing some deals and want more"], ["scaling", "I want to build a team or a system"]];
const SLOTS = [["morning", "Morning (9am to 12pm Pakistan time)"], ["afternoon", "Afternoon (12pm to 5pm)"], ["evening", "Evening (5pm to 10pm)"], ["any", "Any time"]];
const OPEN = ["requested", "paid", "booked"];
const toast = (m) => { if (window.OSI && window.OSI.ui) window.OSI.ui.toast(m); };

export function useCallOffer() {
  const [off, setOff] = useState(null);
  useEffect(() => { let on = true; api("GET", "/offers").then((r) => { if (on) setOff(r.call); }, () => { if (on) setOff({ enabled: false }); }); return () => { on = false; }; }, []);
  return off;
}
export function openCallRequest() { const r = store.get("adm_call", null); return r && OPEN.includes(r.status) ? r : null; }

export default function Upgrades({ seg }) {
  useStoreVersion();
  const off = useCallOffer();
  if (!off) return <p>Loading...</p>;
  if (seg[1] === "call") return <CallForm off={off} />;
  return <>
    <div className="page-head"><h1>Upgrades</h1><p>Extra help for when you want someone to look at your work with you.</p></div>
    <CallOffer off={off} />
  </>;
}

function CallOffer({ off }) {
  const r = store.get("adm_call", null), open = r && OPEN.includes(r.status);
  if (!off.enabled && !open) return <div className="panel"><p style={{ margin: 0 }}>There are no upgrades available right now.</p></div>;
  return <section className="offer" aria-labelledby="call-h">
    <div className="offer-main">
      <h2 id="call-h">1:1 strategy call</h2>
      <p className="offer-lede">{off.minutes} minutes with Umar on a video call, on your offer, your list and your scripts.</p>
      <ul className="offer-list">
        <li>Before the call, we look at what you send us: your offer, a few leads, your opener or email.</li>
        <li>On the call, we find the one thing holding you back and fix it together.</li>
        <li>You leave with a written plan for the next 14 days, and the notes the same day.</li>
      </ul>
      {off.credit && <p className="small muted">If you join the 60-day client acquisition sprint within 14 days, the call fee comes off the sprint price.</p>}
    </div>
    <div className="offer-side">
      <div className="offer-price">{off.price}</div>
      <p className="small muted">One payment, one call</p>
      {open ? null : <a className="btn primary" href="#/upgrades/call">Request a call</a>}
    </div>
    {r && <CallStatus r={r} off={off} />}
  </section>;
}

function CallStatus({ r, off }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const steps = [
    ["requested", "Request sent", "We read it before the call."],
    ["paid", "Payment", r.status === "requested" ? (off.payUrl ? "Pay to confirm your place. We confirm within one working day." : "We'll send you the payment link on WhatsApp within one working day.") : "Paid. Thank you."],
    ["booked", "Book a time", r.when ? "Booked for " + r.when + "." : r.status === "paid" ? "Pick a time that suits you." : "You can pick a time once payment is confirmed."],
    ["done", "Call done", r.status === "done" ? "Your notes and 14-day plan are on the way." : "We send the notes and plan the same day."]
  ];
  const order = ["requested", "paid", "booked", "done"], at = order.indexOf(r.status);
  async function cancel() {
    setBusy(true); setErr("");
    try { const x = await api("POST", "/offers/call/cancel", {}); store.setServer("adm_call", x.request); toast("Request cancelled"); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  if (r.status === "cancelled") return <div className="offer-status"><p className="small muted" style={{ margin: 0 }}>Your last request was cancelled on {fmtDate((r.hist || []).slice(-1)[0].at)}. <a href="#/upgrades/call">Send a new request</a>.</p></div>;
  return <div className="offer-status" aria-label="Your call request">
    <h3>Your request</h3>
    <ol className="steps">
      {steps.map(([k, t, d], i) => <li key={k} className={r.status === "done" || i <= at ? "done" : i === at + 1 ? "now" : ""}>
        <b>{t}</b><span>{d}</span>
        {k === "paid" && r.status === "requested" && off.payUrl && <a className="btn sm primary" href={off.payUrl} target="_blank" rel="noopener noreferrer">Pay {off.price}</a>}
        {k === "booked" && r.status === "paid" && off.bookUrl && <a className="btn sm primary" href={off.bookUrl} target="_blank" rel="noopener noreferrer">Pick a time</a>}
      </li>)}
    </ol>
    {r.note && <p className="small"><b>From us:</b> {r.note}</p>}
    {r.status === "requested" && <p className="small muted">Changed your mind? <button type="button" className="linkish" onClick={cancel} disabled={busy}>Cancel this request</button></p>}
    {err && <p className="err" role="alert">{err}</p>}
  </div>;
}

function CallForm({ off }) {
  const cur = openCallRequest();
  const [f, setF] = useState({ offer: "", stage: "", problem: "", goal: "", whatsapp: "", slot: "any" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (cur) return <><div className="page-head"><h1>1:1 strategy call</h1><p>You already have a request in progress.</p></div><a className="btn" href="#/upgrades">See your request</a></>;
  if (!off.enabled) return <div className="page-head"><h1>1:1 strategy call</h1><p>Calls are not available right now.</p></div>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function send(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const r = await api("POST", "/offers/call", f); store.setServer("adm_call", r.request); toast("Request sent"); window.location.hash = "#/upgrades"; } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return <>
    <div className="crumbs"><a href="#/upgrades">Upgrades</a> / 1:1 strategy call</div>
    <div className="page-head"><h1>Request a 1:1 call</h1><p>Five quick answers so the call starts with your real problem. You pay after we've read them.</p></div>
    <form className="panel call-form" onSubmit={send} noValidate>
      <div className="field"><label htmlFor="cf-offer">What do you sell, and to whom?</label><input id="cf-offer" value={f.offer} onChange={set("offer")} placeholder="AI call answering for plumbers in Texas" maxLength={200} /></div>
      <div className="field"><label htmlFor="cf-stage">Where are you right now?</label><select id="cf-stage" value={f.stage} onChange={set("stage")}><option value="">Choose one</option>{STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      <div className="field"><label htmlFor="cf-problem">What's holding you back?</label><textarea id="cf-problem" value={f.problem} onChange={set("problem")} placeholder="Owners hang up in the first 20 seconds, and my emails get no replies." maxLength={1200} /></div>
      <div className="field"><label htmlFor="cf-goal">What would make this call worth it? <span className="muted">(optional)</span></label><textarea id="cf-goal" value={f.goal} onChange={set("goal")} placeholder="A script I'm confident in and a plan to book my first meetings." maxLength={600} style={{ minHeight: 70 }} /></div>
      <div className="fields">
        <div className="field"><label htmlFor="cf-wa">WhatsApp number</label><input id="cf-wa" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+92 300 1234567" inputMode="tel" maxLength={30} /></div>
        <div className="field"><label htmlFor="cf-slot">Best time for you</label><select id="cf-slot" value={f.slot} onChange={set("slot")}>{SLOTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="row between" style={{ marginTop: 18 }}><span className="small muted">Price: {off.price}, paid after we confirm.</span><button className="btn primary" type="submit" disabled={busy}>{busy ? "Sending..." : "Send request"}</button></div>
    </form>
  </>;
}

/* The one place we suggest the call: on Home, only when the member looks stuck, and never more than once a fortnight. */
export function StuckNudge({ trk }) {
  useStoreVersion();
  if (openCallRequest()) return null;
  const seen = +store.get("up_dismiss", 0) || 0; if (Date.now() - seen < 14 * 86400000) return null;
  let why = "";
  if (trk && trk.started && trk.behind >= 3) why = "You're " + trk.behind + " days behind on your 30-day plan.";
  else if (trk && trk.started && trk.day >= 14 && trk.booked === 0) why = "Two weeks in and no meetings booked yet.";
  else if (trk && trk.started && window.OSI.TRACK) { const late = (window.OSI.TRACK.checkpoints || []).find((c) => trk.day >= c.day + 3 && !((trk.checkpoints || []).find((k) => k.id === c.id) || {}).passed); if (late) why = "Your \u201c" + late.t + "\u201d checkpoint was due on day " + late.day + "."; }
  if (!why) return null;
  return <div className="nudge" role="note">
    <div><b>{why}</b> <span>A 1:1 strategy call finds what's holding you back and gives you a 14-day plan.</span></div>
    <div className="row"><a className="btn sm primary" href="#/upgrades">See the 1:1 call</a><button type="button" className="btn sm" onClick={() => store.set("up_dismiss", Date.now())}>Not now</button></div>
  </div>;
}
