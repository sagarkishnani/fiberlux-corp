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
export function stripBase(pathname: string): string {
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

/**
 * Localiza un href interno al idioma activo (SPEC 80). En EN antepone /en a las
 * rutas internas; deja intactos los externos, anclas y mailto/tel, y los marcados
 * como external. En ES devuelve el href tal cual.
 */
export function localizeHref(
  url: string | null | undefined,
  locale: Locale,
  external?: boolean | null
): string {
  const u = url || "";
  if (!u || locale === "es" || external) return u;
  // Externos (con protocolo o //), anclas puras, mailto/tel: sin tocar.
  if (/^([a-z]+:)?\/\//i.test(u) || /^(#|mailto:|tel:)/i.test(u)) return u;
  // Solo rutas internas absolutas ("/algo").
  if (!u.startsWith("/")) return u;
  return localizedPath(u, "en");
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

/**
 * true si un nodo rich-text (AST de Tina) tiene texto no vacío.
 * Tina devuelve un `_en` rich-text vacío (objeto truthy pero sin texto) aunque
 * el campo no exista en el contenido, así que no basta con comprobar truthiness.
 */
export function richHasContent(node: any): boolean {
  const walk = (n: any): string => {
    if (!n) return "";
    if (typeof n.text === "string") return n.text;
    if (Array.isArray(n?.children)) return n.children.map(walk).join("");
    if (Array.isArray(n)) return n.map(walk).join("");
    return "";
  };
  return walk(node?.children ?? node).trim().length > 0;
}

/** Elige el rich-text `key_en` en EN solo si tiene contenido; si no, cae al ES. */
export function richField(obj: any, key: string, locale: Locale): any {
  if (!obj) return null;
  if (locale === "en" && richHasContent(obj[`${key}_en`])) return obj[`${key}_en`];
  return obj[key];
}
