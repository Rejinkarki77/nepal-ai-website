"use strict";
/* Website AI assistant: talk or type. Recording uses the browser's microphone, speech-to-text and the replies
   come from this site's own server code (functions/api), and replies can be read aloud by the browser. */
(function () {
  const GREETING = "Hi there! I'm the virtual assistant here. We set up WhatsApp and AI automation for cafes, bakeries and restaurants in Nepal. What kind of business do you run?";
  const CHIPS = ["What can you automate?", "How does it work?", "I want a free demo"];
  const MAX_RECORD_MS = 20000, SILENCE_MS = 1300, NO_SPEECH_MS = 7000;

  const history = [];           // {role, content} sent to the server (greeting is not sent)
  let leadSaved = false, busy = false, recording = null, speakOn = false, opened = false;

  const $ = (tag, cls, attrs) => { const e = document.createElement(tag); if (cls) e.className = cls; if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const svg = (d, extra) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "20"); s.setAttribute("height", "20"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); s.append(p); if (extra) { const p2 = document.createElementNS("http://www.w3.org/2000/svg", "path"); p2.setAttribute("d", extra); s.append(p2); } return s; };
  const ICON = {
    mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4",
    stop: "M7 7h10v10H7z",
    send: "M4 12l16-8-6 16-3-7-7-1z",
    close: "M6 6l12 12M18 6L6 18",
    sound: "M5 9v6h4l5 4V5L9 9H5z",
    soundOff: "M5 9v6h4l5 4V5L9 9H5z",
    mute: "M17 9l4 6M21 9l-4 6"
  };

  /* ---------- build the interface ---------- */
  const launch = $("button", "va-launch", { type: "button", "aria-haspopup": "dialog", "aria-expanded": "false" });
  launch.append(svg(ICON.mic), document.createTextNode(" Talk to our AI assistant"));

  const panel = $("section", "va-panel glass", { role: "dialog", "aria-label": "AI assistant", hidden: "" });
  const head = $("div", "va-head");
  const title = $("strong"); title.textContent = "AI assistant";
  const tools = $("div", "va-tools");
  const soundBtn = $("button", "va-icon", { type: "button", "aria-label": "Read replies aloud", "aria-pressed": "false" });
  const closeBtn = $("button", "va-icon", { type: "button", "aria-label": "Close assistant" });
  closeBtn.append(svg(ICON.close));
  tools.append(soundBtn, closeBtn); head.append(title, tools);

  const log = $("div", "va-log", { role: "log", "aria-live": "polite", "aria-label": "Conversation" });
  const status = $("p", "va-status", { role: "status", "aria-live": "polite" }); status.hidden = true;
  const chips = $("div", "va-chips");
  CHIPS.forEach((c) => { const b = $("button", "va-chip", { type: "button" }); b.textContent = c; b.addEventListener("click", () => { chips.hidden = true; send(c); }); chips.append(b); });

  const form = $("form", "va-form", { novalidate: "" });
  const input = $("input", "va-input", { type: "text", maxlength: "500", placeholder: "Type or tap the mic", "aria-label": "Your message", autocomplete: "off" });
  const mic = $("button", "va-mic", { type: "button", "aria-label": "Speak to the assistant" });
  const sendBtn = $("button", "va-send", { type: "submit", "aria-label": "Send message" });
  sendBtn.append(svg(ICON.send));
  form.append(input, mic, sendBtn);

  const consent = $("div", "va-consent");
  const consentText = $("p"); consentText.textContent = "This is an AI assistant. What you type or say is sent to our server and an AI service to write a reply, and what you say is turned into text there. Please don't share passwords or card numbers.";
  const consentBtn = $("button", "btn", { type: "button" }); consentBtn.textContent = "OK, let's chat";
  consent.append(consentText, consentBtn);

  panel.append(head, consent, log, status, chips, form);
  document.body.append(launch, panel);

  const setMicIcon = (rec) => { mic.replaceChildren(svg(rec ? ICON.stop : ICON.mic)); mic.setAttribute("aria-label", rec ? "Stop and send" : "Speak to the assistant"); mic.dataset.state = rec ? "recording" : "idle"; };
  const setSoundIcon = () => { soundBtn.replaceChildren(svg(ICON.sound, speakOn ? null : ICON.mute)); soundBtn.setAttribute("aria-pressed", String(speakOn)); soundBtn.setAttribute("aria-label", speakOn ? "Replies are read aloud. Tap to mute" : "Read replies aloud"); };
  setMicIcon(false); setSoundIcon();

  const say = (msg) => { status.textContent = msg; status.hidden = !msg; };
  const addBubble = (who, text) => {
    const p = $("p", "bubble bubble--" + (who === "user" ? "in" : "bot"));
    if (who !== "user") { const s = $("small"); s.textContent = "AI assistant"; p.append(s); }
    p.append(document.createTextNode(text)); log.append(p); log.scrollTop = log.scrollHeight; return p;
  };

  /* ---------- open and close ---------- */
  function open() {
    if (!opened) {
      opened = true; addBubble("bot", GREETING);
      let ok = false; try { ok = sessionStorage.getItem("va-consent") === "1"; } catch (_) {}
      setConsent(ok);
    }
    panel.hidden = false; launch.hidden = true; launch.setAttribute("aria-expanded", "true");
    (consent.hidden ? input : consentBtn).focus();
  }
  function close() {
    stopRecording(true); stopSpeaking();
    panel.hidden = true; launch.hidden = false; launch.setAttribute("aria-expanded", "false"); launch.focus();
  }
  function setConsent(ok) { consent.hidden = ok; log.hidden = !ok; form.hidden = !ok; chips.hidden = !ok || history.length > 0; }
  consentBtn.addEventListener("click", () => { try { sessionStorage.setItem("va-consent", "1"); } catch (_) {} setConsent(true); input.focus(); });
  launch.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  soundBtn.addEventListener("click", () => { speakOn = !speakOn; setSoundIcon(); if (!speakOn) stopSpeaking(); });

  /* ---------- speaking (browser voice) ---------- */
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang) && /female|natural|google|zira|samantha/i.test(v.name)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  function speak(text) {
    if (!speakOn || !("speechSynthesis" in window)) return;
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text); const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-IN";
    u.rate = 1; speechSynthesis.speak(u);
  }
  function stopSpeaking() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }

  /* ---------- talking to the server ---------- */
  async function send(text) {
    text = (text || "").trim(); if (!text || busy) return;
    stopSpeaking(); input.value = ""; chips.hidden = true;
    addBubble("user", text); history.push({ role: "user", content: text });
    busy = true; sendBtn.disabled = true; say("Thinking...");
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-10), leadSaved }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.reply) {
        history.push({ role: "assistant", content: d.reply }); addBubble("bot", d.reply); speak(d.reply);
        if (d.leadSaved) { leadSaved = true; addBubble("bot", "Your details have been saved. Our team will follow up."); }
      } else if (r.status === 429) { fail("Lots of messages at once. Please wait a minute and try again."); }
      else { fail("The assistant is busy right now. Please try again in a moment, or use the contact form below."); }
    } catch (_) { fail("I couldn't reach the assistant. Please check your connection, or use the contact form below."); }
    busy = false; sendBtn.disabled = false; say(""); input.focus();
  }
  function fail(msg) { history.pop(); addBubble("bot", msg); }
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });

  /* ---------- microphone: record, stop on silence, transcribe on the server ---------- */
  const mimeType = () => { if (!window.MediaRecorder) return ""; return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported(t)) || ""; };

  async function startRecording() {
    if (busy) return;
    stopSpeaking();
    if (!navigator.mediaDevices || !window.MediaRecorder) { say("Voice isn't supported in this browser. Please type instead."); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (_) { say("I can't use the microphone. Allow it in your browser, or type instead."); return; }
    if (!speakOn) { speakOn = true; setSoundIcon(); }
    const rec = new MediaRecorder(stream, mimeType() ? { mimeType: mimeType() } : undefined);
    const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const state = { rec, stream, chunks, heard: false, cancelled: false, timers: [], ctx: null, raf: 0 };
    recording = state; setMicIcon(true); say("Listening... speak now, then pause or tap stop.");
    rec.onstop = () => finishRecording(state);
    try {
      const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); state.ctx = ctx;
      const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize); let lastVoice = performance.now();
      const tick = () => {
        if (recording !== state) return;
        an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const level = Math.sqrt(sum / buf.length); mic.style.setProperty("--lvl", String(1 + Math.min(level * 6, 0.6)));
        const now = performance.now();
        if (level > 0.03) { state.heard = true; lastVoice = now; }
        if (state.heard && now - lastVoice > SILENCE_MS) { stopRecording(false); return; }
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    } catch (_) { /* no level meter: the tap-to-stop and time limit still work */ }
    state.timers.push(setTimeout(() => { if (!state.heard && recording === state) { stopRecording(true); say("I didn't hear anything. Tap the microphone and try again, or type."); } }, NO_SPEECH_MS));
    state.timers.push(setTimeout(() => { if (recording === state) stopRecording(false); }, MAX_RECORD_MS));
    rec.start(250);
  }

  function stopRecording(cancel) {
    const s = recording; if (!s) return;
    s.cancelled = !!cancel; recording = null; setMicIcon(false); mic.style.removeProperty("--lvl");
    s.timers.forEach(clearTimeout); cancelAnimationFrame(s.raf);
    try { if (s.rec.state !== "inactive") s.rec.stop(); else finishRecording(s); } catch (_) { finishRecording(s); }
  }

  async function finishRecording(s) {
    s.stream.getTracks().forEach((t) => t.stop()); if (s.ctx) { try { s.ctx.close(); } catch (_) {} }
    if (s.cancelled || !s.chunks.length) { if (!status.hidden && /Listening/.test(status.textContent)) say(""); return; }
    const blob = new Blob(s.chunks, { type: s.rec.mimeType || "audio/webm" });
    if (blob.size < 2500) { say("I didn't catch that. Tap the microphone and try again."); return; }
    busy = true; sendBtn.disabled = true; say("Turning your voice into text...");
    try {
      const r = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": (blob.type || "audio/webm").split(";")[0] }, body: blob });
      const d = await r.json().catch(() => ({}));
      busy = false; sendBtn.disabled = false;
      if (r.ok && d.text) { say(""); send(d.text); }
      else if (r.ok) { say("I couldn't make out any words. Tap the microphone and try again, or type."); }
      else if (r.status === 429) { say("Lots of requests right now. Please wait a minute, or type your message."); }
      else { say("Voice isn't available right now. Please type your message instead."); }
    } catch (_) { busy = false; sendBtn.disabled = false; say("I couldn't reach the server. Please type your message instead."); }
  }

  mic.addEventListener("click", () => { if (recording) stopRecording(false); else startRecording(); });
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
})();
