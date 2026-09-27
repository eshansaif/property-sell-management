import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F6F2",
        surface: "#FFFFFF",
        "surface-muted": "#F0EEE7",
        border: "#E3DFD4",
        primary: {
          DEFAULT: "#1E362E",
          hover: "#16281F",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#A9793E",
          hover: "#8F6531",
          foreground: "#FFFFFF",
        },
        text: {
          primary: "#1B2320",
          secondary: "#5B6560",
        },
        success: "#2F6F4E",
        warning: "#A6752E",
        error: "#B0402C",
        info: "#2E5C82",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        "8xl": "90rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27, 35, 32, 0.06), 0 1px 1px rgba(27, 35, 32, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
