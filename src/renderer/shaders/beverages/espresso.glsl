// -----------------------------------------------------------------------------
// espresso.glsl — compact, HIGH-CONTRAST, CONCENTRATED field with a faster
// internal pulse, sharper internal transitions, smaller perceived scale, and
// soft outer boundaries. Monochrome identity: a dense, small-scale, high-
// contrast texture with a bright concentrated core that pulses.
// -----------------------------------------------------------------------------
#ifndef BEV_ESPRESSO_GLSL
#define BEV_ESPRESSO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"
#include "../core/easing.glsl"

BeverageSample evaluateEspresso(vec2 uv, float ly, float bandH, float age, float seed, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  // Fast internal pulse.
  float pulse = 0.5 + 0.5 * sin(t * (1.0 + p.pulseSpeed * 3.0) + seed * 6.2831) * (0.3 + p.pulseAmount * 3.0);

  vec2 q = vec2((uv.x - 0.5) * 0.9, ly - 0.5);

  // Small-scale, high-contrast internal structure with sharp transitions.
  float n = fbm(q * (p.noiseScale * 2.4 + 2.0) + seed * 4.0 - t * 0.15);
  float sharp = smoothstep(0.46, 0.54, n);          // sharp internal edges
  sharp = mix(n, sharp, clamp(p.internalContrast, 0.0, 1.5));

  // Concentrated core.
  float core = radialFalloff(q, vec2(0.0), 0.42) * pulse;

  float lum = mix(0.12, 1.0, sharp);
  lum += core * 0.45;
  lum = clamp(lum * (0.6 + p.luminance * 0.6), 0.0, 1.4);

  vec3 col = mix(c.shadow, c.primary, sharp);
  col = mix(col, c.secondary, core * 0.55);
  col = mix(col, c.highlight, core * pulse * 0.7);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = clamp(p.density * 1.15, 0.0, 1.0);
  s.displacement = q * core * 0.04 * p.restingAmplitude; // concentrated push
  s.edgeInfluence = p.edgeActivity * 1.0;
  return s;
}

#endif
