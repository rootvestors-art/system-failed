import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#0a0a0a',
        'alert-red': '#ef4444',
        caution: '#eab308',
        charcoal: '#121212',
        concrete: '#2B2D42',
        blood: '#D90429',
      },
      fontFamily: {
        header: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        flip: 'flip 0.6s ease-in-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 4, 41, 0.7)' },
          '50%': { boxShadow: '0 0 0 12px rgba(217, 4, 41, 0)' },
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
