// -----------------------------------------------------------------------------
// visualCore.glsl — shared visual types + global animation uniforms.
//
// BeverageSample is what every evaluate<Beverage>() returns. The extra channels
// (luminance/density/displacement/edgeInfluence) feed the Phase 4 interaction
// and Phase 5 cascade stages.
//
// PORTABLE: in a TouchDesigner GLSL TOP, uTime maps to absTime.seconds and
// uAspect to a resolution-derived value.
// -----------------------------------------------------------------------------
#ifndef CORE_VISUALCORE_GLSL
#define CORE_VISUALCORE_GLSL

uniform float uTime;     // time-scaled animation clock (seconds)
uniform float uFlowTime; // flow clock: real rate, independent of time-scale
uniform float uAspect;   // width / height, for aspect-corrected forms

struct BeverageSample {
  vec3 color;         // linear colour
  float luminance;    // structural luminance (drives monochrome identity test)
  float density;      // apparent opacity/weight
  vec2 displacement;  // local flow, for interaction/cascade passes
  float edgeInfluence;// how strongly this stratum acts on its neighbours
};

#endif
