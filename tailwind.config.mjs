/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'system-ui', 'sans-serif'],
      mono: ['Space Mono', 'monospace'],
    },
    fontSize: {
      /* Headings */
      'heading-xxl': ['80px', { lineHeight: '88px', fontWeight: '700' }],
      'heading-xl':  ['72px', { lineHeight: '80px', fontWeight: '700' }],
      'heading-lg':  ['64px', { lineHeight: '72px', fontWeight: '700' }],
      'heading-md':  ['56px', { lineHeight: '64px', fontWeight: '700' }],
      'heading-sm':  ['48px', { lineHeight: '56px', fontWeight: '700' }],
      'heading-xs':  ['40px', { lineHeight: '48px', fontWeight: '700' }],

      /* Subtitles */
      'subtitle-xl': ['56px', { lineHeight: '56px', fontWeight: '500' }],
      'subtitle-lg': ['44px', { lineHeight: '44px', fontWeight: '500' }],
      'subtitle-md': ['32px', { lineHeight: '40px', fontWeight: '500' }],
      'subtitle-sm': ['24px', { lineHeight: '30px', fontWeight: '500' }],
      'subtitle-xs': ['16px', { lineHeight: '18px', fontWeight: '500' }],

      /* Body */
      'body-lg': ['20px', { lineHeight: '32px', fontWeight: '400' }],
      'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
      'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],

      /* Caption */
      'caption-sm': ['12px', { lineHeight: '14px', fontWeight: '400' }],
    },
    extend: {
      colors: {
        brand: {
          purple: {
            darkest:  '#3B0E30',
            dark:     '#650F50',
            DEFAULT:  '#96237A',
            light:    '#D5A7CA',
            lightest: '#F3E4EF',
          },
          gray: {
            darkest:  '#3D3D3E',
            dark:     '#5C5C5D',
            DEFAULT:  '#868687',
            light:    '#C2C2C3',
            lightest: '#EDEDEE',
          },
        },
        semantics: {
          success: {
            darkest:  '#1E612A',
            dark:     '#267C35',
            DEFAULT:  '#37B24D',
            light:    '#73C982',
            lightest: '#EBF7ED',
          },
          alert: {
            darkest:  '#7E4B00',
            dark:     '#CA7900',
            DEFAULT:  '#FC9700',
            light:    '#FCDA6A',
            lightest: '#FFF4D8',
          },
          error: {
            darkest:  '#6E1717',
            dark:     '#8C1D1D',
            DEFAULT:  '#EB0E0E',
            light:    '#D96A6A',
            lightest: '#F9EBEA',
          },
        },
        greyscale: {
          darkest:  '#0A0A0A',
          dark:     '#3F3F3F',
          DEFAULT:  '#717274',
          light:    '#E5E7EB',
          lightest: '#F2F3F5',
          white:    '#FFFFFF',
        },
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
