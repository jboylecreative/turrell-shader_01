// -----------------------------------------------------------------------------
// StorageManager: debounced localStorage autosave of the working state, plus
// restore-on-load. Only serializable PresetState is ever written — never
// renderer objects, the queue, or animation timestamps.
// -----------------------------------------------------------------------------

import { SCHEMA_VERSION, type PresetState } from "./types";

const WORKING_KEY = "bssp.workingState.v1";
const PRESETS_KEY = "bssp.presets.v1";
const DEBOUNCE_MS = 400;

export class StorageManager {
  private timer: number | null = null;

  /** Restore the autosaved working state, or null if none / invalid. */
  loadWorking(): PresetState | null {
    return readState(WORKING_KEY);
  }

  /** Debounced write of the working state. */
  saveWorkingDebounced(state: PresetState): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      writeState(WORKING_KEY, state);
    }, DEBOUNCE_MS);
  }

  /** Immediate write (e.g. before unload). */
  saveWorkingNow(state: PresetState): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    writeState(WORKING_KEY, state);
  }

  // ---- Named presets (stored as a map keyed by name) ------------------------

  loadPresets(): Record<string, PresetState> {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const out: Record<string, PresetState> = {};
      for (const [name, val] of Object.entries(parsed)) {
        const s = coerce(val);
        if (s) out[name] = s;
      }
      return out;
    } catch {
      return {};
    }
  }

  savePresets(presets: Record<string, PresetState>): void {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (err) {
      console.warn("Failed to persist presets", err);
    }
  }
}

function writeState(key: string, state: PresetState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn(`Failed to persist ${key}`, err);
  }
}

function readState(key: string): PresetState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return coerce(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Minimal structural validation / version gate for restored state. */
function coerce(val: unknown): PresetState | null {
  if (val == null || typeof val !== "object") return null;
  const s = val as Partial<PresetState>;
  if (typeof s.schemaVersion !== "number") return null;
  if (s.schemaVersion > SCHEMA_VERSION) return null; // future schema; ignore
  if (!s.beverages || !s.global) return null;
  return s as PresetState;
}
