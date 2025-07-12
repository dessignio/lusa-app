
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#7249AB',
        'brand-primary-dark': '#51279B', 
        'brand-primary-light': '#9E78D9', 

        'brand-accent': '#9397BD',
        'brand-accent-dark': '#6A6D98',   
        'brand-accent-light': '#BFC2E2',  

        'brand-background': '#D9C9D3',      
        'brand-background-light': '#EBE3E7',
        'brand-background-dark': '#C7B9BF', 

        'brand-text-primary': '#211721',      
        'brand-text-secondary': '#544D55',    
        'brand-text-muted': '#7E7580',        

        'brand-body-bg': '#F7F5F7', 

        'brand-success': '#10B981',
        'brand-success-dark': '#0A8A5F',
        'brand-success-light': '#D1FAE5', 
        'brand-error': '#EF4444',
        'brand-error-dark': '#D02B2B',
        'brand-error-light': '#FEE2E2', 
        'brand-warning': '#F59E0B',
        'brand-warning-dark': '#D98200',
        'brand-warning-light': '#FEF3C7', 
        
        'brand-info-light': '#DBEAFE', 
        'brand-info': '#3B82F6',       

        'brand-pink-light': '#FCE7F3', 
        'brand-pink': '#EC4899',       

        'brand-indigo-light': '#E0E7FF', 
        'brand-indigo': '#6366F1',      

        'brand-neutral': { 
          50:  '#F9F8F9',
          100: '#F2F0F3',
          200: '#E6E2E7', 
          300: '#DAD5DD', 
          400: '#B9B3BF',
          500: '#9891A1',
          600: '#7A7381',
          700: '#5C5661',
          800: '#3D3941',
          900: '#1F1D21',
        }
      }
    },
    fontFamily: {
      sans: ['Open Sans', 'sans-serif'],
    },
  },
  plugins: [],
}