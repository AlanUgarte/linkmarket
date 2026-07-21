import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tema claro estilo Mercado Libre: fondo gris muy claro, superficies blancas.
        base: {
          950: '#EBEBEB', // fondo de página (gris ML)
          900: '#FFFFFF', // superficie / tarjeta
          800: '#F5F5F5', // relleno sutil / hover
          700: '#EDEDED',
          600: '#E0E0E0',
        },
        line: {
          DEFAULT: 'rgba(0,0,0,0.09)',
          strong: 'rgba(0,0,0,0.16)',
        },
        ink: {
          DEFAULT: '#333333', // texto principal ML (~rgba(0,0,0,.8))
          dim: '#666666',
          faint: '#8C8C8C',
        },
        ml: {
          yellow: '#FFE600', // amarillo header ML
          'yellow-dim': '#FFF159',
          blue: '#3483FA', // azul de acción ML (links, foco)
          green: '#00A650', // verde precio / envío gratis ML
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['clamp(2.5rem, 8vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-md': ['clamp(1.75rem, 5vw, 2.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.08), 0 6px 20px -8px rgba(0,0,0,0.16)',
        glow: '0 0 0 1px rgba(255,230,0,0.5), 0 6px 20px -8px rgba(0,0,0,0.14)',
        card: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        fadeIn: 'fadeIn 0.4s ease both',
        shimmer: 'shimmer 1.6s linear infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
