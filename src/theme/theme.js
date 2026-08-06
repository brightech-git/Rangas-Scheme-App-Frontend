
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
// Primary   Cinnamon Brown  #C17436   Primary Dark  Burnt Brown  #A95F28
// Secondary Champagne Gold  #D8C3AF   Accent        Deep Maroon  #8F1D24
// Background Warm Ivory     #F6E9DD   Surface       White Cream  #FFF8F2
// Text      Dark Brown      #3A2A22   Border        Soft Beige   #E7D4C4
// ============================================
export const COLORS = {
  // ===== PRIMARY BRAND COLORS (CINNAMON BROWN) =====
  primary: "#C17436",
  primaryLight: "#D18F5A",
  primaryDark: "#A95F28",
  primaryLighter: "#DDA878",
  primaryPale: "#FBF1E8",
  // Cinnamon at full strength is only 3.03:1 on Warm Ivory, so it fails
  // WCAG AA for small text. These two are the accessible substitutes:
  //   primaryInk   — brand colour for LABELS / LINKS on a light surface (4.72:1)
  //   primaryFill  — brand colour for SOLID BUTTONS with a white label (4.82:1)
  // Use `primary` for large display type, icons, rules and fills only.
  primaryInk: "#9C5522",
  primaryFill: "#A95F28",

  secondary: "#D8C3AF",
  secondaryLight: "#E4D3C3",
  secondaryDark: "#C2A98D",
  secondaryLighter: "#EEE1D4",

  accent: "#8F1D24",
  accentLight: "#A83840",
  accentDark: "#6B1519",
  bottomGlow: "rgb(143, 29, 36)",

  // ===== NEUTRAL COLORS =====
  white: "#FFFFFF",
  black: "#000000",
  background: "#F6E9DD",
  backgroundSecondary: "#F1DFCF",
  backgroundTertiary: "#EAD2BC",
  backgroundDark: "#241209",
  backgroundOrange: "#F6E9DD",
  backgroundGold: "#FBF3E8",
  surface: "#FFF8F2",
  card: "#FFF8F2",
  softCard: "#F6E9DD",
  overlay: "rgba(143, 29, 36, 0.7)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayGold: "rgba(216, 195, 175, 0.1)",
  overlayOrange: "rgba(193, 116, 54, 0.1)",

  // ============================================================
  // ===== TEXT *ON* COLOURED SURFACES ==========================
  // Never write `color: COLORS.white` for text again. White is a fixed
  // value that does not follow the theme, so the moment a fill changes
  // the label silently breaks. Use the matching token below and the
  // text updates everywhere automatically.
  //
  //   fill you're drawing on          ->  text token
  //   primary / primaryFill / Dark    ->  textOnPrimary
  //   accent (Deep Maroon)            ->  textOnAccent
  //   gold foil / champagne           ->  textOnGold
  //   success / error / info fills    ->  textOnStatus
  //   any dark surface or photo       ->  textOnDark  (+ Muted)
  // ============================================================
  textOnPrimary:     "#FFFFFF",
  /** Secondary text on a brand fill. Pure-white alpha, NOT warm ivory —
   *  cinnamon is a mid-tone, so a warm tint loses too much contrast. */
  textOnPrimaryMuted: "rgba(255, 255, 255, 0.82)",
  textOnAccent:      "#FFFFFF",
  textOnGold:        "#3A2A22",
  textOnStatus:      "#FFFFFF",
  /** ONLY for genuinely dark surfaces (espresso, photo overlays).
   *  Do not use on cinnamon/primary fills — those need textOnPrimary. */
  textOnDark:        "#F6E9DD",
  textOnDarkMuted:   "rgba(246, 233, 221, 0.72)",
  textOnDarkFaint:   "rgba(246, 233, 221, 0.45)",

  // ===== TEXT COLORS =====
  textPrimary: "#3A2A22",
  textSecondary: "#5C4536",
  textTertiary: "#8A6F5D",
  textDisabled: "#D9C6B8",
  textInverse: "#FFFFFF",
  textOrange: "#C17436",
  textOrangeDark: "#A95F28",
  textGold: "#A98C68",
  textGoldDark: "#8A7052",

  // ===== GRAY SCALE (neutral, warm-tinted) =====
  gray50: "#FAF7F5",
  gray100: "#F3ECE6",
  gray200: "#E7D4C4",
  gray300: "#D9C2AC",
  gray400: "#B99878",
  gray500: "#977150",
  gray600: "#74563C",
  gray700: "#513C29",
  gray800: "#362619",
  gray900: "#241209",

  // ===== CINNAMON VARIATIONS (replaces "orange") =====
  orangeLight: "#F6E9DD",
  orangeMedium: "#DDA878",
  orangeDark: "#A95F28",
  orangeVivid: "#C17436",
  orangeIce: "#F1DFCF",
  orangeSoft: "#E4B992",
  orangeDeep: "#6B4520",

  // ===== BORDER & DIVIDER =====
  border: "#E7D4C4",
  borderLight: "#F1E4D6",
  borderMedium: "#D9C2AC",
  borderDark: "#A95F28",
  borderOrange: "#C17436",
  borderGold: "#D8C3AF",
  divider: "#E7D4C4",

  // ===== INPUT COLORS =====
  inputBackground: "#FFF8F2",
  inputBorder: "#E7D4C4",
  inputPlaceholder: "rgba(193, 116, 54, 0.35)",
  inputFocused: "#C17436",
  inputFocusedAlt: "#D8C3AF",

  // ===== STATUS COLORS =====
  // Subtle status backgrounds (for chips, badges, banners) — pair with the solid color for text/icon
  // Warm-shifted so chips/banners sit on Warm Ivory without going cool
  successBg: "#E6F0E4",
  warningBg: "#F7EEDC",
  errorBg: "#F7E4E4",
  infoBg: "#E6EDF3",

  success: "#356B42",
  successLight: "#57A169",
  successDark: "#2C5A38",
  error: "#8F1D24",
  errorLight: "#A83840",
  errorDark: "#6B1519",
  warning: "#B8935F",
  warningLight: "#D8C3AF",
  warningDark: "#8A6F42",
  info: "#1a5fa4",
  infoLight: "#2e86de",
  infoDark: "#0e3d6e",
  disabled: "#F3ECE6",

  // ===== CHAMPAGNE / GOLD VARIATIONS =====
  goldPrimary: "#D8C3AF",
  goldSecondary: "#E4D3C3",
  goldTertiary: "#EEE1D4",
  goldBronze: "#A98C68",
  goldRose: "#C79572",
  goldLight: "#FBF3E8",
  goldMedium: "#D8C3AF",
  goldDark: "#B8935F",

  // ===== TRANSPARENT COLORS =====
  transparent: "transparent",
  // Cinnamon (primary) opacity
  orangeOpacity10: "rgba(193, 116, 54, 0.1)",
  orangeOpacity20: "rgba(193, 116, 54, 0.2)",
  orangeOpacity30: "rgba(193, 116, 54, 0.3)",
  orangeOpacity40: "rgba(193, 116, 54, 0.4)",
  orangeOpacity50: "rgba(193, 116, 54, 0.5)",
  orangeOpacity60: "rgba(193, 116, 54, 0.6)",
  orangeOpacity70: "rgba(193, 116, 54, 0.7)",
  orangeOpacity80: "rgba(193, 116, 54, 0.8)",
  orangeOpacity90: "rgba(193, 116, 54, 0.9)",
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
  // Champagne gold opacity
  goldOpacity10: "rgba(216, 195, 175, 0.1)",
  goldOpacity20: "rgba(216, 195, 175, 0.2)",
  goldOpacity30: "rgba(216, 195, 175, 0.3)",
  goldOpacity50: "rgba(216, 195, 175, 0.5)",

  // ===== SHADOW & EFFECTS =====
  shadow: "rgba(193, 116, 54, 0.07)",
  shadowMedium: "rgba(193, 116, 54, 0.14)",
  shadowStrong: "rgba(193, 116, 54, 0.24)",
  shadowOrange: "rgba(193, 116, 54, 0.2)",
  shadowGold: "rgba(216, 195, 175, 0.25)",

  // ============================================================
  // ===== V2 — "WARM HERO / IVORY BODY" DESIGN LANGUAGE =========
  // Additive tokens for the premium redesign. Nothing above is
  // renamed or removed — existing screens keep working untouched.
  // ============================================================

  // ----- Hero zone -------------------------------------------------
  // A RICH CINNAMON band — the Burnt Brown family pushed one step
  // deeper. This is a saturated brand colour, not a neutral: it sits
  // 6.4:1 away from the Warm Ivory body, so the header and the page
  // read as genuinely different zones. (A sand-toned header measured
  // only 1.13:1 against the body — effectively invisible.)
  //
  // The depth is chosen so that BOTH pure white AND Champagne Gold
  // clear 4.5:1 on the lightest gradient stop. Lighten `heroCanvas`
  // past #7F4416 and the champagne accent starts failing.
  heroCanvas:        "#7F4416",
  heroCanvasAlt:     "#753E14",
  // Panels sitting ON the header are inset (darker), so they read as
  // recessed rather than floating.
  heroElevated:      "#6B3712",
  heroElevatedAlt:   "#5C2F10",
  // Back to white-on-colour alpha now the hero carries a brand fill.
  heroHairline:      "rgba(255, 255, 255, 0.16)",
  heroHairlineBold:  "rgba(255, 255, 255, 0.30)",
  heroGlass:         "rgba(255, 255, 255, 0.10)",
  heroGlassBold:     "rgba(255, 255, 255, 0.18)",
  heroGoldVeil:      "rgba(216, 195, 175, 0.16)",
  heroRedVeil:       "rgba(143, 29, 36, 0.22)",
  heroTextPrimary:   "#FFFFFF",
  heroTextSecondary: "rgba(255, 255, 255, 0.86)",
  heroTextTertiary:  "rgba(255, 255, 255, 0.70)",
  heroTextMuted:     "rgba(255, 255, 255, 0.52)",
  // Champagne Gold finally gets to be the accent — it reads beautifully
  // on cinnamon and clears AA (4.50:1 at the lightest stop).
  heroAccent:        "#D8C3AF",
  heroAccentSoft:    "rgba(216, 195, 175, 0.20)",
  /** Label colour to sit ON heroAccent (badges, filled markers). */
  heroOnAccent:      "#3A2A22",

  // ----- Semantic colours FOR the hero zone -------------------------
  // Lifted variants, because the hero is now a deep cinnamon fill.
  // dark.js keeps the same lifted set, so components can just use
  // heroSuccess/heroWarning/… without an isDark branch.
  heroSuccess:       "#7FCB94",
  heroWarning:       "#DDB77F",
  heroDanger:        "#EC8F96",
  heroInfo:          "#84B7E5",

  // ----- Body zone (light in light mode, dark in dark mode) -----
  // Warm ivory neutral, matches the brand background exactly.
  canvas:            "#F6E9DD",
  canvasElevated:    "#FFF8F2",
  canvasSunken:      "#EAD2BC",
  canvasTint:        "#FBF3E8",
  hairline:          "#E7D4C4",
  hairlineBold:      "#D9C2AC",

  // ----- Editorial text ramp for the body zone -----
  inkPrimary:        "#3A2A22",
  inkSecondary:      "#5C4536",
  inkTertiary:       "#8A6F5D",
  inkMuted:          "#C4AFA0",

  // ----- Metal identity (used by scheme / rate surfaces) -----
  metalGold:         "#C2A06B",
  metalGoldSoft:     "#F7EFD3",
  metalSilver:       "#8C9199",
  metalSilverSoft:   "#EEF0F2",
  metalPlatinum:     "#6B7C88",
  metalPlatinumSoft: "#E9EEF1",
  metalDiamond:      "#3EA0B5",
  metalDiamondSoft:  "#E2F2F6",

  // ===== GRADIENT COLORS =====
  gradient: {
    // ----- V2 hero gradients — rich cinnamon brand band -----
    // `heroNoir` keeps its name so no component import has to change.
    // Every stop stays at or below #7F4416 so white AND champagne both
    // clear AA anywhere in the sweep.
    heroNoir:     ["#7F4416", "#753E14", "#663610"],
    heroOxblood:  ["#8A4A18", "#6B3712"],
    heroEmber:    ["#7F4416", "#6B3712", "#5C2F10"],
    heroGoldWash: ["rgba(216,195,175,0.28)", "rgba(216,195,175,0)"],
    heroFade:     ["rgba(127,68,22,0)", "rgba(127,68,22,0.95)"],
    goldFoil:     ["#EAD9B8", "#C2A06B", "#F2E6C8"],
    goldEdge:     ["rgba(193,116,54,0.45)", "rgba(193,116,54,0)"],
    paperLift:    ["#FFFFFF", "#F6E9DD"],
    glassSheen:   ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.02)"],

    // Primary cinnamon gradients
    orangePrimary: ["#C17436", "#D18F5A"],
    orangeDeep: ["#A95F28", "#C17436"],
    orangeLight: ["#D18F5A", "#E4A876"],
    orangeVivid: ["#6B4520", "#C17436"],
    orangeToWhite: ["#C17436", "#FFF8F2"],
    orangeToRed: ["#A95F28", "#C17436"],

    // Champagne gold gradients
    goldLight: ["#D8C3AF", "#E4D3C3"],
    goldDark: ["#C2A98D", "#D8C3AF"],
    luxuryGold: ["#D8C3AF", "#E4D3C3", "#EEE1D4"],
    shimmer: ["#D8C3AF", "#EEE1D4", "#D8C3AF"],

    // Cinnamon & Champagne combinations
    orangeToGold: ["#C17436", "#D8C3AF"],
    goldToOrange: ["#D8C3AF", "#C17436"],
    elegance: ["#A95F28", "#D8C3AF"],
    luxury: ["#C17436", "#D18F5A", "#D8C3AF"],
    premium: ["#6B4520", "#C17436", "#D8C3AF"],

    // Neutral surfaces
    surface: ["#F6E9DD", "#FFF8F2"],
    surfaceWarm: ["#EAD2BC", "#FFF8F2"],
    darkSurface: ["#241209", "#472314"],
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
    fontSize: fontScale(12),
    lineHeight: fontScale(12) * 1.35,
    letterSpacing: 0.1,
    color: COLORS.textTertiary,
  },
  microBold: {
    fontFamily: "Poppins-SemiBold",
    fontSize: fontScale(12),
    lineHeight: fontScale(12) * 1.35,
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
    shadowColor: "#3A2A22",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  lift: {
    shadowColor: "#3A2A22",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  float: {
    shadowColor: "#3A2A22",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  heroLift: {
    shadowColor: "#140A06",
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
    shadowColor: "#3A2A22",
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
