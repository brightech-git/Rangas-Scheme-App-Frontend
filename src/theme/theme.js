
// theme.js
import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// ============================================
// 📏 RESPONSIVE SCALING SYSTEM
// ============================================
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.25) => {
  return size + (scale(size) - size) * factor;
};
const fontScale = (size) => {
  const scaled = moderateScale(size, 0.2);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

// ============================================
// 🎨 COLOR PALETTE — Rangas DigiGold
// Primary: #aa0404 (Deep Red) | Secondary: #ffcc00 (Gold Yellow)
// ============================================
export const COLORS = {
  // ===== PRIMARY BRAND COLORS (DEEP RED) =====
  primary: "#aa0404",
  primaryLight: "#cc0505",
  primaryDark: "#7a0303",
  primaryLighter: "#dd2020",
  primaryPale: "#fff5f5",

  secondary: "#ffcc00",
  secondaryLight: "#ffd633",
  secondaryDark: "#cc9900",
  secondaryLighter: "#ffe566",

  accent: "#ffcc00",
  accentLight: "#ffe566",
  accentDark: "#cc9900",
  bottomGlow: "rgb(170, 4, 4)",

  // ===== NEUTRAL COLORS =====
  white: "#FFFFFF",
  black: "#000000",
  background: "#fffbfb",
  backgroundSecondary: "#fff5f5",
  backgroundTertiary: "#ffebe8",
  backgroundDark: "#1a0000",
  backgroundOrange: "#fff5f5",
  backgroundGold: "#fffbf0",
  surface: "#fffbfb",
  card: "#FFFFFF",
  softCard: "#fff5f5",
  overlay: "rgba(170, 4, 4, 0.7)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayGold: "rgba(255, 204, 0, 0.1)",
  overlayOrange: "rgba(170, 4, 4, 0.1)",

  // ===== TEXT COLORS =====
  textPrimary: "#1a0000",
  textSecondary: "#5c1010",
  textTertiary: "#9a4040",
  textDisabled: "#ddb9b9",
  textInverse: "#FFFFFF",
  textOrange: "#aa0404",
  textOrangeDark: "#7a0303",
  textGold: "#cc9900",
  textGoldDark: "#997700",

  // ===== GRAY SCALE (neutral) =====
  gray50: "#fafafa",
  gray100: "#f5f0f0",
  gray200: "#ead8d8",
  gray300: "#dbb9b9",
  gray400: "#b07070",
  gray500: "#7a4040",
  gray600: "#5c2a2a",
  gray700: "#3d1515",
  gray800: "#2a0808",
  gray900: "#1a0000",

  // ===== RED VARIATIONS (replaces "orange") =====
  orangeLight: "#fff5f5",
  orangeMedium: "#dd2020",
  orangeDark: "#7a0303",
  orangeVivid: "#cc0505",
  orangeIce: "#ffebe8",
  orangeSoft: "#ffc9c9",
  orangeDeep: "#550000",

  // ===== BORDER & DIVIDER =====
  border: "#ead8d8",
  borderLight: "#fff0f0",
  borderMedium: "#dbb9b9",
  borderDark: "#7a0303",
  borderOrange: "#aa0404",
  borderGold: "#ffcc00",
  divider: "#ead8d8",

  // ===== INPUT COLORS =====
  inputBackground: "#fffbfb",
  inputBorder: "#ead8d8",
  inputPlaceholder: "rgba(170, 4, 4, 0.35)",
  inputFocused: "#aa0404",
  inputFocusedAlt: "#ffcc00",

  // ===== STATUS COLORS =====
  // Subtle status backgrounds (for chips, badges, banners) — pair with the solid color for text/icon
  successBg: "#e6f4ea",
  warningBg: "#fff8e1",
  errorBg: "#fdeaea",
  infoBg: "#e7f1fb",

  success: "#1e7a34",
  successLight: "#27ae60",
  successDark: "#155a24",
  error: "#aa0404",
  errorLight: "#cc0505",
  errorDark: "#7a0303",
  warning: "#ffcc00",
  warningLight: "#ffd633",
  warningDark: "#cc9900",
  info: "#1a5fa4",
  infoLight: "#2e86de",
  infoDark: "#0e3d6e",
  disabled: "#f5eded",

  // ===== YELLOW/GOLD VARIATIONS =====
  goldPrimary: "#ffcc00",
  goldSecondary: "#ffd633",
  goldTertiary: "#ffe566",
  goldBronze: "#cc8800",
  goldRose: "#ff8844",
  goldLight: "#fffbee",
  goldMedium: "#ffcc00",
  goldDark: "#cc9900",

  // ===== TRANSPARENT COLORS =====
  transparent: "transparent",
  // Red (primary) opacity
  orangeOpacity10: "rgba(170, 4, 4, 0.1)",
  orangeOpacity20: "rgba(170, 4, 4, 0.2)",
  orangeOpacity30: "rgba(170, 4, 4, 0.3)",
  orangeOpacity40: "rgba(170, 4, 4, 0.4)",
  orangeOpacity50: "rgba(170, 4, 4, 0.5)",
  orangeOpacity60: "rgba(170, 4, 4, 0.6)",
  orangeOpacity70: "rgba(170, 4, 4, 0.7)",
  orangeOpacity80: "rgba(170, 4, 4, 0.8)",
  orangeOpacity90: "rgba(170, 4, 4, 0.9)",
  // Black opacity
  blackOpacity10: "rgba(0, 0, 0, 0.1)",
  blackOpacity20: "rgba(0, 0, 0, 0.2)",
  blackOpacity30: "rgba(0, 0, 0, 0.3)",
  blackOpacity40: "rgba(0, 0, 0, 0.4)",
  blackOpacity50: "rgba(0, 0, 0, 0.5)",
  blackOpacity60: "rgba(0, 0, 0, 0.6)",
  blackOpacity70: "rgba(0, 0, 0, 0.7)",
  blackOpacity80: "rgba(0, 0, 0, 0.8)",
  blackOpacity90: "rgba(0, 0, 0, 0.9)",
  // White opacity
  whiteOpacity10: "rgba(255, 255, 255, 0.1)",
  whiteOpacity20: "rgba(255, 255, 255, 0.2)",
  whiteOpacity30: "rgba(255, 255, 255, 0.3)",
  whiteOpacity50: "rgba(255, 255, 255, 0.5)",
  whiteOpacity70: "rgba(255, 255, 255, 0.7)",
  whiteOpacity80: "rgba(255, 255, 255, 0.8)",
  whiteOpacity90: "rgba(255, 255, 255, 0.9)",
  // Gold opacity
  goldOpacity10: "rgba(255, 204, 0, 0.1)",
  goldOpacity20: "rgba(255, 204, 0, 0.2)",
  goldOpacity30: "rgba(255, 204, 0, 0.3)",
  goldOpacity50: "rgba(255, 204, 0, 0.5)",

  // ===== SHADOW & EFFECTS =====
  shadow: "rgba(170, 4, 4, 0.07)",
  shadowMedium: "rgba(170, 4, 4, 0.14)",
  shadowStrong: "rgba(170, 4, 4, 0.24)",
  shadowOrange: "rgba(170, 4, 4, 0.2)",
  shadowGold: "rgba(255, 204, 0, 0.25)",

  // ============================================================
  // ===== V2 — "NOIR HERO / LIGHT BODY" DESIGN LANGUAGE =========
  // Additive tokens for the premium redesign. Nothing above is
  // renamed or removed — existing screens keep working untouched.
  // ============================================================

  // ----- Hero zone (always dark, in BOTH light & dark mode) -----
  // Deep oxblood-black. Reads as "vault" / "private banking".
  heroCanvas:        "#130506",
  heroCanvasAlt:     "#1E080A",
  heroElevated:      "#260C0F",
  heroElevatedAlt:   "#310F13",
  heroHairline:      "rgba(255, 255, 255, 0.08)",
  heroHairlineBold:  "rgba(255, 255, 255, 0.16)",
  heroGlass:         "rgba(255, 255, 255, 0.06)",
  heroGlassBold:     "rgba(255, 255, 255, 0.11)",
  heroGoldVeil:      "rgba(255, 204, 0, 0.10)",
  heroRedVeil:       "rgba(170, 4, 4, 0.28)",
  heroTextPrimary:   "#FFFFFF",
  heroTextSecondary: "rgba(255, 255, 255, 0.70)",
  heroTextTertiary:  "rgba(255, 255, 255, 0.42)",
  heroTextMuted:     "rgba(255, 255, 255, 0.26)",
  heroAccent:        "#FFCC00",
  heroAccentSoft:    "rgba(255, 204, 0, 0.18)",

  // ----- Body zone (light in light mode, dark in dark mode) -----
  // Warm paper neutral — deliberately cooler/greyer than the old
  // pink-tinted #fffbfb so the new app reads differently on sight.
  canvas:            "#F6F3F2",
  canvasElevated:    "#FFFFFF",
  canvasSunken:      "#EFEAE8",
  canvasTint:        "#FBF8F7",
  hairline:          "#E7E0DE",
  hairlineBold:      "#D6CCC9",

  // ----- Editorial text ramp for the body zone -----
  inkPrimary:        "#191113",
  inkSecondary:      "#4B3E41",
  inkTertiary:       "#8A7A7D",
  inkMuted:          "#B4A7A9",

  // ----- Metal identity (used by scheme / rate surfaces) -----
  metalGold:         "#C9A227",
  metalGoldSoft:     "#F7EFD3",
  metalSilver:       "#8C9199",
  metalSilverSoft:   "#EEF0F2",
  metalPlatinum:     "#6B7C88",
  metalPlatinumSoft: "#E9EEF1",
  metalDiamond:      "#3EA0B5",
  metalDiamondSoft:  "#E2F2F6",

  // ===== GRADIENT COLORS =====
  gradient: {
    // ----- V2 hero gradients -----
    heroNoir:     ["#260C0F", "#150607", "#0C0304"],
    heroOxblood:  ["#3A0E12", "#1B0709"],
    heroEmber:    ["#4A0F12", "#1E080A", "#130506"],
    heroGoldWash: ["rgba(255,204,0,0.22)", "rgba(255,204,0,0)"],
    heroFade:     ["rgba(19,5,6,0)", "rgba(19,5,6,0.92)"],
    goldFoil:     ["#F2D06B", "#C9A227", "#F7E7A8"],
    goldEdge:     ["rgba(255,204,0,0.55)", "rgba(255,204,0,0)"],
    paperLift:    ["#FFFFFF", "#F6F3F2"],
    glassSheen:   ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.02)"],

    // Primary red gradients
    orangePrimary: ["#aa0404", "#cc0505"],
    orangeDeep: ["#7a0303", "#aa0404"],
    orangeLight: ["#cc0505", "#ee3333"],
    orangeVivid: ["#550000", "#aa0404"],
    orangeToWhite: ["#aa0404", "#fffbfb"],
    orangeToRed: ["#7a0303", "#aa0404"],

    // Gold / yellow gradients
    goldLight: ["#ffcc00", "#ffd633"],
    goldDark: ["#cc9900", "#ffcc00"],
    luxuryGold: ["#ffcc00", "#ffd633", "#ffe566"],
    shimmer: ["#ffcc00", "#ffe566", "#ffcc00"],

    // Red & Gold combinations
    orangeToGold: ["#aa0404", "#ffcc00"],
    goldToOrange: ["#ffcc00", "#aa0404"],
    elegance: ["#7a0303", "#ffcc00"],
    luxury: ["#aa0404", "#cc0505", "#ffcc00"],
    premium: ["#550000", "#aa0404", "#ffcc00"],

    // Neutral surfaces
    surface: ["#fff5f5", "#fffbfb"],
    surfaceWarm: ["#ffebe8", "#fffbfb"],
    darkSurface: ["#1a0000", "#330000"],
  },
};

// ============================================
// 📐 SIZING SYSTEM
// ============================================
export const SIZES = {
  base: 16,

  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
  xxxl: moderateScale(64),

  padding: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(32),
    container: moderateScale(5),
  },

  margin: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(32),
  },

  radius: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(32),
    full: 9999,
    card: moderateScale(16),
    button: moderateScale(12),
    input: moderateScale(10),

    // ----- V2 radii — larger, softer, more "product" than "app" -----
    tile: moderateScale(20),
    panel: moderateScale(24),
    hero: moderateScale(28),
    sheet: moderateScale(32),
    pill: 9999,
  },

  // ----- V2 layout rhythm -----
  // The old `padding.container` is 5px, which the redesign replaces
  // with a real editorial gutter. Kept separate so nothing breaks.
  layout: {
    gutter: moderateScale(20),
    gutterTight: moderateScale(16),
    gutterWide: moderateScale(24),
    section: moderateScale(32),
    sectionTight: moderateScale(24),
    block: moderateScale(14),
    hairline: 1,
  },

  font: {
    xxs: fontScale(8),
    xs: fontScale(10),
    sm: fontScale(12),
    md: fontScale(14),
    lg: fontScale(16),
    xl: fontScale(18),
    xxl: fontScale(20),
    xxxl: fontScale(24),
  },

  heading: {
    h1: fontScale(32),
    h2: fontScale(28),
    h3: fontScale(24),
    h4: fontScale(20),
    h5: fontScale(18),
    h6: fontScale(16),
  },

  icon: {
    xs: moderateScale(12),
    sm: moderateScale(16),
    md: moderateScale(20),
    lg: moderateScale(24),
    xl: moderateScale(28),
    xxl: moderateScale(32),
    xxxl: moderateScale(48),
    xxxxl: moderateScale(64),
  },

  screen: {
    width,
    height,
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 414,
    isLargeDevice: width >= 414,
    isTablet: width >= 768,
  },

  button: {
    sm: moderateScale(36),
    md: moderateScale(44),
    lg: moderateScale(52),
    xl: moderateScale(60),
    height: {
      sm: moderateScale(36),
      md: moderateScale(48),
      lg: moderateScale(56),
    },
  },

  input: {
    sm: moderateScale(36),
    md: moderateScale(44),
    lg: moderateScale(52),
    height: moderateScale(48),
  },

  card: {
    padding: moderateScale(16),
    paddingLg: moderateScale(20),
  },

  header: {
    height: Platform.OS === "ios" ? moderateScale(88) : moderateScale(56),
  },

  tabBar: {
    height: Platform.OS === "ios" ? moderateScale(84) : moderateScale(60),
  },
};

// ============================================
// 🔤 TYPOGRAPHY SYSTEM (POPPINS)
// ============================================
export const FONTS = {
  family: {
    thin:       "Poppins-Thin",
    extraLight: "Poppins-ExtraLight",
    light:      "Poppins-Light",
    regular:    "Poppins-Regular",
    medium:     "Poppins-Medium",
    semiBold:   "Poppins-SemiBold",
    bold:       "Poppins-Bold",
    extraBold:  "Poppins-ExtraBold",
    black:      "Poppins-Black",

    thinItalic:       "Poppins-ThinItalic",
    extraLightItalic: "Poppins-ExtraLightItalic",
    lightItalic:      "Poppins-LightItalic",
    italic:           "Poppins-Italic",
    mediumItalic:     "Poppins-MediumItalic",
    semiBoldItalic:   "Poppins-SemiBoldItalic",
    boldItalic:       "Poppins-BoldItalic",
    extraBoldItalic:  "Poppins-ExtraBoldItalic",
    blackItalic:      "Poppins-BlackItalic",

    dancing:        "DancingScript",
    dmSerif:        "DMSerif",
    domineBold:     "Domine-Bold",
    fancy:          "Fancy",
    garamond:       "Garamond",
    lato:           "Lato-Regular",
    playfair:       "PlayfairDisplay-Medium",
    trajanRegular:  "TrajanPro-Regular",
    trajanBold:     "TrajanPro-Bold",
    inter:          "InterDisplay-Medium",

    heading:  "Poppins-Bold",
    body:     "Poppins-Regular",
    bodyBold: "Poppins-SemiBold",
  },

  weight: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },

  h1: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.heading.h1,
    lineHeight: SIZES.heading.h1 * 1.2,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.heading.h2,
    lineHeight: SIZES.heading.h2 * 1.25,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.heading.h3,
    lineHeight: SIZES.heading.h3 * 1.3,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.heading.h4,
    lineHeight: SIZES.heading.h4 * 1.3,
    color: COLORS.textPrimary,
  },
  h5: {
    fontFamily: "Poppins-Medium",
    fontSize: SIZES.heading.h5,
    lineHeight: SIZES.heading.h5 * 1.4,
    color: COLORS.textPrimary,
  },
  h6: {
    fontFamily: "Poppins-Medium",
    fontSize: SIZES.heading.h6,
    lineHeight: SIZES.heading.h6 * 1.4,
    color: COLORS.textPrimary,
  },

  bodyLarge: {
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.lg,
    lineHeight: SIZES.font.lg * 1.5,
    color: COLORS.textPrimary,
  },
  body: {
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.5,
    color: COLORS.textPrimary,
  },
  bodyMedium: {
    fontFamily: "Poppins-Medium",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.5,
    color: COLORS.textPrimary,
  },
  bodySmall: {
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.sm,
    lineHeight: SIZES.font.sm * 1.5,
    color: COLORS.textSecondary,
  },
  bodyBold: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.5,
    color: COLORS.textPrimary,
  },

  label: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.sm,
    lineHeight: SIZES.font.sm * 1.4,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  labelUppercase: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.sm,
    lineHeight: SIZES.font.sm * 1.4,
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  caption: {
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.xs,
    lineHeight: SIZES.font.xs * 1.4,
    color: COLORS.textSecondary,
  },
  captionBold: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.xs,
    lineHeight: SIZES.font.xs * 1.4,
    color: COLORS.textPrimary,
  },

  button: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.3,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  buttonLarge: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.font.lg,
    lineHeight: SIZES.font.lg * 1.3,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontFamily: "Poppins-Medium",
    fontSize: SIZES.font.sm,
    lineHeight: SIZES.font.sm * 1.3,
    color: COLORS.white,
  },

  orangeHeading: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.heading.h2,
    lineHeight: SIZES.heading.h2 * 1.25,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  orangeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.5,
    color: COLORS.primary,
  },
  goldHeading: {
    fontFamily: "Poppins-Bold",
    fontSize: SIZES.heading.h2,
    lineHeight: SIZES.heading.h2 * 1.25,
    color: COLORS.goldPrimary,
    letterSpacing: -0.3,
  },
  goldText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.5,
    color: COLORS.goldPrimary,
  },

  // ============================================================
  // V2 EDITORIAL TYPOGRAPHY
  // Big, tight, low-contrast-weight display numerals for balances
  // and rates; wide-tracked micro caps for section eyebrows.
  // ============================================================
  displayXL: {
    fontFamily: "Poppins-Bold",
    fontSize: fontScale(44),
    lineHeight: fontScale(44) * 1.06,
    letterSpacing: -1.6,
    color: COLORS.textPrimary,
  },
  displayLg: {
    fontFamily: "Poppins-Bold",
    fontSize: fontScale(36),
    lineHeight: fontScale(36) * 1.08,
    letterSpacing: -1.2,
    color: COLORS.textPrimary,
  },
  displayMd: {
    fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(28),
    lineHeight: fontScale(28) * 1.12,
    letterSpacing: -0.8,
    color: COLORS.textPrimary,
  },
  displaySm: {
    fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(22),
    lineHeight: fontScale(22) * 1.16,
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  /** Wide-tracked micro caps — section eyebrows, table headers */
  eyebrow: {
    fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(10),
    lineHeight: fontScale(10) * 1.4,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.textTertiary,
  },
  /** Smallest legible metadata — timestamps, footnotes */
  micro: {
    fontFamily: "Poppins-Regular",
    fontSize: fontScale(11),
    lineHeight: fontScale(11) * 1.35,
    letterSpacing: 0.1,
    color: COLORS.textTertiary,
  },
  microBold: {
    fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(11),
    lineHeight: fontScale(11) * 1.35,
    letterSpacing: 0.2,
    color: COLORS.textPrimary,
  },
  /** Tabular-ish numerals for money rows */
  numeral: {
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.lg,
    lineHeight: SIZES.font.lg * 1.3,
    letterSpacing: -0.3,
    color: COLORS.textPrimary,
  },
  numeralSm: {
    fontFamily: "Poppins-Medium",
    fontSize: SIZES.font.md,
    lineHeight: SIZES.font.md * 1.3,
    letterSpacing: -0.2,
    color: COLORS.textPrimary,
  },
};

// ============================================
// 🎭 SHADOWS
// ============================================
export const SHADOWS = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  orange: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  orangeStrong: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: COLORS.goldPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goldStrong: {
    shadowColor: COLORS.goldPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  // ----- V2 shadows — wide, low-opacity, "floating paper" -----
  hairline: {
    shadowColor: "#191113",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  lift: {
    shadowColor: "#191113",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  float: {
    shadowColor: "#191113",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  heroLift: {
    shadowColor: "#0C0304",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 34,
    elevation: 14,
  },
  goldGlow: {
    shadowColor: COLORS.goldPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 8,
  },
  bar: {
    shadowColor: "#191113",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 16,
  },
};

// ============================================
// 📱 DEVICE BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  small: width < 375,
  medium: width >= 375 && width < 768,
  large: width >= 768,
  tablet: width >= 768,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 768,
  isLargeDevice: width >= 768,
  isTablet: width >= 768,
};

// ============================================
// 🎯 EXPORT DEFAULT THEME
// ============================================
const theme = {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  BREAKPOINTS,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
};

export default theme;
