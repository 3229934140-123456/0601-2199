/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          primary: '#0B1929',
          secondary: '#0F2137',
          tertiary: '#152A45',
          card: '#112240',
          hover: '#1A3656',
        },
        border: {
          primary: '#1E3A5F',
          secondary: '#2A4A6F',
        },
        text: {
          primary: '#E6F1FF',
          secondary: '#8FA3BF',
          muted: '#5C7A99',
        },
        accent: {
          primary: '#00D4FF',
          secondary: '#00A3CC',
          glow: 'rgba(0, 212, 255, 0.3)',
        },
        risk: {
          low: '#52C41A',
          medium: '#FAAD14',
          high: '#FA8C16',
          critical: '#FF4D4F',
        },
        status: {
          pending: '#FA8C16',
          processing: '#1890FF',
          resolved: '#52C41A',
          false_positive: '#8C8C8C',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
