import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        brand: {
          // Legacy — mantidos para compatibilidade com código existente
          pink: "#EC4899",
          purple: "#8B5CF6",
          coral: "#FB7185",
          navy: "#0F172A",
          // Bridge theme — novos tokens de identidade ideal
          violet: "#7C3AED",
          cyan: "#0EA5E9",
          teal: "#2DD4BF"
        }
      },
      borderRadius: {
        lg: "1.25rem",
        md: "1rem",
        sm: "0.75rem"
      },
      boxShadow: {
        // Legacy
        glow: "0 24px 80px rgba(236, 72, 153, 0.18)",
        // Bridge
        brand: "0 8px 24px rgba(124, 58, 237, 0.28)",
        "brand-md": "0 6px 20px rgba(124, 58, 237, 0.14), 0 4px 10px rgba(0, 0, 0, 0.12)",
        "brand-lg": "0 10px 28px rgba(124, 58, 237, 0.18), 0 8px 18px rgba(0, 0, 0, 0.14)",
        card: "0 4px 16px rgba(124, 58, 237, 0.08), 0 2px 8px rgba(0, 0, 0, 0.18)"
      },
      backgroundImage: {
        // Legacy
        "hero-radial":
          "radial-gradient(circle at top left, rgba(124,58,237,0.24), transparent 32%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 28%), linear-gradient(180deg, rgba(13,18,38,1) 0%, rgba(11,16,32,1) 100%)",
        // Bridge
        "gradient-brand": "linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)",
        "gradient-brand-soft":
          "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(14,165,233,0.14) 100%)"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
