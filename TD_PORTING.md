# TouchDesigner Porting Guide

This document maps the browser prototype onto its eventual TouchDesigner (TD)
implementation. It grows with each phase; Phase 7 adds the full auto-generated
parameter→uniform table.

## Principle

Three.js is only a **rendering wrapper**. The artistic logic lives in portable
GLSL (`src/renderer/shaders/core` + `.../beverages`) and in framework-free state
(`src/app/types.ts`, `src/config`). Port those; rebuild the rest natively in TD.

## Multipass mapping

| Browser implementation | TouchDesigner destination |
| --- | --- |
| `StrataPass` (`strata.frag.glsl`) → `WebGLRenderTarget` | Strata GLSL TOP |
| `InteractionPass` (`interaction.frag.glsl`) → canvas | Interaction GLSL TOP + output treatment |
| Shared `UniformManager` uniforms | Custom parameters / CHOP channels |
| Fixed-size strata arrays (`MAX_STRATA = 20`) | CHOP channels or DAT table rows |
| `localStorage` working state | `.json` file on disk + Python |
| JSON preset import/export | Same `.json`, read by TD Python |
| DOM control panel | Custom parameters on a Base COMP |
| Browser animation loop | TD timeline / `absTime.seconds` |

## Colour-space contract

- Hex colours are **sRGB**. Converted to **linear** on the CPU before reaching
  the shader (`ColorUtils.hexToLinear`). Every colour uniform is already linear.
- All shader math is **linear**.
- The **single** sRGB conversion happens in the final pass
  (`core/color.glsl → linearToSRGB`). Do not convert twice.
- In TD: keep GLSL TOPs 32-bit float / linear; apply sRGB only in the output TOP.

## Shader entry-point contract

Fragment entry points take no `#version` line — Three.js (RawShaderMaterial +
GLSL3) and TD's GLSL TOP both prepend the version header. The vertex stage
(`fullscreen.vert.glsl`) has **no TD equivalent** — a GLSL TOP is already
per-pixel over a fullscreen quad.

Conceptual entry points (fleshed out in Phases 3–5):

```glsl
vec4 renderStrata(PortableVisualState state);              // Pass 1
vec4 renderInteraction(vec4 strataImage, PortableVisualState state); // Pass 2
```

## Parameter map

Every control is declared once in `src/config/parameterDefinitions.ts` with its
`jsonPath`, UI label, type, min/max, GLSL `uniform`, and `td` destination. This
table is the single source of truth and will be exported here in full in Phase 7.
Example rows:

Per-beverage params are **arrays indexed by beverage id** in the browser (all
five render in one shader); in TouchDesigner each beverage is its own GLSL TOP
where the array collapses to a scalar custom parameter.

| JSON path | UI label | Type | Min | Max | GLSL uniform | TD destination |
| --- | --- | --- | --- | --- | --- | --- |
| `global.timeScale` | Overall Time Scale | float | 0 | 1 | `uTimeScale` | CHOP `TimeScale` |
| `global.horizontalDrift` | Horizontal Drift | float | 0 | 3 | `uHorizontalDrift` | CHOP `HorizontalDrift` |
| `beverages.matcha.form.ridginess` | Ridginess | float | 0 | 1 | `uRidginess[1]` | CHOP `MatchaRidginess` |
| `beverages.matcha.motion.speed` | Speed | float | 0 | 2 | `uSpeed[1]` | CHOP `MatchaSpeed` |
| `beverages.matcha.colors.primary` | Primary | color | — | — | `uBevPrimary[1]` | Custom RGBA par `MatchaPrimary` |
