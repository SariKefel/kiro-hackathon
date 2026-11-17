const CACHE = "rescuesync-shell-v3";
const SHELL = ["/offline.html", "/offline.css", "/offline.js", "/icon-192.png", "/icon-512.png", "/icon-maskable.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("rescuesync-shell-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    // Never persist HTML, RSC payloads, API responses, or personnel records in Cache Storage.
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }
  if (SHELL.includes(url.pathname) || (url.pathname.startsWith("/_next/static/") && /\.(js|css|woff2?)$/.test(url.pathname))) {
    event.respondWith((async () => {
      // Development chunk URLs and shell files can change without changing their URL.
      // Never combine current server HTML with stale client code while online.
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic" && request.cache !== "no-store" && !/\bno-store\b/i.test(response.headers.get("Cache-Control") || "")) {
          try {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          } catch {
            // Cache quota or storage failures must not discard a fresh network response.
          }
        }
        return response;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })());
  }
});
