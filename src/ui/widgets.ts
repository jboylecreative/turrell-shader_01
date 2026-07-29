// -----------------------------------------------------------------------------
// widgets.ts — generic control builders bound to AppState by JSON path.
//
// Every widget is generated from a ParameterDef, so the parameter table is the
// only place that knows a control's label, type, and range. Each builder
// returns a `refresh()` so the panel can re-sync inputs after a preset load or
// JSON import (a bulk state replace).
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";
import type { ParameterDef } from "../config/parameterDefinitions";
import { isValidHex } from "../renderer/ColorUtils";

export interface Widget {
  root: HTMLElement;
  refresh: () => void;
  setDisabled: (disabled: boolean) => void;
}

export function buildControl(param: ParameterDef, state: AppState): Widget {
  switch (param.type) {
    case "bool":
      return buildToggle(param, state);
    case "color":
      return buildColor(param, state);
    case "select":
      return buildSelect(param, state);
    case "number":
      return buildNumber(param, state);
    case "int":
    case "float":
    default:
      return buildSlider(param, state);
  }
}

function row(label: string, control: HTMLElement, title?: string): HTMLElement {
  const r = document.createElement("label");
  r.className = "ctl";
  if (title) r.title = title;
  const span = document.createElement("span");
  span.className = "ctl-label";
  span.textContent = label;
  r.append(span, control);
  return r;
}

function buildSlider(param: ParameterDef, state: AppState): Widget {
  const wrap = document.createElement("div");
  wrap.className = "ctl-slider";
  const range = document.createElement("input");
  range.type = "range";
  const num = document.createElement("input");
  num.type = "number";
  num.className = "ctl-num";

  const isInt = param.type === "int";
  const min = param.min ?? 0;
  const max = param.max ?? 1; // default "hard stop" of the slider track
  const step = param.step ?? (isInt ? 1 : (max - min) / 200 || 0.001);
  // The slider track ALWAYS keeps its default range (fixed hard stops for fine
  // dragging). The number field is unconstrained — type any value, above the max
  // or below the min, to affect the visuals without changing the track. When the
  // value is out of the track's range, the thumb simply pins at the nearest end.
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  wrap.append(range, num);

  const read = () => Number(state.get(param.jsonPath));
  // Slider drag stays within the default track range.
  const writeFromRange = (v: number) => {
    state.set(param.jsonPath, isInt ? Math.round(v) : v);
  };
  // Number field: no clamping (beyond the slider range is allowed, both ways).
  const writeFromNum = (v: number) => {
    if (!Number.isFinite(v)) return;
    state.set(param.jsonPath, isInt ? Math.round(v) : v);
  };
  const refresh = () => {
    const v = read();
    range.value = String(v); // the range input auto-clamps its thumb for display
    num.value = String(isInt ? Math.round(v) : round(v, 4)); // shows the true value
  };
  range.addEventListener("input", () => {
    writeFromRange(Number(range.value));
    num.value = range.value;
  });
  num.addEventListener("change", () => {
    writeFromNum(Number(num.value));
    refresh();
  });
  refresh();

  const root = row(param.label, wrap, param.description);
  return {
    root,
    refresh,
    setDisabled: (d) => {
      range.disabled = d;
      num.disabled = d;
    },
  };
}

// A plain integer/number field with no slider track. Commits on `change`
// (blur / Enter) rather than every keystroke — used for things like the output
// resolution where each edit reallocates render buffers and mid-type values
// (e.g. "38" of "3840") would be wasteful and visibly wrong.
function buildNumber(param: ParameterDef, state: AppState): Widget {
  const num = document.createElement("input");
  num.type = "number";
  num.className = "ctl-num ctl-num-solo";
  if (param.min !== undefined) num.min = String(param.min);
  if (param.max !== undefined) num.max = String(param.max);
  num.step = String(param.step ?? 1);

  const read = () => Number(state.get(param.jsonPath));
  const refresh = () => (num.value = String(Math.round(read())));
  num.addEventListener("change", () => {
    let v = Number(num.value);
    if (!Number.isFinite(v)) return refresh();
    if (param.min !== undefined) v = Math.max(param.min, v);
    if (param.max !== undefined) v = Math.min(param.max, v);
    state.set(param.jsonPath, Math.round(v));
    refresh();
  });
  refresh();
  const root = row(param.label, num, param.description);
  return { root, refresh, setDisabled: (d) => (num.disabled = d) };
}

function buildToggle(param: ParameterDef, state: AppState): Widget {
  const box = document.createElement("input");
  box.type = "checkbox";
  const read = () => Boolean(state.get(param.jsonPath));
  const refresh = () => (box.checked = read());
  box.addEventListener("change", () => state.set(param.jsonPath, box.checked));
  refresh();
  const root = row(param.label, box, param.description);
  root.classList.add("ctl-toggle");
  return { root, refresh, setDisabled: (d) => (box.disabled = d) };
}

function buildColor(param: ParameterDef, state: AppState): Widget {
  const wrap = document.createElement("div");
  wrap.className = "ctl-color";
  const swatch = document.createElement("input");
  swatch.type = "color";
  const hex = document.createElement("input");
  hex.type = "text";
  hex.className = "ctl-hex";
  hex.spellcheck = false;
  wrap.append(swatch, hex);

  const read = () => String(state.get(param.jsonPath));
  const refresh = () => {
    const v = read();
    hex.value = v;
    if (isValidHex(v)) swatch.value = normalizeHex(v);
    hex.classList.toggle("invalid", !isValidHex(v));
  };
  swatch.addEventListener("input", () => {
    state.set(param.jsonPath, swatch.value);
    hex.value = swatch.value;
    hex.classList.remove("invalid");
  });
  hex.addEventListener("change", () => {
    if (isValidHex(hex.value)) {
      const v = normalizeHex(hex.value);
      state.set(param.jsonPath, v);
    }
    refresh();
  });
  refresh();
  const root = row(param.label, wrap, param.description);
  return {
    root,
    refresh,
    setDisabled: (d) => {
      swatch.disabled = d;
      hex.disabled = d;
    },
  };
}

function buildSelect(param: ParameterDef, state: AppState): Widget {
  const sel = document.createElement("select");
  for (const opt of param.options ?? []) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    sel.append(o);
  }
  const read = () => String(state.get(param.jsonPath));
  const refresh = () => (sel.value = read());
  sel.addEventListener("change", () => state.set(param.jsonPath, sel.value));
  refresh();
  return { root: row(param.label, sel, param.description), refresh, setDisabled: (d) => (sel.disabled = d) };
}

function round(v: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return "#" + h.toLowerCase();
}
