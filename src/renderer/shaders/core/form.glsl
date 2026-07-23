// -----------------------------------------------------------------------------
// form.glsl — PORTABLE "nature of the form" field.
//
// Produces the base volumetric field every beverage is built on, shaped by the
// per-beverage FORM controls so the user can radically change a beverage's
// character. Each control maps to a real structural change:
//   scale       feature size
//   swirl       how much the domain warps/churns
//   complexity  smooth blobs  ->  intricate multi-scale folds
//   ridginess   billowy clouds ->  sharp veins/filaments (abs-noise)
//   stretch     round puffs   ->  elongated streaks (vertical<->horizontal)
//   definition  soft mist     ->  hard-edged defined masses (contrast)
//
// Motion is supplied by the caller via `flow` (advection offset) and `t`
// (bounded phase time), so each beverage keeps its own motion language.
// -----------------------------------------------------------------------------
#ifndef CORE_FORM_GLSL
#define CORE_FORM_GLSL

#include "./noise.glsl"
#include "./fields.glsl"

struct FormParams {
  float scale;
  float swirl;
  float complexity;
  float ridginess;
  float stretch;
  float definition;
};

// One noise sample blending billowy (smooth) and veined (ridged) character.
float ridgedSample(vec2 p, float ridginess) {
  float n = snoise(p);            // [-1, 1]
  float billow = n * 0.5 + 0.5;   // smooth lumps
  float vein = 1.0 - abs(n);      // sharp ridges / veins
  return mix(billow, vein, clamp(ridginess, 0.0, 1.0));
}

// Fractal ridged noise (5 octaves, rotated) in ~[0,1].
float ridgedFbm(vec2 p, float ridginess) {
  const mat2 M = mat2(0.8, -0.6, 0.6, 0.8);
  float s = 0.0, a = 0.5, norm = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * ridgedSample(p, ridginess);
    norm += a;
    p = M * p * 2.0;
    a *= 0.5;
  }
  return s / norm;
}

// Per-order variation: bounded, seed-based jitter so repeat orders of the same
// beverage share their identity (colour, character) but read as distinct
// iterations. Perturbs feature scale, churn, orientation, and brightness — never
// the palette. `rot` is a rotation (radians) to apply to the sampling coords;
// `lumMul` a brightness multiplier.
void applyVariation(inout FormParams f, float seed, float variation, out float rot, out float lumMul) {
  float v = clamp(variation, 0.0, 1.0);
  float r1 = hash21(vec2(seed, 1.3));
  float r2 = hash21(vec2(seed, 7.7));
  float r3 = hash21(vec2(seed, 3.1));
  float r4 = hash21(vec2(seed, 9.2));
  f.scale *= 1.0 + (r1 - 0.5) * v * 0.7;   // feature size
  f.swirl *= 1.0 + (r2 - 0.5) * v * 0.6;   // churn amount
  rot = (r3 - 0.5) * v * 1.2;              // orientation
  lumMul = 1.0 + (r4 - 0.5) * v * 0.35;    // brightness
}

// Base form field in ~[0,1]. `pos` is centred, aspect-corrected position;
// `flow` advects the field (liquid flow); `t` drives the bounded swirl phase.
// Writes `depth` (near-far relief) for volumetric shading.
float formField(vec2 pos, FormParams f, vec2 flow, float t, out float depth) {
  // Anisotropic frequency: stretch<0.5 = vertical streaks, >0.5 = horizontal.
  float xFreq = f.scale * mix(1.8, 0.5, clamp(f.stretch, 0.0, 1.0));
  float yFreq = f.scale * mix(0.5, 1.8, clamp(f.stretch, 0.0, 1.0));
  vec2 p = vec2(pos.x * xFreq, pos.y * yFreq) + flow;

  // Bounded circular phase so the swirl travels/loops without precision drift.
  vec2 ph1 = vec2(cos(t * 0.15), sin(t * 0.12)) * 0.4;
  vec2 ph2 = vec2(sin(t * 0.10), cos(t * 0.14)) * 0.3;

  vec2 w1 = vec2(ridgedFbm(p + ph1, f.ridginess),
                 ridgedFbm(p.yx + ph1 + 4.7, f.ridginess)) - 0.5;
  vec2 warped = p + w1 * vec2(1.1, 0.7) * f.swirl;

  if (f.complexity > 0.001) {
    vec2 w2 = vec2(ridgedFbm(warped * 2.1 + ph2, f.ridginess),
                   ridgedFbm(warped.yx * 2.1 + ph2 + 8.1, f.ridginess)) - 0.5;
    warped += w2 * vec2(0.5, 0.3) * f.swirl * f.complexity;
  }

  float near = ridgedFbm(warped, f.ridginess);
  float far = ridgedFbm(warped * 0.5 + 3.0, f.ridginess);
  depth = near - far;

  // Definition: contrast around the midpoint (soft mist -> defined masses).
  return clamp((near - 0.5) * (0.7 + f.definition * 1.8) + 0.5, 0.0, 1.0);
}

// Layered depth: composites a SURFACE form layer over a DEEPER layer so you catch
// glimpses of currents lurking below an opaque surface.
//   turbidity  surface opacity: 1 = opaque surface, 0 = see deep through gaps
//   parallax   how much the deep layer lags/drifts differently (depth motion cue)
//   depthTint  how much the deep layer darkens/recedes
// Returns the composited value in ~[0,1]; writes `relief` (surface near-far) and
// `below` (how much of this pixel is showing the depths, for optional tinting).
float depthField(vec2 pos, FormParams f, vec2 flow, float t,
                 float turbidity, float parallax, float depthTint,
                 out float relief, out float below) {
  float rs;
  float surf = formField(pos, f, flow, t, rs);

  // Deeper layer: larger scale, slower/parallax-lagged flow, offset domain.
  FormParams fd = f;
  fd.scale *= 0.55;
  float rd;
  float deep = formField(pos * 0.75 + vec2(17.3, 4.1), fd,
                         flow * (1.0 - clamp(parallax, 0.0, 1.0) * 0.8),
                         t * 0.6, rd);
  deep *= (1.0 - clamp(depthTint, 0.0, 1.0) * 0.75); // recede/darken

  // Surface opacity: thick surface (high surf) hides depths; thin spots reveal
  // the deep layer. Turbidity raises the overall opacity floor.
  float surfAlpha = clamp(mix(smoothstep(0.25, 0.72, surf), 1.0, turbidity), 0.0, 1.0);
  below = 1.0 - surfAlpha;
  relief = rs;
  return mix(deep, surf, surfAlpha);
}

#endif
