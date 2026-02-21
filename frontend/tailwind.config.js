/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#6d28d9",
        "primary-glow": "#8b5cf6",
        "primary-hover": "#7c3aed",
        "accent": "#8b5cf6",
        "background-dark": "#0c0a15",
        "card-dark": "#161425",
        "terminal-text": "#a5b4fc",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "serif": ["Playfair Display", "serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}