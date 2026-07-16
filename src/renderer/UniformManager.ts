// -----------------------------------------------------------------------------
// UniformManager: owns the shared uniform objects and syncs them from AppState.
//
// Uniforms are keyed by their GLSL name (as declared in parameterDefinitions).
// The SAME uniform object is shared between passes, so a value set here updates
// every material that references that name. Materials that don't use a given
// uniform simply ignore it (Three uploads only what the program references).
//
// Scalar/bool parameters are bound generically straight from the parameter
// table — so adding a slider that feeds a uniform requires no code here. Colour
// and fixed-size array uniforms (Phase 2+) are handled explicitly.
// -----------------------------------------------------------------------------

import * as THREE from "three";
import { allParameters } from "../config/parameterDefinitions";
import { getByPath } from "../app/AppState";
import type { PresetState } from "../app/types";

export interface UniformEntry {
  value: unknown;
}

export class UniformManager {
  /** name → uniform object shared across materials. */
  readonly uniforms: Record<string, UniformEntry> = {};

  /** Parameter paths that feed a scalar/bool uniform, resolved once. */
  private scalarBindings: { path: string; uniform: string }[] = [];

  constructor() {
    // Special (non-parameter) uniforms used by the pipeline.
    this.uniforms.uTime = { value: 0 };
    this.uniforms.uResolution = { value: new THREE.Vector2(1920, 1080) };
    this.uniforms.uAspect = { value: 1920 / 1080 };
    this.uniforms.uStrataTexture = { value: null };

    // Generic scalar/bool bindings from the parameter table.
    for (const p of allParameters()) {
      if (!p.uniform) continue;
      if (p.type === "float" || p.type === "int") {
        this.uniforms[p.uniform] ??= { value: 0 };
        this.scalarBindings.push({ path: p.jsonPath, uniform: p.uniform });
      } else if (p.type === "bool") {
        this.uniforms[p.uniform] ??= { value: false };
        this.scalarBindings.push({ path: p.jsonPath, uniform: p.uniform });
      }
      // 'color' handled in Phase 2+ via explicit Vector3 uniforms.
    }
  }

  /** Push all scalar/bool parameter values from state into their uniforms. */
  sync(state: PresetState): void {
    for (const b of this.scalarBindings) {
      this.uniforms[b.uniform].value = getByPath(state, b.path);
    }
  }

  setTime(t: number): void {
    this.uniforms.uTime.value = t;
  }

  setResolution(w: number, h: number): void {
    (this.uniforms.uResolution.value as THREE.Vector2).set(w, h);
    this.uniforms.uAspect.value = w / h;
  }

  setStrataTexture(tex: THREE.Texture | null): void {
    this.uniforms.uStrataTexture.value = tex;
  }
}
