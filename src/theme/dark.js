import baseTheme from "./theme";

const darkTheme = {
  ...baseTheme,
  mode: "dark",
  COLORS: {
    ...baseTheme.COLORS,
    background: "#1a0000",
    backgroundSecondary: "#2a0808",
    backgroundTertiary: "#3d1515",
    backgroundOrange: "#2a0808",
    backgroundGold: "#2a2410",
    card: "#2a0808",
    softCard: "#3d1515",
    surface: "#3d1515",

    // Tinted surfaces that were light-pink in the base palette
    primaryPale: "#3d1515",
    orangeLight: "#3d1515",
    orangeIce: "#2a0808",
    goldLight: "#2a2410",

    textPrimary: "#FFFFFF",
    textSecondary: "#e8c0c0",
    textTertiary: "#b08080",
    textDisabled: "#7a5050",

    border: "#5c2020",
    borderLight: "#3d1515",
    borderMedium: "#5c2020",
    divider: "#5c2020",

    inputBackground: "#2a0808",
    inputBorder: "#5c2020",
    inputPlaceholder: "rgba(232, 192, 192, 0.5)",

    // Neutral gray scale inverted for dark surfaces
    gray50: "#2a0808",
    gray100: "#3d1515",
    gray200: "#4d1c1c",
    gray300: "#5c2020",
    gray400: "#7a4040",
    gray500: "#9a6060",
    gray600: "#b08080",
    gray700: "#c9a5a5",
    gray800: "#e8c0c0",
    gray900: "#FFFFFF",

    disabled: "#3d1515",

    // Status backgrounds tuned for dark surfaces
    successBg: "#123021",
    warningBg: "#332b0f",
    errorBg: "#3a1414",
    infoBg: "#13263a",

    // ── V2 body zone, inverted for dark mode ──
    // The hero tokens are deliberately NOT overridden: the hero is
    // dark in both modes, which is what keeps the design consistent.
    canvas: "#0F0405",
    canvasElevated: "#1B0709",
    canvasSunken: "#080202",
    canvasTint: "#160607",
    hairline: "rgba(255, 255, 255, 0.09)",
    hairlineBold: "rgba(255, 255, 255, 0.16)",

    inkPrimary: "#FFFFFF",
    inkSecondary: "rgba(255, 255, 255, 0.72)",
    inkTertiary: "rgba(255, 255, 255, 0.46)",
    inkMuted: "rgba(255, 255, 255, 0.28)",

    // Metal soft-fills need dark equivalents or they blow out
    metalGoldSoft: "#2E2711",
    metalSilverSoft: "#1E2124",
    metalPlatinumSoft: "#182025",
    metalDiamondSoft: "#0E2B31",
  },
  SHADOWS: {
    ...baseTheme.SHADOWS,
    // Soft shadows are invisible on dark surfaces — deepen them
    hairline: { ...baseTheme.SHADOWS.hairline, shadowColor: "#000", shadowOpacity: 0.4 },
    lift: { ...baseTheme.SHADOWS.lift, shadowColor: "#000", shadowOpacity: 0.5 },
    float: { ...baseTheme.SHADOWS.float, shadowColor: "#000", shadowOpacity: 0.6 },
    bar: { ...baseTheme.SHADOWS.bar, shadowColor: "#000", shadowOpacity: 0.55 },
  },
};

export default darkTheme;