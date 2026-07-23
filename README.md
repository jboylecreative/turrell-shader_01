# Beverage Strata Shader Prototype

A browser-based **shader-authoring and prototyping environment** for a 1920×1080
LED-screen beverage installation. Five beverages each get a distinct
Rothko/Turrell-inspired luminous identity, rendered as a rolling vertical stack
of "strata" (one per recent order).

This browser app is a **portable authoring tool**, not the final platform. The
approved GLSL visual core, uniform names, parameter ranges, and JSON presets are
designed to move into **TouchDesigner** later with minimal rewriting. See
[`TD_PORTING.md`](./TD_PORTING.md) for the porting guide (grows each phase).

## Requirements

- Node.js 20+ (developed on Node 24)
- A browser with **WebGL 2 / GLSL ES 3.00** support

## Run

```bash
npm install
npm run dev      # starts Vite dev server (opens http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

The app runs fully locally after `npm install`; no network access is required.

## Architecture (portability-first)

The code is split into a **portable core** and **disposable browser scaffolding**:

| Layer | Location | Portable to TouchDesigner? |
| --- | --- | --- |
| Visual GLSL core | `src/renderer/shaders/core`, `.../beverages` | **Yes** — copy into GLSL TOPs |
| Shader entry points | `src/renderer/shaders/*.frag.glsl` | Thin wrappers → GLSL TOPs |
| Serializable state / JSON | `src/app/types.ts`, `src/config` | **Yes** — schema is framework-free |
| Parameter table | `src/config/parameterDefinitions.ts` | **Yes** — drives UI + uniforms + TD map |
| Three.js renderer | `src/renderer/*.ts` | No — rebuilt as TD TOP network |
| DOM control panel | `src/ui/*.ts`, `src/styles` | No — rebuilt as TD custom pars |

**Rendering** is a two-pass pipeline that maps 1:1 to TouchDesigner:

```
Pass 1 (StrataPass)  → strata field  → render target  → TD "Strata GLSL TOP"
Pass 2 (InteractionPass) → interaction + output treatment → TD "Interaction GLSL TOP"
```

**Colour pipeline:** hex fields are sRGB → converted to linear on the CPU
(`ColorUtils.ts`) → all shader math is linear → a single sRGB conversion in the
final pass (`core/color.glsl`). Never convert twice.

## Status

- **Phase 1 (done):** app foundation — WebGL2 two-pass renderer, fixed 1920×1080
  render target with responsive letterboxing + fullscreen, full serializable
  state model, debounced `localStorage` autosave + restore, named presets
  (save / lock / duplicate / delete), JSON import/export/copy, the complete
  control panel (sections A–H) generated from the parameter table, shader-compile
  error reporting, and a debug overlay. Pass 1 currently runs a **diagnostic
  placeholder shader**.
- **Phase 2 (done):** rolling strata system — history manager, event queue,
  spring-driven entry/shift/exit lifecycle, deterministic seeds.
- **Phase 3 (done):** five structurally distinct beverage shader identities in
  `/shaders/beverages` (americano = vertical gravity well, matcha = radial bloom,
  latte = horizontal luminous veil, espresso = concentrated high-contrast pulse,
  cold brew = vertical ribbons), built on portable `/core` modules and per-
  beverage array uniforms. Distinguishable in the monochrome debug mode.
- **Phase 4 (next):** soft-boundary interaction — membership blending, shared
  flow field, neighbour coupling, colour contamination.
- Phases 5–7: active cascade, visual refinement, optimisation + full docs.

## Keyboard

- `f` — toggle fullscreen preview
