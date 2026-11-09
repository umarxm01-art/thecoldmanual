import React, { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import LegacyView from "../components/LegacyView.jsx";
import NextMoves from "../components/NextMoves.jsx";

/* The course home page, with the personalised path placed where the course code leaves a slot for it.
   The course code swaps its markup when it redraws, so the slot is looked up again after each redraw. */
export default function Home() {
  const [slot, setSlot] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const f = () => setTick((t) => t + 1); window.addEventListener("osi-rerender", f); return () => window.removeEventListener("osi-rerender", f); }, []);
  useLayoutEffect(() => { setSlot(document.getElementById("next-moves")); }, [tick]);
  return <>
    <LegacyView group="app" name="home" args={[]} />
    {slot ? createPortal(<NextMoves />, slot) : null}
  </>;
}
