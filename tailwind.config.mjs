/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'system-ui', 'sans-serif'],
      mono: ['Space Mono', 'monospace'],
    },
    fontSize: {
      /* Headings — clamp(min≈mobile, preferido, max=desktop actual); lineHeight unitless para que acompañe al clamp */
      'heading-xxl': ['clamp(2.5rem, 6vw + 1rem, 5rem)',        { lineHeight: '1.1',  fontWeight: '700' }], // 40 → 80
      'heading-xl':  ['clamp(2.25rem, 5.5vw + 0.75rem, 4.5rem)', { lineHeight: '1.1',  fontWeight: '700' }], // 36 → 72
      'heading-lg':  ['clamp(2rem, 5vw + 0.5rem, 4rem)',         { lineHeight: '1.12', fontWeight: '700' }], // 32 → 64
      'heading-md':  ['clamp(1.875rem, 4vw + 0.5rem, 3.5rem)',   { lineHeight: '1.14', fontWeight: '700' }], // 30 → 56
      'heading-sm':  ['clamp(1.625rem, 3.5vw + 0.5rem, 3rem)',   { lineHeight: '1.16', fontWeight: '700' }], // 26 → 48
      'heading-xs':  ['clamp(1.5rem, 2.5vw + 0.5rem, 2.5rem)',   { lineHeight: '1.2',  fontWeight: '700' }], // 24 → 40

      /* Subtitles */
      'subtitle-xl': ['clamp(2rem, 4vw + 0.5rem, 3.5rem)',       { lineHeight: '1.05', fontWeight: '500' }], // 32 → 56
      'subtitle-lg': ['clamp(1.75rem, 3vw + 0.5rem, 2.75rem)',   { lineHeight: '1.1',  fontWeight: '500' }], // 28 → 44
      'subtitle-md': ['clamp(1.5rem, 2vw + 0.5rem, 2rem)',       { lineHeight: '1.25', fontWeight: '500' }], // 24 → 32
      'subtitle-sm': ['clamp(1.25rem, 1.5vw + 0.4rem, 1.5rem)',  { lineHeight: '1.25', fontWeight: '500' }], // 20 → 24
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
