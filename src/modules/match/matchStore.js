import { getCurrentMatchId, getMatchMeta, subscribe as subscribeMatches } from "./matchesStore.js";
const stateKey = (id) => "estadista:match:" + id + ":state";
let match = null;
const listeners = new Set();
function defaultState(id, rosterIds) {
  return { id, currentSetId: "s1", setNumber: 1, sets: [{ id: "s1", number: 1, local: 0, visitante: 0, closed: false }], autoScore: true, rosterIds: rosterIds || [] };
}
function loadMatch() {
  const id = getCurrentMatchId();
  if (!id) { match = null; return; }
  const meta = getMatchMeta(id);
  const rosterIds = meta ? meta.rosterIds : [];
  try {
    const raw = localStorage.getItem(stateKey(id));
    if (!raw) { match = defaultState(id, rosterIds); return; }
    const parsed = JSON.parse(raw);
    if (!parsed.sets || !parsed.currentSetId) { match = defaultState(id, rosterIds); return; }
    if (!Array.isArray(parsed.rosterIds)) parsed.rosterIds = rosterIds;
    match = parsed;
  } catch (e) { match = defaultState(id, rosterIds); }
}
function save() {
  if (!match) return;
  try { localStorage.setItem(stateKey(match.id), JSON.stringify(match)); } catch (e) {}
}
function emit() { for (const fn of listeners) fn(match); }
export function initMatchStore() {
  loadMatch();
  subscribeMatches(() => { loadMatch(); emit(); });
}
export function getMatch() { return match; }
export function getMatchId() { return match ? match.id : null; }
export function getCurrentSetId() { return match ? match.currentSetId : null; }
export function getCurrentSet() { return match ? match.sets.find((s) => s.id === match.currentSetId) : null; }
export function getSetsWon() {
  if (!match) return { local: 0, visitante: 0 };
  let local = 0, visitante = 0;
  for (const s of match.sets) { if (!s.closed) continue; if (s.local > s.visitante) local++; else if (s.visitante > s.local) visitante++; }
  return { local, visitante };
}
export function addPoint(side) {
  const set = getCurrentSet(); if (!set || set.closed) return;
  if (side !== "local" && side !== "visitante") return;
  set[side] += 1; save(); emit();
}
export function removePoint(side) {
  const set = getCurrentSet(); if (!set || set.closed) return;
  if (side !== "local" && side !== "visitante") return;
  set[side] = Math.max(0, set[side] - 1); save(); emit();
}
export function adjustSetScore(setId, side, delta) {
  if (!match) return;
  const set = match.sets.find((s) => s.id === setId); if (!set) return;
  if (side !== "local" && side !== "visitante") return;
  set[side] = Math.max(0, set[side] + delta); save(); emit();
}
export function closeCurrentSet() {
  if (!match) return;
  const set = getCurrentSet(); if (!set) return;
  set.closed = true; match.setNumber += 1;
  const newId = "s" + match.setNumber;
  match.sets.push({ id: newId, number: match.setNumber, local: 0, visitante: 0, closed: false });
  match.currentSetId = newId; save(); emit();
}
export function setAutoScore(v) { if (!match) return; match.autoScore = !!v; save(); emit(); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
