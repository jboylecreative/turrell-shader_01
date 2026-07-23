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
import { BEVERAGE_IDS, MAX_STRATA_PLUS_EXIT, type PresetState } from "../app/types";
import type { RuntimeStratum } from "../app/HistoryManager";
import { hexToLinear } from "./ColorUtils";

const N = MAX_STRATA_PLUS_EXIT; // fixed shader array size (21)
const NBEV = BEVERAGE_IDS.length; // 5

export interface UniformEntry {
  value: unknown;
}

export class UniformManager {
  /** name → uniform object shared across materials. */
  readonly uniforms: Record<string, UniformEntry> = {};

  /** Parameter paths that feed a scalar/bool uniform, resolved once. */
  private scalarBindings: { path: string; uniform: string }[] = [];
  /** Per-beverage float params grouped into arrays: uniform → 5 jsonPaths. */
  private bevArrayBindings: { uniform: string; paths: string[] }[] = [];

  constructor() {
    // Special (non-parameter) uniforms used by the pipeline.
    this.uniforms.uTime = { value: 0 };
    this.uniforms.uResolution = { value: new THREE.Vector2(1920, 1080) };
    this.uniforms.uAspect = { value: 1920 / 1080 };
    this.uniforms.uStrataTexture = { value: null };

    // Fixed-size strata arrays (parallel to the OrderStratum model).
    this.uniforms.uStrataCount = { value: 0 };
    this.uniforms.uStrataType = { value: new Int32Array(N) };
    this.uniforms.uStrataSeed = { value: new Float32Array(N) };
    this.uniforms.uStrataAge = { value: new Float32Array(N) };
    this.uniforms.uStrataTop = { value: new Float32Array(N) };
    this.uniforms.uStrataBottom = { value: new Float32Array(N) };
    this.uniforms.uStrataActivation = { value: new Float32Array(N) };

    // Per-beverage colour palettes (linear), indexed by beverage id order.
    this.uniforms.uBevPrimary = { value: makeVec3Array(NBEV) };
    this.uniforms.uBevSecondary = { value: makeVec3Array(NBEV) };
    this.uniforms.uBevHighlight = { value: makeVec3Array(NBEV) };
    this.uniforms.uBevShadow = { value: makeVec3Array(NBEV) };

    // Bindings from the parameter table. Per-beverage params (jsonPath starts
    // with "beverages.") become arrays indexed by beverage; everything else is a
    // plain scalar/bool. Colours are handled by syncBeverageColors.
    const bevGroups = new Map<string, string[]>();
    for (const p of allParameters()) {
      if (!p.uniform) continue;

      if (p.jsonPath.startsWith("beverages.")) {
        if (p.type !== "float" && p.type !== "int") continue; // colours: separate
        const id = p.jsonPath.split(".")[1] as (typeof BEVERAGE_IDS)[number];
        const idx = BEVERAGE_IDS.indexOf(id);
        if (idx < 0) continue;
        if (!bevGroups.has(p.uniform)) {
          this.uniforms[p.uniform] = { value: new Float32Array(NBEV) };
          bevGroups.set(p.uniform, new Array(NBEV).fill(""));
        }
        bevGroups.get(p.uniform)![idx] = p.jsonPath;
        continue;
      }

      if (p.type === "float" || p.type === "int") {
        this.uniforms[p.uniform] ??= { value: 0 };
        this.scalarBindings.push({ path: p.jsonPath, uniform: p.uniform });
      } else if (p.type === "bool") {
        this.uniforms[p.uniform] ??= { value: false };
        this.scalarBindings.push({ path: p.jsonPath, uniform: p.uniform });
      }
    }
    this.bevArrayBindings = [...bevGroups.entries()].map(([uniform, paths]) => ({
      uniform,
      paths,
    }));
  }

  /** Push all scalar/bool parameter values from state into their uniforms. */
  sync(state: PresetState): void {
    for (const b of this.scalarBindings) {
      this.uniforms[b.uniform].value = getByPath(state, b.path);
    }
  }

  /** Push per-beverage float params into their arrays (indexed by beverage). */
  syncBeverageParams(state: PresetState): void {
    for (const b of this.bevArrayBindings) {
      const arr = this.uniforms[b.uniform].value as Float32Array;
      for (let i = 0; i < b.paths.length; i++) {
        arr[i] = Number(getByPath(state, b.paths[i]));
      }
    }
  }

  /** Push per-beverage palette colours (hex sRGB → linear) into uniforms. */
  syncBeverageColors(state: PresetState): void {
    const prim = this.uniforms.uBevPrimary.value as THREE.Vector3[];
    const sec = this.uniforms.uBevSecondary.value as THREE.Vector3[];
    const hi = this.uniforms.uBevHighlight.value as THREE.Vector3[];
    const sh = this.uniforms.uBevShadow.value as THREE.Vector3[];
    BEVERAGE_IDS.forEach((id, i) => {
      const c = state.beverages[id].colors;
      prim[i].fromArray(hexToLinear(c.primary));
      sec[i].fromArray(hexToLinear(c.secondary));
      hi[i].fromArray(hexToLinear(c.highlight));
      sh[i].fromArray(hexToLinear(c.shadow));
    });
  }

  /** Fill the fixed-size strata arrays from the live history model. */
  setStrata(strata: RuntimeStratum[], realTime: number): void {
    const type = this.uniforms.uStrataType.value as Int32Array;
    const seed = this.uniforms.uStrataSeed.value as Float32Array;
    const age = this.uniforms.uStrataAge.value as Float32Array;
    const top = this.uniforms.uStrataTop.value as Float32Array;
    const bottom = this.uniforms.uStrataBottom.value as Float32Array;
    const activation = this.uniforms.uStrataActivation.value as Float32Array;

    const count = Math.min(strata.length, N);
    for (let i = 0; i < count; i++) {
      const s = strata[i];
      type[i] = BEVERAGE_IDS.indexOf(s.beverageId);
      seed[i] = s.seed;
      age[i] = realTime - s.createdAt;
      top[i] = s.currentTop;
      bottom[i] = s.currentBottom;
      activation[i] = 0; // Phase 5 fills the activation envelope.
    }
    this.uniforms.uStrataCount.value = count;
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

function makeVec3Array(n: number): THREE.Vector3[] {
  return Array.from({ length: n }, () => new THREE.Vector3());
}
