// -----------------------------------------------------------------------------
// coldBrew.glsl — deep brown / slate / violet-black with cool metallic glints.
// MOTION LANGUAGE: DESCENDS — slow laminar vertical currents flowing downward,
// beneath a subtle horizontal drift.
// DEPTH: domain-warped flow layers give the currents body and cool sheen rather
// than flat stripes.
// -----------------------------------------------------------------------------
#ifndef BEV_COLDBREW_GLSL
#define BEV_COLDBREW_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"

BeverageSample evaluateColdBrew(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;
  float warp = 0.4 + turb * 0.9 + p.domainWarp * 0.6;

  vec2 base = vec2(uv.x * uAspect, ly);
  // Advection: subtle horizontal drift + DOWNWARD current (texture moves down).
  vec2 co = base * (p.noiseScale + 1.0) + seed * 5.0 + vec2(-drift * 0.7, t * 0.16);

  float far = flowFbm(co * 0.6, warp, t);
  float near = flowFbm(co, warp, t + 4.0);
  float depth = near - far;

  // Vertical laminar ribbons flowing downward, bent by the flow for organic body.
  float rib = ribbons(vec2(base.x, base.y - t * 0.1),
                      p.patternScale * 2.2 + 1.0,
                      p.domainWarp * 1.4 + (near - 0.5) * 1.2, t);

  float lum = mix(0.2, 0.68, rib);
  lum += depth * (0.35 + p.internalContrast * 0.35);
  lum += (near - 0.5) * p.noiseStrength * 0.3;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.2);

  vec3 col = mix(c.shadow, c.primary, rib);
  col = mix(col, c.secondary, clamp(depth * 0.6 + 0.2, 0.0, 1.0));
  col = mix(col, c.highlight, smoothstep(0.72, 1.0, lum) * 0.45);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density;
  s.displacement = vec2(0.0, 0.03 * p.restingAmplitude);
  s.edgeInfluence = p.edgeActivity * 0.8;
  return s;
}

#endif
