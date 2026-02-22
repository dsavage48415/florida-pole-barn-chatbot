import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fpb: {
          primary: '#046BD2',
          'primary-dark': '#045CB4',
          dark: '#1E293B',
          text: '#334155',
          light: '#F0F5FA',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        fpb: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
