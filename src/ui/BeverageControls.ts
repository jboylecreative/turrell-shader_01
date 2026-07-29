// -----------------------------------------------------------------------------
// Section F — per-beverage controls. One collapsible subsection per beverage,
// grouped into Colors / Form / Depth / Motion (Active hidden until Phase 5).
// Each subsection has a "Copy from…" dropdown and a "Reset to Default" button.
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";
import { BEVERAGE_IDS, type BeverageId } from "../app/types";
import { beverageSections } from "../config/parameterDefinitions";
import { makeSection } from "./section";
import { buildControl, type Widget } from "./widgets";

export interface BeverageHandlers {
  copyFrom: (src: BeverageId, dst: BeverageId) => void;
  reset: (id: BeverageId) => void;
}

const GROUP_ORDER: { key: string; label: string }[] = [
  { key: "colors", label: "Colors" },
  { key: "form", label: "Form" },
  { key: "depth", label: "Depth" },
  { key: "motion", label: "Motion" },
  { key: "active", label: "Active" },
];

export function buildBeverageControls(
  state: AppState,
  sink: Widget[],
  handlers: BeverageHandlers,
): HTMLElement {
  const frag = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.textContent = "Beverages";
  frag.append(heading);

  const sections = beverageSections();
  BEVERAGE_IDS.forEach((id, i) => {
    const section = sections[i];
    const { root, body } = makeSection(section.title, false);

    body.append(buildActionsRow(state, id, handlers));

    for (const group of GROUP_ORDER) {
      const params = section.params.filter(
        (p) => p.jsonPath.includes(`.${group.key}.`) && !p.future,
      );
      if (params.length === 0) continue;
      const groupEl = document.createElement("div");
      groupEl.className = "ctl-group";
      const gh = document.createElement("div");
      gh.className = "ctl-group-title";
      gh.textContent = group.label;
      groupEl.append(gh);
      for (const p of params) {
        const w = buildControl(p, state);
        sink.push(w);
        groupEl.append(w.root);
      }
      body.append(groupEl);
    }
    frag.append(root);
  });
  return frag;
}

/** "Copy from…" dropdown + "Reset to Default" button for one beverage. */
function buildActionsRow(state: AppState, id: BeverageId, handlers: BeverageHandlers): HTMLElement {
  const row = document.createElement("div");
  row.className = "bev-actions";

  const sel = document.createElement("select");
  sel.className = "bev-copy-select";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Copy from…";
  sel.append(ph);
  for (const other of BEVERAGE_IDS) {
    if (other === id) continue;
    const o = document.createElement("option");
    o.value = other;
    o.textContent = state.raw.beverages[other].label;
    sel.append(o);
  }
  sel.addEventListener("change", () => {
    if (sel.value) {
      handlers.copyFrom(sel.value as BeverageId, id);
      sel.value = "";
    }
  });

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "action-btn";
  resetBtn.textContent = "Reset to Default";
  resetBtn.addEventListener("click", () => handlers.reset(id));

  row.append(sel, resetBtn);
  return row;
}
