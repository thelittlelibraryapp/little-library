/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for the cozy library theme
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'book-spine': 'book-spine 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'book-spine': {
          '0%, 100%': { transform: 'rotateY(0deg) scale(1)' },
          '50%': { transform: 'rotateY(5deg) scale(1.02)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'cozy': '0 4px 6px -1px rgba(251, 191, 36, 0.1), 0 2px 4px -1px rgba(251, 191, 36, 0.06)',
        'cozy-lg': '0 10px 15px -3px rgba(251, 191, 36, 0.1), 0 4px 6px -2px rgba(251, 191, 36, 0.05)',
      }
    },
  },
  plugins: [
    // Custom plugin for scrollbar utilities
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#fffbeb',
            borderRadius: '9999px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#fcd34d',
            borderRadius: '9999px',
            '&:hover': {
              backgroundColor: '#fbbf24'
            }
          }
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.7)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)'
        },
        '.nav-blur': {
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)'
        },
        '.focus-cozy:focus': {
          outline: 'none',
          'box-shadow': '0 0 0 2px rgba(251, 191, 36, 0.75)'
        },
        '.gradient-text': {
          'background': 'linear-gradient(135deg, #f59e0b, #d97706)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        '.book-card': {
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'transform': 'translateY(-4px) scale(1.02)',
            'box-shadow': '0 20px 25px -5px rgba(251, 191, 36, 0.1), 0 10px 10px -5px rgba(251, 191, 36, 0.04)'
          }
        },
        '.book-spine': {
          'position': 'relative',
          'background': 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'top': '10%',
            'left': '2px',
            'right': '2px',
            'height': '1px',
            'background': 'rgba(255, 255, 255, 0.3)'
          },
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'bottom': '10%',
            'left': '2px',
            'right': '2px',
            'height': '1px',
            'background': 'rgba(255, 255, 255, 0.3)'
          }
        }
      })
    }
  ],
}