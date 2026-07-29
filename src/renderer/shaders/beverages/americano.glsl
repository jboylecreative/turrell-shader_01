// -----------------------------------------------------------------------------
// americano.glsl — dense amber/brown volume.
// STRUCTURE: atmospheric vertical gradient over the shared form field.
// MOTION: liquid flows left-to-right; slow in-place churn.
// -----------------------------------------------------------------------------
#ifndef BEV_AMERICANO_GLSL
#define BEV_AMERICANO_GLSL

#include "../core/visualCore.glsl"
#include "../core/params.glsl"
#include "../core/form.glsl"

BeverageSample evaluateAmericano(vec2 uv, float ly, float bandH, float age, float seed, float drift, float turb, BeverageParams p, BeverageColors c) {
  float st = uTime * p.speed;
  float vrot, vlum;
  applyVariation(p.form, seed, p.variation, vrot, vlum); // distinct per order
  p.form.swirl += turb * 0.6; // global Drift Turbulence amplifies swirl

  // Vertical coord is SCREEN-PROPORTIONAL ((ly-0.5)*bandH) so a shorter band
  // shows a horizontal slice of the same-scale field instead of a squished copy.
  vec2 pos = rot2(vrot) * vec2((uv.x - 0.5) * uAspect, (ly - 0.5) * bandH) + seed * 3.0;
  // Directional drift: magnitude from Flow Strength x global Drift Speed, angle
  // from Flow Direction. (0=right, 90=down, 180=left, 270=up.)
  float fa = radians(p.flowAngle);
  vec2 flow = -drift * p.flowStrength * vec2(cos(fa), sin(fa));
  float relief, below;
  float v = depthField(pos, p.form, flow, st * (0.5 + p.turbulence),
                       p.turbidity, p.parallax, p.depthTint, relief, below);

  // Atmospheric gradient (ly=0 is band top): brighter amber up top, dark below.
  float grav = smoothstep(1.25, -0.15, ly);
  float lum = mix(0.16, 0.56, grav) + (v - 0.45) * (0.7 + p.form.definition * 0.3) + relief * 0.35;
  lum = clamp(lum * (0.7 + p.luminance * 0.5) * vlum, 0.0, 1.3);

  vec3 col = mix(c.shadow, c.primary, clamp(lum, 0.0, 1.0));
  col = mix(col, c.secondary, smoothstep(0.2, 0.0, lum) * 0.4);
  col = mix(col, c.highlight, smoothstep(0.72, 1.1, lum) * 0.4);
  col = mix(col, c.shadow, below * 0.35); // depths read darker/receding

  // Emission (glow) follows the bright structure (highlights, cores, ridges).
  float glowE = p.glow * smoothstep(0.5, 1.05, lum);

  BeverageSample s;
  s.color = col;
  s.emission = glowE;
  s.luminance = lum;
  s.density = 0.7;
  s.displacement = vec2(0.0, 0.0);
  s.edgeInfluence = 0.6;
  return s;
}

#endif
