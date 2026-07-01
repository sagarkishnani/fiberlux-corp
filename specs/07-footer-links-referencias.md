# SPEC 07 — Footer según referencias (links + crédito de agencia)

> **Status:** Aprobado
> **Depends on:** SPEC 06 (que fijó el link "Soporte técnico" → `/soporte-tecnico` en `global`). Reutiliza el patrón dual + `client:tina` del `Footer` compartido.
> **Date:** 2026-06-30
> **Objective:** Reestructurar el contenido y layout del `Footer` compartido para que coincida con `references/footer.png` (desktop) y `references/mobile.png`: 4 grupos de links (Servicios, Sobre nosotros, Legales, Solicitudes) en 2 columnas visuales, redes con Instagram añadido, y crédito "Diseño y desarrollo por TWNSTUDIOS" enlazado — todo editable desde la colección `global`.

---

## Scope

**In:**

- **Reestructurar los grupos de links** en `src/content/global/index.json` (`footer.columns[]`), reemplazando las 6 columnas actuales (Infraestructura Cloud, Seguridad, Conectividad, Comunicaciones, Sobre nosotros, Legales) por los **4 grupos** de la referencia, en este orden:
  1. **Servicios** (4 items, lista desktop)
  2. **Sobre nosotros** (Nosotros, Blog, Soporte técnico, Contacto)
  3. **Legales** (12 items: Libro de reclamaciones → Formulario de queja)
  4. **Solicitudes** (Cancelación de servicio, Suspensión temporal del servicio)
- **URLs de los links:** las rutas existentes se enlazan real (`/nosotros`, `/blog`, `/soporte-tecnico`, `/contacto`, `/legales/libro-reclamaciones`, `/reclamos/reclamo`, `/reclamos/apelacion`, `/reclamos/queja`); las que **no existen aún** reciben su **URL planificada** (aunque hoy den 404). El detalle exacto va en el Data model.
- **Layout de 2 columnas visuales** en `FooterReact.tsx`: a la derecha del tagline, los 4 grupos se distribuyen en **2 columnas apiladas verticalmente** — columna izq = grupos 1–2 (Servicios + Sobre nosotros), columna der = grupos 3–4 (Legales + Solicitudes) — partiendo el array `columns[]` por la mitad. Editar el orden en el CMS reubica los grupos.
- **Redes sociales:** añadir **Instagram** (`https://www.instagram.com/fiberlux_peru`) a `footer.social[]`, en el orden Facebook → LinkedIn → Instagram → WhatsApp → YouTube. Instagram ya existe en el enum del schema; no se toca `tina/config.ts` por esto.
- **Crédito de agencia (TWNSTUDIOS):** en la barra inferior, cambiar el copyright a `Copyright © {year} Fiberlux. Diseño y desarrollo por` seguido del **wordmark `public/images/logo/twn.svg`** como imagen enlazada a `https://twnstudios.com/?utm_source=fiberlux-corp&utm_medium=referral&utm_campaign=client_portfolio` (`target="_blank"`, `rel="noopener noreferrer"`). Se añaden **dos campos nuevos** al schema `footer` en `tina/config.ts`: `agencyLogo` (imagen, default el svg) y `agencyUrl` (string). Regenerar el cliente Tina.
- **Responsive (mobile):** según `references/mobile.png`, una sola columna que apila **primero los grupos de links** (Servicios, Sobre nosotros, Legales, Solicitudes), **luego** el tagline + redes, y al final el logo FIBERLUX + copyright/crédito.
- **QA visual** contra `references/footer.png` (desktop ~1440px) y `references/mobile.png` con Playwright MCP (screenshots en `.playwright-screens/`).

**Out of scope (para otras specs / pendientes):**

- **Crear las páginas destino que aún no existen** (Política de Cookies/Privacidad/Videovigilancia/SST, Manual y Formulario de derechos ARCO, Guía OSIPTEL, Cancelación/Suspensión de servicio, y las páginas de `/servicios/*`). Esta spec solo pone los **links** con su URL planificada; las páginas se construyen aparte. Los 404 temporales son un estado aceptado y documentado.
- **Rediseñar la barra superior (Header/nav)** ni el menú de servicios de la navegación principal.
- **Discrepancia desktop vs mobile del grupo Servicios:** se usa la lista desktop en ambos breakpoints (el contenido no cambia por breakpoint; solo el layout).
- **Cambiar el patrón de hidratación** del footer (`client:tina`) ni el `Header`, `maintenance`, u otros componentes compartidos.
- **Añadir nuevas plataformas sociales** más allá de Instagram, ni cambiar las URLs de las redes existentes (Facebook/LinkedIn/WhatsApp/YouTube conservan su URL actual, aunque algunas sean placeholder).
- **Animaciones o interacciones** nuevas en el footer.

---

## Data model

No hay estructuras nuevas de negocio; se reusa `footer` de la colección `global`. Los cambios son: **contenido** de `footer.columns[]` + `footer.social[]` + `copyright` en `src/content/global/index.json`, y **dos campos nuevos** en el schema `footer` de `tina/config.ts`. Cada URL se marca ✓ (ruta existe hoy) o ⚠︎ (URL planificada, hoy 404).

### 1. `footer.columns[]` — nuevo contenido (`src/content/global/index.json`)

```jsonc
"columns": [
  {
    "title": "Servicios",
    "links": [
      { "text": "Conectividad empresarial",                  "url": "/servicios/conectividad-empresarial" },  // ⚠︎
      { "text": "Ciberseguridad gestionada",                 "url": "/servicios/ciberseguridad-gestionada" }, // ⚠︎
      { "text": "Data Center, Cloud y Continuidad de Negocio","url": "/servicios/data-center-cloud" },        // ⚠︎
      { "text": "Servicios gestionados",                     "url": "/servicios/servicios-gestionados" }       // ⚠︎
    ]
  },
  {
    "title": "Sobre nosotros",
    "links": [
      { "text": "Nosotros",        "url": "/nosotros" },        // ✓
      { "text": "Blog",            "url": "/blog" },            // ✓
      { "text": "Soporte técnico", "url": "/soporte-tecnico" }, // ✓
      { "text": "Contacto",        "url": "/contacto" }         // ✓
    ]
  },
  {
    "title": "Legales",
    "links": [
      { "text": "Libro de reclamaciones",                     "url": "/legales/libro-reclamaciones" },      // ✓
      { "text": "Tratamiento de datos personales",            "url": "/legales/tratamiento-datos" },        // ⚠︎
      { "text": "Política de Cookies",                        "url": "/legales/politica-cookies" },         // ⚠︎
      { "text": "Política de Privacidad",                     "url": "/legales/politica-privacidad" },      // ⚠︎
      { "text": "Política de videovigilancia",                "url": "/legales/politica-videovigilancia" }, // ⚠︎
      { "text": "Política de SST",                            "url": "/legales/politica-sst" },             // ⚠︎
      { "text": "Manual de derechos ARCO",                    "url": "/legales/derechos-arco" },            // ⚠︎
      { "text": "Formulario de solicitud de derechos ARCO",   "url": "/legales/formulario-derechos-arco" }, // ⚠︎
      { "text": "Guía de presentación de Reclamos de OSIPTEL","url": "/legales/guia-reclamos-osiptel" },    // ⚠︎
      { "text": "Formulario de reclamo",                      "url": "/reclamos/reclamo" },                 // ✓
      { "text": "Formulario de apelación",                    "url": "/reclamos/apelacion" },               // ✓
      { "text": "Formulario de queja",                        "url": "/reclamos/queja" }                    // ✓
    ]
  },
  {
    "title": "Solicitudes",
    "links": [
      { "text": "Cancelación de servicio",          "url": "/solicitudes/cancelacion-servicio" }, // ⚠︎
      { "text": "Suspensión temporal del servicio", "url": "/solicitudes/suspension-temporal" }   // ⚠︎
    ]
  }
]
```

> **Regla de layout (2 columnas visuales):** `FooterReact` parte `columns[]` por la mitad (`ceil(n/2)`): índices `0..k-1` → columna visual izquierda (apilados verticalmente), `k..n-1` → columna visual derecha. Con estos 4 grupos: izq = [Servicios, Sobre nosotros], der = [Legales, Solicitudes]. Reordenar en el CMS reubica los grupos.

### 2. `footer.social[]` — añadir Instagram (`src/content/global/index.json`)

```jsonc
"social": [
  { "platform": "Facebook",  "url": "https://facebook.com/fiberlux" },
  { "platform": "LinkedIn",  "url": "https://linkedin.com/company/fiberlux" },
  { "platform": "Instagram", "url": "https://www.instagram.com/fiberlux_peru" },  // NUEVO
  { "platform": "WhatsApp",  "url": "https://wa.me/51XXXXXXXXX" },
  { "platform": "YouTube",   "url": "https://youtube.com/fiberlux" }
]
```

`iconMap` en `FooterReact.tsx` ya mapea `Instagram → FaInstagram`; no requiere cambio de código.

### 3. `copyright` + crédito de agencia (`src/content/global/index.json`)

```jsonc
"copyright": "Copyright © {year} Fiberlux. Diseño y desarrollo por",
"agencyLogo": "/images/logo/twn.svg",
"agencyUrl": "https://twnstudios.com/?utm_source=fiberlux-corp&utm_medium=referral&utm_campaign=client_portfolio"
```

El componente renderiza: `copyright` (texto, con `{year}` sustituido) + `<a href={agencyUrl}><img src={agencyLogo} …/></a>` inline al final.

### 4. Schema — dos campos nuevos en `footer` (`tina/config.ts`)

Añadir junto a `logo` / `copyright`:

```js
{ name: "agencyLogo", label: "Logo de la agencia (crédito)", type: "image" },
{ name: "agencyUrl",  label: "URL de la agencia (crédito)",  type: "string",
  description: "Enlace del wordmark de crédito en el pie (se abre en pestaña nueva)." },
```

`tagline` y `logo` (FIBERLUX) **no cambian**. Tras editar el schema: regenerar el cliente Tina (`npm run dev`/`build` corre `tinacms build`).

---

## Implementation plan

Todo el trabajo vive en: `tina/config.ts` (2 campos nuevos), `src/content/global/index.json` (contenido del footer) y `src/components/shared/FooterReact.tsx` (layout de 2 columnas + crédito de agencia). Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`).

1. **Añadir `agencyLogo` y `agencyUrl` al schema `footer`** en `tina/config.ts`. Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores y en `/admin` → Global → Footer aparecen los campos "Logo de la agencia (crédito)" y "URL de la agencia (crédito)".

2. **Reemplazar `footer.columns[]`** en `src/content/global/index.json` por los 4 grupos del Data model (Servicios, Sobre nosotros, Legales, Solicitudes) con sus URLs (✓ reales y ⚠︎ planificadas). *Test:* el JSON valida contra el schema (sin warnings de Tina); el footer renderiza los 4 títulos y todos los links con el texto correcto.

3. **Añadir Instagram a `footer.social[]`** en el orden Facebook → LinkedIn → Instagram → WhatsApp → YouTube, con la URL `https://www.instagram.com/fiberlux_peru`. *Test:* el footer muestra el icono de Instagram entre LinkedIn y WhatsApp, enlazando a la URL correcta en pestaña nueva.

4. **Actualizar `copyright` + sembrar `agencyLogo`/`agencyUrl`** en `src/content/global/index.json`. *Test:* los tres valores quedan editables en `/admin` y presentes en el documento.

5. **Layout de 2 columnas visuales en `FooterReact.tsx`.** En vez del `grid-cols-2` auto-flow actual, partir `columns[]` por la mitad (`ceil(n/2)`) y renderizar **dos wrappers en columna** (grupos apilados verticalmente con separación). Mantener `data-tina-field` en `title` y `text`. *Test:* en desktop, columna izq = Servicios encima de Sobre nosotros; columna der = Legales encima de Solicitudes — igual que `references/footer.png`, sin huecos de alineación entre grupos.

6. **Barra inferior — crédito de agencia en `FooterReact.tsx`.** Renderizar `copyrightText` (con `{year}` sustituido) seguido del `<a href={agencyUrl} target="_blank" rel="noopener noreferrer"><img src={agencyLogo} alt="TWNSTUDIOS" …/></a>` inline, con el logo FIBERLUX a la izquierda. Fallbacks: si falta `agencyLogo`/`agencyUrl`, renderizar solo el texto. *Test:* el pie muestra "Copyright © 2026 Fiberlux. Diseño y desarrollo por" + wordmark TWNSTUDIOS; clic abre la URL con UTM en pestaña nueva.

7. **Responsive (mobile).** Ajustar el apilado a `references/mobile.png`: grupos de links → tagline + redes → logo FIBERLUX + copyright/crédito, usando utilidades responsive de Tailwind sin romper el desktop. *Test:* a ~390px se ve una sola columna en el orden de la referencia; crédito y logo no se desbordan.

8. **QA visual desktop + mobile.** Comparar con Playwright MCP contra `references/footer.png` (~1440px) y `references/mobile.png` (~390px), screenshots en `.playwright-screens/`. Ajustar espaciados, tamaño del wordmark TWN y separación entre grupos hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**
- Pasos 1–4 son contenido/schema; 5–7 ajustan layout, crédito y responsive; 8 cierra con QA.
- No se crean páginas destino: los links ⚠︎ apuntan a su URL planificada y pueden dar 404 hasta que exista la página (fuera de alcance).

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] El `footer` muestra exactamente **4 grupos** en orden: **Servicios**, **Sobre nosotros**, **Legales**, **Solicitudes** (ya no aparecen Infraestructura Cloud, Seguridad, Conectividad ni Comunicaciones).
- [ ] El grupo **Servicios** lista los 4 items desktop: Conectividad empresarial, Ciberseguridad gestionada, Data Center Cloud y Continuidad de Negocio, Servicios gestionados.
- [ ] El grupo **Sobre nosotros** lista Nosotros, Blog, Soporte técnico, Contacto — y cada uno navega a `/nosotros`, `/blog`, `/soporte-tecnico`, `/contacto` sin 404.
- [ ] El grupo **Legales** lista los 12 items en el orden de la referencia (Libro de reclamaciones → Formulario de queja).
- [ ] El grupo **Solicitudes** lista Cancelación de servicio y Suspensión temporal del servicio.
- [ ] Los links a **rutas existentes** navegan correctamente: `/legales/libro-reclamaciones`, `/reclamos/reclamo`, `/reclamos/apelacion`, `/reclamos/queja`.
- [ ] Los links a **páginas inexistentes** llevan la **URL planificada** del Data model (ej. Política de Cookies → `/legales/politica-cookies`, Cancelación de servicio → `/solicitudes/cancelacion-servicio`); un 404 temporal en ellos es aceptado y no bloquea.
- [ ] En **desktop (~1440px)** los grupos se distribuyen en **2 columnas visuales**: izquierda = Servicios sobre Sobre nosotros; derecha = Legales sobre Solicitudes — sin huecos de alineación entre grupos, igual que `references/footer.png`.
- [ ] Las **redes sociales** muestran, en orden, Facebook, LinkedIn, **Instagram**, WhatsApp, YouTube; el icono de **Instagram** enlaza a `https://www.instagram.com/fiberlux_peru` en pestaña nueva.
- [ ] La **barra inferior** muestra el logo FIBERLUX a la izquierda y, a la derecha, `Copyright © 2026 Fiberlux. Diseño y desarrollo por` seguido del **wordmark TWNSTUDIOS**.
- [ ] El **wordmark TWNSTUDIOS** es una imagen (`/images/logo/twn.svg`) enlazada a `https://twnstudios.com/?utm_source=fiberlux-corp&utm_medium=referral&utm_campaign=client_portfolio` con `target="_blank"` y `rel="noopener noreferrer"`.
- [ ] En **mobile (~390px)** el footer es una sola columna en el orden de `references/mobile.png`: grupos de links → tagline + redes → logo FIBERLUX + copyright/crédito; nada se desborda.
- [ ] En `/admin` → Global → Footer existen los campos **"Logo de la agencia (crédito)"** (`agencyLogo`) y **"URL de la agencia (crédito)"** (`agencyUrl`), editables.
- [ ] Editar en el CMS un título de grupo, un texto/URL de link, una red social, el copyright o el crédito de agencia se refleja en el footer sin tocar código.
- [ ] Si faltan `agencyLogo` o `agencyUrl`, el pie **no rompe** (renderiza solo el texto de copyright).
- [ ] `tagline` ("Potencia tu conectividad empresarial") y el logo FIBERLUX del pie se conservan sin cambios.
- [ ] No se modificaron Header, `maintenance`, ni otros componentes/páginas fuera de `tina/config.ts`, `src/content/global/index.json` y `FooterReact.tsx`.

---

## Decisiones

- **Sí:** reestructurar a **4 grupos temáticos** (Servicios, Sobre nosotros, Legales, Solicitudes) reemplazando las 6 columnas de servicios actuales. Es lo que muestran ambas referencias; el footer agrupa por intención de navegación, no por catálogo de servicios.
- **No:** conservar las columnas actuales (Infraestructura Cloud / Seguridad / Conectividad / Comunicaciones). No coinciden con la referencia y duplicaban servicios entre sí.
- **Sí:** links sin página aún → **URL planificada** (aunque hoy den 404). Deja el footer definitivo; cuando se cree cada página el link ya apunta bien sin re-editar. *(Elección del usuario.)*
- **No:** placeholder `#` ni omitir esos links. `#` obligaría a re-editar cada uno al crear la página; omitirlos dejaría el footer incompleto frente a la referencia.
- **Sí:** grupo **Servicios** con la **lista desktop** (4 items) en ambos breakpoints. La referencia mobile mostraba otra lista, tratada como iteración vieja del diseño. *(Elección del usuario.)*
- **No:** variar el contenido de Servicios por breakpoint. Duplicaría contenido y divergiría; solo cambia el layout, no los datos.
- **Sí:** layout de **2 columnas visuales** partiendo `columns[]` por la mitad (`ceil(n/2)`), cada mitad apilada verticalmente. Reproduce la referencia (Legales largo a la derecha, Solicitudes debajo) sin huecos de alineación y **sin cambiar el schema** de `columns[]`.
- **No:** un `grid-cols-2` con auto-flow por filas (el actual). Alinearía Sobre nosotros al alto de Legales dejando un hueco enorme.
- **No:** CSS multi-columna (`column-count: 2` con `break-inside: avoid`). El balanceo por altura es impredecible (Legales tiene 12 items) y podría partir mal los grupos.
- **Sí:** **añadir Instagram** sin quitar YouTube; orden Facebook → LinkedIn → Instagram → WhatsApp → YouTube. Instagram ya está en el enum del schema, así que solo es contenido. *(Elección del usuario.)*
- **Sí:** crédito de agencia **editable en el CMS** vía dos campos nuevos (`agencyLogo`, `agencyUrl`), con el wordmark `/images/logo/twn.svg` enlazado a la URL con UTM. Coherente con el patrón CMS-driven; permite cambiar el enlace/logo sin deploy.
- **No:** hardcodear el logo y el link de TWNSTUDIOS en el componente. Rompería el patrón editable y obligaría a deploy para cualquier ajuste del crédito.
- **Sí:** el `copyright` pasa a ser el **texto previo** al wordmark (`…Diseño y desarrollo por`) y el componente **añade** la imagen enlazada. Separa texto editable de un asset con enlace fijo, evitando meter HTML en un campo string.
- **No:** crear en esta spec las páginas destino inexistentes. Es trabajo de otras specs; aquí solo se define la navegación del footer.
- **Sí:** mantener el patrón `client:tina` y no tocar Header/maintenance. El cambio es de contenido + layout del footer.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los links ⚠︎ a **páginas inexistentes** dan **404** hasta que se creen. | Decisión consciente y documentada (URL planificada). El texto y destino ya son definitivos; crear las páginas es trabajo de otras specs. |
| **Slugs planificados** que difieran de los que use quien construya esas páginas → links rotos permanentes. | Elegir slugs siguiendo la convención existente (`/legales/*`, `/reclamos/*`); al crear cada página, confirmar que su ruta coincide con la del footer (o actualizar el JSON, un solo punto). |
| El **layout de 2 columnas** (`ceil(n/2)`) se descuadra si se agregan/quitan grupos. | Regla determinista y documentada; con nº impar la columna izquierda queda más alta, aceptable. Otra distribución se revisa en otra spec. |
| El **wordmark TWNSTUDIOS** puede no contrastar sobre `brand-purple`. | Ajustar en QA visual (alto fijo `h-4`/`h-5`, `brightness-0 invert` si el svg no es blanco) contra `references/footer.png`. |
| El **apilado mobile** invierte el orden; mal uso de `order-*` puede romper el desktop. | Aislar el reordenamiento con utilidades responsive solo bajo el breakpoint móvil; verificar ambos breakpoints en QA. |
| **Staleness de Tailwind JIT:** clases nuevas pueden no aplicarse en dev hasta reiniciar. | Reiniciar el dev server tras cambios de clases; correr `astro build` desde la raíz para validar. |
| Regenerar el **cliente Tina** tras añadir `agencyLogo`/`agencyUrl` podría fallar si el schema queda mal formado. | Añadir los campos siguiendo el patrón de `logo`; validar con `npm run dev` antes de continuar. |
