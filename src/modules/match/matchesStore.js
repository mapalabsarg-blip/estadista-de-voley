const INDEX_KEY = "estadista:matches";
const CURRENT_KEY = "estadista:current-match-id";
const STATE_KEY = (id) => "estadista:match:" + id + ":state";
const EVENTS_KEY = (id) => "estadista:match:" + id;
let matches = [];
let currentId = null;
const listeners = new Set();
function load() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    matches = raw ? JSON.parse(raw) : [];
    currentId = localStorage.getItem(CURRENT_KEY);
    if (currentId && !matches.find((m) => m.id === currentId)) currentId = matches[0] ? matches[0].id : null;
  } catch (e) { matches = []; currentId = null; }
}
function save() {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(matches));
    if (currentId) localStorage.setItem(CURRENT_KEY, currentId);
    else localStorage.removeItem(CURRENT_KEY);
  } catch (e) { console.warn("[matchesStore] save:", e); }
}
function emit() { for (const fn of listeners) fn(); }
export function initMatchesStore() { load(); }
export function listMatches() { return matches.slice().sort((a, b) => b.createdAt - a.createdAt); }
export function getMatchMeta(id) { return matches.find((m) => m.id === id) || null; }
export function getCurrentMatchId() { return currentId; }
export function setCurrentMatchId(id) {
  if (!matches.find((m) => m.id === id)) return false;
  currentId = id; save(); emit(); return true;
}
export function createMatch({ rival, rosterIds } = {}) {
  const id = "m" + Date.now().toString(36);
  const meta = { id, rival: (rival || "").trim() || "Rival", createdAt: Date.now(), status: "open", rosterIds: Array.isArray(rosterIds) ? rosterIds.slice() : [] };
  matches.push(meta); currentId = id; save(); emit(); return meta;
}
export function closeMatch(id) { const m = matches.find((x) => x.id === id); if (!m) return; m.status = "closed"; save(); emit(); }
export function reopenMatch(id) { const m = matches.find((x) => x.id === id); if (!m) return; m.status = "open"; save(); emit(); }
export function deleteMatch(id) {
  const idx = matches.findIndex((m) => m.id === id); if (idx < 0) return;
  matches.splice(idx, 1);
  try { localStorage.removeItem(STATE_KEY(id)); localStorage.removeItem(EVENTS_KEY(id)); } catch (_) {}
  if (currentId === id) currentId = matches[0] ? matches[0].id : null;
  save(); emit();
}
export function writeRawMatch({ meta, state, events }) {
  if (!meta || !meta.id) throw new Error("writeRawMatch: meta.id requerido");
  const idx = matches.findIndex((m) => m.id === meta.id);
  if (idx >= 0) matches[idx] = { ...matches[idx], ...meta };
  else matches.push(meta);
  try {
    if (state) localStorage.setItem(STATE_KEY(meta.id), JSON.stringify(state));
    if (Array.isArray(events)) localStorage.setItem(EVENTS_KEY(meta.id), JSON.stringify(events));
  } catch (e) { console.warn("[matchesStore] writeRawMatch:", e); }
  save(); emit();
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
