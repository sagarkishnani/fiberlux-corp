# SPEC 95 — "El desafío": animaciones en loop de líneas de luz y conceptos por categoría

> **Estado:** Aprobado
> **Depende de:** SPEC 11 (plantilla páginas solución), SPEC 93 (widgets interactivos), SPEC 80 (i18n)
> **Fecha:** 2026-08-06
> **Objetivo:** Reemplazar los widgets clicables de "El desafío" por animaciones en loop de líneas de luz —una por categoría, en la línea gráfica de Fiberlux— con el click reactivable desde Tina.

## Sección 1 — Por qué existe este spec

En reunión, Marketing Nubyx y Ventas TWNSTUDIOS acordaron corregir las animaciones del card "El desafío". Los widgets actuales (SPEC 93) son **clicables con tooltip que sigue el cursor**, y algunos conceptos se confunden entre sí (Data Center se lee como ciberseguridad). Se decide: (a) pasar todo a **animación en loop automático con luces**, quitando clicks y tooltips; (b) que los elementos se vean **integrados** a la identidad de Fiberlux (glow/color, no "pegados encima" ni glass pesado); (c) **redefinir el concepto** de tres categorías y **crear uno nuevo** para Servicios Gestionados. El heading y el texto del card se mantienen; sólo cambia el área de la animación.

## Sección 2 — Alcance

**Dentro:**

- Sustituir los 4 sub-widgets de `DesafioWidget.tsx` por **animaciones en loop** (autoplay), en trazo luminoso sobre fondo oscuro, magenta de marca (`#96237A`/`#D64DB8`), sin glass pesado.
- **Línea gráfica compartida (transversal a los 4).** Todos los widgets reutilizan el vocabulario visual del card actual de Data Center (ver `references/spec-95/desafio-linea-grafica-*.png`): card con radial oscuro, **base "horizonte" magenta** (la loma inferior con la línea-horizonte fina), **nodo blanco redondeado** con ícono de marca, **conectores punteados/luminosos** finos, **labels mono en mayúsculas** con tracking amplio, y glow magenta. Cada concepto adapta su contenido pero **no inventa un estilo propio**; se ven como una familia.
- **Data Center (`data-center-cloud`) → `cloud-beam`:** nube de trazo luminoso con un **haz de luz que la recorre**; alrededor, endpoints (nodos) que se encienden en secuencia con líneas de conexión que pulsan. Loop continuo.
- **Conectividad (`conectividad-empresarial`) → `fiber`:** uno o dos **hilos de fibra** (curvas bézier) con un **punto de luz + estela** que los recorre de extremo a extremo en loop (referencia: `references/spec-95/conectividad-hilo-fibra-ref.png`, filamento curvo luminoso con punto viajero).
- **Ciberseguridad (`ciberseguridad-gestionada`) → `shield-switch`:** **fusión** — recibe la lógica de **interruptor/candado** que hoy está en Data Center, integrada con el escudo/amenazas actual. Auto-alterna en loop: `EXPUESTO` (candado abierto, rojo, amenazas "vivas") ↔ `PROTEGIDO` (candado cerrado, magenta, amenazas bloqueadas).
- **Servicios Gestionados (`servicios-gestionados`) → `noc`:** mini-panel de **monitoreo 24/7**: latido de uptime (línea EKG) en loop, tiles de métricas vivas (CPU, red, backup) y estado `OPERATIVO`.
- **Campo nuevo en Tina `valor.desafioClickable`** (booleano, por defecto `false`). En `false` → animación en loop, sin tooltip ni click. En `true` → se reactiva la capa interactiva de SPEC 93 (tooltip que sigue el cursor + click); en `shield-switch` el click alterna `expuesto/protegido` y pausa el autoplay.
- Íconos inline (`react-icons/fa6` + SVG), animación por CSS keyframes / `requestAnimationFrame`. Sin assets nuevos obligatorios (las referencias viven en `references/spec-95/`).
- Fallback `prefers-reduced-motion`: sin animación; cada widget muestra un **frame representativo estático** (nube con endpoints encendidos, hilo con punto a media ruta, estado `PROTEGIDO`, panel `OPERATIVO`).

**Fuera de alcance (para futuros specs):**

- Editar textos/valores de los widgets desde el CMS (siguen hardcoded por categoría).
- Réplica fiel del shader WebGL de Framer (se hace aproximación SVG/Canvas ligera, por decisión explícita).
- Rediseño de los cards "Nuestra solución" e "Industrias destacadas".
- Traducción `_en` del copy de los widgets.
- Un 5º concepto para Servicios Gestionados: sólo se implementa el default (NOC); las otras 2 propuestas quedan documentadas como alternativas.

## Sección 3 — Modelo de datos

Un solo campo nuevo en Tina, en el grupo `valor` de la colección `service` (`tina/config.ts`):

```js
// tina/config.ts → service.valor (nuevo campo)
{ type: "boolean", name: "desafioClickable",
  label: "El desafío — activar interacción por click (por defecto: animación en loop)" }
```

El resto del contenido del widget sigue siendo constante local por slug en `ValorSolucionReact.tsx` (sin campos nuevos de contenido):

```js
const WIDGETS = {
  "data-center-cloud":        { type: "cloud-beam" },
  "conectividad-empresarial": { type: "fiber" },
  "ciberseguridad-gestionada":{ type: "shield-switch", onLabel: "PROTEGIDO", offLabel: "EXPUESTO" },
  "servicios-gestionados":    { type: "noc", uptime: "99.98%" },
};
```

Estado en runtime: cada animación usa `requestAnimationFrame`/CSS loop; `shield-switch` usa un `useState` de fase con `setInterval` para auto-alternar (o `useState` manual cuando `desafioClickable` es `true`). El flag `desafioClickable` llega como prop desde `valor.desafioClickable`.

## Sección 4 — Plan de implementación

1. **Tina:** añadir `desafioClickable` (boolean, default `false`) a `service.valor` en `tina/config.ts`; regenerar tipos. El JSON de contenido no cambia (default `false`). Test: el campo aparece en `/admin`; las 4 páginas compilan.
2. **`ValorSolucionReact.tsx`:** leer `valor.desafioClickable` y **condicionar** toda la maquinaria de tooltip/click (handlers, `role="switch"` del contenedor, guía táctil, tooltip flotante) a ese flag. Con flag `false` (default), el card no es clicable ni muestra tooltip. Pasar `clickable` a `DesafioWidget`. Test: con flag off, sin tooltip ni cursor pointer; con flag on, vuelve el comportamiento SPEC 93.
3. **Mapa `WIDGETS`:** actualizar a los nuevos `type` (`cloud-beam`, `fiber`, `shield-switch`, `noc`) y retirar los `toggle`/`failover`/`shield`/`chat`. Conservar y generalizar los elementos de línea gráfica compartida (base horizonte magenta, nodo blanco, conector punteado) para reutilizarlos en los 4. Test: cada página monta su nuevo tipo con la base y el nodo compartidos.
4. **`cloud-beam` (Data Center):** SVG de nube en trazo luminoso + haz de luz recorriéndola + endpoints que encienden en secuencia con líneas pulsantes. Loop. Reutiliza base horizonte + nodo blanco. Test: la nube se recorre por el haz; los endpoints encienden en cascada y reinicia.
5. **`fiber` (Conectividad):** 1–2 filamentos bézier con punto de luz + estela viajando extremo a extremo en loop, glow magenta. Test: el punto recorre el hilo de forma continua sin cortes; calza con la referencia.
6. **`shield-switch` (Ciberseguridad):** fusión interruptor/candado + escudo/amenazas; auto-alterna `EXPUESTO ↔ PROTEGIDO` en loop, con label mono, base horizonte y nodo compartidos. Si `clickable` es `true`, el click alterna y pausa el autoplay. Test: en loop alterna solo; con flag click, alterna al hacer click/Enter.
7. **`noc` (Servicios Gestionados):** mini-panel con latido de uptime (path EKG animado en loop), tiles `CPU`/`RED`/`BACKUP`, estado `OPERATIVO` y `99.98%`, dentro de la misma línea gráfica. Test: el latido corre en loop y los tiles laten.
8. **Estilos + accesibilidad + limpieza:** keyframes en el `<style>` del componente; `prefers-reduced-motion` muestra frame estático por widget; retirar el código muerto de los widgets antiguos; verificar que no haya glass pesado (sólo glow/color). Test: con reduced-motion no hay animación; sin residuos de los widgets viejos.

## Sección 5 — Criterios de aceptación

- [ ] Los 4 widgets comparten la línea gráfica: base "horizonte" magenta, nodo blanco redondeado con ícono de marca, conectores finos, labels mono en mayúsculas y glow magenta (verificado contra `references/spec-95/`).
- [ ] En `data-center-cloud`, el card muestra una nube de trazo luminoso con un haz que la recorre y endpoints que encienden en secuencia, en loop, sin click ni tooltip.
- [ ] En `conectividad-empresarial`, un hilo de fibra tiene un punto de luz que lo recorre de extremo a extremo en loop.
- [ ] En `ciberseguridad-gestionada`, la animación auto-alterna `EXPUESTO` (rojo, candado abierto, amenazas activas) ↔ `PROTEGIDO` (magenta, candado cerrado, amenazas bloqueadas) en loop.
- [ ] En `servicios-gestionados`, el panel muestra un latido de uptime en loop, tiles de métricas y estado `OPERATIVO` con `99.98%`.
- [ ] Con `valor.desafioClickable = false` (default) ningún card de "El desafío" muestra tooltip flotante, guía táctil ni `cursor: pointer`.
- [ ] Con `valor.desafioClickable = true`, vuelve la capa interactiva: el tooltip sigue el cursor y en `shield-switch` el click alterna estado y pausa el autoplay.
- [ ] Con `prefers-reduced-motion: reduce`, ningún widget anima; cada uno muestra un frame representativo estático.
- [ ] Ninguna animación usa WebGL; todas son SVG/CSS/Canvas ligero.
- [ ] No queda código de los widgets `toggle`/`failover`/`shield`/`chat` de SPEC 93.
- [ ] `tina/config.ts` gana sólo el campo `valor.desafioClickable`; no se agregan campos de contenido.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** loop automático por defecto, sin click ni tooltip. Es la corrección pedida en reunión.
- **Sí:** `valor.desafioClickable` en Tina para reactivar el click. El cliente anticipa que querrán volver a la interacción ("seguro se arrepienten").
- **Sí:** línea gráfica compartida entre los 4 widgets (base horizonte, nodo blanco, conectores, labels mono). Evita que se vean "pegados encima"; los unifica como familia.
- **No:** réplica fiel del shader WebGL de Framer. Se hace aproximación SVG/Canvas para no cargar WebGL sólo por esto.
- **No:** glass como recurso principal. Da la sensación de romper el diseño; sólo se admite un toque muy sutil. Integración por glow/color.
- **Sí:** mover el switch/candado de Data Center a Ciberseguridad (fusión). Clarifica "protegido/expuesto" mejor que la nube.
- **Sí:** Data Center pasa a "nube + haz de luz + endpoints". Evita la confusión con ciberseguridad.
- **Sí:** Servicios Gestionados = NOC / Monitoreo 24/7 (default). Es el más "con vida" y distinto del resto.
- **No (documentadas como alternativas):** para Servicios Gestionados, "Orquestación/auto-remediación (hub + nodos)" y "Pipeline de tickets gestionados". Se muestran al cliente; no se implementan ahora.
- **Sí:** contenido de widgets hardcoded por categoría. Máxima fidelidad; no editable por ahora.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Las líneas de luz se ven "pegadas encima" y rompen la línea gráfica | Base horizonte + nodo + conectores compartidos; trazo fino y glow magenta de marca; revisión visual contra `references/spec-95/`. |
| Loops de `rAF` consumen batería/CPU en móvil | Un solo `rAF` por widget, pausable, se limpia al desmontar, y respeta `reduced-motion`. |
| El hilo de fibra no calza con la referencia | Referencia en `references/spec-95/conectividad-hilo-fibra-ref.png`; ajustar curva/velocidad/estela contra ella. |
| Reactivar `desafioClickable` deja estados inconsistentes | El flag conmuta rutas separadas (loop vs interactivo) en un solo lugar; `shield-switch` es el único con estado binario real. |

## Qué **no** está en este spec

- Editar el copy/valores de los widgets desde el CMS.
- Réplica WebGL fiel del Framer.
- Rediseño de "Nuestra solución" / "Industrias destacadas".
- Traducción EN del copy de los widgets.
- Implementar las 2 propuestas alternativas de Servicios Gestionados (quedan como referencia).
