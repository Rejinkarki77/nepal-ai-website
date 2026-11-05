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
document.querySelectorAll("[data-brand]").forEach(e=>e.textContent=CONFIG.brand);
document.querySelectorAll("[data-phone]").forEach(e=>e.textContent=CONFIG.phoneDisplay);
document.querySelectorAll("[data-email]").forEach(e=>e.textContent=CONFIG.email);
document.querySelectorAll("[data-city]").forEach(e=>e.textContent=CONFIG.city);
document.title = CONFIG.brand + " | AI Automation for Nepali Businesses";
document.getElementById("yr").textContent = new Date().getFullYear();
const wa = t => "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(t);
document.getElementById("float").href = wa("Hi! I'd like to know more about AI automation for my business.");
document.getElementById("lead").addEventListener("submit", e=>{
  e.preventDefault();
  const LIMITS = { n: 120, b: 160, t: 60, m: 2000, w: 100 };
  const v = id => document.getElementById(id).value.trim().slice(0, LIMITS[id] || 200);
  if(!v("n")){ document.getElementById("n").focus(); return; }
  const text = `Hi! I'm ${v("n")}${v("b")?" from "+v("b"):""} (${v("t")}).\nI'd like to automate: ${v("m")||"not sure yet, please advise"}`;
  window.open(wa(text), "_blank", "noopener,noreferrer");
  if (v("w")) return; // spam trap: bots fill the hidden field
  const q = new URLSearchParams(location.search);
  let ref = "website"; try { if (document.referrer) ref = new URL(document.referrer).hostname || "website"; } catch (_) {}
  const source = (q.get("utm_source") || ref).slice(0, 80);
  // Save the lead too. This runs alongside WhatsApp, and a failure never blocks the visitor.
  try {
    fetch(CONFIG.leadsUrl + "/rest/v1/leads", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json", apikey: CONFIG.leadsKey, Authorization: "Bearer " + CONFIG.leadsKey, Prefer: "return=minimal" },
      body: JSON.stringify({ name: v("n"), business: v("b") || null, business_type: v("t"), message: v("m") || null, source })
    }).catch(()=>{});
  } catch (_) {}
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
ld.textContent=JSON.stringify({"@context":"https://schema.org","@type":"ProfessionalService",name:CONFIG.brand,description:"WhatsApp and AI automation for bakeries, cafes, restaurants and shops in Nepal.",email:CONFIG.email,telephone:CONFIG.phoneDisplay,areaServed:{"@type":"Country",name:"Nepal"},address:{"@type":"PostalAddress",addressLocality:CONFIG.city}});
document.head.append(ld);

window.hallmarkSlots = (m) => { for (const [k, v] of Object.entries(m)) { const s = document.querySelector(`[data-slot="${k}"]`); if (!s) continue; const im = new Image(); im.src = typeof v === 'string' ? v : v.src; im.alt = (typeof v === 'object' && v.alt) || s.dataset.alt || ''; s.querySelectorAll(':scope > img').forEach((o) => o.remove()); s.prepend(im); } };
document.querySelectorAll('[data-slot] img').forEach((i) => { if (i.complete && !i.naturalWidth) i.remove(); else i.addEventListener('error', () => i.remove(), { once: true }); });
