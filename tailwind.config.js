/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        wellness: {
          bg: "#FAF8F4",
          surface: "#F4EFE6",
          card: "#FFFFFF",
          cream: "#FDFBF7",
          border: "#E7DFC9",
          dark: "#14261C",
          muted: "#5C6F64",
          gold: "#C59B27",
          goldLight: "#F5EACB",
          goldDark: "#9A7314",
          primary: "#1A4D3E",
          primaryDark: "#103328",
          primaryLight: "#266B56",
          accent: "#2D8A6E",
          emeraldBg: "#EBF5F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(26, 77, 62, 0.08), 0 0 1px 1px rgba(26, 77, 62, 0.04)',
        'premium-lg': '0 30px 60px -20px rgba(20, 38, 28, 0.12), 0 0 1px 1px rgba(26, 77, 62, 0.06)',
        'glow-gold': '0 0 25px -5px rgba(197, 155, 39, 0.35)',
        'glow-green': '0 0 30px -8px rgba(26, 77, 62, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.94', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};
