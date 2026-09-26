import { getTeamPlayers } from "../players/rosterStore.js";
import { writeRawMatch, setCurrentMatchId } from "../match/matchesStore.js";
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error || new Error("Error de lectura"));
    r.readAsText(file);
  });
}
export function parseAndValidate(text) {
  let payload;
  try { payload = JSON.parse(text); } catch (e) { return { ok: false, errors: ["El archivo no es un JSON valido."], warnings: [] }; }
  return validatePayload(payload);
}
export function validatePayload(payload) {
  const errors = []; const warnings = [];
  if (!payload || typeof payload !== "object") return { ok: false, errors: ["El archivo no contiene un objeto."], warnings };
  if (!Array.isArray(payload.events)) errors.push("Falta el array 'events'.");
  if (!payload.match || typeof payload.match !== "object") errors.push("Falta el objeto 'match'.");
  else {
    if (!payload.match.id) errors.push("El partido no tiene 'id'.");
    if (!Array.isArray(payload.match.sets)) errors.push("El partido no tiene 'sets'.");
    if (!payload.match.currentSetId) errors.push("El partido no tiene 'currentSetId'.");
  }
  if (Array.isArray(payload.events)) payload.events.forEach((e, i) => {
    if (!e || typeof e !== "object") { errors.push("Evento " + i + " invalido."); return; }
    if (!e.id) errors.push("Evento " + i + " sin 'id'.");
    if (!e.playerId) errors.push("Evento " + i + " sin 'playerId'.");
    if (!e.actionId) errors.push("Evento " + i + " sin 'actionId'.");
    if (!e.resultCode) errors.push("Evento " + i + " sin 'resultCode'.");
    if (!e.setId) errors.push("Evento " + i + " sin 'setId'.");
  });
  const knownIds = new Set(getTeamPlayers().map((p) => p.id));
  const unknown = new Set();
  if (Array.isArray(payload.events)) for (const e of payload.events) if (e && e.playerId && !knownIds.has(e.playerId)) unknown.add(e.playerId);
  if (unknown.size > 0) warnings.push("Hay eventos de " + unknown.size + " jugador(es) que no estan en el plantel actual (" + [...unknown].join(", ") + ").");
  const result = { ok: errors.length === 0, errors, warnings };
  if (errors.length === 0) { result.payload = payload; result.summary = summarizePayload(payload); }
  return result;
}
function summarizePayload(payload) {
  const events = payload.events || []; const meta = payload.meta || {};
  const active = events.filter((e) => !e.undone).length;
  let exportedAt = "";
  if (payload.exportedAt) { try { exportedAt = new Date(payload.exportedAt).toLocaleString(); } catch (_) { exportedAt = String(payload.exportedAt); } }
  return { rival: meta.rival || payload.match.id || "?", matchId: payload.match.id, totalEvents: events.length, activeEvents: active, undoneEvents: events.length - active, exportedAt };
}
export function applyImport(payload, mode) {
  const srcId = payload.match.id; const meta = payload.meta || {}; const now = Date.now();
  const rosterIds = Array.isArray(payload.match.rosterIds) && payload.match.rosterIds.length > 0 ? payload.match.rosterIds.slice() : Array.isArray(meta.rosterIds) ? meta.rosterIds.slice() : [];
  if (mode === "replace") {
    const newMeta = { id: srcId, rival: meta.rival || srcId, createdAt: meta.createdAt || now, status: meta.status === "closed" ? "closed" : "open", rosterIds };
    const newState = { ...payload.match, id: srcId, rosterIds };
    writeRawMatch({ meta: newMeta, state: newState, events: payload.events });
    setCurrentMatchId(srcId);
    return { ok: true, matchId: srcId, mode };
  }
  const newId = "m" + Date.now().toString(36);
  const remappedEvents = payload.events.map((e) => ({ ...e, matchId: newId }));
  const newMeta = { id: newId, rival: (meta.rival || srcId) + " (importado)", createdAt: meta.createdAt || now, status: meta.status === "closed" ? "closed" : "open", rosterIds };
  const newState = { ...payload.match, id: newId, rosterIds };
  writeRawMatch({ meta: newMeta, state: newState, events: remappedEvents });
  setCurrentMatchId(newId);
  return { ok: true, matchId: newId, mode };
}
