import baseTheme from "./theme";

const lightTheme = {
  ...baseTheme,
  mode: "light",
  COLORS: {
    ...baseTheme.COLORS,
    backgroundSecondary: "#F8F9FB",
    card: "#FFFFFF",
    textPrimary: "#1A1D23",
    textSecondary: "#5F6368",
    border: "#E5E7EB",
  },
};

export default lightTheme;