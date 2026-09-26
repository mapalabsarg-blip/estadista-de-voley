const FOCUSABLE = ['a[href]','button:not([disabled])','[tabindex]:not([tabindex="-1"])','input:not([disabled]):not([type="hidden"])','select:not([disabled])','textarea:not([disabled])'].join(",");
const stack = [];
export function openModal(el, { label = "Dialogo" } = {}) {
  if (!el) return; if (stack.find((x) => x.el === el)) return;
  const previousFocus = document.activeElement;
  el.hidden = false;
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", label); el.setAttribute("tabindex", "-1");
  if (stack.length === 0) document.body.style.overflow = "hidden";
  const cleanup = installFocusTrap(el);
  stack.push({ el, cleanup, previousFocus });
  requestAnimationFrame(() => { const first = getFocusables(el)[0]; if (first) first.focus(); else el.focus(); });
}
export function closeModal(el) {
  const idx = stack.findIndex((x) => x.el === el); if (idx < 0) return;
  const entry = stack.splice(idx, 1)[0];
  entry.cleanup();
  el.hidden = true;
  el.removeAttribute("role"); el.removeAttribute("aria-modal"); el.removeAttribute("aria-label"); el.removeAttribute("tabindex");
  if (stack.length === 0) document.body.style.overflow = "";
  if (entry.previousFocus && typeof entry.previousFocus.focus === "function") { try { entry.previousFocus.focus(); } catch (_) {} }
}
export function closeTopModal() { if (stack.length === 0) return false; closeModal(stack[stack.length - 1].el); return true; }
function getFocusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true" && el.offsetParent !== null);
}
function installFocusTrap(el) {
  function onKeydown(e) {
    if (e.key === "Escape") { e.stopPropagation(); closeModal(el); return; }
    if (e.key !== "Tab") return;
    const f = getFocusables(el);
    if (f.length === 0) { e.preventDefault(); el.focus(); return; }
    const first = f[0]; const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  el.addEventListener("keydown", onKeydown);
  return () => el.removeEventListener("keydown", onKeydown);
}
