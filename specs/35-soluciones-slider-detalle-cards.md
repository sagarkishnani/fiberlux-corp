# SPEC 35 — Home/Soluciones: reemplazar el bloque de soluciones por un slider "detalle + cards"

> **Estado:** Implementado
> **Depende de:** SPEC 08 (bloque `StickyCards` que se reemplaza), SPEC 34 (mecánica de slider de certificaciones, tomada como referencia parcial)
> **Fecha:** 2026-07-14
> **Objetivo:** Reemplazar el bloque de soluciones (`StickyCards`) en las 3 páginas que lo usan por un slider horizontal donde la columna izquierda (título + descripción + flechas) se sincroniza con la card activa y cada card muestra los subservicios + "Y más…" + "Conoce más" + número, dejando el componente viejo comentado para reutilizarlo luego.

---

## Alcance

**Dentro:**

- Crear un par de componentes nuevos `src/components/shared/SolucionesSlider.astro` + `SolucionesSliderReact.tsx` que renderiza el diseño de la referencia (Image #5):
  - **Columna izquierda (desktop):** título grande + descripción de la **solución activa** + pill de flechas (anterior/siguiente) estilo certificaciones (izquierda tenue cuando está al inicio, derecha magenta activa).
  - **Columna derecha:** carrusel horizontal de cards; se ve **1 card completa + peek de la siguiente** en desktop.
  - **Card:** fondo oscuro (`#0A0A0A`) con **onda de líneas magenta** decorativa, lista de subservicios (los `bullets` de la solución, como líneas de texto sin viñeta-punto), etiqueta **"Y más…"**, enlace **"Conoce más"** (→ `item.url`) y **número grande** (`item.number`) abajo a la izquierda.
- **Sincronización izquierda ↔ card activa:** al navegar (flechas, drag o scroll), el título + descripción de la izquierda cambian a los de la card activa. En desktop la card activa **no** repite el título (vive solo en la izquierda).
- Reutilizar el objeto `home.services` del CMS **sin cambios de schema**: `title`, `items[]{ number, title, description, icon, bullets, url }`. El campo `icon` pasa a usarse como **fondo decorativo por card** (editable en Tina); por ahora todas las cards apuntan al mismo asset de onda.
- Cargar **un asset de onda magenta** en `public/uploads/soluciones/` y apuntar el `icon` de los items de `home.services` a ese mismo archivo.
- **Reemplazar** `<StickyCards />` por `<SolucionesSlider />` en las 3 páginas: `src/pages/index.astro`, `src/pages/soporte-tecnico/index.astro`, `src/pages/soluciones/index.astro`. En cada una se **comenta** (no se borra) el import y el render de `StickyCards`, con una nota de "reutilizar luego".
- **Mobile (<768px):** título + descripción de la solución activa arriba, cards abajo (1 card + peek), flechas debajo, alineadas a la izquierda (patrón de certificaciones).
- Drag con mouse + snap por card, flechas edge-aware, y respeto a `prefers-reduced-motion` (sin scroll suave), replicando la mecánica ya probada de `CertificacionesSliderReact.tsx`.

**Fuera de alcance (para futuros specs):**

- Borrar o modificar `StickyCardsReact.tsx` / `StickyCards.astro` (quedan intactos, solo comentados en las páginas).
- Cambiar el schema de `home.services` en `tina/config.ts` (se reutiliza tal cual).
- Diseñar/subir un asset de onda distinto por cada card (por ahora todas comparten uno; se podrá diferenciar luego editando `icon` en Tina).
- Convertir "Y más…" en un campo editable del CMS (va como etiqueta estática).
- Tocar el resto del home o de las páginas soporte-técnico / soluciones (Hero, Stats, catálogo, FAQ, etc.).
- Cambiar el contenido textual de las soluciones (títulos, descripciones, bullets ya existen en `home.services`).

---

## Modelo de datos

Esta feature **no introduce estructuras nuevas ni cambia el schema**. Reutiliza `home.services` (ya definido en `tina/config.ts` y poblado en `src/content/home/index.json`):

```js
// home.services — se conserva tal cual
services: {
  title: string,        // título de sección (fallback; el diseño prioriza el título por-card)
  items: [
    {
      number: string,      // "01" … "04" → número grande de la card
      title: string,       // "Conectividad empresarial" → título del panel izquierdo (card activa)
      description: string,  // → descripción del panel izquierdo (card activa)
      icon: string,        // → REUTILIZADO como fondo decorativo (onda magenta) de la card
      bullets: string[],   // → líneas de subservicios dentro de la card
      url: string,          // → destino del enlace "Conoce más"
    },
  ],
}
```

**Cambios de contenido (no de schema):**

- El `icon` de los items de `home.services` en `src/content/home/index.json` se re-apunta al nuevo asset compartido `public/uploads/soluciones/onda-magenta.svg` (o `.png`).
- La etiqueta **"Y más…"** es un texto estático en el componente, no un campo del CMS.
- El enlace **"Conoce más"** usa `item.url`; si un item no tiene `url`, el enlace no se renderiza.

*Nota:* el componente viejo `StickyCardsReact.tsx` seguía usando `icon` como panel morado completo; al quedar solo comentado en las páginas, no hay conflicto — si se reactiva, mostrará el `icon` (ahora onda) en su propio layout, lo cual es aceptable hasta que se decida su contenido definitivo.

---

## Plan de implementación

1. **Cargar el asset de onda magenta** en `public/uploads/soluciones/onda-magenta.svg` (líneas magenta tipo onda sobre transparente/oscuro). Re-apuntar el `icon` de cada item de `home.services` en `src/content/home/index.json` a ese archivo. Verificación: el archivo existe y los 4 items apuntan a él.

2. **Crear `SolucionesSliderReact.tsx`** partiendo de la mecánica de `CertificacionesSliderReact.tsx`: carrusel `overflow-x-auto` con `scroll-snap`, drag de mouse con snap direccional, flechas edge-aware (pill), y `prefers-reduced-motion` → sin scroll suave. Verificación: el carrusel desliza card por card con flechas y drag.

3. **Estado de card activa + sincronización izquierda.** Derivar `activeIndex` de la posición de scroll (y de las flechas/drag). La columna izquierda renderiza `items[activeIndex].title` + `.description`. Verificación: al pasar a la card 02 la izquierda muestra el título/descripción de la solución 02.

4. **Maquetar la card** al diseño de la referencia: contenedor oscuro `#0A0A0A`, borde sutil, `border-radius`, fondo de onda desde `item.icon` (posicionado a sangre, decorativo, sin repetir), lista de `bullets` como líneas de texto (sin punto de viñeta), etiqueta estática **"Y más…"**, enlace **"Conoce más"** (→ `item.url`, oculto si no hay url) y **número grande** (`item.number`) abajo a la izquierda. Verificación: la card se ve como Image #5.

5. **Layout responsive.** Desktop (≥768px): izquierda ~34–40% (título/desc/flechas) + carrusel a la derecha mostrando 1 card + peek. Mobile (<768px): título/desc arriba (sincronizados), carrusel debajo (1 card + peek), flechas debajo alineadas a la izquierda. Verificación: en ambos breakpoints coincide con el patrón de certificaciones/Image #5.

6. **Crear `SolucionesSlider.astro`** (wrapper): resuelve `client.queries.home({ relativePath: "index.json" })` y pasa `{ query, variables, data }` a `SolucionesSliderReact` con `client:visible`, envuelto en `useTina()` para edición visual. Verificación: la sección es editable desde `/admin` (título, descripción, bullets, número, url por item).

7. **Reemplazar en las 3 páginas.** En `src/pages/index.astro`, `src/pages/soporte-tecnico/index.astro` y `src/pages/soluciones/index.astro`: comentar el import y el render de `StickyCards` (con nota "reutilizar luego") e insertar `SolucionesSlider` en su lugar, respetando los solapes `-mt-*`/`z-*` existentes. Verificación: las 3 páginas muestran el slider nuevo y no hay solapes ni cortes al hacer scroll.

8. **QA visual y de consola** contra la referencia en las 3 páginas (desktop + mobile), incluyendo `prefers-reduced-motion`. Verificación: sin errores en consola; navegación por flechas/drag correcta; sincronización izquierda estable.

---

## Criterios de aceptación

- [ ] Existen `src/components/shared/SolucionesSlider.astro` y `SolucionesSliderReact.tsx`.
- [ ] En las 3 páginas (home, soporte-técnico, soluciones) el bloque de soluciones es el **slider nuevo**, no `StickyCards`.
- [ ] En cada una de las 3 páginas el import y el render de `StickyCards` quedan **comentados** (no borrados), con nota para reactivarlos.
- [ ] Los archivos `StickyCardsReact.tsx` y `StickyCards.astro` **siguen existiendo** sin cambios.
- [ ] La **columna izquierda** muestra el **título + descripción de la card activa** y se **actualiza** al navegar con flechas, drag o scroll.
- [ ] La card activa en desktop **no** repite el título (solo bullets + "Y más…" + "Conoce más" + número).
- [ ] Cada card muestra: fondo de **onda magenta** (desde `item.icon`), **lista de subservicios** (`bullets`), etiqueta **"Y más…"**, enlace **"Conoce más"** y **número grande** (`item.number`).
- [ ] El enlace **"Conoce más"** navega a `item.url`; si el item no tiene `url`, el enlace no aparece.
- [ ] Todas las cards comparten el **mismo asset de onda** por ahora, pero el fondo es **editable por card** desde Tina (campo `icon`).
- [ ] En **desktop** se ve **1 card completa + peek** de la siguiente; en **mobile** título/desc arriba, cards y flechas debajo.
- [ ] Las **flechas** son edge-aware (izquierda tenue al inicio, derecha tenue al final) y navegan card por card; el **drag** con mouse hace snap.
- [ ] Con **`prefers-reduced-motion: reduce`** activo, la navegación no usa scroll suave.
- [ ] La sección es **editable desde `/admin`** (título, descripción, bullets, número, url e icon por item).
- [ ] No hay **solapes ni cortes** con las secciones vecinas en ninguna de las 3 páginas.
- [ ] No hay **errores en consola** al cargar y navegar el slider.

---

## Decisiones tomadas y discartadas

- **Sí:** panel izquierdo **sincronizado con la card activa** (título + descripción cambian por card). Confirmado con el cliente: coincide con la referencia, donde la izquierda muestra la solución de la card 01.
- **No:** título de sección fijo + cada card con su propio título. Descartado: en la referencia el título vive en la izquierda y la card solo lleva bullets/número.
- **Sí:** fondo de onda **editable por card en Tina** (reutilizando `icon`), pero por ahora **todas apuntan al mismo asset**. Confirmado con el cliente ("podrían ser diferentes; por ahora el mismo para todos y luego se cambia en Tina").
- **Sí:** reutilizar `home.services` **sin tocar el schema**. Ya tiene number/title/description/icon/bullets/url; evita migraciones y regenerar artefactos de Tina.
- **Sí:** **comentar** el uso de `StickyCards` en las 3 páginas y **conservar** los archivos del componente. Confirmado con el cliente (reutilizarlo luego). Se descartó renombrar el viejo para no cambiar rutas de import.
- **Sí:** tomar la **mecánica de slider de certificaciones** (SPEC 34) como base (drag+snap, flechas edge-aware, reduced-motion), sin copiarla al 100% — el diseño de card y la sincronización izquierda son propios de este bloque.
- **Sí:** **"Y más…"** como etiqueta estática (no campo del CMS). Es un adorno; convertirlo en campo se difiere.
- **Sí:** alcance = **3 páginas** (home, soporte-técnico, soluciones), los únicos lugares donde hoy se renderiza `<StickyCards />`.
- **Definición semi-rápida:** las secciones de Plan, Criterios, Decisiones y Riesgos se redactaron asumiendo defaults razonables (a pedido del cliente: "continúa pero ya asume y guarda el spec"), tras cerrar las 4 decisiones clave por preguntas.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| La sincronización izquierda ↔ scroll puede parpadear si `activeIndex` se recalcula en cada evento de scroll. | Derivar `activeIndex` con `requestAnimationFrame`/redondeo por paso de card, como el cálculo de bordes de certificaciones; actualizar solo cuando cambia el índice. |
| El `scroll-snap` pelea con el scroll programático en Chromium (snap-back). | Reutilizar el patrón de `animateTo()` de certificaciones (desactivar snap durante la animación y restaurarlo al aterrizar). |
| El asset de onda desde `icon` puede desbordar o repetirse mal como fondo. | Posicionar a sangre con `object-fit: cover` / `overflow: hidden` en la card; `background-repeat: no-repeat` si se usa como CSS background. |
| Cards con muchos bullets (Ciberseguridad tiene 6+) pueden variar la altura y afectar el snap. | Altura mínima uniforme de card en desktop; "Y más…" y número anclados abajo con `justify-between`. |
| Al comentar `StickyCards` en las 3 páginas pueden quedar imports huérfanos o solapes `-mt-*`/`z-*` rotos. | Comentar import + render juntos; validar los solapes con las secciones vecinas en el paso 7. |
| Un ancestro con `overflow` podría cortar el peek de la card siguiente. | Mantener el viewport del carrusel con `overflow-x-auto` y la sección con `overflow-hidden` controlado, como en certificaciones. |

---

## Qué **NO** entra en este spec

- Borrar o modificar `StickyCardsReact.tsx` / `StickyCards.astro`.
- Cambiar el schema de `home.services` en `tina/config.ts`.
- Un asset de onda distinto por card (por ahora comparten uno; diferenciable luego en Tina).
- "Y más…" como campo editable del CMS.
- Cambios en otras secciones del home, soporte-técnico o soluciones.
- Cambios en el contenido textual de las soluciones (ya existe en `home.services`).

Cada uno de estos, si aterriza, va en su propio spec.
