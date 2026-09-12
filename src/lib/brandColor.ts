function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

// Linear RGB mix -- not perceptually uniform, but close enough to derive a
// usable tint/shade ramp from one vendor-picked color without a color library.
function mix(hex: string, toward: string, weight: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(toward);
  return rgbToHex(a.r + (b.r - a.r) * weight, a.g + (b.g - a.g) * weight, a.b + (b.b - a.b) * weight);
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Derives the full --brand-50..900 scale (see globals.css) from a single
// vendor brand color, so every `bg-brand-*` / `text-brand-*` utility already
// used across the app picks it up automatically once set as inline CSS
// custom properties on an ancestor element.
export function buildBrandRamp(base: string | null | undefined): Record<string, string> | undefined {
  if (!base || !HEX_RE.test(base)) return undefined;
  return {
    "--brand-50": mix(base, "#ffffff", 0.94),
    "--brand-100": mix(base, "#ffffff", 0.88),
    "--brand-200": mix(base, "#ffffff", 0.74),
    "--brand-300": mix(base, "#ffffff", 0.56),
    "--brand-400": mix(base, "#ffffff", 0.34),
    "--brand-500": mix(base, "#ffffff", 0.14),
    "--brand-600": base,
    "--brand-700": mix(base, "#000000", 0.15),
    "--brand-800": mix(base, "#000000", 0.3),
    "--brand-900": mix(base, "#000000", 0.45),
  };
}
