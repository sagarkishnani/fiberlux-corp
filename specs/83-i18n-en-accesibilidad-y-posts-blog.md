# SPEC 83 — i18n EN · Panel de accesibilidad y cuerpos de posts del blog

> **Estado:** Implementado
> **Depende de:**
> - **SPEC 80** (i18n ES/EN: infra, `Locale`, `t()`/`tField`/`richField`, convención `_en`, cómputo de `locale` en `BaseLayout` y paso a islands).
> - **SPEC 15 / blog** (colección `post`, `BlogDetailReact`, rutas `/en/blog/[slug]`).
> - **SPEC 30 / accesibilidad** (`AccessibilityPanel.tsx`).
>
> **Fecha:** 2026-07-30
>
> **Objetivo:** Traducir a inglés los **únicos elementos que quedan en ES**: los textos del **panel de accesibilidad** (cableándolo a i18n) y el **cuerpo (`body_en`) de los 2 posts** del blog.

---

## Alcance

**Dentro:**

- **Panel de accesibilidad (`src/components/shared/AccessibilityPanel.tsx`)**
  - Añadir prop `locale?: Locale` (default `"es"`) y pasarla desde `BaseLayout.astro` (igual que `Footer`/`HeaderV2`).
  - Reemplazar los 18 strings ES hardcodeados por lecturas i18n con fallback a ES.
  - Traducir la plantilla aria `(nivel X de Y)` → `(level X of Y)`.
- **Origen de los strings EN del panel** → **[Decisión, recomendada] un mapa in-file `A11Y_UI[locale]`** dentro del componente (patrón `FORM_UI` de `DynamicFormReact`), por ser strings propios del panel. Alternativa: claves `a11y.*` en `src/i18n/ui.ts`.
- **Blog — cuerpos EN**: rellenar `body_en` (rich-text) en los **2** posts:
  - `src/content/blog/big-data-decisiones-empresariales.mdx`
  - `src/content/blog/saas-productividad-equipos.mdx`
  - Traducción fiel del cuerpo ES completo (encabezados, listas, énfasis).
- **QA en `/en`**: panel de accesibilidad en inglés; `/en/blog/<slug>` muestra el cuerpo en inglés; ES intacto.

**Fuera de alcance:**

- Traducir cualquier otro elemento (el resto del sitio ya está en EN por SPEC 80).
- Rediseñar el panel o cambiar su comportamiento (solo strings + prop `locale`).
- Traducir `title`/`excerpt` del blog (ya hechos) ni las **respuestas de FAQ de subservicios**, `legal.body_en`, ni los **formularios OSIPTEL** (siguen fuera, otras specs).
- Agregar nuevos posts o cambiar el schema `post` (ya tiene `body_en`).

---

## Modelo de datos

No introduce estructuras nuevas de CMS. Trabaja sobre lo existente:

- **`AccessibilityPanel.tsx`** — nuevo mapa in-file:
  ```ts
  const A11Y_UI: Record<Locale, Record<string, string>> = {
    es: { open, title, subtitle, secVisual, secFine, contraste, agrandar,
          espaciadoLetras, ocultarImg, dislexia, saturacion, invertir,
          sliderTexto, sliderEspaciado, reset, close, panel /* + aria */ },
    en: { /* traducciones */ },
  };
  const L = (k: string) => A11Y_UI[locale]?.[k] ?? A11Y_UI.es[k] ?? k;
  ```
  La plantilla de nivel se arma con `L`: `` `${label} (${locale==='en'?'level':'nivel'} ${level} ${locale==='en'?'of':'de'} ${max})` `` (o dos claves `levelWord`/`ofWord`).
- **`BaseLayout.astro`** — `<AccessibilityPanel client:idle locale={locale} />` (la var `locale` ya se computa ahí).
- **Blog** — se agrega la clave `body_en` (rich-text) al frontmatter de los 2 MDX con el cuerpo traducido. `body` (ES, `isBody`) permanece igual; `BlogDetailReact` ya hace `richField(post,'body',locale) ?? body`.

### Inventario de strings del panel (ES → EN)

| # | Clave | ES | EN (propuesta) |
| --- | --- | --- | --- |
| 1 | open | Abrir panel de accesibilidad | Open accessibility panel |
| 2 | panel | Panel de accesibilidad | Accessibility panel |
| 3 | close | Cerrar panel de accesibilidad | Close accessibility panel |
| 4 | title | Accesibilidad | Accessibility |
| 5 | subtitle | Ajusta la experiencia visual a tus necesidades | Adjust the visual experience to your needs |
| 6 | secVisual | Visual | Visual |
| 7 | secFine | Ajuste fino | Fine-tuning |
| 8 | contraste | Contraste | Contrast |
| 9 | agrandar | Agrandar texto | Enlarge text |
| 10 | espaciadoLetras | Espaciado entre letras | Letter spacing |
| 11 | ocultarImg | Ocultar imágenes | Hide images |
| 12 | dislexia | Dislexia Amigable | Dyslexia-friendly |
| 13 | saturacion | Saturación | Saturation |
| 14 | invertir | Invertir colores | Invert colors |
| 15 | sliderTexto | Texto | Text |
| 16 | sliderEspaciado | Espaciado | Spacing |
| 17 | reset | Restablecer valores | Reset values |
| 18 | aria nivel | (nivel X de Y) | (level X of Y) |

---

## Plan de implementación

1. **Cablear `locale` al panel**: prop `locale` en `AccessibilityPanel.tsx` + pasarla desde `BaseLayout.astro`. *Test:* compila; en ES el panel se ve idéntico.
2. **Mapa `A11Y_UI` + reemplazo de strings**: sustituir los 18 strings y la plantilla aria por `L(...)`. *Test:* en `/` (ES) todo igual; en `/en` el panel abre en inglés (título, subtítulo, secciones, cards, sliders, reset, aria).
3. **Traducir `body_en` del post 1** (`big-data-...mdx`). *Test:* `/en/blog/big-data-...` muestra el cuerpo en inglés; `/blog/big-data-...` sigue en ES.
4. **Traducir `body_en` del post 2** (`saas-productividad-equipos.mdx`). *Test:* ídem para el 2º post.
5. **QA `/en` (desktop + mobile)** con Playwright MCP: panel de accesibilidad en inglés y ambos posts en inglés; verificar fallback ES intacto. *Test:* `astro build` compila; QA aprobado.

---

## Criterios de aceptación

- [ ] En `/en`, el panel de accesibilidad muestra **todos** sus textos en inglés (aria incluidas y la etiqueta de nivel `level X of Y`); en `/` sigue en español.
- [ ] El panel recibe `locale` desde `BaseLayout`; ningún string del panel queda hardcodeado en ES en el render.
- [ ] `body_en` está relleno y traducido en los 2 posts; `/en/blog/<slug>` renderiza el cuerpo en inglés (encabezados/listas/énfasis) y `/blog/<slug>` en español.
- [ ] Cualquier `_en` vacío cae a ES sin romper (fallback intacto).
- [ ] `astro build` compila sin errores nuevos; no se modificó el comportamiento del panel ni el schema `post`.

---

## Decisiones

- **[Recomendada] Strings EN del panel en un mapa in-file `A11Y_UI`** (patrón `FORM_UI` de `DynamicFormReact`), no en `ui.ts`: son ~18 strings propios del componente; mantiene `ui.ts` para chrome transversal. *Alternativa registrada:* claves `a11y.*` en `src/i18n/ui.ts`.
- **Blog: solo `body_en`** (title/excerpt ya traducidos). Se rellena en el frontmatter MDX; la traducción la produce el implementador.
- **Sin cambios de schema ni de diseño**: la infraestructura i18n del blog y del panel es suficiente; esto es completar contenido + un cableado mínimo de `locale`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `body_en` es **rich-text en frontmatter MDX**; la serialización a mano puede no parsear igual que el `isBody`. | Verificar el formato que Tina espera (o autorarlo desde `/admin`); QA render en `/en/blog/*`. Fallback a ES si queda vacío evita romper. |
| Strings del panel omitidos (p.ej. una aria) quedan en ES. | Checklist de los 18 strings + plantilla de nivel; QA visual del panel abierto en `/en`. |
| `client:idle` no recibe `locale` correctamente. | Pasar `locale` como prop literal desde `BaseLayout` (ya lo computa); verificar en `/en`. |
