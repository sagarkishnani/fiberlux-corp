# SPEC 104 — Heroes de Nosotros y Soporte: foto a sangre + malla de red en profundidad

> **Estado:** Implementado
> **Depende de:** SPEC 101 (hero Nosotros con candado orbital, reemplazado), SPEC 102 (hero Soporte con hub de nodos, reemplazado), SPEC 80 (i18n `_en` + `tField`), SPEC 21 (contenedor global)
> **Fecha:** 2026-08-25
> **Objetivo:** Rehacer los heroes de `/nosotros` y `/soporte-tecnico` como fotografía a sangre con velo direccional y una malla de red en perspectiva 3D encima, distinta en cada página, legible en mobile y sin costo de rendimiento.

---

## Sección 1 — Por qué existe este spec

El cliente trajo dos mockups de hero (foto del equipo / del data center, con breadcrumb, título grande y párrafo sobre un velo oscuro) y una referencia de animación: la malla de nodos del hero de Nextnet. Los heroes vigentes eran escenas gráficas — candado orbital + plexus + god-rays en Nosotros (SPEC 101) y hub de nodos en Soporte (SPEC 102) — sin fotografía.

Sobre la animación, la primera tanda de propuestas (plexus 2D, hebras, radar, circuito, panal, telemetría) fue rechazada: **eran planas**. Inspeccionando la referencia se vio la técnica real: un SVG con grupos por profundidad, cada uno con su desenfoque y opacidad (`style="--f:0.22; filter:blur(3.4px)"`). Eso es lo que produce la perspectiva. La segunda tanda se rehízo con proyección 3D real y capas de profundidad, y el cliente eligió dos de cuatro.

## Alcance

**Dentro:**

- **`shared/PhotoHero.tsx` (nuevo):** layout de hero compartido — foto a sangre (`object-cover`, encuadre configurable por `focus`/`focusMobile`), capa `overlay` para la animación, velo direccional (horizontal en desktop, vertical en mobile) y bloque de contenido (breadcrumb, título, subtítulo). Alto `78svh`/`88svh` con mínimos y tope.
- **`effects/NetworkDepth.tsx` (nuevo):** malla de nodos en un volumen 3D, proyectada en perspectiva y dibujada en capas de profundidad. Dos variantes:
  - `malla` → nube fija de 260 nodos, cámara orbitando muy lento, paralaje con el cursor. **Va en Nosotros.**
  - `constelacion` → réplica de la referencia del cliente: malla densa (300 nodos) **anclada a la derecha**, cámara prácticamente quieta, nodos que titilan, y una máscara que la disuelve hacia la izquierda para no pelear con el texto. **Va en Soporte técnico.**
  - `vuelo` → tramos encadenados en z por los que la cámara avanza. Implementada pero **sin montar**: fue la primera elección para Soporte y el cliente prefirió la constelación.
- **Heroes reescritos:** `HeroNosotrosReact` y `HeroSoporteReact` pasan a componer `PhotoHero` + `NetworkDepth`.
- **Campos nuevos en Tina:** `about.hero.image` y `soporteTecnico.heroImage` (imagen de fondo del hero), sembrados con `laptop-us.png` y `datacenter-support.png`.
- **Rendimiento:** tres lienzos apilados con el desenfoque por CSS, capas de fondo rasterizadas a menor resolución, DPR capado a 2, menos nodos bajo 768px, pausa fuera del viewport y un solo frame estático con `prefers-reduced-motion`.

**Fuera de alcance:**

- Eliminar `OrbitLock`, `LightHalo`, `NodeField` o `SupportHub`: quedan en el repo sin montar en estos heroes.
- Aplicar `PhotoHero` a otros heroes del sitio (casos, soluciones, blog).
- Editabilidad en Tina del encuadre, de la variante de malla o de sus parámetros.
- Las otras dos variantes propuestas (`horizonte`, `globo`): quedaron sin implementar en el repo.

---

## Modelo de datos

Un campo de imagen por colección; el resto del hero ya existía.

| Colección | Campo | Valor sembrado |
| --- | --- | --- |
| `about.hero` | `image` | `/images/nosotros/laptop-us.png` |
| `soporteTecnico` | `heroImage` | `/images/soporte-tecnico/datacenter-support.png` |

La foto debe tener el sujeto **a la derecha**: el velo oscurece la izquierda, que es donde vive el texto. Los parámetros de la malla (densidad, opacidad, variante) son props del componente, no contenido.

---

## Plan de implementación

1. **Campos de imagen.** `about.hero.image` y `soporteTecnico.heroImage` en `tina/config.ts`; sembrar ambos en el contenido.
2. **`PhotoHero`.** Foto + `overlay` + velo direccional + contenido, con el `-mt-16` que compensa el header fijo.
3. **Heroes.** Reescribir `HeroNosotrosReact` y `HeroSoporteReact` sobre `PhotoHero`, leyendo todo con `tField`.
4. **Variantes.** Prototipar las cuatro mallas en una página aparte y elegir con el cliente.
5. **`NetworkDepth`.** Portar las dos elegidas: proyección en perspectiva, aristas por vecinos más cercanos en 3D, tono por profundidad y composición aditiva.
6. **Rendimiento.** Tres lienzos apilados con blur por CSS; pausa por `IntersectionObserver`; densidad reducida en mobile; frame único con reduced-motion.
7. **Montaje y QA.** `overlay={<NetworkDepth variant="malla" />}` en Nosotros y `variant="vuelo"` en Soporte; medir fps y revisar mobile.

---

## Criterios de aceptación

- [x] `/nosotros` y `/soporte-tecnico` muestran la foto a sangre con el sujeto a la derecha y el texto legible sobre el velo.
- [x] En mobile el velo gira a vertical: la foto se lee arriba y el texto se apoya en la base, sin cortes ni scroll horizontal.
- [x] La imagen del hero es editable en Tina en ambas páginas.
- [x] Nosotros usa la variante `malla` y Soporte la `constelacion`: no se repite la animación (una orbita y ocupa todo el hero; la otra está quieta, apiñada a la derecha y titila).
- [x] En Soporte la malla se disuelve sobre la columna de texto en desktop; en mobile la máscara se retira (ahí el texto vive abajo).
- [x] La malla tiene profundidad real: los nodos del fondo salen chicos, tenues y desenfocados; los del frente, nítidos y con halo.
- [x] Al mover el cursor sobre el hero **cambia el punto de vista**: la cámara gira hasta ~35° de un extremo al otro y la nube se desplaza, con un lerp que lo hace fluido y devuelve la escena al centro al salir (solo en punteros finos).
- [x] **60 fps o más** con el hero a la vista: medido 120 fps (tope del refresco) en desktop 1500px y en mobile 390px.
- [x] Al salir el hero del viewport el bucle se detiene.
- [x] Con `prefers-reduced-motion: reduce` se dibuja un solo frame y no queda `rAF` corriendo.
- [x] `astro build` pasa en verde (116 páginas) y no hay errores de consola atribuibles a estos componentes.
- [x] `OrbitLock`, `LightHalo`, `NodeField` y `SupportHub` siguen en el repo.

---

## Decisiones

- **Sí:** **canvas 2D** en vez de SVG. La referencia usa SVG con filtros por capa, pero el desenfoque es lo que vende la profundidad y en SVG son filtros por elemento; con 260 nodos y ~600 aristas no rinde.
- **Sí:** **tres lienzos apilados con `filter` por CSS**, uno por nivel de profundidad. La primera versión usaba `ctx.filter` y corría a **3 fps**: el filtro de canvas se aplica a *cada trazo* por separado. Moviendo el desenfoque al compositor pasó a **120 fps**. Las capas borrosas además se rasterizan a 0.5× y 0.75× de DPR.
- **Sí:** composición **aditiva** (`lighter`): los cruces suman luz, que es lo que da el brillo de la referencia.
- **Sí:** una sola componente con prop `variant` en vez de dos archivos: comparten motor, proyección y render.
- **Sí:** para Soporte, `constelacion` en vez de `vuelo`. El cliente pidió seguir la referencia (Nextnet) también en ese hero; se diferencia de Nosotros por el anclaje a la derecha, la cámara quieta, el titileo marcado y la máscara lateral.
- **No:** implementar las variantes `horizonte` y `globo` en el repo. Viven solo en el prototipo.
- **Sí:** conservar las escenas anteriores (SPEC 101 y 102) sin montar, como se hizo con `SolucionesScroll` y `SolucionesSlider`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La malla compite con el texto del hero | Vive entre la foto y el velo, así que el velo la atenúa justo sobre la columna de texto; además `opacity` es prop (0.85 y 0.8). |
| Fotos nuevas cargadas en Tina con el sujeto a la izquierda | El campo lo documenta explícitamente; `focus`/`focusMobile` permiten recolocar el encuadre. |
| El paralaje no se dispara porque la capa del overlay es `pointer-events-none` | El listener va en `window` y se calcula la posición contra el rect del contenedor. Fue un bug real de la primera versión: el hover no movía nada. |
| Costo del canvas en equipos modestos | DPR capado, capas de fondo a menor resolución, ~55% de nodos bajo 768px, pausa fuera del viewport. |
| `filter` de CSS sobre canvas no soportado | Degrada a capas sin desenfoque: se pierde la profundidad de campo, no el dibujo. |
