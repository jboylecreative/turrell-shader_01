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
  const max = param.max ?? 1;
  const step = param.step ?? (isInt ? 1 : (max - min) / 200 || 0.001);
  for (const el of [range, num]) {
    el.min = String(min);
    el.max = String(max);
    el.step = String(step);
  }
  wrap.append(range, num);

  const read = () => Number(state.get(param.jsonPath));
  const write = (v: number) => {
    const clamped = Math.min(max, Math.max(min, isInt ? Math.round(v) : v));
    state.set(param.jsonPath, clamped);
  };
  const refresh = () => {
    const v = read();
    range.value = String(v);
    num.value = String(isInt ? Math.round(v) : round(v, 4));
  };
  range.addEventListener("input", () => {
    write(Number(range.value));
    num.value = range.value;
  });
  num.addEventListener("change", () => {
    write(Number(num.value));
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
