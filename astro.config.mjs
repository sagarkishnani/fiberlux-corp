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
    // SPEC 109: el portafolio se reorganizó en 5 categorías y 30 soluciones.
    // Las URLs renombradas redirigen; las 15 soluciones retiradas quedan en 404
    // a propósito, porque ya no se ofrecen.
    '/soluciones/ciberseguridad-gestionada': '/soluciones/ciberseguridad',
    '/soluciones/data-center-cloud': '/soluciones/data-center',
    '/soluciones/conectividad-empresarial': '/soluciones/conectividad',
    '/soluciones/servicios-gestionados': '/soluciones/infraestructura',
    '/soluciones/ciberseguridad-gestionada/ngfw-seguridad-perimetral': '/soluciones/ciberseguridad/perimetral',
    '/soluciones/ciberseguridad-gestionada/edr-xdr-mdr': '/soluciones/ciberseguridad/end-point',
    '/soluciones/ciberseguridad-gestionada/seguridad-correo-filtrado-web': '/soluciones/ciberseguridad/correo',
    '/soluciones/ciberseguridad-gestionada/mfa-control-identidad': '/soluciones/ciberseguridad/usuarios',
    '/soluciones/ciberseguridad-gestionada/waf': '/soluciones/ciberseguridad/aplicaciones',
    '/soluciones/ciberseguridad-gestionada/concientizacion-phishing': '/soluciones/ciberseguridad/concientizacion-phishing',
    '/soluciones/data-center-cloud/nube-publica': '/soluciones/data-center/virtual-server',
    '/soluciones/data-center-cloud/baas': '/soluciones/data-center/baas',
    '/soluciones/data-center-cloud/draas': '/soluciones/data-center/draas',
    '/soluciones/servicios-gestionados/wifi-gestionado': '/soluciones/infraestructura/wifi-gestionado',
    '/soluciones/conectividad-empresarial/balanceo-de-enlaces': '/soluciones/infraestructura/balanceadores',
    '/soluciones/servicios-gestionados/videovigilancia-gestionada': '/soluciones/infraestructura/video-vigilancia',
    '/soluciones/servicios-gestionados/comunicaciones-unificadas': '/soluciones/comunicaciones/comunicaciones-unificadas',
    '/soluciones/servicios-gestionados/colaboracion-empresarial': '/soluciones/comunicaciones/colaboracion-ia',
    '/soluciones/conectividad-empresarial/internet-corporativo': '/soluciones/conectividad/internet-dedicado',
    '/soluciones/conectividad-empresarial/internet-alta-disponibilidad': '/soluciones/conectividad/alta-disponibilidad',
    '/soluciones/conectividad-empresarial/conectividad-satelital': '/soluciones/conectividad/acceso-satelital',
    '/soluciones/conectividad-empresarial/transmision-de-datos-l2l': '/soluciones/conectividad/lan-to-lan',
    '/soluciones/conectividad-empresarial/fibra-oscura': '/soluciones/conectividad/fibra-oscura',
    '/soluciones/conectividad-empresarial/sd-wan': '/soluciones/conectividad/sd-wan',
    // Las mismas rutas bajo /en (SPEC 80: cada ruta se emite dos veces).
    '/en/soluciones/ciberseguridad-gestionada': '/en/soluciones/ciberseguridad',
    '/en/soluciones/data-center-cloud': '/en/soluciones/data-center',
    '/en/soluciones/conectividad-empresarial': '/en/soluciones/conectividad',
    '/en/soluciones/servicios-gestionados': '/en/soluciones/infraestructura',
    '/en/soluciones/ciberseguridad-gestionada/ngfw-seguridad-perimetral': '/en/soluciones/ciberseguridad/perimetral',
    '/en/soluciones/ciberseguridad-gestionada/edr-xdr-mdr': '/en/soluciones/ciberseguridad/end-point',
    '/en/soluciones/ciberseguridad-gestionada/seguridad-correo-filtrado-web': '/en/soluciones/ciberseguridad/correo',
    '/en/soluciones/ciberseguridad-gestionada/mfa-control-identidad': '/en/soluciones/ciberseguridad/usuarios',
    '/en/soluciones/ciberseguridad-gestionada/waf': '/en/soluciones/ciberseguridad/aplicaciones',
    '/en/soluciones/ciberseguridad-gestionada/concientizacion-phishing': '/en/soluciones/ciberseguridad/concientizacion-phishing',
    '/en/soluciones/data-center-cloud/nube-publica': '/en/soluciones/data-center/virtual-server',
    '/en/soluciones/data-center-cloud/baas': '/en/soluciones/data-center/baas',
    '/en/soluciones/data-center-cloud/draas': '/en/soluciones/data-center/draas',
    '/en/soluciones/servicios-gestionados/wifi-gestionado': '/en/soluciones/infraestructura/wifi-gestionado',
    '/en/soluciones/conectividad-empresarial/balanceo-de-enlaces': '/en/soluciones/infraestructura/balanceadores',
    '/en/soluciones/servicios-gestionados/videovigilancia-gestionada': '/en/soluciones/infraestructura/video-vigilancia',
    '/en/soluciones/servicios-gestionados/comunicaciones-unificadas': '/en/soluciones/comunicaciones/comunicaciones-unificadas',
    '/en/soluciones/servicios-gestionados/colaboracion-empresarial': '/en/soluciones/comunicaciones/colaboracion-ia',
    '/en/soluciones/conectividad-empresarial/internet-corporativo': '/en/soluciones/conectividad/internet-dedicado',
    '/en/soluciones/conectividad-empresarial/internet-alta-disponibilidad': '/en/soluciones/conectividad/alta-disponibilidad',
    '/en/soluciones/conectividad-empresarial/conectividad-satelital': '/en/soluciones/conectividad/acceso-satelital',
    '/en/soluciones/conectividad-empresarial/transmision-de-datos-l2l': '/en/soluciones/conectividad/lan-to-lan',
    '/en/soluciones/conectividad-empresarial/fibra-oscura': '/en/soluciones/conectividad/fibra-oscura',
    '/en/soluciones/conectividad-empresarial/sd-wan': '/en/soluciones/conectividad/sd-wan',
  },
  integrations: [
    tailwind(),
    react(),
    tinaDirective(),
  ],
});
