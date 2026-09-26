let rotateHintEl = null;
let attached = false;
let onMain = false;
export async function lockLandscape() {
  try { if (screen.orientation && typeof screen.orientation.lock === "function") await screen.orientation.lock("landscape"); } catch (_) {}
}
export function unlockOrientation() {
  try { if (screen.orientation && typeof screen.orientation.unlock === "function") screen.orientation.unlock(); } catch (_) {}
  hideRotateHint();
}
export function watchRotation(isOnMainScreen) {
  onMain = !!isOnMainScreen;
  if (!attached) {
    const update = () => {
      const p = window.matchMedia("(orientation: portrait)").matches;
      if (p && onMain) showRotateHint(); else hideRotateHint();
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    attached = true;
  }
  const p = window.matchMedia("(orientation: portrait)").matches;
  if (p && onMain) showRotateHint(); else hideRotateHint();
}
function showRotateHint() {
  if (rotateHintEl) return;
  rotateHintEl = document.createElement("div");
  rotateHintEl.className = "rotate-hint";
  rotateHintEl.innerHTML = '<div class="rotate-hint__icon">R</div><div class="rotate-hint__text">Gira el celular para registrar mas comodo</div>';
  document.body.appendChild(rotateHintEl);
  requestAnimationFrame(() => rotateHintEl.classList.add("rotate-hint--visible"));
}
function hideRotateHint() {
  if (!rotateHintEl) return;
  const el = rotateHintEl; rotateHintEl = null;
  el.classList.remove("rotate-hint--visible");
  setTimeout(() => el.remove(), 220);
}
