import { useEffect, useState } from "react";
import { store } from "./bootstrap.js";

export function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => { const f = () => setHash(window.location.hash); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const path = hash.replace(/^#\/?/, "");
  return { path, seg: path.split("/").filter(Boolean) };
}

/* re-renders when saved progress changes */
export function useStoreVersion() {
  const [v, setV] = useState(0);
  useEffect(() => store.subscribe(() => setV((x) => x + 1)), []);
  return v;
}
export function useSaveStatus() {
  const [s, setS] = useState("saved");
  useEffect(() => store.onStatus(setS), []);
  return s;
}

export function fmtDate(t) { return t ? new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "never"; }
export function ago(t) {
  if (!t) return "never";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 2) return "just now"; if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60); if (h < 24) return h + " h ago";
  const d = Math.floor(h / 24); return d < 31 ? d + " day" + (d === 1 ? "" : "s") + " ago" : fmtDate(t);
}
