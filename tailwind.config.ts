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
        // Scoopy design system (light default)
        brand: {
          bgPrimary: "var(--bg-primary)",
          bgSecondary: "var(--bg-secondary)",
          bgCard: "var(--bg-card)",
          textPrimary: "var(--text-primary)",
          textSecondary: "var(--text-secondary)",
          textMuted: "var(--text-muted)",
          accent: "var(--accent)",
          accentHover: "var(--accent-hover)",
          accentSubtle: "var(--accent-subtle)",
          border: "var(--border)",
          borderLight: "var(--border-light)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "scoopy-sm": "var(--radius-sm)",
        "scoopy-md": "var(--radius-md)",
        "scoopy-lg": "var(--radius-lg)",
        "scoopy-xl": "var(--radius-xl)",
      },
      boxShadow: {
        "scoopy-sm": "var(--shadow-sm)",
        "scoopy-md": "var(--shadow-md)",
        "scoopy-lg": "var(--shadow-lg)",
      },
      spacing: {
        "scoopy-xs": "var(--space-xs)",
        "scoopy-sm": "var(--space-sm)",
        "scoopy-md": "var(--space-md)",
        "scoopy-lg": "var(--space-lg)",
        "scoopy-xl": "var(--space-xl)",
        "scoopy-xxl": "var(--space-xxl)",
        "scoopy-xxxl": "var(--space-xxxl)",
      },
    },
  },
  plugins: [],
};

export default config;
