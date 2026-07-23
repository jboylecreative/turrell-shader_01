// -----------------------------------------------------------------------------
// coldBrew.glsl — deep brown / slate / violet-black with SLOW LAMINAR VERTICAL
// RIBBONS and directional downward flow, cool metallic highlights, long slow
// drift. Monochrome identity: vertical flowing ribbons/currents — unmistakably
// directional, unlike the gradient, bloom, veil, or concentrated fields.
// -----------------------------------------------------------------------------
#ifndef BEV_COLDBREW_GLSL
#define BEV_COLDBREW_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateColdBrew(vec2 uv, float ly, float bandH, float age, float seed, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  vec2 q = vec2(uv.x * uAspect, ly);

  // Downward laminar flow bends the ribbons over time.
  float flow = t * 0.2 + seed * 5.0;
  float rib = ribbons(q, p.patternScale * 2.4 + 1.0, p.domainWarp * 1.4, flow);

  // Slow vertical drift of a secondary current.
  float drift = fbm(vec2(q.x * p.noiseScale, ly * 2.0 - t * 0.15 + seed * 2.0));

  float lum = mix(0.22, 0.72, rib);
  lum += (drift - 0.5) * p.noiseStrength * 0.5;
  lum += (drift - 0.5) * p.luminanceDrift * 0.3;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.2);

  vec3 col = mix(c.shadow, c.primary, rib);
  col = mix(col, c.secondary, drift * 0.35);
  col = mix(col, c.highlight, smoothstep(0.72, 1.0, lum) * 0.5); // cool metallic glints

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density;
  s.displacement = vec2(0.0, 0.03 * p.restingAmplitude); // descending current
  s.edgeInfluence = p.edgeActivity * 0.8;
  return s;
}

#endif
