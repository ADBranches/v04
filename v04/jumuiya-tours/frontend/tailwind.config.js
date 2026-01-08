/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./views/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'uganda': {
          yellow: '#FCDC04',
          black: '#000000',
          red: '#D90000',
          'dark-red': '#9C0101'
        },
        'safari': {
          sand: '#F0E6D2',
          earth: '#8B4513',
          savanna: '#E1C16E',
          forest: '#228B22'
        }
      },
      fontFamily: {
        'african': ['"Noto Sans"', 'sans-serif'],
        'display': ['Poppins', 'system-ui']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.5s ease-out'
      },
      backgroundImage: {
        'savanna-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f0e6d2\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        'hero-pattern': "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/public/images/hero-bg.jpg')"
      }
    },
  },
  plugins: [],
}
