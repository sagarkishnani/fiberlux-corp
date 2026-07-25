# SPEC 66 — Links legales configurables (interno/externo) + documentos en el footer

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (legales OSIPTEL y editabilidad), SPEC 07 (footer links)
> **Fecha:** 2026-07-24
> **Objetivo:** Permitir en Tina marcar cada link del footer como interno (misma pestaña) o externo (nueva pestaña con `target=_blank`), y cablear los links legales/solicitudes a los PDFs de `public/legales`, las páginas existentes y la guía externa de OSIPTEL.

---

## Scope

**In:**

- **Campo `external`** (booleano "Abrir en pestaña nueva") en el schema **compartido** de links del footer (`global.footer.columns[].links[]`) en `tina/config.ts`.
- **`FooterReact.tsx`**: cuando `external` es `true`, renderiza `target="_blank" rel="noopener noreferrer"`; si es `false`, misma pestaña (sin `target`).
- **Renombrar los 7 PDFs** de `public/legales` a slugs limpios.
- **Actualizar `global/index.json`** (columna "Legales"): corregir las URLs a los PDFs renombrados / páginas existentes / URL de OSIPTEL, y marcar `external: true` en los PDFs y en OSIPTEL.
- **Actualizar la columna "Solicitudes"**: cablear sus 2 links a los PDFs renombrados (nueva pestaña).

**Out of scope (futuro):**

- Links del header/menú de navegación (otro schema).
- El link "Preferencias de cookies" (`#preferencias-cookies`) — es una acción del panel de cookies; se deja igual (interno).
- Autodetección de externo por URL (se eligió toggle explícito).
- El `showMoreUrl` del banner de cookies (`cookie-consent`) — link roto aparte; opcional, se puede corregir en otro spec.

---

## Data model

**1. Schema del link del footer** (`tina/config.ts`, dentro de `footer.columns[].links`):

```
{ name: "external", label: "Abrir en pestaña nueva", type: "boolean",
  description: "Actívalo para links externos o documentos PDF (abre en nueva pestaña, target=_blank). Déjalo apagado para páginas internas del sitio." }
```

**2. Renombrado de PDFs** (`public/legales/`) — lista completa (7):

```
1.-Politica-de-Privacidad-Sitio-Web-Fiberlux-Tech.pdf            → politica-privacidad.pdf
2.-Politica-de-Cookies-Fiberlux-Tech.pdf                         → politica-cookies.pdf
4.-Manual-Derechos-ARCO-Fiberlux-Tech.pdf                       → formulario-derechos-arco.pdf
6.-Politica-de-Videovigilancia-Fiberlux-Tech.pdf                → politica-videovigilancia.pdf
POL-SST-01-Politica-de-SST-V4-3.pdf                             → politica-sst.pdf
SOBRE-LA-TERMINACION-DEL-CONTRATO-Y-BAJA-DEL-SERVICIO-oaf.pdf   → terminacion-y-baja-servicio.pdf
SUSPENSION-TEMPORAL-DEL-SERVICIO-A-SOLICITUD-DEL-ABONADO.pdf    → suspension-temporal-servicio.pdf
```

**3a. Mapeo de la columna "Legales"** (texto → URL → interno/externo):

| Texto | URL destino | Abrir |
| --- | --- | --- |
| Libro de reclamaciones | `/legales/libro-reclamaciones` (página) | interno |
| Tratamiento de datos personales | `/legales/tratamiento-datos` (página) | interno |
| Política de Cookies | `/legales/politica-cookies.pdf` | **nueva pestaña** |
| Política de Privacidad | `/legales/politica-privacidad.pdf` | **nueva pestaña** |
| Política de videovigilancia | `/legales/politica-videovigilancia.pdf` | **nueva pestaña** |
| Política de SST | `/legales/politica-sst.pdf` | **nueva pestaña** |
| Manual de derechos ARCO | `/legales/derechos-arco` (página) | interno |
| Formulario de solicitud de derechos ARCO | `/legales/formulario-derechos-arco.pdf` | **nueva pestaña** |
| Guía de presentación de Reclamos de OSIPTEL | `https://www.osiptel.gob.pe/guiareclamos/` | **nueva pestaña** |
| Formulario de reclamo | `/reclamos/reclamo` | interno |
| Formulario de apelación | `/reclamos/apelacion` | interno |
| Formulario de queja | `/reclamos/queja` | interno |
| Preferencias de cookies | `#preferencias-cookies` (sin cambios) | interno |

**3b. Mapeo de la columna "Solicitudes"**:

| Texto | URL destino | Abrir |
| --- | --- | --- |
| Cancelación de servicio | `/legales/terminacion-y-baja-servicio.pdf` | **nueva pestaña** |
| Suspensión temporal del servicio | `/legales/suspension-temporal-servicio.pdf` | **nueva pestaña** |

> Nota: los PDFs quedan en `public/legales/` (donde los colocó el cliente), así que la URL es `/legales/...` aunque la columna se llame "Solicitudes".

---

## Implementation plan

1. **Schema en Tina.**
   En `tina/config.ts`, dentro de `footer.columns[].links`, añadir el campo `external` (boolean, "Abrir en pestaña nueva"). (`tinacms dev` regenera el cliente.) Prueba manual: en `/admin` → Global → Footer, cada link muestra el toggle.

2. **Render del target en `FooterReact.tsx`.**
   En el `<a>` de los links (línea ~99), cuando `link.external` sea `true` añadir `target="_blank"` y `rel="noopener noreferrer"`; si no, sin `target`. Prueba manual: un link con el toggle activo abre en pestaña nueva; sin él, en la misma.

3. **Renombrar los 7 PDFs** en `public/legales/` a los slugs limpios del Data model. Prueba manual: cada PDF responde en su nueva ruta `/legales/<slug>.pdf`.

4. **Actualizar `global/index.json`** (columnas "Legales" y "Solicitudes"): fijar las URLs según el mapeo y poner `external: true` en los PDFs y en la guía de OSIPTEL; dejar `external` ausente/false en las páginas internas y en "Preferencias de cookies". Prueba manual: en el footer, PDFs y OSIPTEL abren en pestaña nueva; páginas y `/reclamos/*` en la misma; no hay links rotos.

---

## Acceptance criteria

- [ ] En `/admin` → Global → Footer, cada link tiene el toggle "Abrir en pestaña nueva".
- [ ] Un link con `external: true` renderiza `<a target="_blank" rel="noopener noreferrer">`; con `external` falso/ausente, sin `target`.
- [ ] Los 7 PDFs de `public/legales` abren desde sus links (rutas renombradas), en pestaña nueva.
- [ ] "Guía de presentación de Reclamos de OSIPTEL" → `https://www.osiptel.gob.pe/guiareclamos/` en pestaña nueva.
- [ ] "Manual de derechos ARCO" → `/legales/derechos-arco` en la misma pestaña; "Formulario de solicitud de derechos ARCO" → `/legales/formulario-derechos-arco.pdf` en pestaña nueva.
- [ ] Los links internos (páginas legales y `/reclamos/*`) abren en la misma pestaña.
- [ ] Las 2 solicitudes apuntan a sus PDFs y abren en pestaña nueva.
- [ ] No queda ningún link de "Legales"/"Solicitudes" roto (cada uno apunta a un PDF/página/URL existente).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** toggle explícito `external` (boolean) por link, no autodetección por URL. El editor tiene control directo del comportamiento.
- **Sí:** el campo va en el schema **compartido** de links del footer (`columns[].links`), no solo en "Legales". Un cambio cubre todas las columnas.
- **Sí:** los PDFs (mismo dominio) se marcan para abrir en **nueva pestaña** — UX estándar de documentos, para no sacar al usuario del sitio.
- **Sí:** renombrar los PDFs a slugs limpios; se dejan en `public/legales/` (URL `/legales/...`).
- **Sí (indicación del cliente):** "Manual de derechos ARCO" → página `/legales/derechos-arco`; "Formulario de solicitud de derechos ARCO" → PDF.
- **No:** links del nav/header y `showMoreUrl` del banner de cookies (otro schema/componente); van en otro spec si aterrizan.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Renombrar los PDFs rompe algún link que use el nombre viejo | `grep` previo: hoy nada referencia esos nombres largos; las URLs del footer aún no existían. |
| El editor olvida activar el toggle en un link externo | Abre en la misma pestaña (comportamiento aceptado al elegir toggle explícito); la `description` del campo lo aclara. |
| `target="_blank"` sin `rel` expone `window.opener` | Se añade siempre `rel="noopener noreferrer"` junto al `_blank`. |
| La página `/legales/derechos-arco` no existe como ruta | Verificar en el paso 4; hoy existe `src/pages/legales/derechos-arco/index.astro`. |

---

## Lo que **no** está en este spec

- Links del header/menú de navegación.
- `showMoreUrl` del banner de cookies.
- Autodetección de interno/externo por URL.
- La columna "Preferencias de cookies" (acción del panel, sin cambios).

Cada uno, si aterriza, va en su propio spec.
