"use strict";
/* One entrance: the hero WhatsApp chat appears once the page has loaded, then plays its messages (app.js).
   Everything else on the page stays still. */
(function () {
  const hero = document.querySelector(".hero");
  if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function live() {
    if (hero.classList.contains("is-live")) return;
    hero.classList.add("is-live");
    window.dispatchEvent(new Event("nf:live"));
  }
  if (document.readyState === "complete") setTimeout(live, 300); else addEventListener("load", () => setTimeout(live, 300), { once: true });
  setTimeout(live, 2500); // never leave the chat hidden
})();
