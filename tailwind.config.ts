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
    },
  },
  plugins: [],
};
export default config;
