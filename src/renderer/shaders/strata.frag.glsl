// -----------------------------------------------------------------------------
// strata.frag.glsl — Pass 1 (Strata field) ENTRY POINT.
// NOTE: no `#version` line — Three.js (GLSL3) and TouchDesigner both prepend it.
//
// Browser pass 1  →  TouchDesigner "Strata GLSL TOP".
//
// PHASE 1 STATUS: this is a DIAGNOSTIC placeholder used to validate the
// pipeline (UV, aspect correction, time, resolution). In Phase 2 it becomes a
// thin wrapper that fills each stratum band with its beverage colour, and in
// Phase 3+ it calls into the portable /core and /beverages GLSL modules:
//     vec4 renderStrata(PortableVisualState state);
//
// OUTPUT: LINEAR colour. The final sRGB conversion happens only in Pass 2.
// -----------------------------------------------------------------------------
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;        // seconds, already scaled by uTimeScale on the CPU
uniform vec2  uResolution;  // internal render resolution in pixels
uniform float uAspect;      // width / height, for aspect-corrected forms

void main() {
  // Aspect-corrected coordinates centred at 0, so circles stay round.
  vec2 p = vUv - 0.5;
  p.x *= uAspect;

  // Slow vertical field to prove time + gradient are alive.
  float band = 0.5 + 0.5 * sin(vUv.y * 6.2831 * 1.5 - uTime * 0.6);
  vec3 fieldA = vec3(0.10, 0.06, 0.03);
  vec3 fieldB = vec3(0.35, 0.20, 0.09);
  vec3 col = mix(fieldA, fieldB, band * (1.0 - vUv.y * 0.6));

  // Aspect-corrected breathing disc to verify aspect correction is applied.
  float r = length(p);
  float disc = smoothstep(0.32, 0.30, r + 0.02 * sin(uTime * 0.9));
  col += disc * vec3(0.25, 0.18, 0.10);

  // Faint pixel-grid tick so the render resolution is visibly correct.
  vec2 g = fract(vUv * uResolution / 120.0);
  float grid = step(0.98, max(g.x, g.y)) * 0.03;
  col += grid;

  fragColor = vec4(col, 1.0);
}
