# SPEC 90 — Nosotros: Rubros marquee de 2 filas (íconos outline)

> **Status:** Aprobado
> **Depends on:** SPEC 05 (slider de rubros actual), SPEC 47 (imagen de fondo en rubros — que este spec retira en esta sección), SPEC 40/62/68 (motor de slider Embla — deja de usarse aquí)
> **Date:** 2026-08-03
> **Objective:** Reemplazar el slider de rubros de `/nosotros` por un marquee de dos filas de tiles con ícono outline y nombre debajo (fila superior corre a la derecha, inferior a la izquierda), con el título fijo a la izquierda y la fila derecha a opacidad tenue, funcional en 1024/768/móvil.

---

## Scope

**Dentro:**

- Reescribir `src/components/nosotros/RubrosReact.tsx` de slider (Embla + flechas + cards con foto) a **marquee CSS de 2 filas** de tiles.
- **Layout dividido:** título `about.rubros.title` fijo a la izquierda; las 2 filas de tiles corren en la mitad/columna derecha (ref #8). En móvil se apila (título arriba, filas debajo).
- **Tile:** contenedor redondeado con borde/fondo tenue, **ícono outline** (Lucide, ya mapeado en `ICONS`) centrado, y el **nombre debajo del tile** (fuera del cuadro). Se retira la foto de fondo en esta sección.
- **Contenido de filas:** ambas filas contienen los **9 rubros**; cada fila se duplica en el DOM para un loop infinito sin costura. Fila superior anima →, fila inferior ← con offset de inicio.
- **Opacidad:** la zona del marquee se muestra a opacidad tenue (~0.5) constante; máscara de desvanecido (`mask`/gradiente) en los bordes izquierdo y derecho para que los tiles entren/salgan suaves.
- **Movimiento:** animación CSS `transform: translateX` en loop continuo, velocidad constante; respeta `prefers-reduced-motion: reduce` (se detiene, muestra las filas estáticas).
- Ajustar `src/pages/nosotros/index.astro` si cambian las props que recibe `RubrosReact` (retirar `autoplay`/`intervalMs`/`effect` si dejan de usarse).
- Revisar responsive en **1024, 768 y móvil**: tamaño de tile, gap, nº de filas visibles y apilado del título.
- i18n intacto: título vía `tField(rubros,'title',locale)`, nombre vía `tField(item,'label',locale)` (fallback ES). El `/en` hereda por el wrapper existente.

**Fuera (para otros specs):**

- Quitar el campo `image` del schema Tina de rubros o borrar los assets de `images/rubros/*`. Se dejan en el schema/contenido (por si otra sección los reusa); solo se ignoran aquí.
- Hacer los tiles clicables / enlazar cada rubro a una página.
- Interacción de hover (pausa o realce del tile) — se descartó explícitamente.
- Reintroducir flechas de navegación o autoplay configurable por CMS.
- Cambiar el set de íconos o los rubros del contenido.

---

## Modelo de datos

**No introduce datos nuevos.** Reutiliza `about.rubros` tal cual:

- `title` / `title_en` — título de la sección.
- `items[]` con `{ icon, label, label_en }`. El campo `image` sigue existiendo en el schema y el contenido pero **no se lee** en esta sección.

**Config obsoleta:** `global.sliders.rubros` (`autoplay`, `intervalMs`, `effect`) deja de gobernar este componente (ya no hay slider). Se deja en el schema pero se documenta como sin efecto para rubros; la velocidad del marquee se fija en código (constante CSS). Se retiran esas props del montaje en `nosotros/index.astro`.

---

## Plan de implementación

1. **Reescribir `RubrosReact.tsx`.** Quitar `useSlider`, `SliderArrows`, la lógica de `image`/overlay y las props `autoplay`/`intervalMs`/`effect`/`SliderEffect`. Conservar `useTina`, el fallback ES/EN, el mapa `ICONS` y `tField`. Estado: compila renderizando los rubros como lista simple.

2. **Layout dividido.** Contenedor `md:flex`: título a la izquierda (ancho fijo, p.ej. `max-w-[360px]`), zona de marquee a la derecha ocupando el resto y con `overflow-hidden`. En `<md` apilar (título arriba full-width, marquee debajo). Estado: título izq / marquee der en desktop, apilado en móvil.

3. **Tile de rubro.** Componente `tile(item)`: cuadro redondeado con borde/fondo tenue + ícono outline centrado (`Icon` de `ICONS`, fallback `LuBuilding`) y `<span>` con el nombre **debajo** del cuadro. Estado: tiles con el look de la ref #7/#8.

4. **Dos filas + duplicado.** Renderizar dos `track` (fila 1 y fila 2), cada uno con `items` **duplicados** (`[...items, ...items]`) dentro de un flex en línea. Fila 2 arranca con un offset (p.ej. rota el array o `animation-delay` negativo). Estado: dos filas de tiles en línea.

5. **Animación marquee.** Keyframes CSS `translateX(0 → -50%)` en loop infinito lineal; fila 1 dirección normal (→ visualmente = translate negativo del track pre-desplazado) y fila 2 en reverse (←). Velocidad por `animation-duration` constante. Estado: ambas filas corren en sentidos opuestos, sin salto al reciclar.

6. **Opacidad + máscara de bordes.** Opacidad tenue (~0.5) en la zona del marquee y `mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)` (con `-webkit-mask`) en cada fila para el fade lateral. Estado: filas tenues que se desvanecen en los extremos.

7. **`prefers-reduced-motion`.** `@media (prefers-reduced-motion: reduce)` → `animation: none` en ambas filas (quedan estáticas, mostrando la primera copia). Estado: sin movimiento si el usuario lo pidió.

8. **Montaje.** Actualizar `src/pages/nosotros/index.astro`: mantener `<RubrosReact client:visible />` pasando `query/variables/data/locale`, retirando las props de slider ya inexistentes. Estado: `/nosotros` y `/en/nosotros` muestran el marquee.

9. **Responsive 1024/768/móvil.** Ajustar tamaño de tile, gap y tipografía por breakpoint; verificar que el `overflow-hidden` no genera scroll horizontal en la página y que el apilado en móvil no rompe el título. Estado: se ve bien en los 3 anchos.

---

## Criterios de aceptación

- [ ] `/nosotros` muestra el título "Rubros con los que trabajamos" fijo a la izquierda y dos filas de tiles a la derecha (desktop).
- [ ] Cada tile es un cuadro redondeado con ícono outline centrado y el nombre del rubro **debajo** del cuadro; no hay fotos de fondo.
- [ ] La fila superior corre hacia la derecha y la inferior hacia la izquierda, en loop continuo sin salto perceptible al reciclar.
- [ ] Ambas filas contienen los 9 rubros (duplicados para el loop); la fila inferior arranca con offset respecto a la superior.
- [ ] La zona del marquee se ve a opacidad tenue y con desvanecido en los bordes izquierdo y derecho.
- [ ] No hay flechas, autoplay CMS ni interacción de hover; los tiles no son clicables.
- [ ] Con `prefers-reduced-motion: reduce` las filas quedan estáticas (sin animación).
- [ ] En 1024, 768 y móvil la sección se ve correcta: en móvil el título va arriba y las filas debajo; no aparece scroll horizontal en la página.
- [ ] En `/en/nosotros` el título y los nombres leen `_en` con fallback a ES.
- [ ] `npm run build` pasa sin errores ni warnings de tipos.

---

## Decisiones

- **Sí:** marquee con animación **CSS pura** (keyframes `translateX`), no Embla/JS. Es continuo, ligero y no necesita el motor de arrastre.
- **Sí:** retirar las fotos de fondo en esta sección (pedido: "los íconos de esa forma"). El campo `image` se conserva en schema/contenido pero se ignora aquí.
- **Sí:** cada fila contiene los **9 rubros** duplicados. Más denso y más simple que repartir 5/4; el offset entre filas evita que se vean sincronizadas.
- **Sí:** layout título-izquierda / marquee-derecha (ref #8), apilado en móvil.
- **No:** hover con pausa/realce. Descartado explícitamente: el marquee solo corre a opacidad tenue constante.
- **No:** mantener flechas/autoplay configurable por CMS. El marquee no los necesita; se retiran las props de slider.
- **Sí:** velocidad fija en código. `global.sliders.rubros` queda sin efecto (no se borra para no romper el schema).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Salto visible al reciclar el loop | Duplicar exactamente el set (`[...items,...items]`) y animar de `0` a `-50%`; los anchos de tile+gap iguales garantizan continuidad. |
| `overflow` del marquee genera scroll horizontal en la página | `overflow-hidden` en el contenedor de cada fila y `min-w-0` en la columna flex derecha. Verificar en móvil. |
| La máscara de bordes no soporta prefijos en algún navegador | Incluir `mask-image` y `-webkit-mask-image`; degradación aceptable (sin fade) si falta. |
| `prefers-reduced-motion` deja filas cortadas | Con `animation:none` la primera copia llena el ancho; validar que se vea completa y estática. |
| Tiles demasiado pequeños/grandes por breakpoint | Definir tamaños explícitos en 1024/768/móvil (paso 9) y QA visual en los 3 anchos. |
