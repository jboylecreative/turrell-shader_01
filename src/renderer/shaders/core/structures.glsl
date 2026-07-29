// -----------------------------------------------------------------------------
// structures.glsl — PORTABLE selectable "structure types".
//
// Each beverage picks a Structure Type (a named archetypal shape) that is layered
// on the shared flow field, instead of a hardcoded per-beverage shape. Every type
// returns a luminance-shape value (pre palette/exposure) built from band-local
// coords, the form-field value `v`, and shared structure params. This is what
// makes a beverage's *shape* copyable/selectable.
//
// Shared params (StructureParams), interpreted per type:
//   pos       position / centre offset (0..1)
//   size      size / ring-spacing / wave-freq / column-count
//   angle     direction (deg) for gradient / wave / columns
//   sharpness soft <-> crisp
// `pulse`/`pulseSpeed` animate the types that support it.
// -----------------------------------------------------------------------------
#ifndef CORE_STRUCTURES_GLSL
#define CORE_STRUCTURES_GLSL

#include "./noise.glsl"
#include "./fields.glsl"
#include "./easing.glsl"

struct StructureParams {
  float pos;
  float size;
  float angle;
  float sharpness;
};

#define ST_FIELD    0
#define ST_GRADIENT 1
#define ST_ORB      2
#define ST_CORE     3
#define ST_SHELF    4
#define ST_RINGS    5
#define ST_VORTEX   6
#define ST_WAVE     7
#define ST_COLUMNS  8

// Crisp-en a 0..1 pattern toward hard edges as sharpness rises.
float sharpen(float x, float sharpness) {
  return mix(x, smoothstep(0.35, 0.65, x), clamp(sharpness, 0.0, 1.0));
}

// FIELD — the flowing form field is the whole structure (Cold Brew).
float structField(float v, float relief) {
  return mix(0.2, 0.62, v) + relief * 0.4;
}

// GRADIENT — linear brightness ramp along `angle`, positioned by `pos` (Americano).
float structGradient(vec2 uv, float ly, float v, float relief, float definition, StructureParams sp) {
  float a = radians(sp.angle);
  vec2 dir = vec2(cos(a), sin(a));
  float g = dot(vec2(uv.x, ly) - 0.5, dir) + 0.5;           // 0..1 along dir
  float ramp = smoothstep(sp.pos - 0.6, sp.pos + 0.6, g);
  ramp = sharpen(ramp, sp.sharpness);
  return mix(0.16, 0.56, ramp) + (v - 0.45) * (0.7 + definition * 0.3) + relief * 0.35;
}

// ORB — soft radial bloom that breathes (Matcha). `size` = radius, `pos` = vertical centre.
float structOrb(vec2 pc, float v, float relief, float st, float seed, float pulse, float pulseSpeed, StructureParams sp) {
  vec2 q = pc - vec2(0.0, (sp.pos - 0.5));
  float breatheR = sp.size * (1.0 + 0.4 * sin(st * pulseSpeed + seed * 6.2831) * (0.3 + pulse * 3.0));
  float r = length(q) * (0.75 + 0.5 * v);
  float bloom = smoothstep(breatheR, breatheR * mix(0.0, 0.6, sp.sharpness), r);
  return bloom * 0.8 + relief * 0.45 + v * 0.12 + 0.12;
}

// CORE — tight concentrated centre that throbs, never fully off (Espresso).
float structCore(vec2 pc, float v, float relief, float st, float seed, float pulse, float pulseSpeed, StructureParams sp) {
  float pulseWave = 0.5 + 0.5 * sin(st * (1.0 + pulseSpeed * 3.0) + seed * 6.2831);
  float pulseVis = mix(0.4, 1.0, mix(0.5, pulseWave, pulse * 2.0));
  vec2 q = pc - vec2(0.0, (sp.pos - 0.5));
  float core = radialFalloff(q, vec2(0.0), sp.size);
  float lum = mix(0.14, 0.92, v) + relief * 0.4 + core * 0.4 * pulseVis;
  return lum * (0.7 + 0.3 * pulseVis);
}

// SHELF — horizontal luminous bar hovering across the band (Latte).
float structShelf(float ly, float v, float relief, float st, float seed, float definition, StructureParams sp) {
  float shelfY = sp.pos + 0.08 * sin(st * 0.5 + seed * 6.2831);
  float shelf = smoothPulse(ly, shelfY, sp.size);
  shelf = sharpen(shelf, sp.sharpness);
  return 0.7 + shelf * 0.2 + (v - 0.5) * (0.4 + definition * 0.3) + relief * 0.25;
}

// RINGS — concentric rings from a centre; `size` = ring frequency.
float structRings(vec2 pc, float v, float relief, float st, float pulse, float pulseSpeed, StructureParams sp) {
  vec2 q = pc - vec2(0.0, (sp.pos - 0.5));
  float rr = length(q);
  float ring = 0.5 + 0.5 * sin(rr * (4.0 + sp.size * 20.0) - st * pulseSpeed * (0.5 + pulse * 2.0));
  ring = sharpen(ring, sp.sharpness);
  return mix(0.22, 0.82, ring) + (v - 0.5) * 0.3 + relief * 0.35;
}

// VORTEX — spiral winding out from a centre.
float structVortex(vec2 pc, float v, float relief, float st, StructureParams sp) {
  vec2 q = pc - vec2(0.0, (sp.pos - 0.5));
  float ang = atan(q.y, q.x);
  float rr = length(q);
  float sp1 = 0.5 + 0.5 * sin(ang * (1.0 + sp.size * 6.0) + rr * 8.0 - st * 0.6);
  sp1 = sharpen(sp1, sp.sharpness);
  return mix(0.2, 0.82, sp1) + (v - 0.5) * 0.3 + relief * 0.35;
}

// WAVE — sinusoidal light bands along `angle`.
float structWave(vec2 uv, float ly, float v, float relief, float st, StructureParams sp) {
  float a = radians(sp.angle);
  float d = dot(vec2(uv.x, ly) - 0.5, vec2(cos(a), sin(a)));
  float w = 0.5 + 0.5 * sin(d * (4.0 + sp.size * 22.0) - st * 0.8);
  w = sharpen(w, sp.sharpness);
  return mix(0.25, 0.8, w) + (v - 0.5) * 0.3 + relief * 0.35;
}

// COLUMNS — directional bands/streaks along `angle`.
float structColumns(vec2 uv, float ly, float v, float relief, StructureParams sp) {
  float a = radians(sp.angle);
  float d = dot(vec2(uv.x, ly) - 0.5, vec2(cos(a), sin(a)));
  float col = 0.5 + 0.5 * sin(d * (3.0 + sp.size * 18.0));
  col = sharpen(col, sp.sharpness);
  return mix(0.2, 0.78, col) + (v - 0.5) * 0.3 + relief * 0.35;
}

// Dispatch to the selected structure type.
float applyStructure(int type, vec2 uv, float ly, vec2 pc, float v, float relief,
                     float st, float seed, float pulse, float pulseSpeed,
                     float definition, StructureParams sp) {
  if (type == ST_GRADIENT) return structGradient(uv, ly, v, relief, definition, sp);
  if (type == ST_ORB)      return structOrb(pc, v, relief, st, seed, pulse, pulseSpeed, sp);
  if (type == ST_CORE)     return structCore(pc, v, relief, st, seed, pulse, pulseSpeed, sp);
  if (type == ST_SHELF)    return structShelf(ly, v, relief, st, seed, definition, sp);
  if (type == ST_RINGS)    return structRings(pc, v, relief, st, pulse, pulseSpeed, sp);
  if (type == ST_VORTEX)   return structVortex(pc, v, relief, st, sp);
  if (type == ST_WAVE)     return structWave(uv, ly, v, relief, st, sp);
  if (type == ST_COLUMNS)  return structColumns(uv, ly, v, relief, sp);
  return structField(v, relief); // ST_FIELD
}

#endif
