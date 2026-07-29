// -----------------------------------------------------------------------------
// surface.glsl — PORTABLE surface / material treatments, applied to the beverage
// colour after the palette: metallic SHEEN, oil-slick IRIDESCENCE, and animated
// CAUSTICS. Each is gated (> 0) so it costs nothing when off.
// -----------------------------------------------------------------------------
#ifndef CORE_SURFACE_GLSL
#define CORE_SURFACE_GLSL

#include "./noise.glsl"
#include "./color.glsl"

void applySurface(inout vec3 col, float v, float relief, float lum, vec2 uv, float st,
                  float sheen, float iridescence, float caustics, vec3 highlight) {
  // SHEEN — thin bright specular glints riding the ridges (high relief).
  if (sheen > 0.0001) {
    float soft = smoothstep(0.10, 0.30, relief);
    float glint = smoothstep(0.26, 0.40, relief);
    col = mix(col, highlight, soft * sheen * 0.5);
    col += highlight * glint * sheen * 0.35;
  }

  // IRIDESCENCE — oil-slick hue shift driven by the field value + a slow phase.
  if (iridescence > 0.0001) {
    vec3 hsv = rgb2hsv(col);
    float shift = v * 0.5 + relief * 0.6 + st * 0.05;
    hsv.x = fract(hsv.x + shift * iridescence * 0.6);
    hsv.y = min(1.0, hsv.y + iridescence * 0.12);
    col = mix(col, hsv2rgb(hsv), iridescence * 0.7);
  }

  // CAUSTICS — faint animated bright veins, strongest in lit areas.
  if (caustics > 0.0001) {
    float n = snoise(uv * 8.0 + vec2(st * 0.3, -st * 0.15));
    float veins = pow(1.0 - abs(n), 3.0);
    col += highlight * veins * caustics * 0.4 * smoothstep(0.2, 0.85, lum);
  }
}

#endif
