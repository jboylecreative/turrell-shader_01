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

  // Aspect-corrected, centred coords so features stay round (not stretched).
  vec2 co = vec2((uv.x - 0.5) * uAspect, ly - 0.5) * (p.noiseScale * 0.7 + 1.2) + seed * 6.0;

  // --- Bounded swirling domain warp (organic & fluid; never a rigid scroll) ---
  // Two warp octaves, each animated by a slow circular phase (stays bounded).
  vec2 ph1 = vec2(cos(t * 0.23), sin(t * 0.19)) * 0.6;
  vec2 ph2 = vec2(sin(t * 0.15), cos(t * 0.27)) * 0.45;
  vec2 w1 = vec2(fbm(co + ph1), fbm(co.yx + ph1 + 4.7));
  vec2 warped = co + (w1 - 0.5) * (0.75 + turb * 0.4);
  vec2 w2 = vec2(fbm(warped * 1.9 + ph2), fbm(warped.yx * 1.9 + ph2 + 8.1));
  warped += (w2 - 0.5) * 0.35;
  // Very subtle left-right lean so there's a hint of direction under the swirl.
  warped.x -= drift * 0.18;

  float near = fbm(warped);
  float far = fbm(warped * 0.5 + 3.0);
  float depth = near - far;                          // volumetric relief

  // Gravity: compressed vertical gradient + a soft, slowly descending dark well.
  float wellY = 0.62 + 0.16 * (far - 0.5) + 0.05 * sin(t * 0.2);
  float well = 1.0 - smoothstep(0.0, 0.55, abs(ly - wellY));
  float grav = pow(clamp(ly, 0.0, 1.0), 1.3);

  float lum = mix(0.30, 0.88, grav);
  lum -= well * 0.28;
  lum += depth * (0.5 + p.internalContrast * 0.4);   // lit ridges / shadowed recesses
  lum += (near - 0.5) * p.noiseStrength * 0.35;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.3);

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
