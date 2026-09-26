const DISMISS_KEY = "estadista:install-dismissed";
let deferredPrompt = null;
let bannerEl = null;
export function initInstallBanner() {
  if (isStandalone()) return;
  if (localStorage.getItem(DISMISS_KEY) === "1") return;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; showBanner(); });
  window.addEventListener("appinstalled", () => { hideBanner(); localStorage.setItem(DISMISS_KEY, "1"); });
}
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function showBanner() {
  if (bannerEl) return;
  bannerEl = document.createElement("div");
  bannerEl.className = "install-banner";
  bannerEl.innerHTML = '<span class="install-banner__text">Instala la app para usarla offline</span><div class="install-banner__actions"><button type="button" class="install-banner__btn install-banner__btn--primary">Instalar</button><button type="button" class="install-banner__btn install-banner__btn--ghost">Ahora no</button></div>';
  bannerEl.querySelector(".install-banner__btn--primary").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice && choice.outcome === "accepted") localStorage.setItem(DISMISS_KEY, "1");
    hideBanner();
  });
  bannerEl.querySelector(".install-banner__btn--ghost").addEventListener("click", () => { localStorage.setItem(DISMISS_KEY, "1"); hideBanner(); });
  document.body.appendChild(bannerEl);
  requestAnimationFrame(() => bannerEl.classList.add("install-banner--visible"));
}
function hideBanner() {
  if (!bannerEl) return;
  bannerEl.classList.remove("install-banner--visible");
  const el = bannerEl; bannerEl = null;
  setTimeout(() => el.remove(), 220);
}
