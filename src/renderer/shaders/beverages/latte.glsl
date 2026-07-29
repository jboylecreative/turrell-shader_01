// -----------------------------------------------------------------------------
// latte.glsl — cream / warm-white.
// STRUCTURE: broad luminous horizontal veil with a suspended light shelf over
// the (smooth, low-definition) form field.
// MOTION: slides sideways strongly; very smooth.
// -----------------------------------------------------------------------------
#ifndef BEV_LATTE_GLSL
#define BEV_LATTE_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"
#include "../core/easing.glsl"

BeverageSample evaluateLatte(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  float vrot, vlum;
  applyVariation(p.form, seed, p.variation, vrot, vlum);
  p.form.swirl += turb * 0.4;

  // Screen-proportional vertical so short bands show a slice, not a squish.
  vec2 pos = rot2(vrot) * vec2((uv.x - 0.5) * uAspect, (ly - 0.5) * bandH) + seed * 3.0;
  // Directional drift: magnitude from Flow Strength x global Drift Speed, angle
  // from Flow Direction. (0=right, 90=down, 180=left, 270=up.)
  float fa = radians(p.flowAngle);
  vec2 flow = -drift * p.flowStrength * vec2(cos(fa), sin(fa));
  float relief, below;
  float v = depthField(pos, p.form, flow, st * (0.5 + p.turbulence),
                       p.turbidity, p.parallax, p.depthTint, relief, below);

  // Suspended luminous shelf hovering vertically.
  float shelfY = 0.45 + 0.08 * sin(st * 0.5 + seed * 6.2831);
  float shelf = smoothPulse(ly, shelfY, 0.32);

  float lum = 0.7 + shelf * 0.2 + (v - 0.5) * (0.4 + p.form.definition * 0.3) + relief * 0.25;
  lum = clamp(lum * (0.78 + p.luminance * 0.4) * vlum, 0.0, 1.4);

  vec3 col = mix(c.secondary, c.highlight, smoothstep(0.45, 1.05, lum));
  col = mix(col, c.primary, (1.0 - shelf) * 0.22);
  col = mix(col, c.shadow, smoothstep(0.32, 0.0, lum) * 0.4);
  col = mix(col, c.primary, below * 0.3); // subtle deeper cream below

  // Abstract inclusions (bubbles / ice facets) in screen space.
  vec2 ipos = vec2(uv.x * uAspect, uv.y);
  float incRim; float bub = bubbles(ipos, p.incBubbles, p.incSize, p.incSpeed, st, incRim);
  float incEdge; float fac = facets(ipos, p.incFacets, p.incSize, p.incSpeed, st, incEdge);
  col = mix(col, c.highlight, clamp(bub * 0.4 + incRim * 0.7 + incEdge * 0.55, 0.0, 1.0));
  col = mix(col, c.secondary, fac * 0.22);
  lum += (bub + incEdge) * 0.15;
  // Emission (glow) follows the bright structure: highlights, cores, bubble
  // rims and ice edges emit most. Bloomed in Pass 2.
  float glowE = p.glow * (smoothstep(0.5, 1.05, lum) + incRim * 0.9 + incEdge * 0.7);

  BeverageSample s;
  s.color = col;
  s.emission = glowE;
  s.luminance = lum;
  s.density = 0.4;
  s.displacement = vec2(0.0);
  s.edgeInfluence = 0.9;
  return s;
}

#endif
