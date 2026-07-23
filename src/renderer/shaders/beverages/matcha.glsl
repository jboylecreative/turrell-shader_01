// -----------------------------------------------------------------------------
// matcha.glsl — vegetal green.
// STRUCTURE: soft radial bloom masked over the shared form field.
// MOTION: breathes (expand/contract) and swirls in place; weak flow.
// -----------------------------------------------------------------------------
#ifndef BEV_MATCHA_GLSL
#define BEV_MATCHA_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateMatcha(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  p.form.swirl += turb * 0.6;

  // Screen-proportional vertical so short bands show a slice, not a squish.
  vec2 pc = vec2((uv.x - 0.5) * uAspect, (ly - 0.5) * bandH);
  vec2 flow = vec2(-drift * p.flowStrength, 0.0);
  float relief, below;
  float v = depthField(pc + seed * 4.0, p.form, flow, st * (0.5 + p.turbulence),
                       p.turbidity, p.parallax, p.depthTint, relief, below);

  // Breathing bloom; the form field perturbs its radius for an organic edge.
  float breatheR = 0.36 + 0.14 * sin(st * p.pulseSpeed + seed * 6.2831) * (0.3 + p.pulse * 3.0);
  float r = length(pc) * (0.75 + 0.5 * v);
  float bloom = smoothstep(breatheR, 0.0, r);

  float lum = bloom * 0.8 + relief * 0.45 + v * 0.12 + 0.12;
  lum = clamp(lum * (0.7 + p.luminance * 0.5), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum + 0.08, 0.0, 1.0));
  col = mix(col, c.secondary, bloom * 0.5);
  col = mix(col, c.highlight, smoothstep(0.55, 1.0, bloom + relief * 0.3) * 0.6);
  col = mix(col, c.shadow, below * 0.3);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = 0.55;
  s.displacement = vec2(0.0);
  s.edgeInfluence = 1.1;
  return s;
}

#endif
