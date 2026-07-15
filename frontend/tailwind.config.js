/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sniser brand palette (sampled from Figma)
        brand: {
          green: "#A6E84D",
          greenDark: "#8BCB35",
          greenSoft: "#B6F25A",
          greenInk: "#1C2410", // dark green for text on light surfaces
        },
        bg: {
          DEFAULT: "#1C1F24",
          card: "#262A30",
          soft: "#2D3239",
          light: "#F4F4F1",
          ink: "#0F1115",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.18)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // Fluid hero sizes for premium typography that scales with viewport
        hero: ["clamp(2.5rem, 6vw, 4.25rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        display: ["clamp(2rem, 4.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
        widestPlus: "0.22em",
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.08)",
        glow: "0 0 0 1px rgba(166,232,77,0.35), 0 12px 36px -8px rgba(166,232,77,0.45)",
        glowLg: "0 0 0 1px rgba(166,232,77,0.4), 0 26px 70px -20px rgba(166,232,77,0.55)",
        card: "0 18px 40px -16px rgba(0,0,0,0.55)",
        elevated: "0 34px 90px -34px rgba(0,0,0,0.72)",
        frame: "0 44px 100px -40px rgba(15,17,21,0.6)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-22px) rotate(4deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        aurora: {
          "0%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(2%, -3%, 0) rotate(4deg)" },
          "100%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1.16)" },
        },
        equalize: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "scale-in": "scale-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
        float: "float 6.5s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "glow-pulse": "glow-pulse 5s ease-in-out infinite",
        "gradient-pan": "gradient-pan 6s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        "ken-burns": "ken-burns 20s ease-in-out infinite alternate",
        equalize: "equalize 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
