/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020617', // Background utama
          900: '#0f172a', // Card bg
          800: '#1e293b',
          700: '#334155',
        },
        neon: {
          DEFAULT: '#a3e635', // Lime-400 (Warna Aksen Utama)
          hover: '#84cc16',   // Lime-500
          glow: 'rgba(163, 230, 53, 0.4)'
        }
      },
    },
  },
  plugins: [],
};