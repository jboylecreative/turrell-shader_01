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
}

export interface ControlSection {
  id: string;
  title: string;
  /** Sections start collapsed unless flagged open. */
  open?: boolean;
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
}

const BEV_COLOR_TEMPLATES: BevParamTemplate[] = [
  { key: "colors.primary", label: "Primary", type: "color", uniformSuffix: "ColorPrimary", td: "Custom RGBA par {Bev}Primary", description: "Primary field colour (sRGB)." },
  { key: "colors.secondary", label: "Secondary", type: "color", uniformSuffix: "ColorSecondary", td: "Custom RGBA par {Bev}Secondary", description: "Secondary field colour (sRGB)." },
  { key: "colors.highlight", label: "Highlight", type: "color", uniformSuffix: "ColorHighlight", td: "Custom RGBA par {Bev}Highlight", description: "Luminous highlight colour (sRGB)." },
  { key: "colors.shadow", label: "Shadow", type: "color", uniformSuffix: "ColorShadow", td: "Custom RGBA par {Bev}Shadow", description: "Deep shadow colour (sRGB)." },
];

const BEV_REST_TEMPLATES: BevParamTemplate[] = [
  { key: "rest.restingSpeed", label: "Resting Speed", type: "float", min: 0, max: 2, uniformSuffix: "RestingSpeed", td: "CHOP {Bev}RestingSpeed", description: "Speed of the idle resting animation." },
  { key: "rest.restingAmplitude", label: "Resting Amplitude", type: "float", min: 0, max: 1, uniformSuffix: "RestingAmplitude", td: "CHOP {Bev}RestingAmplitude", description: "Magnitude of resting motion." },
  { key: "rest.patternScale", label: "Pattern Scale", type: "float", min: 0.2, max: 6, uniformSuffix: "PatternScale", td: "CHOP {Bev}PatternScale", description: "Scale of the internal pattern structure." },
  { key: "rest.gradientScale", label: "Gradient Scale", type: "float", min: 0.2, max: 4, uniformSuffix: "GradientScale", td: "CHOP {Bev}GradientScale", description: "Scale of the vertical/directional gradient." },
  { key: "rest.gradientDirection", label: "Gradient Direction", type: "float", min: 0, max: 360, uniformSuffix: "GradientDirection", td: "CHOP {Bev}GradientDirection", description: "Gradient direction in degrees." },
  { key: "rest.noiseScale", label: "Noise Scale", type: "float", min: 0.2, max: 8, uniformSuffix: "NoiseScale", td: "CHOP {Bev}NoiseScale", description: "Spatial frequency of the noise field." },
  { key: "rest.noiseStrength", label: "Noise Strength", type: "float", min: 0, max: 1, uniformSuffix: "NoiseStrength", td: "CHOP {Bev}NoiseStrength", description: "Contribution of noise to the field." },
  { key: "rest.domainWarp", label: "Domain Warp", type: "float", min: 0, max: 1, uniformSuffix: "DomainWarp", td: "CHOP {Bev}DomainWarp", description: "Amount of domain-warp distortion." },
  { key: "rest.pulseAmount", label: "Pulse Amount", type: "float", min: 0, max: 1, uniformSuffix: "PulseAmount", td: "CHOP {Bev}PulseAmount", description: "Depth of the slow breathing pulse." },
  { key: "rest.pulseSpeed", label: "Pulse Speed", type: "float", min: 0, max: 2, uniformSuffix: "PulseSpeed", td: "CHOP {Bev}PulseSpeed", description: "Rate of the breathing pulse." },
  { key: "rest.luminanceDrift", label: "Luminance Drift", type: "float", min: 0, max: 1, uniformSuffix: "LuminanceDrift", td: "CHOP {Bev}LuminanceDrift", description: "Slow drift of brightness over time." },
  { key: "rest.edgeActivity", label: "Edge Activity", type: "float", min: 0, max: 1, uniformSuffix: "EdgeActivity", td: "CHOP {Bev}EdgeActivity", description: "Liveliness of the stratum boundaries." },
];

const BEV_STYLE_TEMPLATES: BevParamTemplate[] = [
  { key: "style.luminance", label: "Luminance", type: "float", min: 0, max: 1.5, uniformSuffix: "Luminance", td: "CHOP {Bev}Luminance", description: "Overall brightness of the beverage field." },
  { key: "style.density", label: "Density", type: "float", min: 0, max: 1, uniformSuffix: "Density", td: "CHOP {Bev}Density", description: "Apparent density/opacity of the field." },
  { key: "style.edgeSoftness", label: "Edge Softness", type: "float", min: 0, max: 1, uniformSuffix: "EdgeSoftness", td: "CHOP {Bev}EdgeSoftness", description: "Softness of the outer boundaries." },
  { key: "style.internalContrast", label: "Internal Contrast", type: "float", min: 0, max: 1.5, uniformSuffix: "InternalContrast", td: "CHOP {Bev}InternalContrast", description: "Contrast of internal transitions." },
  { key: "style.distortion", label: "Distortion", type: "float", min: 0, max: 1, uniformSuffix: "Distortion", td: "CHOP {Bev}Distortion", description: "Amount of spatial distortion." },
  { key: "style.horizontalBias", label: "Horizontal Bias", type: "float", min: 0, max: 1, uniformSuffix: "HorizontalBias", td: "CHOP {Bev}HorizontalBias", description: "Bias of structure toward horizontal flow." },
  { key: "style.verticalBias", label: "Vertical Bias", type: "float", min: 0, max: 1, uniformSuffix: "VerticalBias", td: "CHOP {Bev}VerticalBias", description: "Bias of structure toward vertical flow." },
];

const BEV_ACTIVE_TEMPLATES: BevParamTemplate[] = [
  { key: "active.durationMultiplier", label: "Active Duration ×", type: "float", min: 0.25, max: 3, uniformSuffix: "ActiveDuration", td: "CHOP {Bev}ActiveDuration", description: "Multiplier on the shared active-cascade duration." },
  { key: "active.brightness", label: "Active Brightness", type: "float", min: 0, max: 1.5, uniformSuffix: "ActiveBrightness", td: "CHOP {Bev}ActiveBrightness", description: "Peak brightness during activation." },
  { key: "active.displacement", label: "Active Displacement", type: "float", min: 0, max: 1, uniformSuffix: "ActiveDisplacement", td: "CHOP {Bev}ActiveDisplacement", description: "Displacement strength during activation." },
  { key: "active.spread", label: "Active Spread", type: "float", min: 0, max: 1, uniformSuffix: "ActiveSpread", td: "CHOP {Bev}ActiveSpread", description: "How far the active effect spreads into neighbours." },
  { key: "active.settlingSpeed", label: "Settling Speed", type: "float", min: 0.1, max: 2, uniformSuffix: "SettlingSpeed", td: "CHOP {Bev}SettlingSpeed", description: "How quickly the beverage settles back to rest." },
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
    uniform: t.type === "color" ? `u${Bev}${t.uniformSuffix}` : `u${Bev}${t.uniformSuffix}`,
    td: t.td.replace("{Bev}", Bev),
    description: t.description,
  }));
}

/** Build the per-beverage control section (Section F). */
export function beverageSections(): ControlSection[] {
  return BEVERAGE_IDS.map((id) => ({
    id: `beverage-${id}`,
    title: capitalise(id),
    params: [
      ...expandBeverageParams(id, BEV_COLOR_TEMPLATES),
      ...expandBeverageParams(id, BEV_REST_TEMPLATES),
      ...expandBeverageParams(id, BEV_STYLE_TEMPLATES),
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
      { jsonPath: "global.gradientSoftness", label: "Gradient Softness", type: "float", min: 0, max: 1, uniform: "uGradientSoftness", td: "CHOP GradientSoftness", description: "Global softness of gradients." },
      { jsonPath: "global.motionAmount", label: "Global Motion Amount", type: "float", min: 0, max: 2, uniform: "uMotionAmount", td: "CHOP MotionAmount", description: "Global scale on all motion." },
      { jsonPath: "global.sharedFlowScale", label: "Shared Flow Scale", type: "float", min: 0.2, max: 5, uniform: "uSharedFlowScale", td: "CHOP SharedFlowScale", description: "Spatial scale of the shared flow field." },
      { jsonPath: "global.sharedFlowSpeed", label: "Shared Flow Speed", type: "float", min: 0, max: 2, uniform: "uSharedFlowSpeed", td: "CHOP SharedFlowSpeed", description: "Rate of the shared flow field." },
      { jsonPath: "global.sharedDisplacement", label: "Shared Displacement", type: "float", min: 0, max: 0.3, uniform: "uSharedDisplacement", td: "CHOP SharedDisplacement", description: "Pass-2 whole-image displacement amount." },
      { jsonPath: "global.grainAmount", label: "Grain Amount", type: "float", min: 0, max: 0.3, uniform: "uGrainAmount", td: "CHOP GrainAmount", description: "Fine output grain." },
      { jsonPath: "global.bloomAmount", label: "Bloom Amount", type: "float", min: 0, max: 1, uniform: "uBloomAmount", td: "CHOP BloomAmount", description: "Luminous bloom/spread amount." },
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
      { jsonPath: "strataLayout.easing", label: "Movement Easing", type: "float", min: 0, max: 1, uniform: "", td: "Par Easing", description: "Easing strength for stratum motion." },
      { jsonPath: "strataLayout.overshoot", label: "Overshoot", type: "float", min: 0, max: 0.5, uniform: "", td: "Par Overshoot", description: "Spring overshoot on settling." },
      { jsonPath: "strataLayout.settlingDamping", label: "Settling Damping", type: "float", min: 0, max: 1, uniform: "", td: "Par SettlingDamping", description: "Damping of the settling motion." },
      { jsonPath: "strataLayout.boundarySoftness", label: "Boundary Softness", type: "float", min: 0, max: 0.5, uniform: "uBoundarySoftness", td: "CHOP BoundarySoftness", description: "Softness of inter-stratum boundaries." },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
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
      { jsonPath: "debug.showBoundaries", label: "Show Boundary Positions", type: "bool", uniform: "uDebugBoundaries", td: "Par DebugBoundaries", description: "Overlay stratum boundary positions." },
      { jsonPath: "debug.showIndices", label: "Show Stratum Indices", type: "bool", uniform: "", td: "Par DebugIndices", description: "Overlay stratum index numbers." },
      { jsonPath: "debug.showCascadeField", label: "Show Active Cascade Field", type: "bool", uniform: "uDebugCascade", td: "Par DebugCascade", description: "Visualise the cascade influence field." },
      { jsonPath: "debug.showFrameRate", label: "Show Frame Rate", type: "bool", uniform: "", td: "Par DebugFPS", description: "Show the frame-rate readout." },
      { jsonPath: "debug.showRenderResolution", label: "Show Render Resolution", type: "bool", uniform: "", td: "Par DebugRes", description: "Show the current render resolution." },
      { jsonPath: "debug.freezeTime", label: "Freeze Time", type: "bool", uniform: "", td: "Par FreezeTime", description: "Freeze the animation clock." },
      { jsonPath: "debug.displaySeeds", label: "Display Seed Values", type: "bool", uniform: "", td: "Par DisplaySeeds", description: "Show per-order seed values." },
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
