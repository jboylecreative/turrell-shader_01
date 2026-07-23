// -----------------------------------------------------------------------------
// matcha.glsl — moss / vegetal green with a DIFFUSE RADIAL (elliptical) BLOOM,
// soft internal eddies, slight granularity, and slow expansion/contraction.
// Monochrome identity: a soft centred bloom with swirling eddies — clearly not
// a gradient or a ribbon field.
// -----------------------------------------------------------------------------
#ifndef BEV_MATCHA_GLSL
#define BEV_MATCHA_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateMatcha(vec2 uv, float ly, float bandH, float age, float seed, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  // Centre drifts gently; bloom radius breathes (slow expand/contract).
  vec2 center = vec2(0.5 + 0.08 * sin(t * 0.3 + seed * 6.28), 0.5);
  vec2 pc = vec2((uv.x - center.x) * 0.7, ly - center.y); // wide ellipse

  // Soft eddies via domain warp.
  vec2 w = domainWarp(pc * p.noiseScale + seed * 7.0, p.domainWarp * 0.5, t);
  float r = length(pc + (w - pc) * 0.18);

  float breatheR = 0.34 + 0.10 * sin(t * 0.6 + seed * 3.14) * (0.3 + p.pulseAmount * 3.0);
  float bloom = smoothstep(breatheR, 0.0, r);

  float grain = (fbm(pc * p.noiseScale * 3.2 + seed * 3.0) - 0.5) * p.noiseStrength;

  float lum = bloom * 0.85 + grain * 0.35 + 0.14;
  lum += (fbm(pc * 6.0 + t * 0.1) - 0.5) * p.internalContrast * 0.2;
  lum = clamp(lum * (0.7 + p.luminance * 0.5), 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum + 0.1, 0.0, 1.0));
  col = mix(col, c.secondary, bloom * 0.55);
  col = mix(col, c.highlight, smoothstep(0.6, 1.0, bloom) * 0.65);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density * 0.85;
  s.displacement = normalize(pc + 1e-4) * bloom * 0.03 * p.restingAmplitude; // outward spread
  s.edgeInfluence = p.edgeActivity * 1.2; // matcha bleeds into neighbours
  return s;
}

#endif
