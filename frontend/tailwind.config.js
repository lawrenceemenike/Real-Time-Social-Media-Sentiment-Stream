/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        comintel: {
          bg: "#08090C",
          surface: "#12151D",
          card: "#13161F",
          border: "#1E2433",
          borderLight: "rgba(255, 255, 255, 0.08)",
          amber: "#F59E0B",
          orange: "#FB923C",
          green: "#10B981",
          red: "#EF4444",
          cyan: "#06B6D4",
          textMuted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
      }
    },
  },
  plugins: [],
}
