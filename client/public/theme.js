/* The Cold Manual: theme. Dark by default; light is the viewer's choice and is remembered in this browser. Loaded in <head> so the page never flashes. */
(function () {
  var KEY = "tcm_theme", root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch (e) { return "dark"; } }
  function apply(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "dark" ? "#141415" : "#FAFAFA");
    var bs = document.querySelectorAll("[data-theme-toggle]"); for (var i = 0; i < bs.length; i++) { bs[i].setAttribute("aria-pressed", String(t === "dark")); bs[i].setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme"); bs[i].title = bs[i].getAttribute("aria-label"); }
  }
  function set(t) { try { localStorage.setItem(KEY, t); } catch (e) {} apply(t); }
  window.TCM_THEME = { get: get, set: set, toggle: function () { set(get() === "dark" ? "light" : "dark"); return get(); }, sync: function () { apply(get()); } };
  apply(get());
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-theme-toggle]"); if (b) { e.preventDefault(); window.TCM_THEME.toggle(); } });
  document.addEventListener("DOMContentLoaded", function () { apply(get()); });
})();
