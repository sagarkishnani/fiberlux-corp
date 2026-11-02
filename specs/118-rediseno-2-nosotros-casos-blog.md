# SPEC 118 — Rediseño 2: Nosotros, Casos de éxito, Blog y Artículo

> **Estado:** Aprobado
> **Depende de:** SPEC 117 (fundaciones, chrome y Home del rediseño)
> **Fecha:** 2026-11-01
> **Objetivo:** Rehacer las páginas Nosotros, Casos de éxito, listado del Blog y Artículo con el diseño claro del prototipo, reutilizando el contenido de Tina.

---

## Por qué existe este spec

Es la segunda parte del rediseño dividido en 4 specs (ver SPEC 117). Agrupa las páginas "institucionales y editoriales". Comparten bloques entre sí (testimonios, CTA de casos, rubros) y con el Home.

Referencia: `references/rediseno/` (desempaquetado en el SPEC 117):

- `Nosotros.dc.html`
- `Casos de Exito.dc.html`
- `Blog.dc.html`
- `Articulo.dc.html`

Para cada una hay versión desktop y mobile.

---

## Scope

**In:**

- **Nosotros** (`/nosotros`), en el orden del prototipo:
  1. Hero.
  2. ¿Por qué Fiberlux?
  3. Metodología.
  4. Ciberseguridad.
  5. Historia (timeline; sustituye la versión de los SPEC 03/04).
  6. Certificación ISO.
  7. Misión, visión y valores.
  8. Política SGSI.
  9. Testimonios.
  10. CTA casos.
  11. Rubros (sustituye las versiones de los SPEC 05, 47 y 90).
- **Casos de éxito** (`/casos-de-exito`): hero de casos, "Empresas que confían" y Rubros.
- **Blog** (`/blog`): cabecera y grilla de artículos con la categoría y la meta (fecha · minutos) del prototipo.
- **Artículo** (`/blog/[slug]`): cabecera, contenido MDX con la tipografía del prototipo y relacionados.
- Bloques compartidos que nacen aquí: `TestimoniosV2`, `CtaCasos` y `RubrosV2`. Se ubican en `src/components/shared/` para reutilizarlos en el SPEC 120.
- Campos nuevos en `about`, `casos` y `post` (con `_en`), solo para lo que el prototipo muestra y hoy no existe en el CMS.
- Limpieza de los componentes oscuros de estas páginas que queden sin referencias.
- Rutas `/en` de las 4 páginas.

**Fuera de scope (para specs posteriores):**

- Soluciones y Ciberseguridad (SPEC 119).
- Contacto, Soporte, Pago, App, Legal, Info abonados (SPEC 120).
- Traducir los cuerpos de posts (`post.body_en`): sigue a cargo del cliente.
- Paginación o filtros nuevos del blog que no estén en el prototipo.

---

## Data model

Se reutilizan `about`, `casos` y `post`. Solo se agregan campos opcionales con su `_en` donde el prototipo pide texto que hoy no existe en el CMS, por ejemplo:

- `about.porQue`, `about.metodologia`, `about.ciberseguridad`, `about.iso` y `about.sgsi`: cada uno con `{ eyebrow, title, text, items[] }`.
- `post.readingMinutes` (número).

Los nombres definitivos se fijan al leer el prototipo y el schema actual en el paso 1. Ningún campo existente se renombra.

---

## Implementation plan

1. Rama `spec-118-rediseno-nosotros-casos-blog` desde `staging`. Mapear cada sección del prototipo contra el campo de Tina existente y listar los faltantes.
2. Schema: agregar los campos faltantes con `_en` y cargar el contenido ES/EN. Build verde.
3. Bloques compartidos `TestimoniosV2`, `CtaCasos` y `RubrosV2`.
4. Nosotros: hero → misión/visión/valores.
5. Nosotros: historia, ISO, SGSI, testimonios, CTA y rubros.
6. Casos de éxito.
7. Blog (listado).
8. Artículo (cabecera, prosa MDX, relacionados).
9. Reveals y `prefers-reduced-motion`. Limpieza de los componentes oscuros sin uso (`grep` de imports antes de borrar).
10. Revisar los wrappers `/en` y actualizar `CLAUDE.md`.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] En 1440px y 390px, cada una de las 4 páginas coincide sección por sección con su prototipo desktop o mobile.
- [ ] Todo texto visible es editable en `/admin`.
- [ ] En `/en`, las 4 páginas muestran `_en` con fallback a ES.
- [ ] El timeline y los rubros conservan los datos actuales de `about.timeline` y `about.rubros`.
- [ ] Un post sin `readingMinutes` se muestra sin romper la meta.
- [ ] La consola del navegador queda sin errores en las 4 páginas ES y EN.
- [ ] Ningún componente borrado sigue importado (`npm run build` lo garantiza).

---

## Decisiones

- **Sí:** agrupar institucional + editorial; comparten testimonios, CTA casos y rubros.
- **Sí:** los bloques compartidos se crean aquí y se reusan en el SPEC 120.
- **Sí (asumido):** reutilizar el contenido de Tina y agregar solo lo faltante; fidelidad 1:1 con el prototipo.
- **No:** renombrar campos existentes. Rompería el contenido ya cargado por el cliente.
- **Definición rápida:** el autor pidió asumir y guardar; el detalle de campos se cierra en el paso 1.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El prototipo trae textos que no existen en el CMS | Paso 1 los lista; se cargan como contenido ES con un borrador EN. |
| Timeline/rubros nuevos pierden la interacción de los SPEC 04/05/90 | Se replica la interacción del prototipo; si difiere, manda el prototipo. |

---

## Lo que **no** entra en este spec

- Soluciones (SPEC 119) y páginas de servicio/legal (SPEC 120).
- Traducción de cuerpos de posts.
