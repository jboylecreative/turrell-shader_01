// -----------------------------------------------------------------------------
// Section F — per-beverage controls. One collapsible subsection per beverage,
// built from the expanded beverage parameter definitions (colours, rest, style,
// active). Grouped visually into Colors / Resting / Style / Active.
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";
import { beverageSections } from "../config/parameterDefinitions";
import { makeSection } from "./section";
import { buildControl, type Widget } from "./widgets";

const GROUP_ORDER: { key: string; label: string }[] = [
  { key: "colors", label: "Colors" },
  { key: "form", label: "Form" },
  { key: "motion", label: "Motion" },
  { key: "active", label: "Active" },
];

export function buildBeverageControls(state: AppState, sink: Widget[]): HTMLElement {
  const frag = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.textContent = "Beverages";
  frag.append(heading);

  for (const section of beverageSections()) {
    const { root, body } = makeSection(section.title, false);
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
  }
  return frag;
}
