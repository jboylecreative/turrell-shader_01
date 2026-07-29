# Turrell Strata

A browser-based tool for authoring the animated "strata" visuals for the LED-screen
beverage installation. Each order draws a luminous, Rothko/Turrell-inspired field
("stratum"); the panel on the right lets you shape every beverage's look and the
overall composition, then save/share the result as JSON.

This browser app is a **portable authoring tool**, not the final platform — the GLSL
visual core, uniform names, parameter ranges, and JSON presets are designed to move
into **TouchDesigner** later with minimal rewriting (see [For developers](#for-developers)).

---

## Contents

- [Trigger Controls](#trigger-controls)
- [Output Resolution](#output-resolution)
- [Global Composition](#global-composition)
- [Strata Layout](#strata-layout)
- [Event Queue](#event-queue)
- [Debugging](#debugging)
- [Per-Beverage Controls](#per-beverage-controls)
- [Common workflows](#common-workflows)
- [For developers](#for-developers)
  - [Running it](#running-it)
  - [How a look is built](#how-a-look-is-built)
  - [Presets & Persistence](#presets--persistence)

---

## Trigger Controls

At the top of the panel. Simulates orders coming in so you can see how the composition behaves.

| Control | What it does |
| --- | --- |
| **Americano / Matcha / Latte / Espresso / Cold Brew** | Trigger an order of that beverage. In *Rolling* layout it rolls a new stratum in and pushes the stack; in the count-based layouts it adds to the recent-order tally that sizes the regions. |
| **Queue / Active readout** | Shows how many orders are queued and which is currently animating in. |
| **Clear History** | Empties the visible strata / resets the recent-order window everywhere. |
| **Random History** | Fills the screen with a random set of orders — handy for seeing a busy composition instantly. |

---

## Output Resolution

Sets the **internal composition resolution** (the render framebuffer). This is what a
TouchDesigner Web Render TOP / LED wall would capture. It's independent of:

- **Preview Quality** (a performance scale factor, see below), and
- the on-screen size (the canvas is letterboxed to fit whatever window it's in).

| Control | Notes |
| --- | --- |
| **Width / Height** | Type any pixel dimensions (e.g. `1920 × 1080`, or a portrait `1080 × 1920`). Applies live; the composition re-fits immediately. |

---

## Global Composition

Master controls over the whole image.

| Control | Range | What it does |
| --- | --- | --- |
| **Compositing** | Blend / Layered | **Blend** averages overlapping strata into one smooth field. **Layered** stacks them as translucent sheets at alternating depths — nearer sheets occlude farther ones (no averaged smear) and cast soft shadows at the seams. |
| **Layer Shadow** | 0–1 | *(Layered only)* Strength of the soft drop-shadows at the seams. |
| **Layer Shadow Size** | 0–0.2 | *(Layered only)* How far the seam shadow reaches. |
| **Overall Time Scale** | 0–1 | Master speed of all shimmer/animation. Lower = calmer, more meditative. |
| **Exposure** | 0–2 | Overall brightness (linear, before display conversion). |
| **Saturation** | 0–2 | Final color intensity. |
| **Contrast** | 0.5–2 | Final contrast. |
| **Background Luminance** | 0–0.3 | Brightness of the empty background behind the strata. |
| **Global Motion Amount** | 0–2 | Global multiplier on *all* motion. Set to 0 to freeze drift while keeping the image. |
| **Drift Speed** | 0–3 | Base speed of the liquid flow. Each beverage adds its own direction & strength on top. |
| **Drift Turbulence** | 0–1.5 | How much the drifting texture churns/swirls vs. slides flat. |
| **Grain Amount** | 0–0.3 | Fine output grain/texture. |
| **Glow Amount** | 0–2 | Overall strength of the luminous glow (bloom). Scales every beverage's emission. |
| **Glow Radius** | 0–1 | How far the glow haloes out from bright areas. |
| **Preview Quality** | 0.25–1 | Renders at a fraction of the output resolution for performance. Does **not** change the composition, only sharpness/cost. Lower it if the FPS is low. |
| **Pause Animation** | on/off | Freezes all animation (the image stays). |

> **Speed vs. Drift vs. Flow.** *Overall Time Scale* and per-beverage *Speed/Turbulence*
> control the **internal churn** (twirls in place). *Drift Speed* + per-beverage *Flow
> Strength/Direction* control **directional travel** (the liquid moving across the screen).
> They're independent, so you can have fast churn with no drift, or vice versa.

---

## Strata Layout

How orders are arranged on screen.

| Control | What it does |
| --- | --- |
| **Layout Mode** | **Rolling** — new orders roll in and push the stack (a live feed). **Proportional** — the screen is divided into horizontal regions, one per beverage, sized by how often it was recently ordered. **Radial** — the same proportional idea as concentric rings from the center out. |
| **Count Window** | *(Proportional/Radial)* How many recent orders are tallied to size the regions. |
| **Radial Order** | *(Radial)* Ring arrangement from the center outward: **Fixed order**, **By count** (biggest share innermost), or **Newest in centre**. |
| **Visible History Count** | *(Rolling)* How many strata are visible in the stack. |
| **Initial History Count** | How many strata to generate on load. |
| **Randomize Initial Count** | Randomize that starting number. |
| **Stratum Height Variation** | Per-order variation in band height. |
| **Height Weighting** | Bias band heights toward the top or bottom. |
| **Stack Compression** | Compresses strata toward the bottom of the stack. |
| **Entry / Exit / Shift Duration** | Seconds for a new stratum to enter, the oldest to leave, and the stack to shift. |
| **Overshoot** | Spring overshoot as strata settle (a little bounce). |
| **Settling Damping** | How quickly that settling motion calms down. |
| **Boundary Softness** | Softness/feathering of the edges between strata. |

---

## Event Queue

Timing of simulated orders (mostly relevant in Rolling mode).

| Control | What it does |
| --- | --- |
| **Min Time Between Events** | Minimum seconds between orders animating in. |
| **Active Overlap Amount** | How much a new order overlaps the previous one's settling. |
| **Prevent Double-Click** | Ignores accidental rapid double-presses of a beverage button. |
| **Double-Click Interval** | The protection window, in seconds. |

---

## Debugging

Diagnostic overlays and checks. (Some entries are placeholders for unbuilt phases and
are hidden until then.)

| Control | What it does |
| --- | --- |
| **Monochrome Identity Test** | Renders structural luminance only (no color), to verify each beverage is recognizable by *shape*, not just hue. |
| **Show Frame Rate** | Shows the FPS readout on the stage. |
| **Show Render Resolution** | Shows the current internal render resolution on the stage. |
| **Freeze Time** | Freezes the animation clock. |

---

## Per-Beverage Controls

One collapsible section per beverage (Americano, Matcha, Latte, Espresso, Cold Brew).
**All five share the same controls** — described once below. At the top of each section:

- **Copy from…** — copies *all* settings (type, params, palette) from another beverage
  onto this one. This is how you clone a look, then tweak.
- **Reset to Default** — restores just this beverage to the default baseline.

### Colors

| Control | What it does |
| --- | --- |
| **Primary** | The main field color. |
| **Secondary** | A secondary accent color, surfacing in shadowed areas. |
| **Highlight** | The luminous highlight color for the brightest areas. |
| **Shadow** | The deepest shadow color. |

Colors are edited as a swatch or a hex code, and map across a shadow → primary →
highlight ramp by brightness.

### Structure

The archetypal shape layered on the flowing field — this is the biggest driver of a
beverage's identity.

| Control | What it does |
| --- | --- |
| **Type** | One of nine shapes (see table below). |
| **Position** | Where the shape sits / its center (0–1). |
| **Size** | Interpreted per type: orb/core radius, ring/wave/column frequency, shelf width, etc. Set an orb/core to ~0 to remove it. |
| **Angle** | Direction in degrees, for the types that have one (gradient, wave, columns). |
| **Sharpness** | Soft, diffuse edges → crisp, defined edges. |

**Structure Types**

| Type | Look |
| --- | --- |
| **Field** | No added shape — just the flowing form field. |
| **Gradient** | A directional brightness ramp (bright→dark) across the band. |
| **Orb** | A soft glowing radial bloom. |
| **Core** | A tight, concentrated bright core (throbs with Pulse). |
| **Shelf** | A horizontal luminous bar/veil hovering across the band. |
| **Rings** | Concentric rings. |
| **Vortex** | A swirling spiral. |
| **Wave** | Directional wave bands. |
| **Columns** | Vertical columns/streaks. |

### Form

The "nature of the form." Ranges are wide so you can reshape dramatically.

| Control | What it does |
| --- | --- |
| **Scale** | Feature size — higher = smaller, denser features. |
| **Swirl** | Domain-warp amount: gentle drift → heavy churn. |
| **Complexity** | Smooth blobs → intricate multi-scale folds. |
| **Ridginess** | Billowy clouds → sharp veins/filaments. |
| **Stretch** | 0 = vertical streaks, 0.5 = round, 1 = horizontal streaks. |
| **Definition** | Soft mist → hard-edged defined masses. |
| **Luminance** | Overall brightness of the field. |
| **Glow** | How strongly this beverage's bright parts emit light (bloomed by the global Glow). Follows the structure — brightest ridges/cores glow most. |
| **Variation** | Per-order distinctness: 0 = repeat orders look identical, 1 = each order varies (scale/orientation/brightness) while keeping its identity. |

### Depth

A sense of volume beneath the surface.

| Control | What it does |
| --- | --- |
| **Turbidity** | Surface opacity: high = opaque surface, low = glimpses of the depths below. |
| **Depth Parallax** | How much the deep layer drifts differently from the surface (a depth motion cue). |
| **Depth Tint** | How much the deep layer darkens/recedes. |

### Surface

Material treatments on top of the color.

| Control | What it does |
| --- | --- |
| **Sheen** | Metallic specular glints riding the ridges. |
| **Iridescence** | Oil-slick hue shift across the surface. |
| **Caustics** | Faint animated bright light-ripples. |

Each is off at 0 (and costs nothing when off).

### Motion

How the form moves. (Remember: churn ≠ drift — see the note under Global Composition.)

| Control | What it does |
| --- | --- |
| **Speed** | Internal churn/animation rate (twirls & curls). Not directional. |
| **Flow Strength** | How far/fast this beverage drifts directionally (× the global Drift Speed). |
| **Flow Direction** | Direction of the drift in degrees: 0 = right, 90 = down, 180 = left, 270 = up. |
| **Turbulence** | Extra churn rate on top of Speed. Not directional. |
| **Pulse** | Depth of a breathing pulse (brightens/dims). Works with Orb/Core/Shelf/Wave/etc. |
| **Pulse Speed** | Rate of that breathing pulse. |

---

## Common workflows

- **Clone and tweak a beverage:** open a beverage → **Copy from…** the one you like →
  change its Structure Type / palette / motion.
- **Make a calm vs. energetic room:** lower **Overall Time Scale** and **Drift Speed**
  for calm; raise per-beverage **Speed/Turbulence** and **Glow** for energy.
- **Try a new arrangement:** switch **Layout Mode** to Proportional or Radial, hit
  **Random History**, and watch how the regions size themselves.
- **Save a look:** type a **Name** → **Save**. To keep a safe copy, **Lock** it.
- **Share looks:** **Export All** → send the bundle. Import merges without overwriting.
- **If FPS is low:** drop **Preview Quality** toward 0.25, and remember **Layered**
  compositing + heavy **Surface** effects cost more than **Blend**.

---

## For developers

**Requirements:** Node.js 20+, and a browser with **WebGL 2 / GLSL ES 3.00** support.

The code is split into a **portable GLSL core** and **disposable browser scaffolding**,
so the visuals can move into TouchDesigner with minimal rewriting. See
[`TD_PORTING.md`](./TD_PORTING.md) for the porting guide.

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
Pass 1 (StrataPass)      → strata field                → render target → TD "Strata GLSL TOP"
Pass 2 (InteractionPass) → interaction + output treatment → canvas     → TD "Interaction GLSL TOP"
```

A beverage is pure data: a **Structure Type** + **params** + **palette**, evaluated by a
single generic `evaluateBeverage()` (in `src/renderer/shaders/beverages/beverage.glsl`)
that dispatches to the selected structure in `core/structures.glsl`. The single
`parameterDefinitions.ts` table is the source of truth that drives the control-panel UI,
the uniform binding, and the TD parameter map.

**Colour pipeline:** hex fields are sRGB → converted to linear on the CPU
(`ColorUtils.ts`) → all shader math is linear → a single sRGB conversion in the final
pass (`core/color.glsl`). Never convert twice.

### Running it

- **Dev:** `npm install`, then `npm run dev` → opens at `http://localhost:5180`.
- **Production build:** `npm run build` → static files in `dist/` (deployable to any static host, e.g. Vercel).
- **Fullscreen:** press **`F`** (except while typing in a field).

Your work autosaves to the browser continuously, so a reload restores where you left off.
The app runs fully locally after `npm install`; no network access is required.

### How a look is built

Two things combine on screen:

1. **The background** — a dim flat field (see *Background Luminance*).
2. **Strata** — one horizontal band per recent order, stacked and drifting. Each band
   is drawn from the ordered beverage's settings.

A beverage's identity comes from three things, all editable and all copyable:

- **A Structure Type** — the archetypal shape (orb, shelf, gradient, vortex…).
- **Form / Depth / Surface / Motion parameters** — how that shape looks and moves.
- **A palette** — its four colors.

Because a beverage is "just data," you can copy one onto another, change any beverage
to any shape, and every difference is exposed as a control (nothing is hardcoded).

> **Do I need to reload after changing a control?** No — everything updates live.

### Presets & Persistence

A **preset** is a complete snapshot of every setting (global + all five beverages).
Presets are stored in your browser and can be exported as JSON files to share.

**Fields**

- **Preset dropdown** — load a saved preset.
- **Name** — the name to save under. This is the single source of truth for saving:
  type a name here, then click **Save**.

**Buttons**

| Button | What it does |
| --- | --- |
| **Save** | Saves the current settings under the **Name** field — creates a new preset, or overwrites an existing one of that exact name. To fork, type a new name and Save (the original is untouched). |
| **Duplicate** | Copies the current preset to `"<name> copy"`. |
| **Delete** | Deletes the current preset (blocked if locked). |
| **Lock / Unlock** | Locks a preset against being overwritten or deleted (shown with 🔒). |
| **Export JSON** | Saves the **current** design as a single `.json` file (one preset). |
| **Export All** | Saves **every** stored preset into one shareable **bundle** file. |
| **Copy JSON** | Copies the current design to the clipboard as JSON. |
| **Import JSON** | Loads a file. **Auto-detects** what it is (see below). |
| **Reset All to Default** | Resets every setting to the current default baseline. |
| **Set All as Default** | Makes the current settings the new default baseline (what "Reset" returns to). |
| **Restore Factory (All)** | Discards your custom default and returns to the original factory settings. |

**How Import behaves (non-destructive by design)**

- **A single-preset file** → your current settings are first saved as a timestamped
  backup preset (`"<name> (backup YYYY-MM-DD HH-MM-SS)"`), then the file loads as the
  working state and is added to your library. Nothing you had can be lost.
- **A bundle file (from Export All)** → every preset in it is merged into your library.
  It **never overwrites** an existing preset: identical ones are skipped, and a name
  clash with different content is saved as `"<name> (imported)"`. The banner reports
  `"N added, M already present."` A bundle import does **not** change what's on screen.

> **Collecting user submissions:** have users click **Export JSON** (their design) or
> **Export All** (their whole library) and send you the file. You **Import JSON** it —
> their presets appear in your dropdown with zero risk of clobbering yours.
