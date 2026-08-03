import baseTheme from "./theme";

// ============================================================
// LIGHT MODE
//
// The base palette in theme.js IS the light palette (Warm Ivory
// background, White Cream surface, Dark Brown text, Soft Beige
// border), so this layer intentionally overrides nothing.
//
// It previously re-declared background/card/text/border with the old
// red-palette hexes, which silently overrode the brand colours for
// every screen reading COLORS.card / COLORS.textPrimary / COLORS.border.
// Kept as a thin pass-through for symmetry with dark.js.
// ============================================================
const lightTheme = {
  ...baseTheme,
  mode: "light",
  COLORS: {
    ...baseTheme.COLORS,
  },
};

export default lightTheme;
