"use strict";
/* Light and dark mode. Runs in the page head so the right colours are in place before anything paints.
   - Nothing chosen yet: the site follows the visitor's device (the CSS handles that by itself).
   - A visitor taps the sun/moon button: their choice is applied and remembered in this browser. */
(function () {
  var KEY = "theme", root = document.documentElement;
  var COLORS = { dark: "#10131c", light: "#f7f8fb" };

  function saved() { try { var v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : null; } catch (e) { return null; } }
  function system() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
  function current() { return root.getAttribute("data-theme") || system(); }

  function paintMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", COLORS[current()]);
  }

  var choice = saved();
  if (choice) root.setAttribute("data-theme", choice);

  function icon(mode) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "20"); s.setAttribute("height", "20");
    s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    function p(d) { var e = document.createElementNS(ns, "path"); e.setAttribute("d", d); s.appendChild(e); }
    if (mode === "light") { // offering light mode: a sun
      var c = document.createElementNS(ns, "circle"); c.setAttribute("cx", "12"); c.setAttribute("cy", "12"); c.setAttribute("r", "4"); s.appendChild(c);
      p("M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4");
    } else { p("M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"); } // offering dark mode: a moon
    return s;
  }

  function sync(btn) {
    var now = current(), next = now === "light" ? "dark" : "light";
    btn.replaceChildren(icon(next));
    btn.setAttribute("aria-label", "Switch to " + next + " mode");
    btn.setAttribute("title", "Switch to " + next + " mode");
    paintMeta();
  }

  document.addEventListener("DOMContentLoaded", function () {
    paintMeta();
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    sync(btn);
    btn.addEventListener("click", function () {
      var next = current() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      sync(btn);
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: light)");
      var onChange = function () { if (!saved()) sync(btn); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }
  });
})();
