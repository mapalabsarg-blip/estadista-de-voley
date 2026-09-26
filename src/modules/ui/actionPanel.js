import { ACTIONS } from "../../config/actions.config.js";
export function renderActionPanel(container, onAction) {
  container.className = "panel panel--actions";
  container.innerHTML = "";
  for (const action of ACTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-btn action-btn--" + action.id;
    btn.dataset.actionId = action.id;
    btn.textContent = action.label;
    btn.addEventListener("click", () => onAction(action.id));
    container.appendChild(btn);
  }
}
