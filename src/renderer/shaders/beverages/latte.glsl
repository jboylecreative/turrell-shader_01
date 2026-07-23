// -----------------------------------------------------------------------------
// latte.glsl — cream / warm-white / sand with a BROAD HORIZONTAL VEIL and a soft
// luminous suspended shelf. Very smooth internal movement, high diffusion, low
// contrast, high luminance. Monochrome identity: a bright, softly banded
// horizontal veil with a floating light shelf — the flattest, brightest field.
// -----------------------------------------------------------------------------
#ifndef BEV_LATTE_GLSL
#define BEV_LATTE_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/noise.glsl"
#include "../core/fields.glsl"
#include "../core/easing.glsl"

BeverageSample evaluateLatte(vec2 uv, float ly, float bandH, float age, float seed, BeverageParams p, BeverageColors c) {
  float t = uTime * p.restingSpeed;

  // A suspended luminous shelf that hovers and drifts vertically.
  float shelfY = 0.45 + 0.10 * sin(t * 0.25 + seed * 6.28);
  float shelf = smoothPulse(ly, shelfY, 0.28 + p.edgeSoftness * 0.2);

  // Very smooth, low-frequency horizontal veil.
  float veil = fbm(vec2(uv.x * p.noiseScale * 0.35 + t * 0.05, ly * p.patternScale * 0.7));
  float veilLum = 0.72 + shelf * 0.22 + (veil - 0.5) * p.noiseStrength * 0.4;

  float lum = clamp(veilLum * (0.75 + p.luminance * 0.5), 0.0, 1.35);

  vec3 col = mix(c.secondary, c.highlight, smoothstep(0.45, 1.05, lum));
  col = mix(col, c.primary, (1.0 - shelf) * 0.25);
  col = mix(col, c.shadow, smoothstep(0.35, 0.0, lum) * 0.4);

  BeverageSample s;
  s.color = col;
  s.luminance = lum;
  s.density = p.density * 0.6;   // airy
  s.displacement = vec2(0.01 * sin(t * 0.2), 0.0) * p.restingAmplitude;
  s.edgeInfluence = p.edgeActivity * 0.9; // increases neighbour diffusion
  return s;
}

#endif
