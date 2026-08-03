/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          gold: "#B88935",
          navy: "#132238",
          blue: "#315EA8",
          ink: "#0C1625",
        },
      },
      boxShadow: {
        fintech: "0 20px 45px rgba(18, 34, 56, 0.12)",
      },
    },
  },
  plugins: [],
};
