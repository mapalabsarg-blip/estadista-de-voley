import test from "node:test";
import assert from "node:assert/strict";
import { summarize, getMatchSummary, getPlayerSummary, getSetSummary, getPerSetBreakdown } from "../src/modules/stats/statsQueries.js";
function ev(o) { return { id: "e", matchId: "m1", setId: "s1", playerId: "p1", actionId: "ataque", resultCode: "+2", value: 2, undone: false, ...o }; }
const sample = [
  ev({ id: "e1", actionId: "ataque", resultCode: "+2", value: 2, playerId: "p1", setId: "s1" }),
  ev({ id: "e2", actionId: "ataque", resultCode: "E", value: "error", playerId: "p1", setId: "s1" }),
  ev({ id: "e3", actionId: "saque", resultCode: "+1", value: 1, playerId: "p2", setId: "s1" }),
  ev({ id: "e4", actionId: "recepcion", resultCode: "+2", value: 2, playerId: "p1", setId: "s2" }),
  ev({ id: "e5", actionId: "ataque", resultCode: "+1", value: 1, playerId: "p1", setId: "s1", undone: true })
];
test("summarize cuenta puntos errores eficiencia", () => {
  const s = summarize(sample.filter((e) => !e.undone));
  assert.equal(s.count, 4); assert.equal(s.points, 5); assert.equal(s.errors, 1); assert.equal(s.efficiency, 1.25);
});
test("summarize eficiencia 0 sin eventos", () => { const s = summarize([]); assert.equal(s.efficiency, 0); });
test("getMatchSummary filtra undone", () => { const s = getMatchSummary(sample); assert.equal(s.count, 4); });
test("getPlayerSummary solo el jugador", () => { const s = getPlayerSummary(sample, "p1"); assert.equal(s.count, 3); assert.equal(s.points, 4); });
test("getSetSummary solo el set", () => { const s = getSetSummary(sample, "s1"); assert.equal(s.count, 3); });
test("getPerSetBreakdown agrupa y ordena", () => {
  const sets = getPerSetBreakdown(sample);
  assert.equal(sets.length, 2); assert.equal(sets[0].setId, "s1"); assert.equal(sets[1].setId, "s2");
});
