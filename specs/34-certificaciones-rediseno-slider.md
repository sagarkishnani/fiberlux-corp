# SPEC 34 — Rediseño del slider de Certificaciones (Home + Nosotros)

> **Status:** Implementado
> **Depends on:** SPEC 05 (reutiliza el patrón de carrusel con flechas/drag/snap de los sliders de Nosotros)
> **Date:** 2026-07-14
> **Objective:** Rediseñar el slider de "Certificaciones del grupo Fiberlux" a tarjetas oscuras con ícono central editable y layout de dos columnas (título + flechas a la izquierda, tarjetas deslizando a la derecha), y montarlo también en `/nosotros` además del Home.

---

## Scope

**In:**

- **Rediseño de `src/components/certificaciones/CertCard.tsx` a la tarjeta oscura del Figma:**
  - Fondo oscuro (`#0a0a0a`/`rgba`), borde tenue (`#282445`), `rounded-[24px]`.
  - **Año** arriba-izquierda (Space Mono, tenue).
  - **Indicador check-circle** arriba-derecha: círculo con borde magenta y check — **decorativo fijo**, igual en todas las tarjetas (no editable).
  - **Tile del ícono central**: círculo con relleno/gradiente magenta claro y el **ícono editable** (blanco), elegido de un set predefinido mapeado a `react-icons`, con `FALLBACK_ICON`.
  - **Categoría** (ej. "SISTEMA ANTISOBORNO") en mayúsculas, con tracking, tono magenta/gris claro.
  - **Código ISO** (ej. "ISO 37001") blanco, bold, centrado.
  - **Divisor** magenta corto centrado.
  - **Descripción** gris, centrada.
  - `data-tina-field` en año, categoría, código y descripción para edición visual.
- **Modelo de datos (colección `certificaciones`):** reemplazar el campo `logo` (image) por `icon` (select de claves predefinidas) y **retirar** el campo `eyebrow`; conservar `year`, `title` (código ISO), `heading` (categoría) y `description`, más `sectionTitle`.
- **Set de íconos curado** en el componente: mapa clave→`react-icons/fa6` + `FALLBACK_ICON` (escudo-check).
- **Rediseño de layout en `src/components/certificaciones/CertificacionesSliderReact.tsx` a dos columnas (desktop):**
  - Columna izquierda fija: **título grande** ("Certificaciones del grupo Fiberlux") + **pill de flechas** (prev tenue / next magenta) **debajo** del título.
  - Columna derecha: **viewport del carrusel** con las tarjetas que **asoman (peek)** al borde derecho.
  - **Mobile:** se apila — título arriba, tarjetas en carrusel debajo, flechas debajo (convención de los demás sliders del proyecto).
- **Montaje en `/nosotros`:** insertar `<CertificacionesSlider />` en `src/pages/nosotros/index.astro` como **último bloque antes del footer** (debajo de `RubrosReact`). En Home se mantiene el montaje actual (`src/pages/index.astro:77`), ahora con el nuevo diseño.
- **Seed** de `src/content/certificaciones/index.json` actualizado al nuevo modelo (`icon` en vez de `logo`, sin `eyebrow`).

**Out of scope (para futuras specs):**

- **Nuevas páginas o rutas** (ej. `/certificaciones`): la sección solo vive en Home y Nosotros.
- **Subida de imagen/logo por certificación:** se reemplaza por ícono de un set cerrado; no hay upload por tarjeta.
- **Indicador check-circle editable:** es decorativo fijo, no configurable desde el CMS.
- **Colección o query nueva:** se reutiliza la colección `certificaciones` existente (misma query en ambas páginas).
- **Dots de paginación / inercia física (momentum):** navegación por flechas + drag con snap; sin dots.
- **Descripción larga o campos extra por certificación** más allá de los cuatro confirmados.

---

## Data model

Esta spec **no crea una colección nueva**: modifica la colección `certificaciones` existente (singleton, `create/delete: false`). Cambia dos campos del item.

### 1. Schema en `tina/config.ts` (colección `certificaciones`, dentro de `items`)

Antes (item): `year`, `logo` (image), `title`, `eyebrow`, `heading`, `description`.
Después (item): `year`, `icon` (select), `title`, `heading`, `description`. Se **elimina** `logo` y `eyebrow`.

```js
fields: [
  { name: "year", label: "Año", type: "string" },
  {
    name: "icon",
    label: "Ícono",
    type: "string",
    options: [
      { value: "antisoborno",   label: "Antisoborno (escudo-check)" },
      { value: "seguridad",     label: "Seguridad de la información (candado)" },
      { value: "calidad",       label: "Gestión de calidad (medalla)" },
      { value: "ambiental",     label: "Ambiental (hoja)" },
      { value: "seguridad_st",  label: "Seguridad y salud (casco)" },
      { value: "procesos",      label: "Procesos (engranaje)" },
      { value: "certificado",   label: "Certificado (sello)" },
      { value: "cumplimiento",  label: "Cumplimiento (balanza)" },
    ],
  },
  { name: "title", label: "Código (ej. ISO 37001)", type: "string" },
  { name: "heading", label: "Categoría (ej. Sistema Antisoborno)", type: "string" },
  {
    name: "description",
    label: "Descripción",
    type: "string",
    ui: { component: "textarea" },
  },
],
```

`sectionTitle` (nivel de página) se conserva sin cambios.

### 2. Contenido en `src/content/certificaciones/index.json`

Migrar cada item: quitar `logo` y `eyebrow`, añadir `icon`.

```jsonc
{
  "sectionTitle": "Certificaciones del grupo Fiberlux",
  "items": [
    { "year": "2024", "icon": "antisoborno", "title": "ISO 37001", "heading": "Sistema Antisoborno", "description": "Marco de gestión para prevenir, detectar y responder ante el soborno en todas las operaciones del grupo." },
    { "year": "2025", "icon": "seguridad",   "title": "ISO 27001", "heading": "Seguridad de la Información", "description": "Sistema de gestión que protege la confidencialidad, integridad y disponibilidad de la información del grupo." },
    { "year": "2025", "icon": "calidad",     "title": "ISO 9001",  "heading": "Gestión de Calidad", "description": "Estándar internacional que asegura la mejora continua y la satisfacción del cliente en cada proceso." }
  ]
}
```

### 3. Mapa de íconos en runtime (`CertCard.tsx`)

Objeto que traduce cada clave `icon` a un componente de `react-icons/fa6`. Ejemplo de forma:

```ts
import { FaShieldHalved, FaLock, FaMedal, FaLeaf, FaHelmetSafety, FaGears, FaStamp, FaScaleBalanced } from "react-icons/fa6";

const ICONS: Record<string, IconType> = {
  antisoborno: FaShieldHalved,
  seguridad: FaLock,
  calidad: FaMedal,
  ambiental: FaLeaf,
  seguridad_st: FaHelmetSafety,
  procesos: FaGears,
  certificado: FaStamp,
  cumplimiento: FaScaleBalanced,
};
const FALLBACK_ICON: IconType = FaShieldHalved;
```

### 4. Tipo `Cert` en runtime (`CertCard.tsx`)

```ts
interface Cert {
  year?: string | null;
  icon?: string | null;   // reemplaza a `logo`
  title?: string | null;  // código ISO
  heading?: string | null;// categoría (mayúsculas)
  description?: string | null;
}
```

**Convenciones:**

- Fallback chain como hoy: `useTina` data → `initialData`; si `items` está vacío, se mantiene el placeholder actual ("próximamente").
- Si una clave `icon` no existe en `ICONS`, se usa `FALLBACK_ICON` (no rompe el render).
- La categoría (`heading`) se muestra en mayúsculas por CSS (`uppercase`), no se guarda en mayúsculas.

---

## Implementation plan

> Todo el trabajo vive en los 3 archivos de `src/components/certificaciones/`, el schema (`tina/config.ts`), el seed (`src/content/certificaciones/index.json`) y el montaje en `src/pages/nosotros/index.astro`. Cada paso deja el sitio ejecutable (`npm run dev`).

1. **Editar el schema `certificaciones` en `tina/config.ts`.** Quitar `logo` y `eyebrow` del item; añadir `icon` (select con las claves predefinidas). *Test:* `npm run dev` levanta sin errores y en `/admin` → **Certificaciones ISO** cada item muestra Año, un **Ícono** (desplegable), Código, Categoría y Descripción.

2. **Migrar el seed `src/content/certificaciones/index.json`.** Reemplazar `logo`/`eyebrow` por `icon` en cada item. *Test:* el JSON valida contra el schema sin warnings de Tina en consola.

3. **Rediseñar `CertCard.tsx` a la tarjeta oscura.** Nuevo tipo `Cert` (con `icon`), mapa `ICONS` + `FALLBACK_ICON`. Render: año arriba-izquierda, check-circle decorativo arriba-derecha, tile magenta con ícono central, categoría en mayúsculas, código ISO bold, divisor magenta, descripción. `data-tina-field` en año, categoría, código y descripción. *Test:* la tarjeta se ve oscura como el Figma en Home.

4. **Rediseñar el layout de `CertificacionesSliderReact.tsx` a dos columnas (desktop).** Columna izquierda: título grande + pill de flechas debajo. Columna derecha: viewport del carrusel con peek al borde derecho. Reusar la mecánica de scroll/drag/snap ya existente. *Test:* en ~1440px el título y las flechas quedan a la izquierda y las tarjetas asoman a la derecha, como el Figma.

5. **Ajustar el responsive mobile.** En mobile se apila: título arriba, carrusel debajo, flechas debajo. *Test:* en ~390px el layout se apila y el carrusel funciona (drag + flechas).

6. **Montar la sección en `/nosotros`.** Importar y renderizar `<CertificacionesSlider />` en `src/pages/nosotros/index.astro` como último bloque, debajo de `RubrosReact`. *Test:* en `/nosotros` aparece la sección de certificaciones al final, antes del footer, con el nuevo diseño.

7. **QA visual desktop + mobile.** Comparar contra el Figma con Playwright MCP (screenshots en `.playwright-screens/`) en Home y Nosotros; ajustar paddings, ancho de tarjeta, peek y posición de flechas. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambas páginas y breakpoints.

---

## Acceptance criteria

- [x] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [x] En `/admin` → **Certificaciones ISO**, cada certificación tiene **Año**, **Ícono** (desplegable de opciones predefinidas), **Código**, **Categoría** y **Descripción**; ya **no** aparecen los campos Logo ni Eyebrow.
- [x] Agregar, reordenar o editar una certificación en el CMS se refleja en la sección sin tocar código.
- [x] La tarjeta es **oscura** (fondo `#0a0a0a`/borde tenue), con **año** arriba-izquierda, **check-circle** decorativo arriba-derecha, **tile magenta** con el ícono central, **categoría** en mayúsculas, **código ISO** blanco bold, **divisor magenta** y **descripción** gris.
- [x] El **ícono central** se muestra según la clave elegida en el CMS; si la clave no tiene mapeo, se usa el **ícono de fallback** sin romper el render.
- [x] En **desktop** el layout es de **dos columnas**: título grande + pill de flechas a la **izquierda**, tarjetas deslizando/asomando a la **derecha**.
- [x] La flecha **next** avanza el carrusel y la **prev** retrocede; se puede **arrastrar** el carrusel (mouse/touch) con **snap** a la tarjeta más cercana.
- [x] En **mobile** el layout se **apila** (título arriba, carrusel debajo, flechas debajo) y el carrusel funciona.
- [x] La sección aparece con el **nuevo diseño en el Home** (mismo punto de montaje actual) **y en `/nosotros`** como último bloque antes del footer.
- [x] El **título de sección**, y por cada tarjeta el **año**, **categoría**, **código** y **descripción** son editables visualmente desde Tina (`data-tina-field`).
- [x] Si `items` está vacío, la sección no rompe la página (se mantiene el placeholder actual).

---

## Decisiones

- **Sí:** reutilizar la colección `certificaciones` y sus 3 componentes existentes, rediseñándolos. Evita duplicar componente/colección/query y mantiene un único origen para Home y Nosotros.
- **Sí:** reemplazar `logo` (image) por `icon` (select de claves predefinidas). Da consistencia visual con el Figma y con el patrón de Rubros (SPEC 05); evita imágenes dispares por tarjeta.
- **No:** conservar `logo`/`eyebrow` "por si acaso". El nuevo diseño no los usa; dejarlos genera campos muertos en el CMS y confusión. Se retiran del schema y del seed. *(Confirmado por el usuario: guardar a criterio.)*
- **Sí:** check-circle superior derecho **decorativo fijo**. En el Figma es un sello de marca igual en todas las tarjetas; hacerlo editable no aporta valor.
- **Sí:** ícono central **editable** desde un set cerrado mapeado a `react-icons/fa6`, con `FALLBACK_ICON`. El editor elige de una lista, sin typos ni subir SVGs.
- **Sí:** layout de **dos columnas** (título+flechas a la izquierda, cards a la derecha) en desktop, apilado en mobile. Es lo que muestra el Figma provisto por el usuario.
- **Sí:** montar en **`/nosotros`** como último bloque (debajo de Rubros). Posición coherente con el stack de secciones de Nosotros; el usuario dejó la posición a criterio.
- **No:** página/ruta nueva de certificaciones ni colección nueva. Fuera de alcance; la sección es informativa dentro de Home y Nosotros.
- **No:** dots de paginación e inercia física. La navegación es flechas + drag con snap, como el resto de sliders del proyecto.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Quitar `logo`/`eyebrow` del schema deja esos campos en el JSON y Tina muestra warnings. | Migrar el seed en el mismo paso (paso 2), eliminando `logo`/`eyebrow` de todos los items. |
| Una certificación con `icon` vacío o sin mapeo deja la tarjeta sin ícono. | `FALLBACK_ICON` cuando la clave no existe en `ICONS`; QA con un ícono no mapeado. |
| El layout de dos columnas rompe el peek/anchos en breakpoints intermedios (tablet). | Fijar ancho de tarjeta + gap por breakpoint y QA visual en ~1440px, ~768px y ~390px. |
| El drag horizontal entra en conflicto con el scroll vertical (Lenis) en mobile. | Mantener `touch-action`/`overflow-x` del carrusel actual; QA en mobile emulado. |
| La sección se ve distinta entre Home y Nosotros por estilos heredados del contenedor. | Es el mismo componente y query; QA visual en ambas páginas para confirmar paridad. |

---

## What is **not** in this spec

- Página o ruta `/certificaciones` dedicada.
- Subida de logo/imagen por certificación.
- Indicador check-circle editable desde el CMS.
- Dots de paginación e inercia física del drag.

Cada uno, si llega, va en su propia spec.
