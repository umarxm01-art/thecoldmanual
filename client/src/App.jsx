import React, { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { applyContent, store } from "./bootstrap.js";
import AuthScreen from "./pages/AuthScreen.jsx";
import Shell from "./components/Shell.jsx";
import NewPassword from "./pages/NewPassword.jsx";

export default function App() {
  const [phase, setPhase] = useState("boot"); /* boot, auth, loading, ready, error */
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  const toAuth = useCallback(() => { store.reset(); setMe(null); setPhase("auth"); }, []);

  useEffect(() => {
    api("GET", "/auth/me").then((r) => { setMe(r); setPhase("loading"); }, (e) => { if (e.status === 401) setPhase("auth"); else { setError(e.message); setPhase("error"); } });
  }, []);
  useEffect(() => { const f = () => toAuth(); window.addEventListener("osi-unauth", f); return () => window.removeEventListener("osi-unauth", f); }, [toAuth]);

  useEffect(() => {
    if (phase !== "loading" || !me) return;
    let live = true;
    Promise.all([api("GET", "/content"), api("GET", "/kv"), api("GET", "/ai/status").catch(() => ({ enabled: false }))]).then(([c, k, ai]) => {
      if (!live) return;
      applyContent(c); store.hydrate(k.data, me.user.name, me.user.email); window.OSI.ai.configure(ai); setPhase("ready");
    }, (e) => { if (!live) return; if (e.status !== 401) { setError(e.message); setPhase("error"); } });
    return () => { live = false; };
  }, [phase, me]);

  async function logout() { try { await store.flush(); await api("POST", "/auth/logout", {}); } catch (e) { /* signing out locally is enough */ } window.location.hash = ""; toAuth(); }

  if (phase === "boot" || phase === "loading") return <div className="boot" role="status">Loading your training...</div>;
  if (phase === "error") return <div className="boot"><p>{error}</p><button className="btn" onClick={() => window.location.reload()}>Try again</button></div>;
  if (phase === "auth") return <AuthScreen onAuthed={(r) => { setMe(r); setPhase("loading"); }} />;
  if (me && me.user.mustChangePassword) return <NewPassword me={me} onLogout={logout} onDone={() => setMe({ ...me, user: { ...me.user, mustChangePassword: false } })} />;
  return <Shell me={me} setMe={setMe} onLogout={logout} />;
}
