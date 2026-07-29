// -----------------------------------------------------------------------------
// Parameter definitions: the single source of truth for every exposed control.
//
// Each ParameterDef declares its JSON path, UI metadata, value range, the GLSL
// uniform it will feed, and its eventual TouchDesigner destination. This one
// table drives:
//   - the control-panel UI (widget type, label, range)
//   - the uniform binding in the renderer (uniform name)
//   - the auto-generated parameter map in TD_PORTING.md
//
// Adding a control means adding a row here — nothing else needs to know its
// range or label.
// -----------------------------------------------------------------------------

import { BEVERAGE_IDS, type BeverageId } from "../app/types";

export type ParamType = "float" | "int" | "bool" | "color" | "select";

export interface ParameterDef {
  /** Dot-path into PresetState, e.g. "global.timeScale". */
  jsonPath: string;
  label: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  /** GLSL uniform name this parameter feeds (empty for pure UI/debug flags). */
  uniform?: string;
  /** Eventual TouchDesigner destination (custom par / CHOP channel / DAT). */
  td?: string;
  description: string;
  options?: { value: string; label: string }[];
  /** Not wired to anything yet (feature for a later phase); hidden from the UI
   *  but kept in the schema/state so it returns automatically when built. */
  future?: boolean;
}

export interface ControlSection {
  id: string;
  title: string;
  /** Sections start collapsed unless flagged open. */
  open?: boolean;
  /** Whole section is for a not-yet-built phase; hidden from the UI. */
  future?: boolean;
  params: ParameterDef[];
}

// ---- Beverage parameter templates -------------------------------------------
// These are expanded across the five beverages. `{Bev}` in the uniform is
// replaced with the capitalised beverage id (e.g. uMatchaRestingSpeed).

interface BevParamTemplate {
  key: string; // path suffix within the group, e.g. "rest.restingSpeed"
  label: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  uniformSuffix: string; // appended after u{Bev}
  td: string;
  description: string;
  future?: boolean;
}

// Per-beverage params map to un-prefixed uniform arrays indexed by beverage id
// (e.g. uRestingSpeed[matcha]); the TD column keeps the per-beverage CHOP name.
const BEV_COLOR_TEMPLATES: BevParamTemplate[] = [
  { key: "colors.primary", label: "Primary", type: "color", uniformSuffix: "BevPrimary", td: "Custom RGBA par {Bev}Primary", description: "Primary field colour (sRGB)." },
  { key: "colors.secondary", label: "Secondary", type: "color", uniformSuffix: "BevSecondary", td: "Custom RGBA par {Bev}Secondary", description: "Secondary field colour (sRGB)." },
  { key: "colors.highlight", label: "Highlight", type: "color", uniformSuffix: "BevHighlight", td: "Custom RGBA par {Bev}Highlight", description: "Luminous highlight colour (sRGB)." },
  { key: "colors.shadow", label: "Shadow", type: "color", uniformSuffix: "BevShadow", td: "Custom RGBA par {Bev}Shadow", description: "Deep shadow colour (sRGB)." },
];

// FORM — the "nature of the form" controls. Wide ranges for dramatic reshaping.
const BEV_FORM_TEMPLATES: BevParamTemplate[] = [
  { key: "form.scale", label: "Scale", type: "float", min: 0.2, max: 6, uniformSuffix: "Scale", td: "CHOP {Bev}Scale", description: "Feature size (higher = smaller, denser features)." },
  { key: "form.swirl", label: "Swirl", type: "float", min: 0, max: 3, uniformSuffix: "Swirl", td: "CHOP {Bev}Swirl", description: "Domain-warp amount: gentle drift -> heavy churn." },
  { key: "form.complexity", label: "Complexity", type: "float", min: 0, max: 1, uniformSuffix: "Complexity", td: "CHOP {Bev}Complexity", description: "Smooth blobs -> intricate multi-scale folds." },
  { key: "form.ridginess", label: "Ridginess", type: "float", min: 0, max: 1, uniformSuffix: "Ridginess", td: "CHOP {Bev}Ridginess", description: "Billowy clouds -> sharp veins / filaments." },
  { key: "form.stretch", label: "Stretch", type: "float", min: 0, max: 1, uniformSuffix: "Stretch", td: "CHOP {Bev}Stretch", description: "0 vertical streaks .. 0.5 round .. 1 horizontal streaks." },
  { key: "form.definition", label: "Definition", type: "float", min: 0, max: 1.5, uniformSuffix: "Definition", td: "CHOP {Bev}Definition", description: "Soft mist -> hard-edged defined masses." },
  { key: "form.luminance", label: "Luminance", type: "float", min: 0, max: 1.5, uniformSuffix: "Luminance", td: "CHOP {Bev}Luminance", description: "Overall brightness of the field." },
  { key: "form.glow", label: "Glow", type: "float", min: 0, max: 2.5, uniformSuffix: "Glow", td: "CHOP {Bev}Glow", description: "How much this beverage's bright parts emit light (bloomed by the global Glow). Follows the structure — highlights, cores, bubble rims, ice edges glow most." },
  { key: "form.variation", label: "Variation", type: "float", min: 0, max: 1, uniformSuffix: "Variation", td: "CHOP {Bev}Variation", description: "Per-order distinctness: 0 = repeat orders look identical, 1 = each order varies (scale/orientation/brightness) while keeping identity." },
];

// DEPTH — sense of volume beneath an opaque surface.
const BEV_DEPTH_TEMPLATES: BevParamTemplate[] = [
  { key: "depth.turbidity", label: "Turbidity", type: "float", min: 0, max: 1, uniformSuffix: "Turbidity", td: "CHOP {Bev}Turbidity", description: "Surface opacity: high = opaque surface, low = glimpses of the depths below." },
  { key: "depth.parallax", label: "Depth Parallax", type: "float", min: 0, max: 1, uniformSuffix: "Parallax", td: "CHOP {Bev}Parallax", description: "How much the deep layer lags/drifts differently (depth motion cue)." },
  { key: "depth.depthTint", label: "Depth Tint", type: "float", min: 0, max: 1, uniformSuffix: "DepthTint", td: "CHOP {Bev}DepthTint", description: "How much the deep layer darkens / recedes." },
];

// INCLUSIONS — abstract suspended elements (soft bubbles / ice facets).
const BEV_INCLUSION_TEMPLATES: BevParamTemplate[] = [
  { key: "inclusions.bubbles", label: "Bubbles", type: "float", min: 0, max: 1, uniformSuffix: "Bubbles", td: "CHOP {Bev}Bubbles", description: "Amount of soft, rising luminous bubbles (abstract/suggestive)." },
  { key: "inclusions.facets", label: "Ice Facets", type: "float", min: 0, max: 1, uniformSuffix: "Facets", td: "CHOP {Bev}Facets", description: "Amount of translucent angular ice facets (abstract/suggestive)." },
  { key: "inclusions.size", label: "Inclusion Size", type: "float", min: 0, max: 1, uniformSuffix: "IncSize", td: "CHOP {Bev}IncSize", description: "Size of bubbles / facets." },
  { key: "inclusions.speed", label: "Inclusion Speed", type: "float", min: 0, max: 1, uniformSuffix: "IncSpeed", td: "CHOP {Bev}IncSpeed", description: "Rise / drift speed of inclusions." },
];

// MOTION — how the form moves.
const BEV_MOTION_TEMPLATES: BevParamTemplate[] = [
  { key: "motion.speed", label: "Speed", type: "float", min: 0, max: 2, uniformSuffix: "Speed", td: "CHOP {Bev}Speed", description: "Internal churn/animation rate (twirls & curls). Not directional." },
  { key: "motion.flowStrength", label: "Flow Strength", type: "float", min: 0, max: 2.5, uniformSuffix: "FlowStrength", td: "CHOP {Bev}FlowStrength", description: "How far/fast this beverage drifts directionally (x the global Drift Speed)." },
  { key: "motion.flowAngle", label: "Flow Direction", type: "float", min: 0, max: 360, uniformSuffix: "FlowAngle", td: "CHOP {Bev}FlowAngle", description: "Direction of the drift, in degrees (0 = right, 90 = down, 180 = left, 270 = up)." },
  { key: "motion.turbulence", label: "Turbulence", type: "float", min: 0, max: 2, uniformSuffix: "Turbulence", td: "CHOP {Bev}Turbulence", description: "Extra churn rate on top of Speed. Not directional." },
  { key: "motion.pulse", label: "Pulse", type: "float", min: 0, max: 1, uniformSuffix: "Pulse", td: "CHOP {Bev}Pulse", description: "Breathing pulse depth." },
  { key: "motion.pulseSpeed", label: "Pulse Speed", type: "float", min: 0, max: 2, uniformSuffix: "PulseSpeed", td: "CHOP {Bev}PulseSpeed", description: "Breathing pulse rate." },
];

// Active group is consumed by the Phase 5 cascade — hidden until then.
const BEV_ACTIVE_TEMPLATES: BevParamTemplate[] = [
  { key: "active.durationMultiplier", label: "Active Duration ×", type: "float", min: 0.25, max: 3, uniformSuffix: "ActiveDuration", td: "CHOP {Bev}ActiveDuration", description: "Multiplier on the shared active-cascade duration.", future: true },
  { key: "active.brightness", label: "Active Brightness", type: "float", min: 0, max: 1.5, uniformSuffix: "ActiveBrightness", td: "CHOP {Bev}ActiveBrightness", description: "Peak brightness during activation.", future: true },
  { key: "active.displacement", label: "Active Displacement", type: "float", min: 0, max: 1, uniformSuffix: "ActiveDisplacement", td: "CHOP {Bev}ActiveDisplacement", description: "Displacement strength during activation.", future: true },
  { key: "active.spread", label: "Active Spread", type: "float", min: 0, max: 1, uniformSuffix: "ActiveSpread", td: "CHOP {Bev}ActiveSpread", description: "How far the active effect spreads into neighbours.", future: true },
  { key: "active.settlingSpeed", label: "Settling Speed", type: "float", min: 0.1, max: 2, uniformSuffix: "SettlingSpeed", td: "CHOP {Bev}SettlingSpeed", description: "How quickly the beverage settles back to rest.", future: true },
];

function capitalise(id: BeverageId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function expandBeverageParams(id: BeverageId, templates: BevParamTemplate[]): ParameterDef[] {
  const Bev = capitalise(id);
  return templates.map((t) => ({
    jsonPath: `beverages.${id}.${t.key}`,
    label: t.label,
    type: t.type,
    min: t.min,
    max: t.max,
    step: t.step,
    // Un-prefixed uniform: an array indexed by beverage id in the browser,
    // a scalar custom-par per beverage GLSL TOP in TouchDesigner.
    uniform: `u${t.uniformSuffix}`,
    td: t.td.replace("{Bev}", Bev),
    description: t.description,
    future: t.future,
  }));
}

/** Build the per-beverage control section (Section F). */
export function beverageSections(): ControlSection[] {
  return BEVERAGE_IDS.map((id) => ({
    id: `beverage-${id}`,
    title: capitalise(id),
    params: [
      ...expandBeverageParams(id, BEV_COLOR_TEMPLATES),
      ...expandBeverageParams(id, BEV_FORM_TEMPLATES),
      ...expandBeverageParams(id, BEV_DEPTH_TEMPLATES),
      ...expandBeverageParams(id, BEV_INCLUSION_TEMPLATES),
      ...expandBeverageParams(id, BEV_MOTION_TEMPLATES),
      ...expandBeverageParams(id, BEV_ACTIVE_TEMPLATES),
    ],
  }));
}

// ---- Global / shared sections (B–H) -----------------------------------------

export const GLOBAL_SECTIONS: ControlSection[] = [
  {
    id: "global",
    title: "Global Composition",
    open: true,
    params: [
      { jsonPath: "global.timeScale", label: "Overall Time Scale", type: "float", min: 0, max: 1, uniform: "uTimeScale", td: "CHOP TimeScale", description: "Master multiplier on animation time." },
      { jsonPath: "global.exposure", label: "Exposure", type: "float", min: 0, max: 2, uniform: "uExposure", td: "CHOP Exposure", description: "Linear exposure applied before display conversion." },
      { jsonPath: "global.saturation", label: "Saturation", type: "float", min: 0, max: 2, uniform: "uSaturation", td: "CHOP Saturation", description: "Final saturation." },
      { jsonPath: "global.contrast", label: "Contrast", type: "float", min: 0.5, max: 2, uniform: "uContrast", td: "CHOP Contrast", description: "Final contrast." },
      { jsonPath: "global.backgroundLuminance", label: "Background Luminance", type: "float", min: 0, max: 0.3, uniform: "uBackgroundLuminance", td: "CHOP BackgroundLuminance", description: "Luminance of the empty background." },
      { jsonPath: "global.motionAmount", label: "Global Motion Amount", type: "float", min: 0, max: 2, uniform: "uMotionAmount", td: "CHOP MotionAmount", description: "Global scale on all motion." },
      { jsonPath: "global.horizontalDrift", label: "Drift Speed", type: "float", min: 0, max: 3, uniform: "uHorizontalDrift", td: "CHOP HorizontalDrift", description: "Base speed of the liquid flow; each beverage sets its own Flow Direction and Flow Strength." },
      { jsonPath: "global.driftTurbulence", label: "Drift Turbulence", type: "float", min: 0, max: 1.5, uniform: "uDriftTurbulence", td: "CHOP DriftTurbulence", description: "How much the drifting texture churns/swirls vs. slides flat." },
      { jsonPath: "global.sharedFlowScale", label: "Shared Flow Scale", type: "float", min: 0.2, max: 5, uniform: "uSharedFlowScale", td: "CHOP SharedFlowScale", description: "Spatial scale of the shared flow field.", future: true },
      { jsonPath: "global.sharedFlowSpeed", label: "Shared Flow Speed", type: "float", min: 0, max: 2, uniform: "uSharedFlowSpeed", td: "CHOP SharedFlowSpeed", description: "Rate of the shared flow field.", future: true },
      { jsonPath: "global.sharedDisplacement", label: "Shared Displacement", type: "float", min: 0, max: 0.3, uniform: "uSharedDisplacement", td: "CHOP SharedDisplacement", description: "Pass-2 whole-image displacement amount.", future: true },
      { jsonPath: "global.grainAmount", label: "Grain Amount", type: "float", min: 0, max: 0.3, uniform: "uGrainAmount", td: "CHOP GrainAmount", description: "Fine output grain." },
      { jsonPath: "global.bloomAmount", label: "Glow Amount", type: "float", min: 0, max: 2, uniform: "uBloomAmount", td: "CHOP BloomAmount", description: "Overall strength of the luminous glow/bloom (scales every beverage's emission)." },
      { jsonPath: "global.bloomRadius", label: "Glow Radius", type: "float", min: 0, max: 1, uniform: "uBloomRadius", td: "CHOP BloomRadius", description: "How far the glow spreads/halos out from the emissive parts." },
      { jsonPath: "global.previewQuality", label: "Preview Quality", type: "float", min: 0.25, max: 1, step: 0.05, uniform: "", td: "Res TOP scale", description: "Render-scale for preview; does not change coordinates." },
      { jsonPath: "global.pause", label: "Pause Animation", type: "bool", uniform: "uPaused", td: "CHOP Paused", description: "Freeze all animation." },
    ],
  },
  {
    id: "strata",
    title: "Strata Layout",
    params: [
      { jsonPath: "history.visibleCount", label: "Visible History Count", type: "int", min: 1, max: 20, uniform: "", td: "CHOP VisibleCount", description: "Number of visible strata (drives the History manager; the shader receives the live count as uStrataCount)." },
      { jsonPath: "history.initialCount", label: "Initial History Count", type: "int", min: 0, max: 20, uniform: "", td: "Par InitialCount", description: "Strata generated on load." },
      { jsonPath: "history.randomizeInitialCount", label: "Randomize Initial Count", type: "bool", uniform: "", td: "Par RandomizeInitial", description: "Randomize the initial history length." },
      { jsonPath: "strataLayout.heightVariation", label: "Stratum Height Variation", type: "float", min: 0, max: 1, uniform: "uHeightVariation", td: "CHOP HeightVariation", description: "Per-order variation in stratum height." },
      { jsonPath: "strataLayout.heightWeighting", label: "Height Weighting", type: "float", min: 0, max: 1, uniform: "uHeightWeighting", td: "CHOP HeightWeighting", description: "Bias of height toward top or bottom." },
      { jsonPath: "strataLayout.stackCompression", label: "Stack Compression", type: "float", min: 0, max: 1, uniform: "uStackCompression", td: "CHOP StackCompression", description: "Compression of strata near the bottom." },
      { jsonPath: "strataLayout.entryDuration", label: "Entry Duration", type: "float", min: 0.1, max: 6, uniform: "", td: "Par EntryDuration", description: "Seconds for a new stratum to enter." },
      { jsonPath: "strataLayout.exitDuration", label: "Exit Duration", type: "float", min: 0.1, max: 6, uniform: "", td: "Par ExitDuration", description: "Seconds for the oldest stratum to exit." },
      { jsonPath: "strataLayout.shiftDuration", label: "Shift Duration", type: "float", min: 0.1, max: 6, uniform: "", td: "Par ShiftDuration", description: "Seconds for the stack to shift down." },
      { jsonPath: "strataLayout.overshoot", label: "Overshoot", type: "float", min: 0, max: 0.5, uniform: "", td: "Par Overshoot", description: "Spring overshoot on settling." },
      { jsonPath: "strataLayout.settlingDamping", label: "Settling Damping", type: "float", min: 0, max: 1, uniform: "", td: "Par SettlingDamping", description: "Damping of the settling motion." },
      { jsonPath: "strataLayout.boundarySoftness", label: "Boundary Softness", type: "float", min: 0, max: 0.5, uniform: "uBoundarySoftness", td: "CHOP BoundarySoftness", description: "Softness of inter-stratum boundaries." },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
    future: true, // Phase 4 — cross-stratum interaction not built yet
    params: [
      { jsonPath: "interaction.colorBleed", label: "Color Bleed", type: "float", min: 0, max: 1, uniform: "uColorBleed", td: "CHOP ColorBleed", description: "Neighbour colour contamination amount." },
      { jsonPath: "interaction.neighborCoupling", label: "Neighbor Coupling", type: "float", min: 0, max: 1, uniform: "uNeighborCoupling", td: "CHOP NeighborCoupling", description: "How strongly strata push each other's boundaries." },
      { jsonPath: "interaction.interactionRadius", label: "Interaction Radius", type: "float", min: 0, max: 0.5, uniform: "uInteractionRadius", td: "CHOP InteractionRadius", description: "Vertical radius of neighbour influence." },
      { jsonPath: "interaction.boundaryDisplacement", label: "Boundary Displacement", type: "float", min: 0, max: 0.3, uniform: "uBoundaryDisplacement", td: "CHOP BoundaryDisplacement", description: "Displacement of boundaries by the flow field." },
      { jsonPath: "interaction.sharedFieldInfluence", label: "Shared Field Influence", type: "float", min: 0, max: 1, uniform: "uSharedFieldInfluence", td: "CHOP SharedFieldInfluence", description: "Influence of the shared flow field." },
      { jsonPath: "interaction.edgeContamination", label: "Edge Contamination", type: "float", min: 0, max: 1, uniform: "uEdgeContamination", td: "CHOP EdgeContamination", description: "Extra colour mixing right at the edges." },
      { jsonPath: "interaction.interactionDecay", label: "Interaction Decay", type: "float", min: 0, max: 1, uniform: "uInteractionDecay", td: "CHOP InteractionDecay", description: "Falloff of interaction with distance." },
      { jsonPath: "interaction.crossLuminance", label: "Cross Luminance", type: "float", min: 0, max: 1, uniform: "uCrossLuminance", td: "CHOP CrossLuminance", description: "Cross-stratum luminance influence." },
      { jsonPath: "interaction.boundaryIrregularity", label: "Boundary Irregularity", type: "float", min: 0, max: 1, uniform: "uBoundaryIrregularity", td: "CHOP BoundaryIrregularity", description: "Irregularity of the boundary shapes." },
    ],
  },
  {
    id: "cascade",
    title: "Active Cascade",
    future: true, // Phase 5 — active cascade not built yet
    params: [
      { jsonPath: "cascade.duration", label: "Duration", type: "float", min: 0.5, max: 10, uniform: "uCascadeDuration", td: "CHOP CascadeDuration", description: "Total active-state duration." },
      { jsonPath: "cascade.travelDuration", label: "Travel Duration", type: "float", min: 0.3, max: 8, uniform: "uCascadeTravel", td: "CHOP CascadeTravel", description: "Seconds for the cascade front to cross the screen." },
      { jsonPath: "cascade.width", label: "Width", type: "float", min: 0.02, max: 0.6, uniform: "uCascadeWidth", td: "CHOP CascadeWidth", description: "Vertical width of the cascade front." },
      { jsonPath: "cascade.softness", label: "Softness", type: "float", min: 0, max: 0.5, uniform: "uCascadeSoftness", td: "CHOP CascadeSoftness", description: "Softness of the cascade front edges." },
      { jsonPath: "cascade.peakIntensity", label: "Peak Intensity", type: "float", min: 0, max: 1.5, uniform: "uCascadePeakIntensity", td: "CHOP CascadePeakIntensity", description: "Peak brightness at the cascade front." },
      { jsonPath: "cascade.peakSaturation", label: "Peak Saturation", type: "float", min: 0, max: 1, uniform: "uCascadePeakSaturation", td: "CHOP CascadePeakSaturation", description: "Saturation boost at the cascade front." },
      { jsonPath: "cascade.displacement", label: "Displacement", type: "float", min: 0, max: 0.5, uniform: "uCascadeDisplacement", td: "CHOP CascadeDisplacement", description: "Displacement strength at the front." },
      { jsonPath: "cascade.neighborDisturbance", label: "Neighbor Disturbance", type: "float", min: 0, max: 1, uniform: "uCascadeNeighborDisturbance", td: "CHOP CascadeNeighborDisturbance", description: "How much the cascade disturbs neighbours." },
      { jsonPath: "cascade.echoCount", label: "Echo Count", type: "int", min: 0, max: 4, uniform: "uCascadeEchoCount", td: "CHOP CascadeEchoCount", description: "Number of secondary echoes." },
      { jsonPath: "cascade.echoSpacing", label: "Echo Spacing", type: "float", min: 0.1, max: 2, uniform: "uCascadeEchoSpacing", td: "CHOP CascadeEchoSpacing", description: "Spacing between echoes." },
      { jsonPath: "cascade.settlingDuration", label: "Settling Duration", type: "float", min: 0.5, max: 10, uniform: "", td: "Par SettlingDuration", description: "Seconds to resolve back to rest." },
    ],
  },
  {
    id: "queue",
    title: "Event Queue",
    params: [
      { jsonPath: "queue.minInterval", label: "Min Time Between Events", type: "float", min: 0, max: 5, uniform: "", td: "Par MinInterval", description: "Minimum seconds between active events." },
      { jsonPath: "queue.overlapAmount", label: "Active Overlap Amount", type: "float", min: 0, max: 1, uniform: "", td: "Par OverlapAmount", description: "How much the next event overlaps the previous settling." },
      { jsonPath: "queue.doubleClickProtection", label: "Prevent Double-Click", type: "bool", uniform: "", td: "Par DoubleClickProtect", description: "Ignore accidental rapid double presses." },
      { jsonPath: "queue.doubleClickInterval", label: "Double-Click Interval", type: "float", min: 0, max: 1, uniform: "", td: "Par DoubleClickInterval", description: "Protection window in seconds." },
    ],
  },
  {
    id: "debug",
    title: "Debugging",
    params: [
      { jsonPath: "debug.monochrome", label: "Monochrome Identity Test", type: "bool", uniform: "uDebugMonochrome", td: "Par DebugMonochrome", description: "Render structural luminance only, to verify non-chromatic identity." },
      { jsonPath: "debug.showBoundaries", label: "Show Boundary Positions", type: "bool", uniform: "uDebugBoundaries", td: "Par DebugBoundaries", description: "Overlay stratum boundary positions.", future: true },
      { jsonPath: "debug.showIndices", label: "Show Stratum Indices", type: "bool", uniform: "", td: "Par DebugIndices", description: "Overlay stratum index numbers.", future: true },
      { jsonPath: "debug.showCascadeField", label: "Show Active Cascade Field", type: "bool", uniform: "uDebugCascade", td: "Par DebugCascade", description: "Visualise the cascade influence field.", future: true },
      { jsonPath: "debug.showFrameRate", label: "Show Frame Rate", type: "bool", uniform: "", td: "Par DebugFPS", description: "Show the frame-rate readout." },
      { jsonPath: "debug.showRenderResolution", label: "Show Render Resolution", type: "bool", uniform: "", td: "Par DebugRes", description: "Show the current render resolution." },
      { jsonPath: "debug.freezeTime", label: "Freeze Time", type: "bool", uniform: "", td: "Par FreezeTime", description: "Freeze the animation clock." },
      { jsonPath: "debug.displaySeeds", label: "Display Seed Values", type: "bool", uniform: "", td: "Par DisplaySeeds", description: "Show per-order seed values.", future: true },
    ],
  },
];

/** All sections in panel order: globals first, then the five beverages. */
export function allSections(): ControlSection[] {
  return [...GLOBAL_SECTIONS, ...beverageSections()];
}

/** Flatten every parameter definition (used for the TD mapping doc). */
export function allParameters(): ParameterDef[] {
  return allSections().flatMap((s) => s.params);
}
