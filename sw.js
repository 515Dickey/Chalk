/* Chalk's service worker.
   The point of this file is one scenario: Finn opens the app at practice,
   on a field with no signal, and it just works.

   The page itself is network-first, so a new version lands as soon as there
   is a connection and nobody gets stuck on last week's playbook. Everything
   else — icons, fonts — is cache-first, because it never changes.

   His playbook is not in here. That lives in localStorage on the device. */

const VERSION = "chalk-v1";
const SHELL   = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL)
      // one bad URL must not fail the whole install
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // The page: fresh when we can reach the network, cached when we cannot.
  if (req.mode === "navigate" || (sameOrigin && url.pathname.endsWith(".html"))) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Everything else: serve from cache, and quietly refill it when online.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
