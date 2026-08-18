// Service Worker for P1.6 Session Play & P5.2 Offline Curriculum Pack (BR-PWA, BR-OCP, BR-OFF)
const CACHE_SHELL = "shell-v1";
const CACHE_OFFLINE_PACK = "mindkid-offline-pack-v1";
const _CACHE_SESSION_ASSETS = "session-assets-v1";

const SHELL_ASSETS = ["/", "/favicon.ico", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        /* ignore shell pre-cache failure */
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            // Retain current shell and offline pack caches during version activation (D-P5OFF-C)
            if (
              key !== CACHE_SHELL &&
              key !== CACHE_OFFLINE_PACK &&
              key !== _CACHE_SESSION_ASSETS
            ) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. API routes: NEVER CACHE (BR-OFF-07)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Game Config & Paid content: Network-first, NO CACHE for paid levels unless present in offline pack (BR-OFF-07, BR-OCP-03)
  if (url.pathname.includes("/config")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Check if cached in offline pack
          return caches.open(CACHE_OFFLINE_PACK).then((cache) => {
            return cache.match(event.request).then((cached) => {
              if (cached) {
                return cached;
              }
              return new Response(
                JSON.stringify({ error: "OFFLINE_NEED_CONNECTION" }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            });
          });
        })
    );
    return;
  }

  // 3. Static assets & Shell: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (
          response.ok &&
          (url.pathname.startsWith("/_nuxt/") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".webp"))
        ) {
          const clone = response.clone();
          caches
            .open(CACHE_SHELL)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
