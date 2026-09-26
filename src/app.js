import { renderPlayerSelector } from "./modules/ui/playerSelector.js";
import { renderActionPanel } from "./modules/ui/actionPanel.js";
import { renderResultPanel } from "./modules/ui/resultPanel.js";
import { renderScorePanel, confirmNewSet } from "./modules/ui/scorePanel.js";
import { renderStatsView } from "./modules/ui/statsView.js";
import { renderMatchesView } from "./modules/ui/matchesView.js";
import { showFeedback } from "./modules/ui/feedback.js";
import { openModal, closeModal } from "./modules/ui/modal.js";
import { registerServiceWorker } from "./modules/pwa/registerSW.js";
import { initInstallBanner } from "./modules/ui/installBanner.js";
import { lockLandscape, unlockOrientation, watchRotation } from "./modules/ui/orientation.js";
import { getActivePlayerId, getPlayer, clearActivePlayer, getMatchRoster } from "./modules/players/rosterStore.js";
import { initMatchesStore, getCurrentMatchId, subscribe as subscribeMatches } from "./modules/match/matchesStore.js";
import { initMatchStore, getMatch, getCurrentSetId, adjustSetScore, closeCurrentSet, subscribe as subscribeMatch } from "./modules/match/matchStore.js";
import { initRegistry, reloadRegistry, registerStat, undoLast, getEvents, subscribe as subscribeRegistry } from "./modules/stats/statsRegistry.js";
import { getAction, getResult } from "./config/actions.config.js";
import { APP_VERSION } from "./config/app.config.js";
const state = { selectedActionId: null, lastTapTime: 0, statsOpen: false, matchesOpen: false };
const els = {
  setInfo: document.getElementById("set-info"), setsWon: document.getElementById("sets-won"),
  scoreLocal: document.getElementById("score-local"), scoreVisitante: document.getElementById("score-visitante"),
  scoreLocalPlus: document.getElementById("score-local-plus"), scoreLocalMinus: document.getElementById("score-local-minus"),
  scoreVisitantePlus: document.getElementById("score-visitante-plus"), scoreVisitanteMinus: document.getElementById("score-visitante-minus"),
  undoBtn: document.getElementById("undo-btn"), newSetBtn: document.getElementById("new-set-btn"),
  statsBtn: document.getElementById("stats-btn"), matchesBtn: document.getElementById("matches-btn"),
  players: document.getElementById("players-list"), panel: document.getElementById("bottom-panel"),
  statsContainer: document.getElementById("stats-container"), matchesContainer: document.getElementById("matches-container")
};
function init() {
  initMatchesStore();
  initMatchStore();
  initRegistry();
  subscribeMatches(() => { clearActivePlayer(); state.selectedActionId = null; reloadRegistry(); });
  subscribeMatch(() => { reloadRegistry(); renderScore(); renderPanel(); ensureActivePlayerInRoster(); });
  subscribeRegistry(() => { renderAll(); if (state.statsOpen) renderStats(); });
  els.statsBtn.addEventListener("click", openStats);
  els.matchesBtn.addEventListener("click", openMatches);
  renderAll();
  registerServiceWorker();
  initInstallBanner();
  lockLandscape();
  watchRotation(true);
  if (!getCurrentMatchId()) openMatches();
  console.info("[El Estadista del Voley] v" + APP_VERSION);
}
function renderAll() {
  renderScore();
  renderPlayerSelector(els.players, handlePlayerSelect);
  renderPanel();
}
function renderScore() { renderScorePanel(els, { onUndo: handleUndo, onNewSet: handleNewSet }); }
function renderPanel() {
  if (state.selectedActionId) renderResultPanel(els.panel, state.selectedActionId, handleResult, handleCancelAction);
  else renderActionPanel(els.panel, handleAction);
}
function ensureActivePlayerInRoster() {
  const id = getActivePlayerId(); if (!id) return;
  if (!getMatchRoster().find((p) => p.id === id)) clearActivePlayer();
}
function openStats() {
  state.statsOpen = true;
  unlockOrientation();
  watchRotation(false);
  openModal(els.statsContainer, { label: "Estadisticas" });
  renderStats();
}
function closeStats() { closeModal(els.statsContainer); state.statsOpen = false; lockLandscape(); watchRotation(true); }
function renderStats() { renderStatsView(els.statsContainer, getEvents(), { onClose: closeStats }); }
function openMatches() {
  state.matchesOpen = true;
  unlockOrientation();
  watchRotation(false);
  openModal(els.matchesContainer, { label: "Partidos" });
  renderMatches();
}
function closeMatches() { closeModal(els.matchesContainer); state.matchesOpen = false; renderAll(); lockLandscape(); watchRotation(true); }
function renderMatches() { renderMatchesView(els.matchesContainer, { onClose: closeMatches }); }
function handlePlayerSelect() { state.selectedActionId = null; renderAll(); }
function handleAction(actionId) {
  if (!getActivePlayerId()) { showFeedback("Elegi un jugador primero", "warn"); return; }
  state.selectedActionId = actionId;
  renderPanel();
}
function handleCancelAction() { state.selectedActionId = null; renderPanel(); }
function handleResult(result) {
  const now = Date.now(); if (now - state.lastTapTime < 300) return; state.lastTapTime = now;
  const playerId = getActivePlayerId(); if (!playerId) { showFeedback("Elegi un jugador primero", "warn"); return; }
  const player = getPlayer(playerId); const action = getAction(state.selectedActionId);
  if (!player || !action) return;
  const fullResult = getResult(action.id, result.code) || result;
  const created = registerStat({ playerId, actionId: action.id, resultCode: fullResult.code, value: fullResult.value });
  if (!created) { showFeedback("No hay partido activo", "warn"); return; }
  const match = getMatch();
  if (match && match.autoScore && fullResult.scoring) adjustSetScore(getCurrentSetId(), "local", +1);
  showFeedback(action.label + " " + fullResult.code + " -> " + player.name, "ok");
  state.selectedActionId = null;
  renderAll();
}
function handleUndo() {
  const removed = undoLast(); if (!removed) { showFeedback("Nada para deshacer", "warn"); return; }
  const fullResult = getResult(removed.actionId, removed.resultCode);
  const match = getMatch();
  if (match && match.autoScore && fullResult && fullResult.scoring) adjustSetScore(removed.setId, "local", -1);
  const player = getPlayer(removed.playerId); const action = getAction(removed.actionId);
  showFeedback("Deshecho: " + (action ? action.label : "?") + " " + removed.resultCode + " -> " + (player ? player.name : "?"), "warn");
}
function handleNewSet() {
  if (!getMatch()) { showFeedback("No hay partido activo", "warn"); return; }
  if (!confirmNewSet()) return;
  closeCurrentSet();
  showFeedback("Nuevo set en 0-0", "warn");
}
init();
