
// theme.js
import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// ============================================
// 📏 RESPONSIVE SCALING SYSTEM
// ============================================
const guidelineBaseWidth = 375; // iPhone 11 Pro base
const guidelineBaseHeight = 812;

// Scale based on device width
const scale = (size) => (width / guidelineBaseWidth) * size;

// Scale based on device height
const verticalScale = (size) => (height / guidelineBaseHeight) * size;

// Moderate scale with configurable factor (prevents extreme scaling)
const moderateScale = (size, factor = 0.25) => {
  return size + (scale(size) - size) * factor;
};

// Font scale with pixel ratio consideration
const fontScale = (size) => {
  const scaled = moderateScale(size, 0.2);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

// ============================================
// 🎨 COLOR PALETTE - 
// ============================================
export const COLORS = {
  // ===== PRIMARY BRAND COLORS (WARM BROWN) =====
  primary: "#7B5E2A",           // Warm Brown (Main Brand)
  primaryLight: "#A0782E",      // Medium Brown
  primaryDark: "#5C3F10",       // Deep Brown
  primaryLighter: "#C9A84C",    // Champagne Gold
  primaryPale: "#FAF6EE",       // Ivory (very light cream)

  secondary: "#C9A84C",         // Champagne Gold
  secondaryLight: "#D4B96A",    // Light Champagne
  secondaryDark: "#A0782E",     // Dark Champagne
  secondaryLighter: "#E8D5A3",  // Pale Gold

  accent: "#C9A84C",            // Champagne Gold
  accentLight: "#E8D5A3",       // Pale Gold
  accentDark: "#A0782E",        // Dark Gold
  bottomGlow: "rgb(122, 90, 38)",

  // ===== NEUTRAL COLORS =====
  white: "#FFFFFF",
  black: "#000000",
  background: "#FAF6EE",         // Ivory (page background)
  backgroundSecondary: "#F5EFE0", // Warm cream
  backgroundTertiary: "#EDE3CC",  // Deeper cream
  backgroundDark: "#1A1200",      // Very dark brown-black
  backgroundOrange: "#FAF6EE",    // Reuse ivory
  backgroundGold: "#F5EFE0",      // Light gold tint
  surface: "#FAF6EE",
  card: "#FFFFFF",
  softCard: "#F5EFE0",
  overlay: "rgba(123, 94, 42, 0.7)",    // Brown overlay
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayGold: "rgba(201, 168, 76, 0.1)",
  overlayOrange: "rgba(123, 94, 42, 0.1)",

  // ===== TEXT COLORS =====
  textPrimary: "#2E1A05",        // Very dark brown (readable)
  textSecondary: "#6B5740",      // Warm medium brown
  textTertiary: "#A08060",       // Light warm brown
  textDisabled: "#D4C5A9",       // Muted warm gray
  textInverse: "#FFFFFF",        // White on dark
  textOrange: "#7B5E2A",         // Reuse primary brown
  textOrangeDark: "#5C3F10",     // Deep brown text
  textGold: "#C9A84C",           // Champagne gold text
  textGoldDark: "#A0782E",       // Dark gold text

  // ===== GRAY SCALE (warm-tinted) =====
  gray50: "#FAF8F5",
  gray100: "#F2EDE4",
  gray200: "#E5DBD0",
  gray300: "#D4C5A9",
  gray400: "#A08060",
  gray500: "#6B5740",
  gray600: "#4E3B25",
  gray700: "#3A2810",
  gray800: "#2E1A05",
  gray900: "#1A0E00",

  // ===== BROWN VARIATIONS =====
  orangeLight: "#FAF6EE",         // Ivory
  orangeMedium: "#C9A84C",        // Champagne
  orangeDark: "#5C3F10",          // Deep brown
  orangeVivid: "#A0782E",         // Medium brown vivid
  orangeIce: "#EDE3CC",           // Cream
  orangeSoft: "#E8D5A3",          // Pale gold
  orangeDeep: "#3E2A05",          // Darkest brown

  // ===== BORDER & DIVIDER =====
  border: "#E5DBD0",
  borderLight: "#F2EDE4",
  borderMedium: "#D4C5A9",
  borderDark: "#4E3B25",
  borderOrange: "#7B5E2A",
  borderGold: "#C9A84C",
  divider: "#E5DBD0",

  // ===== INPUT COLORS =====
  inputBackground: "#FAF8F5",
  inputBorder: "#E5DBD0",
  inputPlaceholder: "rgba(107, 87, 64, 0.5)",
  inputFocused: "#7B5E2A",        // Brown focus ring
  inputFocusedAlt: "#C9A84C",     // Gold alternative

  // ===== STATUS COLORS =====
  success: "#4E7A34",
  successLight: "#7BAE3A",
  successDark: "#3A5A22",
  error: "#C0392B",
  errorLight: "#E74C3C",
  errorDark: "#922B21",
  warning: "#C9A84C",
  warningLight: "#D4B96A",
  warningDark: "#A0782E",
  info: "#2E6DA4",
  infoLight: "#5B9BD5",
  infoDark: "#1A4A7A",
  disabled: "#F2EDE4",

  // ===== GOLD VARIATIONS =====
  goldPrimary: "#C9A84C",         // Champagne Gold
  goldSecondary: "#D4B96A",       // Light Champagne
  goldTertiary: "#E8D5A3",        // Pale Gold
  goldBronze: "#A0622A",          // Bronze
  goldRose: "#B87060",            // Rose tint
  goldLight: "#F5EFE0",           // Very light gold
  goldMedium: "#C9A84C",          // Medium champagne
  goldDark: "#A0782E",            // Dark champagne

  // ===== TRANSPARENT COLORS =====
  transparent: "transparent",
  // Brown (primary) opacity
  orangeOpacity10: "rgba(123, 94, 42, 0.1)",
  orangeOpacity20: "rgba(123, 94, 42, 0.2)",
  orangeOpacity30: "rgba(123, 94, 42, 0.3)",
  orangeOpacity40: "rgba(123, 94, 42, 0.4)",
  orangeOpacity50: "rgba(123, 94, 42, 0.5)",
  orangeOpacity60: "rgba(123, 94, 42, 0.6)",
  orangeOpacity70: "rgba(123, 94, 42, 0.7)",
  orangeOpacity80: "rgba(123, 94, 42, 0.8)",
  orangeOpacity90: "rgba(123, 94, 42, 0.9)",
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
  goldOpacity10: "rgba(201, 168, 76, 0.1)",
  goldOpacity20: "rgba(201, 168, 76, 0.2)",
  goldOpacity30: "rgba(201, 168, 76, 0.3)",
  goldOpacity50: "rgba(201, 168, 76, 0.5)",

  // ===== SHADOW & EFFECTS =====
  shadow: "rgba(46, 26, 5, 0.08)",
  shadowMedium: "rgba(46, 26, 5, 0.15)",
  shadowStrong: "rgba(46, 26, 5, 0.25)",
  shadowOrange: "rgba(123, 94, 42, 0.2)",
  shadowGold: "rgba(201, 168, 76, 0.25)",

  // ===== GRADIENT COLORS =====
  gradient: {
    // Primary brown gradients
    orangePrimary: ["#7B5E2A", "#A0782E"],      // Brown to medium brown (replaces orange header)
    orangeDeep: ["#5C3F10", "#7B5E2A"],          // Deep to medium brown
    orangeLight: ["#A0782E", "#C9A84C"],         // Brown to champagne
    orangeVivid: ["#5C3F10", "#A0782E"],         // Deep vivid brown
    orangeToWhite: ["#7B5E2A", "#FAF6EE"],       // Brown to ivory
    orangeToRed: ["#7B5E2A", "#C9A84CE0"],       // Brown to champagne

    // Gold / champagne gradients
    goldLight: ["#C9A84C", "#D4B96A"],           // Champagne gradient
    goldDark: ["#A0782E", "#C9A84C"],            // Dark to light champagne
    luxuryGold: ["#C9A84C", "#D4B96A", "#E8D5A3"], // Full luxury champagne
    shimmer: ["#C9A84C", "#E8D5A3", "#C9A84C"],    // Shimmer effect

    // Brown & Gold combinations
    orangeToGold: ["#7B5E2A", "#C9A84C"],        // Brown to champagne gold
    goldToOrange: ["#C9A84C", "#7B5E2A"],        // Champagne to brown
    elegance: ["#5C3F10", "#C9A84C"],            // Deep brown to champagne
    luxury: ["#7B5E2A", "#C9A84C", "#D4B96A"],  // Full luxury palette
    premium: ["#5C3F10", "#7B5E2A", "#C9A84C"], // Deep to champagne

    // Neutral surfaces
    surface: ["#F5EFE0", "#FAF6EE"],             // Warm ivory surface
    surfaceWarm: ["#EDE3CC", "#FAF6EE"],          // Deeper cream surface
    darkSurface: ["#1A0E00", "#2E1A05"],          // Dark brown surface
  },
};

// ============================================
// 📐 SIZING SYSTEM
// ============================================
export const SIZES = {
  // ===== BASE SIZE =====
  base: 16,

  // ===== SPACING SCALE =====
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
  xxxl: moderateScale(64),

  // ===== PADDING & MARGIN =====
  padding: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(32),
    container: moderateScale(5), // Standard container padding
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

  // ===== BORDER RADIUS =====
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
  },

  // ===== FONT SIZES =====
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

  // ===== HEADING SIZES =====
  heading: {
    h1: fontScale(32),
    h2: fontScale(28),
    h3: fontScale(24),
    h4: fontScale(20),
    h5: fontScale(18),
    h6: fontScale(16),
  },

  // ===== ICON SIZES =====
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

  // ===== DIMENSIONS =====
  screen: {
    width,
    height,
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 414,
    isLargeDevice: width >= 414,
    isTablet: width >= 768,
  },

  // ===== COMPONENT SIZES =====
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
  // ===== FONT FAMILIES =====
  family: {
    // Poppins weights
    thin:       "Poppins-Thin",
    extraLight: "Poppins-ExtraLight",
    light:      "Poppins-Light",
    regular:    "Poppins-Regular",
    medium:     "Poppins-Medium",
    semiBold:   "Poppins-SemiBold",
    bold:       "Poppins-Bold",
    extraBold:  "Poppins-ExtraBold",
    black:      "Poppins-Black",

    // Poppins italics
    thinItalic:       "Poppins-ThinItalic",
    extraLightItalic: "Poppins-ExtraLightItalic",
    lightItalic:      "Poppins-LightItalic",
    italic:           "Poppins-Italic",
    mediumItalic:     "Poppins-MediumItalic",
    semiBoldItalic:   "Poppins-SemiBoldItalic",
    boldItalic:       "Poppins-BoldItalic",
    extraBoldItalic:  "Poppins-ExtraBoldItalic",
    blackItalic:      "Poppins-BlackItalic",

    // Other fonts
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

    // Aliases
    heading:  "Poppins-Bold",
    body:     "Poppins-Regular",
    bodyBold: "Poppins-SemiBold",
  },

  // ===== FONT WEIGHTS =====
  weight: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },

  // ===== HEADING STYLES =====
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

  // ===== BODY TEXT STYLES =====
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

  // ===== LABEL & CAPTION =====
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

  // ===== BUTTON TEXT =====
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

  // ===== SPECIAL STYLES (ORANGE & GOLD TEXT) =====
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
  // Orange shadow for brand feel
  orange: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orangeStrong: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  // Gold shadow for accents
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