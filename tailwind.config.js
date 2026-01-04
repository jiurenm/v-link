/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#39C5BB',
          50: '#E6F7F6',
          100: '#CCEFED',
          200: '#99DFDB',
          300: '#66CFC9',
          400: '#39C5BB',
          500: '#2A9D94',
          600: '#227A73',
          700: '#1A5852',
          800: '#113532',
          900: '#091211',
        },
        accent: {
          blue: '#4455dd',
          green: '#88dd44',
          pink: '#ee1166',
          orange: '#ff9900',
          purple: '#884499',
        },
      },
    },
  },
  plugins: [],
}

