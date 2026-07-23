import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import tinaDirective from './astro-tina-directive/index.mjs';

// Base URL por ambiente: en staging el sitio se sirve bajo /staging/ (subdirectorio
// junto al WordPress de producción). El workflow define DEPLOY_BASE=/staging; en
// dev y en producción queda en la raíz ("/").
const base = process.env.DEPLOY_BASE || "/";

export default defineConfig({
  base,
  redirects: {
    '/servicios': '/soluciones',
    '/servicios/[solucion]': '/soluciones/[solucion]',
    '/servicios/[solucion]/[subservicio]': '/soluciones/[solucion]/[subservicio]',
  },
  integrations: [
    tailwind(),
    react(),
    tinaDirective(),
  ],
});
