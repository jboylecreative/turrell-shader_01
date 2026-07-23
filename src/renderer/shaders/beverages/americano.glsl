// -----------------------------------------------------------------------------
// americano.glsl — dense amber/brown/near-black field.
// MOTION LANGUAGE: slowly SINKS (downward settling) beneath the shared drift.
// DEPTH: two domain-warped flow layers (near/far) give volumetric relief plus a
// descending dark interior well. Fluid, organic — no hard bands.
// -----------------------------------------------------------------------------
#ifndef BEV_AMERICANO_GLSL
#define BEV_AMERICANO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateAmericano(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;
  float warp = 0.35 + turb * 0.9 + p.domainWarp * 0.4;

  // Advection: shared horizontal drift + slow DOWNWARD sink.
  vec2 adv = vec2(-drift, t * 0.18 * (0.5 + p.restingAmplitude));
  vec2 co = vec2(uv.x, ly) * (p.noiseScale * 0.55 + 1.0) + seed * 10.0 + adv;

  float far = flowFbm(co * 0.55, warp, t);        // recessed background volume
  float near = flowFbm(co, warp, t + 3.1);        // foreground detail
  float depth = near - far;                        // relief → dimensionality

  // Compressed vertical gravity gradient + a dark interior well that wanders.
  float wellY = 0.6 + 0.14 * (far - 0.5) * 2.0;
  float well = 1.0 - smoothstep(0.0, 0.5, abs(ly - wellY));
  float grav = pow(clamp(ly, 0.0, 1.0), 1.25);

  float lum = mix(0.28, 0.9, grav);
  lum -= well * 0.32;
  lum += depth * (0.4 + p.internalContrast * 0.45); // lit ridges / shadowed recesses
  lum += (near - 0.5) * p.noiseStrength * 0.4;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum, 0.0, 1.0));
  col = mix(col, c.secondary, well * 0.3);
  col = mix(col, c.highlight, smoothstep(0.72, 1.15, lum) * 0.45);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density;
  s.displacement = vec2(0.0, -0.02 * p.restingAmplitude);
  s.edgeInfluence = p.edgeActivity * 0.7;
  return s;
}

#endif
