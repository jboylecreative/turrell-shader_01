// -----------------------------------------------------------------------------
// americano.glsl — dense amber/brown/near-black field with LOW-FREQUENCY
// VERTICAL GRAVITY and a darker descending interior well. Compressed gradient,
// slow downward settling. Monochrome identity: a top→bottom gradient pierced by
// a drifting dark horizontal well.
// -----------------------------------------------------------------------------
#ifndef BEV_AMERICANO_GLSL
#define BEV_AMERICANO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

float breatheAmericano(float t) { return 0.5 + 0.5 * sin(t * 0.4); }

BeverageSample evaluateAmericano(vec2 uv, float ly, float bandH, float age, float seed, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  // A dark interior well that slowly descends and drifts per order.
  float wellY = 0.55 + 0.12 * sin(t * 0.5 + seed * 6.2831) * p.restingAmplitude * 3.0;
  float well = 1.0 - smoothstep(0.0, 0.42, abs(ly - wellY));

  // Low-frequency vertical structure, compressed toward the bottom.
  float n = fbm(vec2(uv.x * p.noiseScale * 0.5 + seed * 10.0, ly * p.patternScale * 2.0 - t * 0.18));
  float grav = pow(clamp(ly, 0.0, 1.0), mix(1.4, 0.7, p.gradientScale * 0.3)); // compressed gradient

  float lum = mix(0.30, 0.92, grav);
  lum -= well * 0.4;                         // descending depth / interior well
  lum += (n - 0.5) * p.noiseStrength * 0.7;
  lum += (breatheAmericano(t) - 0.5) * p.luminanceDrift * 0.4;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, lum);
  col = mix(col, c.secondary, well * 0.35);
  col = mix(col, c.highlight, smoothstep(0.75, 1.15, lum) * 0.5);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density;
  s.displacement = vec2(0.0, -0.02 * p.restingAmplitude); // slow downward settle
  s.edgeInfluence = p.edgeActivity * 0.7;
  return s;
}

#endif
