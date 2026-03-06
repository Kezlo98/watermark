/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        foreground: "#F5F5F5",
        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        glass: {
          panel: "#141414",
          sidebar: "rgba(10, 10, 10, 0.4)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.1)",
          hover: "rgba(255, 255, 255, 0.2)",
        },
        semantic: {
          cyan: "#00FFFF",
          purple: "#BF00FF",
          orange: "#FF8C00",
          red: "#FF0000",
        },
        status: {
          healthy: "#34D399",
          rebalancing: "#FBBF24",
          dead: "#EF4444",
          empty: "#94A3B8",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        glass: "16px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
