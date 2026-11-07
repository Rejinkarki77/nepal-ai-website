// Privacy-friendly visit counter. Stores only: page address, the website that sent the visitor (host name only),
// country, and phone-or-computer. No cookies, no IP address, no browser fingerprint, no names.
// Uses the same insert-only public database key as the contact form.

const SUPABASE_URL = 'https://svjglbxmeodcfiodupvf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HdtavQYEN0VP1gEAYQU7vg_xRw2Gvbv';
const ALLOWED_HOSTS = [/^nepal-ai-website\.pages\.dev$/, /^[a-z0-9-]+\.nepal-ai-website\.pages\.dev$/];
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|node-fetch|axios|go-http/i;

const hits = new Map();
function throttled(ip, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) { hits.set(ip, { n: 1, reset: now + windowMs }); if (hits.size > 5000) hits.clear(); return false; }
  e.n += 1;
  return e.n > limit;
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n);
const empty = (status) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function onRequestPost({ request }) {
  const origin = request.headers.get('Origin');
  try { if (!origin || !ALLOWED_HOSTS.some((re) => re.test(new URL(origin).hostname))) return empty(403); } catch { return empty(403); }
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT.test(ua)) return empty(204); // do not count robots
  if (throttled(request.headers.get('CF-Connecting-IP') || 'unknown')) return empty(429);

  let d; try { d = await request.json(); } catch { return empty(400); }
  const path = clip(d && d.path, 200);
  if (!path.startsWith('/')) return empty(400);
  const tablet = /ipad|tablet/i.test(ua);
  const mobile = /mobi|android|iphone|ipod/i.test(ua);
  const row = {
    path,
    referrer: clip(d.ref, 100).toLowerCase() || null,
    country: clip((request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || '', 8).toUpperCase() || null,
    device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
    source: clip(d.source, 80) || null,
  };
  try {
    await fetch(SUPABASE_URL + '/rest/v1/page_views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  } catch { /* counting must never break the page */ }
  return empty(204);
}

export function onRequest() { return empty(405); }
