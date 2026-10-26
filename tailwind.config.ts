import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        inter: ['Inter', 'var(--font-inter)', 'sans-serif'],
      },
      colors: {
        thermal: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Primary Flame Amber
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        obsidian: {
          900: '#0a0e16', // app background - deep ink, low saturation
          800: '#111927', // card surface - one clear step above background
          700: '#1f2a3c', // hairline border / dividers
          600: '#374151',
        },
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(249, 115, 22, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(249, 115, 22, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
