/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#FAFAFA',
        border: '#E5E5EA',
        divider: '#F0F0F2',
        ink: {
          DEFAULT: '#0A0A0F',
          secondary: '#6E6E73',
          tertiary: '#A1A1A6',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, var(--accent-grad-from) 0%, var(--accent-grad-to) 100%)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
