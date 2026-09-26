export const ACTIONS = [
  { id: "ataque", label: "Ataque", results: [
    { code: "+2", label: "Punto directo", value: 2, scoring: true },
    { code: "+1", label: "Positivo", value: 1 },
    { code: "0", label: "Neutro", value: 0 },
    { code: "-1", label: "Negativo", value: -1 },
    { code: "E", label: "Error", value: "error" }
  ]},
  { id: "saque", label: "Saque", results: [
    { code: "+2", label: "Ace", value: 2, scoring: true },
    { code: "+1", label: "Saque positivo", value: 1 },
    { code: "0", label: "En juego", value: 0 },
    { code: "-1", label: "Saque negativo", value: -1 },
    { code: "E", label: "Error", value: "error" }
  ]},
  { id: "recepcion", label: "Recepcion", results: [
    { code: "+2", label: "Perfecta", value: 2 },
    { code: "+1", label: "Buena", value: 1 },
    { code: "0", label: "Neutra", value: 0 },
    { code: "-1", label: "Mala", value: -1 },
    { code: "E", label: "Error", value: "error" }
  ]},
  { id: "defensa", label: "Defensa", results: [
    { code: "+2", label: "Perfecta", value: 2 },
    { code: "+1", label: "Positiva", value: 1 },
    { code: "0", label: "Neutra", value: 0 },
    { code: "-1", label: "Negativa", value: -1 },
    { code: "E", label: "Error", value: "error" }
  ]}
];
export function getAction(id) { return ACTIONS.find((a) => a.id === id) || null; }
export function getResult(actionId, code) {
  const a = getAction(actionId);
  return a ? a.results.find((r) => r.code === code) || null : null;
}
