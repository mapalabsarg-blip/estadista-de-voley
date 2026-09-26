import { getAction } from "../../config/actions.config.js";
export function renderResultPanel(container, actionId, onResult, onCancel) {
  const action = getAction(actionId); if (!action) return;
  container.className = "panel panel--results";
  container.innerHTML = "";
  const header = document.createElement("div");
  header.className = "results-header";
  header.innerHTML = '<span class="results-header__action">' + action.label + '</span><button type="button" class="results-header__cancel" aria-label="Cancelar">Cancelar</button>';
  header.querySelector(".results-header__cancel").addEventListener("click", onCancel);
  container.appendChild(header);
  const grid = document.createElement("div");
  grid.className = "results-grid";
  for (const result of action.results) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result-btn";
    btn.dataset.code = result.code;
    btn.innerHTML = '<span class="result-btn__code">' + result.code + '</span><span class="result-btn__label">' + result.label + '</span>';
    btn.addEventListener("click", () => onResult(result));
    grid.appendChild(btn);
  }
  container.appendChild(grid);
}
