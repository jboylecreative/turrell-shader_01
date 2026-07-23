// -----------------------------------------------------------------------------
// Default preset state. This is the single source of factory values.
//
// Every numeric default here is also declared (with min/max/label/uniform/TD
// destination) in parameterDefinitions.ts. Keep the two in sync: defaults.ts is
// the *values*, parameterDefinitions.ts is the *metadata* that drives the UI and
// the uniform binding.
// -----------------------------------------------------------------------------

import {
  APP_VERSION,
  SCHEMA_VERSION,
  type BeverageDefinition,
  type BeverageId,
  type BeverageMap,
  type PresetState,
} from "../app/types";

export const DEFAULT_RESOLUTION = { width: 1920, height: 1080 };

// Per-beverage palettes and behaviour, following the creative direction in the
// build spec (§6). Colours are sRGB hex; the shader converts to linear.
const BEVERAGES: BeverageMap = {
  americano: {
    label: "Americano",
    colors: { primary: "#5A3A22", secondary: "#31200F", highlight: "#C08A4E", shadow: "#160D06" },
    // Big billowy amber masses drifting sideways.
    form: { scale: 1.1, swirl: 1.0, complexity: 0.5, ridginess: 0.2, stretch: 0.55, definition: 0.5, luminance: 0.55, variation: 0.4 },
    depth: { turbidity: 0.6, parallax: 0.5, depthTint: 0.6 },
    motion: { speed: 0.4, flowStrength: 1.0, turbulence: 0.5, pulse: 0.1, pulseSpeed: 0.4 },
    active: { durationMultiplier: 1.0, brightness: 0.6, displacement: 0.35, spread: 0.4, settlingSpeed: 0.7 },
  },
  matcha: {
    label: "Matcha",
    colors: { primary: "#536B3B", secondary: "#A7B77A", highlight: "#D8D8A5", shadow: "#1E2B19" },
    // Soft radial bloom, breathing and swirling.
    form: { scale: 1.4, swirl: 1.3, complexity: 0.6, ridginess: 0.15, stretch: 0.5, definition: 0.35, luminance: 0.68, variation: 0.45 },
    depth: { turbidity: 0.5, parallax: 0.4, depthTint: 0.5 },
    motion: { speed: 0.5, flowStrength: 0.3, turbulence: 0.8, pulse: 0.5, pulseSpeed: 0.35 },
    active: { durationMultiplier: 1.15, brightness: 0.8, displacement: 0.3, spread: 0.75, settlingSpeed: 0.55 },
  },
  latte: {
    label: "Latte",
    colors: { primary: "#D8C4A6", secondary: "#EFE3D0", highlight: "#FBF4E8", shadow: "#B49B78" },
    // Broad, smooth, bright horizontal veil sliding sideways.
    form: { scale: 0.8, swirl: 0.5, complexity: 0.3, ridginess: 0.05, stretch: 0.8, definition: 0.2, luminance: 0.9, variation: 0.3 },
    depth: { turbidity: 0.8, parallax: 0.3, depthTint: 0.3 },
    motion: { speed: 0.28, flowStrength: 1.4, turbulence: 0.3, pulse: 0.15, pulseSpeed: 0.25 },
    active: { durationMultiplier: 1.2, brightness: 0.9, displacement: 0.22, spread: 0.8, settlingSpeed: 0.5 },
  },
  espresso: {
    label: "Espresso",
    colors: { primary: "#4A2413", secondary: "#7A3C1C", highlight: "#D9863E", shadow: "#1A0C06" },
    // Small-scale, high-contrast, veined, throbbing in place.
    form: { scale: 2.2, swirl: 1.2, complexity: 0.7, ridginess: 0.6, stretch: 0.5, definition: 1.0, luminance: 0.5, variation: 0.5 },
    depth: { turbidity: 0.75, parallax: 0.4, depthTint: 0.7 },
    motion: { speed: 0.7, flowStrength: 0.3, turbulence: 1.0, pulse: 0.6, pulseSpeed: 0.7 },
    active: { durationMultiplier: 0.8, brightness: 0.85, displacement: 0.45, spread: 0.35, settlingSpeed: 0.9 },
  },
  coldBrew: {
    label: "Cold Brew",
    colors: { primary: "#2E2A33", secondary: "#3F3A4A", highlight: "#8A93A8", shadow: "#120F16" },
    // Vertical laminar currents descending.
    form: { scale: 1.3, swirl: 0.7, complexity: 0.5, ridginess: 0.35, stretch: 0.15, definition: 0.55, luminance: 0.45, variation: 0.4 },
    depth: { turbidity: 0.4, parallax: 0.7, depthTint: 0.7 },
    motion: { speed: 0.25, flowStrength: 0.5, turbulence: 0.5, pulse: 0.12, pulseSpeed: 0.2 },
    active: { durationMultiplier: 1.3, brightness: 0.6, displacement: 0.4, spread: 0.45, settlingSpeed: 0.4 },
  },
};

export function defaultBeverage(id: BeverageId): BeverageDefinition {
  return structuredClone(BEVERAGES[id]);
}

export function createDefaultPreset(): PresetState {
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    presetName: "Initial Rothko Strata",
    savedAt: new Date().toISOString(),
    resolution: { ...DEFAULT_RESOLUTION },
    randomSeed: 18472,
    history: {
      visibleCount: 10,
      maximumCount: 20,
      initialCount: 10,
      randomizeInitialCount: false,
    },
    global: {
      timeScale: 0.16,
      exposure: 1.0,
      saturation: 1.0,
      contrast: 1.0,
      backgroundLuminance: 0.04,
      motionAmount: 1.0,
      horizontalDrift: 0.2,
      driftTurbulence: 0.5,
      sharedFlowScale: 1.4,
      sharedFlowSpeed: 0.3,
      sharedDisplacement: 0.06,
      grainAmount: 0.01,
      bloomAmount: 0.25,
      previewQuality: 1.0,
      pause: false,
    },
    strataLayout: {
      heightVariation: 0.25,
      heightWeighting: 0.5,
      stackCompression: 0.2,
      entryDuration: 1.6,
      exitDuration: 1.8,
      shiftDuration: 1.2,
      overshoot: 0.12,
      settlingDamping: 0.8,
      boundarySoftness: 0.14,
    },
    interaction: {
      colorBleed: 0.11,
      neighborCoupling: 0.18,
      interactionRadius: 0.12,
      boundaryDisplacement: 0.05,
      sharedFieldInfluence: 0.4,
      edgeContamination: 0.2,
      interactionDecay: 0.6,
      crossLuminance: 0.15,
      boundaryIrregularity: 0.3,
    },
    cascade: {
      duration: 3.5,
      travelDuration: 2.4,
      width: 0.18,
      softness: 0.12,
      peakIntensity: 0.75,
      peakSaturation: 0.3,
      displacement: 0.2,
      neighborDisturbance: 0.3,
      echoCount: 1,
      echoSpacing: 0.6,
      settlingDuration: 4.0,
    },
    queue: {
      minInterval: 0.6,
      overlapAmount: 0.3,
      doubleClickProtection: true,
      doubleClickInterval: 0.25,
    },
    debug: {
      monochrome: false,
      showBoundaries: false,
      showIndices: false,
      showCascadeField: false,
      showFrameRate: true,
      showRenderResolution: true,
      freezeTime: false,
      displaySeeds: false,
    },
    beverages: structuredClone(BEVERAGES),
  };
}
