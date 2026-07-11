import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0F0F14",
        surface: "#191922",
        surface2: "#232430",
        surface3: "#2E2E3D",
        ink: "#F5F4F8",
        muted: "#9494A6",

        primary: "#F4C430",
        primarySoft: "#4A3B12",
        secondary: "#FF6B8B",
        secondarySoft: "#3D2230",

        success: "#34C759",
        successSoft: "#123322",
        warning: "#FFB020",
        danger: "#FF453A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["32px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-lg": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-md": ["18px", { lineHeight: "1.3", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "1.5" }],
        "body-md": ["14px", { lineHeight: "1.5" }],
        "body-sm": ["12px", { lineHeight: "1.4" }],
        caption: ["11px", { lineHeight: "1.3", letterSpacing: "0.04em", fontWeight: "500" }],
        "stat-lg": ["30px", { lineHeight: "1", fontWeight: "600" }],
        "stat-md": ["20px", { lineHeight: "1", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        card: "14px", // kept for backwards compatibility with existing usages
      },
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.35)",
        "glow-primary": "0 0 24px rgba(244,196,48,0.35)",
        "glow-secondary": "0 0 24px rgba(255,107,139,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
