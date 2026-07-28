# SPEC 80 — i18n ES/EN: infraestructura, switcher y traducción de todo el sitio

> **Estado:** Aprobado
> **Depende de:** SPEC 33 (HeaderV2 / topbar), SPEC 07 (footer)
> **Fecha:** 2026-07-27
> **Objetivo:** Montar el bilingüe ES/EN (ES por defecto) con rutas `/en/`, switcher de idioma en el header, traducción del chrome y **de todo el contenido del sitio** (pantallas, 4 categorías de soluciones, 35 subservicios, blog, legales) vía campos `_en` con fallback a ES.

---

## Por qué existe este spec

i18n en todo el sitio es grande (routing, schema de Tina, cada componente, SEO). Originalmente se planteó dividir en infra + specs de contenido; **por decisión del cliente todo el trabajo de i18n vive en este mismo spec**. Se implementó en lotes (chrome → pantallas principales → soluciones → subservicios → blog → legales), pero todo aquí. El contenido traducido es un **borrador EN** que el cliente refina en TinaCMS; lo que quede vacío en `_en` cae a ES.

---

## Scope

**In:**

- **Config Astro i18n:** `defaultLocale: 'es'`, `locales: ['es','en']`, `prefixDefaultLocale: false`, `fallback: { en: 'es' }` (rewrite) → `/en/*` se emite para toda ruta existente, sirviendo la página ES.
- **Helpers i18n:** `getLocale(url)`, `localizedPath(path, locale)`, `tField(obj, key, locale)` (lee `key_en` con fallback a `key`), y diccionario de UI `t(key, locale)`.
- **Plumbing de locale:** `BaseLayout` deriva el locale de la URL, pone `<html lang={locale}>` y lo pasa a `HeaderV2` y `Footer`.
- **Switcher de idioma** en `HeaderV2React` (topbar desktop y topbar mobile, "ES ▾" con dropdown ES/EN, según el diseño), que enlaza la ruta actual a su equivalente en el otro idioma.
- **Traducción del chrome:** nav + topbar + footer. Labels CMS (`global.nav`, `global.footer`) ganan campos `_en` en el schema y se leen con `tField`; textos hardcodeados del topbar (Empresas/Negocios, "Información a abonados y usuarios") vía diccionario `t()`.
- **Convención `_en`** documentada en `CLAUDE.md`.
- **Rutas `/en` reales** vía wrappers estáticos por página (`src/pages/en/**`) — el `fallback` de Astro en estático genera redirects, no páginas renderizadas, así que se usan wrappers (ver Decisiones).
- **Traducción de contenido (todo el sitio):** campos `_en` en el schema + contenido EN de borrador + `tField`/locale en los componentes de:
  - Pantallas: home, nosotros, casos de éxito, formas de pago, soporte, info-abonados, fiberlux-app, contacto.
  - Soluciones: 4 categorías (hero, valor, FAQ, why) + 35 subservicios (title, hero heading/intro/note, beneficios/casos-de-uso/FAQ, why, campos comunes).
  - Blog: `title`/`excerpt` EN en listados; campo `body_en` para el artículo completo.
  - Legales: `eyebrow`/`title` EN; campo `body_en` para el documento completo.
- **Componentes compartidos** (cifras "¿Por qué Fiberlux?", testimonios, blog preview) traducidos → afectan todas las páginas donde aparecen.

**Out of scope (fallback a ES / acción del cliente):**

- **Cuerpos largos rich-text** que el cliente debe traducir/aprobar oficialmente: `body_en` de **legales**, `body_en` de **artículos del blog**, y descripciones rich-text de pasos de Formas de pago y respuestas de FAQ. Todos tienen su campo `_en` listo; vacío ⇒ ES.
- **Detalle profundo de subservicios** (textos de cada card de beneficios, preguntas de FAQ por subservicio): campos `_en` disponibles, borrador parcial; el cliente completa/afina.
- **Labels/mensajes de los formularios** (`DynamicFormReact`, validación, éxito/error).
- **Meta SEO por idioma** (hreflang, og:locale) más allá de `<html lang>`.
- **Redirección automática** por idioma del navegador / cookie de preferencia (el switcher son enlaces explícitos).

---

## Data model

**1. `astro.config.mjs` — bloque i18n** (convive con `base`):

```js
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  routing: { prefixDefaultLocale: false },
  fallback: { en: 'es' },
  fallbackType: 'rewrite',
}
```

**2. `src/i18n/config.ts`:**

```ts
export const LOCALES = ['es', 'en'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'es';
```

**3. `src/i18n/ui.ts`** — diccionario de UI (chrome + strings comunes):

```ts
export const UI: Record<Locale, Record<string, string>> = {
  es: { 'nav.audience.empresas': 'Empresas', /* … */ },
  en: { 'nav.audience.empresas': 'Companies', /* … */ },
};
export function t(key: string, locale: Locale): string {
  return UI[locale]?.[key] ?? UI.es[key] ?? key; // fallback a ES, luego a la key
}
```

**4. `src/utils/i18n.ts`:**

```ts
getLocale(url: URL): Locale                 // 'en' si el path empieza en {base}en/, si no 'es'
localizedPath(path: string, locale: Locale) // agrega/quita el prefijo /en respetando BASE_URL
tField(obj, key, locale)                    // locale==='en' ? (obj[`${key}_en`] || obj[key]) : obj[key]
```

**5. Colección `global` (Tina)** — campos `_en` hermanos para los labels del chrome (nav + footer). Ej.: junto a cada `label` del nav, un `label_en` opcional (vacío ⇒ ES). Sin romper el contenido actual.

---

## Implementation plan

1. **Config i18n + rutas EN.** Añadir el bloque `i18n` a `astro.config.mjs`. Verificar que `npm run build` emite `/en/**` para páginas estáticas y dinámicas (getStaticPaths), sirviendo el contenido ES. *Test:* `dist/en/index.html`, `dist/en/nosotros/index.html`, `dist/en/soluciones/<x>/index.html` existen.

2. **Helpers + diccionario.** Crear `src/i18n/config.ts`, `src/i18n/ui.ts` (con las claves del chrome) y `src/utils/i18n.ts` (`getLocale`, `localizedPath`, `tField`). *Test:* unit manual — `getLocale` detecta `/en/`, `tField` cae a ES cuando `_en` vacío, `localizedPath('/nosotros','en')` → `/en/nosotros`.

3. **Plumbing de locale en `BaseLayout`.** `const locale = getLocale(Astro.url)`; `<html lang={locale}>`; pasar `locale` a `HeaderV2` y `Footer`. *Test:* en `/` el html es `lang="es"`; en `/en/` es `lang="en"`.

4. **Switcher de idioma.** En `HeaderV2React` añadir el control "ES ▾" (dropdown ES/EN) en la topbar desktop (extremo derecho, junto a "Información a abonados") y en la topbar mobile, según el diseño. Cada opción enlaza a `localizedPath(currentPath, opción)`; marca el idioma activo. *Test:* estando en `/nosotros`, elegir EN navega a `/en/nosotros` y viceversa.

5. **Traducir el chrome.**
   - Schema Tina: añadir `_en` a los labels de `global.nav` y `global.footer`.
   - `HeaderV2React`: leer labels de nav con `tField(item,'label',locale)`; strings hardcodeados del topbar (Empresas/Negocios, "Información a abonados y usuarios") vía `t(key, locale)`.
   - `Footer.astro`/su React: labels con `tField`/`t` según origen.
   *Test:* con un `label_en` lleno, en `/en` el nav muestra EN; sin llenar, muestra ES. La topbar hardcodeada cambia con el diccionario.

6. **Documentar la convención.** En `CLAUDE.md`: sección i18n — rutas `/en`, `tField`/`t`, convención `_en`, y que los specs de contenido llenan `_en` por colección. *Test:* la doc explica cómo traducir una página nueva.

---

## Acceptance criteria

- [ ] `/en/<cualquier-ruta>` resuelve para todas las páginas (estáticas y dinámicas); el contenido aún no traducido se ve en ES.
- [ ] `<html lang>` es `es` en la raíz y `en` bajo `/en/`.
- [ ] El switcher "ES ▾" aparece en topbar desktop y mobile (según diseño) y alterna ES↔EN manteniendo la misma página.
- [ ] Los labels de nav/footer muestran EN cuando su `_en` está lleno; si está vacío, ES.
- [ ] Los textos hardcodeados del topbar cambian según el diccionario de UI.
- [ ] El sitio ES en la raíz no cambia de comportamiento ni de URLs.
- [ ] `npm run build` compila sin errores y no rompe rutas existentes ni redirects.

---

## Decisions

- **Rutas `/en/` con Astro i18n + `fallback` rewrite:** emite EN para todo el sitio reusando las páginas ES (sin duplicar 20+ archivos). ES siempre en la raíz.
- **Locale desde la URL** (helper propio), no dependemos de `Astro.currentLocale` para el render de islas: robusto y explícito; se pasa como prop a los componentes.
- **Campo `_en` hermano por campo** con fallback a ES (elección del cliente): una sola fuente por colección, sin migrar contenido.
- **Diccionario i18n en código** para textos de UI/chrome hardcodeados; labels CMS del chrome sí a `_en` en `global`.
- **Sin auto-redirect ni cookie** en este spec: el switcher son enlaces explícitos; menos complejidad y sorpresas.
- **Dividido:** este spec = base + switcher + chrome; el contenido se traduce en specs por página.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `fallback: rewrite` no emite `/en` para rutas dinámicas (getStaticPaths) o no expone el locale correcto | Verificar en el paso 1 sobre rutas estáticas y dinámicas; si falla, plan B: generar `/en` con wrappers/`getStaticPaths` por locale (más trabajo, se aísla a otro spec). |
| El switcher enlaza a `/en` de una ruta que el fallback no generó → 404 | El criterio de aceptación exige que `/en/*` resuelva para toda ruta antes de cerrar el spec. |
| Duplicar campos `_en` infla el schema de `global` | En este spec solo el chrome (nav/footer); el patrón queda acotado y documentado. |
| `base` (`/staging`) + prefijo `/en` producen dobles slashes o rutas mal armadas | `localizedPath`/`getLocale` son `BASE_URL`-aware (como el resto del sitio). |
| Contenido EN "a medias" (mucho en ES) puede confundir | Es el comportamiento pedido (fallback a ES); los specs de contenido van completando `_en`. |

---

## Lo que **no** entra

- Traducción del contenido de páginas y formularios (specs siguientes, por página/colección).
- SEO por idioma (hreflang/og:locale), redirección automática, cookie de preferencia.
- Traducción de posts del blog.
