/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      display: ['Poppins', 'sans-serif'],
    },
    extend: {
      //Colors used in this project
      colors : {
        primary: '#05B6D3',
        secondary: '#EF863E',
      },
      backgroundImage: {
        'login-bg-img': 'url(/assets/login-img.jpg)',
        'signup-bg-img': 'url(/assets/signup-img.jpg)',
      }
    },
  },
  plugins: [],
}

