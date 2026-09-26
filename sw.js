const VERSION = "v1";
const CACHE_NAME = `estadista-${VERSION}`;
const APP_SHELL = [
  "./", "./index.html", "./manifest.json",
  "./icons/icon.svg", "./icons/icon-maskable.svg",
  "./styles/base.css", "./styles/a11y.css", "./styles/stats-module.css",
  "./styles/stats-view.css", "./styles/matches-view.css", "./styles/pwa.css",
  "./src/app.js",
  "./src/config/app.config.js", "./src/config/actions.config.js",
  "./src/modules/persistence/localStore.js",
  "./src/modules/match/matchesStore.js", "./src/modules/match/matchStore.js",
  "./src/modules/players/rosterStore.js",
  "./src/modules/stats/statsRegistry.js", "./src/modules/stats/statsQueries.js",
  "./src/modules/export/exporter.js", "./src/modules/export/importer.js",
  "./src/modules/pwa/registerSW.js",
  "./src/modules/ui/modal.js", "./src/modules/ui/orientation.js",
  "./src/modules/ui/feedback.js", "./src/modules/ui/playerSelector.js",
  "./src/modules/ui/actionPanel.js", "./src/modules/ui/resultPanel.js",
  "./src/modules/ui/scorePanel.js", "./src/modules/ui/statsView.js",
  "./src/modules/ui/matchesView.js", "./src/modules/ui/installBanner.js"
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("estadista-") && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : new Response("", { status: 504 })))
  );
});
self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
