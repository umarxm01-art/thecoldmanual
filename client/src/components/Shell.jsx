import React, { useEffect, useRef, useState } from "react";
import { store } from "../bootstrap.js";
import { useRoute, useSaveStatus, useStoreVersion } from "../hooks.js";
import LegacyView from "./LegacyView.jsx";
import Home from "../pages/Home.jsx";
import Settings from "../pages/Settings.jsx";
import Team from "../pages/Team.jsx";
import Admin from "../pages/Admin.jsx";
import Track from "../pages/Track.jsx";
import Upgrades from "../pages/Upgrades.jsx";
import { trackStats } from "../../../shared/skills.mjs";

const APP_VIEWS = ["programs", "pillar", "p", "l", "playbooks", "pb", "tools", "t", "search", "cert"];
const LAB_VIEWS = ["ask", "roleplay", "rp", "rpai", "review", "drills", "drill", "niches", "niche", "prompts"];
const OWN_TOOLS = ["objections"];

function Page({ seg, me, setMe }) {
  const k = seg[0] || "";
  if (k === "") return <Home />;
  if (k === "track") return <Track />;
  if (k === "upgrades") return <Upgrades seg={seg} />;
  if (k === "settings") return <Settings me={me} setMe={setMe} />;
  if (k === "team") return me.user.role === "manager" ? <Team base="/org" /> : <NotAllowed />;
  if (k === "admin") return me.user.role === "admin" ? <Admin seg={seg} /> : <NotAllowed />;
  if (APP_VIEWS.includes(k)) return <LegacyView group="app" name={k} args={seg.slice(1)} />;
  if (LAB_VIEWS.includes(k)) return <LegacyView group="views" name={k} args={seg.slice(1)} />;
  return <LegacyView group="app" name="notFound" args={[]} />;
}
function NotAllowed() { return <div className="page-head"><h1>Not available</h1><p>You do not have access to this page. <a href="#/">Go home</a>.</p></div>; }

export default function Shell({ me, setMe, onLogout }) {
  const { path, seg } = useRoute(), mainRef = useRef(null), [open, setOpen] = useState(false);
  useStoreVersion();
  const status = useSaveStatus(), O = window.OSI, cur = seg[0] || "", role = me.user.role;
  const done = store.get("done", {}), dn = O.L.filter((l) => done[l.id]).length, trk = trackStats(store.all(), O.TRACK);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); if (mainRef.current) mainRef.current.focus({ preventScroll: true }); }, [path]);
  useEffect(() => { if (window.TCM_THEME) window.TCM_THEME.sync(); }, []);
  useEffect(() => { const f = (e) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); }, []);

  const cp = (on) => (on ? { "aria-current": "page" } : {});
  /* the pillar of the module or lesson on screen, so its pillar stays highlighted in the menu */
  const modHere = cur === "p" ? +seg[1] : cur === "l" ? ((O.L.find((l) => l.id === seg[1]) || {}).p) : null, pillarHere = modHere && O.pillarOfModule ? O.pillarOfModule(modHere).k : null;
  const progOf = (id) => { const ls = O.L.filter((l) => l.p === id); return ls.filter((l) => done[l.id]).length + "/" + ls.length; };
  const name = me.user.name || "Member", statusText = { saved: "", saving: "Saving...", offline: "Offline. Changes will sync.", error: "Could not save one entry." }[status];

  return (
    <div className="app">
      <aside className={"rail" + (open ? " open" : "")} id="rail" aria-label="Main">
        <a className="mark light" href="#/"><img src="/app/img/logo-light.svg" alt="" width="32" height="32" /><b>The Cold Manual</b></a>
        <nav>
          <a href="#/" {...cp(cur === "")}><span>Today</span></a>
          <a href="#/track" {...cp(cur === "track")}><span>First client in 30 days</span><span className="n">{trk.started ? "Day " + trk.day : "Start"}</span></a>
          <h5>The four pillars</h5>
          {(O.PILLARS || []).map((x) => { const ls = O.L.filter((l) => x.mods.includes(l.p)), n = ls.filter((l) => done[l.id]).length, here = cur === "pillar" && seg[1] === x.k || ((cur === "p" || cur === "l") && pillarHere === x.k);
            return <a key={x.k} href={"#/pillar/" + x.k} {...cp(here)} className="pill"><span><i className="pn" dangerouslySetInnerHTML={{ __html: O.pillarIcon ? O.pillarIcon(x.k) : "" }} />{x.t}</span><span className="n">{n}/{ls.length}</span></a>; })}
          <a href="#/programs" {...cp(cur === "programs")}><span>All modules</span><span className="n">{dn}/{O.L.length}</span></a>
          <h5>Practise</h5>
          <a href="#/roleplay" {...cp(["roleplay", "rp", "rpai"].includes(cur))}><span>Roleplay lab</span></a>
          <a href="#/drills" {...cp(cur === "drills" || cur === "drill")}><span>Communication drills</span></a>
          <a href="#/review" {...cp(cur === "review")}><span>Call and email review</span></a>
          <a href="#/playbooks" {...cp(cur === "playbooks" || cur === "pb")}><span>Playbooks</span></a>
          <a href="#/t/objections" {...cp(path === "t/objections")}><span>Objection bank</span></a>
          <h5>Library</h5>
          <a href="#/tools" {...cp(cur === "tools" || (cur === "t" && !OWN_TOOLS.includes(seg[1])))}><span>Tools</span></a>
          <a href="#/niches" {...cp(cur === "niches" || cur === "niche")}><span>Niche packs</span></a>
          <a href="#/prompts" {...cp(cur === "prompts")}><span>Prompt library</span></a>
          {(role === "manager" || role === "admin") && <h5>Manage</h5>}
          {role === "manager" && <a href="#/team" {...cp(cur === "team")}><span>Team dashboard</span></a>}
          {role === "admin" && <a href="#/admin" {...cp(cur === "admin")}><span>Admin</span></a>}
          <h5>Get help</h5>
          <a href="#/ask" {...cp(cur === "ask")}><span>Ask the manual</span> <span className="tag beta-tag">Beta</span></a>
          {role === "member" && <a href="#/upgrades" {...cp(cur === "upgrades")}><span>1:1 strategy call</span></a>}
          <h5>Account</h5>
          <a href="#/cert" {...cp(cur === "cert")}><span>Certificate</span></a>
          <a href="#/settings" {...cp(cur === "settings")}><span>Settings</span></a>
        </nav>
        <div className="rail-foot">{dn} of {O.L.length} lessons done<div className="bar" aria-hidden="true"><i style={{ width: Math.round(dn / Math.max(1, O.L.length) * 100) + "%" }} /></div></div>
      </aside>
      <div>
        <a className="sr" href="#main">Skip to content</a>
        <header className="topbar">
          <button type="button" className="btn sm menu" aria-label="Open menu" aria-expanded={open} aria-controls="rail" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          </button>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); const q = e.currentTarget.elements.q.value.trim(); if (q) window.location.hash = "#/search/" + encodeURIComponent(q); }}>
            <label className="sr" htmlFor="sq">Search the platform</label>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.6" /><path d="M10.5 10.5 14 14" /></svg>
            <input id="sq" name="q" type="search" placeholder="Search" autoComplete="off" />
          </form>
          <span className="spacer" />
          <span className={"savestate " + status} role="status" aria-live="polite">{statusText}</span>
          <button type="button" className="btn sm theme-btn" data-theme-toggle aria-label="Switch to light theme" title="Switch to light theme"><svg className="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7Z" /></svg><svg className="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.4" /><path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3" /></svg></button>
          <div className="me"><span className="nm">{name}</span><span className="av" aria-hidden="true">{(name.trim().charAt(0) || "M").toUpperCase()}</span><button type="button" className="btn sm" onClick={onLogout}>Log out</button></div>
        </header>
        <main className="main" id="main" tabIndex="-1" ref={mainRef} key={path}>
          <Page seg={seg} me={me} setMe={setMe} />
        </main>
      </div>
    </div>
  );
}
