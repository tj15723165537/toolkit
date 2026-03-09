/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        income: {
          primary: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        expense: {
          primary: '#F44336',
          light: '#E57373',
          dark: '#D32F2F',
        },
      },
    },
  },
  plugins: [],
}

