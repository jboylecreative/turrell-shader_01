// -----------------------------------------------------------------------------
// PresetManager: named presets (save / save-as / duplicate / lock / delete) and
// JSON import/export. Presets are plain PresetState snapshots — the same format
// used for the on-disk JSON handoff to TouchDesigner.
// -----------------------------------------------------------------------------

import { createDefaultPreset } from "../config/defaults";
import { APP_VERSION, SCHEMA_VERSION, type PresetState } from "./types";
import type { StorageManager } from "./StorageManager";

export class PresetManager {
  private presets: Record<string, PresetState>;
  /** Names of presets that are locked against editing. */
  private locked = new Set<string>();

  constructor(private storage: StorageManager) {
    this.presets = storage.loadPresets();
  }

  names(): string[] {
    return Object.keys(this.presets).sort();
  }

  has(name: string): boolean {
    return name in this.presets;
  }

  isLocked(name: string): boolean {
    return this.locked.has(name);
  }

  get(name: string): PresetState | undefined {
    const p = this.presets[name];
    return p ? structuredClone(p) : undefined;
  }

  /** Save a snapshot under a name (stamping metadata). Overwrites if unlocked. */
  save(name: string, snapshot: PresetState): void {
    if (this.locked.has(name)) {
      throw new Error(`Preset "${name}" is locked`);
    }
    const stamped: PresetState = {
      ...structuredClone(snapshot),
      presetName: name,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      savedAt: new Date().toISOString(),
    };
    this.presets[name] = stamped;
    this.persist();
  }

  /**
   * Save a timestamped backup copy of a snapshot so it can never be lost when
   * the working state is about to be replaced (e.g. right before a JSON
   * import). Returns the name it was stored under.
   */
  backup(snapshot: PresetState): string {
    const base = (snapshot.presetName || "Working").trim() || "Working";
    let name = `${base} (backup ${backupTimestamp()})`;
    // Guard against a same-second collision from two rapid imports.
    let i = 2;
    while (this.presets[name]) name = `${base} (backup ${backupTimestamp()} ${i++})`;
    this.save(name, snapshot);
    return name;
  }

  /**
   * Add an imported preset to the library WITHOUT ever overwriting an existing
   * one. If a preset of the same name is already present:
   *   - identical content  → left untouched (returns that name);
   *   - different content   → stored under a collision-safe "(imported)" name.
   * Returns the name the preset now lives under.
   */
  addFromImport(snapshot: PresetState): string {
    const desired = (snapshot.presetName || "Imported").trim() || "Imported";
    const existing = this.presets[desired];
    if (existing) {
      if (samePresetContent(existing, snapshot)) return desired; // already present
      let name = `${desired} (imported)`;
      let i = 2;
      while (this.presets[name]) name = `${desired} (imported ${i++})`;
      this.save(name, snapshot);
      return name;
    }
    this.save(desired, snapshot);
    return desired;
  }

  duplicate(name: string): string | undefined {
    const src = this.presets[name];
    if (!src) return undefined;
    let copy = `${name} copy`;
    let i = 2;
    while (this.presets[copy]) copy = `${name} copy ${i++}`;
    this.presets[copy] = { ...structuredClone(src), presetName: copy };
    this.persist();
    return copy;
  }

  delete(name: string): void {
    if (this.locked.has(name)) throw new Error(`Preset "${name}" is locked`);
    delete this.presets[name];
    this.persist();
  }

  lock(name: string): void {
    if (this.presets[name]) this.locked.add(name);
  }

  unlock(name: string): void {
    this.locked.delete(name);
  }

  private persist(): void {
    this.storage.savePresets(this.presets);
  }
}

// ---- Helpers ----------------------------------------------------------------

/** Local timestamp as "YYYY-MM-DD HH-MM-SS" (filename/preset-name safe, sorts
 *  chronologically within a shared prefix). */
function backupTimestamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
  );
}

/** True if two presets are the same design, ignoring volatile metadata (name,
 *  save time, and version stamps) so a re-import of the same file is a no-op. */
function samePresetContent(a: PresetState, b: PresetState): boolean {
  const skip = new Set(["presetName", "savedAt", "appVersion", "schemaVersion"]);
  return deepEqual(a, b, skip);
}

/** Order-independent deep equality. `skipTopKeys` (if given) omits those keys at
 *  the top level only; nested values are compared in full. */
function deepEqual(a: unknown, b: unknown, skipTopKeys?: Set<string>): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao).filter((k) => !skipTopKeys?.has(k));
  const bk = Object.keys(bo).filter((k) => !skipTopKeys?.has(k));
  if (ak.length !== bk.length) return false;
  return ak.every((k) => k in bo && deepEqual(ao[k], bo[k]));
}

// ---- JSON import / export (module functions, no instance needed) ------------

/** Serialize a snapshot to a pretty JSON string. */
export function toJSON(state: PresetState): string {
  return JSON.stringify(state, null, 2);
}

/** Parse and validate imported JSON into a PresetState (throws on failure). */
export function fromJSON(text: string): PresetState {
  const parsed = JSON.parse(text) as unknown;
  if (parsed == null || typeof parsed !== "object") {
    throw new Error("JSON is not an object");
  }
  const s = parsed as Partial<PresetState>;
  if (typeof s.schemaVersion !== "number") {
    throw new Error("Missing schemaVersion");
  }
  if (s.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion ${s.schemaVersion}`);
  }
  if (!s.beverages || !s.global) {
    throw new Error("JSON is missing required sections");
  }
  // Merge over defaults so older/partial files still load fully populated.
  return mergeOverDefaults(s);
}

/** Deep-merge a partial preset over the factory default. */
export function mergeOverDefaults(partial: Partial<PresetState>): PresetState {
  const base = createDefaultPreset();
  return deepMerge(base, partial) as PresetState;
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (override == null) return base;
  if (Array.isArray(base) || typeof base !== "object") {
    return (override as T) ?? base;
  }
  const out = { ...(base as object) } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    if (v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object") {
      out[k] = deepMerge(b, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

/** Trigger a browser download of the given JSON. */
export function downloadJSON(state: PresetState, filename: string): void {
  const blob = new Blob([toJSON(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Save via the native file picker when available, otherwise fall back to a
 * plain download. Support is not universal, so download must remain viable.
 */
export async function saveJSONWithPicker(
  state: PresetState,
  filename: string,
): Promise<void> {
  const picker = (
    window as unknown as {
      showSaveFilePicker?: (opts: unknown) => Promise<{
        createWritable: () => Promise<{
          write: (data: string) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    }
  ).showSaveFilePicker;

  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [
          { description: "JSON preset", accept: { "application/json": [".json"] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(toJSON(state));
      await writable.close();
      return;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return; // user cancelled
      // fall through to download on any other failure
    }
  }
  downloadJSON(state, filename);
}
