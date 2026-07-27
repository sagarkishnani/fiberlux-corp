/**
 * Helpers de i18n (SPEC 80). Todos BASE_URL-aware (el sitio puede vivir bajo /staging).
 *
 * - getLocale(url): deriva el locale del path (/en → 'en', si no 'es').
 * - localizedPath(pathname, locale): equivalente de una ruta en el otro idioma.
 * - tField(obj, key, locale): lee `key_en` en EN con fallback a `key` (ES).
 */
import { type Locale } from "../i18n/config";

const BASE = import.meta.env.BASE_URL || "/";

/** base normalizada con slash inicial y final: "/" o "/staging/". */
function normBase(): string {
  let b = BASE;
  if (!b.startsWith("/")) b = "/" + b;
  if (!b.endsWith("/")) b = b + "/";
  return b;
}

/** path relativo a base, sin slashes en los extremos: "/staging/en/nosotros/" → "en/nosotros". */
function stripBase(pathname: string): string {
  const b = normBase();
  let p = pathname.startsWith(b) ? pathname.slice(b.length) : pathname.replace(/^\//, "");
  return p.replace(/^\/+|\/+$/g, "");
}

export function getLocale(url: URL | string): Locale {
  const pathname = typeof url === "string" ? url : url.pathname;
  const rel = stripBase(pathname);
  return rel === "en" || rel.startsWith("en/") ? "en" : "es";
}

export function localizedPath(pathname: string, locale: Locale): string {
  const b = normBase();
  const hadTrailing = pathname.endsWith("/");
  let rel = stripBase(pathname);

  // Quitar el prefijo de idioma existente para obtener la ruta base (ES).
  if (rel === "en") rel = "";
  else if (rel.startsWith("en/")) rel = rel.slice(3);

  const localized = locale === "en" ? (rel ? `en/${rel}` : "en") : rel;
  let out = `${b}${localized}`.replace(/\/{2,}/g, "/");
  if (hadTrailing && !out.endsWith("/")) out += "/";
  return out;
}

export function tField(
  obj: Record<string, any> | null | undefined,
  key: string,
  locale: Locale
): string {
  if (!obj) return "";
  if (locale === "en") {
    const en = obj[`${key}_en`];
    if (en != null && en !== "") return en;
  }
  return obj[key] ?? "";
}
