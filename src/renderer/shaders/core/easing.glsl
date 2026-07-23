// -----------------------------------------------------------------------------
// easing.glsl — PORTABLE easing / pulse helpers.
// -----------------------------------------------------------------------------
#ifndef CORE_EASING_GLSL
#define CORE_EASING_GLSL

// Soft bump centred at `c` with half-width `w`.
float smoothPulse(float x, float c, float w) {
  return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x));
}

// Slow breathing 0..1.
float breathe(float t) {
  return 0.5 + 0.5 * sin(t);
}

float easeInOut(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

#endif
