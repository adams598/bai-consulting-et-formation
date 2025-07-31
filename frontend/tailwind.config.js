/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#00314B",
        "brand-beige": "#C7B299",
        // Couleurs pour le mode sombre
        dark: {
          "bg-primary": "#1a1a1a",
          "bg-secondary": "#2d2d2d",
          "text-primary": "#ffffff",
          "text-secondary": "#a3a3a3",
          border: "#404040",
          accent: "#C7B299",
        },
      },
      fontFamily: {
        sans: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
};
