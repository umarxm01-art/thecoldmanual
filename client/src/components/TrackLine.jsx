import React from "react";

/* The 30 days as one ruled line: a tick per day, a diamond at each checkpoint, pen colour for what's done. */
export default function TrackLine({ TR, st }) {
  const days = st.days || [], cps = TR.checkpoints || [], at = st.started ? st.day : 0;
  const passed = (c) => { const s = (st.checkpoints || []).find((k) => k.id === c.id); return !!(s && s.passed); };
  const label = st.started ? "Day " + st.day + " of 30. " + st.doneDays + " days complete, " + st.passed + " of " + cps.length + " checkpoints passed." : "Thirty days with five checkpoints.";
  return <div className="ruler" role="img" aria-label={label}>
    <div className="ruler-ticks">{Array.from({ length: 30 }, (_, i) => { const d = i + 1, c = cps.find((k) => k.day === d), x = days[i];
      return <i key={d} className={[x && x.done ? "done" : "", d === at ? "today" : "", c ? "cp" : "", c && passed(c) ? "passed" : ""].filter(Boolean).join(" ") || undefined} />; })}</div>
    <ol className="ruler-marks">{cps.map((c, i) => <li key={c.id} className={i === cps.length - 1 ? "end" : undefined} style={{ "--at": c.day }}><span>Day {c.day}</span><b>{c.t}</b></li>)}</ol>
  </div>;
}
