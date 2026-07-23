// -----------------------------------------------------------------------------
// fields.glsl — PORTABLE field / coordinate utilities: rotation, domain warp,
// directional gradients, ribbons, radial falloff. Used differently by each
// beverage so that identity comes from structure, not just palette.
// -----------------------------------------------------------------------------
#ifndef CORE_FIELDS_GLSL
#define CORE_FIELDS_GLSL

#include "./noise.glsl"

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

// Push coordinates around by a low-frequency noise field.
vec2 domainWarp(vec2 p, float amount, float t) {
  vec2 q = vec2(fbm(p * 1.7 + t * 0.10), fbm(p * 1.7 - t * 0.13 + 5.2));
  return p + amount * (q - 0.5) * 2.0;
}

// Directional gradient 0..1 along a given angle (radians).
float directionalGradient(vec2 uv, float angleDeg) {
  float a = radians(angleDeg);
  vec2 dir = vec2(cos(a), sin(a));
  return clamp(dot(uv - 0.5, dir) + 0.5, 0.0, 1.0);
}

// Vertical laminar ribbons; `warpAmt` bends them with flow noise.
float ribbons(vec2 p, float freq, float warpAmt, float t) {
  float w = fbm(p * 1.3 + t * 0.05);
  return 0.5 + 0.5 * sin((p.x + (w - 0.5) * warpAmt) * freq * 6.28318);
}

// Radial falloff: 1 at centre, 0 beyond `radius`.
float radialFalloff(vec2 p, vec2 center, float radius) {
  return smoothstep(radius, 0.0, length(p - center));
}

#endif
