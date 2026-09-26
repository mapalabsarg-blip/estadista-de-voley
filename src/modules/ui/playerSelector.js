import { getMatchRoster, getActivePlayerId, setActivePlayer } from "../players/rosterStore.js";
import { getPlayerStats } from "../stats/statsRegistry.js";
export function renderPlayerSelector(container, onSelect) {
  const players = getMatchRoster();
  const activeId = getActivePlayerId();
  container.classList.toggle("players--empty", !activeId);
  container.innerHTML = "";
  for (const p of players) {
    const stats = getPlayerStats(p.id);
    const totalLabel = stats.total > 0 ? "+" + stats.total : String(stats.total);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "player-card" + (p.id === activeId ? " player-card--active" : "");
    btn.dataset.playerId = p.id;
    btn.setAttribute("aria-pressed", p.id === activeId ? "true" : "false");
    btn.innerHTML = '<span class="player-card__number">' + p.number + '</span><span class="player-card__name">' + p.name + '</span><span class="player-card__stats">' + totalLabel + '</span>';
    btn.addEventListener("click", () => { setActivePlayer(p.id); onSelect(p.id); });
    container.appendChild(btn);
  }
}
