# SPEC 81 — Búsqueda del sitio (overlay con blur)

> **Estado:** Implementado
> **Depende de:** SPEC 61 (ícono de lupa placeholder en HeaderV2), SPEC 11/12 (soluciones/subservicios), SPEC 15 (blog)
> **Fecha:** 2026-07-27
> **Objetivo:** Implementar la búsqueda del sitio como un overlay que abre desde la lupa del header (con el fondo en blur), busca sobre el contenido (soluciones, subservicios, páginas y blog) y muestra los resultados como cards, con las 4 categorías de soluciones como estado inicial.

---

## Por qué existe este spec

El header ya tiene la lupa como placeholder sin función (spec 61, que la dejó lista "para el spec de búsqueda"). El sitio es SSG, así que la búsqueda se resuelve con un **índice JSON generado en build** que el cliente filtra sin backend.

---

## Scope

**In:**

- **Índice de búsqueda** generado en build (`/search-index.json`) con entradas de: categorías de soluciones (`service`), subservicios (`subservicio`), posts del blog (`post`) y páginas principales (Nosotros, Casos de éxito, Contacto, Formas de pago, Soporte técnico, Información a abonados, Fiberlux App, Home).
- **Overlay de búsqueda** (`SearchOverlay.tsx`) que abre desde la lupa de `HeaderV2React`, con **fondo en blur**, título "Busca información o soluciones", input, X para cerrar.
- **Estado inicial (sin query):** lista de las **4 categorías de soluciones** (como el diseño).
- **Al escribir:** filtrado por coincidencia normalizada (minúsculas + sin tildes) sobre título/descripción, con ranking; resultados como **cards** dentro del overlay (línea visual Fiberlux), cada una navega a su URL.
- **UX:** blur de fondo, foco en el input al abrir, cerrar con X / Esc / click fuera, bloqueo de scroll del body mientras está abierto, foco de vuelta a la lupa al cerrar. Desktop y mobile.
- Estados: vacío (categorías), con resultados (cards), sin resultados (mensaje).

**Out of scope:**

- Página de resultados dedicada `/buscar?q=` (las cards viven dentro del overlay).
- Búsqueda difusa/typo-tolerant (Fuse.js) — se usa coincidencia simple.
- i18n de la búsqueda: el índice se genera en ES; cuando aterrice i18n (spec 80+), se hará por idioma. Aquí queda ES.
- Analítica de búsquedas, sugerencias/autocompletado con historial, resaltado de coincidencias en el texto.
- Cambios al diseño/posición de la lupa (spec 61); solo se le agrega el `onClick`.

---

## Data model

Sin cambios de schema Tina. Se introduce:

**1. Endpoint de índice — `src/pages/search-index.json.ts`** (emite `/search-index.json`), array de:

```ts
interface SearchEntry {
  title: string;
  description?: string;                         // extracto corto (intro/excerpt)
  url: string;                                  // BASE_URL-aware
  type: 'solucion' | 'subservicio' | 'pagina' | 'blog';
  category?: string;                            // solución padre (para subservicios)
}
```

Construido con el `client` de Tina (como las páginas `.astro`): `service` → `/soluciones/<slug>`; `subservicio` → `/soluciones/<solucionSlug>/<filename>` (category = `solucionTitle`); `post` → `/blog/<slug>`; páginas principales como entradas fijas derivadas de sus rutas/títulos.

**2. `src/utils/search.ts`:**

```ts
normalize(s: string): string                     // lowercase + sin diacríticos
searchEntries(entries, query): SearchEntry[]      // match por términos + ranking (title > description, startsWith boost)
```

**3. `src/components/shared/SearchOverlay.tsx`** (island) + estado de apertura en `HeaderV2React`. Sin persistencia entre sesiones.

---

## Implementation plan

1. **Índice `src/pages/search-index.json.ts`.** Consultar `service`, `subservicio`, `post` vía el client de Tina y armar las `SearchEntry` (URLs `BASE_URL`-aware); añadir las páginas principales como entradas fijas. *Test:* `/search-index.json` devuelve un array con entradas de los 4 `type`.

2. **Util `src/utils/search.ts`.** `normalize` (quita tildes con `normalize('NFD')`) y `searchEntries` (divide la query en términos, exige que todos aparezcan en `title+description` normalizados, ordena por relevancia). *Test:* "conectividad" trae la categoría y sus subservicios; "cnectividad" no (no es fuzzy); "data center" (2 términos) matchea la categoría correcta.

3. **`SearchOverlay.tsx`.** Island que al montarse por primera vez hace `fetch('/search-index.json')` (cachea en memoria). Render: backdrop fijo con `backdrop-blur` (bloquea scroll del body), panel oscuro (línea Fiberlux: `bg-greyscale-darkest`, borde tenue, rounded), encabezado "Busca información o soluciones" + botón X, input con placeholder "Ejem. Soluciones de conectividad" y foco automático. Sin query → lista de las 4 categorías (`type==='solucion'`). Con query → `searchEntries` y render de **cards** (título, ruta, descripción, badge de tipo); cada card es un `<a>` a `url`. Sin matches → mensaje "Sin resultados". *Test:* abrir → foco en input y categorías; escribir → cards; click en una → navega.

3b. **Accesibilidad/cierre.** `role="dialog"`, `aria-label`; cerrar con X, Esc y click en el backdrop; al cerrar, foco de vuelta a la lupa; bloquear scroll del body mientras abre (y reanudar Lenis al cerrar). *Test:* Esc y click-fuera cierran; el foco vuelve a la lupa; el body no scrollea con el overlay abierto.

4. **Wire en `HeaderV2React`.** La lupa existente (placeholder) recibe `onClick` que alterna el estado `searchOpen`; montar `<SearchOverlay open={searchOpen} onClose={...} />`. Funciona en desktop y mobile; z-index por encima del header/topbar. *Test:* la lupa abre el overlay en desktop y mobile.

5. **Estilo Fiberlux + blur.** Panel y cards con la paleta de marca (magenta en foco/hover), backdrop con blur oscuro sobre el contenido. Ajustar a la referencia (Image #7) sin copiar Image #8. *Test:* al abrir, el fondo se ve difuminado y el panel sigue la línea visual del sitio.

---

## Acceptance criteria

- [ ] La lupa del header (desktop y mobile) abre el overlay de búsqueda.
- [ ] Con el overlay abierto, el fondo del sitio se ve en **blur** y el body no scrollea.
- [ ] Sin escribir, el overlay muestra las **4 categorías de soluciones**; hacer click navega a `/soluciones/<categoría>`.
- [ ] Al escribir, se filtran soluciones, subservicios, páginas y blog; los resultados se muestran como **cards** y cada una navega a su URL.
- [ ] Una query sin coincidencias muestra un mensaje de "sin resultados".
- [ ] Cerrar con X, Esc o click fuera funciona; el foco vuelve a la lupa.
- [ ] `/search-index.json` se genera en build con entradas de los 4 tipos (`solucion`, `subservicio`, `pagina`, `blog`).
- [ ] `npm run build` compila sin errores; funciona en desktop y mobile.

---

## Decisions

- **Índice JSON en build + filtrado client-side:** encaja con SSG, sin backend; el cliente lo baja una vez y filtra.
- **Indexar todo** (soluciones + subservicios + páginas + blog) — elección del cliente.
- **Cards dentro del overlay**, sin ruta `/buscar` — coincide con "al abrir el search, fondo blur" y evita estado por URL.
- **Estado inicial = 4 categorías de soluciones** (según el diseño).
- **Coincidencia simple normalizada** (sin dependencia): suficiente para el volumen del índice; nada de Fuse.js.
- **Se reutiliza la lupa de spec 61** (solo se le agrega `onClick`); no se cambia su diseño/posición.
- **i18n diferido:** índice en ES por ahora; se hará por idioma cuando aterrice i18n.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El overlay y Lenis (smooth scroll) chocan al bloquear el scroll | Pausar/reanudar Lenis (o `overflow:hidden` en el body) al abrir/cerrar; probar en desktop y mobile. |
| El índice queda desactualizado hasta el próximo build (SSG) | Aceptado; el contenido es CMS git-backed y se rebuildea en cada deploy. |
| Índice grande si el blog crece mucho | Entradas ligeras (title/description/url); `fetch` único cacheado; si escala, paginar o mover a Fuse en otro spec. |
| URLs mal armadas con `base` (`/staging`) | Construir todas las URLs `BASE_URL`-aware, como el resto del sitio. |
| z-index: el overlay queda debajo del header/topbar o de los FAB | Montar el overlay con z-index por encima del header y los botones flotantes. |

---

## Lo que **no** entra

- Página `/buscar?q=` dedicada.
- Búsqueda difusa (Fuse.js), resaltado de coincidencias, historial/autocompletado.
- i18n de la búsqueda.
- Cambios al diseño de la lupa (spec 61).
