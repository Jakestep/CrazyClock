/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/*.{html,js,jsx,ts,tsx}',
    './src/renderer/**/*.{js,jsx,ts,tsx}',
    './src/renderer/**/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
  },
  plugins: [],
}
