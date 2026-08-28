/**
 * Diccionario de textos de UI / chrome hardcodeados (SPEC 80).
 * Los labels editables del CMS NO van aquí (usan campos `_en` en Tina + tField);
 * aquí van solo los strings que viven en el código (topbar, aria-labels, etc.).
 *
 * `t(key, locale)` cae a ES si falta la traducción, y a la key si falta ES.
 */
import type { Locale } from "./config";

export const UI: Record<Locale, Record<string, string>> = {
  es: {
    "nav.audience.empresas": "Empresas",
    "nav.audience.negocios": "Negocios",
    "topbar.abonados": "Información a abonados y usuarios",
    "search.aria": "Buscar",
    "lang.switch.aria": "Cambiar idioma",
    "menu.open.aria": "Abrir menú",
    "menu.close.aria": "Cerrar menú",
    "breadcrumb.home": "Inicio",

    /* Bloque de soluciones (SPEC 108). */
    "sol.eyebrow": "[ SOLUCIONES ]",
    "sol.cta": "Conoce más",
    "sol.vermas": "Ver más",
    "sol.rail.aria": "Categorías de solución",
    "sol.esc.ciber.r1": "Acceso verificado · ERP central",
    "sol.esc.ciber.r2": "Solicitud anómala bloqueada",
    "sol.esc.ciber.r3": "Endpoint aislado y saneado",
    "sol.esc.ciber.r4": "Sesión revalidada · sede Lima",
    "sol.esc.ciber.r5": "Tráfico depurado en el borde",
    "sol.esc.ciber.r6": "Sin incidentes abiertos",
  },
  en: {
    "nav.audience.empresas": "Companies",
    "nav.audience.negocios": "Business",
    "topbar.abonados": "Subscriber & user information",
    "search.aria": "Search",
    "lang.switch.aria": "Change language",
    "menu.open.aria": "Open menu",
    "menu.close.aria": "Close menu",
    "breadcrumb.home": "Home",

    /* Bloque de soluciones (SPEC 108). */
    "sol.eyebrow": "[ SOLUTIONS ]",
    "sol.cta": "Learn more",
    "sol.vermas": "See more",
    "sol.rail.aria": "Solution categories",
    "sol.esc.ciber.r1": "Access verified · core ERP",
    "sol.esc.ciber.r2": "Anomalous request blocked",
    "sol.esc.ciber.r3": "Endpoint isolated and cleaned",
    "sol.esc.ciber.r4": "Session revalidated · Lima site",
    "sol.esc.ciber.r5": "Traffic scrubbed at the edge",
    "sol.esc.ciber.r6": "No open incidents",
  },
};

export function t(key: string, locale: Locale): string {
  return UI[locale]?.[key] ?? UI.es[key] ?? key;
}
