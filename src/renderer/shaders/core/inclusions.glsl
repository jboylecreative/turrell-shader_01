// -----------------------------------------------------------------------------
// inclusions.glsl — PORTABLE abstract "inclusions": suggestive bubbles and ice
// facets. Kept soft and luminous (non-literal) per the Rothko/Turrell direction:
// bubbles are soft rising light-discs with a faint rim; facets are translucent
// angular cells (Voronoi) with lit edges — a hint of ice, not a drawn cube.
// -----------------------------------------------------------------------------
#ifndef CORE_INCLUSIONS_GLSL
#define CORE_INCLUSIONS_GLSL

#include "./noise.glsl"

// Soft rising bubbles. `amount` gates it (0 = skip). Returns a soft fill in
// ~[0,1]; writes `rim` (faint bright edge).
float bubbles(vec2 pos, float amount, float size, float speed, float t, out float rim) {
  rim = 0.0;
  if (amount < 0.001) return 0.0;
  float cells = mix(7.0, 2.5, clamp(size, 0.0, 1.0)); // bigger size = fewer/larger
  vec2 gp = pos * cells;
  vec2 gi = floor(gp);
  vec2 gf = fract(gp);

  float fill = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 id = gi + vec2(float(x), float(y));
      float h1 = hash21(id);
      float h2 = hash21(id + 3.7);
      float h3 = hash21(id + 9.1);
      // Rise: y cycles upward over time; x jittered per cell.
      float rise = fract(h1 + t * speed * (0.15 + h2 * 0.25));
      vec2 center = vec2(h2, rise);
      float rad = 0.12 + h3 * 0.16;
      vec2 d = (vec2(float(x), float(y)) + center) - gf;
      float dist = length(d);
      fill += smoothstep(rad, rad * 0.45, dist) * 0.6;
      rim += smoothstep(rad, rad * 0.9, dist) * (1.0 - smoothstep(rad * 0.9, rad * 0.62, dist));
    }
  }
  rim = clamp(rim, 0.0, 1.0) * amount;
  return clamp(fill, 0.0, 1.0) * amount;
}

// Abstract ice facets (Voronoi). Returns interior shading in ~[0,1]; writes
// `edge` (thin lit facet borders).
float facets(vec2 pos, float amount, float size, float speed, float t, out float edge) {
  edge = 0.0;
  if (amount < 0.001) return 0.0;
  float cells = mix(5.0, 1.6, clamp(size, 0.0, 1.0));
  vec2 gp = pos * cells + vec2(t * speed * 0.08, -t * speed * 0.05);
  vec2 gi = floor(gp);
  vec2 gf = fract(gp);

  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 id = gi + vec2(float(x), float(y));
      vec2 o = vec2(hash21(id), hash21(id + 5.3));
      vec2 pt = vec2(float(x), float(y)) + o - gf;
      float d = dot(pt, pt);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  float border = sqrt(d2) - sqrt(d1);
  edge = (1.0 - smoothstep(0.0, 0.09, border)) * amount;
  return smoothstep(0.0, 1.1, sqrt(d1)) * 0.5 * amount;
}

#endif
