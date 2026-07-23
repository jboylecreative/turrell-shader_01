// -----------------------------------------------------------------------------
// Global / shared control sections (B Global, C Strata, D Interaction,
// E Cascade, Queue, H Debug). Built generically from the parameter table.
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";
import { GLOBAL_SECTIONS, type ControlSection } from "../config/parameterDefinitions";
import { makeSection } from "./section";
import { buildControl, type Widget } from "./widgets";

/** Build one collapsible section from a ControlSection, collecting widgets.
 *  Skips params flagged `future` (not yet built). */
export function buildParamSection(
  section: ControlSection,
  state: AppState,
  sink: Widget[],
): HTMLElement {
  const { root, body } = makeSection(section.title, section.open);
  for (const param of section.params) {
    if (param.future) continue;
    const w = buildControl(param, state);
    sink.push(w);
    body.append(w.root);
  }
  return root;
}

/** All global sections in order, skipping whole sections flagged `future`. */
export function buildGlobalControls(state: AppState, sink: Widget[]): HTMLElement {
  const frag = document.createElement("div");
  for (const section of GLOBAL_SECTIONS) {
    if (section.future) continue;
    frag.append(buildParamSection(section, state, sink));
  }
  return frag;
}
