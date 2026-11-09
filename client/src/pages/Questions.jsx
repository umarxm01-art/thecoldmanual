import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { ago } from "../hooks.js";

const KIND = { none: "No answer found", partial: "None of the choices fit", wrong: "Member said the answer didn't help" };

/* Admin > Questions: what members asked that the bank couldn't answer, and the bank itself. */
export default function Questions() {
  const [view, setView] = useState("open"), [d, setD] = useState(null), [err, setErr] = useState("");
  const load = useCallback(() => api("GET", "/admin/questions").then(setD, (e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  if (err) return <p className="err">{err}</p>; if (!d) return <p>Loading...</p>;
  const left = d.bank.total - d.bank.checked;
  return <>
    <div className="kpis">
      <div className="kpi"><div className="v">{d.counts.open}</div><div className="l">questions waiting</div></div>
      <div className="kpi"><div className="v">{d.bank.total}</div><div className="l">answers live</div></div>
      <div className="kpi"><div className="v">{d.bank.checked}</div><div className="l">answers you've checked{left > 0 ? ` (${left} to go)` : ""}</div></div>
      <div className="kpi"><div className="v">{d.bank.added}</div><div className="l">answers you've added</div></div>
    </div>
    <div className="filters" role="group" aria-label="Show" style={{ margin: "16px 0" }}>
      <button type="button" aria-pressed={view === "open"} onClick={() => setView("open")}>Waiting for you</button>
      <button type="button" aria-pressed={view === "bank"} onClick={() => setView("bank")}>Answer bank</button>
    </div>
    {view === "open" ? <Open items={d.items} reload={load} /> : <Bank reload={load} />}
  </>;
}

function Open({ items, reload }) {
  if (!items.length) return <div className="panel"><p style={{ margin: 0 }}>Nothing is waiting. New questions the bank can't answer will show up here, without the member's name.</p></div>;
  return items.map((x) => <OpenItem key={x.id} x={x} reload={reload} />);
}

function OpenItem({ x, reload }) {
  const [q, setQ] = useState(x.q), [a, setA] = useState(x.draft || ""), [lessons, setLessons] = useState(""), [into, setInto] = useState(""), [err, setErr] = useState("");
  const act = async (path, body) => { setErr(""); try { await api("POST", "/admin/questions/" + x.id + "/" + path, body); reload(); } catch (e) { setErr(e.message); } };
  return <div className="panel qa-item">
    <p className="muted small" style={{ marginTop: 0 }}>Asked {x.n} {x.n === 1 ? "time" : "times"}, last {ago(x.last)}. {KIND[x.kind] || ""}</p>
    <div className="field"><label htmlFor={"qq" + x.id}>Question</label><input id={"qq" + x.id} value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="field"><label htmlFor={"qa" + x.id}>Answer{x.draft ? " (AI draft: check every line)" : ""}</label><textarea id={"qa" + x.id} rows={4} value={a} onChange={(e) => setA(e.target.value)} /></div>
    <div className="field"><label htmlFor={"ql" + x.id}>Lessons to link (optional)</label><input id={"ql" + x.id} value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="4.6, 16.7" /></div>
    <p className="err" role="alert">{err}</p>
    <div className="row"><button type="button" className="btn primary sm" onClick={() => act("approve", { q, a, lessons })}>Approve and add</button><button type="button" className="btn sm" onClick={() => act("reject", {})}>Reject</button></div>
    {x.near && x.near.length > 0 && <div className="row" style={{ marginTop: 12, alignItems: "flex-end" }}>
      <div className="field" style={{ marginBottom: 0, flex: "1 1 240px" }}><label htmlFor={"qm" + x.id}>Or treat it as another way of asking</label><select id={"qm" + x.id} value={into} onChange={(e) => setInto(e.target.value)}><option value="">Choose an answer</option>{x.near.map((n) => <option key={n.id} value={n.id}>{n.q}</option>)}</select></div>
      <button type="button" className="btn sm" disabled={!into} onClick={() => act("merge", { into })}>Link to this answer</button>
    </div>}
  </div>;
}

function Bank({ reload }) {
  const [show, setShow] = useState("unchecked"), [q, setQ] = useState(""), [d, setD] = useState(null), [limit, setLimit] = useState(30), [err, setErr] = useState("");
  const load = useCallback(() => api("GET", `/admin/answers?show=${show}&limit=${limit}&q=${encodeURIComponent(q)}`).then(setD, (e) => setErr(e.message)), [show, q, limit]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const changed = () => { load(); reload(); };
  return <>
    <div className="row" style={{ alignItems: "flex-end", marginBottom: 12 }}>
      <div className="field" style={{ marginBottom: 0 }}><label htmlFor="qs">Show</label><select id="qs" value={show} onChange={(e) => setShow(e.target.value)}><option value="unchecked">Not checked yet</option><option value="common">Written by hand</option><option value="added">Added by you</option><option value="hidden">Hidden</option><option value="all">All</option></select></div>
      <div className="field" style={{ marginBottom: 0, flex: "1 1 220px" }}><label htmlFor="qf">Search</label><input id="qf" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    </div>
    {err && <p className="err">{err}</p>}
    {d && <p className="muted small">{d.total} {d.total === 1 ? "answer" : "answers"}</p>}
    {d && d.items.map((x) => <BankItem key={x.id + (x.checked ? "c" : "") + (x.hidden ? "h" : "")} x={x} changed={changed} />)}
    {d && d.total > d.items.length && <button type="button" className="btn sm" onClick={() => setLimit(Math.min(100, limit + 30))} disabled={limit >= 100}>Show more</button>}
  </>;
}

function BankItem({ x, changed }) {
  const [q, setQ] = useState(x.q), [a, setA] = useState(x.a), [alts, setAlts] = useState(x.alts.join("\n")), [err, setErr] = useState("");
  const patch = async (body) => { setErr(""); try { await api("PATCH", "/admin/answers/" + encodeURIComponent(x.id), body); changed(); } catch (e) { setErr(e.message); } };
  return <details className="panel qa-item">
    <summary><b>{x.q}</b>{x.checked && <span className="tag"> Checked</span>}{x.hidden && <span className="tag"> Hidden</span>}<br /><span className="muted small">{x.a.slice(0, 140)}{x.a.length > 140 ? "..." : ""}</span></summary>
    <div style={{ marginTop: 12 }}>
      <div className="field"><label htmlFor={"bq" + x.id}>Question</label><input id={"bq" + x.id} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="field"><label htmlFor={"ba" + x.id}>Answer</label><textarea id={"ba" + x.id} rows={6} value={a} onChange={(e) => setA(e.target.value)} /></div>
      <div className="field"><label htmlFor={"bl" + x.id}>Other ways of asking, one per line</label><textarea id={"bl" + x.id} rows={3} value={alts} onChange={(e) => setAlts(e.target.value)} /></div>
      {x.links.length > 0 && <p className="muted small">Links: {x.links.map((l) => l[1]).join(", ")}</p>}
      <p className="err" role="alert">{err}</p>
      <div className="row"><button type="button" className="btn primary sm" onClick={() => patch({ q, a, alts, checked: true })}>Save and mark checked</button><button type="button" className="btn sm" onClick={() => patch({ hidden: !x.hidden })}>{x.hidden ? "Show to members" : "Hide from members"}</button></div>
    </div>
  </details>;
}
