import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#12141C",
        surface: "#1B1E2A",
        surface2: "#232739",
        ink: "#F2F0E9",
        muted: "#8A8FA3",
        glow: "#F2A93B",
        glowDim: "#7A5A24",
        movie: "#5B8DEF",
        danger: "#E5637A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
