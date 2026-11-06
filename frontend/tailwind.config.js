/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: '#202020',
        'canvas-white': '#ffffff',
        ash: '#efefef',
        fog: '#f5f5f5',
        ivory: '#ebe6dd',
        steel: '#4d4d4d',
        slate: '#828282',
        mist: '#e8e8e8',
        'ember-orange': '#ff682c',
        brass: '#816729',
      },
      fontFamily: {
        polysans: ['Inter Tight', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'asymmetric': '6px 0px 0px',
        'buttons': '0px',
        'nav-pill': '200px',
      },
    },
  },
  plugins: [],
}
