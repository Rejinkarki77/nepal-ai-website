// Speech-to-text for the website assistant. Uses Whisper on the free Workers AI allowance, so voice input works
// in every browser (Chrome, Safari, Firefox, Brave) and is not tied to Google's speech service.

const MODEL = '@cf/openai/whisper-large-v3-turbo';
const MAX_BYTES = 1500000; // about 60-90 seconds of speech; the page stops recording much sooner

const ALLOWED_HOSTS = [/^nepal-ai-website\.pages\.dev$/, /^[a-z0-9-]+\.nepal-ai-website\.pages\.dev$/];

const hits = new Map();
function throttled(ip, limit = 15, windowMs = 60000) {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) { hits.set(ip, { n: 1, reset: now + windowMs }); if (hits.size > 5000) hits.clear(); return false; }
  e.n += 1;
  return e.n > limit;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

function originOk(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return ALLOWED_HOSTS.some((re) => re.test(new URL(origin).hostname)); } catch { return false; }
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function onRequestPost({ request, env }) {
  if (!originOk(request)) return json({ error: 'forbidden' }, 403);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (throttled(ip)) return json({ error: 'slow_down' }, 429);

  const type = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!/^audio\//.test(type)) return json({ error: 'bad_request' }, 400);
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BYTES) return json({ error: 'too_large' }, 413);

  const buf = await request.arrayBuffer();
  if (buf.byteLength < 1500) return json({ text: '' });
  if (buf.byteLength > MAX_BYTES) return json({ error: 'too_large' }, 413);

  try {
    const out = await env.AI.run(MODEL, { audio: toBase64(buf) });
    const text = String((out && out.text) || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 600);
    return json({ text });
  } catch (e) {
    return json({ error: 'busy' }, 503);
  }
}

export function onRequest() { return json({ error: 'method_not_allowed' }, 405); }
