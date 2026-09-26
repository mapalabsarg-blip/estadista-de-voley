const PREFIX = "estadista:match:";
export function loadEvents(matchId) {
  if (!matchId) return [];
  try { const raw = localStorage.getItem(PREFIX + matchId); return raw ? JSON.parse(raw) : []; }
  catch (e) { console.warn("[localStore] load:", e); return []; }
}
export function saveEvents(matchId, events) {
  if (!matchId) return;
  try { localStorage.setItem(PREFIX + matchId, JSON.stringify(events)); }
  catch (e) { console.warn("[localStore] save:", e); }
}
