import { listMatches, getCurrentMatchId, setCurrentMatchId, createMatch, closeMatch, reopenMatch, deleteMatch } from "../match/matchesStore.js";
import { getTeamPlayers } from "../players/rosterStore.js";
import { showFeedback } from "./feedback.js";
import { readFileAsText, parseAndValidate, applyImport } from "../export/importer.js";
export function renderMatchesView(container, options = {}) {
  const onClose = options.onClose || (() => {});
  const matches = listMatches();
  const currentId = getCurrentMatchId();
  container.className = "matches-view";
  container.innerHTML = "";
  const header = document.createElement("div");
  header.className = "matches-view__header";
  header.innerHTML = '<div><div class="matches-view__title-main">Partidos</div><div class="matches-view__title-sub">' + matches.length + ' guardado' + (matches.length === 1 ? "" : "s") + '</div></div><button type="button" class="matches-view__back">Volver</button>';
  header.querySelector(".matches-view__back").addEventListener("click", onClose);
  container.appendChild(header);
  const topActions = document.createElement("div");
  topActions.className = "matches-view__top-actions";
  const newBtn = document.createElement("button"); newBtn.type = "button"; newBtn.className = "matches-view__new"; newBtn.textContent = "Nuevo partido";
  const importBtn = document.createElement("button"); importBtn.type = "button"; importBtn.className = "matches-view__import"; importBtn.textContent = "Importar JSON";
  const fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.accept = ".json,application/json"; fileInput.hidden = true;
  topActions.appendChild(newBtn); topActions.appendChild(importBtn); topActions.appendChild(fileInput);
  container.appendChild(topActions);
  const form = document.createElement("div");
  form.className = "match-form"; form.hidden = true;
  form.innerHTML = '<label class="match-form__label">Rival<input type="text" class="match-form__input" placeholder="Ej: Defensores" maxlength="40" /></label><div class="match-form__label">Plantel convocado<div class="match-form__roster"></div></div><div class="match-form__actions"><button type="button" class="match-form__btn match-form__btn--primary">Crear y jugar</button><button type="button" class="match-form__btn match-form__btn--ghost">Cancelar</button></div>';
  const rosterWrap = form.querySelector(".match-form__roster");
  for (const p of getTeamPlayers()) {
    const item = document.createElement("label");
    item.className = "match-form__player";
    item.innerHTML = '<input type="checkbox" value="' + p.id + '" checked /><span class="match-form__num">' + p.number + '</span><span class="match-form__name">' + p.name + '</span>';
    rosterWrap.appendChild(item);
  }
  form.querySelector(".match-form__btn--ghost").addEventListener("click", () => { form.hidden = true; newBtn.hidden = false; importBtn.hidden = false; });
  form.querySelector(".match-form__btn--primary").addEventListener("click", () => {
    const rival = form.querySelector(".match-form__input").value.trim() || "Rival";
    const rosterIds = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map((c) => c.value);
    createMatch({ rival, rosterIds });
    showFeedback("Partido vs " + rival + " creado", "ok");
    onClose();
  });
  newBtn.addEventListener("click", () => { form.hidden = false; newBtn.hidden = true; importBtn.hidden = true; importPanel.hidden = true; form.querySelector(".match-form__input").focus(); });
  container.appendChild(form);
  const importPanel = document.createElement("div"); importPanel.className = "import-panel"; importPanel.hidden = true;
  container.appendChild(importPanel);
  importBtn.addEventListener("click", () => { fileInput.value = ""; fileInput.click(); });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0]; if (!file) return;
    let text;
    try { text = await readFileAsText(file); } catch (e) { window.alert("No se pudo leer el archivo."); return; }
    const result = parseAndValidate(text);
    if (!result.ok) { window.alert("El archivo no es un backup valido:\n\n- " + result.errors.slice(0, 8).join("\n- ")); return; }
    if (result.warnings.length > 0) { if (!window.confirm("Avisos:\n\n- " + result.warnings.join("\n- ") + "\n\nContinuar?")) return; }
    showImportConfirm(importPanel, result.summary, {
      onReplace: () => runImport(result.payload, "replace", onClose),
      onMerge: () => runImport(result.payload, "merge", onClose),
      onCancel: () => { importPanel.hidden = true; newBtn.hidden = false; importBtn.hidden = false; }
    });
    form.hidden = true; newBtn.hidden = true; importBtn.hidden = true; importPanel.hidden = false;
  });
  if (matches.length === 0) {
    const empty = document.createElement("div"); empty.className = "matches-view__empty";
    empty.textContent = "No hay partidos todavia. Crea uno o importa un backup JSON.";
    container.appendChild(empty);
    return;
  }
  const list = document.createElement("div"); list.className = "matches-list";
  for (const m of matches) list.appendChild(buildMatchRow(m, currentId, onClose));
  container.appendChild(list);
}
function showImportConfirm(panel, summary, handlers) {
  panel.innerHTML = '<div class="import-panel__title">Confirmar import</div><div class="import-panel__row"><span>Rival</span><b>' + esc(summary.rival) + '</b></div><div class="import-panel__row"><span>ID</span><b>' + esc(summary.matchId) + '</b></div><div class="import-panel__row"><span>Eventos</span><b>' + summary.totalEvents + '</b></div><div class="import-panel__row"><span>Activos</span><b>' + summary.activeEvents + '</b></div><div class="import-panel__row"><span>Deshechos</span><b>' + summary.undoneEvents + '</b></div><div class="import-panel__hint"><b>Reemplazar</b>: sobrescribe si existe el mismo ID.<br><b>Fusionar</b>: crea uno nuevo con ID distinto.</div><div class="import-panel__actions"><button type="button" class="import-panel__btn import-panel__btn--primary" data-action="replace">Reemplazar</button><button type="button" class="import-panel__btn import-panel__btn--secondary" data-action="merge">Fusionar</button><button type="button" class="import-panel__btn import-panel__btn--ghost" data-action="cancel">Cancelar</button></div>';
  panel.querySelector('[data-action="replace"]').addEventListener("click", handlers.onReplace);
  panel.querySelector('[data-action="merge"]').addEventListener("click", handlers.onMerge);
  panel.querySelector('[data-action="cancel"]').addEventListener("click", handlers.onCancel);
}
function runImport(payload, mode, onClose) {
  try { applyImport(payload, mode); showFeedback("Partido " + (mode === "replace" ? "reemplazado" : "fusionado"), "ok"); onClose(); }
  catch (e) { window.alert("No se pudo importar: " + (e && e.message ? e.message : "error")); }
}
function buildMatchRow(meta, currentId, onClose) {
  const isCurrent = meta.id === currentId;
  const dateStr = formatDate(meta.createdAt);
  const row = document.createElement("div");
  row.className = "match-row" + (isCurrent ? " match-row--current" : "");
  const info = document.createElement("div"); info.className = "match-row__info";
  info.innerHTML = '<div class="match-row__top"><span class="match-row__rival">' + esc(meta.rival) + '</span><span class="match-row__status match-row__status--' + meta.status + '">' + (meta.status === "open" ? "En curso" : "Cerrado") + '</span></div><div class="match-row__meta">' + dateStr + ' · ' + (meta.rosterIds && meta.rosterIds.length ? meta.rosterIds.length + " jugadores" : "plantel completo") + (isCurrent ? ' · <span class="match-row__current">ACTIVO</span>' : "") + '</div>';
  row.appendChild(info);
  const actions = document.createElement("div"); actions.className = "match-row__actions";
  if (!isCurrent) {
    const bp = document.createElement("button"); bp.type = "button"; bp.className = "match-row__btn match-row__btn--primary"; bp.textContent = "Activar";
    bp.addEventListener("click", () => { setCurrentMatchId(meta.id); showFeedback("Partido vs " + meta.rival + " activado", "ok"); onClose(); });
    actions.appendChild(bp);
  }
  const bs = document.createElement("button"); bs.type = "button"; bs.className = "match-row__btn"; bs.textContent = meta.status === "open" ? "Cerrar" : "Reabrir";
  bs.addEventListener("click", () => {
    if (meta.status === "open") { if (!window.confirm("Cerrar el partido vs " + meta.rival + "?")) return; closeMatch(meta.id); showFeedback("Cerrado", "warn"); }
    else { reopenMatch(meta.id); showFeedback("Reabierto", "ok"); }
  });
  actions.appendChild(bs);
  const bd = document.createElement("button"); bd.type = "button"; bd.className = "match-row__btn match-row__btn--danger"; bd.textContent = "Eliminar";
  bd.addEventListener("click", () => { if (!window.confirm("Eliminar el partido vs " + meta.rival + "?")) return; deleteMatch(meta.id); showFeedback("Eliminado", "warn"); });
  actions.appendChild(bd);
  row.appendChild(actions);
  return row;
}
function formatDate(ts) {
  try { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ts)); }
  catch (_) { return new Date(ts).toLocaleString(); }
}
function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
