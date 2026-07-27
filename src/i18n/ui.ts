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
  },
  en: {
    "nav.audience.empresas": "Companies",
    "nav.audience.negocios": "Business",
    "topbar.abonados": "Subscriber & user information",
    "search.aria": "Search",
    "lang.switch.aria": "Change language",
    "menu.open.aria": "Open menu",
    "menu.close.aria": "Close menu",
  },
};

export function t(key: string, locale: Locale): string {
  return UI[locale]?.[key] ?? UI.es[key] ?? key;
}
