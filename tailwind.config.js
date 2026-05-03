/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#F97316',
        'primary-light': '#FB923C',
        'primary-dark': '#EA6C0A',
        necessary: '#22C55E',
        unnecessary: '#EF4444',
        'bg-light': '#F0F0F0',
        'bg-dark': '#1A1A1A',
        'card-light': '#F0F0F0',
        'card-dark': '#242424',
        'text-light': '#1F2937',
        'text-dark': '#F9FAFB',
        'sub-light': '#6B7280',
        'sub-dark': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        // Neumorphic light
        'neu': '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
        'neu-sm': '3px 3px 6px #d1d1d1, -3px -3px 6px #ffffff',
        'neu-inset': 'inset 4px 4px 8px #d1d1d1, inset -4px -4px 8px #ffffff',
        'neu-pressed': 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff',
        // Neumorphic dark
        'neu-dark': '6px 6px 12px #111111, -6px -6px 12px #2d2d2d',
        'neu-dark-sm': '3px 3px 6px #111111, -3px -3px 6px #2d2d2d',
        'neu-dark-inset': 'inset 4px 4px 8px #111111, inset -4px -4px 8px #2d2d2d',
        // Orange glow
        'orange-glow': '0 0 20px rgba(249,115,22,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
      },
    },
  },
  plugins: [],
}
