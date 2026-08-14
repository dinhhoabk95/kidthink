/* eslint-disable no-undef */
// Service worker for KidThink FCM Web push handling (BR-BPS-01, BR-BPS-07)

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || "KidThink";
    const notificationOptions = {
      body: payload.notification?.body || "",
      icon: "/icon-192.png",
      data: payload.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (_e) {
    // Fallback if payload isn't JSON
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.action_url || "/me";

  // BR-BPS-07: Action URL MUST be an internal path starting with '/' and not '//'
  if (
    typeof targetUrl !== "string" ||
    !targetUrl.startsWith("/") ||
    targetUrl.startsWith("//")
  ) {
    targetUrl = "/me";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
