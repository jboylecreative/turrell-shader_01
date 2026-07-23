// -----------------------------------------------------------------------------
// noise.glsl — PORTABLE value-noise utilities.
// Copy-paste ready for a TouchDesigner GLSL TOP. No external dependencies.
// -----------------------------------------------------------------------------
#ifndef CORE_NOISE_GLSL
#define CORE_NOISE_GLSL

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Smooth value noise in [0,1].
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal (5-octave) value noise in ~[0,1].
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    sum += amp * vnoise(p);
    norm += amp;
    p *= 2.02;
    amp *= 0.5;
  }
  return sum / norm;
}

#endif
