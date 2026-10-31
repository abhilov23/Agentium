/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.08)",
        input: "rgba(255, 255, 255, 0.06)",
        ring: "rgba(20, 184, 166, 0.5)",
        background: "#07080b",
        foreground: "#f3f4f6",
        primary: {
          DEFAULT: "#14b8a6",
          foreground: "#031512",
        },
        secondary: {
          DEFAULT: "#11141d",
          foreground: "#e5e7eb",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f3f4f6",
        },
        muted: {
          DEFAULT: "#11141d",
          foreground: "#9ca3af",
        },
        accent: {
          DEFAULT: "#11141d",
          foreground: "#f3f4f6",
        },
        popover: {
          DEFAULT: "#0b0d13",
          foreground: "#f3f4f6",
        },
        card: {
          DEFAULT: "#0f121a",
          foreground: "#f3f4f6",
        },
        teal: {
          DEFAULT: "#14b8a6",
          glow: "rgba(20, 184, 166, 0.25)",
          surface: "rgba(20, 184, 166, 0.1)",
          border: "rgba(20, 184, 166, 0.3)",
        },
        cyan: "#06b6d4",
        blue: "#3b82f6",
        green: "#10b981",
        red: "#ef4444",
        amber: "#f59e0b",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "grid-move": "gridMove 20s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
      },
      keyframes: {
        gridMove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.3)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
