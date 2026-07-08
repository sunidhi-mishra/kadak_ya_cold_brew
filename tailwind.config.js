/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warmBg: '#1a1210',
        chaiOrange: '#c8722c',
        coffeeBrown: '#3d2b1f',
        creamText: '#f0e4d0',
        softGray: '#a09895',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
