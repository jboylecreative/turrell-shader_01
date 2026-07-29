// -----------------------------------------------------------------------------
// params.glsl — per-beverage Form + Motion params + palette, indexed by beverage.
//
// In the browser all five beverages render in one fragment shader, so their
// parameters are arrays indexed by beverage id (0..4). In TouchDesigner each
// beverage becomes its own GLSL TOP and these arrays collapse to the scalar
// custom parameters fed from that beverage's CHOP — the structs below are what a
// single TOP would receive. Uniform names are documented in
// parameterDefinitions.ts / TD_PORTING.md.
// -----------------------------------------------------------------------------
#ifndef CORE_PARAMS_GLSL
#define CORE_PARAMS_GLSL

#include "./form.glsl"
#include "./structures.glsl"

#define BEV_COUNT 5

// Form fields beyond the shared FormParams (form.glsl): luminance.
// Motion fields drive each beverage's animation.
struct BeverageParams {
  FormParams form;
  int structureType;
  StructureParams structure;
  float luminance;
  float glow;
  float variation;
  float turbidity;
  float parallax;
  float depthTint;
  float sheen;
  float iridescence;
  float caustics;
  float speed;
  float flowStrength;
  float flowAngle;
  float turbulence;
  float pulse;
  float pulseSpeed;
};

struct BeverageColors {
  vec3 primary, secondary, highlight, shadow;
};

// Form.
uniform float uScale[BEV_COUNT];
uniform float uSwirl[BEV_COUNT];
uniform float uComplexity[BEV_COUNT];
uniform float uRidginess[BEV_COUNT];
uniform float uStretch[BEV_COUNT];
uniform float uDefinition[BEV_COUNT];
uniform float uLuminance[BEV_COUNT];
uniform float uGlow[BEV_COUNT];
uniform float uVariation[BEV_COUNT];

// Structure.
uniform int   uStructureType[BEV_COUNT];
uniform float uStructPos[BEV_COUNT];
uniform float uStructSize[BEV_COUNT];
uniform float uStructAngle[BEV_COUNT];
uniform float uStructSharpness[BEV_COUNT];

// Depth.
uniform float uTurbidity[BEV_COUNT];
uniform float uParallax[BEV_COUNT];
uniform float uDepthTint[BEV_COUNT];

// Surface / material.
uniform float uSheen[BEV_COUNT];
uniform float uIridescence[BEV_COUNT];
uniform float uCaustics[BEV_COUNT];

// Motion.
uniform float uSpeed[BEV_COUNT];
uniform float uFlowStrength[BEV_COUNT];
uniform float uFlowAngle[BEV_COUNT];
uniform float uTurbulence[BEV_COUNT];
uniform float uPulse[BEV_COUNT];
uniform float uPulseSpeed[BEV_COUNT];

// Palette.
uniform vec3 uBevPrimary[BEV_COUNT];
uniform vec3 uBevSecondary[BEV_COUNT];
uniform vec3 uBevHighlight[BEV_COUNT];
uniform vec3 uBevShadow[BEV_COUNT];

BeverageParams fetchParams(int t) {
  int i = clamp(t, 0, BEV_COUNT - 1);
  BeverageParams p;
  p.form.scale = uScale[i];
  p.form.swirl = uSwirl[i];
  p.form.complexity = uComplexity[i];
  p.form.ridginess = uRidginess[i];
  p.form.stretch = uStretch[i];
  p.form.definition = uDefinition[i];
  p.structureType = uStructureType[i];
  p.structure.pos = uStructPos[i];
  p.structure.size = uStructSize[i];
  p.structure.angle = uStructAngle[i];
  p.structure.sharpness = uStructSharpness[i];
  p.luminance = uLuminance[i];
  p.glow = uGlow[i];
  p.variation = uVariation[i];
  p.turbidity = uTurbidity[i];
  p.parallax = uParallax[i];
  p.depthTint = uDepthTint[i];
  p.sheen = uSheen[i];
  p.iridescence = uIridescence[i];
  p.caustics = uCaustics[i];
  p.speed = uSpeed[i];
  p.flowStrength = uFlowStrength[i];
  p.flowAngle = uFlowAngle[i];
  p.turbulence = uTurbulence[i];
  p.pulse = uPulse[i];
  p.pulseSpeed = uPulseSpeed[i];
  return p;
}

BeverageColors fetchColors(int t) {
  int i = clamp(t, 0, BEV_COUNT - 1);
  BeverageColors c;
  c.primary = uBevPrimary[i];
  c.secondary = uBevSecondary[i];
  c.highlight = uBevHighlight[i];
  c.shadow = uBevShadow[i];
  return c;
}

#endif
