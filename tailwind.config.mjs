/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      /* Headings — clamp(min≈mobile, preferido, max=desktop); lineHeight unitless para que acompañe al clamp.
         El extremo desktop se bajó ~13% (Poppins renderiza más grande que el font del sistema anterior); el mínimo mobile se mantiene.
         Peso 500 (medium): los títulos del sitio dejaron de ser bold. Hoy la escala
         sólo la referencia `global.css` (que no se bundlea) y los componentes usan
         tamaños arbitrarios + `font-medium`; se alinea para que el token no
         reintroduzca el 700 en cuanto alguien lo use. */
      'heading-xxl': ['clamp(2.5rem, 5vw + 1rem, 4.25rem)',      { lineHeight: '1.1',  fontWeight: '500' }], // 40 → 68
      'heading-xl':  ['clamp(2.25rem, 4.75vw + 0.75rem, 3.75rem)', { lineHeight: '1.1',  fontWeight: '500' }], // 36 → 60
      'heading-lg':  ['clamp(2rem, 4.25vw + 0.5rem, 3.375rem)',  { lineHeight: '1.12', fontWeight: '500' }], // 32 → 54
      'heading-md':  ['clamp(1.875rem, 3.5vw + 0.5rem, 3rem)',   { lineHeight: '1.14', fontWeight: '500' }], // 30 → 48
      'heading-sm':  ['clamp(1.625rem, 3vw + 0.5rem, 2.5rem)',   { lineHeight: '1.16', fontWeight: '500' }], // 26 → 40
      'heading-xs':  ['clamp(1.5rem, 2.25vw + 0.5rem, 2.125rem)', { lineHeight: '1.2',  fontWeight: '500' }], // 24 → 34

      /* Subtitles */
      'subtitle-xl': ['clamp(2rem, 3.25vw + 0.5rem, 2.875rem)',  { lineHeight: '1.05', fontWeight: '500' }], // 32 → 46
      'subtitle-lg': ['clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', { lineHeight: '1.1',  fontWeight: '500' }], // 28 → 38
      'subtitle-md': ['clamp(1.5rem, 1.75vw + 0.5rem, 1.75rem)', { lineHeight: '1.25', fontWeight: '500' }], // 24 → 28
      'subtitle-sm': ['clamp(1.25rem, 1.25vw + 0.4rem, 1.375rem)', { lineHeight: '1.25', fontWeight: '500' }], // 20 → 22
      'subtitle-xs': ['16px', { lineHeight: '18px', fontWeight: '500' }],

      /* Body */
      'body-lg': ['20px', { lineHeight: '32px', fontWeight: '400' }],
      'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
      'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],

      /* Caption */
      'caption-sm': ['12px', { lineHeight: '14px', fontWeight: '400' }],
    },
    extend: {
      /* SPEC 111: animaciones del pop-up promocional. Van aquí y no en
         `global.css`, que en este repo no se bundlea. */
      keyframes: {
        'popup-icon-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px) scale(0.86)' },
          '60%':  { opacity: '1', transform: 'translateY(0) scale(1.04)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'popup-icon-glow': {
          '0%, 100%': { boxShadow: '0 0 30px -6px rgba(200,90,175,0.55)', transform: 'scale(1)' },
          '50%':      { boxShadow: '0 0 46px -2px rgba(200,90,175,0.85)', transform: 'scale(1.035)' },
        },
      },
      animation: {
        /* `both` conserva el estado inicial durante el retardo del escalonado:
           sin él los íconos parpadean visibles antes de arrancar. */
        'popup-icon-in': 'popup-icon-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'popup-icon-glow': 'popup-icon-glow 3.2s ease-in-out infinite',
      },
      colors: {
        /* SPEC 117 — tokens del rediseño claro, valores exactos del prototipo. */
        fx: {
          bg:          '#F7F7F7',
          surface:     '#FFFFFF',
          soft:        '#F2F1F2',
          line:        '#ECE9EC',
          'line-strong': '#D8D5D8',
          ink:         '#453C46',
          'ink-dark':  '#2E272F',
          body:        '#6B636C',
          muted:       '#868687',
          subtle:      '#5E5560',
          purple:      '#96217A',
          'purple-hover': '#7F1666',
          'purple-deep':  '#650D4A',
          magenta:     '#C81D87',
          lilac:       '#EBD1E4',
          'lilac-strong': '#D5A7CA',
          blush:       '#F3DDEC',
          'blush-soft': '#E9D3E2',
          tint:        '#F5E9F2',
          night:       '#110C10',
          whatsapp:    '#51C859',
        },
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
        '3xl': '32px',
      },
      maxWidth: {
        'fx': '1320px',
      },
      transitionTimingFunction: {
        'fx-out': 'cubic-bezier(.16,1,.3,1)',
        'fx-spring': 'cubic-bezier(.2,.8,.2,1)',
        'fx-drawer': 'cubic-bezier(.76,0,.24,1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
