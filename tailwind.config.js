/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      screens: {
        xs: {max: '360px'},
        sm: '420px',
        md: '520px',
      },
      fontFamily: {
        PlusJakartaSansLight: ['PlusJakartaSans-Light'],
        PlusJakartaSansLightItalic: ['PlusJakartaSans-LightItalic'],
        PlusJakartaSans: ['PlusJakartaSans-Regular'],
        PlusJakartaSansItalic: ['PlusJakartaSans-Italic'],
        PlusJakartaSansSemiBold: ['PlusJakartaSans-SemiBold'],
        PlusJakartaSansSemiBoldItalic: ['PlusJakartaSans-SemiBoldItalic'],
        PlusJakartaSansBold: ['PlusJakartaSans-Bold'],
        PlusJakartaSansBoldItalic: ['PlusJakartaSans-BoldItalic'],
        Lato: ['Lato-Regular'],
        LatoBold: ['Lato-Bold'],
      },
      colors: {
        baseBg: '#0F0E11',
        baseComponent: '#131216',
        baseDarkComponent: '#1b191e',
        primary: '#F5F5F5',
        primaryHover: '#FAFAFA',
        gold: '#ECC771',
        lowEmphasis: '#707070',
      },
    },
  },
  plugins: [],
};

