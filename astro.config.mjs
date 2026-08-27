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
  // i18n (SPEC 80): ES por defecto en la raíz, EN bajo /en/. Las páginas /en son
  // wrappers estáticos reales (src/pages/en/**) que renderizan la misma página ES;
  // el locale se deriva de la URL. NO se usa `fallback` (en output estático genera
  // redirects, no páginas renderizadas — ver SPEC 80, riesgo #1).
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Prefetch (SPEC 110): al pasar el cursor (o tocar/enfocar) un enlace interno
  // se descarga su HTML, así la navegación con View Transitions es instantánea.
  // `prefetchAll` lo activa en TODOS los enlaces sin tener que marcarlos uno a
  // uno; se puede desactivar por enlace con `data-astro-prefetch="false"` o
  // cambiar su estrategia con `data-astro-prefetch="viewport|load|tap"`.
  // Astro respeta el ahorro de datos y las conexiones lentas (Save-Data / 2G).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
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
