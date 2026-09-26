let toastEl = null;
let hideTimeout = null;
export function showFeedback(text, type = "info") {
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
  toastEl.textContent = text;
  toastEl.className = "toast toast--" + type;
  void toastEl.offsetWidth;
  toastEl.classList.add("toast--visible");
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => toastEl.classList.remove("toast--visible"), 1200);
  vibrate();
}
function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) { try { navigator.vibrate(30); } catch (_) {} }
}
