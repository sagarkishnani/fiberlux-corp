# SPEC 127 — Legales como páginas en vez de PDF

> **Estado:** Aprobado
> **Depende de:** SPEC 120
> **Fecha:** 2026-11-06
> **Objetivo:** Que las 5 políticas legales que el footer enlaza como PDF se lean como páginas del sitio, editables en Tina con la plantilla legal existente.

---

## Por qué existe este spec

**Obs 71** (PDF 6): "Que los legales se muestren como página, no como PDF".

Hoy la columna "Legales" del footer (`global.footer.columns[2].links`) mezcla páginas y PDFs:

| Enlace del footer | Hoy | Tras este spec |
|---|---|---|
| Libro de reclamaciones | Página (form) | Sin cambio |
| Tratamiento de datos | Página (`legal`) | Sin cambio |
| Derechos ARCO | Página (`legal` + form) | Sin cambio |
| `politica-cookies.pdf` | PDF, 7 págs. | `/legales/politica-cookies` |
| `politica-privacidad.pdf` | PDF, 15 págs. | `/legales/politica-privacidad` |
| `politica-videovigilancia.pdf` | PDF, 2 págs. | `/legales/politica-videovigilancia` |
| `politica-sst.pdf` | PDF, 1 pág. **escaneada (sin texto)** | `/legales/politica-sst` |
| `manual-derechos-arco.pdf` | PDF, 5 págs. | `/legales/manual-derechos-arco` |

Ya existe la plantilla: colección `legal` (`src/content/legal/*.json`: eyebrow, title, updatedAt, `body`/`body_en` rich-text, `embeddedFormSlug`, seo), renderizada por `src/components/legal/LegalPage.astro`. Hoy solo la usan `tratamiento-datos` y `derechos-arco`, cada una con su propia página en `src/pages/legales/<slug>/index.astro`.

---

## Scope

**Incluye:**

- 5 documentos nuevos en `src/content/legal/`: `politica-cookies.json`, `politica-privacidad.json`, `politica-videovigilancia.json`, `politica-sst.json`, `manual-derechos-arco.json`.
- **Transcripción** del texto de cada PDF al `body` rich-text, como borrador fiel para que el cliente lo revise: títulos → `h2`/`h3`, listas, tablas simples, negritas. Sin reescribir el contenido.
  - `politica-sst.pdf` es una imagen escaneada: se transcribe leyendo la imagen. Las firmas y sellos no se transcriben; se menciona "Documento firmado por la Gerencia General" si aparece.
- Ruta dinámica `src/pages/legales/[slug].astro` que genera una página por cada documento `legal` **sin** página propia, con `LegalPage.astro`. También su wrapper `src/pages/en/legales/[slug].astro`.
- Campo nuevo opcional `pdfUrl` en `legal`: si tiene valor, la página muestra "Descargar PDF" junto a la fecha de actualización.
- Footer: los 5 enlaces apuntan a las páginas nuevas (sin `external`, sin `.pdf`).
- Los PDF se **quedan** en `public/legales/` (para links viejos y para la descarga).
- Las páginas nuevas entran en el índice del buscador (`SearchOverlay`) si los legales ya están indexados.
- EN: `body_en` vacío ⇒ fallback ES (`richField`), como el resto de los legales.

**Fuera de scope:**

- Los PDFs de la columna "Solicitudes" (`terminacion-y-baja-servicio.pdf`, `suspension-temporal-servicio.pdf`): son formatos para descargar y llenar.
- Los PDFs no enlazados del footer (condiciones de uso, reglamento de calidad, TUO de reclamos).
- Traducir al inglés los documentos.
- Revisión legal del contenido.
- Migrar `tratamiento-datos` y `derechos-arco` a la ruta dinámica.

---

## Modelo de datos

### `tina/config.ts` → colección `legal`, campo nuevo

```ts
{ name: "pdfUrl", label: "PDF descargable (opcional)", type: "string" }
```

### Documento de ejemplo

```jsonc
// src/content/legal/politica-cookies.json
{
  "eyebrow": "Legales",
  "title": "Política de cookies",
  "title_en": "Cookie policy",
  "updatedAt": "<fecha que figura en el PDF>",
  "pdfUrl": "/legales/politica-cookies.pdf",
  "body": { "type": "root", "children": [ /* transcripción */ ] },
  "seo": { "title": "Política de cookies | Fiberlux", "description": "…" }
}
```

### Ruta dinámica

```ts
// src/pages/legales/[slug].astro → getStaticPaths
// todos los documentos de `legal` menos los que tienen carpeta propia:
const OWN_PAGE = ["tratamiento-datos", "derechos-arco"];
```

- Las rutas estáticas de Astro ganan a la dinámica, pero excluirlas en `getStaticPaths` evita builds duplicados y warnings.
- La URL de la página (`/legales/politica-cookies`) y la del PDF (`/legales/politica-cookies.pdf`) son distintas y conviven.

---

## Plan de implementación

Rama: `spec-127-legales-como-paginas` contra `staging`.

1. **Schema + ruta.** `pdfUrl` en `legal`, `[slug].astro` y su wrapper `/en`, y el botón "Descargar PDF" en `LegalPage.astro`. Verificación: un JSON mínimo de prueba genera su página en ES y EN.
2. **Transcripción: videovigilancia (2 págs.) y SST (1 pág. escaneada).** Verificación: lectura lado a lado con el PDF, sin párrafos faltantes.
3. **Transcripción: cookies (7 págs.) y manual ARCO (5 págs.).** Mismo control.
4. **Transcripción: privacidad (15 págs.).** Mismo control.
5. **Footer y buscador.** Apuntar los 5 enlaces a las páginas y revisar el índice de búsqueda. Verificación: ningún enlace de la columna "Legales" termina en `.pdf`.
6. **Registro.** obs 71 → `Hecho` en `specs/observaciones-cliente.md`, con nota para el cliente: revisar las transcripciones. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] Existen `/legales/politica-cookies`, `/legales/politica-privacidad`, `/legales/politica-videovigilancia`, `/legales/politica-sst` y `/legales/manual-derechos-arco`, y sus versiones `/en/...`.
- [ ] Cada página usa la plantilla legal (eyebrow, título, fecha y cuerpo) y tiene "Descargar PDF".
- [ ] El texto de cada página coincide con su PDF: mismos títulos, mismo orden y sin secciones faltantes.
- [ ] Los 5 enlaces de la columna "Legales" del footer abren páginas del sitio en la misma pestaña.
- [ ] Las URLs `.pdf` antiguas siguen respondiendo 200.
- [ ] Los documentos se editan desde Tina (colección `legal`).
- [ ] `/legales/tratamiento-datos` y `/legales/derechos-arco` no cambian.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Sí:** solo los 5 PDFs que enlaza el footer. Lo confirmó el autor.
- **Sí:** transcribir el texto como borrador fiel que revisa el cliente. Lo confirmó el autor. Los cambios de redacción son del cliente.
- **Sí:** reusar la colección `legal` y `LegalPage.astro`. Ya están, son editables y bilingües.
- **Sí:** ruta dinámica para los nuevos. Evita crear 5 carpetas iguales (×2 por el `/en`).
- **No:** migrar ahora `tratamiento-datos` y `derechos-arco` a la ruta dinámica. Funcionan y tienen formularios embebidos; no suma.
- **Sí:** conservar los PDF y ofrecer la descarga. Hay enlaces externos y correos que apuntan a ellos.
- **No:** incrustar el PDF (iframe o visor). Es justo lo que el cliente no quiere.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Errores al transcribir el PDF escaneado de SST | Se transcribe a mano desde la imagen y se marca en el resumen para el cliente como "verificar". |
| Las tablas del PDF de privacidad no se representan bien en el rich-text de Tina | Tabla simple si Tina lo soporta; si no, lista con negritas. Se documenta en el tracker. |
| Choque con el hotfix `hotfix/footer-enlaces-arco` (enlaces del manual y del formulario ARCO) que está en `main` | Antes de empezar, verificar si ese fix ya está en `staging` y partir de esa versión del footer. |
| Conflicto de nombre entre `/legales/<slug>` y una carpeta futura | `OWN_PAGE` lista explícita; documentado en la ruta. |

---

## Qué **no** entra en este spec

- PDFs de "Solicitudes" y PDFs no enlazados.
- Traducción EN de los documentos.
- Revisión legal del contenido.
