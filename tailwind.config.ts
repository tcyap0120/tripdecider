import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'wave': 'wave 10s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pop-in': 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'wiggle': 'wiggle 1.2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'bob': 'bounceSoft 4s ease-in-out infinite',
        'jelly': 'jelly 0.6s ease-out',
        'float-up': 'floatUp 1s ease-out forwards',
        'confetti-fall': 'confettiFall 2.6s ease-in forwards',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.6) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        jelly: {
          '0%, 100%': { transform: 'scale(1, 1)' },
          '30%': { transform: 'scale(1.04, 0.96)' },
          '50%': { transform: 'scale(0.97, 1.03)' },
          '70%': { transform: 'scale(1.01, 0.99)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translate(0, 0) scale(0.6)' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(var(--dx, 0px), -70px) scale(1.1)' },
        },
        confettiFall: {
          '0%': { opacity: '0', transform: 'translate(0, -10vh) rotate(0deg)' },
          '10%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(var(--dx, 0px), 105vh) rotate(var(--rot, 360deg))' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.8)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'travel-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #0891b2 30%, #0d9488 60%, #059669 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
      },
    },
  },
  plugins: [],
}

export default config
