import baseTheme from "./theme";

const lightTheme = {
  ...baseTheme,
  mode: "light",
  COLORS: {
    ...baseTheme.COLORS,
    backgroundSecondary: "#fff5f5",
    card: "#FFFFFF",
    textPrimary: "#1a0000",
    textSecondary: "#5c1010",
    border: "#ead8d8",
  },
};

// Light mode uses the V2 body tokens exactly as defined in the base
// theme, so no overrides are needed here. Kept explicit for symmetry
// with dark.js.

export default lightTheme;