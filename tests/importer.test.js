import test from "node:test";
import assert from "node:assert/strict";
import { parseAndValidate, validatePayload } from "../src/modules/export/importer.js";
function makeValidPayload(o = {}) {
  return {
    match: { id: "m1", currentSetId: "s1", setNumber: 1, sets: [{ id: "s1", number: 1, local: 0, visitante: 0, closed: false }], autoScore: true },
    meta: { rival: "Defensores", createdAt: 1700000000000, status: "open", rosterIds: ["p1"] },
    players: [{ id: "p1", name: "Lucas", number: 7 }],
    exportedAt: new Date().toISOString(),
    events: [{ id: "e1", matchId: "m1", setId: "s1", playerId: "p1", actionId: "ataque", resultCode: "+2", value: 2, undone: false, timestamp: 1700000001000 }],
    ...o
  };
}
test("parseAndValidate JSON invalido", () => {
  const r = parseAndValidate("{no es json}"); assert.equal(r.ok, false);
});
test("parseAndValidate payload valido", () => {
  const r = parseAndValidate(JSON.stringify(makeValidPayload()));
  assert.equal(r.ok, true); assert.equal(r.summary.totalEvents, 1); assert.equal(r.summary.rival, "Defensores");
});
test("validatePayload falta events", () => {
  const p = makeValidPayload(); delete p.events;
  const r = validatePayload(p); assert.equal(r.ok, false);
});
test("validatePayload falta match", () => {
  const p = makeValidPayload(); delete p.match;
  const r = validatePayload(p); assert.equal(r.ok, false);
});
test("validatePayload evento sin playerId", () => {
  const p = makeValidPayload(); delete p.events[0].playerId;
  const r = validatePayload(p); assert.equal(r.ok, false);
});
test("validatePayload warning por jugador desconocido", () => {
  const p = makeValidPayload(); p.events[0].playerId = "p99";
  const r = validatePayload(p); assert.equal(r.ok, true); assert.ok(r.warnings.length > 0);
});
test("validatePayload events vacio es valido", () => {
  const p = makeValidPayload({ events: [] });
  const r = validatePayload(p); assert.equal(r.ok, true); assert.equal(r.summary.totalEvents, 0);
});
