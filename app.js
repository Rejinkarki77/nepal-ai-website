"use strict";
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
document.title = CONFIG.brand + " | AI Automation for Nepali Businesses";
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
  bakery: [["in","Aaja pasal kati baje samma khulchha?"],["bot","Namaste! We are open until 8 PM today. Would you like to order something?"],["in","Ha, 1 kg chocolate cake, bholi 4 baje."],["bot","Noted: 1 kg chocolate cake, pickup tomorrow at 4 PM. We will remind you.",1]],
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
const ld=document.createElement("script"); ld.type="application/ld+json";
const org={"@context":"https://schema.org","@type":"ProfessionalService",name:CONFIG.brand,description:"WhatsApp and AI automation for bakeries, cafes, restaurants and shops in Nepal.",areaServed:{"@type":"Country",name:"Nepal"},address:{"@type":"PostalAddress",addressLocality:CONFIG.city}};
if(!PLACEHOLDER.email) org.email=CONFIG.email;
if(!PLACEHOLDER.phone) org.telephone=CONFIG.phoneDisplay;
ld.textContent=JSON.stringify(org);
document.head.append(ld);

window.hallmarkSlots = (m) => { for (const [k, v] of Object.entries(m)) { const s = document.querySelector(`[data-slot="${k}"]`); if (!s) continue; const im = new Image(); im.src = typeof v === 'string' ? v : v.src; im.alt = (typeof v === 'object' && v.alt) || s.dataset.alt || ''; s.querySelectorAll(':scope > img').forEach((o) => o.remove()); s.prepend(im); } };
document.querySelectorAll('[data-slot] img').forEach((i) => { if (i.complete && !i.naturalWidth) i.remove(); else i.addEventListener('error', () => i.remove(), { once: true }); });

/* ---- voice assistant: mounted from script so it can retry if ElevenLabs answers with a temporary error ---- */
const VOICE_AGENT_ID = "agent_5601m6pt314tecgsf17zbvazxdk2";
function mountVoice(attempt){
  const el = document.createElement("elevenlabs-convai");
  el.setAttribute("agent-id", VOICE_AGENT_ID);
  document.body.append(el);
  setTimeout(() => {
    const ok = el.shadowRoot && el.shadowRoot.querySelector("button");
    if (ok) return;
    el.remove(); // settings request failed: try again with a fresh element
    if (attempt < 8) mountVoice(attempt + 1);
  }, 3500);
}
mountVoice(1);
