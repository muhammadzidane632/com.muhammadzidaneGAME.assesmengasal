/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./game.js",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        space: {
          darker: '#0f172a',
          dark: '#1e293b',
          DEFAULT: '#334155',
          light: '#475569',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.5)',
      },
      animation: {
        'bg-pulse': 'bgPulse 15s ease-in-out infinite',
        'stars': 'starsMove 30s linear infinite',
      },
      keyframes: {
        bgPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        starsMove: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-200px)' },
        },
      },
    },
  },
  plugins: [],
}
