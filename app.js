"use strict";
document.documentElement.classList.add("js"); // lets styles hide things only when this script is running
/* ===== EDIT THESE ===== */
const CONFIG = {
  brand: "Your Brand",            // company name
  whatsapp: "9779800000000",      // number with country code, digits only (977 = Nepal)
  phoneDisplay: "+977-98XXXXXXXX",
  email: "hello@yourbrand.com.np",
  city: "Kathmandu, Nepal",
  // Leads database (Supabase). The publishable key is safe to show: it can only ADD leads, never read them.
  leadsUrl: "https://svjglbxmeodcfiodupvf.supabase.co",
  leadsKey: "sb_publishable_HdtavQYEN0VP1gEAYQU7vg_xRw2Gvbv"
};
/* ====================== */
const $ = id => document.getElementById(id);
// A detail still showing its example value is "not set up yet": it is hidden, not shown to visitors.
const PLACEHOLDER = {
  brand: CONFIG.brand === "Your Brand",
  whatsapp: CONFIG.whatsapp === "9779800000000" || /x/i.test(CONFIG.whatsapp),
  phone: /x/i.test(CONFIG.phoneDisplay),
  email: /@yourbrand\./.test(CONFIG.email)
};
document.querySelectorAll("[data-brand]").forEach(e=>e.textContent=CONFIG.brand);
document.querySelectorAll("[data-city]").forEach(e=>e.textContent=CONFIG.city);
const phoneEl = document.querySelector("[data-phone]"), emailEl = document.querySelector("[data-email]");
phoneEl.textContent = CONFIG.phoneDisplay; phoneEl.href = "tel:" + CONFIG.phoneDisplay.replace(/[^\d+]/g, "");
emailEl.textContent = CONFIG.email; emailEl.href = "mailto:" + CONFIG.email;
phoneEl.closest("[data-row]").hidden = PLACEHOLDER.phone;
emailEl.closest("[data-row]").hidden = PLACEHOLDER.email;
if (!PLACEHOLDER.brand) document.title = CONFIG.brand + " | AI Automation for Nepali Businesses";
$("yr").textContent = new Date().getFullYear();
const wa = t => "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(t);
const useWa = !PLACEHOLDER.whatsapp;
if (useWa) { $("float").href = wa("Hi! I'd like to know more about AI automation for my business."); } else { $("float").hidden = true; }

/* ---- mobile menu ---- */
const navToggle = $("navToggle"), navLinks = $("navLinks");
function setMenu(open){
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  navLinks.classList.toggle("is-open", open);
}
navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
navLinks.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && navLinks.classList.contains("is-open")) { setMenu(false); navToggle.focus(); } });

/* ---- contact form: validates, saves the lead, opens WhatsApp when it is set up, always says what happened ---- */
const form = $("lead"), statusEl = $("formStatus"), sendBtn = $("formSend");
const SEND_LABEL = useWa ? "Send on WhatsApp" : "Send message";
sendBtn.textContent = SEND_LABEL;
if (!useWa) $("formNote").textContent = "We keep your name and message so we can get back to you.";
const LIMITS = { n: 120, b: 160, t: 60, m: 2000, w: 100 };
const val = id => $(id).value.trim().slice(0, LIMITS[id] || 200);
function say(kind, msg){ statusEl.hidden = false; statusEl.className = "form__status form__status--" + kind; statusEl.textContent = msg; }
$("n").addEventListener("input", () => { $("n").removeAttribute("aria-invalid"); if (statusEl.classList.contains("form__status--error")) statusEl.hidden = true; });
form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = val("n");
  if (!name) { $("n").setAttribute("aria-invalid", "true"); say("error", "Please tell us your name so we know who to reply to."); $("n").focus(); return; }
  const text = `Hi! I'm ${name}${val("b") ? " from " + val("b") : ""} (${val("t")}).\nI'd like to automate: ${val("m") || "not sure yet, please advise"}`;
  if (useWa) window.open(wa(text), "_blank", "noopener,noreferrer"); // before any await, so browsers do not block it
  if (val("w")) { say("ok", "Thank you!"); return; } // spam trap: bots fill the hidden field; they see success and nothing is saved
  const q = new URLSearchParams(location.search);
  let ref = "website"; try { if (document.referrer) ref = new URL(document.referrer).hostname || "website"; } catch (_) {}
  const source = (q.get("utm_source") || ref).slice(0, 80);
  sendBtn.disabled = true; sendBtn.textContent = "Sending...";
  let saved = false;
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 10000);
    const res = await fetch(CONFIG.leadsUrl + "/rest/v1/leads", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", apikey: CONFIG.leadsKey, Authorization: "Bearer " + CONFIG.leadsKey, Prefer: "return=minimal" },
      body: JSON.stringify({ name, business: val("b") || null, business_type: val("t"), message: val("m") || null, source })
    });
    clearTimeout(timer); saved = res.ok;
  } catch (_) {}
  sendBtn.disabled = false; sendBtn.textContent = SEND_LABEL;
  if (saved) {
    say("ok", useWa ? "Thank you, " + name + "! WhatsApp has opened with your message, and we have saved your details." : "Thank you, " + name + "! We have your message and will get back to you soon.");
    form.reset();
  } else {
    say("error", useWa ? "WhatsApp has opened with your message. We could not save your details here, so please send your message there." : "Sorry, your message did not go through. Please check your internet connection and try again.");
  }
});

/* ---- live demo ---- */
const DEMOS = {
  bakery: [["in","Aaja pasal kati baje samma khulchha?"],["bot","Namaste! We are open until 8 PM today. Would you like to order something?"],["in"," 1 kg chocolate cake, bholi 4 baje."],["bot","Noted: 1 kg chocolate cake, pickup tomorrow at 4 PM. We will remind you.",1]],
  cafe: [["in","Aaja rati 7 baje 4 jana ko table huncha?"],["bot","Yes, a table for 4 at 7 PM is free. What name should I put it under?"],["in","Prakash"],["bot","Booked: Prakash, 4 people, 7 PM tonight. We will remind you at 5 PM.",1]],
  restaurant: [["in","Veg momo ra chowmein delivery huncha?"],["bot","Yes, we deliver nearby. Veg momo and chowmein added. What is your delivery address?"],["in","Baneshwor, near the temple"],["bot","Thank you! Your order is with the kitchen. We will message you when it leaves.",1]],
  salon: [["in","Haircut ko lagi aaja 4 baje slot chha?"],["bot","Yes, 4 PM is free. Shall I book it for you?"],["in","Ha"],["bot","Booked for 4 PM today. See you soon!",1]]
};
const demoLog = document.getElementById("demo-log");
const tabs = [...document.querySelectorAll("[data-demo]")];
function showDemo(key){
  tabs.forEach(t=>{ const on = t.dataset.demo===key; t.setAttribute("aria-selected", on); t.tabIndex = on?0:-1; });
  demoLog.setAttribute("aria-labelledby", "tab-"+key);
  demoLog.replaceChildren(...DEMOS[key].map(([who,text,done])=>{
    const p=document.createElement("p"); p.className="bubble bubble--"+who+(done?" bubble--done":"");
    if(who==="bot"){ const s=document.createElement("small"); s.textContent="AI assistant"; p.append(s); }
    p.append(text); return p; }));
}
tabs.forEach((t,i)=>{
  t.addEventListener("click",()=>showDemo(t.dataset.demo));
  t.addEventListener("keydown",e=>{ const d={ArrowRight:1,ArrowLeft:-1}[e.key]; if(!d) return; const n=tabs[(i+d+tabs.length)%tabs.length]; n.focus(); showDemo(n.dataset.demo); });
});
/* ---- search engines: business details from CONFIG ---- */
if (!PLACEHOLDER.brand) {
  const ld=document.createElement("script"); ld.type="application/ld+json";
  const org={"@context":"https://schema.org","@type":"ProfessionalService",name:CONFIG.brand,url:location.origin+"/",description:"WhatsApp and AI automation for bakeries, cafes, restaurants and shops in Nepal.",areaServed:{"@type":"Country",name:"Nepal"},address:{"@type":"PostalAddress",addressLocality:CONFIG.city}};
  if(!PLACEHOLDER.email) org.email=CONFIG.email;
  if(!PLACEHOLDER.phone) org.telephone=CONFIG.phoneDisplay;
  ld.textContent=JSON.stringify(org);
  document.head.append(ld);
}

window.hallmarkSlots = (m) => { for (const [k, v] of Object.entries(m)) { const s = document.querySelector(`[data-slot="${k}"]`); if (!s) continue; const im = new Image(); im.src = typeof v === 'string' ? v : v.src; im.alt = (typeof v === 'object' && v.alt) || s.dataset.alt || ''; s.querySelectorAll(':scope > img').forEach((o) => o.remove()); s.prepend(im); } };
document.querySelectorAll('[data-slot] img').forEach((i) => { if (i.complete && !i.naturalWidth) i.remove(); else i.addEventListener('error', () => i.remove(), { once: true }); });


/* ---- back to top ---- */
const toTop = $("toTop");
if (useWa) toTop.classList.add("to-top--above");
let toTopTicking = false;
function updateToTop(){ toTop.hidden = window.scrollY < 600; toTopTicking = false; }
window.addEventListener("scroll", () => { if (!toTopTicking) { toTopTicking = true; requestAnimationFrame(updateToTop); } }, { passive: true });
toTop.addEventListener("click", () => {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  document.querySelector(".wordmark").focus({ preventScroll: true });
});
updateToTop();

/* ---- privacy-friendly visit count: no cookies, no IP address or browser details stored ---- */
(function(){
  try {
    if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
    const k = "pv:" + location.pathname; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1");
    let ref = ""; try { if (document.referrer) { const h = new URL(document.referrer).hostname; if (h !== location.hostname) ref = h; } } catch (_) {}
    const source = (new URLSearchParams(location.search).get("utm_source") || "").slice(0, 80);
    fetch("/api/hit", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: location.pathname, ref, source }) }).catch(() => {});
  } catch (_) {}
})();

/* ---- demo tabs: sliding underline that follows the selected tab ---- */
(function () {
  const bar = document.querySelector(".demo__tabs");
  if (!bar) return;
  const ink = document.createElement("span");
  ink.className = "demo__ink"; ink.setAttribute("aria-hidden", "true");
  bar.append(ink);
  let first = true;
  function moveInk() {
    const on = bar.querySelector('[aria-selected="true"]');
    if (!on) return;
    if (first) ink.style.transition = "none"; // place it without sliding on page load
    ink.style.transform = "translate(" + on.offsetLeft + "px," + (on.offsetTop + on.offsetHeight - 2) + "px) scaleX(" + on.offsetWidth + ")";
    if (first) { void ink.offsetWidth; ink.style.transition = ""; first = false; }
  }
  bar.addEventListener("click", moveInk);
  bar.addEventListener("keydown", moveInk);
  window.addEventListener("resize", moveInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  moveInk();
})();

/* ---- hero chat: messages appear one by one, with a typing indicator before each AI reply ---- */
(function () {
  const log = document.querySelector(".hero .chat__log");
  if (!log || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const msgs = [...log.children];
  log.style.minHeight = log.offsetHeight + "px"; // keep the card from growing as messages arrive
  msgs.forEach(m => m.classList.add("is-queued"));
  const typing = document.createElement("p");
  typing.className = "bubble bubble--bot typing"; typing.setAttribute("aria-hidden", "true");
  for (let k = 0; k < 3; k++) typing.append(document.createElement("span"));
  let i = 0;
  function next() {
    if (i >= msgs.length) { log.style.minHeight = ""; return; }
    const m = msgs[i++], bot = m.classList.contains("bubble--bot");
    const show = () => { typing.remove(); m.classList.remove("is-queued"); setTimeout(next, bot ? 800 : 500); };
    if (bot) { m.before(typing); setTimeout(show, 1100); } else show();
  }
  setTimeout(next, 700);
})();

/* ---- industries: pills pop in and the demo chat plays when the section scrolls into view; it replays on each tab switch ---- */
(function () {
  const sec = document.getElementById("industries");
  const log = document.getElementById("demo-log");
  const bar = document.querySelector(".demo__tabs");
  if (!sec || !log || !bar) return;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pills = [...sec.querySelectorAll(".trades li")];
  const typing = document.createElement("p");
  typing.className = "bubble bubble--bot typing"; typing.setAttribute("aria-hidden", "true");
  for (let k = 0; k < 3; k++) typing.append(document.createElement("span"));
  const picked = () => { const on = bar.querySelector('[aria-selected="true"]'); return on ? on.dataset.demo : ""; };
  let run = 0, current = picked();

  function play() {
    const id = ++run; typing.remove();
    if (calm) return;
    const msgs = [...log.children];
    msgs.forEach(m => m.classList.add("is-queued"));
    let i = 0;
    (function next() {
      if (id !== run || i >= msgs.length) return;
      const m = msgs[i++], bot = m.classList.contains("bubble--bot");
      const show = () => { if (id !== run) return; typing.remove(); m.classList.remove("is-queued"); setTimeout(next, bot ? 700 : 450); };
      if (bot) { m.before(typing); setTimeout(show, 900); } else show();
    })();
  }
  function onTab() { const now = picked(); if (now && now !== current) { current = now; play(); } }
  bar.addEventListener("click", onTab);
  bar.addEventListener("keydown", onTab);

  if (calm) return;
  pills.forEach(p => p.classList.add("pill-wait"));
  [...log.children].forEach(m => m.classList.add("is-queued")); // hidden until the section is on screen
  let started = false;
  function start() {
    if (started) return; started = true;
    pills.forEach((p, k) => setTimeout(() => p.classList.remove("pill-wait"), k * 70));
    play();
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { threshold: 0.3 });
    io.observe(sec);
  } else start();
})();

/* ---- header: scroll progress, compact state, and the current section in the menu ---- */
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const links = [...nav.querySelectorAll('.nav__links a[href^="#"]')];
  const targets = links.map(a => document.getElementById(a.getAttribute("href").slice(1)));
  const contact = document.getElementById("contact");
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    nav.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1).toFixed(4) : "0");
    nav.classList.toggle("is-scrolled", y > 12);
    const line = window.innerHeight * 0.35;
    let cur = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    if (contact && contact.getBoundingClientRect().top <= line) cur = -1; // the demo button covers this section
    links.forEach((a, i) => { if (i === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  }
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();

/* ---- smooth glide to sections when a menu or button link is clicked ---- */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const MAX_MS = 1000, MIN_MS = 500;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let raf = 0;
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  ["wheel", "touchstart"].forEach(ev => window.addEventListener(ev, stop, { passive: true }));
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let id = a.getAttribute("href").slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const from = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = Math.max(0, Math.min(max, target.getBoundingClientRect().top + from - pad));
    const dur = Math.min(MAX_MS, Math.max(MIN_MS, Math.abs(to - from) * 0.6));
    const t0 = performance.now();
    stop();
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      window.scrollTo({ top: from + (to - from) * ease(p), behavior: "instant" });
      if (p < 1) { raf = requestAnimationFrame(step); return; }
      raf = 0;
      if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
      target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
    }
    raf = requestAnimationFrame(step);
  });
})();
