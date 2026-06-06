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
        // Pure blue-navy palette — exactly aligned with the MAC Solar logo's dark navy
        // (removed the teal/slate undertone that made the old navy feel off-brand)
        navy: {
          950: "#040B1A",
          900: "#081529",   // Deep hero/footer backgrounds
          800: "#0D2040",   // Primary text & dark UI elements
          700: "#122A58",   // Medium-dark navy
          600: "#183374",   // Rich royal navy
        },
        // Logo sun — unchanged, already a perfect match
        solar: {
          400: "#FFD23F",
          500: "#F5B800",
          600: "#D4A000",
        },
        // MAC letters blue — the logo's primary brand color
        brand: {
          blue: "#1756C8",
          blueDark: "#1245A8",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      backgroundImage: {
        // Grid uses brand-blue tint for a subtle logo-color feel in dark sections
        "grid-pattern":
          "linear-gradient(rgba(23,86,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(23,86,200,0.07) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
