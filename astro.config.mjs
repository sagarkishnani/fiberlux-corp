import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import tinaDirective from './astro-tina-directive/index.mjs';

export default defineConfig({
  redirects: {
    '/servicios': '/soluciones',
    '/servicios/[...rest]': '/soluciones/[...rest]',
  },
  integrations: [
    tailwind(),
    react(),
    tinaDirective(),
  ],
});
