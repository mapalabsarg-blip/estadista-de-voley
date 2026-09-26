import { getMatch } from "../match/matchStore.js";
import { getMatchMeta } from "../match/matchesStore.js";
import { getPlayer } from "../players/rosterStore.js";
import { getAction, getResult } from "../../config/actions.config.js";
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
}
function timestamp() {
  const d = new Date(); const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
}
function safeName(str) { return String(str).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase(); }
function buildPrefix() {
  const match = getMatch();
  const meta = match ? getMatchMeta(match.id) : null;
  const rival = meta && meta.rival ? safeName(meta.rival) : "partido";
  const id = match ? safeName(match.id) : "sin-partido";
  return "estadista-" + id + "-vs-" + rival + "-" + timestamp();
}
export function exportEventsJSON(events) {
  const match = getMatch();
  const meta = match ? getMatchMeta(match.id) : null;
  const playerIds = new Set(events.map((e) => e.playerId));
  const players = Array.from(playerIds).map((id) => getPlayer(id)).filter(Boolean);
  const payload = { match, meta, players, exportedAt: new Date().toISOString(), events };
  download(buildPrefix() + ".json", JSON.stringify(payload, null, 2), "application/json");
}
export function exportEventsCSV(events) {
  const headers = ["event_id","match_id","set_id","player_number","player_name","action_id","action_label","result_code","result_label","value","undone","timestamp_iso"];
  const rows = events.map((e) => {
    const player = getPlayer(e.playerId); const action = getAction(e.actionId); const result = getResult(e.actionId, e.resultCode);
    return [e.id, e.matchId, e.setId, player ? player.number : "", player ? player.name : "", e.actionId, action ? action.label : "", e.resultCode, result ? result.label : "", typeof e.value === "number" ? e.value : "error", e.undone ? "1" : "0", new Date(e.timestamp).toISOString()];
  });
  download(buildPrefix() + "-eventos.csv", [headers, ...rows].map(csvRow).join("\r\n"), "text/csv");
}
export function exportSummaryCSV(data) {
  const lines = [];
  lines.push(["RESUMEN POR JUGADOR"]);
  lines.push(["player_number","player_name","action_id","action_label","count","points","errors"]);
  for (const p of data.players) for (const actionId of Object.keys(p.byAction)) {
    const a = p.byAction[actionId];
    lines.push([p.number, p.name, actionId, a.label, a.count, a.points, a.errors]);
  }
  lines.push([]); lines.push(["RESUMEN POR SET"]); lines.push(["set_id","count","points","errors","efficiency"]);
  for (const s of data.sets) lines.push([s.setId, s.count, s.points, s.errors, s.efficiency]);
  download(buildPrefix() + "-resumen.csv", lines.map(csvRow).join("\r\n"), "text/csv");
}
function csvRow(cells) {
  return cells.map((c) => { const s = c === null || c === undefined ? "" : String(c); if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; }).join(",");
}
