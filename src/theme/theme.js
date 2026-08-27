
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
// Primary   Brand Red       #AA0404   Primary Dark  Deep Red     #7A0303
// Secondary Golden Yellow   #F5B800   Accent        Ember Red    #8A0303
// Background Warm Ivory     #F6E9DD   Surface       White Cream  #FFF8F2
// Text      Dark Brown      #3A2A22   Border        Soft Beige   #E7D4C4
// ============================================
export const COLORS = {
  // ===== PRIMARY BRAND COLORS (RED) =====
  primary: "#AA0404",
  primaryLight: "#C41E1E",
  primaryDark: "#7A0303",
  primaryLighter: "#D94A4A",
  primaryPale: "#FBE8E8",
  // #AA0404 is dark enough to clear WCAG AA (4.5:1+) on Warm Ivory even
  // at full strength, so primaryInk/primaryFill can stay close to primary.
  //   primaryInk   — brand colour for LABELS / LINKS on a light surface
  //   primaryFill  — brand colour for SOLID BUTTONS with a white label
  // Use `primary` for large display type, icons, rules and fills only.
  primaryInk: "#8A0303",
  primaryFill: "#AA0404",

  secondary: "#F5B800",
  secondaryLight: "#F7C933",
  secondaryDark: "#C99400",
  secondaryLighter: "#F9D666",

  accent: "#7A0303",
  accentLight: "#953030",
  accentDark: "#5C0202",
  bottomGlow: "rgb(170, 4, 4)",

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
  overlay: "rgba(170, 4, 4, 0.7)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayGold: "rgba(245, 184, 0, 0.1)",
  overlayOrange: "rgba(170, 4, 4, 0.1)",

  // ============================================================
  // ===== TEXT *ON* COLOURED SURFACES ==========================
  // Never write `color: COLORS.white` for text again. White is a fixed
  // value that does not follow the theme, so the moment a fill changes
  // the label silently breaks. Use the matching token below and the
  // text updates everywhere automatically.
  //
  //   fill you're drawing on          ->  text token
  //   primary / primaryFill / Dark    ->  textOnPrimary
  //   accent (Ember Red)              ->  textOnAccent
  //   secondary / golden yellow       ->  textOnGold
  //   success / error / info fills    ->  textOnStatus
  //   any dark surface or photo       ->  textOnDark  (+ Muted)
  // ============================================================
  textOnPrimary:     "#FFFFFF",
  /** Secondary text on a brand fill. Pure-white alpha, NOT warm ivory —
   *  red is a mid-dark tone, so a warm tint loses too much contrast. */
  textOnPrimaryMuted: "rgba(255, 255, 255, 0.82)",
  textOnAccent:      "#FFFFFF",
  textOnGold:        "#3A2A22",
  textOnStatus:      "#FFFFFF",
  /** ONLY for genuinely dark surfaces (espresso, photo overlays).
   *  Do not use on red/primary fills — those need textOnPrimary. */
  textOnDark:        "#F6E9DD",
  textOnDarkMuted:   "rgba(246, 233, 221, 0.72)",
  textOnDarkFaint:   "rgba(246, 233, 221, 0.45)",

  // ===== TEXT COLORS =====
  textPrimary: "#3A2A22",
  textSecondary: "#5C4536",
  textTertiary: "#8A6F5D",
  textDisabled: "#D9C6B8",
  textInverse: "#FFFFFF",
  textOrange: "#AA0404",
  textOrangeDark: "#7A0303",
  textGold: "#C99400",
  textGoldDark: "#9C7400",

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

  // ===== RED VARIATIONS (replaces "orange") =====
  orangeLight: "#F6E9DD",
  orangeMedium: "#D94A4A",
  orangeDark: "#7A0303",
  orangeVivid: "#AA0404",
  orangeIce: "#F1DFCF",
  orangeSoft: "#E48A8A",
  orangeDeep: "#5C0202",

  // ===== BORDER & DIVIDER =====
  border: "#E7D4C4",
  borderLight: "#F1E4D6",
  borderMedium: "#D9C2AC",
  borderDark: "#7A0303",
  borderOrange: "#AA0404",
  borderGold: "#F5B800",
  divider: "#E7D4C4",

  // ===== INPUT COLORS =====
  inputBackground: "#FFF8F2",
  inputBorder: "#E7D4C4",
  inputPlaceholder: "rgba(170, 4, 4, 0.35)",
  inputFocused: "#AA0404",
  inputFocusedAlt: "#F5B800",

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
  // Error/danger kept as its own distinct red-family shade so status
  // messages stay visually distinguishable from brand-red primary UI.
  error: "#8F1D24",
  errorLight: "#A83840",
  errorDark: "#6B1519",
  warning: "#C99400",
  warningLight: "#F5B800",
  warningDark: "#9C7400",
  info: "#1a5fa4",
  infoLight: "#2e86de",
  infoDark: "#0e3d6e",
  disabled: "#F3ECE6",

  // ===== GOLDEN YELLOW VARIATIONS =====
  goldPrimary: "#F5B800",
  goldSecondary: "#F7C933",
  goldTertiary: "#F9D666",
  goldBronze: "#C99400",
  goldRose: "#E0A020",
  goldLight: "#FBF3E8",
  goldMedium: "#F5B800",
  goldDark: "#C99400",

  // ===== TRANSPARENT COLORS =====
  transparent: "transparent",
  // Brand red (primary) opacity
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
  // Golden yellow opacity
  goldOpacity10: "rgba(245, 184, 0, 0.1)",
  goldOpacity20: "rgba(245, 184, 0, 0.2)",
  goldOpacity30: "rgba(245, 184, 0, 0.3)",
  goldOpacity50: "rgba(245, 184, 0, 0.5)",

  // ===== SHADOW & EFFECTS =====
  shadow: "rgba(170, 4, 4, 0.07)",
  shadowMedium: "rgba(170, 4, 4, 0.14)",
  shadowStrong: "rgba(170, 4, 4, 0.24)",
  shadowOrange: "rgba(170, 4, 4, 0.2)",
  shadowGold: "rgba(245, 184, 0, 0.25)",

  // ============================================================
  // ===== V2 — "WARM HERO / IVORY BODY" DESIGN LANGUAGE =========
  // Additive tokens for the premium redesign. Nothing above is
  // renamed or removed — existing screens keep working untouched.
  // ============================================================

  // ----- Hero zone -------------------------------------------------
  // A RICH BRAND RED band. This is a saturated brand colour, not a
  // neutral: it sits well clear of the Warm Ivory body, so the header
  // and the page read as genuinely different zones.
  //
  // The depth is chosen so that BOTH pure white AND Golden Yellow
  // clear 4.5:1 on the lightest gradient stop.
  heroCanvas:        "#8A0303",
  heroCanvasAlt:     "#7A0303",
  // Panels sitting ON the header are inset (darker), so they read as
  // recessed rather than floating.
  heroElevated:      "#6B0202",
  heroElevatedAlt:   "#5C0202",
  // Back to white-on-colour alpha now the hero carries a brand fill.
  heroHairline:      "rgba(255, 255, 255, 0.16)",
  heroHairlineBold:  "rgba(255, 255, 255, 0.30)",
  heroGlass:         "rgba(255, 255, 255, 0.10)",
  heroGlassBold:     "rgba(255, 255, 255, 0.18)",
  heroGoldVeil:      "rgba(245, 184, 0, 0.16)",
  heroRedVeil:       "rgba(122, 3, 3, 0.22)",
  heroTextPrimary:   "#FFFFFF",
  heroTextSecondary: "rgba(255, 255, 255, 0.86)",
  heroTextTertiary:  "rgba(255, 255, 255, 0.70)",
  heroTextMuted:     "rgba(255, 255, 255, 0.52)",
  // Golden Yellow is the accent — it reads beautifully on brand red
  // and clears AA at the lightest gradient stop.
  heroAccent:        "#F5B800",
  heroAccentSoft:    "rgba(245, 184, 0, 0.20)",
  /** Outline for unfilled PIN dots / empty control boundaries (3.5:1). */
  heroDotIdle:       "rgba(255, 255, 255, 0.55)",
  /** Label colour to sit ON heroAccent (badges, filled markers). */
  heroOnAccent:      "#3A2A22",

  // ----- Semantic colours FOR the hero zone -------------------------
  // Lifted variants, because the hero is now a deep brand-red fill.
  // dark.js keeps the same lifted set, so components can just use
  // heroSuccess/heroWarning/… without an isDark branch.
  heroSuccess:       "#7FCB94",
  heroWarning:       "#F5D666",
  // Light enough to clear 4.5:1 on the brand-red hero.
  heroDanger:        "#F7BEC2",
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
    // ----- V2 hero gradients — rich brand-red band -----
    // `heroNoir` keeps its name so no component import has to change.
    // Every stop stays dark enough that white AND golden yellow both
    // clear AA anywhere in the sweep.
    heroNoir:     ["#D94A4A", "#7A0303", "#5C0202"],
    heroOxblood:  ["#953030", "#6B0202"],
    heroEmber:    ["#8A0303", "#6B0202", "#5C0202"],
    heroGoldWash: ["rgba(245,184,0,0.28)", "rgba(245,184,0,0)"],
    heroFade:     ["rgba(138,3,3,0)", "rgba(138,3,3,0.95)"],
    goldFoil:     ["#F9D666", "#F5B800", "#FBE38C"],
    goldEdge:     ["rgba(170,4,4,0.45)", "rgba(170,4,4,0)"],
    paperLift:    ["#FFFFFF", "#F6E9DD"],
    glassSheen:   ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.02)"],

    // Primary red gradients
    orangePrimary: ["#AA0404", "#C41E1E"],
    orangeDeep: ["#7A0303", "#AA0404"],
    orangeLight: ["#C41E1E", "#D94A4A"],
    orangeVivid: ["#5C0202", "#AA0404"],
    orangeToWhite: ["#AA0404", "#FFF8F2"],
    orangeToRed: ["#7A0303", "#AA0404"],

    // Golden yellow gradients
    goldLight: ["#F5B800", "#F7C933"],
    goldDark: ["#C99400", "#F5B800"],
    luxuryGold: ["#F5B800", "#F7C933", "#F9D666"],
    shimmer: ["#F5B800", "#F9D666", "#F5B800"],

    // Red & Yellow combinations
    orangeToGold: ["#AA0404", "#F5B800"],
    goldToOrange: ["#F5B800", "#AA0404"],
    elegance: ["#7A0303", "#F5B800"],
    luxury: ["#AA0404", "#C41E1E", "#F5B800"],
    premium: ["#5C0202", "#AA0404", "#F5B800"],
    premium1: ["#97760a", "#F5B800"],

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
