// -----------------------------------------------------------------------------
// Framework-independent application state model.
//
// PORTABILITY NOTE: Nothing in this file may reference Three.js, the DOM, or any
// browser API. These types describe the serializable state that becomes JSON and
// that will later be reconstructed in TouchDesigner (custom parameters, CHOP
// channels, DAT tables). Keep every field a primitive, array, or plain object.
// -----------------------------------------------------------------------------

export const BEVERAGE_IDS = [
  "americano",
  "matcha",
  "latte",
  "espresso",
  "coldBrew",
] as const;

export type BeverageId = (typeof BEVERAGE_IDS)[number];

/** Compile-time shader maximum for visible strata. Mirrored in GLSL. */
export const MAX_STRATA = 20;
/** One extra slot so a single oldest stratum can animate out while full. */
export const MAX_STRATA_PLUS_EXIT = MAX_STRATA + 1;

export type StratumState = "queued" | "entering" | "resting" | "exiting";

/**
 * One order = one visual stratum. `currentTop/Bottom` are the animated,
 * per-frame normalized vertical positions (0 = top of frame, 1 = bottom).
 * `target*` are where the stratum is easing toward.
 */
export interface OrderStratum {
  id: string;
  beverageId: BeverageId;
  createdAt: number;
  seed: number;
  activationStartedAt: number;
  state: StratumState;
  currentTop: number;
  currentBottom: number;
  targetTop: number;
  targetBottom: number;
}

// ----- Serializable settings groups ------------------------------------------

export interface ResolutionSettings {
  width: number;
  height: number;
}

export interface HistorySettings {
  visibleCount: number;
  maximumCount: number;
  initialCount: number;
  randomizeInitialCount: boolean;
}

export interface GlobalSettings {
  timeScale: number;
  exposure: number;
  saturation: number;
  contrast: number;
  backgroundLuminance: number;
  motionAmount: number;
  horizontalDrift: number;
  driftTurbulence: number;
  sharedFlowScale: number;
  sharedFlowSpeed: number;
  sharedDisplacement: number;
  grainAmount: number;
  bloomAmount: number;
  previewQuality: number; // 0.25 .. 1.0 render-scale
  pause: boolean;
}

export interface StrataLayoutSettings {
  heightVariation: number;
  heightWeighting: number;
  stackCompression: number;
  entryDuration: number;
  exitDuration: number;
  shiftDuration: number;
  overshoot: number;
  settlingDamping: number;
  boundarySoftness: number;
}

export interface InteractionSettings {
  colorBleed: number;
  neighborCoupling: number;
  interactionRadius: number;
  boundaryDisplacement: number;
  sharedFieldInfluence: number;
  edgeContamination: number;
  interactionDecay: number;
  crossLuminance: number;
  boundaryIrregularity: number;
}

export interface CascadeSettings {
  duration: number;
  travelDuration: number;
  width: number;
  softness: number;
  peakIntensity: number;
  peakSaturation: number;
  displacement: number;
  neighborDisturbance: number;
  echoCount: number;
  echoSpacing: number;
  settlingDuration: number;
}

export interface QueueSettings {
  minInterval: number;
  overlapAmount: number;
  doubleClickProtection: boolean;
  doubleClickInterval: number;
}

export interface BeverageColors {
  primary: string;
  secondary: string;
  highlight: string;
  shadow: string;
}

/** The "nature of the form" controls — how the field is structured. */
export interface BeverageForm {
  scale: number;      // feature size
  swirl: number;      // domain-warp amount
  complexity: number; // smooth blobs -> intricate folds
  ridginess: number;  // billowy -> veined/filamented
  stretch: number;    // 0 vertical streaks .. 0.5 round .. 1 horizontal streaks
  definition: number; // soft mist -> hard-edged masses
  luminance: number;  // overall brightness
  variation: number;  // per-order distinctness (0 identical .. 1 quite varied)
}

/** Sense of depth beneath the surface. */
export interface BeverageDepth {
  turbidity: number;  // surface opacity: 1 opaque .. 0 see deep through gaps
  parallax: number;   // how much the deep layer lags/drifts differently
  depthTint: number;  // how much the deep layer darkens / recedes
}

/** Abstract suspended inclusions (soft bubbles / ice facets). */
export interface BeverageInclusions {
  bubbles: number; // amount of soft rising light-discs
  facets: number;  // amount of translucent ice facets
  size: number;    // element size
  speed: number;   // rise / drift speed
}

/** How the form moves. */
export interface BeverageMotion {
  speed: number;       // internal churn/animation rate (not directional)
  flowStrength: number;// how far/fast it drifts directionally
  flowAngle: number;   // direction of the drift, in degrees
  turbulence: number;  // extra churn rate
  pulse: number;       // breathing pulse depth
  pulseSpeed: number;  // breathing pulse rate
}

/** Active (trigger) response — consumed by the Phase 5 cascade (kept for schema). */
export interface BeverageActive {
  durationMultiplier: number;
  brightness: number;
  displacement: number;
  spread: number;
  settlingSpeed: number;
}

export interface BeverageDefinition {
  label: string;
  colors: BeverageColors;
  form: BeverageForm;
  depth: BeverageDepth;
  inclusions: BeverageInclusions;
  motion: BeverageMotion;
  active: BeverageActive;
}

export type BeverageMap = Record<BeverageId, BeverageDefinition>;

export interface DebugSettings {
  monochrome: boolean;
  showBoundaries: boolean;
  showIndices: boolean;
  showCascadeField: boolean;
  showFrameRate: boolean;
  showRenderResolution: boolean;
  freezeTime: boolean;
  displaySeeds: boolean;
}

// ----- Root serializable preset ----------------------------------------------

export const SCHEMA_VERSION = 1;
export const APP_VERSION = "0.1.0";

/**
 * The complete serializable state. This is exactly what is written to
 * localStorage, exported/imported as JSON, and stored per named preset.
 * It contains no runtime objects, no queue, and no animation timestamps.
 */
export interface PresetState {
  schemaVersion: number;
  appVersion: string;
  presetName: string;
  savedAt: string;
  resolution: ResolutionSettings;
  randomSeed: number;
  history: HistorySettings;
  global: GlobalSettings;
  strataLayout: StrataLayoutSettings;
  interaction: InteractionSettings;
  cascade: CascadeSettings;
  queue: QueueSettings;
  debug: DebugSettings;
  beverages: BeverageMap;
}
