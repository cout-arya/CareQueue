import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006565",
          light: "#008080",
          dark: "#004f4f",
          container: "#008080",
          fixed: "#93f2f2",
          "fixed-dim": "#76d6d5",
        },
        secondary: {
          DEFAULT: "#515f74",
          container: "#d5e3fc",
        },
        tertiary: {
          DEFAULT: "#004fd2",
          container: "#2e69f1",
          fixed: "#dbe1ff",
        },
        surface: {
          DEFAULT: "#f7f9fb",
          dim: "#d8dadc",
          bright: "#f7f9fb",
          container: "#eceef0",
          "container-high": "#e6e8ea",
          "container-highest": "#e0e3e5",
          "container-low": "#f2f4f6",
          "container-lowest": "#ffffff",
        },
        "on-surface": "#191c1e",
        "on-surface-variant": "#3e4949",
        outline: "#6e7979",
        "outline-variant": "#bdc9c8",
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error-container": "#93000a",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 12px 40px rgba(25, 28, 30, 0.06)",
        "ambient-lg": "0 16px 48px rgba(25, 28, 30, 0.08)",
      },
      borderRadius: {
        clinical: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
