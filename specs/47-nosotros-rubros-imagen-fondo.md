# SPEC 47 — Rubros (Nosotros): imagen de fondo por card con overlay, negro por defecto

> **Estado:** Implementado
> **Depende de:** SPEC 05 (slider de Rubros en Nosotros), SPEC 40 (motor de arrastre unificado).
> **Fecha:** 2026-07-20
> **Objetivo:** Permitir una imagen de fondo editable por rubro (con overlay oscuro en degradado para legibilidad), cayendo al fondo negro actual cuando el rubro no tiene imagen.

---

## Alcance

**Dentro:**

- **Campo nuevo `image`** (tipo image) en cada item de `about.rubros.items` (`tina/config.ts`). Regenerar el cliente Tina.
- **Render en `RubrosReact.tsx`:** cuando el rubro tiene `image`, se muestra a sangre completa como fondo de la card (`object-cover`) con un **overlay oscuro en degradado (más oscuro abajo)** para que el ícono y el nombre se lean.
- **Default sin imagen:** la card mantiene el fondo actual (`rgba(42,42,42,0.5)` + `backdrop-blur`), es decir el look negro de hoy.
- **Sembrar las imágenes que coinciden** en `src/content/about/index.json`:
  - `Educación` → `images/rubros/rubro-educacion.jpg`
  - `Energía y Minería` → `images/rubros/rubro-mineria.jpg`
  - El resto de los 9 rubros quedan sin imagen (fondo negro).
- La ruta de imagen es `BASE_URL`-aware (como en `PartnersMarquee`/hero).

**Fuera (para futuros specs):**

- Usar `rubro-restaurantes.jpg` y `rubro-hoteleria.jpg` (no hay rubro que coincida hoy).
- Cambiar la lista de rubros para calzar con el mockup (Minería/Restaurantes/Hotelería como items propios).
- Producir u optimizar imágenes nuevas.
- Aplicar imágenes de fondo a otros sliders (soluciones, certificaciones).
- Animaciones/parallax sobre la imagen.

---

## Modelo de datos

Se extiende cada item de `about.rubros.items` (`tina/config.ts`, ~línea 878) con un campo opcional:

```js
// dentro de rubros.items.fields, junto a icon y label
{ name: "image", label: "Imagen de fondo (opcional)", type: "image" },
```

Contenido sembrado en `src/content/about/index.json` (solo los que coinciden):

```jsonc
{ "icon": "energia",    "label": "Energía y Minería", "image": "images/rubros/rubro-mineria.jpg" },
{ "icon": "educacion",  "label": "Educación",         "image": "images/rubros/rubro-educacion.jpg" }
```

`image` es opcional; si falta, la card usa el fondo negro actual. No hay colecciones nuevas.

---

## Plan de implementación

> Trabajo en `tina/config.ts`, `src/content/about/index.json` y `src/components/nosotros/RubrosReact.tsx`. Cada paso deja el proyecto ejecutable.

1. **Schema.** Añadir el campo `image` (type image) a `rubros.items` en `tina/config.ts`. Regenerar Tina. *Test:* en `/admin` → Nosotros → Rubros, cada rubro muestra el campo "Imagen de fondo".
2. **Tipo + render (`RubrosReact.tsx`).** Extender la interfaz `Rubro` con `image?`. En `card(...)`, cuando hay `image`: envolver en un contenedor `relative overflow-hidden`, pintar `<img>` absoluto `object-cover` + un div overlay con el degradado, y subir el contenido (ícono + label) a `z-10`. Sin `image`: dejar el fondo actual. Ruta con `BASE_URL`. *Test:* una card con imagen la muestra de fondo con texto legible; una sin imagen se ve como hoy.
3. **Contenido.** Sembrar `image` en los dos rubros que coinciden en `about/index.json`. *Test:* en Nosotros, "Educación" y "Energía y Minería" muestran su foto de fondo; los otros 7 quedan negros.
4. **QA + build.** Revisar Nosotros en desktop (~1440px) y mobile (~390px): legibilidad de ícono/nombre sobre la imagen, cards sin imagen intactas, arrastre/autoplay del slider sin cambios. Correr `astro build`. *Test:* checklist en verde y build sin errores/warnings nuevos.

---

## Criterios de aceptación

- [ ] En `/admin` → Nosotros → Rubros, cada rubro tiene un campo **"Imagen de fondo (opcional)"**.
- [ ] Un rubro **con** imagen la muestra a sangre completa como fondo de la card, con **overlay en degradado (más oscuro abajo)**.
- [ ] El **ícono** (tile magenta) y el **nombre** del rubro se leen bien sobre la imagen.
- [ ] Un rubro **sin** imagen se ve con el **fondo negro actual** (sin cambios).
- [ ] "Educación" y "Energía y Minería" quedan sembrados con `rubro-educacion.jpg` y `rubro-mineria.jpg`.
- [ ] El arrastre, las flechas y el autoplay del slider siguen funcionando igual.
- [ ] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** campo `image` **por rubro, editable** en el CMS (no convención por slug); permite reemplazar/subir desde `/admin`. *(Elección del usuario.)*
- **Sí:** **sembrar solo los rubros que coinciden** (Educación, Energía y Minería); Restaurantes/Hotelería no se usan porque no existen como rubro hoy. *(Elección del usuario.)*
- **Sí:** overlay **en degradado más oscuro abajo**, donde va el nombre; deja ver la foto en el centro. *(Elección del usuario.)*
- **Sí:** default sin imagen = **fondo negro actual** (`rgba(42,42,42,0.5)` + blur), no se toca el look existente.
- **No:** cambiar la lista de rubros al mockup; sería otro spec si se decide.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fotos muy claras/ruidosas donde el texto no se lee. | Degradado más oscuro abajo + tile magenta opaco del ícono; QA por card. |
| El `object-cover` recorta la parte interesante en ciertos altos. | `object-position` afinable; QA a 1440 y 390. |
| Imágenes `.jpg` pesadas afectan la carga de Nosotros. | Fuera de alcance optimizar; se puede convertir a `.webp` en otro spec si molesta. |

---

## Lo que **no** entra en este spec

- Usar `rubro-restaurantes.jpg` / `rubro-hoteleria.jpg` (sin rubro que coincida).
- Reemplazar la lista de rubros para calzar con el mockup.
- Imágenes de fondo en otros sliders.
- Optimización/producción de imágenes ni animaciones.
