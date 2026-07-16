// -----------------------------------------------------------------------------
// ControlPanel — assembles the whole right-hand panel: the always-visible
// trigger buttons at the top, then the scrollable collapsible sections. Owns the
// widget registry so it can refresh all inputs after a preset load and disable
// editing when a preset is locked.
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";
import type { Widget } from "./widgets";
import { buildBeverageButtons, type TriggerHandlers, type TriggerStatus, type TriggerView } from "./BeverageButtons";
import { buildGlobalControls } from "./GlobalControls";
import { buildBeverageControls } from "./BeverageControls";
import { buildPresetControls, type PresetHandlers, type PresetView } from "./PresetControls";
import { makeSection } from "./section";

export interface PanelHandlers {
  trigger: TriggerHandlers;
  preset: PresetHandlers;
}

export class ControlPanel {
  private widgets: Widget[] = [];
  private triggerView: TriggerView;
  private presetView: PresetView;
  private locked = false;

  constructor(
    private mount: HTMLElement,
    state: AppState,
    handlers: PanelHandlers,
  ) {
    mount.innerHTML = "";

    // Section A: always-visible triggers (not collapsible).
    this.triggerView = buildBeverageButtons(state, handlers.trigger);
    mount.append(this.triggerView.root);

    // Scroll container for the rest.
    const scroll = document.createElement("div");
    scroll.className = "panel-scroll";
    mount.append(scroll);

    // Presets first (Section G) so save/load is near the top.
    const presetSec = makeSection("Presets & Persistence", true);
    this.presetView = buildPresetControls(handlers.preset);
    presetSec.body.append(this.presetView.root);
    scroll.append(presetSec.root);

    // Sections B–E, Queue, Debug.
    scroll.append(buildGlobalControls(state, this.widgets));

    // Section F: beverages.
    scroll.append(buildBeverageControls(state, this.widgets));
  }

  /** Re-sync every widget from state (after preset load / JSON import). */
  refreshAll(): void {
    for (const w of this.widgets) w.refresh();
    this.presetView.refresh();
  }

  refreshPresets(): void {
    this.presetView.refresh();
  }

  updateStatus(status: TriggerStatus): void {
    this.triggerView.update(status);
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    for (const w of this.widgets) w.setDisabled(locked);
    this.mount.classList.toggle("locked", locked);
  }

  get isLocked(): boolean {
    return this.locked;
  }
}
