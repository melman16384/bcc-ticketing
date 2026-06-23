/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50:  '#fdf9f2',
          100: '#f8eedb',
          200: '#f0d9ad',
          300: '#e5c17a',
          400: '#d4a04a',
          500: '#b8832e',
          600: '#9a6b22',
        },
        ocean: {
          50:  '#f0f7fa',
          100: '#daedf5',
          200: '#aed5e8',
          300: '#74b5d4',
          400: '#4397be',
          500: '#2f7da6',
          600: '#24638a',
          700: '#1d4f70',
          800: '#173e58',
        },
        shore: {
          50:  '#fafaf5',
          100: '#f4f1e8',
          200: '#e8e2d2',
          300: '#d5ccb8',
          400: '#b8ae96',
          500: '#96896e',
          600: '#7a6e54',
          700: '#5c5240',
          800: '#3d3728',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
