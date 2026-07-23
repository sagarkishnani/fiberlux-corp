# SPEC 64 — Inyección de código: scripts globales (head/body) + bloques HTML por sección

> **Estado:** Implementado
> **Depende de:** SPEC 33 (HeaderV2 en BaseLayout), SPEC 11/12 (plantillas solución/subservicio)
> **Fecha:** 2026-07-23
> **Objetivo:** Permitir desde Tina inyectar scripts crudos en el `<head>` y antes de `</body>` de todo el sitio, y colocar bloques de HTML libre en puntos de anclaje de la home y las páginas de solución/subservicio.

---

## Scope

**In:**

- **Scripts globales** — nuevo objeto `codeInjection` en la colección `global` con dos campos textarea:
  - `head` → HTML/JS crudo inyectado al final del `<head>` en **todas** las páginas (Analytics, Meta Pixel, verificación de dominio).
  - `bodyEnd` → HTML/JS crudo inyectado justo antes de `</body>` en **todas** las páginas (widgets de chat).
- **Bloques HTML por sección** — nueva lista `htmlInjections` en `global`; cada entrada tiene `label`, `enabled`, `location` (enum de anclajes) y `html` (textarea).
- **Anclajes disponibles** (6 puntos, solo home + solución + subservicio): bajo el hero y antes del footer de cada una de esas 3 plantillas.
- **Componente compartido** `HtmlInjection.astro` con prop `location`: consulta `global` y renderiza los bloques activos que coincidan, vía `<Fragment set:html={...} />`.
- **Cableado:** los scripts en `BaseLayout.astro`; los 6 `<HtmlInjection>` en `index.astro`, `[solucion].astro` y `[subservicio].astro`.

**Out of scope (futuro):**

- Scripts por página (solo global; se decidió así).
- Anclajes en otras páginas (nosotros, contacto, blog, legales, info-abonados, formas-de-pago, soporte, casos-de-éxito, fiberlux-app).
- Sistema de bloques / page-builder real (reordenar secciones libremente).
- Sanitización / validación del HTML introducido (responsabilidad del editor; es HTML de confianza del administrador).
- Carga de scripts en la pantalla de **mantenimiento** (no se inyectan ahí).

---

## Data model

**1. Scripts globales** — objeto nuevo en la colección `global` (`src/content/global/index.json`):

```
{ name: "codeInjection", label: "Scripts globales (head / body)", type: "object",
  fields: [
    { name: "head",    label: "Código en <head>",        type: "string", ui: { component: "textarea" },
      description: "HTML/JS crudo al final del <head>, en TODAS las páginas. Ej: Google Analytics, Meta Pixel, verificación." },
    { name: "bodyEnd", label: "Código antes de </body>",  type: "string", ui: { component: "textarea" },
      description: "HTML/JS crudo antes de </body>, en TODAS las páginas. Ej: widget de chat." },
  ] }
```

**2. Bloques HTML por sección** — lista nueva en `global`:

```
{ name: "htmlInjections", label: "Bloques HTML por sección", type: "object", list: true,
  ui: { itemProps: (item) => ({ label: item?.label || "Bloque HTML" }) },
  fields: [
    { name: "label",    label: "Nombre (referencia)", type: "string" },
    { name: "enabled",  label: "Activo",              type: "boolean" },
    { name: "location", label: "Ubicación",           type: "string", options: [
        { value: "home-after-hero",          label: "Home — bajo el hero" },
        { value: "home-before-footer",       label: "Home — antes del footer" },
        { value: "solucion-after-hero",      label: "Solución — bajo el hero" },
        { value: "solucion-before-footer",   label: "Solución — antes del footer" },
        { value: "subservicio-after-hero",   label: "Subservicio — bajo el hero" },
        { value: "subservicio-before-footer",label: "Subservicio — antes del footer" },
      ] },
    { name: "html", label: "HTML", type: "string", ui: { component: "textarea" } },
  ] }
```

**3. Renderizado** — `HtmlInjection.astro` recibe `location`, consulta `global` una vez, filtra `htmlInjections` por `enabled === true && location === prop`, y emite cada `html` con `<Fragment set:html={entry.html} />`.

---

## Implementation plan

1. **Schema en Tina.**
   En `tina/config.ts`, colección `global`: añadir el objeto `codeInjection` (`head`, `bodyEnd`) y la lista `htmlInjections` (`label`, `enabled`, `location`, `html`) según el Data model. (`tinacms dev` regenera el cliente.) Prueba manual: en `/admin` → Global aparecen "Scripts globales" con dos textareas y "Bloques HTML por sección" como lista con dropdown de ubicación.

2. **Scripts globales en `BaseLayout.astro`.**
   Extender la consulta `client.queries.global` que ya existe (hoy solo lee `whatsapp`) para leer también `codeInjection`. Inyectar `codeInjection.head` con `<Fragment set:html={...} />` justo antes de `</head>`, y `codeInjection.bodyEnd` justo antes del cierre del `<Fragment>` de contenido (antes de `</body>`), **solo cuando `!maintenanceMode`** y el campo no esté vacío. Prueba manual: poner `<meta name="test" content="ok">` en head y un `<script>console.log('body')</script>` en bodyEnd; verificar en el HTML servido y en la consola.

3. **Componente `HtmlInjection.astro`.**
   Crear `src/components/shared/HtmlInjection.astro` con prop `location: string`. Consulta `global`, filtra `htmlInjections` por `enabled === true && location === location`, renderiza cada `html` con `<Fragment set:html={entry.html} />`. Si no hay coincidencias no emite nada. Prueba manual: importar en una página con una entrada activa y ver el HTML.

4. **Anclajes en la home.**
   En `src/pages/index.astro`: colocar `<HtmlInjection location="home-after-hero" />` inmediatamente tras `<HeroHome />` y `<HtmlInjection location="home-before-footer" />` tras `<BlogPreview />` (BaseLayout ya añade el footer después del `<slot />`). Prueba manual: una entrada `home-after-hero` activa aparece bajo el hero.

5. **Anclajes en solución (categoría).**
   En `src/pages/soluciones/[solucion].astro`: `<HtmlInjection location="solucion-after-hero" />` tras el hero y `<HtmlInjection location="solucion-before-footer" />` al final del contenido. Prueba manual: entrada `solucion-before-footer` aparece antes del footer en `/soluciones/<categoría>`.

6. **Anclajes en subservicio.**
   En `src/pages/soluciones/[solucion]/[subservicio].astro`: `<HtmlInjection location="subservicio-after-hero" />` tras el hero y `<HtmlInjection location="subservicio-before-footer" />` al final. Prueba manual: entrada `subservicio-before-footer` aparece antes del footer en un subservicio.

---

## Acceptance criteria

- [ ] En `/admin` → Global existen "Scripts globales" (dos textareas: head y body) y "Bloques HTML por sección" (lista con `label`, `enabled`, `location`, `html`).
- [ ] Código escrito en `codeInjection.head` aparece dentro del `<head>` de todas las páginas del sitio.
- [ ] Código escrito en `codeInjection.bodyEnd` aparece justo antes de `</body>` de todas las páginas.
- [ ] Un `<script>` inyectado por cualquiera de los dos campos se ejecuta en el navegador.
- [ ] Con los campos de scripts vacíos no se emite ningún nodo extra ni error.
- [ ] Una entrada `htmlInjections` con `enabled: true` y `location` de home aparece en el anclaje correcto de la home.
- [ ] Lo mismo para los anclajes de solución y subservicio.
- [ ] Una entrada con `enabled: false` no se renderiza en ninguna parte.
- [ ] En modo mantenimiento no se inyectan ni scripts ni bloques HTML.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** scripts solo globales (una vez en `global`), no por página. Cubre el 95% de casos (Analytics/Pixel/chat) sin multiplicar superficie de edición ni riesgo.
- **Sí:** dos campos separados `head` y `bodyEnd`. Es el patrón estándar (WordPress "header/footer scripts"): unos tags deben ir en `<head>`, otros al final del `<body>`.
- **Sí:** bloques HTML como **lista global posicionada por anclaje** (enum), en vez de un campo "HTML extra" por colección. Evita reescribir cada plantilla y da al editor un único lugar donde gestionarlos.
- **Sí:** set de 6 anclajes acotado a home + solución + subservicio (bajo el hero / antes del footer). Son las páginas propensas a campañas/promos; ampliar anclajes es añadir un `value` al enum y un `<HtmlInjection>` en la plantilla.
- **Sí:** renderizado con `<Fragment set:html={...} />` (HTML crudo de confianza del administrador). No se sanitiza.
- **Sí:** ni scripts ni bloques se cargan en modo mantenimiento (pantalla autónoma; evita interferencias).
- **No:** sistema de bloques/page-builder que permita reordenar secciones. Otro spec si aterriza.
- **No:** override de scripts por página. Otro spec si aterriza.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| HTML/JS mal formado del editor puede romper el layout o la página | Es HTML de confianza del administrador; `set:html` no valida. Se documenta en la `description` de cada campo. Anclajes acotados limitan el alcance de un error a su sección. |
| `set:html` con `<script>` no se ejecuta si se inserta post-hidratación | Los anclajes y los scripts se emiten en el HTML en build (SSG), no tras hidratar, así que el navegador ejecuta los `<script>` al cargar. |
| Scripts pesados de terceros degradan el rendimiento | Fuera del control del código; queda a criterio del editor. El campo está vacío por defecto. |
| Un `location` nuevo en el enum sin su `<HtmlInjection>` en la plantilla no renderiza | Se añaden en el mismo paso (enum + anclaje van juntos por plantilla). |

---

## Lo que **no** está en este spec

- Scripts o HTML por página individual (solo global).
- Anclajes fuera de home / solución / subservicio.
- Sistema de bloques / page-builder para reordenar secciones.
- Sanitización o validación del HTML inyectado.
- Inyección en la pantalla de mantenimiento.

Cada uno, si aterriza, va en su propio spec.
