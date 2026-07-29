// -----------------------------------------------------------------------------
// color.glsl — PORTABLE colour-space utilities.
//
// COLOUR-SPACE CONTRACT (mirrored in TD_PORTING.md):
//   * All hex colours enter as sRGB and are converted to LINEAR on the CPU
//     (see ColorUtils.ts) before reaching the shader as uniforms. So every
//     colour uniform is already LINEAR.
//   * All shader mixing / lighting math happens in LINEAR space.
//   * The FINAL output pass (interaction) applies ONE sRGB conversion via
//     linearToSRGB(). Do not convert anywhere else — double gamma is the most
//     common porting bug.
//
// In TouchDesigner: keep GLSL TOPs in 32-bit float linear, and apply the sRGB
// conversion only in the final output TOP.
// -----------------------------------------------------------------------------

#ifndef CORE_COLOR_GLSL
#define CORE_COLOR_GLSL

vec3 linearToSRGB(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 sRGBToLinear(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

float luma(vec3 c) {
  // Rec.709 luminance in linear space.
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 applySaturation(vec3 c, float sat) {
  return mix(vec3(luma(c)), c, sat);
}

vec3 applyContrast(vec3 c, float contrast) {
  return (c - 0.5) * contrast + 0.5;
}

// RGB <-> HSV (for hue-shift / iridescence). Standard branchless conversions.
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

#endif
