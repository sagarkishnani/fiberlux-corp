# SPEC 77 — Información a Abonados: items OSIPTEL/Corp (reemplaza los de Fiberlux Negocios)

> **Estado:** Implementado
> **Depende de:** SPEC (página info-abonados), SPEC 01 (legales OSIPTEL/PDFs), SPEC 02 (reclamos), SPEC 66 (links interno/externo)
> **Fecha:** 2026-07-26
> **Objetivo:** Reemplazar el contenido de "Información a Abonados y Usuarios" por tres secciones (Normas, Reclamos, Contratos) con los items de OSIPTEL/Fiberlux Corp, quitando las referencias a Fiberlux Negocios.

---

## Scope

**In:**
- Reemplazar las secciones actuales (`Reglamentos` + `Contratos` con PDFs de Negocios) por **3 secciones nuevas**: **Normas**, **Reclamos**, **Contratos** con los items de la imagen.
- Enlazar cada item a su destino:
  - **Reclamos** → páginas internas del sitio (`/reclamos/reclamo`, `/reclamos/apelacion`, `/reclamos/queja`).
  - **Contratos** → recursos existentes (`/legales/tratamiento-datos`, PDFs de suspensión y terminación).
  - **Normas** + **Guía OSIPTEL** → enlaces externos a OSIPTEL (pre-cargo los que ya existen como PDF local; los faltantes quedan como **PENDIENTE** editables en Tina).
- **Links interno/externo** en `InfoAbonadosReact`: los internos (rutas del sitio) abren en la **misma pestaña** y son `BASE_URL`-aware; los externos y PDFs abren en **nueva pestaña** (hoy todos abren en nueva pestaña).

**Out of scope:**
- No cambia el diseño/layout de la página ni el schema de Tina (se reutiliza `sections[] → documents[]`).
- No se suben PDFs nuevos ni se consiguen las URLs oficiales de OSIPTEL faltantes (el editor las pega en Tina).
- No se tocan otras páginas legales ni los formularios de reclamos.

---

## Data model

Sin estructuras nuevas: se reutiliza el schema actual de `infoAbonados` (`sections[]`, cada una `{ title, visible, documents[] }`, cada doc `{ title, url, icon, visible }`). Solo cambia el **contenido** (`src/content/info-abonados/index.json`):

```
Normas
  • TUO de las condiciones de uso de los servicios públicos de telecomunicaciones
        → /documents/RES-000132-2025-CD-OSIPTEL-CONDICIONES-DE-USO.pdf  (existe; reemplazable por URL OSIPTEL)
  • Reglamento de calidad de los servicios públicos de telecomunicaciones
        → PENDIENTE (pegar URL OSIPTEL en Tina)
  • TUO para atención de gestiones y reclamos de usuarios
        → PENDIENTE (pegar URL OSIPTEL en Tina)
Reclamos
  • Conoce la Guía para la presentación de Reclamos de OSIPTEL
        → PENDIENTE (URL externa OSIPTEL en Tina)
  • Presenta tu reclamo      → /reclamos/reclamo
  • Presenta tu apelación    → /reclamos/apelacion
  • Presenta tu queja        → /reclamos/queja
Contratos
  • Tratamiento de datos personales               → /legales/tratamiento-datos
  • Solicitar la cancelación del servicio          → /legales/terminacion-y-baja-servicio.pdf
  • Solicitar la suspensión temporal del servicio  → /legales/suspension-temporal-servicio.pdf
```
`icon: "document"` en todos; `visible: true`. Los items PENDIENTE se dejan con `url` vacío o placeholder claramente marcado.

---

## Implementation plan

1. **Contenido.**
   Reescribir `src/content/info-abonados/index.json` con las 3 secciones e items de arriba y sus URLs (las conocidas cableadas; las PENDIENTE con placeholder). Actualizar `title`/`description` si hace falta para no mencionar "Negocios".

2. **Links interno/externo.**
   En `InfoAbonadosReact`: detectar si la URL es interna (empieza con `/` y no termina en `.pdf`) → render `<a href>` `BASE_URL`-aware, **misma pestaña**; externa (`http…`) o `.pdf` → `target="_blank" rel="noopener noreferrer"`. Un item con `url` vacío se muestra sin enlace activo (placeholder) para no romper la página.

3. **Verificación + build.**
   La página muestra 3 secciones (Normas/Reclamos/Contratos); los enlaces internos navegan en la misma pestaña; los PDFs/externos abren en nueva; no quedan textos de "Fiberlux Negocios"; `npm run build` compila.

---

## Acceptance criteria

- [ ] La página muestra exactamente las 3 secciones (Normas, Reclamos, Contratos) con los items de la imagen.
- [ ] No queda ninguna referencia a "Fiberlux Negocios" en la página.
- [ ] "Presenta tu reclamo/apelación/queja" abren los formularios del sitio en la misma pestaña.
- [ ] "Tratamiento de datos" → `/legales/tratamiento-datos`; "Solicitar cancelación" y "suspensión" → sus PDFs (nueva pestaña).
- [ ] Los items de Normas y la Guía existen y son editables en Tina (los faltantes marcados como pendientes, sin romper la página).
- [ ] Enlaces internos en misma pestaña y `BASE_URL`-aware; externos/PDF en nueva pestaña.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** 3 secciones; "Contratos" agrupa Tratamiento de datos / cancelación / suspensión.
- **Sí:** Reclamos enlaza a las páginas internas del sitio.
- **Sí:** Contratos usa los recursos ya existentes (página tratamiento-datos + PDFs suspensión/terminación).
- **Sí:** Normas/Guía como enlaces externos OSIPTEL (pendientes editables en Tina donde no hay URL).
- **Sí:** distinguir interno/externo en los enlaces (interno misma pestaña, externo/PDF nueva) — mejora coherente con SPEC 66.
- **No:** cambiar schema, diseño, ni subir PDFs nuevos en este spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Items PENDIENTE quedan con enlace vacío | Se marcan claramente; la página no se rompe (link deshabilitado/placeholder); el editor los completa en Tina. |
| Rutas internas rotas bajo subpath (/staging) | Enlaces internos `BASE_URL`-aware (paso 2). |
| PDFs de cancelación/suspensión no son exactamente el título del item | Se usan los PDFs existentes que corresponden; editable en Tina si el cliente tiene otros. |

---

## Lo que **no** está en este spec

- Cambios de diseño/layout o del schema de Tina.
- Subir PDFs nuevos ni conseguir las URLs oficiales de OSIPTEL faltantes.
- Otras páginas legales o los formularios de reclamos.
