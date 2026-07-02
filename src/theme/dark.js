import baseTheme from "./theme";

const darkTheme = {
  ...baseTheme,
  mode: "dark",
  COLORS: {
    ...baseTheme.COLORS,
    background: "#1a0000",
    backgroundSecondary: "#2a0808",
    backgroundTertiary: "#3d1515",
    card: "#2a0808",
    surface: "#3d1515",

    textPrimary: "#FFFFFF",
    textSecondary: "#e8c0c0",
    textTertiary: "#b08080",

    border: "#5c2020",
    divider: "#5c2020",

    inputBackground: "#2a0808",
    inputBorder: "#5c2020",
    inputPlaceholder: "rgba(232, 192, 192, 0.5)",
  },
};

export default darkTheme;