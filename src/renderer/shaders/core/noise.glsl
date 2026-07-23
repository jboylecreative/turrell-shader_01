// -----------------------------------------------------------------------------
// noise.glsl — PORTABLE noise utilities.
//
// Uses 2D SIMPLEX noise (Ashima / McEwan, texture-free) as the basis rather than
// value noise: simplex is not built on an integer lattice, so it has none of the
// grid-aligned "moving blocks / prism" artifacts value-noise fbm shows when it is
// domain-warped. fbm additionally rotates the domain each octave to fully
// decorrelate scales. Copy-paste ready for a TouchDesigner GLSL TOP.
// -----------------------------------------------------------------------------
#ifndef CORE_NOISE_GLSL
#define CORE_NOISE_GLSL

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute289(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }

// 2D simplex noise in ~[-1, 1].
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute289(permute289(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Simplex noise remapped to [0, 1].
float vnoise(vec2 p) { return snoise(p) * 0.5 + 0.5; }

// Fractal (5-octave) simplex noise in ~[0, 1], rotating the domain each octave
// to decorrelate scales (removes any residual directional structure).
float fbm(vec2 p) {
  const mat2 M = mat2(0.8, -0.6, 0.6, 0.8); // ~37 degree rotation per octave
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    sum += amp * (snoise(p) * 0.5 + 0.5);
    norm += amp;
    p = M * p * 2.0;
    amp *= 0.5;
  }
  return sum / norm;
}

#endif
