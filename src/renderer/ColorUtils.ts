// -----------------------------------------------------------------------------
// ColorUtils: hex (sRGB) → linear RGB conversion on the CPU.
//
// COLOUR-SPACE CONTRACT: hex fields are sRGB. We convert to LINEAR here so all
// colour uniforms handed to the shader are already linear (see core/color.glsl).
// The shader does the single sRGB conversion at output. No THREE types leak out
// of here — plain number tuples only, so the logic is portable.
// -----------------------------------------------------------------------------

export type RGB = [number, number, number];

/** Parse "#RRGGBB" (or "#RGB") into sRGB 0..1 components. */
export function hexToSRGB(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return [0, 0, 0];
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/** sRGB component (0..1) → linear. */
export function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** "#RRGGBB" → linear RGB 0..1 (what the shader receives). */
export function hexToLinear(hex: string): RGB {
  const [r, g, b] = hexToSRGB(hex);
  return [
    srgbChannelToLinear(r),
    srgbChannelToLinear(g),
    srgbChannelToLinear(b),
  ];
}

/** Validate a hex string for UI feedback. */
export function isValidHex(hex: string): boolean {
  const h = hex.trim().replace(/^#/, "");
  return /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h);
}
