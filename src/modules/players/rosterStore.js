import { getMatch } from "../match/matchStore.js";
const team = [
  { id: "p1", name: "Lucas", number: 7, position: "opuesto" },
  { id: "p2", name: "Martin", number: 4, position: "central" },
  { id: "p3", name: "Santi", number: 10, position: "punta" },
  { id: "p4", name: "Nico", number: 12, position: "libero" },
  { id: "p5", name: "Fede", number: 3, position: "armador" },
  { id: "p6", name: "Tomas", number: 9, position: "punta" }
];
let activePlayerId = null;
export function getTeamPlayers() { return team.slice(); }
export function getPlayer(id) { return team.find((p) => p.id === id) || null; }
export function getMatchRoster() {
  const match = getMatch();
  if (!match || !Array.isArray(match.rosterIds) || match.rosterIds.length === 0) return team.slice();
  const ids = new Set(match.rosterIds);
  const filtered = team.filter((p) => ids.has(p.id));
  return filtered.length > 0 ? filtered : team.slice();
}
export function getActivePlayerId() { return activePlayerId; }
export function setActivePlayer(id) { activePlayerId = id; }
export function clearActivePlayer() { activePlayerId = null; }
