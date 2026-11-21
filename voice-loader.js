// Loads the voice assistant (about 490 KB) only after the visitor interacts or the page has been idle,
// so it never competes with the first paint on slow mobile data.
(function () {
  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.src = '/vendor/elevenlabs-convai-widget-0.26.0.js';
    s.async = true;
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (e) {
    addEventListener(e, load, { once: true, passive: true });
  });
  if ('requestIdleCallback' in window) requestIdleCallback(function () { setTimeout(load, 3000); }, { timeout: 8000 });
  else setTimeout(load, 6000);
})();
