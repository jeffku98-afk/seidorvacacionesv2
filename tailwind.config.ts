import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
  content: [
    // In Tailwind v4 with @config, content is auto-detected for your project files.
    // We only need to specify node_modules paths for HeroUI components.
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seidor: {
          50: "#E1EDF9",
          100: "#C5DCF4",
          200: "#7BBCF8",
          300: "#5F7AD7",
          400: "#4464E2",
          500: "#3447B0",
          600: "#2A3890",
          700: "#1F2A6B",
          800: "#1A2240",
          900: "#0F1525",
        },
        muted: "#8490B4",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#3447B0", foreground: "#FFFFFF" },
            secondary: { DEFAULT: "#4464E2", foreground: "#FFFFFF" },
            focus: "#4464E2",
          },
        },
      },
    }),
  ],
};

export default config;
