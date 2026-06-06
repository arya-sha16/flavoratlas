/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#E8890C',
          light: '#FBAE43',
          dark: '#A65F04',
          50: '#FDF3E5',
          100: '#FAE2BF',
          200: '#F5C68A',
          300: '#EFA651',
          400: '#E8890C',
          500: '#C47209',
          600: '#9C5806',
          700: '#754003',
          800: '#4F2A01',
          900: '#2A1400',
        },
        cream: {
          DEFAULT: '#FDF6EC',
          light: '#FFFDFC',
          dark: '#EFE2CE',
          50: '#FAF8F5',
          100: '#FDF6EC',
          200: '#F8EBCE',
          300: '#F0D6A3',
          400: '#E5BD73',
          500: '#D59D42',
        },
        charcoal: {
          DEFAULT: '#1C1C1C',
          light: '#2A2A2A',
          dark: '#0D0D0D',
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#CFCFCF',
          300: '#A7A7A7',
          400: '#757575',
          500: '#1C1C1C',
          600: '#151515',
          700: '#0F0F0F',
        },
        terracotta: {
          DEFAULT: '#C25B3F',
          light: '#D87A60',
          dark: '#933D25',
          50: '#FDF4F2',
          100: '#FAE4DF',
          200: '#F3C5BA',
          300: '#EAA190',
          400: '#C25B3F',
          500: '#AD4D33',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
