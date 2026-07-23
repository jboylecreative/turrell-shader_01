// -----------------------------------------------------------------------------
// latte.glsl — cream / warm-white / sand.
// MOTION LANGUAGE: SLIDES SIDEWAYS as a smooth luminous veil (leans into the
// shared drift) with a gently hovering light shelf.
// DEPTH: soft domain-warped flow gives the veil internal thickness and a
// suspended, lit shelf rather than a flat bright bar.
// -----------------------------------------------------------------------------
#ifndef BEV_LATTE_GLSL
#define BEV_LATTE_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"
#include "../core/easing.glsl"

BeverageSample evaluateLatte(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;
  float warp = 0.25 + turb * 0.7 + p.domainWarp * 0.3; // smoother, airy

  // Strong horizontal advection = its motion language (veil slides sideways).
  vec2 adv = vec2(-drift * 1.6, 0.0);
  vec2 co = vec2(uv.x, ly) * (p.noiseScale * 0.5 + 0.8) + adv;

  float far = flowFbm(co * 0.5, warp, t * 0.7);
  float near = flowFbm(co, warp, t * 0.7 + 2.0);
  float depth = near - far;

  // Suspended luminous shelf hovering vertically.
  float shelfY = 0.45 + 0.08 * sin(t * 0.25 + seed * 6.2831);
  float shelf = smoothPulse(ly, shelfY, 0.3 + p.edgeSoftness * 0.2);

  float lum = 0.72 + shelf * 0.2 + depth * (0.28 + p.internalContrast * 0.3);
  lum += (near - 0.5) * p.noiseStrength * 0.2;
  lum = clamp(lum * (0.75 + p.luminance * 0.5), 0.0, 1.35);

  vec3 col = mix(c.secondary, c.highlight, smoothstep(0.45, 1.05, lum));
  col = mix(col, c.primary, (1.0 - shelf) * 0.22);
  col = mix(col, c.shadow, smoothstep(0.32, 0.0, lum) * 0.4);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density * 0.6;
  s.displacement = vec2(0.012 * sin(t * 0.2), 0.0) * p.restingAmplitude;
  s.edgeInfluence = p.edgeActivity * 0.9;
  return s;
}

#endif
