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

// Portable core + beverage modules (each guarded against double-include).
#include "./core/visualCore.glsl"
#include "./core/params.glsl"
#include "./beverages/americano.glsl"
#include "./beverages/matcha.glsl"
#include "./beverages/latte.glsl"
#include "./beverages/espresso.glsl"
#include "./beverages/coldBrew.glsl"

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uBackgroundLuminance;
uniform float uBoundarySoftness;

// Fixed-size strata arrays (compile-time max, mirrors MAX_STRATA_PLUS_EXIT = 21).
const int MAX_STRATA = 21;

uniform int   uStrataCount;
uniform int   uStrataType[MAX_STRATA];
uniform float uStrataSeed[MAX_STRATA];
uniform float uStrataAge[MAX_STRATA];
uniform float uStrataTop[MAX_STRATA];
uniform float uStrataBottom[MAX_STRATA];
uniform float uStrataActivation[MAX_STRATA];

// Dispatch to the correct beverage identity function.
BeverageSample evaluateBeverage(int t, vec2 uv, float ly, float bandH, float age, float seed) {
  BeverageParams p = fetchParams(t);
  BeverageColors c = fetchColors(t);
  if (t == 0) return evaluateAmericano(uv, ly, bandH, age, seed, p, c);
  if (t == 1) return evaluateMatcha(uv, ly, bandH, age, seed, p, c);
  if (t == 2) return evaluateLatte(uv, ly, bandH, age, seed, p, c);
  if (t == 3) return evaluateEspresso(uv, ly, bandH, age, seed, p, c);
  return evaluateColdBrew(uv, ly, bandH, age, seed, p, c);
}

void main() {
  float y = vUv.y;
  float soft = max(uBoundarySoftness, 0.002);

  vec3 acc = vec3(0.0);
  float wsum = 0.0;

  for (int i = 0; i < MAX_STRATA; i++) {
    if (i >= uStrataCount) break;
    float top = uStrataTop[i];
    float bot = uStrataBottom[i];
    float bandH = max(bot - top, 0.001);

    // Soft membership: inside the band with feathered edges.
    float w = smoothstep(top - soft, top + soft, y) *
              (1.0 - smoothstep(bot - soft, bot + soft, y));
    if (w <= 0.0001) continue;

    float ly = clamp((y - top) / bandH, 0.0, 1.0);
    BeverageSample s = evaluateBeverage(
      uStrataType[i], vUv, ly, bandH, uStrataAge[i], uStrataSeed[i]);

    acc += s.color * w;
    wsum += w;
  }

  vec3 bg = vec3(uBackgroundLuminance);
  vec3 color = wsum > 0.0 ? acc / wsum : bg;
  color = mix(bg, color, clamp(wsum, 0.0, 1.0));

  fragColor = vec4(color, 1.0);
}
