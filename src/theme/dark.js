import baseTheme from "./theme";

// ============================================================
// DARK MODE — warm espresso, derived from the cinnamon palette
//
// Every surface is a desaturated step down the same brown ramp as
// the light theme (Warm Ivory #F6E9DD → Dark Brown #3A2A22), so dark
// mode reads as the SAME brand at low light rather than a different
// one. Text steps back up that ramp toward Warm Ivory instead of
// pure white, which keeps the warmth on large text blocks.
// ============================================================
const darkTheme = {
  ...baseTheme,
  mode: "dark",
  COLORS: {
    ...baseTheme.COLORS,

    // ── Core surfaces (espresso ramp) ──
    background: "#1A100B",
    backgroundSecondary: "#241811",
    backgroundTertiary: "#302017",
    backgroundOrange: "#241811",
    backgroundGold: "#2B2418",
    card: "#241811",
    softCard: "#302017",
    surface: "#302017",

    // Cinnamon reads too hot at full strength on dark — lift it so it
    // stays legible as an interactive colour against espresso.
    primary: "#D9884A",
    primaryLight: "#E5A06B",
    primaryDark: "#C17436",
    primaryLighter: "#EDB98B",

    // Tinted surfaces that were near-white in the base palette
    primaryPale: "#302017",
    orangeLight: "#302017",
    orangeIce: "#241811",
    goldLight: "#2B2418",

    // ── Text ramp — warm ivory, not pure white ──
    textPrimary: "#F6E9DD",
    textSecondary: "#D9C2AC",
    textTertiary: "#A38C79",
    textDisabled: "#6B564A",
    textOrange: "#D9884A",
    textOrangeDark: "#C17436",
    textGold: "#D8C3AF",
    textGoldDark: "#B8A38C",

    // ── Borders ──
    border: "#3D2A1E",
    borderLight: "#302017",
    borderMedium: "#4A3427",
    borderDark: "#C17436",
    divider: "#3D2A1E",

    // ── Inputs ──
    inputBackground: "#241811",
    inputBorder: "#3D2A1E",
    inputPlaceholder: "rgba(217, 194, 172, 0.45)",
    inputFocused: "#D9884A",

    // ── Gray scale inverted along the warm ramp ──
    gray50: "#241811",
    gray100: "#302017",
    gray200: "#3D2A1E",
    gray300: "#4A3427",
    gray400: "#6B564A",
    gray500: "#8A7160",
    gray600: "#A38C79",
    gray700: "#C4AF9C",
    gray800: "#D9C2AC",
    gray900: "#F6E9DD",

    disabled: "#302017",

    // ── Status backgrounds tuned for warm dark surfaces ──
    successBg: "#152B1E",
    warningBg: "#2E2617",
    errorBg: "#331419",
    infoBg: "#14232F",
    // Deep Maroon is too dark to read on espresso — lift the error ramp
    error: "#E0737B",
    errorLight: "#EC8F96",
    errorDark: "#8F1D24",

    // ── V2 body zone, inverted for dark mode ──
    // The hero tokens are deliberately NOT overridden: the hero is
    // dark in both modes, which is what keeps the design consistent.
    canvas: "#150C08",
    canvasElevated: "#221610",
    canvasSunken: "#0D0704",
    canvasTint: "#1C120C",
    hairline: "rgba(246, 233, 221, 0.10)",
    hairlineBold: "rgba(246, 233, 221, 0.18)",

    inkPrimary: "#F6E9DD",
    inkSecondary: "rgba(246, 233, 221, 0.72)",
    inkTertiary: "rgba(246, 233, 221, 0.46)",
    inkMuted: "rgba(246, 233, 221, 0.28)",

    // Metal soft-fills need dark equivalents or they blow out
    metalGoldSoft: "#2E2617",
    metalSilverSoft: "#1E2124",
    metalPlatinumSoft: "#182025",
    metalDiamondSoft: "#0E2B31",
  },
  SHADOWS: {
    ...baseTheme.SHADOWS,
    // Soft shadows are invisible on dark surfaces — deepen them
    hairline: {
      ...baseTheme.SHADOWS.hairline,
      shadowColor: "#000",
      shadowOpacity: 0.4,
    },
    lift: {
      ...baseTheme.SHADOWS.lift,
      shadowColor: "#000",
      shadowOpacity: 0.5,
    },
    float: {
      ...baseTheme.SHADOWS.float,
      shadowColor: "#000",
      shadowOpacity: 0.6,
    },
    bar: {
      ...baseTheme.SHADOWS.bar,
      shadowColor: "#000",
      shadowOpacity: 0.55,
    },
  },
};

export default darkTheme;
