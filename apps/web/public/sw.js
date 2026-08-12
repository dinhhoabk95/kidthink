// Narrow Service Worker for P1.6 Session Play & Asset Caching (D-GG)
const CACHE_SHELL = "shell-v1";
const _CACHE_SESSION_ASSETS = "session-assets-v1";

const SHELL_ASSETS = ["/", "/favicon.ico"];

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
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. API routes: NEVER CACHE (BR-OFF-07)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Game Config & Paid content: Network-first, NO CACHE for paid levels (BR-OFF-07)
  if (url.pathname.includes("/config")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ error: "OFFLINE_NEED_CONNECTION" }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
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
            url.pathname.endsWith(".svg"))
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
