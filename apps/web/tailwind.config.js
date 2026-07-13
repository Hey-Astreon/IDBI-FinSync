/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          'primary-light': 'var(--color-brand-primary-light)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        },
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
        },
        border: {
          light: 'var(--color-border-light)',
          focus: 'var(--color-border-focus)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        indicator: {
          success: 'var(--color-indicator-success)',
          warning: 'var(--color-indicator-warning)',
          error: 'var(--color-indicator-error)',
        },
      },
      borderRadius: {
        'sq-sm': 'var(--radius-sm)',
        'sq-md': 'var(--radius-md)',
        'sq-lg': 'var(--radius-lg)',
        'sq-xl': 'var(--radius-xl)',
      },
      boxShadow: {
        ambient: 'var(--shadow-ambient)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
    },
  },
  plugins: [],
};
