import { api } from "./api.js";

/* Replaces the course code's localStorage store. Reads come from memory; writes go to the server a moment later.
   The course code calls get/set/del/all/load, so it needs no changes. */
const SAVE_DELAY = 600, RETRY = 5000;

export function createStore() {
  let cache = {}, name = "", email = "";
  const dirty = new Map(), timers = new Map(), subs = new Set(), statusSubs = new Set();
  let status = "saved", retryTimer = null;

  function setStatus(s) { if (s !== status) { status = s; statusSubs.forEach((f) => f(s)); } }
  function notify(k) { subs.forEach((f) => f(k)); }
  function schedule(k) {
    clearTimeout(timers.get(k)); setStatus("saving");
    timers.set(k, setTimeout(() => flushKey(k), SAVE_DELAY));
  }
  async function flushKey(k) {
    timers.delete(k); if (!dirty.has(k)) return;
    const op = dirty.get(k);
    try {
      if (op === "del") await api("DELETE", "/kv/" + k); else await api("PUT", "/kv/" + k, { value: cache[k] });
      if (dirty.get(k) === op) dirty.delete(k);
      if (!dirty.size && !timers.size) setStatus("saved");
    } catch (e) {
      if (e.status === 401) return;
      if (e.status === 413 || e.status === 409 || e.status === 400) { dirty.delete(k); setStatus("error"); return; } /* the server refused it, so retrying will not help */
      setStatus("offline"); clearTimeout(retryTimer); retryTimer = setTimeout(flushAll, RETRY);
    }
  }
  async function flushAll() { await Promise.all([...dirty.keys()].map((k) => { clearTimeout(timers.get(k)); return flushKey(k); })); }

  const store = {
    get(k, d) {
      if (k === "name") return name || d;
      if (k === "auth") return { email, t: 0 };
      return Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : d;
    },
    set(k, v) { if (k === "auth" || k === "name" || String(k).startsWith("adm_")) return true; cache[k] = v; dirty.set(k, "set"); schedule(k); notify(k); return true; },
    del(k) { if (k === "auth" || k === "name" || String(k).startsWith("adm_")) return; delete cache[k]; dirty.set(k, "del"); schedule(k); notify(k); },
    all() { return JSON.parse(JSON.stringify(cache)); },
    load(o) { Object.keys(o || {}).forEach((k) => store.set(k, o[k])); },
    /* host-only helpers */
    hydrate(data, userName, userEmail) { cache = data || {}; name = userName || ""; email = userEmail || ""; dirty.clear(); timers.forEach(clearTimeout); timers.clear(); setStatus("saved"); notify("*"); },
    setName(n) { name = n; notify("name"); },
    /* server-owned entries (adm_*) arrive from the API and are never written back */
    setServer(k, v) { cache[k] = v; notify(k); },
    reset() { cache = {}; dirty.clear(); timers.forEach(clearTimeout); timers.clear(); name = ""; email = ""; notify("*"); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    onStatus(f) { statusSubs.add(f); f(status); return () => statusSubs.delete(f); },
    flush: flushAll,
    pending() { return dirty.size; }
  };
  /* save what is waiting when the tab is hidden or closed */
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushAll(); });
    window.addEventListener("pagehide", () => { flushAll(); });
  }
  return store;
}
