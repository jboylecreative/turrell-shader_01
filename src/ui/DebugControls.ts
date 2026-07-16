// -----------------------------------------------------------------------------
// DebugControls — the live on-canvas readout (FPS, render resolution). The debug
// *toggles* themselves live in the Debugging parameter section; this file only
// renders the overlay driven by those flags each frame.
// -----------------------------------------------------------------------------

import type { AppState } from "../app/AppState";

export interface DebugOverlay {
  root: HTMLElement;
  update: (info: { fps: number; width: number; height: number }) => void;
}

export function buildDebugOverlay(state: AppState): DebugOverlay {
  const root = document.createElement("div");
  root.className = "debug-overlay";

  const update = (info: { fps: number; width: number; height: number }) => {
    const d = state.raw.debug;
    const lines: string[] = [];
    if (d.showFrameRate) lines.push(`${info.fps.toFixed(0)} fps`);
    if (d.showRenderResolution) lines.push(`${info.width}×${info.height}`);
    if (d.freezeTime) lines.push("time frozen");
    if (d.monochrome) lines.push("mono");
    root.textContent = lines.join("   ");
    root.style.display = lines.length ? "block" : "none";
  };
  update({ fps: 0, width: 0, height: 0 });
  return { root, update };
}
