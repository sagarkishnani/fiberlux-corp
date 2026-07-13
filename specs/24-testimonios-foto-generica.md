# SPEC 24 — Testimonios visibles con foto genérica de respaldo

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-07-13
> **Objective:** Activar la sección de testimonios en el home y mostrar un avatar genérico de respaldo cuando un testimonio no tenga foto propia.

---

## Por qué existe este spec

El cliente aún no tiene fotos reales de los clientes que dan testimonio.
La sección hoy está oculta (`visible: false`) y la tarjeta muestra una caja de texto "Sin foto" cuando falta el avatar.
Para esta fase de revisión el cliente quiere ver los testimonios renderizados con una imagen, no una caja vacía, sin comprometer todavía las fotos reales.
Se mantiene el toggle de visibilidad ya acordado para poder ocultar la sección más adelante.

---

## Scope

**In:**

- Poner `testimonials.visible: true` en `src/content/home/index.json`.
- Crear un asset de avatar genérico neutro en `public/images/testimonials/avatar-placeholder.svg`.
- En `TestimonialCard.tsx`, usar ese avatar genérico como respaldo cuando `avatar` esté vacío, tanto en desktop como en mobile.
- Sustituir la caja de texto "Sin foto" (desktop) y la caja gris vacía (mobile) por el avatar genérico.
- Mantener intactas las 3 fotos Unsplash actuales de los testimonios existentes.

**Out of scope (for future specs):**

- Reemplazar las fotos Unsplash por fotos reales de clientes (llega cuando el cliente las entregue).
- Subir el avatar genérico como campo editable en el CMS (por ahora es una constante del componente).
- Añadir nuevos testimonios o cambiar los textos/quotes existentes.
- Cambiar el diseño del marco morado, el layout o el comportamiento del slider.

---

## Data model

Este spec no introduce estructuras de datos nuevas en el CMS. El esquema `testimonials` de `tina/config.ts` (campos `visible`, `sectionTitle`, `items[]` con `quote`, `description`, `name`, `role`, `company`, `avatar`, `logo`) se mantiene igual.

El único dato nuevo es una constante de ruta dentro de `TestimonialCard.tsx`:

```tsx
// Avatar de respaldo cuando un testimonio no tiene foto propia.
const PLACEHOLDER_AVATAR = `${import.meta.env.BASE_URL}images/testimonials/avatar-placeholder.svg`;
```

Regla de resolución del avatar: `avatar || PLACEHOLDER_AVATAR`. Si `avatar` tiene valor (caso actual de los 3 testimonios), se usa la foto real; si está vacío, se usa el genérico.

---

## Implementation plan

1. Crear `public/images/testimonials/avatar-placeholder.svg`: un avatar neutro (silueta de persona) sobre fondo tenue, cuadrado, que se lea claramente como placeholder y encaje en el slot cuadrado de la tarjeta (150×150 desktop, 72×72 mobile).
2. En `TestimonialCard.tsx`, declarar la constante `PLACEHOLDER_AVATAR` con `import.meta.env.BASE_URL`.
3. En el bloque desktop, reemplazar el ternario `avatar ? <img> : <div>Sin foto</div>` por un `<img>` que siempre renderiza con `src={avatar || PLACEHOLDER_AVATAR}`. Mantener las clases y tamaños actuales.
4. En el bloque mobile, reemplazar el ternario `avatar ? <img> : <div>` por un `<img>` con `src={avatar || PLACEHOLDER_AVATAR}`. Mantener clases y tamaños.
5. Poner `"visible": true` en el objeto `testimonials` de `src/content/home/index.json`.
6. Verificar en `npm run dev`: la sección aparece en el home, los 3 testimonios muestran sus fotos Unsplash, y un testimonio con avatar vacío muestra el genérico.

---

## Acceptance criteria

- [ ] La sección de testimonios se renderiza en el home (ya no está oculta).
- [ ] Los 3 testimonios existentes siguen mostrando sus fotos Unsplash actuales.
- [ ] Un testimonio sin `avatar` muestra el avatar genérico de `public/images/testimonials/avatar-placeholder.svg`, no la caja de texto "Sin foto".
- [ ] El fallback funciona igual en desktop y en mobile.
- [ ] El toggle `visible` sigue existiendo en el CMS y ocultar la sección la quita del sitio.
- [ ] No hay errores en consola al cargar el home.

---

## Decisions

- **Sí:** mantener las fotos Unsplash actuales de los 3 testimonios. El cliente quiere ver el aspecto final con caras; se reemplazarán por fotos reales en otro spec.
- **Sí:** fallback automático en el componente (`avatar || PLACEHOLDER_AVATAR`). Si el cliente sube una foto real desde el CMS, la reemplaza sin tocar código.
- **No:** escribir la ruta del genérico en cada item del JSON. Es menos flexible y obligaría a borrarla a mano cuando llegue la foto real.
- **Sí:** activar `visible: true` ahora, manteniendo el toggle. El cliente necesita ver la sección en esta fase de revisión.
- **No:** hacer el avatar genérico editable desde el CMS. Overengineering para un placeholder temporal; si hace falta, va en otro spec.
- **Nota:** definición rápida, el usuario aceptó todas las secciones en automático sin revisión intermedia.

---

## What is **not** in this spec

- Reemplazar las fotos Unsplash por fotos reales de clientes.
- Hacer el avatar genérico un campo del CMS.
- Añadir o editar textos de testimonios.
- Cambios de diseño en el marco, layout o slider.

Cada uno de estos, si llega, va en su propio spec.
