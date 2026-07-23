// -----------------------------------------------------------------------------
// matcha.glsl — moss / vegetal green.
// MOTION LANGUAGE: BREATHES (expand/contract) and slowly SWIRLS (rotating eddies).
// DEPTH: domain-warped flow layers give a soft volumetric bloom with an organic,
// perturbed edge — not a flat disc.
// -----------------------------------------------------------------------------
#ifndef BEV_MATCHA_GLSL
#define BEV_MATCHA_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateMatcha(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;
  float warp = 0.5 + turb * 0.9 + p.domainWarp * 0.6;

  // Centre coords, then SWIRL by a slow rotation (its motion language).
  vec2 pc = vec2(uv.x - 0.5, ly - 0.5);
  pc = rot2(t * 0.12) * pc;

  vec2 co = pc * (p.noiseScale + 1.5) + seed * 7.0 + vec2(-drift * 0.6, 0.0);
  float far = flowFbm(co * 0.6, warp, t);
  float near = flowFbm(co, warp, t + 5.0);
  float depth = near - far;

  // BREATHE: bloom radius expands/contracts; the edge is perturbed by the flow.
  float breatheR = 0.34 + 0.12 * sin(t * 0.5 + seed * 6.2831) * (0.4 + p.pulseAmount * 3.0);
  float r = length(pc) * (0.85 + 0.35 * near);
  float bloom = smoothstep(breatheR, 0.0, r);

  float lum = bloom * 0.8 + depth * (0.4 + p.internalContrast * 0.35) + 0.16;
  lum = clamp(lum * (0.7 + p.luminance * 0.5), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum + 0.08, 0.0, 1.0));
  col = mix(col, c.secondary, bloom * 0.5);
  col = mix(col, c.highlight, smoothstep(0.55, 1.0, bloom + depth * 0.3) * 0.6);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density * 0.85;
  s.displacement = normalize(pc + 1e-4) * bloom * 0.03 * p.restingAmplitude;
  s.edgeInfluence = p.edgeActivity * 1.2;
  return s;
}

#endif
