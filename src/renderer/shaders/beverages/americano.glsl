// -----------------------------------------------------------------------------
// americano.glsl — dense amber/brown volume.
// STRUCTURE: atmospheric vertical gradient over the shared form field.
// MOTION: liquid flows left-to-right; slow in-place churn.
// -----------------------------------------------------------------------------
#ifndef BEV_AMERICANO_GLSL
#define BEV_AMERICANO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"

BeverageSample evaluateAmericano(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  p.form.swirl += turb * 0.6; // global Drift Turbulence amplifies swirl

  vec2 pos = vec2((uv.x - 0.5) * uAspect, ly - 0.5) + seed * 3.0;
  vec2 flow = vec2(-drift * p.flowStrength, 0.0);
  float depth;
  float v = formField(pos, p.form, flow, st * (0.5 + p.turbulence), depth);

  // Atmospheric gradient (ly=0 is band top): brighter amber up top, dark below.
  float grav = smoothstep(1.25, -0.15, ly);
  float lum = mix(0.16, 0.56, grav) + (v - 0.45) * (0.7 + p.form.definition * 0.3) + depth * 0.35;
  lum = clamp(lum * (0.7 + p.luminance * 0.5), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum, 0.0, 1.0));
  col = mix(col, c.secondary, smoothstep(0.2, 0.0, lum) * 0.4);
  col = mix(col, c.highlight, smoothstep(0.72, 1.1, lum) * 0.4);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = 0.7;
  s.displacement = vec2(0.0, 0.0);
  s.edgeInfluence = 0.6;
  return s;
}

#endif
