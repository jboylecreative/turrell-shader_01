// -----------------------------------------------------------------------------
// espresso.glsl — concentrated copper / burnt orange.
// STRUCTURE: high-contrast, veined form field with a concentrated core.
// MOTION: throbs in place (breathes between dim and bright, never fully off);
// little travel.
// -----------------------------------------------------------------------------
#ifndef BEV_ESPRESSO_GLSL
#define BEV_ESPRESSO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateEspresso(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  p.form.swirl += turb * 0.6;

  // Throb kept above a floor so the field dims but never disappears.
  float pulseWave = 0.5 + 0.5 * sin(st * (1.0 + p.pulseSpeed * 3.0) + seed * 6.2831);
  float pulseVis = mix(0.4, 1.0, mix(0.5, pulseWave, p.pulse * 2.0));

  // Screen-proportional vertical so short bands show a slice, not a squish.
  vec2 pc = vec2((uv.x - 0.5) * uAspect, (ly - 0.5) * bandH);
  vec2 flow = vec2(-drift * p.flowStrength, 0.0);
  float depth;
  float v = formField(pc + seed * 4.0, p.form, flow, st * (0.5 + p.turbulence), depth);

  float core = radialFalloff(pc, vec2(0.0), 0.46);

  float lum = mix(0.14, 0.92, v) + depth * 0.4 + core * 0.4 * pulseVis;
  lum *= (0.7 + 0.3 * pulseVis);
  lum = clamp(lum * (0.7 + p.luminance * 0.5), 0.0, 1.4);

  vec3 col = mix(c.shadow, c.primary, clamp(v, 0.0, 1.0));
  col = mix(col, c.secondary, core * 0.5);
  col = mix(col, c.highlight, core * pulseVis * 0.6 + smoothstep(0.72, 1.05, lum) * 0.2);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = 0.9;
  s.displacement = vec2(0.0);
  s.edgeInfluence = 1.0;
  return s;
}

#endif
