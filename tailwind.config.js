/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'blumelli': 'var(--blumelli)',
        'lp-bg':     '#0e0e0e',
        'lp-bg-low': '#131313',
        'lp-bg-mid': '#1a1a1a',
        'lp-bg-high':'#20201f',
        'lp-bg-bright':'#2c2c2c',
        'lp-lime':   '#ff8a95',
        'lp-lime-c': '#ff2b40',
        'lp-yellow': '#ff2b40',
        'lp-text':   '#e8e8e8',
        'lp-muted':  '#adaaaa',
      },
      fontFamily: {
        'lexend': ['Lexend', 'sans-serif'],
        'space':  ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [
    PrimeUI
  ],
}

