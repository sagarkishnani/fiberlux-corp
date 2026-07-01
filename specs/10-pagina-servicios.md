# SPEC 10 — Página "Servicios" (`/servicios`)

> **Estado:** Implementado
> **Depende de:** SPEC 08 (reusa `StickyCards` / colección `home`). Reutiliza el patrón de página dual + hero oscuro de SPEC 06 y el motor de formularios dinámicos (`DynamicForm` → `send-email.php`).
> **Fecha:** 2026-06-30
> **Objetivo:** Construir la ruta `/servicios` según el frame desktop de Figma (hero oscuro sin 3D, sección "Nuestras soluciones" reusando `StickyCards`, y un formulario "Déjanos tus datos y te contactaremos"), todo editable desde TinaCMS.

---

## Alcance

**Dentro:**

- **Ruta `/servicios`.** Crear `src/pages/servicios/index.astro` que hereda `BaseLayout` (Header + Footer + maintenance + Lenis existentes) y compone la página. El nav del header ya apunta a `/servicios` (existe en `global`), así que esto activa ese enlace sin 404.
- **Hero (patrón dual)** `src/components/servicios/HeroServicios.astro` + `HeroServiciosReact.tsx`, tema oscuro corp:
  - Columna izquierda: breadcrumb `Inicio / Servicios`, H1 "Conoce nuestros servicios", párrafo intro y botón "Contactar" (ancla al formulario de esta misma página). Todo editable (`data-tina-field`).
  - Columna derecha: **espacio reservado del grid, vacío** — sin escena 3D ni placeholder visual (igual que el hero de `/soporte-tecnico`).
- **Sección "Nuestras soluciones":** montar el componente compartido **`StickyCards`** (alimentado por la query `home`, misma fuente que el Home y `/soporte-tecnico`). Sin duplicar contenido.
- **Sección "Déjanos tus datos y te contactaremos":** fondo oscuro con gradiente morado (según Figma). Renderiza un **nuevo formulario dinámico `servicios`** mediante `DynamicForm.astro` (`formSlug="servicios"`) → `DynamicFormReact.tsx`, con los campos del Figma (ver Modelo de datos), botón "Contactar", envío a `send-email.php`.
- **Nuevo `dynamicForms/servicios.json`** + entrada en `formConfig` (`src/content/form-config/index.json` y colección `formConfig` en `tina/config.ts`) con `formType: "servicios"`, `label`, `enabled` y `recipients[]`.
- **Nueva colección `servicios`** en `tina/config.ts` + `src/content/servicios/index.json`: documento único editable con el contenido del hero (breadcrumb, H1, intro, texto del botón) y los títulos de las secciones (título de "Nuestras soluciones" opcional, título/subtítulo del bloque de formulario).
- **QA visual** contra `references/servicios-desktop.png` (desktop ~1440px) con Playwright MCP (screenshots en `.playwright-screens/`). En mobile se apila el layout desktop en una columna.

**Fuera de alcance (para futuras specs):**

- **Visual 3D del hero (PENDIENTE).** La columna derecha queda vacía; el modelo 3D (Spline o three.js) se decide e integra en otra spec, como en `/soporte-tecnico`.
- **El frame mobile viejo de Figma** (5 cards antiguas + sección "Empresas que confían en nuestra red"). Se descarta por estar desincronizado con el rediseño del spec 08; el mobile de esta página es el desktop apilado.
- **Las subpáginas de servicios** (`/servicios/conectividad-empresarial`, etc. y sus sub-servicios del nav). Son rutas aparte; esta spec solo hace la landing `/servicios`.
- **Editar el contenido de "Nuestras soluciones" desde la colección `servicios`:** se reusa tal cual desde `home`; cambiar esos textos se hace donde ya viven hoy.
- **Rediseñar Header / Footer / maintenance** o el tema de otras páginas.
- **Sección de testimonios** en esta página (el desktop no la incluye).

---

## Modelo de datos

Esta spec introduce **dos piezas de contenido nuevas** (colección `servicios` + formulario `servicios`) y **una entrada** en `formConfig`. La sección "Nuestras soluciones" **no** se modela aquí: reusa el objeto `home.services` existente (SPEC 08).

### 1. Colección `servicios` en `tina/config.ts` (documento único)

Patrón de `contact` / `soporteTecnico` (`create/delete: false`). Solo contenido del hero y encabezados de sección; el formulario y las soluciones viven en sus propias colecciones.

```js
{
  name: "servicios",
  label: "Servicios (página)",
  path: "src/content/servicios",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    // ── Hero ──
    { name: "breadcrumb", label: "Breadcrumb", type: "string" },        // "Servicios"
    { name: "heading",    label: "Título (H1)", type: "string" },        // "Conoce nuestros servicios"
    { name: "intro",      label: "Párrafo intro", type: "string", ui: { component: "textarea" } },
    { name: "ctaLabel",   label: "Texto del botón hero", type: "string" }, // "Contactar"

    // ── Encabezado del bloque de formulario ──
    { name: "formTitle",    label: "Título del bloque de formulario", type: "string" },    // "Déjanos tus datos y te contactaremos"
    { name: "formSubtitle", label: "Subtítulo del bloque de formulario", type: "string", ui: { component: "textarea" } },
  ],
}
```

### 2. Contenido sembrado `src/content/servicios/index.json`

```json
{
  "breadcrumb": "Servicios",
  "heading": "Conoce nuestros servicios",
  "intro": "Soluciones tecnológicas diseñadas para conectar, proteger y escalar tu operación. Respaldadas por nuestra red privada 100% fibra óptica.",
  "ctaLabel": "Contactar",
  "formTitle": "Déjanos tus datos y te contactaremos",
  "formSubtitle": "Nuestro equipo comercial se pondrá en contacto contigo para diseñar la solución ideal para tu empresa."
}
```

### 3. Nuevo formulario `src/content/dynamic-forms/servicios.json`

Misma forma que `contacto.json` (motor `DynamicForm`), con los campos y orden del Figma desktop. Fondo/estilo oscuro (`styleVariant: "contact-dark"`), botón "Contactar", **sin** el campo "Cuéntanos".

```jsonc
{
  "formId": "servicios",
  "formTitle": "Déjanos tus datos y te contactaremos",
  "description": "Nuestro equipo comercial se pondrá en contacto contigo para diseñar la solución ideal para tu empresa.",
  "styleVariant": "contact-dark",
  "submitButtonText": "Contactar",
  "successTitle": "¡Datos enviados!",
  "successMessage": "Gracias. Nuestro equipo comercial te contactará pronto.",
  "errorMessage": "Ocurrió un error al enviar. Inténtalo de nuevo.",
  "validationMessage": "Por favor completa los campos obligatorios.",
  "showCorrelativo": false,
  "fields": [
    { "fieldType": "text",   "name": "empresa",   "label": "Empresa",   "placeholder": "Empresa",   "required": true,  "width": "half", "order": 1 },
    { "fieldType": "text",   "name": "ruc",       "label": "RUC",       "placeholder": "RUC",       "required": false, "width": "half", "order": 2 },
    { "fieldType": "text",   "name": "nombre",    "label": "Nombre",    "placeholder": "Nombre",    "required": true,  "width": "half", "order": 3 },
    { "fieldType": "text",   "name": "apellidos", "label": "Apellidos", "placeholder": "Apellidos", "required": true,  "width": "half", "order": 4 },
    {
      "fieldType": "select", "name": "servicio", "label": "Servicio de interés",
      "placeholder": "Servicio de interés", "required": true, "width": "full", "order": 5,
      "options": [
        { "value": "conectividad-empresarial", "label": "Conectividad empresarial" },
        { "value": "ciberseguridad-gestionada", "label": "Ciberseguridad gestionada" },
        { "value": "datacenter-cloud", "label": "Data Center, Cloud y Continuidad de Negocio" },
        { "value": "servicios-gestionados", "label": "Servicios gestionados" }
      ]
    },
    { "fieldType": "tel",   "name": "telefono", "label": "Teléfono / Celular", "placeholder": "Teléfono / Celular", "required": true, "width": "half", "order": 6 },
    { "fieldType": "email", "name": "correo",   "label": "Correo",             "placeholder": "Correo",             "required": true, "width": "half", "order": 7 },
    {
      "fieldType": "checkbox", "name": "consentimiento",
      "label": "¿Nos brinda su consentimiento para el tratamiento de datos personales?",
      "required": true, "width": "full", "order": 8,
      "linkText": "tratamiento de datos personales", "linkUrl": "/legales/tratamiento-datos"
    }
  ]
}
```

### 4. Entrada en `formConfig` (`src/content/form-config/index.json`)

Se añade el mapa recipient/enabled que lee el backend PHP, siguiendo la forma de las entradas existentes:

```jsonc
{
  "formType": "servicios",
  "label": "Servicios — Déjanos tus datos",
  "enabled": true,
  "recipients": ["ventas@fiberlux.pe"]   // placeholder, editable en el CMS
}
```

### 5. Sin datos nuevos para "Nuestras soluciones"

La sección reusa `home.services` (título "Nuestras soluciones" + los 4 items del SPEC 08). Este spec **no** modifica ese contenido ni su schema.

---

## Plan de implementación

> Todo el trabajo vive en: nueva colección `servicios` (`tina/config.ts` + `src/content/servicios/index.json`), nuevo formulario (`src/content/dynamic-forms/servicios.json` + entrada en `form-config`), nuevos componentes en `src/components/servicios/`, y la página `src/pages/servicios/index.astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `servicios` en `tina/config.ts`** (documento único, `create/delete: false`) con los campos del Modelo de datos (hero + encabezados de formulario). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores y en `/admin` aparece la colección **Servicios (página)** con todos los campos editables.

2. **Sembrar `src/content/servicios/index.json`** con el contenido del Figma (hero + títulos de formulario). *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Crear el formulario dinámico** `src/content/dynamic-forms/servicios.json` (campos, orden y estilo del Modelo de datos) y añadir la entrada `servicios` en `src/content/form-config/index.json` (y su opción en la colección `formConfig` de `tina/config.ts` si el `formType` es un enum). *Test:* `/form-config.json` incluye la entrada `servicios`; no hay warnings de Tina.

4. **Hero (patrón dual).** Crear `src/components/servicios/HeroServicios.astro` (resuelve `servicios` vía `client` y pasa `{query, variables, data}`) + `HeroServiciosReact.tsx` (envuelve en `useTina`; render de breadcrumb + H1 + intro + botón "Contactar" con `data-tina-field`; **columna derecha vacía** con el espacio reservado del grid). *Test:* el componente compila; aún no enlazado a una ruta.

5. **Ruta `/servicios`.** Crear `src/pages/servicios/index.astro` con `BaseLayout` + `<HeroServicios />`. *Test:* `/servicios` carga con el hero oscuro (breadcrumb, H1, intro, botón) y la zona derecha vacía; el enlace "Servicios" del header ya no da 404.

6. **Montar "Nuestras soluciones" (reuso `StickyCards`).** Insertar `<StickyCards />` (compartido, query `home`) debajo del hero. *Test:* aparecen las 4 cards de "Nuestras soluciones", idénticas al Home, con su sticky-stacking en desktop.

7. **Montar el bloque de formulario.** Insertar la sección "Déjanos tus datos y te contactaremos" (fondo oscuro con gradiente morado, título/subtítulo desde la colección `servicios`) con `<DynamicForm formSlug="servicios" />` debajo de las soluciones. El botón "Contactar" del hero ancla a esta sección (`id` de anclaje). *Test:* el formulario se renderiza con los campos del Figma; enviar dispara `POST` a `send-email.php`; el ancla del hero baja a la sección.

8. **QA visual desktop + mobile.** Comparar contra `references/servicios-desktop.png` (~1440px) con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar hero (espaciados, zona 3D vacía), sección de soluciones, y el bloque de formulario (grid de 2 columnas de los campos, gradiente, botón) y el responsive apilado hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en desktop y mobile.

**Notas del plan:**

- Pasos 1–3 dejan el contenido y el motor de formulario listos; 4–5 construyen la página con el hero; 6–7 ensamblan las secciones reusadas/nuevas.
- El visual 3D del hero queda **pendiente** (otra spec); el paso 4 solo reserva el espacio.
- La verificación visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] La ruta `/servicios` carga y renderiza, en orden: **hero**, **"Nuestras soluciones"**, **bloque de formulario "Déjanos tus datos y te contactaremos"**, y el **Footer** existente.
- [ ] El enlace **"Servicios"** del header navega a `/servicios` sin 404.
- [ ] El hero muestra breadcrumb `Inicio / Servicios`, el H1 "Conoce nuestros servicios", el párrafo intro y el botón "Contactar"; la **columna derecha está vacía** (espacio reservado, sin 3D ni placeholder visual).
- [ ] El botón "Contactar" del hero **ancla** al bloque de formulario de la misma página.
- [ ] En `/admin` existe la colección **Servicios (página)** con el contenido editable del hero (breadcrumb, H1, intro, texto del botón) y los títulos del bloque de formulario.
- [ ] Editar en el CMS el H1, el intro, el texto del botón o los títulos del formulario se refleja en la página sin tocar código.
- [ ] La sección "Nuestras soluciones" se renderiza reusando **`StickyCards`** (mismo contenido que el Home), con las **4 cards** y su sticky-stacking en desktop.
- [ ] El bloque de formulario muestra el título "Déjanos tus datos y te contactaremos", el subtítulo, y los campos del Figma en este orden: **Empresa · RUC · Nombre · Apellidos · Servicio de interés (select) · Teléfono / Celular · Correo · consentimiento**, con el botón **"Contactar"**.
- [ ] El formulario **no** incluye el campo "Cuéntanos".
- [ ] En desktop los campos se disponen en **grid de 2 columnas** (Empresa|RUC, Nombre|Apellidos, Teléfono|Correo) y el Servicio y el consentimiento ocupan el ancho completo.
- [ ] Enviar el formulario dispara un `POST` a **`send-email.php`** con `formType: "servicios"`; con campos requeridos vacíos muestra el mensaje de validación y no envía.
- [ ] `/form-config.json` incluye la entrada **`servicios`** (`enabled`, `recipients`).
- [ ] El checkbox de consentimiento enlaza a `/legales/tratamiento-datos` y es requerido.
- [ ] En **desktop (~1440px)** el layout coincide con `references/servicios-desktop.png`.
- [ ] En **mobile** el layout es el desktop **apilado en una columna** (hero, soluciones, formulario), sin el frame viejo (5 cards / testimonios).
- [ ] No se modificaron `StickyCards`, `DynamicForm`, Header, Footer ni otras páginas (salvo añadir la entrada `servicios` en `form-config`).

---

## Decisiones

- **Sí:** seguir el **frame desktop** de Figma como fuente de verdad (hero + "Nuestras soluciones" + formulario). Coincide con el rediseño del SPEC 08 y el home actual; el editor lo eligió.
- **No:** seguir el **frame mobile viejo** (5 cards antiguas + testimonios "Empresas que confían en nuestra red"). Está desincronizado con el SPEC 08; usarlo obligaría a revertir contenido ya rediseñado. El mobile de esta página es el desktop apilado.
- **Sí:** reusar el componente compartido **`StickyCards`** (query `home`) para "Nuestras soluciones". Una sola fuente de contenido evita duplicar y desincronizar con Home y `/soporte-tecnico`.
- **No:** contenido de soluciones propio de la página `servicios`. Habría dos fuentes para el mismo contenido y riesgo de divergencia; si en el futuro deben diferir, irá en otra spec.
- **Sí:** **nuevo formulario dinámico `servicios`** (`dynamicForms/servicios.json` + entrada en `formConfig`). El Figma tiene título ("Déjanos tus datos y te contactaremos"), botón ("Contactar") y campos distintos al form `contacto`; un form propio los captura sin ensuciar el de contacto.
- **No:** reusar el form `contacto` tal cual. Incluye "Cuéntanos" y usa título/botón distintos; forzarlo desviaría del Figma y acoplaría dos páginas a un mismo form.
- **Sí:** reusar el **motor `DynamicForm` / `DynamicFormReact`** y el backend `send-email.php`. Es el patrón CMS-driven del proyecto; el editor ajusta campos y destinatarios sin tocar código.
- **Sí:** **columna derecha del hero vacía** (espacio reservado), sin 3D. El usuario lo pidió explícitamente ("por ahora no incluyas el modelo 3D") y la tecnología 3D podría cambiar; un placeholder específico sería trabajo a desechar. Mismo criterio que `/soporte-tecnico` (SPEC 06).
- **No:** integrar el visual 3D (Spline o three.js) en esta spec. Se difiere a una spec propia para no acoplar la decisión de tecnología.
- **Sí:** **nueva colección `servicios`** (documento único, `create/delete: false`) para el hero y los títulos del formulario. Patrón de `contact` / `soporteTecnico`; el editor cambia textos sin deploy.
- **No:** hardcodear el texto del hero en el componente. Rompe el patrón CMS-driven del proyecto y obliga a deploy por cada ajuste de copy.
- **Sí:** **botón "Contactar" del hero ancla al formulario** de la misma página (no navega a `/contacto`). El Figma muestra el formulario en la propia página de servicios; el ancla mantiene al usuario en el mismo flujo.
- **Sí:** componentes nuevos bajo `src/components/servicios/` con el **patrón dual** (`.astro` + `React.tsx`) para el hero, como el resto del proyecto.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Reusar **`StickyCards`** (query `home`) acopla `/servicios` al contenido del Home: editar soluciones en Home cambia ambas (y también `/soporte-tecnico`). | Es una decisión consciente (fuente única). Queda registrada; si deben divergir, se separa en otra spec. |
| Reusar `StickyCards` arrastra su **sticky-stacking** (`position: sticky`), que podría chocar con el orden de secciones o con un ancestro `overflow: hidden` de esta página. | Montar la sección en su propio bloque como en el Home; mantener el contenedor sin `overflow` que corte el sticky; QA del comportamiento sticky en `/servicios` igual que en `/`. |
| El `POST` a **`send-email.php`** falla si el backend no reconoce el nuevo `formType: "servicios"` (recipients no configurados en el server). | Añadir la entrada `servicios` en `form-config` (recipients placeholder editables); documentar que el editor debe fijar el destinatario real antes de producción. |
| La **columna derecha vacía** del hero deja un hueco visual raro hasta que llegue el 3D. | Reservar el espacio del grid con el layout del Figma; aceptable como estado intermedio documentado (visual 3D pendiente), igual que `/soporte-tecnico`. |
| El **frame mobile viejo** de Figma puede inducir a maquetar 5 cards + testimonios por error durante la implementación. | El alcance y las decisiones descartan explícitamente ese frame; el mobile es el desktop apilado. QA mobile contra el desktop apilado, no contra `servicios-mobile.png`. |
| Nuevas clases Tailwind (gradiente del bloque de formulario) pueden fallar en dev por staleness del JIT. | Usar tokens/clases existentes de `global.css` o estilos inline; reiniciar el dev server si una clase nueva no aplica (memoria del proyecto). |
| El botón "Contactar" ancla a un `id` que podría colisionar o quedar tapado por el header sticky. | Usar un `id` único (p. ej. `#contacto-servicios`) con `scroll-margin-top` suficiente para no quedar bajo el header. |

---

## Qué **NO** entra en este spec

- El visual 3D del hero (columna derecha vacía; va en otra spec).
- El frame mobile viejo (5 cards antiguas + testimonios "Empresas que confían en nuestra red").
- Las subpáginas de servicios (`/servicios/conectividad-empresarial` y sus sub-servicios del nav).
- Editar el contenido de "Nuestras soluciones" desde la colección `servicios` (se reusa desde `home`).
- Rediseñar Header / Footer / maintenance o el tema de otras páginas.

Cada uno de estos, si aterriza, va en su propio spec.
