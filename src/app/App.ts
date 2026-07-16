// -----------------------------------------------------------------------------
// App — top-level orchestrator (browser scaffolding). Wires AppState, storage,
// presets, the renderer, and the control panel together.
//
// PHASE 1: beverage triggers and history/queue actions are stubs that update a
// status readout. Phase 2 replaces the stub handlers with the real History
// manager and EventQueue without changing this wiring.
// -----------------------------------------------------------------------------

import { AppState } from "./AppState";
import { StorageManager } from "./StorageManager";
import {
  PresetManager,
  fromJSON,
  saveJSONWithPicker,
  toJSON,
} from "./PresetManager";
import { createDefaultPreset } from "../config/defaults";
import { Renderer } from "../renderer/Renderer";
import { ControlPanel } from "../ui/ControlPanel";
import { buildDebugOverlay, type DebugOverlay } from "../ui/DebugControls";
import type { BeverageId } from "./types";

export class App {
  private state: AppState;
  private storage = new StorageManager();
  private presets: PresetManager;
  private renderer!: Renderer;
  private panel!: ControlPanel;
  private overlay!: DebugOverlay;
  private errorBanner: HTMLElement;

  private currentPresetName = "";

  // Phase 1 stub queue status (replaced by EventQueue in Phase 2).
  private stubQueue = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private panelMount: HTMLElement,
    private stageOverlay: HTMLElement,
  ) {
    const restored = this.storage.loadWorking();
    this.state = new AppState(restored ?? createDefaultPreset());
    this.currentPresetName = this.state.raw.presetName;
    this.presets = new PresetManager(this.storage);

    this.errorBanner = document.createElement("div");
    this.errorBanner.className = "error-banner";
    this.errorBanner.style.display = "none";
    this.stageOverlay.append(this.errorBanner);
  }

  start(): void {
    // Renderer (throws on missing WebGL2 → surfaced as a banner).
    try {
      this.renderer = new Renderer(
        this.canvas,
        () => this.state.raw,
        (msg) => this.showError(msg),
      );
    } catch (err) {
      this.showError(String((err as Error).message ?? err));
      return;
    }

    this.overlay = buildDebugOverlay(this.state);
    this.stageOverlay.append(this.overlay.root);

    this.panel = new ControlPanel(this.panelMount, this.state, {
      trigger: {
        trigger: (id) => this.triggerBeverage(id),
        undo: () => this.setStatusStub(Math.max(0, this.stubQueue - 1)),
        skip: () => this.setStatusStub(Math.max(0, this.stubQueue - 1)),
        clearQueue: () => this.setStatusStub(0),
        clearHistory: () => this.setStatusStub(0),
        generateRandomHistory: () => this.setStatusStub(this.stubQueue),
      },
      preset: {
        list: () => this.presets.names(),
        currentName: () => this.currentPresetName,
        isLocked: (n) => this.presets.isLocked(n),
        save: () => this.savePreset(this.currentPresetName),
        saveAs: (n) => this.savePreset(n),
        load: (n) => this.loadPreset(n),
        duplicate: () => this.duplicatePreset(),
        deletePreset: () => this.deletePreset(),
        lock: () => this.lockPreset(),
        unlock: () => this.unlockPreset(),
        resetEverything: () => this.resetEverything(),
        importJSON: (f) => void this.importJSON(f),
        exportJSON: () => void this.exportJSON(),
        copyJSON: () => void this.copyJSON(),
      },
    });

    // Autosave working state (debounced) on any change.
    this.state.onChange(() => {
      this.storage.saveWorkingDebounced(this.state.snapshot());
    });
    window.addEventListener("beforeunload", () => {
      this.storage.saveWorkingNow(this.state.snapshot());
    });

    // Fullscreen shortcut.
    window.addEventListener("keydown", (e) => {
      if (e.key === "f" && !isTyping(e.target)) this.renderer.toggleFullscreen();
    });

    // Per-frame overlay update.
    this.renderer.setFrameCallback(() => {
      const res = this.renderer.renderResolution;
      this.overlay.update({
        fps: this.renderer.frameRate,
        width: res.width,
        height: res.height,
      });
    });

    this.renderer.start();
    if (import.meta.env.DEV) {
      (window as unknown as { __renderer: Renderer }).__renderer = this.renderer;
    }
  }

  // ---- Trigger (Phase 1 stub) ----------------------------------------------

  private triggerBeverage(id: BeverageId): void {
    // Phase 2 will enqueue a real order. For now, prove the wiring.
    this.stubQueue++;
    this.panel.updateStatus({
      queueLength: this.stubQueue,
      activeLabel: this.state.raw.beverages[id].label,
    });
    console.info(`[stub] triggered ${id}`);
  }

  private setStatusStub(n: number): void {
    this.stubQueue = n;
    this.panel.updateStatus({ queueLength: n, activeLabel: null });
  }

  // ---- Presets --------------------------------------------------------------

  private savePreset(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      this.showError("Enter a preset name before saving.", true);
      return;
    }
    if (this.presets.isLocked(trimmed)) {
      this.showError(`Preset "${trimmed}" is locked.`, true);
      return;
    }
    const snap = this.state.snapshot();
    snap.presetName = trimmed;
    this.presets.save(trimmed, snap);
    this.currentPresetName = trimmed;
    this.state.set("presetName", trimmed);
    this.panel.refreshPresets();
  }

  private loadPreset(name: string): void {
    const p = this.presets.get(name);
    if (!p) return;
    this.state.replace(p);
    this.currentPresetName = name;
    this.panel.setLocked(this.presets.isLocked(name));
    this.panel.refreshAll();
    this.storage.saveWorkingNow(this.state.snapshot());
  }

  private duplicatePreset(): void {
    const copy = this.presets.duplicate(this.currentPresetName);
    if (copy) {
      this.currentPresetName = copy;
      this.panel.refreshPresets();
    }
  }

  private deletePreset(): void {
    if (!this.presets.has(this.currentPresetName)) return;
    try {
      this.presets.delete(this.currentPresetName);
      this.panel.refreshPresets();
    } catch (err) {
      this.showError(String((err as Error).message), true);
    }
  }

  private lockPreset(): void {
    if (!this.presets.has(this.currentPresetName)) {
      this.showError("Save the preset before locking it.", true);
      return;
    }
    this.presets.lock(this.currentPresetName);
    this.panel.setLocked(true);
    this.panel.refreshPresets();
  }

  private unlockPreset(): void {
    this.presets.unlock(this.currentPresetName);
    this.panel.setLocked(false);
    this.panel.refreshPresets();
  }

  private resetEverything(): void {
    const fresh = createDefaultPreset();
    this.state.replace(fresh);
    this.currentPresetName = fresh.presetName;
    this.panel.setLocked(false);
    this.panel.refreshAll();
    this.storage.saveWorkingNow(this.state.snapshot());
  }

  // ---- JSON I/O -------------------------------------------------------------

  private async importJSON(file: File): Promise<void> {
    try {
      const text = await file.text();
      const state = fromJSON(text);
      this.state.replace(state);
      this.currentPresetName = state.presetName;
      this.panel.setLocked(false);
      this.panel.refreshAll();
      this.storage.saveWorkingNow(this.state.snapshot());
      this.clearError();
    } catch (err) {
      this.showError(`Import failed: ${(err as Error).message}`, true);
    }
  }

  private async exportJSON(): Promise<void> {
    const snap = this.state.snapshot();
    const name = (snap.presetName || "preset").replace(/[^\w-]+/g, "_");
    await saveJSONWithPicker(snap, `${name}.json`);
  }

  private async copyJSON(): Promise<void> {
    try {
      await navigator.clipboard.writeText(toJSON(this.state.snapshot()));
    } catch {
      this.showError("Clipboard copy was blocked by the browser.", true);
    }
  }

  // ---- Error banner ---------------------------------------------------------

  private showError(message: string, transient = false): void {
    this.errorBanner.textContent = message;
    this.errorBanner.style.display = "block";
    if (transient) {
      window.setTimeout(() => this.clearError(), 4000);
    }
  }

  private clearError(): void {
    this.errorBanner.style.display = "none";
  }
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA");
}
