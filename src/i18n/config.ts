/**
 * Configuración base de i18n (SPEC 80).
 * ES es el idioma por defecto; EN es secundario con fallback a ES.
 */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
