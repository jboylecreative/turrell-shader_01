// -----------------------------------------------------------------------------
// latte.glsl — cream / warm-white.
// STRUCTURE: broad luminous horizontal veil with a suspended light shelf over
// the (smooth, low-definition) form field.
// MOTION: slides sideways strongly; very smooth.
// -----------------------------------------------------------------------------
#ifndef BEV_LATTE_GLSL
#define BEV_LATTE_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"
#include "../core/easing.glsl"

BeverageSample evaluateLatte(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  p.form.swirl += turb * 0.4;

  vec2 pos = vec2((uv.x - 0.5) * uAspect, ly - 0.5) + seed * 3.0;
  vec2 flow = vec2(-drift * p.flowStrength, 0.0);
  float depth;
  float v = formField(pos, p.form, flow, st * (0.5 + p.turbulence), depth);

  // Suspended luminous shelf hovering vertically.
  float shelfY = 0.45 + 0.08 * sin(st * 0.5 + seed * 6.2831);
  float shelf = smoothPulse(ly, shelfY, 0.32);

  float lum = 0.7 + shelf * 0.2 + (v - 0.5) * (0.4 + p.form.definition * 0.3) + depth * 0.25;
  lum = clamp(lum * (0.78 + p.luminance * 0.4), 0.0, 1.4);

  vec3 col = mix(c.secondary, c.highlight, smoothstep(0.45, 1.05, lum));
  col = mix(col, c.primary, (1.0 - shelf) * 0.22);
  col = mix(col, c.shadow, smoothstep(0.32, 0.0, lum) * 0.4);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = 0.4;
  s.displacement = vec2(0.0);
  s.edgeInfluence = 0.9;
  return s;
}

#endif
