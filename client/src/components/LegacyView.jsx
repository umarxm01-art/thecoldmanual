import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";

/* Shows a page built by the course code. The code returns HTML plus an `after` function that attaches its behaviour. */
export default function LegacyView({ name, args, group }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const f = () => setTick((t) => t + 1); window.addEventListener("osi-rerender", f); return () => window.removeEventListener("osi-rerender", f); }, []);
  const key = group + ":" + name + ":" + args.join("/");
  const view = useMemo(() => {
    const O = window.OSI;
    try {
      const fn = group === "views" ? O.views[name] : O.appViews[name];
      let v = null;
      if (fn) v = group === "views" ? fn(args) : name === "p" ? fn(+args[0]) : fn(args.length > 1 && name === "search" ? args.join("/") : args[0], args[1]);
      return v || O.appViews.notFound();
    } catch (e) { console.error(e); return { html: '<div class="page-head"><h1>Something went wrong</h1><p>This page could not be shown. <a href="#/">Go home</a>.</p></div>' }; }
  }, [key, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (view.after) { try { view.after(); } catch (e) { console.error(e); } } }, [view]);
  /* keep the same object between renders: React 19 rewrites the markup whenever it gets a new object, which would wipe anything placed inside it */
  const body = useMemo(() => ({ __html: view.html }), [view]), crumbs = useMemo(() => ({ __html: view.crumbs || "" }), [view]);
  return <>
    {view.crumbs ? <nav className="crumbs" aria-label="Breadcrumb" dangerouslySetInnerHTML={crumbs} /> : null}
    <div dangerouslySetInnerHTML={body} />
  </>;
}
