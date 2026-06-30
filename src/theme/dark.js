import baseTheme from "./theme";

const darkTheme = {
  ...baseTheme,
  mode: "dark",
  COLORS: {
    ...baseTheme.COLORS,
    background: "#0F1419",
    backgroundSecondary: "#1A1F2E",
    backgroundTertiary: "#232937",
    card: "#1A1F2E",
    surface: "#232937",

    textPrimary: "#FFFFFF",
    textSecondary: "#B0B7C3",
    textTertiary: "#7A8494",

    border: "#2E3440",
    divider: "#2E3440",

    inputBackground: "#1A1F2E",
    inputBorder: "#2E3440",
    inputPlaceholder: "rgba(176, 183, 195, 0.6)",
  },
};

export default darkTheme;