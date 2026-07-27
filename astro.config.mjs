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
  // i18n (SPEC 80): ES por defecto en la raíz, EN bajo /en/. El fallback rewrite
  // emite /en/* reusando las páginas ES (sin duplicar archivos); el contenido no
  // traducido cae a ES. El locale se deriva de la URL en cada componente.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
    fallback: { en: 'es' },
    fallbackType: 'rewrite',
  },
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
