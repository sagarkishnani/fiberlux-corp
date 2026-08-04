# SPEC 93 — Widget interactivo en "El desafío" por categoría de solución

> **Estado:** Aprobado
> **Depende de:** SPEC 11 (plantilla páginas solución), SPEC 80 (i18n)
> **Fecha:** 2026-08-04
> **Objetivo:** Reemplazar la onda estática del card "El desafío" por un mini-widget interactivo distinto según la categoría, que ilustra el problema→resultado con click (data-center, ciberseguridad) o hover/autoplay (servicios gestionados).

## Sección 1 — Por qué existe este spec

El card "El desafío" (columna izquierda del bento en `ValorSolucionReact.tsx`) hoy muestra heading + texto + una onda decorativa (`valor-desafio.svg`) idéntica en las 4 categorías. El diseño de Figma convierte ese espacio en una demostración interactiva que refuerza la narrativa problema→solución de cada servicio, con una mecánica de interacción propia por categoría. El heading y el texto se mantienen arriba; el widget vive en el área inferior del card (donde hoy está la onda).

## Sección 2 — Alcance

**Dentro:**

- Un widget interactivo por categoría dentro del card "El desafío", seleccionado por slug (`variables.relativePath` → `data-center-cloud` | `ciberseguridad-gestionada` | `servicios-gestionados`).
- **Data Center (`data-center-cloud`)** — Toggle de protección. Estado inicial "expuesto" (perilla a la izquierda, ícono nube); al hacer **click** la perilla se desliza a la derecha, aparece candado y el label `PROTEGIDO` (mono, mayúsculas). Bajo el toggle: línea punteada vertical → nodo cuadrado blanco con ícono de señal (ondas de radio). Tooltip-hint **"Proteger"**. El click **alterna ida y vuelta**.
- **Ciberseguridad (`ciberseguridad-gestionada`)** — Panel de métricas. Estado inicial "comprometido": card `USUARIOS TOTALES` con línea de tendencia **roja a la baja** + badge `↓ 32%`, y card `CONFIANZA` en **`22%`** (barra corta). Al hacer **click**: línea **verde al alza** + badge `↑ 54%`, y `CONFIANZA` en **`100%`** (barra llena). Nodo cuadrado blanco con glifo de nodos/conexión. Tooltip-hint **"Mejorar"**. El click **alterna ida y vuelta**.
- **Servicios Gestionados (`servicios-gestionados`)** — Chat. Estado inicial: primer mensaje (`¡Hola! Quiero crear un nuevo proyecto.` · `Hace 1 min`) + burbuja de escritura `···`. Al hacer **hover** se revela la respuesta (`¡Genial, ¿en qué te puedo asistir?` · `Hace 1 min`). En **móvil** (sin hover) la secuencia se **anima sola en loop** (autoplay: escribiendo → mensaje). Sin nodo de señal (es un chat).
- **Conectividad (`conectividad-empresarial`)** — **Sin cambios**: mantiene la onda `valor-desafio.svg` actual.
- Íconos construidos **inline** (react-icons `fa6` + SVG) y avatares del chat con el `avatar-placeholder.svg` genérico del proyecto. Sin archivos nuevos que pedir.
- `cursor: pointer` + `role="button"` + soporte teclado (Enter/Espacio) en los widgets de click; `aria` adecuado.
- Fallback `prefers-reduced-motion`: sin transiciones animadas; el click sigue alternando estado de forma instantánea; el chat muestra la conversación completa estática (sin autoplay).
- Textos/números **fijos en código** por categoría (hardcoded, sin campos nuevos en Tina).

**Fuera de alcance (para futuros specs):**

- Editabilidad de los widgets desde el CMS (números, mensajes, labels).
- Rediseño de los cards "Nuestra solución" e "Industrias destacadas" (se mantienen tal cual).
- Un 4º widget nuevo para conectividad (queda la onda actual).
- El avatar flotante de polo rojo de los mockups (es el cursor de Figma, se ignora).
- Traducción `_en` del contenido de los widgets (copy fijo en ES; se puede internacionalizar en otro spec si se requiere).

## Sección 3 — Modelo de datos

No se introducen estructuras de datos nuevas ni campos de Tina. El contenido de cada widget es una constante local en el componente, indexada por slug:

```js
// Derivado de variables.relativePath ("data-center-cloud.json" → "data-center-cloud")
const slug = variables.relativePath.replace(/\.json$/, "");

// Config fija por categoría (hardcoded en el componente/archivo del widget)
const WIDGETS = {
  "data-center-cloud":        { type: "toggle", hint: "Proteger", onLabel: "PROTEGIDO" },
  "ciberseguridad-gestionada":{ type: "stats",  hint: "Mejorar",
                                before: { confianza: "22%",  trend: "↓ 32%", dir: "down" },
                                after:  { confianza: "100%", trend: "↑ 54%", dir: "up" } },
  "servicios-gestionados":    { type: "chat",
                                messages: [
                                  { from: "user",  text: "¡Hola! Quiero crear un nuevo proyecto.", time: "Hace 1 min" },
                                  { from: "agent", text: "¡Genial, ¿en qué te puedo asistir?",     time: "Hace 1 min" },
                                ] },
  // conectividad-empresarial: sin entrada → se renderiza la onda actual
};
```

Estado en runtime: cada widget de click usa un `useState` booleano (`activated`); el chat usa un `useState`/hover para revelado y, en móvil, un intervalo de autoplay.

## Sección 4 — Plan de implementación

1. En `ValorSolucionReact.tsx`, derivar `slug` desde `variables.relativePath` y crear el mapa `WIDGETS`. Si el slug no está en el mapa, renderizar la onda `challenge.image` actual (comportamiento intacto para conectividad). Test: las 4 páginas cargan; conectividad muestra la onda; las otras 3 quedan sin la onda (aún sin widget).
2. Crear `DesafioWidget.tsx` (en `src/components/servicios/`) que recibe `{ slug, config }` y despacha al sub-render según `config.type`. Montarlo en el card "El desafío" reemplazando el `<img>` de la onda cuando hay config.
3. Implementar **toggle** (data-center): pill + perilla animada, íconos nube/candado (fa6), label `PROTEGIDO`, línea punteada + nodo señal, tooltip-hint "Proteger", click alterna. Test manual: click alterna ida/vuelta; teclado Enter/Espacio funciona.
4. Implementar **stats** (ciberseguridad): cards `USUARIOS TOTALES` (mini line-chart SVG rojo↓/verde↑ con badge) y `CONFIANZA` (barra 22%↔100%), nodo con glifo de nodos, tooltip-hint "Mejorar", click alterna. Test: click alterna colores/valores; barra y badge cambian.
5. Implementar **chat** (servicios): burbujas + avatares placeholder + timestamps + indicador `···`. Hover revela respuesta en desktop; en móvil, autoplay en loop vía `matchMedia` + intervalo. Test: hover en desktop revela; en viewport móvil se anima solo.
6. Añadir estilos (`<style>` del componente) y respetar `prefers-reduced-motion`: sin transiciones; click instantáneo; chat completo estático; sin autoplay. Verificar accesibilidad (`role`, `aria-pressed`, foco visible).

## Sección 5 — Criterios de aceptación

- [ ] En `data-center-cloud`, el card "El desafío" muestra un toggle con ícono de nube; al hacer click aparece `PROTEGIDO` + candado y la perilla se desliza; otro click lo revierte.
- [ ] En `data-center-cloud` y `ciberseguridad-gestionada` hay un nodo cuadrado blanco con ícono de señal unido por línea punteada al widget.
- [ ] En `data-center-cloud` el tooltip-hint dice "Proteger"; en `ciberseguridad-gestionada` dice "Mejorar".
- [ ] En `ciberseguridad-gestionada`, estado inicial muestra `CONFIANZA 22%` y badge `↓ 32%` en rojo; al hacer click muestra `CONFIANZA 100%` y `↑ 54%` en verde; otro click lo revierte.
- [ ] En `servicios-gestionados`, al hacer hover (desktop) se revela la respuesta `¡Genial, ¿en qué te puedo asistir?`; sin hover solo se ve el primer mensaje + `···`.
- [ ] En viewport móvil, el chat de `servicios-gestionados` se anima solo en loop sin interacción.
- [ ] En `conectividad-empresarial`, el card sigue mostrando la onda actual sin cambios.
- [ ] Los widgets de click son operables por teclado (Enter/Espacio) y tienen `cursor: pointer`.
- [ ] Con `prefers-reduced-motion: reduce`, no hay animaciones; el click sigue alternando estado y el chat se ve completo estático.
- [ ] No se agregaron campos a `tina/config.ts` ni al JSON de contenido.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** selección de widget por `slug` (`variables.relativePath`). No requiere campo nuevo en Tina y es determinista por página.
- **No:** campo `desafioWidget` en Tina para elegir tipo. Overengineering; el mapeo categoría→widget es fijo por diseño.
- **Sí:** contenido hardcoded por categoría. Máxima fidelidad al diseño; el cliente pidió que quede idéntico, no editable.
- **Sí:** click alterna ida y vuelta (toggle). Coincide con la metáfora de switch del mockup.
- **Sí:** autoplay en loop del chat en móvil. No hay hover en touch; mantiene la demostración viva.
- **No:** incluir el avatar flotante de polo rojo. Es el cursor del diseñador en Figma, no parte del diseño.
- **Sí:** íconos inline (react-icons fa6 + SVG) y avatar placeholder genérico. Evita depender de exportar assets de Figma.
- **No:** tocar "Nuestra solución"/"Industrias destacadas" ni la onda de conectividad. Fuera de alcance.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Copy/valores del widget difieren del diseño final | Están centralizados en el mapa `WIDGETS`; un solo lugar para ajustar. |
| Autoplay del chat consume batería/CPU en móvil | Intervalo pausable, se limpia al desmontar y respeta `reduced-motion`. |
| Fidelidad visual de íconos inline vs Figma | Si algún ícono no calza, se puede sustituir puntualmente por un SVG exportado sin cambiar la arquitectura. |

## Qué **no** está en este spec

- Editar widgets desde el CMS.
- Rediseñar "Nuestra solución" / "Industrias destacadas".
- Un widget propio para conectividad (queda la onda).
- Traducción EN del copy de los widgets.
- El avatar flotante de los mockups.
