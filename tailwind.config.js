/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        parchment: {
          50:  '#fdfaf4',
          100: '#f9f3e3',
          200: '#f0e4c4',
        },
        sage: {
          50:  '#f2f6f3',
          100: '#deeae0',
          200: '#b9d4bc',
          300: '#8db893',
          400: '#5f9966',
          500: '#3d7a44',
          600: '#2e5f34',
          700: '#264d2b',
        },
        terracotta: {
          100: '#fce8e2',
          200: '#f5c4b5',
          400: '#d9715a',
          500: '#c05540',
          600: '#a33a27',
        },
        ink: {
          50:  '#f5f5f0',
          100: '#e8e8e0',
          400: '#8a8a7a',
          700: '#3d3d30',
          900: '#1a1a12',
        }
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(0,0,0,0.07)',
        'card': '0 4px 24px rgba(0,0,0,0.09)',
        'lifted': '0 8px 40px rgba(0,0,0,0.13)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      }
    },
  },
  plugins: [],
}
