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
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text-main)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'hsl(var(--primary))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px hsl(var(--primary) / 0.3)',
        'glow-md': '0 0 20px hsl(var(--primary) / 0.5)',
        'glow-lg': '0 0 30px hsl(var(--primary) / 0.7)',
        'glow-admin': '0 0 20px hsl(var(--admin-primary, 38 92% 50%) / 0.5)',
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
