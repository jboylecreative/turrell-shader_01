// -----------------------------------------------------------------------------
// americano.glsl — dense amber/brown/near-black field.
// MOTION LANGUAGE: slow, organic SWIRLING with a subtle downward/left-right lean
// (settling). NOT a rigid scroll.
// TECHNIQUE: the domain warp is animated by a BOUNDED circular (Lissajous) phase
// so the field churns and loops fluidly forever without translating rigidly or
// drifting into floating-point precision artifacts. Warp is kept moderate so
// there are no hard folds/edges. Coords are aspect-corrected → round, organic.
// DEPTH: near/far fbm layers give volumetric relief; a soft descending well.
// -----------------------------------------------------------------------------
#ifndef BEV_AMERICANO_GLSL
#define BEV_AMERICANO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateAmericano(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  // Aspect-corrected, centred coords. LOW base frequency so large bold masses
  // dominate; fine detail comes from the fbm octaves on top.
  vec2 co = vec2((uv.x - 0.5) * uAspect, ly - 0.5) * (p.noiseScale * 0.28 + 0.3) + seed * 6.0;

  // LEFT-TO-RIGHT liquid flow — the dominant motion. `drift` is on the flow clock
  // so it reads even when the global time-scale is calm.
  co.x -= drift;

  // --- Swirling domain warp that mostly TRAVELS WITH the flow ---
  // Slow, small in-place phase so the swirls flow along rather than boiling in
  // place. Horizontally biased so it swirls without raking vertical wisps.
  vec2 ph1 = vec2(cos(t * 0.15), sin(t * 0.12)) * 0.35;
  vec2 ph2 = vec2(sin(t * 0.10), cos(t * 0.14)) * 0.25;
  vec2 w1 = vec2(fbm(co + ph1), fbm(co.yx + ph1 + 4.7)) - 0.5;
  vec2 warped = co + w1 * vec2(1.15, 0.75) * (0.9 + turb * 0.7); // horiz-biased swirl
  vec2 w2 = vec2(fbm(warped * 2.2 + ph2), fbm(warped.yx * 2.2 + ph2 + 8.1)) - 0.5;
  warped += w2 * vec2(0.55, 0.32) * (0.6 + turb * 0.5);

  float near = fbm(warped);
  float far = fbm(warped * 0.5 + 3.0);
  float depth = near - far;                          // volumetric relief

  // Atmospheric gradient: lighter amber toward the top (light from above)
  // sinking into dark depths below (ly=1 is screen-top). Soft, so the warp does
  // not carve vertical wisps at any shoreline.
  float grav = smoothstep(-0.1, 1.2, ly);
  float wellY = 0.5 + 0.14 * (far - 0.5) + 0.05 * sin(t * 0.2);
  float well = 1.0 - smoothstep(0.0, 0.6, abs(ly - wellY));

  float lum = mix(0.16, 0.6, grav);
  lum -= well * 0.14;                                 // soft descending recess
  lum += depth * (0.65 + p.internalContrast * 0.4);  // lit ridges / shadowed recesses
  lum += (near - 0.5) * p.noiseStrength * 0.3;
  lum = clamp(lum * (0.74 + p.luminance * 0.5), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum, 0.0, 1.0));
  col = mix(col, c.secondary, well * 0.28);
  col = mix(col, c.highlight, smoothstep(0.72, 1.12, lum) * 0.4);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density;
  s.displacement = vec2(0.0, -0.02 * p.restingAmplitude);
  s.edgeInfluence = p.edgeActivity * 0.7;
  return s;
}

#endif
