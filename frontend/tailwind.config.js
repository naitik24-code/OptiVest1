/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        foreground: 'var(--text-main)',
        surface: 'var(--bg-surface)',
        surface2: 'var(--surface2)',
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text-main)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          dim: 'var(--primary-dim)',
          foreground: '#111318',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dim: 'var(--secondary-dim)',
        },
        success: 'var(--success)',
        danger: 'var(--danger)',
        muted: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'var(--primary)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px var(--primary-dim)',
        'glow-md': '0 0 20px var(--primary-dim)',
        'glow-lg': '0 0 30px var(--primary)',
        'glow-admin': '0 0 20px var(--primary)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
    },
  },
  plugins: [],
}
