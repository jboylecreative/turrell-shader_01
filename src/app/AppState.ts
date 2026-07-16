// -----------------------------------------------------------------------------
// AppState: holds the live PresetState and mediates all reads/writes by JSON
// path. UI widgets, storage, and the uniform binding all go through here so
// there is exactly one place that mutates state and one change notification.
//
// PORTABILITY NOTE: this class holds only serializable PresetState. Runtime
// concerns (strata array, queue, clock) live elsewhere.
// -----------------------------------------------------------------------------

import { createDefaultPreset } from "../config/defaults";
import type { PresetState } from "./types";

export type PathValue = number | boolean | string;
type Listener = (path: string, value: PathValue) => void;

/** Read a dot-path value out of an arbitrary object. */
export function getByPath(obj: unknown, path: string): PathValue {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") {
      throw new Error(`Path "${path}" is not reachable`);
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as PathValue;
}

/** Write a dot-path value into an arbitrary object (path must already exist). */
export function setByPath(obj: unknown, path: string, value: PathValue): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]];
    if (next == null || typeof next !== "object") {
      throw new Error(`Path "${path}" is not reachable`);
    }
    cur = next as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

export class AppState {
  private state: PresetState;
  private listeners = new Set<Listener>();

  constructor(initial?: PresetState) {
    this.state = initial ?? createDefaultPreset();
  }

  /** Direct (read-only intent) access to the underlying state. */
  get raw(): PresetState {
    return this.state;
  }

  get(path: string): PathValue {
    return getByPath(this.state, path);
  }

  /** Set a value by path and notify listeners. No-op if unchanged. */
  set(path: string, value: PathValue): void {
    const current = getByPath(this.state, path);
    if (current === value) return;
    setByPath(this.state, path, value);
    this.emit(path, value);
  }

  /** Replace the entire state (import / preset load) and notify a bulk change. */
  replace(next: PresetState): void {
    this.state = next;
    this.emit("*", 0);
  }

  /** A serializable snapshot suitable for JSON / storage. */
  snapshot(): PresetState {
    return structuredClone(this.state);
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(path: string, value: PathValue): void {
    for (const fn of this.listeners) fn(path, value);
  }
}
