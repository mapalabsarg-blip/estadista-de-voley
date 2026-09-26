import { getMatch, getCurrentSet, getSetsWon, addPoint, removePoint, closeCurrentSet } from "../match/matchStore.js";
export function renderScorePanel(els, handlers) {
  const match = getMatch();
  const set = getCurrentSet();
  const setsWon = getSetsWon();
  els.setInfo.textContent = match ? "Set " + match.setNumber : "Sin partido";
  els.setsWon.textContent = "Sets " + setsWon.local + "-" + setsWon.visitante;
  els.scoreLocal.textContent = set ? set.local : 0;
  els.scoreVisitante.textContent = set ? set.visitante : 0;
  els.scoreLocalMinus.disabled = !set || set.local === 0;
  els.scoreVisitanteMinus.disabled = !set || set.visitante === 0;
  replaceListener(els.scoreLocalPlus, () => addPoint("local"));
  replaceListener(els.scoreLocalMinus, () => removePoint("local"));
  replaceListener(els.scoreVisitantePlus, () => addPoint("visitante"));
  replaceListener(els.scoreVisitanteMinus, () => removePoint("visitante"));
  replaceListener(els.undoBtn, handlers.onUndo);
  replaceListener(els.newSetBtn, handlers.onNewSet);
}
function replaceListener(el, fn) {
  if (!el) return;
  if (el.__bound) el.removeEventListener("click", el.__bound);
  el.__bound = fn; el.addEventListener("click", fn);
}
export function confirmNewSet() {
  const set = getCurrentSet(); if (!set) return false;
  const total = set.local + set.visitante; if (total === 0) return true;
  return window.confirm("Cerrar el set " + set.number + "? Marcador: " + set.local + "-" + set.visitante);
}
export { closeCurrentSet };
