// -----------------------------------------------------------------------------
// strata.frag.glsl — Pass 1 (Strata field) ENTRY POINT.
// NOTE: no `#version` line — Three.js (GLSL3) and TouchDesigner both prepend it.
//
// Browser pass 1  →  TouchDesigner "Strata GLSL TOP".
//
// PHASE 2 STATUS: fills each stratum band with its beverage's PRIMARY colour,
// using soft membership weights (not hard rectangles) so boundaries already
// blend. This validates the rolling-stack movement before the real per-beverage
// shader identities land in Phase 3, where each uStrataType branches into
// evaluate<Beverage>() in /beverages. OUTPUT: LINEAR colour.
// -----------------------------------------------------------------------------
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform vec2  uResolution;
uniform float uAspect;
uniform float uBackgroundLuminance;
uniform float uBoundarySoftness;

// Fixed-size strata arrays (compile-time max, mirrors MAX_STRATA_PLUS_EXIT = 21).
const int MAX_STRATA = 21;
const int BEV_COUNT = 5;

uniform int   uStrataCount;
uniform int   uStrataType[MAX_STRATA];
uniform float uStrataSeed[MAX_STRATA];
uniform float uStrataAge[MAX_STRATA];
uniform float uStrataTop[MAX_STRATA];
uniform float uStrataBottom[MAX_STRATA];
uniform float uStrataActivation[MAX_STRATA];

uniform vec3 uBevPrimary[BEV_COUNT];
uniform vec3 uBevSecondary[BEV_COUNT];
uniform vec3 uBevHighlight[BEV_COUNT];
uniform vec3 uBevShadow[BEV_COUNT];

// GLSL ES 3.00 permits dynamic indexing of uniform arrays.
vec3 bevPrimary(int t) { return uBevPrimary[clamp(t, 0, BEV_COUNT - 1)]; }
vec3 bevShadow(int t) { return uBevShadow[clamp(t, 0, BEV_COUNT - 1)]; }

void main() {
  float y = vUv.y;
  float soft = max(uBoundarySoftness, 0.002);

  vec3 acc = vec3(0.0);
  float wsum = 0.0;

  for (int i = 0; i < MAX_STRATA; i++) {
    if (i >= uStrataCount) break;
    float top = uStrataTop[i];
    float bot = uStrataBottom[i];
    // Soft membership: inside the band with feathered edges.
    float w = smoothstep(top - soft, top + soft, y) *
              (1.0 - smoothstep(bot - soft, bot + soft, y));
    if (w <= 0.0001) continue;

    int t = uStrataType[i];
    // A gentle vertical shade within the band (shadow → primary) so each
    // stratum reads with depth even in this flat placeholder stage.
    float g = clamp((y - top) / max(bot - top, 0.001), 0.0, 1.0);
    vec3 col = mix(bevShadow(t), bevPrimary(t), 0.35 + 0.65 * g);

    acc += col * w;
    wsum += w;
  }

  vec3 bg = vec3(uBackgroundLuminance);
  vec3 color = wsum > 0.0 ? acc / wsum : bg;
  color = mix(bg, color, clamp(wsum, 0.0, 1.0));

  fragColor = vec4(color, 1.0);
}
