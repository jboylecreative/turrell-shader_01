// -----------------------------------------------------------------------------
// interaction.frag.glsl — Pass 2 (Interaction + output) ENTRY POINT.
// NOTE: no `#version` line — Three.js (GLSL3) and TouchDesigner both prepend it.
//
// Browser pass 2  →  TouchDesigner "Interaction GLSL TOP" (+ output treatment).
//
// PHASE 1 STATUS: reads the Pass-1 strata texture and applies the final output
// treatment — exposure, saturation, contrast, grain — then the SINGLE sRGB
// conversion. In Phase 4+ this also applies shared displacement, cross-stratum
// interaction, and bloom before the output treatment.
//
// INPUT: LINEAR colour from Pass 1. OUTPUT: sRGB (display-ready).
// -----------------------------------------------------------------------------
precision highp float;

#include "./core/color.glsl"

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uStrataTexture;
uniform float uTime;
uniform vec2  uResolution;

uniform float uExposure;
uniform float uSaturation;
uniform float uContrast;
uniform float uGrainAmount;
uniform float uBloomAmount;   // overall glow strength
uniform float uBloomRadius;   // glow spread
uniform bool  uDebugMonochrome;

// Cheap hash for grain (portable; matches a TD noise TOP conceptually).
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Emission-weighted bloom: gather colour * emission (alpha) around this pixel in
// a spiral kernel so the luminous, structure-following parts halo outward.
// Browser bloom pass -> TouchDesigner Bloom TOP / custom GLSL TOP.
vec3 emissionBloom(vec2 uv, float radiusUV) {
  if (uBloomAmount <= 0.0001 || radiusUV <= 0.0) return vec3(0.0);
  const int TAPS = 12;
  const float GA = 2.399963; // golden angle
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / float(TAPS)) * radiusUV; // even areal spread
    float a = fi * GA;
    vec2 off = vec2(cos(a), sin(a)) * r;
    off.y *= uResolution.x / uResolution.y; // keep the halo round
    vec4 s = texture(uStrataTexture, uv + off);
    float w = 1.0 - r / radiusUV;           // soft falloff toward the edge
    sum += s.rgb * s.a * w;                  // colour weighted by emission
    wsum += w;
  }
  return sum / max(wsum, 0.0001);
}

void main() {
  vec4 src = texture(uStrataTexture, vUv);
  vec3 col = src.rgb;

  // Add the emission-driven glow (before the output treatment).
  vec3 glow = emissionBloom(vUv, uBloomRadius * 0.06);
  col += glow * uBloomAmount;

  // Output treatment in linear space.
  col *= uExposure;
  col = applySaturation(col, uSaturation);
  col = applyContrast(col, uContrast);

  if (uDebugMonochrome) {
    // Structural identity check: show luminance only (see spec §2).
    col = vec3(luma(col));
  }

  // Fine grain, applied in linear space before the display conversion.
  float g = hash21(vUv * uResolution + uTime);
  col += (g - 0.5) * uGrainAmount;

  fragColor = vec4(linearToSRGB(col), 1.0);
}
