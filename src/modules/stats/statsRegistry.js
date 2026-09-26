import { loadEvents, saveEvents } from "../persistence/localStore.js";
import { getMatchId, getCurrentSetId } from "../match/matchStore.js";
let events = [];
const listeners = new Set();
export function initRegistry() { events = loadEvents(getMatchId()); }
export function reloadRegistry() { events = loadEvents(getMatchId()); emit(); }
export function getEvents() { return events; }
export function registerStat({ playerId, actionId, resultCode, value }) {
  const matchId = getMatchId(); const setId = getCurrentSetId();
  if (!matchId || !setId) return null;
  const event = { id: "e" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), matchId, setId, playerId, actionId, resultCode, value, timestamp: Date.now(), undone: false };
  events.push(event); saveEvents(matchId, events); emit(); return event;
}
export function undoLast() {
  for (let i = events.length - 1; i >= 0; i--) {
    if (!events[i].undone) {
      events[i].undone = true; saveEvents(getMatchId(), events); emit(); return events[i];
    }
  }
  return null;
}
export function getPlayerStats(playerId) {
  const stats = { total: 0, count: 0, byAction: {} };
  for (const e of events) {
    if (e.undone || e.playerId !== playerId) continue;
    if (typeof e.value === "number") stats.total += e.value;
    stats.count += 1;
    stats.byAction[e.actionId] = (stats.byAction[e.actionId] || 0) + 1;
  }
  return stats;
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { for (const fn of listeners) fn(); }
