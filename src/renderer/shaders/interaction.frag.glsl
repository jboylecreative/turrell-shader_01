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
uniform bool  uDebugMonochrome;

// Cheap hash for grain (portable; matches a TD noise TOP conceptually).
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 col = texture(uStrataTexture, vUv).rgb;

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
