// -----------------------------------------------------------------------------
// strata.frag.glsl — Pass 1 (Strata field) ENTRY POINT.
// NOTE: no `#version` line — Three.js (GLSL3) and TouchDesigner both prepend it.
//
// Browser pass 1  →  TouchDesigner "Strata GLSL TOP".
//
// PHASE 3 STATUS: for every stratum, dispatches to that beverage's dedicated
// evaluate<Beverage>() function (portable /beverages modules) and blends the
// results with soft membership weights. Each beverage is a structurally distinct
// field, verifiable in the monochrome debug mode. OUTPUT: LINEAR colour.
// -----------------------------------------------------------------------------
precision highp float;

// Portable core + the single generic beverage evaluator (guarded includes).
#include "./core/visualCore.glsl"
#include "./core/params.glsl"
#include "./beverages/beverage.glsl"

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uBackgroundLuminance;
uniform float uBoundarySoftness;
uniform float uHorizontalDrift; // shared left-to-right drift speed
uniform float uDriftTurbulence; // how much the drift churns/swirls
uniform int   uCompositeMode;   // 0 = Blend (average), 1 = Layered (z-space)
uniform float uLayerShadow;     // Layered: seam drop-shadow strength
uniform float uLayerShadowSize; // Layered: shadow offset/softness

// Fixed-size strata arrays (compile-time max, mirrors MAX_STRATA_PLUS_EXIT = 21).
const int MAX_STRATA = 21;

uniform int   uStrataCount;
uniform int   uStrataType[MAX_STRATA];
uniform float uStrataSeed[MAX_STRATA];
uniform float uStrataAge[MAX_STRATA];
uniform float uStrataTop[MAX_STRATA];
uniform float uStrataBottom[MAX_STRATA];
uniform float uStrataActivation[MAX_STRATA];

// Soft band membership with feathered edges.
float bandCoverage(float y, float top, float bot, float soft) {
  return smoothstep(top - soft, top + soft, y) *
         (1.0 - smoothstep(bot - soft, bot + soft, y));
}

void main() {
  float y = vUv.y;
  float soft = max(uBoundarySoftness, 0.002);

  // Shared left-to-right flow (on the flow clock, so it stays visible even when
  // the global time-scale is calm), plus turbulence amount.
  float drift = uFlowTime * uHorizontalDrift;
  float turb = uDriftTurbulence;
  vec3 bg = vec3(uBackgroundLuminance);

  // --- LAYERED (z-space): stacked translucent sheets at alternating, STABLE
  // depths (seed parity). Nearer sheets occlude farther ones (alpha-over) rather
  // than averaging, and cast a soft drop-shadow onto the far layer at the seams.
  if (uCompositeMode == 1) {
    vec3 farCol = bg; float farEm = 0.0;              // far layer over background
    vec3 nearCol = vec3(0.0); float nearA = 0.0; float nearEm = 0.0; // near, front-to-back
    float nearHere = 0.0, nearAbove = 0.0;            // for the seam shadow
    for (int i = 0; i < MAX_STRATA; i++) {
      if (i >= uStrataCount) break;
      float top = uStrataTop[i];
      float bot = uStrataBottom[i];
      float bandH = max(bot - top, 0.001);
      bool near = hash21(vec2(uStrataSeed[i], 12.3)) >= 0.5;
      if (near) {
        nearHere = max(nearHere, bandCoverage(y, top, bot, soft));
        nearAbove = max(nearAbove, bandCoverage(y - uLayerShadowSize, top, bot, soft));
      }
      float w = bandCoverage(y, top, bot, soft);
      if (w <= 0.0001) continue;
      float ly = clamp((y - top) / bandH, 0.0, 1.0);
      BeverageSample s = evaluateBeverage(
        uStrataType[i], vUv, ly, bandH, uStrataAge[i], uStrataSeed[i], drift, turb);
      float a = clamp(w, 0.0, 1.0);
      if (near) {
        nearCol += s.color * a * (1.0 - nearA);
        nearEm += s.emission * a * (1.0 - nearA);
        nearA += a * (1.0 - nearA);
      } else {
        farCol = mix(farCol, s.color, a);
        farEm = mix(farEm, s.emission, a);
      }
    }
    // A near sheet overhanging just above darkens the far layer at the seam.
    float shadow = clamp(nearAbove * (1.0 - nearHere), 0.0, 1.0) * uLayerShadow;
    farCol *= (1.0 - shadow);
    farEm *= (1.0 - shadow);
    vec3 color = farCol * (1.0 - nearA) + nearCol;
    float emission = farEm * (1.0 - nearA) + nearEm;
    fragColor = vec4(color, emission);
    return;
  }

  // --- BLEND (default): weighted average of overlapping strata.
  vec3 acc = vec3(0.0);
  float emAcc = 0.0;
  float wsum = 0.0;
  for (int i = 0; i < MAX_STRATA; i++) {
    if (i >= uStrataCount) break;
    float top = uStrataTop[i];
    float bot = uStrataBottom[i];
    float bandH = max(bot - top, 0.001);
    float w = bandCoverage(y, top, bot, soft);
    if (w <= 0.0001) continue;
    float ly = clamp((y - top) / bandH, 0.0, 1.0);
    BeverageSample s = evaluateBeverage(
      uStrataType[i], vUv, ly, bandH, uStrataAge[i], uStrataSeed[i], drift, turb);
    acc += s.color * w;
    emAcc += s.emission * w;
    wsum += w;
  }
  vec3 color = wsum > 0.0 ? acc / wsum : bg;
  float coverage = clamp(wsum, 0.0, 1.0);
  color = mix(bg, color, coverage);
  float emission = (wsum > 0.0 ? emAcc / wsum : 0.0) * coverage;

  // Emission travels to Pass 2 in the alpha channel for the bloom.
  fragColor = vec4(color, emission);
}
