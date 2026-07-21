# SPEC 52 — Certificaciones: glow de fondo (planet) para que no se vea solo negro

> **Estado:** Aprobado
> **Depende de:** SPEC 34 (sección/slider de Certificaciones), SPEC 48 (patrón de glow de fondo enmascarado)
> **Fecha:** 2026-07-21
> **Objetivo:** Agregar un glow decorativo de fondo (`planet.svg` de `public/images/soluciones/`) en la sección de Certificaciones, enmascarado para no verse cortado, ubicado en la zona superior detrás de las cards, para que el fondo deje de verse solo negro.

---

## Alcance

**Dentro:**

- **Agregar `planet.svg`** (`public/images/soluciones/planet.svg`) como **glow decorativo absoluto** en `src/components/certificaciones/CertificacionesSliderReact.tsx`:
  - La `<section>` pasa a `relative`; el contenido va en `relative z-10`; el glow en `z-0` detrás.
  - Posicionado en la **zona superior** (detrás/arriba de las cards), con la parte más brillante cerca del borde superior, según la referencia.
  - **Máscara radial** (`mask-image`) para que se desvanezca en sus bordes y **no se vea el recorte rectangular** del SVG (igual que el SPEC 48).
  - `pointer-events-none`, `aria-hidden`, ruta `BASE_URL`-aware, `select-none`.
- **La sección mantiene** `bg-greyscale-darkest` y `overflow-hidden`; el glow queda contenido.

**Fuera de alcance (para futuros specs):**

- **Glow editable desde el CMS** (es estático, como en el SPEC 48).
- **Cambiar el diseño de las cards**, el layout, o la mecánica del slider.
- **Tocar otras secciones** o sus glows.
- **Producir/optimizar un asset nuevo**: se reutiliza `planet.svg` ya existente.
- **Segundo glow** (line.svg u otro): solo se agrega `planet`.

---

## Modelo de datos

Esta feature **no introduce estructuras de datos nuevas**. Reutiliza el asset estático `public/images/soluciones/planet.svg` (un círculo magenta difuminado). No hay cambios de schema, contenido ni tipos.

---

## Plan de implementación

> Todo el cambio vive en `src/components/certificaciones/CertificacionesSliderReact.tsx`. Un paso de código + QA. Deja el sitio ejecutable (`npm run dev`).

1. **Agregar el glow en la sección.** Poner la `<section>` como `relative`; envolver el contenido interno en `relative z-10`; insertar un `<img src={planet} … className="pointer-events-none absolute … z-0 select-none">` con **máscara radial** (`WebkitMaskImage`/`maskImage: radial-gradient(closest-side, #000 …, transparent)`), posicionado en la zona superior (centro/derecha) según la referencia, con `opacity` moderada. Ruta `BASE_URL`-aware. *Verificación:* la sección muestra un glow magenta suave arriba, sin recorte rectangular, sin tapar el texto/cards.

2. **QA visual + consola** en desktop y mobile comparando con la referencia (Image #7). Ajustar posición/tamaño/opacidad hasta que el fondo no se vea solo negro y el glow se sienta sutil. *Verificación:* `npm run build` sin errores/warnings nuevos; sin errores en consola; el slider y las cards siguen legibles y funcionales.

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] La sección de **Certificaciones** muestra un **glow magenta** de fondo (desde `planet.svg`), en la **zona superior** detrás de las cards.
- [ ] El glow está **enmascarado** y **no** muestra un borde/recorte rectangular.
- [ ] El glow es **decorativo** (`pointer-events-none`, `aria-hidden`) y **no tapa** ni reduce la legibilidad del título, las flechas ni las cards.
- [ ] La sección conserva `bg-greyscale-darkest` y `overflow-hidden`; **no hay scroll horizontal** ni desbordes nuevos.
- [ ] En **desktop** el resultado se parece a la referencia (Image #7); en **mobile** el glow se ve proporcionado y sutil.
- [ ] No se modificó el diseño de las cards, la mecánica del slider ni otras secciones.

---

## Decisiones tomadas y descartadas

- **Sí:** reutilizar **`planet.svg`** de `public/images/soluciones/`. Lo pidió el cliente explícitamente ("planet") y ya existe.
- **Sí:** **glow estático** (no CMS), enmascarado. Consistente con el SPEC 48; es decorativo y no necesita edición.
- **Sí:** **máscara radial** para evitar el recorte rectangular del SVG. Aprendido del SPEC 48 (feedback "que no se vea cortado").
- **No:** agregar también `line.svg` u otro segundo glow. El cliente pidió solo "planet"; se mantiene simple.
- **No:** hacer el glow editable en Tina. Fuera de alcance; los glows del proyecto son estáticos.
- **Sí:** ubicarlo en la **zona superior** detrás de las cards, según la referencia.
- **Definición semi-rápida:** el spec se generó en modo semi-automático (contexto suficiente desde el inicio: asset nombrado + referencia + patrón del SPEC 48), a pedido del cliente ("Guarda").

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El glow **tapa o resta legibilidad** al título/cards. | Contenido en `relative z-10`, glow en `z-0` con opacidad moderada; QA de contraste. |
| El SVG muestra un **borde rectangular** (recorte del blur). | Máscara radial (`mask-image`) que desvanece los bordes, como el SPEC 48. |
| El glow **desborda** la sección o genera scroll horizontal. | `overflow-hidden` en la sección + `pointer-events-none`; tamaños/posición acotados; QA. |
| En **mobile** el glow se ve desproporcionado. | Tamaños con `vw`/`max-w` y QA a ~390px; ajustar en el paso 2. |

---

## Qué **NO** entra en este spec

- Glow editable desde el CMS.
- Cambios en las cards, el layout o la mecánica del slider.
- Otras secciones u otros glows (line.svg, etc.).
- Assets nuevos.

Cada uno de estos, si aterriza, va en su propio spec.
