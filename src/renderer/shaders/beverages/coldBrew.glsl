// -----------------------------------------------------------------------------
// coldBrew.glsl — deep brown / slate / violet-black.
// STRUCTURE: vertical laminar currents (stretch defaults vertical) over the form
// field, with cool metallic glints.
// MOTION: descends (downward flow) beneath a subtle sideways drift.
// -----------------------------------------------------------------------------
#ifndef BEV_COLDBREW_GLSL
#define BEV_COLDBREW_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"

BeverageSample evaluateColdBrew(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  p.form.swirl += turb * 0.5;

  vec2 pos = vec2((uv.x - 0.5) * uAspect, ly - 0.5) + seed * 3.0;
  // Subtle sideways drift + a downward current (its motion language).
  vec2 flow = vec2(-drift * p.flowStrength, st * 0.35);
  float depth;
  float v = formField(pos, p.form, flow, st * (0.5 + p.turbulence), depth);

  float lum = mix(0.2, 0.62, v) + depth * 0.4;
  lum = clamp(lum * (0.68 + p.luminance * 0.5), 0.0, 1.2);

  vec3 col = mix(c.shadow, c.primary, clamp(v, 0.0, 1.0));
  col = mix(col, c.secondary, clamp(depth * 0.7 + 0.2, 0.0, 1.0));
  col = mix(col, c.highlight, smoothstep(0.72, 1.0, lum) * 0.45); // cool glints

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = 0.7;
  s.displacement = vec2(0.0);
  s.edgeInfluence = 0.8;
  return s;
}

#endif
