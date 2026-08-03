# SPEC 89 — Bloque Soluciones scroll-jack (categoría ↔ subservicios)

> **Status:** Implementado
> **Depends on:** SPEC 35 (slider soluciones actual), SPEC 20 (renombre a soluciones), SPEC 12 (páginas subservicio nivel 2)
> **Date:** 2026-08-03
> **Objective:** Reemplazar el carrusel horizontal de soluciones por un bloque anclado (scroll-jack) que cambia la categoría a la izquierda y su lista de subservicios a la derecha conforme se hace scroll, con tooltip "Ver más" que sigue al cursor con retraso.

---

## Scope

**Dentro:**

- Nuevo componente `SolucionesScroll.astro` + `SolucionesScrollReact.tsx` en `src/components/shared/`, alimentado por la misma query `home` (`home.services`).
- Bloque anclado (sticky) al viewport: un contenedor externo alto (≈ `N × 0.8 × 100vh`) con un panel `sticky top-0 h-screen`; el progreso de scroll dentro del wrapper mapea a la categoría activa (`activeIndex = 0..N-1`).
- Columna izquierda animada: eyebrow `[ SOLUCIONES ]`, número grande (`number`), título (`title`), descripción (`description`) y botón "Conoce más" → `url` de la categoría.
- Columna derecha animada: lista de subservicios de la categoría activa, cada fila con índice (`01`…), separador horizontal y enlace a la **página del subservicio**.
- Transición animada de datos al cambiar de categoría (crossfade/slide en ambas columnas), respetando `prefers-reduced-motion` (cambio sin animación).
- Tooltip "Ver más" al hacer hover en una fila: aparece con **delay** (no instantáneo) y persigue al cursor con **lag** (lerp más lento que el puntero). Solo en punteros finos (`pointer: fine`).
- Aplicar el mismo comportamiento anclado en **móvil**, con layout de una columna (izquierda arriba, subservicios debajo).
- Enriquecer el modelo `home.services.items[].bullets` para que cada subservicio tenga `label` + `url` (ver Modelo de datos), con i18n `label_en`.
- Retirar `SolucionesSlider` de las 3 pantallas que lo usan (Home, Soluciones, Soporte) y colocar el nuevo bloque en su lugar.
- Mantener `SolucionesSlider.astro` / `SolucionesSliderReact.tsx` en el repo como componente reutilizable (actualizado a la nueva forma de `bullets`).

**Fuera (para futuros specs):**

- Leer los subservicios desde el catálogo real de cada solución (`src/content/services/*.json`). Se decidió reusar/enriquecer los `bullets` de `home`.
- Rediseñar las páginas de categoría o de subservicio destino.
- Traducir a EN los `label_en` de cada subservicio (el cliente los rellena en Tina; vacío ⇒ fallback ES).
- Autoplay por tiempo o indicadores/paginación clickable de categorías.
- Cambiar los fondos/glows magenta del bloque actual (el nuevo bloque define su propio fondo minimal según la referencia).

---

## Modelo de datos

Se **migra** `home.services.items[].bullets` de lista de strings a lista de objetos, para que cada subservicio tenga texto + destino. Es la única colección afectada y su único consumidor es `SolucionesSlider` (que se conserva y se actualiza a la nueva forma).

Schema en `tina/config.ts` (reemplaza los campos `bullets` / `bullets_en` string-list actuales):

```js
// dentro de home.services.items[]
{
  name: "bullets",
  label: "Subservicios",
  type: "object",
  list: true,
  ui: { itemProps: (b) => ({ label: b?.label || "Subservicio" }) },
  fields: [
    { name: "label",    label: "Nombre",     type: "string" },
    { name: "label_en", label: "Nombre (EN)", type: "string" },
    { name: "url",      label: "URL destino", type: "string" }, // página del subservicio
  ],
}
// se elimina el campo hermano `bullets_en` (queda absorbido en label_en)
```

Contenido migrado en `src/content/home/index.json` (las 4 categorías). Las `url` se pre-rellenan desde el catálogo real de cada solución (`src/content/services/*.json → catalogo.items[].url`) durante la migración; el cliente puede editarlas luego. Ejemplo:

```json
"bullets": [
  { "label": "Internet Corporativo", "label_en": "Corporate Internet",
    "url": "/soluciones/conectividad-empresarial/internet-corporativo" },
  { "label": "Internet Corporativo de alta disponibilidad",
    "url": "/soluciones/conectividad-empresarial/internet-alta-disponibilidad" }
]
```

**Convenciones:**

- El sentinel `"Y más..."` se elimina de los bullets (la referencia no lo muestra). Un subservicio sin `url` se renderiza como fila no clicable (sin tooltip).
- El número de fila (`01`, `02`…) es derivado del índice, no se almacena.
- Lectura i18n: `label` vía `tField(bullet, "label", locale)` (lee `label_en` con fallback ES).
- Todos los `url` se prefijan con `BASE_URL` (`withBase`) por el deploy en subpath.

---

## Plan de implementación

1. **Schema Tina.** En `tina/config.ts` (home.services.items) reemplazar `bullets: string[]` + `bullets_en: string[]` por `bullets: object[]` con `{ label, label_en, url }` (ver Modelo de datos). Correr `npm run dev` una vez para regenerar tipos/cliente en `tina/__generated__/`. Estado: compila, admin muestra los subservicios como objetos.

2. **Migrar contenido.** Reescribir `bullets` en las 4 categorías de `src/content/home/index.json` a objetos; poblar `label` desde el bullet actual, `label_en` desde el `bullets_en` correspondiente, y `url` desde `catalogo.items[].url` del `src/content/services/*.json` de cada categoría. Quitar los `"Y más..."`. Estado: contenido válido para el nuevo schema.

3. **Actualizar componente conservado.** En `SolucionesSliderReact.tsx` cambiar la lectura de bullets de `string` a `b.label` (vía `tField`) y usar `b.url` donde aplique; retirar la lógica de `isMoreLabel`/"Y más". Estado: el componente viejo (aunque no montado en pantallas) compila con la nueva forma.

4. **Esqueleto del nuevo bloque.** Crear `SolucionesScroll.astro` (resuelve `home` + `global.sliders.soluciones` cfg + `locale`, igual que `SolucionesSlider.astro`) y `SolucionesScrollReact.tsx` que solo renderiza el layout estático de la **categoría 0** (izquierda + derecha) sin scroll-jack. Estado: bloque visible y correcto para una categoría.

5. **Motor scroll-jack.** En el React, envolver en un wrapper `height: (N * 0.8 * 100)vh` con panel interno `sticky top-0 h-screen`. Con un listener de scroll (rAF-throttled) calcular el progreso relativo al wrapper y derivar `activeIndex = clamp(floor(progress * N), 0, N-1)`. Renderizar los datos de la categoría activa. Estado: al scrollear cambia de categoría y se libera tras la última.

6. **Transición animada de datos.** Al cambiar `activeIndex`, aplicar crossfade/slide a izquierda (número/título/descripción) y a la lista derecha (`key={activeIndex}` + animación de entrada). Envolver en `@media (prefers-reduced-motion: reduce)` → sin animación. Estado: el cambio se percibe animado.

7. **Filas de subservicio.** Renderizar la lista con índice `01…`, separadores horizontales y `<a href={withBase(b.url)}>` cuando hay `url`; sin `url` → fila no clicable. Estado: filas navegan a su subservicio.

8. **Tooltip "Ver más" con lag.** Elemento flotante único; al entrar en una fila (solo `matchMedia('(pointer: fine)')`) mostrarlo tras un delay (~140 ms) y perseguir el cursor con lerp (`pos += (target - pos) * k`, k≈0.12) en un loop rAF; ocultar en `mouseleave`. Texto "Ver más" / "See more" según locale. Estado: tooltip aparece con retraso y sigue al cursor más lento.

9. **Montaje en pantallas.** En `src/pages/index.astro`, `src/pages/soluciones/index.astro` y `src/pages/soporte-tecnico/index.astro` reemplazar el import/uso de `SolucionesSlider` por `SolucionesScroll`. Verificar que los `/en` correspondientes (si son wrappers que reexportan la página ES) heredan el cambio. Estado: las 3 pantallas muestran el nuevo bloque.

10. **Responsive/móvil.** Ajustar el layout a una columna en móvil (izquierda arriba, subservicios debajo) manteniendo el pin; verificar alturas del wrapper con `100svh`/`100dvh` para evitar saltos por la barra del navegador móvil. Estado: funciona anclado en móvil sin cortes.

---

## Criterios de aceptación

- [ ] El build (`npm run build`) pasa sin errores y sin warnings de tipos de Tina.
- [ ] Home, `/soluciones` y `/soporte-tecnico` muestran el nuevo bloque; ninguna monta ya `SolucionesSlider`.
- [ ] Al hacer scroll sobre el bloque, la sección queda anclada y la categoría (izquierda) avanza 01→02→03→04 y su lista de subservicios cambia en sincronía.
- [ ] Cada categoría ocupa ~0.8 × alto de viewport de scroll antes de pasar a la siguiente; tras la última, el scroll continúa a la sección siguiente.
- [ ] El cambio de categoría se muestra animado (crossfade/slide) en ambas columnas.
- [ ] Con `prefers-reduced-motion: reduce`, el cambio de datos ocurre sin animación.
- [ ] Al hacer hover en una fila con `url`, aparece el tooltip "Ver más" tras un breve delay (no instantáneo) y sigue al cursor con retraso perceptible.
- [ ] El tooltip NO aparece en dispositivos táctiles (`pointer: coarse`).
- [ ] Click en una fila navega a la página del subservicio (`b.url`, con `BASE_URL`); "Conoce más" navega a la página de la categoría.
- [ ] En EN (`/en/...`) los textos de categoría y las filas leen `_en` con fallback a ES; el tooltip dice "See more".
- [ ] En móvil el bloque funciona anclado en una columna, sin saltos por la barra de direcciones.
- [ ] `SolucionesSlider(.astro/React)` sigue en el repo y compila con la nueva forma de `bullets`.

---

## Decisiones

- **Sí:** migrar `bullets` a `object[] {label, label_en, url}` (single source of truth). El único consumidor era `SolucionesSlider`, que se actualiza en el mismo cambio.
- **No:** añadir un campo `subservicios` paralelo dejando `bullets` intacto. Duplicaría el texto y desincronizaría labels.
- **No:** leer del catálogo real (`services/*.json`). Acoplaría el bloque del home a otra colección; el cliente edita todo en `home.services`.
- **Sí:** scroll-jack con `0.8 × 100vh` por categoría. Se siente más ágil que `1 × 100vh` sin perder control del cambio.
- **Sí:** mantener el pin también en móvil (pedido del cliente), con layout de una columna y `svh/dvh`.
- **Sí:** tooltip solo en `pointer: fine`. En táctil el "hover con lag" no aplica y el destino ya es clicable.
- **Sí:** eliminar el sentinel "Y más...". La referencia no lo muestra y ensuciaba la lista.
- **Sí:** conservar `SolucionesSlider` en el repo (pedido explícito: "mantener el slider como componente").

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Scroll-jack se siente atrapante/pega saltos con Lenis (smooth scroll global) | Derivar `activeIndex` del progreso real del wrapper (no de deltas de rueda); no bloquear el scroll nativo, solo mapear posición. Probar con Lenis activo. |
| Pin en móvil + barra de direcciones cambiante causa saltos de alto | Usar `100svh/100dvh` para el panel y medir el wrapper por su rect, no por `window.innerHeight` cacheado. |
| Migración de `bullets` rompe `SolucionesSlider` si se olvida actualizarlo | Paso 3 lo actualiza en el mismo lote; criterio de aceptación lo verifica. |
| `label_en`/`url` vacíos en Tina | `tField` cae a ES; fila sin `url` se renderiza no clicable (sin tooltip). |

---

## Lo que **no** entra en este spec

- Leer subservicios del catálogo real de cada solución.
- Rediseñar las páginas de categoría o subservicio destino.
- Traducir los `label_en` (los rellena el cliente en Tina).
- Autoplay por tiempo o navegación por indicadores clickables.
- Cambiar la identidad visual de fondos/glows más allá de lo que pida la referencia.
