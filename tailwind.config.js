/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: ['selector', '.dark'],
  theme: {
    extend: {
      colors: {
        'blumelli':            'var(--blumelli)',
        'lp-bg':               'var(--lp-bg)',
        'lp-bg-low':           'var(--lp-bg-low)',
        'lp-bg-mid':           'var(--lp-bg-mid)',
        'lp-bg-high':          'var(--lp-bg-high)',
        'lp-bg-bright':        'var(--lp-bg-bright)',
        'lp-lime':             '#ff8a95',
        'lp-lime-c':           '#ff2b40',
        'lp-yellow':           '#ff2b40',
        'lp-text':             'var(--lp-text)',
        'lp-muted':            'var(--lp-muted)',
        'lp-divider':          'var(--lp-divider)',
        'lp-divider-strong':   'var(--lp-divider-strong)',
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
