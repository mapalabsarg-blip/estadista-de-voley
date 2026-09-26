import { showFeedback } from "../ui/feedback.js";
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const isSecure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isSecure) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then((reg) => watchForUpdates(reg)).catch((err) => console.warn("[PWA] SW error:", err));
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return; reloading = true; window.location.reload();
  });
}
function watchForUpdates(reg) {
  if (reg.waiting) offerUpdate(reg.waiting);
  reg.addEventListener("updatefound", () => {
    const nw = reg.installing; if (!nw) return;
    nw.addEventListener("statechange", () => {
      if (nw.state === "installed" && navigator.serviceWorker.controller) offerUpdate(nw);
    });
  });
}
function offerUpdate(worker) {
  showFeedback("Nueva version disponible. Toca para actualizar.", "warn");
  const handler = () => { window.removeEventListener("pointerdown", handler, true); worker.postMessage("SKIP_WAITING"); };
  window.addEventListener("pointerdown", handler, true);
}
