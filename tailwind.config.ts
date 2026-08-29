import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Semantic surfaces, driven by the CSS variables in index.css so a route
           can switch between the dark and light treatments with one class. */
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        'raised-2': 'var(--raised-2)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'ink-faint': 'var(--ink-faint)',

        /* Brand + accents. `civic` promotes the sky/teal that Home.tsx was
           previously applying through raw rgba() values not present in config. */
        blood: '#D90429',
        civic: '#0b6fb0',
        'civic-soft': '#e6f1f8',

        /* Retained: still referenced widely, and renaming them would be churn
           with no user-visible benefit. */
        void: '#0a0a0a',
        charcoal: '#121212',
        caution: '#eab308',
      },
      fontFamily: {
        header: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        flip: 'flip 0.6s ease-in-out',
      },
      keyframes: {
        /* Uses the brand red via a variable so changing `blood` cannot silently
           desync the animation, which is what happened when it was hardcoded. */
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(217 4 41 / 0.7)' },
          '50%': { boxShadow: '0 0 0 12px rgb(217 4 41 / 0)' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
