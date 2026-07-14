import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict monochrome surfaces
        base: "#000000",
        surface: "#121212",
        surface2: "#1C1C1C",
        surface3: "#2A2A2A",

        // Semantic text tokens — the ONLY colors used for typography
        ink: "#FFFFFF", // Primary text: titles, headers, critical info
        muted: "#999999", // Secondary text: subtitles, metadata

        // Reserved exclusively for active structural accents:
        // progress rings/bars and "watched" checkmarks. Never used for text.
        accent: "#F4C430",
        accentSoft: "#332B0E",
        success: "#34C759",
        successSoft: "#0F2A1C",
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
        card: "0 4px 16px rgba(0,0,0,0.5)",
        glow: "0 0 20px rgba(255,255,255,0.12)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-down": "slide-down 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in forwards",
      },
    },
  },
  plugins: [],
};
export default config;
