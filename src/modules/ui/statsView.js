import { getMatchSummary, getPlayerSummary, getPerSetBreakdown } from "../stats/statsQueries.js";
import { exportEventsJSON, exportEventsCSV, exportSummaryCSV } from "../export/exporter.js";
import { getMatchRoster } from "../players/rosterStore.js";
import { getCurrentSetId, getSetsWon } from "../match/matchStore.js";
import { APP_NAME, APP_VERSION, APP_REPO_URL } from "../../config/app.config.js";
export function renderStatsView(container, events, options = {}) {
  const setsWon = getSetsWon();
  const currentSetId = getCurrentSetId();
  const scope = container.dataset.scope || "match";
  const scoped = scope === "set" ? events.filter((e) => e.setId === currentSetId) : events;
  const matchSummary = getMatchSummary(scoped);
  const players = getMatchRoster();
  const perSet = getPerSetBreakdown(events);
  container.className = "stats-view";
  container.innerHTML = "";
  const header = document.createElement("div");
  header.className = "stats-view__header";
  header.innerHTML = '<div><div class="stats-view__title-main">Estadisticas</div><div class="stats-view__title-sub">Sets ' + setsWon.local + "-" + setsWon.visitante + " · " + (scope === "set" ? "Set actual" : "Partido completo") + '</div></div><button type="button" class="stats-view__back">Volver</button>';
  header.querySelector(".stats-view__back").addEventListener("click", () => options.onClose && options.onClose());
  container.appendChild(header);
  const toggle = document.createElement("div");
  toggle.className = "stats-toggle";
  toggle.innerHTML = '<button type="button" class="stats-toggle__btn" data-scope="match">Partido</button><button type="button" class="stats-toggle__btn" data-scope="set">Set actual</button>';
  toggle.querySelectorAll(".stats-toggle__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scope === scope);
    btn.addEventListener("click", () => { container.dataset.scope = btn.dataset.scope; renderStatsView(container, events, options); });
  });
  container.appendChild(toggle);
  const summary = document.createElement("div");
  summary.className = "stats-summary";
  summary.innerHTML = '<div class="stats-summary__cell"><div class="stats-summary__value">' + matchSummary.count + '</div><div class="stats-summary__label">Acciones</div></div><div class="stats-summary__cell stats-summary__cell--pos"><div class="stats-summary__value">+' + matchSummary.points + '</div><div class="stats-summary__label">Puntos</div></div><div class="stats-summary__cell stats-summary__cell--neg"><div class="stats-summary__value">' + matchSummary.errors + '</div><div class="stats-summary__label">Errores</div></div><div class="stats-summary__cell"><div class="stats-summary__value">' + matchSummary.efficiency + '</div><div class="stats-summary__label">Eficiencia</div></div>';
  container.appendChild(summary);
  const tableWrap = document.createElement("div");
  tableWrap.className = "stats-table-wrap";
  tableWrap.appendChild(buildPlayerTable(players, scoped));
  container.appendChild(tableWrap);
  if (perSet.length > 0) {
    const setSection = document.createElement("div");
    setSection.className = "stats-sets";
    setSection.innerHTML = '<div class="stats-sets__title">Por set</div>';
    for (const s of perSet) {
      const row = document.createElement("div");
      row.className = "stats-sets__row" + (s.setId === currentSetId ? " is-current" : "");
      row.innerHTML = '<span class="stats-sets__set">Set ' + String(s.setId).replace(/\D/g, "") + '</span><span class="stats-sets__num">' + s.count + ' acc.</span><span class="stats-sets__num stats-sets__num--pos">+' + s.points + '</span><span class="stats-sets__num stats-sets__num--neg">' + s.errors + ' err.</span><span class="stats-sets__num">eff ' + s.efficiency + '</span>';
      setSection.appendChild(row);
    }
    container.appendChild(setSection);
  }
  const exportBar = document.createElement("div");
  exportBar.className = "stats-export";
  const b1 = document.createElement("button"); b1.type = "button"; b1.className = "stats-export__btn"; b1.textContent = "JSON eventos"; b1.addEventListener("click", () => exportEventsJSON(events));
  const b2 = document.createElement("button"); b2.type = "button"; b2.className = "stats-export__btn"; b2.textContent = "CSV eventos"; b2.addEventListener("click", () => exportEventsCSV(events));
  const b3 = document.createElement("button"); b3.type = "button"; b3.className = "stats-export__btn"; b3.textContent = "CSV resumen"; b3.addEventListener("click", () => {
    const playersData = players.map((p) => ({ id: p.id, number: p.number, name: p.name, ...getPlayerSummary(events, p.id) }));
    exportSummaryCSV({ players: playersData, sets: perSet, matchSummary });
  });
  exportBar.appendChild(b1); exportBar.appendChild(b2); exportBar.appendChild(b3);
  container.appendChild(exportBar);
  const footer = document.createElement("div");
  footer.className = "stats-view__footer";
  footer.innerHTML = '<span>' + APP_NAME + ' v' + APP_VERSION + '</span><a href="' + APP_REPO_URL + '" target="_blank" rel="noopener noreferrer">GitHub</a>';
  container.appendChild(footer);
}
function buildPlayerTable(players, scopedEvents) {
  const table = document.createElement("div");
  table.className = "stats-table";
  const head = document.createElement("div");
  head.className = "stats-table__row stats-table__row--head";
  head.innerHTML = '<div class="stats-table__cell stats-table__cell--player">Jugador</div><div class="stats-table__cell">Atq</div><div class="stats-table__cell">Saq</div><div class="stats-table__cell">Rec</div><div class="stats-table__cell">Def</div><div class="stats-table__cell stats-table__cell--tot">Tot</div><div class="stats-table__cell stats-table__cell--eff">Eff</div>';
  table.appendChild(head);
  for (const p of players) {
    const s = getPlayerSummary(scopedEvents, p.id);
    const row = document.createElement("div");
    row.className = "stats-table__row";
    const cells = [];
    cells.push('<div class="stats-table__cell stats-table__cell--player"><span class="stats-table__num">' + p.number + '</span><span class="stats-table__name">' + p.name + '</span></div>');
    for (const actionId of ["ataque", "saque", "recepcion", "defensa"]) {
      const a = s.byAction[actionId] || { count: 0, points: 0, errors: 0 };
      cells.push('<div class="stats-table__cell"><div class="stats-table__points"><span class="stats-table__pts pos">' + (a.points > 0 ? "+" + a.points : a.points) + '</span><span class="stats-table__sep">/</span><span class="stats-table__err neg">' + a.errors + '</span></div><div class="stats-table__count">' + a.count + '</div></div>');
    }
    cells.push('<div class="stats-table__cell stats-table__cell--tot"><div class="stats-table__tot-count">' + s.count + '</div><div class="stats-table__tot-pts">' + (s.points > 0 ? "+" + s.points : s.points) + '</div></div>');
    cells.push('<div class="stats-table__cell stats-table__cell--eff">' + s.efficiency + '</div>');
    row.innerHTML = cells.join("");
    table.appendChild(row);
  }
  return table;
}
