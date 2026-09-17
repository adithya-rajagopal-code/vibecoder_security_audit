import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#080c14",
          card: "rgba(15, 23, 42, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(56, 189, 248, 0.15)",
          accent: "#38bdf8",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-hover": "0 14px 45px 0 rgba(0, 0, 0, 0.5)",
        "glow-cyan": "0 0 30px -5px rgba(56, 189, 248, 0.3)",
        "glow-rose": "0 0 30px -5px rgba(244, 63, 94, 0.3)",
        "glow-emerald": "0 0 30px -5px rgba(16, 185, 129, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "radar-sweep": "radarSweep 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        radarSweep: {
          "0%": { transform: "rotate(0deg)", opacity: "0.2" },
          "50%": { opacity: "0.8" },
          "100%": { transform: "rotate(360deg)", opacity: "0.2" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
