"use strict";
/* Interactive effects. Cheap by design: pointer work runs at most once per frame, only on the hovered card,
   only for mouse users; everything else is CSS. Reduced-motion visitors get none of it. */
(function () {
  const root = document.documentElement;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  if (cores <= 2 || mem <= 2 || (navigator.connection && navigator.connection.saveData)) root.classList.add("fx-lite");
  const lite = root.classList.contains("fx-lite");
  const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hero = document.querySelector(".hero");

  /* ---- circuit lines: tag a few extra signal lines and twinkling nodes (marked here to keep the HTML small) ---- */
  const sigs = [...document.querySelectorAll(".hero__net .sig")];
  sigs.forEach((l, i) => { if (i % 3 === 1) l.classList.add("s2"); if (i % 3 === 2) l.classList.add("s3"); });
  document.querySelectorAll(".hero__net circle").forEach((c, i) => { if (i % 4 === 0) c.classList.add("pulse"); });

  /* ---- hero chat pops up once the page has loaded (after the logo screen) ---- */
  function live() {
    if (!hero || hero.classList.contains("is-live")) return;
    hero.classList.add("is-live");
    window.dispatchEvent(new Event("nf:live"));
  }
  const afterLoad = () => setTimeout(live, 700);
  if (document.readyState === "complete") afterLoad(); else addEventListener("load", afterLoad, { once: true });
  setTimeout(live, 3000); // never leave the chat hidden

  /* ---- pause the hero animation when it is off screen ---- */
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(es => es.forEach(e => hero.classList.toggle("is-paused", !e.isIntersecting))).observe(hero);
  }

  /* ---- scroll reveal ---- */
  const targets = document.querySelectorAll("#how .split__head, #how li, #pricing .plan, #pricing .split__head, #faq details, .band > *, #contact .split > *");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    targets.forEach((t, i) => { t.classList.add("fx-r"); t.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(t); });
  }

  /* ---- 3D tilt (mouse only, skipped on low-power devices) ---- */
  if (mouse && !lite) {
    root.classList.add("fx-tilt-on");
    let el = null, ev = null, raf = 0;
    const MAX = 7;
    function paint() {
      raf = 0; if (!el || !ev) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((x - 0.5) * 2 * MAX).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y) * 2 * MAX).toFixed(2) + "deg");
      el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }
    function reset(t) { t.classList.remove("is-tilting"); t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); }
    document.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      const t = e.target.closest && e.target.closest("[data-tilt]");
      if (t !== el) { if (el) reset(el); el = t; if (el) el.classList.add("is-tilting"); }
      if (!el) return;
      ev = e; if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener("pointerleave", () => { if (el) { reset(el); el = null; } }, true);
  }

  /* ---- hero parallax (mouse only) ---- */
  if (hero && mouse && !lite) {
    hero.classList.add("fx-parallax");
    let raf = 0, px = 0, py = 0;
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; hero.style.setProperty("--px", px.toFixed(3)); hero.style.setProperty("--py", py.toFixed(3)); });
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { hero.style.setProperty("--px", 0); hero.style.setProperty("--py", 0); });
  }

  /* ---- click effect: ripple on every button, a small burst on the demo buttons ---- */
  const burst = (x, y) => {
    const n = lite ? 6 : 12, frag = document.createDocumentFragment(), made = [];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span"), a = (i / n) * Math.PI * 2 + Math.random() * 0.5, d = 46 + Math.random() * 44;
      s.className = "fx-spark"; s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
      frag.append(s); made.push(s);
    }
    document.body.append(frag);
    setTimeout(() => made.forEach(s => s.remove()), 800);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".btn, .plan .btn, #contact button[type=submit]");
    if (!b) return;
    const r = b.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
    const rp = document.createElement("span"); rp.className = "fx-ripple";
    rp.style.left = x - r.left + "px"; rp.style.top = y - r.top + "px";
    b.append(rp); setTimeout(() => rp.remove(), 700);
    if (/demo/i.test(b.textContent) || b.getAttribute("href") === "#contact") {
      burst(x, y);
      b.classList.remove("is-sent"); void b.offsetWidth; b.classList.add("is-sent");
    }
  });
})();
