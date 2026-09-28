const CACHE = "salle-cache-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["./index.html", "./manifest.json", "./icon.svg"]).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;      // laisse passer YouTube, polices, etc.
  if (url.searchParams.has("nocache")) return;           // vérifications de version : toujours le réseau

  e.respondWith(
    fetch(e.request, { cache: "no-cache" })                // réseau d'abord, en revalidant (pas de cache HTTP périmé)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))              // hors ligne : dernière copie connue
  );
});
