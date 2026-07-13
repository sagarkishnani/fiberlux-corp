# SPEC 25 — Header: fondo con opacidad al recargar estando scrolleado

> **Estado:** Implementado
> **Depende de:**
> - Corrige un bug en el header existente (`HeaderReact.tsx`). Toca la lógica de scroll introducida en el patrón del header y extendida por el **Spec 16** (fondo con opacidad al scroll, temas claro/oscuro).
> - No introduce dependencias nuevas ni modifica el contrato de props del header.
>
> **Fecha:** 2026-07-13
>
> **Objetivo:** Inicializar el estado `scrolled` del header leyendo `window.scrollY` al montar, para que al recargar la página con el scroll restaurado a mitad de página el header muestre de inmediato su fondo con opacidad + blur (oscuro o claro según el tema) en vez de quedar transparente hasta el primer evento de scroll.

---

## Alcance

**Dentro:**

- **Inicializar el estado de scroll al montar.** En el `useEffect` de montaje de `HeaderReact.tsx` (el que registra los listeners de `scroll`/`resize`), invocar la lógica de scroll una vez tras registrar los listeners, para que `scrolled` (y `lastScrollY`) refleje la posición real de la página en el primer render efectivo.
- **Cubrir ambos temas.** El fix aplica igual al header oscuro (`bg-greyscale-darkest/80 backdrop-blur-md`) y al claro (`bg-white/80 backdrop-blur-md border-b border-black/5`), porque ambos dependen del mismo flag `scrolled`.
- **Verificación en recarga con scroll restaurado** (comportamiento por defecto del navegador) en desktop y mobile, tanto en página oscura (home) como en una página de tema claro (legales).

**Fuera de alcance:**

- Cambiar el umbral `SCROLL_THRESHOLD`, la animación de transición del header, el hide-on-scroll de mobile o el overlay del menú.
- Modificar los contratos de props (`theme`, `headerTheme`) o el plumbing `BaseLayout → Header.astro → HeaderReact`.
- Deshabilitar o forzar la restauración de scroll del navegador (`history.scrollRestoration`).
- Cualquier cambio visual del header más allá de que el fondo correcto aparezca desde el montaje.

---

## Modelo de datos

**Esta feature no introduce datos, colecciones ni props nuevos.** Es una corrección de la inicialización de estado de UI (`scrolled`) ya existente en `HeaderReact.tsx`. No se documenta modelo de datos nuevo.

---

## Plan de implementación

> Todo el trabajo vive en `HeaderReact.tsx`. Un solo commit; deja el proyecto ejecutable (`npm run dev`).

1. **Inicializar el scroll al montar.** En el `useEffect` que registra los listeners (actualmente llama `handleResize()`), añadir una llamada a `handleScroll()` inmediatamente después de `handleResize()`, de modo que `scrolled` se calcule a partir de `window.scrollY` en el montaje. Como `handleScroll` ya está en el arreglo de dependencias del efecto y envuelto en `useCallback`, no cambia la firma ni añade listeners nuevos. *Test:* con la página cargada al tope, el header sigue transparente (sin regresión).

2. **Verificar la corrección en recarga scrolleada.** Cargar home, hacer scroll > `SCROLL_THRESHOLD` (50px), recargar (F5) y confirmar que el header aparece con `bg-greyscale-darkest/80 backdrop-blur-md` desde el primer frame, sin necesidad de mover el scroll. Repetir en una página de tema claro (ej. `/reclamos`) confirmando `bg-white/80 backdrop-blur-md`. *Test:* el fondo correcto se ve inmediatamente en ambos temas.

3. **Regresión.** Confirmar que: (a) al tope el header sigue transparente en ambos temas; (b) el hide-on-scroll de mobile y el overlay del menú funcionan igual; (c) `astro build` termina sin errores ni warnings nuevos.

---

## Criterios de aceptación

- [x] Al recargar la web con el scroll restaurado por debajo de `SCROLL_THRESHOLD` (> 50px), el header muestra su **fondo con opacidad + blur desde el montaje**, sin esperar a un evento de scroll.
- [x] En **tema oscuro** el fondo restaurado es `bg-greyscale-darkest/80 backdrop-blur-md`; en **tema claro** es `bg-white/80 backdrop-blur-md border-b border-black/5`.
- [x] Al recargar con la página **al tope** (scroll < umbral), el header sigue **transparente** en ambos temas (sin regresión).
- [x] El **hide-on-scroll de mobile**, el **overlay del menú**, su animación y el drill de navegación funcionan igual que antes.
- [x] No se modifican props, contratos ni archivos fuera de `HeaderReact.tsx`.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** **llamar `handleScroll()` en el montaje**, en espejo del `handleResize()` que ya se invoca ahí. Es el punto exacto donde falta inicializar `scrolled` y reutiliza la función existente sin duplicar lógica.
- **No:** **inicializar `scrolled` con un valor calculado en `useState`** (ej. `useState(() => window.scrollY > 50)`). Rompe SSR/hidratación (Astro renderiza en el servidor donde no existe `window`) y arriesga un mismatch de hidratación; el arranque en `false` + recálculo en efecto (cliente) es el patrón seguro.
- **No:** **desactivar la restauración de scroll del navegador** (`history.scrollRestoration = "manual"`). Cambiaría el comportamiento esperado de recarga y va más allá del bug; el fix real es que el header lea la posición ya restaurada.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un flash del header transparente antes de que el efecto corra en el cliente (el estado inicial de hidratación es `scrolled=false`). | El efecto corre en el primer commit tras montar; el flash, si existe, es de 1 frame y la transición `duration-300` lo suaviza. Aceptable frente al riesgo de un mismatch de hidratación por calcular en `useState`. |
| `lastScrollY.current` arranca en 0 y podría afectar el hide-on-scroll de mobile en el primer movimiento tras recargar scrolleado. | `handleScroll` en el montaje actualiza `lastScrollY.current` a la posición real, evitando un salto en la primera comparación de dirección. Se valida en QA de regresión mobile. |
