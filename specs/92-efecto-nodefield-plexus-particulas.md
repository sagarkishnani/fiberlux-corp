# SPEC 92 — Componente de fondo `NodeField` (plexus de partículas, morado)

> **Status:** Implementado
> **Depends on:** componentes de efecto de fondo existentes (`WaveformEffect`, `FlowEffect` en `src/components/effects/`); SPEC 88 (hero home waveform, patrón de efecto animado); referencia visual: `https://usenodefield.framer.website/`
> **Date:** 2026-08-04
> **Objective:** Crear un componente de fondo animado autocontenido `NodeField` — una red de partículas (puntos + líneas por distancia) que se atraen hacia el cursor, en morado de marca sobre negro — replicando los settings de `usenodefield.framer.website`, sin cablearlo aún a ningún hero.

---

## Scope

**Dentro:**

- **Mantener intacto** el hero flow actual del home: el modo `waveform` sigue usando `WaveformEffect.tsx` (su propio componente en `src/components/effects/`). No se modifica ni su shader, ni su montaje en `HeroHomeReact.tsx`, ni el enum `heroBackground` del CMS. Esta parte del pedido es de **preservación**, no de cambio.
- **Crear** `src/components/effects/NodeField.tsx`: componente React standalone que renderiza un `<canvas>` con una red de partículas animada (estilo "plexus"/constellation).
- **Diseño replicado de `usenodefield.framer.website`** con estos settings horneados (según el screenshot de referencia):
  - **MODE = ATTRACT**: las partículas se atraen hacia el cursor.
  - **CURSOR = ON**: hay interacción con el mouse (puntero fino).
  - **LINES = ON**: se dibujan líneas entre partículas cercanas.
  - **SPEED / FORCE / DISTANCE / COUNT**: valores medios (deriva lenta, fuerza de atracción media-alta, radio de conexión medio, densidad media), afinados a ojo contra la referencia.
  - **Color = morado de marca** (`brand-purple #96237A` y variantes) para puntos y líneas, sobre fondo transparente (el consumidor pone el negro).
- **Convenciones del proyecto** (igual que `WaveformEffect`/`FlowEffect`): prop `className`, respeta `prefers-reduced-motion` (frame estático, sin animación), pausa el `requestAnimationFrame` fuera del viewport (IntersectionObserver), sin dependencias externas (canvas 2D nativo), limpieza correcta en el `return` del `useEffect`.
- **Settings expuestos como constantes** en el tope del archivo (un objeto `PARAMS` tipo el de `FlowEffect`) para poder afinar sin tocar la lógica.

**Fuera (para otros specs):**

- **Cablear** `NodeField` a cualquier hero o como modo `heroBackground` del CMS (se decidió "solo crear el componente").
- **Panel de controles visible** (MODE/SPEED/FORCE/LINES/DISTANCE/COUNT/CURSOR) — no se incluye; los settings van horneados.
- Editabilidad del color/parámetros desde Tina.
- Reemplazar o tocar el `WaveformEffect` / modo waveform actual.
- Modo REPEL o variantes sin cursor (se eligió ATTRACT + cursor).
- i18n (el componente no tiene texto).

---

## Modelo de datos

**No introduce datos persistidos ni contenido CMS.** Todo vive en constantes en el tope de `NodeField.tsx`. Estructuras internas:

**`PARAMS`** (objeto de configuración horneado, afinable):

```ts
const PARAMS = {
  count: 90,          // COUNT — nº de partículas base (se escala por área del canvas)
  maxCount: 160,      // techo de partículas en pantallas grandes
  speed: 0.18,        // SPEED — velocidad de deriva base (px/frame aprox.)
  linkDistance: 130,  // DISTANCE — radio (px) para conectar dos partículas con línea
  cursorRadius: 220,  // radio de influencia del cursor (px)
  attractForce: 0.035,// FORCE — intensidad de atracción hacia el cursor (ATTRACT)
  dotRadius: 1.6,     // radio de cada punto (px)
  lineWidth: 1,       // grosor de línea
  // Color de marca (morado). Se usa con alpha variable según distancia.
  dotColor: [150, 35, 122],   // brand-purple #96237A (RGB)
  lineColor: [150, 35, 122],  // idem para las líneas
  maxLineAlpha: 0.5,          // opacidad máx. de línea (a distancia 0)
  dotAlpha: 0.9,              // opacidad de los puntos
  background: "transparent",  // fondo: transparente (el consumidor pone el negro)
} as const;
```

**`Particle`** (estado por partícula, en un array plano o array de objetos):

```ts
interface Particle {
  x: number; y: number;   // posición (px, espacio del canvas)
  vx: number; vy: number; // velocidad
}
```

**Estado del cursor** (variables del `useEffect`, no React state): `{ x, y, active }` — posición en px relativa al canvas y si el puntero fino está dentro. Igual patrón que `FlowEffect` (se escucha en `window` y se mapea contra el `getBoundingClientRect()` del canvas, porque el contenido del hero taparía el canvas si se escuchara en él).

**Densidad responsive:** el nº real de partículas = `clamp(round(count * (area / areaRef)), 30, maxCount)`, con `areaRef` ≈ 1280×720, para que no queden ralas en 4K ni saturadas en móvil.

---

## Plan de implementación

1. **Scaffold del componente.** Crear `src/components/effects/NodeField.tsx` con la firma `Props { className?, signalReady?, onUnsupported? }` (misma que `FlowEffect`), un `<canvas aria-hidden>` a `width/height:100%`, y el `useEffect` que obtiene `getContext("2d")`. Si no hay contexto 2D, llamar `onUnsupported?.()` y salir. **Estado:** componente monta un canvas vacío sin romper el build.

2. **Init de partículas + resize.** Función `resize()` que ajusta `canvas.width/height` por `devicePixelRatio` (cap 2), recalcula la densidad responsive y (re)siembra el array de partículas con posiciones y velocidades aleatorias (dirección aleatoria, magnitud `speed`). Nota: `Math.random()` está permitido en el runtime del navegador (la restricción es solo para scripts de workflow). **Estado:** partículas distribuidas, se re-siembran al redimensionar.

3. **Loop de animación (deriva + wrap).** `requestAnimationFrame` que: limpia el canvas, integra `x += vx; y += vy`, y hace *wrap* en los bordes (reaparecen del lado opuesto) para densidad constante. Dibuja cada punto como círculo morado (`dotColor`, `dotAlpha`). **Estado:** nube de puntos morados derivando suavemente sobre transparente.

4. **Líneas por distancia (LINES on).** Doble bucle O(n²) sobre pares de partículas: si `dist < linkDistance`, trazar línea morada con `alpha = maxLineAlpha * (1 - dist/linkDistance)`. Con `n ≤ 160`, O(n²) ≈ 12.8k pares/frame — aceptable; si hiciera falta se optimiza con grid espacial (fuera de alcance salvo que el QA muestre jank). **Estado:** aparece la malla constellation morada.

5. **Interacción de cursor (ATTRACT).** Listener `pointermove` en `window`, mapea a coords del canvas y marca `active` si está dentro. En el loop: para cada partícula dentro de `cursorRadius`, aplicar aceleración hacia el cursor proporcional a `attractForce * (1 - dist/cursorRadius)`; amortiguar velocidad (`vx *= 0.98`) para que no se disparen. Solo con `matchMedia("(pointer: fine)")`. **Estado:** las partículas se agrupan hacia el mouse y se relajan al alejarlo.

6. **reduced-motion + pausa por viewport.** Si `prefers-reduced-motion: reduce`: dibujar **un frame estático** (una siembra + líneas, sin rAF) y disparar `fbx:hero-scene-loaded` si `signalReady`. IntersectionObserver: pausar el rAF fuera de viewport y reanudarlo al volver (mismo patrón que `FlowEffect`). **Estado:** sin animación si el usuario lo pidió; sin gasto de CPU fuera de pantalla.

7. **Cleanup.** En el `return` del `useEffect`: `cancelAnimationFrame`, quitar listeners (`resize`, `pointermove`), `io.disconnect()`. **Estado:** sin fugas al desmontar.

8. **Afinado visual contra la referencia.** Ajustar `PARAMS` (count, linkDistance, speed, force) comparando con `usenodefield.framer.website` en el screenshot: densidad media, líneas finas y tenues, deriva lenta. **Estado:** el look coincide "masomenos" con la referencia, en morado.

9. **Verificación de build.** `npm run build` pasa sin errores nuevos. (El componente aún no se importa en ninguna página; queda disponible para montarse en otro spec.) **Estado:** listo para usar.

---

## Criterios de aceptación

- [ ] Existe `src/components/effects/NodeField.tsx`, componente React default-export con props `{ className?, signalReady?, onUnsupported? }`.
- [ ] Renderiza una red de partículas: puntos morados (`brand-purple`) conectados por líneas cuando están a menos de `linkDistance`, sobre fondo transparente.
- [ ] Las partículas derivan lentamente y hacen wrap en los bordes (densidad constante).
- [ ] Con puntero fino, las partículas se **atraen** hacia el cursor (modo ATTRACT) y se relajan al alejarlo.
- [ ] La densidad de partículas escala con el área del canvas (no queda rala en pantallas grandes ni saturada en móvil).
- [ ] Con `prefers-reduced-motion: reduce` se dibuja un frame estático (sin animación ni rAF).
- [ ] Fuera del viewport el `requestAnimationFrame` se pausa; al volver, se reanuda.
- [ ] No hay dependencias externas nuevas (canvas 2D nativo); al desmontar no quedan listeners ni rAF activos.
- [ ] El `WaveformEffect` / modo `waveform` del home queda **sin cambios** y sigue funcionando.
- [ ] `npm run build` pasa sin errores nuevos.

---

## Decisiones

- **Sí:** el "hero flow del home" es el `WaveformEffect` actual; se **preserva intacto** en su propio componente (no se refactoriza ni se toca).
- **Sí:** `NodeField` se **crea como componente standalone** en `src/components/effects/`, hermano de `WaveformEffect`/`FlowEffect`, **sin cablearlo** todavía a ningún hero (el montaje va en otro spec).
- **Sí:** **canvas 2D nativo** (no WebGL): el efecto plexus (≤160 puntos + líneas) rinde de sobra en 2D y evita shaders/dependencias.
- **Sí:** settings **horneados en un `PARAMS`** editable en código; **sin panel de controles visible** (a diferencia de la demo de Framer).
- **Sí:** modo **ATTRACT + cursor ON**, color **morado de marca** (decisión del cliente sobre el screenshot).
- **Sí:** fondo **transparente** (el consumidor decide el negro), para que el componente sea reutilizable sobre cualquier capa.
- **No:** REPEL, variantes sin cursor, editabilidad CMS del color/parámetros, ni panel de debug (fuera de alcance).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| O(n²) de las líneas causa jank en móvil de gama baja | `count` escalado por área con techo `maxCount=160` (≈12.8k pares/frame máx.); pausa fuera de viewport y reduced-motion. Si el QA muestra jank, grid espacial en otro spec. |
| El look no coincide "1:1" con la referencia (settings a ojo) | El cliente pidió "masomenos"; los `PARAMS` quedan afinables en el tope del archivo para iterar sin tocar lógica. |
| El canvas queda detrás del contenido y no recibe eventos de mouse | Igual que `FlowEffect`: se escucha `pointermove` en `window` y se mapea contra el rect del canvas. |
| Fondo transparente sobre una capa clara deja los puntos poco visibles | El componente se pensará para montarse sobre fondo oscuro (negro de marca); el consumidor pone la base. Documentado en el componente. |
