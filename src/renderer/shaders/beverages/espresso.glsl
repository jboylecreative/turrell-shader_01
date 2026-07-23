// -----------------------------------------------------------------------------
// espresso.glsl — compact copper / burnt-orange, high-contrast, concentrated.
// MOTION LANGUAGE: THROBS IN PLACE — a concentrated pulse that breathes between
// dim and bright but NEVER fully vanishes (low-level floor), with little travel.
// DEPTH: domain-warped flow gives the concentrated core internal volume.
// -----------------------------------------------------------------------------
#ifndef BEV_ESPRESSO_GLSL
#define BEV_ESPRESSO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateEspresso(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;
  float warp = 0.5 + turb * 1.0 + p.domainWarp * 0.5;

  // Throb: pulse wave kept above a floor so the field dims but never disappears.
  float pulseWave = 0.5 + 0.5 * sin(t * (1.0 + p.pulseSpeed * 3.0) + seed * 6.2831);
  float pulseVis = mix(0.4, 1.0, pulseWave); // 40%..100% visibility

  vec2 q = vec2(uv.x - 0.5, ly - 0.5);
  vec2 co = q * (p.noiseScale * 1.7 + 2.0) * (0.9 + 0.14 * pulseWave) + seed * 4.0 + vec2(-drift * 0.3, 0.0);

  float far = flowFbm(co * 0.6, warp, t);
  float near = flowFbm(co, warp, t + 1.5);
  float depth = near - far;

  float core = radialFalloff(q, vec2(0.0), 0.44);

  float lum = mix(0.16, 0.95, near);                 // high-contrast structure
  lum += depth * (0.4 + p.internalContrast * 0.5);   // volumetric relief
  lum += core * 0.45 * pulseVis;                     // concentrated throb (floored)
  lum *= (0.7 + 0.3 * pulseVis);                     // whole field dims, never off
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.4);

  vec3 col = mix(c.shadow, c.primary, clamp(near, 0.0, 1.0));
  col = mix(col, c.secondary, core * 0.5);
  col = mix(col, c.highlight, core * pulseVis * 0.6 + smoothstep(0.72, 1.05, lum) * 0.2);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = clamp(p.density * 1.15, 0.0, 1.0);
  s.displacement = q * core * 0.04 * p.restingAmplitude;
  s.edgeInfluence = p.edgeActivity;
  return s;
}

#endif
