const CACHE = "checklist-ralarsa-v5";
const ASSETS = ["./", "./index.html", "./manifest.json", "./agenda_data.json",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./ralarsa-logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Para HTML/JSON: red primero (para no quedarnos nunca con una versión vieja),
// con la copia guardada como respaldo solo si no hay conexión.
// Para el resto (iconos): copia guardada primero, ya que casi nunca cambian.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isCore = url.pathname.endsWith(".html") || url.pathname.endsWith(".json") || url.pathname.endsWith("/");

  if (isCore) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const network = fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
