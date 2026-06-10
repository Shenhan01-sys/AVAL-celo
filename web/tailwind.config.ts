import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        sans: ["var(--font-hanken)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        bone: "#F1EEE5",
        bone2: "#E7E2D4",
        ink: "#0B0B0A",
        lime: "#BFF205",
        inksoft: "#6B6862",
        signal: "#FF5A1F",
      },
      boxShadow: {
        hard: "6px 6px 0 #0B0B0A",
        hard2: "4px 4px 0 #0B0B0A",
        hardlime: "6px 6px 0 #BFF205",
      },
    },
  },
  plugins: [],
};

export default config;
