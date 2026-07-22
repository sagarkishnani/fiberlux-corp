# SPEC 56 — Lote QA cliente: ajustes visuales y responsive

> **Estado:** Implementado
> **Depende de:** SPEC 34/52 (certificaciones), SPEC 49 (testimonios tema claro), SPEC 54 (¿por qué Fiberlux?), SPEC 11/12 (plantillas solución/subservicio)
> **Fecha:** 2026-07-22
> **Objetivo:** Corregir siete observaciones de QA del cliente (fondo de home, alturas de cards, botón recortado, padding, tipografía en móviles chicos, fade de certificaciones y alto del hero de subservicio) sin tocar el motor táctil de sliders.

---

## Por qué este spec existe

Lote de observaciones de QA enviadas por el cliente (Miguel) como capturas de WhatsApp desde mobile, guardadas en `~/Downloads/obs_fiberlux/`. Son bugs visuales y de responsive puntuales, todos aislables a nivel de componente/página, sin cambio de contenido ni de schema. Se agrupan en un solo spec batch para un deploy (mismo criterio que SPEC 36). Las dos observaciones que tocan el **motor táctil del slider** (arrastre que no avanza y distorsión al deslizar) se separan a su propio spec por requerir verificación en un dispositivo Android real.

---

## Scope

**In:**

- **obs2** — En home, el fondo negro que rodea/sigue al panel "¿Por qué Fiberlux?" pasa a claro (tono testimonios). El panel morado se mantiene. Solo en home.
- **obs3** — Igualar el alto de todas las cards del "Catálogo de soluciones" (por página, al alto de la más alta), desktop y mobile.
- **obs4** — El botón "Contactar" del form de subservicio deja de quedar tapado por la sección "Insights & Novedades".
- **obs5** — El padding lateral del catálogo deja de "achicarse" al paginar (slide 3/4 vs 1/2).
- **obs6** — El título de "Comprometidos con el desarrollo tecnológico del Perú" (MissionVision) deja de pegarse al borde en celulares pequeños.
- **obs7** — La última card del slider de Certificaciones ISO deja de verse desvanecida por la máscara de borde.
- **obs8** — El hero de subservicio reserva un alto mínimo para título+descripción en mobile, para que la sección no cambie de tamaño entre subservicios.

**Out of scope (spec aparte / futuro):**

- **obs1 + obs9** — Motor táctil del slider (arrastre no avanza + distorsión por `backdrop-blur` al deslizar). Van a un spec propio (SPEC 57) por requerir verificación en Android real.
- **14a** — Vector distinto por categoría en "El desafío" (sigue diferido de lotes anteriores).
- Rediseño del panel de stats a tema claro completo (se descartó en favor de solo el marco).

---

## Data model

Este lote no introduce estructuras de datos nuevas ni cambios de schema en TinaCMS.

Única prop nueva de componente (obs2):

```
// src/components/Stats.astro → StatsReact.tsx
// Prop opcional que activa el "marco claro" alrededor del panel morado.
frameTheme?: 'dark' | 'light'   // default: 'dark' (sin cambio)
```

Solo `src/pages/index.astro` pasa `frameTheme="light"`. `nosotros/index.astro` y las páginas de subservicio quedan sin la prop (comportamiento actual).

---

## Implementation plan

Cada paso es commiteable por sí solo y deja el sitio funcional.

1. **obs7 — Fade de certificaciones consciente del borde.**
   En `src/components/certificaciones/CertificacionesSliderReact.tsx`, la máscara horizontal (`mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%)`, ~líneas 146-153) desvanece la última card cuando `atEnd`. Togglear la máscara con el estado del slider: aplicar el fade derecho solo cuando `!atEnd` (clase condicional en `.cert-carousel`, p. ej. `atEnd ? 'no-fade-right' : ''` con `.no-fade-right { -webkit-mask-image:none; mask-image:none }`). Prueba manual: deslizar hasta el final; la última card se ve nítida.

2. **obs3 + obs5 — Catálogo: cards de igual alto y padding estable.**
   En `src/components/servicios/CatalogoSolucionesReact.tsx`:
   - Igualar alturas: en el grid de cada página (`.catalogo-page`, ~línea 234) usar `auto-rows-fr` (o `items-stretch`), y en la card cambiar `min-h-[140px]` (~línea 242) por `h-full`. Replicar en el grid desktop (~línea 171) para que todas las cards de la página crezcan al alto de la más alta.
   - Padding estable al paginar: garantizar que cada `.catalogo-page` conserve el inset lateral de `site-container` en todas las páginas (usar `scroll-px`/padding por página consistente para que 3/4 tenga el mismo encuadre que 1/2).
   Prueba manual: la card de ciberseguridad se ve pareja; pasar de 1/2 a 3/4 no cambia el margen lateral.

3. **obs4 — Botón "Contactar" no tapado por Insights.**
   En `src/pages/soluciones/[solucion]/[subservicio].astro` (~líneas 60-63), el `-mt-16` del wrapper de `BlogPreview` sube la sección sobre el final del form. Limitar el solape a desktop (`md:-mt-16 mt-0`) y/o dar padding inferior extra al form (`ServiciosFormReact`, `py-14 md:py-20` → sumar `pb` en mobile) para que el solape caiga en espacio vacío, no sobre el botón.
   Prueba manual: en mobile, el botón "Contactar" se ve completo antes de "Insights & Novedades".

4. **obs6 — Título de MissionVision no pegado al borde en móviles chicos.**
   En `src/components/nosotros/MissionVisionReact.tsx`, el título es `text-[40px] md:text-[48px]` fijo (~líneas 39-44). Reducir el tamaño base para pantallas angostas (p. ej. `text-[30px] min-[380px]:text-[36px] md:text-[48px]`) manteniendo `leading` coherente, sin tocar el padding de `site-container`.
   Prueba manual: en un viewport de 320-360px el título respira y no roza el borde.

5. **obs8 — Alto mínimo del hero de subservicio en mobile.**
   En `src/components/servicios/HeroSubservicioReact.tsx`, la columna de texto (`max-w-[560px]`, ~línea 117) no tiene alto reservado, así que la sección cambia de tamaño según el largo del título. Añadir un `min-h` en mobile a la columna título+descripción, dimensionado al título más largo del set de subservicios (`min-h-[...] md:min-h-0`). Usar `min-height`, no altura fija, para no recortar títulos largos.
   Prueba manual: comparar dos subservicios de título corto vs largo; la sección arranca a la misma altura en mobile.

6. **obs2 — Marco claro del panel "¿Por qué Fiberlux?" solo en home.**
   Añadir prop `frameTheme` a `src/components/Stats.astro` y `src/components/StatsReact.tsx`. Cuando `frameTheme="light"`, envolver el `<section>` morado en un contenedor con fondo claro (`bg-brand-purple-lightest`, el mismo de testimonios) para que los gaps por `rounded-t-3xl` y el área que sigue al panel se lean claros en vez de negros. El panel morado (radial gradient) no cambia. En `src/pages/index.astro` (~líneas 85-87) pasar `frameTheme="light"`; el resto de páginas sin la prop.
   Prueba manual: en home el marco alrededor del panel es claro; en nosotros/subservicio sigue negro.

---

## Acceptance criteria

- [ ] En certificaciones, al deslizar hasta el final la última card ISO se ve sin desvanecimiento (obs7).
- [ ] En el "Catálogo de soluciones" todas las cards de una página tienen el mismo alto, en desktop y mobile (obs3).
- [ ] Pasar de la página 1/2 a la 3/4 del catálogo mantiene el mismo padding lateral (obs5).
- [ ] En mobile, el botón "Contactar" del form de subservicio se ve completo, sin quedar tapado por "Insights & Novedades" (obs4).
- [ ] En un viewport de 320-360px, el título de MissionVision no toca el borde de la pantalla (obs6).
- [ ] Dos subservicios con títulos de distinto largo arrancan a la misma altura de sección en mobile (obs8).
- [ ] El título largo de un subservicio no se recorta (min-height, no altura fija) (obs8).
- [ ] En home, el fondo alrededor del panel "¿Por qué Fiberlux?" es claro; en nosotros y subservicio sigue negro (obs2).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** un solo spec batch para las 7 observaciones visuales. Precedente SPEC 36; se despliegan juntas.
- **Sí:** obs2 cambia solo el marco/fondo negro a claro; el panel morado se conserva. Menos riesgo que rediseñar el panel a tema claro completo.
- **No:** rediseñar el panel de stats a tema claro (fondo claro + texto oscuro). Descartado por el cliente.
- **Sí:** obs1 + obs9 (motor táctil del slider) se difieren a SPEC 57. Requieren verificación en Android real; no deben bloquear el deploy visual.
- **Sí:** obs8 usa `min-height`, no altura fija, para no recortar títulos largos.
- **Sí:** obs3 iguala al alto de la card más alta de cada página (`auto-rows-fr` + `h-full`), no a un número fijo.
- **Sí:** obs2 se controla con una prop `frameTheme` en Stats, activada solo desde `index.astro`, para no afectar el mismo componente en nosotros/subservicio.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El marco claro de obs2 choca visualmente con la sección de arriba/abajo en home | Usar el mismo `bg-brand-purple-lightest` de testimonios y revisar el empalme con las secciones adyacentes; la prop solo afecta home. |
| El `min-h` del hero (obs8) recorta un título más largo que el previsto | Usar `min-height` (no `height`); dimensionar contra el título más largo real del set de subservicios. |
| Igualar alturas (obs3) genera cards muy altas si una tiene mucho texto | Es el comportamiento pedido ("mismo alto"); el alto lo fija la card más alta por página, no un valor global. |
| El fix de `-mt-16` (obs4) rompe el solape deseado en desktop | Limitar el cambio a mobile (`md:-mt-16 mt-0`); desktop conserva el solape. |

---

## Lo que **no** está en este spec

- obs1 + obs9 — motor táctil del slider (arrastre que no avanza, distorsión por `backdrop-blur`) → SPEC 57.
- 14a — vector por categoría en "El desafío".
- Cualquier rediseño del panel de stats a tema claro completo.

Cada uno, si aterriza, va en su propio spec.
