// -----------------------------------------------------------------------------
// Section A — trigger controls. Five always-visible beverage buttons plus queue
// status and the history/queue action buttons. Wiring to the actual queue and
// history managers is injected via handlers (built in App), so this file stays
// a pure view.
// -----------------------------------------------------------------------------

import { BEVERAGE_IDS, type BeverageId } from "../app/types";
import type { AppState } from "../app/AppState";

export interface TriggerHandlers {
  trigger: (id: BeverageId) => void;
  undo: () => void;
  skip: () => void;
  clearQueue: () => void;
  clearHistory: () => void;
  generateRandomHistory: () => void;
}

export interface TriggerStatus {
  queueLength: number;
  activeLabel: string | null;
}

export interface TriggerView {
  root: HTMLElement;
  update: (status: TriggerStatus) => void;
}

export function buildBeverageButtons(
  state: AppState,
  handlers: TriggerHandlers,
): TriggerView {
  const root = document.createElement("div");
  root.className = "trigger-panel";

  const buttons = document.createElement("div");
  buttons.className = "bev-buttons";
  for (const id of BEVERAGE_IDS) {
    const def = state.raw.beverages[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bev-btn";
    btn.dataset.bev = id;
    btn.style.setProperty("--bev-color", def.colors.primary);
    btn.textContent = def.label;
    btn.addEventListener("click", () => handlers.trigger(id));
    buttons.append(btn);
  }

  const status = document.createElement("div");
  status.className = "trigger-status";
  const queueEl = document.createElement("span");
  const activeEl = document.createElement("span");
  status.append(queueEl, activeEl);

  const actions = document.createElement("div");
  actions.className = "trigger-actions";
  actions.append(
    actionBtn("Undo", handlers.undo),
    actionBtn("Skip", handlers.skip),
    actionBtn("Clear Queue", handlers.clearQueue),
    actionBtn("Clear History", handlers.clearHistory),
    actionBtn("Random History", handlers.generateRandomHistory),
  );

  root.append(buttons, status, actions);

  const update = (s: TriggerStatus) => {
    queueEl.textContent = `Queue: ${s.queueLength}`;
    activeEl.textContent = s.activeLabel ? `Active: ${s.activeLabel}` : "Active: —";
  };
  update({ queueLength: 0, activeLabel: null });

  return { root, update };
}

function actionBtn(label: string, fn: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "action-btn";
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}
