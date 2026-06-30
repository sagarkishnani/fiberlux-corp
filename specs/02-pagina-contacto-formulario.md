# SPEC 02 — Página de Contacto (Figma) con formulario funcional sobre el motor de formularios dinámicos

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-06-30
> **Objective:** Construir la página `/contacto` de fiberlux-corp según el frame de Figma, con su formulario funcional montado sobre el motor de formularios dinámicos (nuevo `formType: "contacto"`) en una variante visual oscura acorde al tema corp, dejando todo el contenido editable en Tina.

---

## Scope

**In:**

- **Ruta `/contacto`.** Crear `src/pages/contacto/index.astro` que renderiza la página completa (hereda `BaseLayout`, header y footer existentes de corp).
- **Componente de página (patrón dual).** Crear `src/components/contact/Contact.astro` + `ContactReact.tsx` que arman el layout de dos columnas del Figma:
  - **Columna izquierda (informativa):** breadcrumb `Inicio / Contacto`, H1, párrafo introductorio y 3 tarjetas de contacto (Teléfono, Correo, Oficina) con ícono + label + valor.
  - **Columna derecha (formulario):** el `<DynamicForm formSlug="contacto" />` embebido, cuyo H2 "¿Conversamos?" + subtítulo provienen del propio JSON del formulario.
- **Nueva variante oscura del motor de formularios.** Añadir a `DynamicFormReact.tsx` un `styleVariant` nuevo (`"contact-dark"`) que replica los colores corp del Figma (inputs oscuros translúcidos, labels claros, botón gradiente magenta, enlaces brand-purple claros) sin tocar la variante clara `"contact"` existente.
- **Definición del formulario en Tina.** Crear `src/content/dynamic-forms/contacto.json` (colección `dynamicForms`, ya existente) con los campos del Figma: `nombre` (text, half), `apellido` (text, half), `servicio` (select, full, con los 4 servicios del footer como opciones), `empresa` (text, half), `ruc` (text, half), `telefono` (tel, half), `correo` (email, half), `comentario` (textarea, full) y el checkbox de consentimiento (con URL de enlace editable). `styleVariant: "contact-dark"`, `formType: "contacto"`, textos de éxito/error/validación.
- **Entrada en `formConfig`.** Añadir a `src/content/form-config/index.json` el `formType: "contacto"` con `recipients` placeholder editables en Tina.
- **Reestructurar la colección `contact` en `tina/config.ts`** y `src/content/contact/index.json` para cubrir el chrome de la página (breadcrumb, H1, párrafo, las 3 tarjetas con label/valor/ícono), todo editable en `/admin`.
- **Enlace de consentimiento editable** con valor por defecto `/legales/tratamiento-datos`.
- **CSS necesario** en `src/styles/global.css` solo si la variante oscura requiere clases nuevas (sin tocar las existentes).

**Out of scope (para futuras specs):**

- **Crear la página `/legales/tratamiento-datos`.** El enlace del consentimiento apunta a esa ruta (editable), pero la página en sí se construye en otra spec; hasta entonces puede dar 404.
- **Desplegar/instalar `send-email.php`** en el hosting de corp (se asume que existirá; el repo solo apunta a él, igual que en SPEC 01).
- **Cargar la lista final de recipients** de Contacto (se deja placeholder editable en Tina).
- **Mapa embebido, redes sociales u horario de atención** en la página: el frame de Contacto no los incluye, así que no se añaden.
- **Rediseñar header o footer.** Se usan los existentes; el link "Contacto" ya apunta a `/contacto` en `global` (no requiere cambios).
- **Migrar las páginas legales (look claro) al tema oscuro.** Sigue fuera de alcance como en SPEC 01.

---

## Data model

Esta spec **reutiliza el motor de formularios dinámicos de SPEC 01** (colección `dynamicForms`, `submitForm.ts`, `formConfig`). No inventa un formato de formulario nuevo: añade un archivo de formulario, una entrada de config, una variante visual y reestructura la colección `contact`.

### 1. Variante visual oscura (extensión de tipo en `DynamicFormReact.tsx`)

```ts
// Antes:  styleVariant?: "default" | "contact";
// Después:
styleVariant?: "default" | "contact" | "contact-dark";
```

`"contact-dark"` reusa el mismo layout y lógica que `"contact"`, solo cambia el set de clases Tailwind (inputs oscuros translúcidos, labels claros, botón gradiente magenta, enlace brand-purple claro). No se modifican `"default"` ni `"contact"`.

### 2. `src/content/dynamic-forms/contacto.json` (colección `dynamicForms`)

```jsonc
{
  "formId": "contacto",
  "formTitle": "¿Conversamos?",
  "description": "Completa tus datos y te responderemos pronto.",
  "styleVariant": "contact-dark",
  "submitButtonText": "Enviar",
  "successTitle": "¡Mensaje enviado!",
  "successMessage": "Gracias por escribirnos. Un representante te contactará pronto.",
  "errorMessage": "Ocurrió un error al enviar. Inténtalo de nuevo.",
  "validationMessage": "Por favor completa los campos obligatorios.",
  "showCorrelativo": false,
  "privacyText": "¿Nos brinda su consentimiento para el tratamiento de datos personales?",
  "linkText": "tratamiento de datos personales",   // segmento enlazado del consentimiento
  "dataUrl": "/legales/tratamiento-datos",          // editable en Tina (puede 404 hasta otra spec)
  "fields": [
    { "fieldType": "text",     "name": "nombre",     "label": "Nombre",            "placeholder": "Tu nombre",        "required": true,  "width": "half", "order": 1 },
    { "fieldType": "text",     "name": "apellido",   "label": "Apellido",          "placeholder": "Tu apellido",      "required": true,  "width": "half", "order": 2 },
    { "fieldType": "select",   "name": "servicio",   "label": "Servicio de tu interés", "placeholder": "Selecciona un servicio", "required": true, "width": "full", "order": 3,
      "options": [
        { "value": "conectividad-empresarial", "label": "Conectividad empresarial" },
        { "value": "ciberseguridad-gestionada", "label": "Ciberseguridad gestionada" },
        { "value": "datacenter-cloud", "label": "Data Center, Cloud y Continuidad de Negocio" },
        { "value": "servicios-gestionados", "label": "Servicios gestionados" }
      ] },
    { "fieldType": "text",     "name": "empresa",    "label": "Empresa",           "placeholder": "Nombre de la empresa", "required": false, "width": "half", "order": 4 },
    { "fieldType": "text",     "name": "ruc",        "label": "RUC",               "placeholder": "20XXXXXXXXX",      "required": false, "width": "half", "order": 5 },
    { "fieldType": "tel",      "name": "telefono",   "label": "Teléfono / Celular","placeholder": "+51 999 999 999",  "required": true,  "width": "half", "order": 6 },
    { "fieldType": "email",    "name": "correo",     "label": "Correo",            "placeholder": "tu@correo.com",    "required": true,  "width": "half", "order": 7 },
    { "fieldType": "textarea", "name": "comentario", "label": "Cuéntanos",         "placeholder": "Cuéntanos cómo podemos ayudarte...", "required": false, "width": "full", "order": 8, "rows": 4 },
    { "fieldType": "checkbox", "name": "consentimiento", "label": "consentimiento", "required": true, "width": "full", "order": 9 }
  ]
}
```

> Nota: la mecánica exacta del checkbox de consentimiento (campo `checkbox` con texto + enlace) se ajustará al patrón que ya usa la variante `contact` del motor (`privacyText` / `dataUrl` / `linkText`). Si el motor hoy resuelve el consentimiento solo vía esos campos top-level y no como un `field` más, se omite el `field` `consentimiento` y se usa el bloque de privacidad del config. Esto se afina en el paso de implementación, sin cambiar la forma de los datos visibles.

### 3. `src/content/form-config/index.json` — añadir entrada

```jsonc
{
  "formType": "contacto",
  "label": "Formulario de Contacto",
  "enabled": true,
  "recipients": ["placeholder@fiberlux.pe"]   // editable en Tina, igual que los legales
}
```

### 4. Colección `contact` reestructurada (`tina/config.ts` + `src/content/contact/index.json`)

Hoy tiene `title`, `subtitle`, `email`, `phone`, `address`, `buttonText`. Se reestructura para cubrir el chrome del Figma (la definición de campos del form vive en el JSON de `dynamicForms`, no aquí; el H2/subtítulo del form también, decisión de fuente única):

```jsonc
{
  "breadcrumb": "Contacto",
  "heading": "Ingresa tus datos y un representante te contactará pronto",
  "intro": "Estamos listos para ayudarte a transformar tu conectividad. Completa el formulario y nuestro equipo se comunicará contigo en las próximas 24 horas.",
  "cards": [
    { "icon": "phone",    "label": "Teléfono", "value": "(01) 700-1234" },
    { "icon": "email",    "label": "Correo",   "value": "info@fiberlux.com" },
    { "icon": "location", "label": "Oficina",  "value": "Lima, Perú" }
  ]
}
```

Convenciones:

- `icon` es un identificador (`phone` | `email` | `location`) que el componente mapea a un ícono de `react-icons/fa6` (los SVG no se exponen en Tina, igual criterio que SPEC 01).
- El título y subtítulo de la columna del formulario (`¿Conversamos?` / `Completa tus datos...`) NO viven aquí: se leen del `dynamicForms/contacto.json` (`formTitle` / `description`). Fuente única.

### Contrato de envío (sin cambios respecto a SPEC 01)

```
POST {BASE_URL}/send-email.php
  JSON { formType: "contacto", nombre, apellido, servicio, empresa, ruc, telefono, correo, comentario, consentimiento, website }
Respuesta: { success: boolean, error?: string }   // showCorrelativo:false → no se usa correlativo
```

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run dev` / `npm run build`) y es commiteable por sí solo.

1. **Variante oscura en el motor.** En `src/components/dynamic-form/DynamicFormReact.tsx`: ampliar el tipo `styleVariant` a `"default" | "contact" | "contact-dark"` y añadir el set de clases Tailwind oscuras (inputs translúcidos sobre fondo oscuro, labels claros, botón gradiente magenta, enlace de consentimiento brand-purple claro). `"contact-dark"` reusa la misma rama de render que `"contact"`, solo intercambia las clases. _Test: los formularios legales existentes (`default`/`contact`) se ven y compilan igual; `tsc`/dev sin errores._

2. **Reestructurar colección `contact` en Tina.** En `tina/config.ts` reemplazar los campos actuales de `contact` por: `breadcrumb`, `heading`, `intro`, `cards[]` (`icon`, `label`, `value`). Sembrar `src/content/contact/index.json` con los valores del Figma. Regenerar cliente Tina. _Test: `/admin` → "Contacto" muestra los nuevos campos editables; el JSON valida contra el schema._

3. **Definir el formulario + config.** Crear `src/content/dynamic-forms/contacto.json` (campos del Figma, `styleVariant: "contact-dark"`, `formType: "contacto"`, `formTitle: "¿Conversamos?"`, `description`, opciones del select = 4 servicios, consentimiento con `dataUrl` editable). Añadir la entrada `contacto` a `src/content/form-config/index.json` (recipients placeholder). _Test: `/form-config.json` incluye `formType: "contacto"`; `/admin` → "Formularios Dinámicos" lista "contacto" y es editable._

4. **Componente de página (patrón dual).** Crear `src/components/contact/Contact.astro` (carga `contact` vía `client` de Tina y pasa `{query, variables, data}`) y `ContactReact.tsx` (envuelve en `useTina`, arma las 2 columnas: izquierda = breadcrumb + H1 + intro + 3 tarjetas con `tinaField`; derecha = `<DynamicForm formSlug="contacto" />`). Mapear `icon` → `react-icons/fa6` (`FaPhone`, `FaEnvelope`, `FaLocationDot`). _Test: el componente compila; aún no enlazado a una ruta._

5. **Ruta `/contacto`.** Crear `src/pages/contacto/index.astro` usando `BaseLayout` + `<Contact />`. _Test: `/contacto` carga con las dos columnas y el formulario oscuro renderiza; el link "Contacto" del header y footer (ya apuntan a `/contacto`) navega sin 404._

6. **Ajuste fino visual contra el Figma.** Comparar `/contacto` con el frame: fondo gradiente del hero, tarjetas con borde/overlay translúcido, anchos de columna (≈560 / ≈500), grid de inputs half/half, botón gradiente. Ajustar `ContactReact.tsx` y, si hace falta, añadir clases a `src/styles/global.css` (sin tocar las existentes). _Test: la página coincide visualmente con el screenshot del Figma en desktop._

7. **Envío y verificación final.** Verificar en Network que al enviar se hace `POST {BASE_URL}/send-email.php` con `formType: "contacto"` y los campos (aunque el PHP no exista aún). Regenerar cliente Tina y correr `npm run build`. _Test: build de producción sin errores; `/contacto` generada; POST observable en Network con el payload correcto._

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings de imports rotos.
- [ ] La ruta `/contacto` carga y renderiza las dos columnas del Figma (izquierda informativa + derecha formulario).
- [ ] La columna izquierda muestra: breadcrumb `Inicio / Contacto`, el H1, el párrafo intro y las 3 tarjetas (Teléfono `(01) 700-1234`, Correo `info@fiberlux.com`, Oficina `Lima, Perú`) con su ícono.
- [ ] La columna derecha muestra el H2 "¿Conversamos?" y su subtítulo provenientes del `dynamicForms/contacto.json` (fuente única), no de la colección `contact`.
- [ ] El formulario muestra los campos en el orden y disposición del Figma: Nombre + Apellido (mitad/mitad), Servicio de tu interés (select, full), Empresa + RUC (mitad/mitad), Teléfono/Celular + Correo (mitad/mitad), Cuéntanos (textarea, full), checkbox de consentimiento y botón "Enviar".
- [ ] El select "Servicio de tu interés" lista exactamente las 4 opciones: Conectividad empresarial, Ciberseguridad gestionada, Data Center/Cloud y Continuidad de Negocio, Servicios gestionados.
- [ ] El formulario se renderiza con el **look oscuro corp** (`styleVariant: "contact-dark"`) y coincide visualmente con el frame de Figma en desktop.
- [ ] Las páginas legales existentes (`/legales/libro-reclamaciones`, `/reclamos/*`) siguen renderizando con su look claro sin cambios (variantes `default`/`contact` intactas).
- [ ] El checkbox de consentimiento es obligatorio: con la casilla sin marcar, el formulario no se envía y muestra el mensaje de validación.
- [ ] El segmento "tratamiento de datos personales" del consentimiento es un enlace que apunta a la URL configurada (`/legales/tratamiento-datos` por defecto) y esa URL es editable desde Tina.
- [ ] `/form-config.json` responde un JSON que incluye `formType: "contacto"` con su `enabled` y `recipients` placeholder.
- [ ] Al enviar el formulario con los campos válidos, se hace `POST` a `{BASE_URL}/send-email.php` con `formType: "contacto"` y los nombres de campo definidos (verificable en la pestaña Network, aunque el PHP no exista todavía).
- [ ] En `/admin`, editar el `heading`, el `intro` o el `value` de una tarjeta en la colección "Contacto" y guardar cambia el contenido renderizado en `/contacto`.
- [ ] En `/admin`, editar una opción del select o un label en el formulario "contacto" (colección Formularios Dinámicos) y guardar se refleja en `/contacto`.
- [ ] El link "Contacto" del header y del footer navega a `/contacto` sin 404.

---

## Decisiones

- **Sí:** reusar el motor de formularios dinámicos de SPEC 01 con un nuevo `formType: "contacto"`. Evita duplicar lógica de validación/envío y mantiene Contacto editable en Tina como los legales.
- **No:** construir un componente de formulario a medida para Contacto. Habría duplicado el envío (`submitForm.ts`) y sacado los campos del control de Tina.
- **Sí:** añadir una variante visual nueva `"contact-dark"` al motor en vez de reestilar la variante `"contact"` existente. Los legales usan `"contact"` con look claro y no deben cambiar; una variante aparte aísla el riesgo.
- **No:** migrar el look de los legales al tema oscuro ni unificar variantes. Fuera de alcance (sigue la decisión de SPEC 01); tocar `"contact"` arriesgaba regresiones en `/reclamos` y libro de reclamaciones.
- **Sí:** fuente única para el título/subtítulo de la columna del formulario, leídos de `dynamicForms/contacto.json` (`formTitle`/`description`). Evita duplicar el mismo texto en dos colecciones y el riesgo de que queden desincronizados.
- **No:** duplicar `formSectionTitle`/`formSectionSubtitle` en la colección `contact`. Era una segunda fuente de verdad para el mismo texto.
- **Sí:** reestructurar la colección `contact` (de `title/subtitle/email/phone/address/buttonText` a `breadcrumb/heading/intro/cards[]`). El contenido viejo nunca se renderizó (la página no existía), así que no hay datos en producción que migrar.
- **Sí:** modelar las 3 tarjetas como una lista `cards[]` con `icon` (identificador) + `label` + `value`. Permite editar textos en Tina sin exponer SVGs, igual criterio que SPEC 01.
- **No:** exponer los íconos de las tarjetas como assets editables en Tina. Se mapean por identificador (`phone`/`email`/`location`) a `react-icons/fa6`; lo decorativo se queda en código.
- **Sí:** opciones del select sembradas con los 4 servicios del footer, editables en Tina. Es la lista canónica de servicios del sitio y queda mantenible sin tocar código.
- **Sí:** URL del enlace de consentimiento editable en Tina con valor por defecto `/legales/tratamiento-datos`. No bloquea esta spec aunque esa página aún no exista; se ajusta cuando se cree.
- **No:** crear `/legales/tratamiento-datos` en esta spec. Es una página legal independiente; va en su propia spec. El enlace puede dar 404 temporalmente.
- **Sí:** recipients de Contacto como placeholder editable en `formConfig` (`formType: "contacto"`). No hay aún correo destino definido y evita hardcodear datos sensibles.
- **No:** reusar los recipients de los formularios legales. Contacto comercial y reclamos OSIPTEL van a casillas distintas; mezclarlos provocaría envíos equivocados.
- **Sí:** no tocar la navegación. El link "Contacto" ya apunta a `/contacto` en la colección `global` (header y footer); solo faltaba construir la página.
- **Sí:** `showCorrelativo: false` para Contacto. Un formulario comercial no genera número correlativo legal como el libro de reclamaciones.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Añadir la variante `"contact-dark"` toca `DynamicFormReact.tsx`, compartido con los legales → regresión visual en `/reclamos/*` y libro de reclamaciones. | `"contact-dark"` reusa la rama de render de `"contact"` y solo intercambia el set de clases; no se modifican las clases de `default`/`contact`. Criterio de aceptación exige que los legales sigan idénticos. |
| `send-email.php` no existe aún en el hosting de corp → el formulario falla al enviar en producción. | El frontend queda listo y verificable (POST en Network). Es dependencia de infraestructura heredada de SPEC 01; el deploy del PHP es prerrequisito antes de publicar. |
| El backend PHP espera ciertos nombres de campo / `formType` y no reconoce `contacto` → el correo no se arma bien. | El contrato (`formType` + nombres de campo) queda explícito en el data model; debe coordinarse con quien configure `send-email.php` para que acepte `formType: "contacto"`. |
| Recipients placeholder se publican por error → los mensajes de Contacto no llegan a nadie. | Criterio de aceptación recuerda que son placeholders; configurar la lista real en Tina antes de exponer la página. |
| El enlace de consentimiento apunta a `/legales/tratamiento-datos`, que aún no existe → 404 al hacer clic. | Decisión consciente y registrada; la URL es editable en Tina y la página se crea en otra spec. Mientras tanto puede apuntarse a un PDF si se requiere antes. |
| Reestructurar la colección `contact` rompe el cliente Tina generado o el `/admin` si quedan referencias a campos viejos (`email`, `phone`...). | Regenerar el cliente con `tinacms build` tras el cambio de schema y sembrar el JSON con la nueva forma; ningún componente referenciaba los campos viejos (la página no existía). |
| El consentimiento como checkbox con texto + enlace puede no encajar 1:1 con cómo el motor resuelve hoy la privacidad (`privacyText`/`dataUrl` top-level). | El paso 1 y 3 afinan la mecánica contra el patrón ya usado en la variante `contact`; el data model deja la nota de que se usa el bloque de privacidad del config si el motor no lo trata como `field`. |
| El look oscuro del Figma usa fondo gradiente y overlays translúcidos difíciles de clonar con Tailwind → desajuste visual. | Paso 6 dedicado al ajuste fino contra el screenshot; clases nuevas se aíslan en `global.css` sin tocar las existentes. |

---

## Lo que **no** está en esta spec

- Crear la página `/legales/tratamiento-datos` (solo se enlaza a ella, con URL editable).
- Desplegar/instalar el backend `send-email.php`.
- Cargar la lista final de recipients de Contacto (quedan placeholders editables).
- Mapa embebido, redes sociales u horario de atención (no están en el frame).
- Migrar las páginas legales (look claro) al tema oscuro de corp.
- Rediseñar header o footer.

Cada uno, si se aborda, irá en su propia spec.
