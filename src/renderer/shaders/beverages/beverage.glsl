// -----------------------------------------------------------------------------
// beverage.glsl — the single, generic beverage evaluator.
//
// A beverage is now pure data: a Structure Type + params + palette. This one
// function replaces the old per-beverage shaders — it builds the flowing form
// field (with depth), applies the beverage's selected Structure Type, maps to the
// palette, and returns the sample. Distinct structural code lives per-TYPE in
// structures.glsl, selectable rather than hardcoded per beverage.
// -----------------------------------------------------------------------------
#ifndef BEV_BEVERAGE_GLSL
#define BEV_BEVERAGE_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"
#include "../core/fields.glsl"
#include "../core/structures.glsl"

// Generic palette: a luminance ramp shadow -> primary -> highlight, with the
// secondary colour as a lower-mid accent.
vec3 paletteMap(float lum, BeverageColors c) {
  float l = clamp(lum, 0.0, 1.0);
  vec3 col = l < 0.5 ? mix(c.shadow, c.primary, l * 2.0)
                     : mix(c.primary, c.highlight, (l - 0.5) * 2.0);
  col = mix(col, c.secondary, smoothstep(0.55, 0.18, l) * 0.35);
  return col;
}

BeverageSample evaluateBeverage(int bev, vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb) {
  BeverageParams p = fetchParams(bev);
  BeverageColors c = fetchColors(bev);

  float st = uTime * p.speed;
  float vrot, vlum;
  applyVariation(p.form, seed, p.variation, vrot, vlum); // distinct per order
  p.form.swirl += turb * 0.6;                            // global Drift Turbulence

  // Aspect-corrected, screen-proportional, per-order-rotated coordinates.
  vec2 base = rot2(vrot) * vec2((uv.x - 0.5) * uAspect, (ly - 0.5) * bandH);

  // Directional drift (Flow Strength x global Drift Speed, angle = Flow Direction).
  float fa = radians(p.flowAngle);
  vec2 flow = -drift * p.flowStrength * vec2(cos(fa), sin(fa));

  float relief, below;
  float v = depthField(base + seed * 3.0, p.form, flow, st * (0.5 + p.turbulence),
                       p.turbidity, p.parallax, p.depthTint, relief, below);

  // Selected structure type shapes the luminance.
  float s = applyStructure(p.structureType, uv, ly, base, v, relief,
                           st, seed, p.pulse, p.pulseSpeed, p.form.definition, p.structure);
  float lum = clamp(s * (0.72 + p.luminance * 0.5) * vlum, 0.0, 1.4);

  vec3 col = paletteMap(lum, c);
  col = mix(col, c.shadow, below * 0.35); // depths read darker/receding

  float glowE = p.glow * smoothstep(0.5, 1.05, lum);

  BeverageSample bs;
  bs.color = col;
  bs.emission = glowE;
  bs.luminance = lum;
  bs.density = 0.7;
  bs.displacement = vec2(0.0);
  bs.edgeInfluence = 0.9;
  return bs;
}

#endif
