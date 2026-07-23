// -----------------------------------------------------------------------------
// params.glsl — per-beverage parameter + palette uniforms, indexed by beverage.
//
// In the browser all five beverages render in one fragment shader, so their
// parameters are arrays indexed by beverage id (0..4). In TouchDesigner each
// beverage becomes its own GLSL TOP and these arrays collapse to the scalar
// custom parameters fed from that beverage's CHOP — the struct below is exactly
// what a single TOP would receive. Uniform names are documented in
// parameterDefinitions.ts / TD_PORTING.md.
// -----------------------------------------------------------------------------
#ifndef CORE_PARAMS_GLSL
#define CORE_PARAMS_GLSL

#define BEV_COUNT 5

struct BeverageParams {
  float restingSpeed, restingAmplitude, patternScale, gradientScale, gradientDirection;
  float noiseScale, noiseStrength, domainWarp, pulseAmount, pulseSpeed, luminanceDrift, edgeActivity;
  float luminance, density, edgeSoftness, internalContrast, distortion, horizontalBias, verticalBias;
  float activeDuration, activeBrightness, activeDisplacement, activeSpread, settlingSpeed;
};

struct BeverageColors {
  vec3 primary, secondary, highlight, shadow;
};

// Rest parameters.
uniform float uRestingSpeed[BEV_COUNT];
uniform float uRestingAmplitude[BEV_COUNT];
uniform float uPatternScale[BEV_COUNT];
uniform float uGradientScale[BEV_COUNT];
uniform float uGradientDirection[BEV_COUNT];
uniform float uNoiseScale[BEV_COUNT];
uniform float uNoiseStrength[BEV_COUNT];
uniform float uDomainWarp[BEV_COUNT];
uniform float uPulseAmount[BEV_COUNT];
uniform float uPulseSpeed[BEV_COUNT];
uniform float uLuminanceDrift[BEV_COUNT];
uniform float uEdgeActivity[BEV_COUNT];

// Style parameters.
uniform float uLuminance[BEV_COUNT];
uniform float uDensity[BEV_COUNT];
uniform float uEdgeSoftness[BEV_COUNT];
uniform float uInternalContrast[BEV_COUNT];
uniform float uDistortion[BEV_COUNT];
uniform float uHorizontalBias[BEV_COUNT];
uniform float uVerticalBias[BEV_COUNT];

// Active parameters (consumed by the cascade in Phase 5).
uniform float uActiveDuration[BEV_COUNT];
uniform float uActiveBrightness[BEV_COUNT];
uniform float uActiveDisplacement[BEV_COUNT];
uniform float uActiveSpread[BEV_COUNT];
uniform float uSettlingSpeed[BEV_COUNT];

// Palette.
uniform vec3 uBevPrimary[BEV_COUNT];
uniform vec3 uBevSecondary[BEV_COUNT];
uniform vec3 uBevHighlight[BEV_COUNT];
uniform vec3 uBevShadow[BEV_COUNT];

BeverageParams fetchParams(int t) {
  int i = clamp(t, 0, BEV_COUNT - 1);
  BeverageParams p;
  p.restingSpeed = uRestingSpeed[i];
  p.restingAmplitude = uRestingAmplitude[i];
  p.patternScale = uPatternScale[i];
  p.gradientScale = uGradientScale[i];
  p.gradientDirection = uGradientDirection[i];
  p.noiseScale = uNoiseScale[i];
  p.noiseStrength = uNoiseStrength[i];
  p.domainWarp = uDomainWarp[i];
  p.pulseAmount = uPulseAmount[i];
  p.pulseSpeed = uPulseSpeed[i];
  p.luminanceDrift = uLuminanceDrift[i];
  p.edgeActivity = uEdgeActivity[i];
  p.luminance = uLuminance[i];
  p.density = uDensity[i];
  p.edgeSoftness = uEdgeSoftness[i];
  p.internalContrast = uInternalContrast[i];
  p.distortion = uDistortion[i];
  p.horizontalBias = uHorizontalBias[i];
  p.verticalBias = uVerticalBias[i];
  p.activeDuration = uActiveDuration[i];
  p.activeBrightness = uActiveBrightness[i];
  p.activeDisplacement = uActiveDisplacement[i];
  p.activeSpread = uActiveSpread[i];
  p.settlingSpeed = uSettlingSpeed[i];
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
