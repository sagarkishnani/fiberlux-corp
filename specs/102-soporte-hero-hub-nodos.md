# SPEC 102 — Hero de Soporte: hub de nodos animado (núcleo + canales)

> **Estado:** Implementado
> **Depende de:** SPEC 06 (soporte técnico), SPEC 74 (hero video soporte), SPEC 101 (aprendizajes del hero de Nosotros)
> **Fecha:** 2026-08-10
> **Objetivo:** Reemplazar el video del hero de `/soporte-tecnico` por un gráfico SVG/CSS animado de un núcleo central (ícono ciclando entre audífonos, rayo, server e isotipo Fiberlux) conectado por líneas que se dibujan con un pulso viajando hacia cuatro nodos de canales de soporte.

## Sección 1 — Por qué existe este spec

El cliente envió una referencia (Pinterest): un nodo central conectado por tuberías curvas a cuatro nodos, con una señal viajando por las líneas. Quiere ese bloque en el hero de Soporte, **sin las líneas verdes** (en morado de marca), con el ícono central **rotando** entre audífonos, rayo, server y el isotipo Fiberlux, y las líneas **avanzando** (dibujándose). Es la metáfora de soporte: el núcleo (Fiberlux) conectado a los canales de atención. Se aplica el estilo "vivo y dinámico" del hero de Nosotros, pero en **SVG/CSS** por ser un gráfico vectorial preciso (fondo limpio, sin WebGL).

## Alcance

**Dentro:**

- Nuevo componente `src/components/soporte/SupportHub.tsx` (SVG/CSS autónomo, sin WebGL, prop `className`).
- **Núcleo central:** tile glass morado con glow que pulsa; el ícono **cicla** entre 4 estados con crossfade: audífonos (`FaHeadset`), rayo (`FaBolt`), server (`FaServer`) e **isotipo Fiberlux** (SVG inline de marca).
- **4 nodos de canales** en las esquinas (tiles glass con ícono): WhatsApp, teléfono, correo y chat en vivo.
- **Conectores** curvos del núcleo a cada nodo que **se dibujan** (animación `stroke-dashoffset`) en loop + un **pulso** de señal que viaja del centro al nodo. Todo en morado de marca (`#96237A` / magenta claro), **sin verde**.
- Integración en `HeroSoporteReact.tsx`: se reemplaza `HeroVideo` de la columna derecha por `SupportHub`; el texto de la izquierda y el glow del hero se conservan.
- Responsive (mobile) y `prefers-reduced-motion` (gráfico estático: líneas dibujadas fijas, sin ciclo ni pulso). Aplica aprendizajes de SPEC 101 (`min-w-0` para no romper el layout, capas envueltas correctamente).

**Fuera de alcance (specs futuros):**

- Quitar o modificar `HeroVideo` (se usa en otros heros).
- Red plexus + god-rays WebGL (se eligió fondo limpio para este hero).
- Editabilidad en Tina de íconos, canales o parámetros de animación (hardcodeado en `PARAMS`).
- Cambiar la sección de canales existente (`CanalesSoporte`).
- Texto/labels en los nodos (el gráfico es decorativo; los canales ya se explican en la sección de canales).

## Modelo de datos

Esta feature **no introduce nuevas estructuras de datos ni campos en Tina**. El hero sigue leyendo `soporteTecnico.breadcrumb/heading/intro` (con `_en`). Íconos del núcleo, canales, tiempos de ciclo y parámetros de animación viven hardcodeados en `PARAMS` de `SupportHub.tsx`. El isotipo Fiberlux se incluye como **SVG inline** en el componente.

## Plan de implementación

1. `SupportHub.tsx` — esqueleto: `<svg viewBox>` cuadrado con núcleo central y 4 nodos posicionados en las esquinas (dos arriba, dos abajo), sin animación. Commit funcional.
2. Conectores: 4 `path` curvos (bezier) del núcleo a cada nodo, estilo tubería morada tenue.
3. Animación **draw-on** de los conectores (`stroke-dasharray` + `stroke-dashoffset` con keyframes) en loop, del centro hacia el nodo.
4. **Pulso** de señal: un punto/segmento brillante que viaja por cada conector del centro al nodo (loop, desfasado por nodo).
5. Núcleo: tile glass + glow pulsante; **ciclo del ícono** central entre audífonos/rayo/server/isotipo con crossfade (estado React + `setInterval`, intervalo en `PARAMS`).
6. Nodos de canales: tiles glass con íconos (WhatsApp `FaWhatsapp`, teléfono `FaPhone`, correo `FaEnvelope`, chat `FaComments`).
7. Bloque `prefers-reduced-motion`: sin draw-on, sin pulso, sin ciclo (ícono fijo, líneas completas).
8. Integrar en `HeroSoporteReact.tsx`: reemplazar el bloque `HeroVideo` por `<SupportHub>`; ajustar el contenedor derecho (`min-w-0`, tamaño responsive) sin tocar el texto ni el glow.

## Criterios de aceptación

- [x] `/soporte-tecnico` carga sin errores de consola atribuibles al componente.
- [x] El hero muestra un núcleo central conectado por líneas a **4 nodos** en las esquinas.
- [x] El ícono central **cicla** entre audífonos, rayo, server e isotipo Fiberlux (se ven los 4 en el tiempo).
- [x] Los 4 nodos de esquina son canales de soporte con ícono (WhatsApp, teléfono, correo, chat).
- [x] Las líneas **se dibujan** (avanzan del centro al nodo) en loop y un **pulso** viaja por ellas.
- [x] **No hay líneas verdes**: todo el gráfico está en morado de marca.
- [x] El video anterior (`HeroVideo`) ya no se renderiza en el hero de Soporte.
- [x] Con `prefers-reduced-motion: reduce` el gráfico queda estático (sin ciclo, draw-on ni pulso).
- [x] En mobile el gráfico se ve completo (sin recortes) y el título permanece legible.
- [x] `HeroVideo` sigue existiendo para otros heros; `astro build` pasa en verde.

## Decisiones

- **Sí:** SVG/CSS (draw-on con `stroke-dashoffset`, pulso, ciclo de ícono). Fiel al gráfico vectorial de la referencia y liviano.
- **No:** WebGL / plexus / god-rays. Se eligió **fondo limpio**; el hero conserva su glow morado actual.
- **Sí:** reemplazar el video de la columna derecha, manteniendo el layout 2 columnas y el texto de la izquierda.
- **Sí:** ícono central ciclando audífonos → rayo → server → isotipo Fiberlux (pedido explícito).
- **Sí:** nodos = canales de soporte (WhatsApp, teléfono, correo, chat), en vez de personas — decisión del cliente; más temático de soporte.
- **Sí:** **sin verde**; morado de marca (pedido explícito).
- **No:** editable en Tina. Decorativo; hardcodeado mantiene el build simple.
- **Sí:** aplicar aprendizajes de SPEC 101 (`min-w-0`, envolver capas, reduced-motion, tuning responsive).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los conectores curvos no calzan con las posiciones de los nodos en distintos tamaños | Todo en un `viewBox` fijo con coordenadas relativas; el SVG escala con el contenedor. |
| El ciclo del ícono central provoca "salto" visual | Crossfade (opacidad) entre íconos, no corte seco; intervalo en `PARAMS`. |
| Recorte de nodos/tiles en mobile (como en SPEC 101) | `viewBox` con padding, `min-w-0` en la columna y tamaño responsive del contenedor. |
| `setInterval` del ciclo corriendo fuera de viewport | Pausar el ciclo con IntersectionObserver y respetar `prefers-reduced-motion`. |

## Lo que **no** entra en este spec

- Quitar o modificar `HeroVideo`.
- Fondo WebGL (plexus / god-rays).
- Editabilidad CMS del gráfico.
- Cambiar la sección de canales existente.
- Labels de texto en los nodos.

Cada uno, si aparece, va en su propio spec.
