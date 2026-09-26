import { ACTIONS, getAction } from "../../config/actions.config.js";
export function summarize(events) {
  const summary = { count: 0, points: 0, errors: 0, efficiency: 0, byAction: {} };
  for (const action of ACTIONS) summary.byAction[action.id] = { label: action.label, count: 0, points: 0, errors: 0, results: {} };
  for (const e of events) {
    const a = summary.byAction[e.actionId]; if (!a) continue;
    summary.count += 1; a.count += 1;
    a.results[e.resultCode] = (a.results[e.resultCode] || 0) + 1;
    if (e.resultCode === "E") { summary.errors += 1; a.errors += 1; }
    else if (typeof e.value === "number") { summary.points += e.value; a.points += e.value; }
  }
  summary.efficiency = summary.count > 0 ? +(summary.points / summary.count).toFixed(2) : 0;
  return summary;
}
export function getActiveEvents(events) { return events.filter((e) => !e.undone); }
export function getMatchSummary(events) { return summarize(getActiveEvents(events)); }
export function getPlayerSummary(events, playerId) { return summarize(getActiveEvents(events).filter((e) => e.playerId === playerId)); }
export function getSetSummary(events, setId) { return summarize(getActiveEvents(events).filter((e) => e.setId === setId)); }
export function getPerSetBreakdown(events) {
  const active = getActiveEvents(events);
  const bySet = new Map();
  for (const e of active) { if (!bySet.has(e.setId)) bySet.set(e.setId, []); bySet.get(e.setId).push(e); }
  const result = [];
  for (const [setId, setEvents] of bySet) result.push({ setId, ...summarize(setEvents) });
  result.sort((a, b) => {
    const na = parseInt(String(a.setId).replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(String(b.setId).replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });
  return result;
}
export function getResultLabel(actionId, code) {
  const a = getAction(actionId); if (!a) return code;
  const r = a.results.find((x) => x.code === code); return r ? r.label : code;
}
