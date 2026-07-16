// -----------------------------------------------------------------------------
// Section G — presets & persistence. Save / save-as / duplicate / lock / delete
// named presets, plus JSON import / export / copy. Actions are injected from App
// so this file stays a view.
// -----------------------------------------------------------------------------

export interface PresetHandlers {
  list: () => string[];
  currentName: () => string;
  isLocked: (name: string) => boolean;
  save: () => void;
  saveAs: (name: string) => void;
  load: (name: string) => void;
  duplicate: () => void;
  deletePreset: () => void;
  lock: () => void;
  unlock: () => void;
  resetEverything: () => void;
  importJSON: (file: File) => void;
  exportJSON: () => void;
  copyJSON: () => void;
}

export interface PresetView {
  root: HTMLElement;
  refresh: () => void;
}

export function buildPresetControls(handlers: PresetHandlers): PresetView {
  const root = document.createElement("div");
  root.className = "preset-controls";

  const select = document.createElement("select");
  select.className = "preset-select";
  select.addEventListener("change", () => {
    if (select.value) handlers.load(select.value);
  });

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "preset-name";
  nameInput.placeholder = "Preset name";

  const lockState = document.createElement("span");
  lockState.className = "lock-state";

  const grid = document.createElement("div");
  grid.className = "preset-grid";
  grid.append(
    btn("Save", () => handlers.save()),
    btn("Save As", () => {
      const name = nameInput.value.trim();
      if (name) handlers.saveAs(name);
    }),
    btn("Duplicate", () => handlers.duplicate()),
    btn("Delete", () => handlers.deletePreset()),
    btn("Lock", () => handlers.lock()),
    btn("Unlock", () => handlers.unlock()),
    btn("Export JSON", () => handlers.exportJSON()),
    btn("Copy JSON", () => handlers.copyJSON()),
    btn("Reset Everything", () => handlers.resetEverything()),
  );

  // Import via hidden file input.
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (f) handlers.importJSON(f);
    fileInput.value = "";
  });
  const importBtn = btn("Import JSON", () => fileInput.click());

  root.append(
    labeled("Preset", select),
    labeled("Name", nameInput),
    lockState,
    grid,
    importBtn,
    fileInput,
  );

  const refresh = () => {
    const names = handlers.list();
    const current = handlers.currentName();
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = names.length ? "— load preset —" : "— no presets —";
    select.append(placeholder);
    for (const n of names) {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = handlers.isLocked(n) ? `${n} 🔒` : n;
      select.append(o);
    }
    nameInput.value = current;
    lockState.textContent = handlers.isLocked(current) ? "🔒 Locked" : "";
  };
  refresh();

  return { root, refresh };
}

function btn(label: string, fn: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "action-btn";
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}

function labeled(label: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "ctl";
  const span = document.createElement("span");
  span.className = "ctl-label";
  span.textContent = label;
  wrap.append(span, control);
  return wrap;
}
