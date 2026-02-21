/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6d28d9",
        "primary-glow": "#8b5cf6",
        "background-dark": "#0c0a15",
        "card-dark": "#161425",
        "terminal-text": "#a5b4fc",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "loading-bar": {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "code-typing": {
          "0%": { width: "0" },
          "80%": { width: "100%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        blob: "blob 7s infinite",
        gradient: "gradient 3s ease infinite",
        "loading-bar": "loading-bar 1.5s ease-in-out infinite",
        "code-typing": "code-typing 3s steps(30, end) infinite",
      },
    },
  },
  plugins: [],
}
