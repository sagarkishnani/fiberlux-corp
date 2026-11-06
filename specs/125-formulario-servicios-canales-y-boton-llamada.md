# SPEC 125 — Formulario de soluciones como el prototipo, canales de Soporte editables y botón flotante de llamada

> **Estado:** Borrador
> **Depende de:** SPEC 120, SPEC 124
> **Fecha:** 2026-11-06
> **Objetivo:** Dejar el formulario de soluciones con los campos y el orden del prototipo (incluye Sede y Cuéntanos), confirmar que los canales de Soporte se agregan y eliminan desde Tina, y sumar un botón flotante de llamada configurable junto al de WhatsApp.

---

## Por qué existe este spec

| Obs | Origen | Pedido |
|---|---|---|
| 79 | PDF 14 | El formulario no tiene todos los campos del prototipo ("Antes" vs "Después"). |
| 81 | PDF 16 | La sección "Contáctate por WhatsApp / llamada / correo" debe ser editable, con posibilidad de agregar y eliminar. |
| 95 | Mobile 9 | Botón de llamada arriba o al costado del de WhatsApp (donde sea mejor para la UX), con opción de ocultar uno u otro, o mostrar ambos, desde el CMS. |

Estado actual (staging):

- **Formulario de soluciones** (`src/content/dynamic-forms/servicios.json`, usado en categorías, Cyberguard, `/soluciones` y subservicios vía `ServiceFormCard.tsx`). Orden: Empresa, RUC, Nombre, Apellidos, Servicio de interés, Teléfono, Correo, consentimientos. No tiene **Sede** ni **Cuéntanos**.
- **Prototipo:** Nombre*, Apellido*, Servicio de tu interés*, Sede*, Empresa*, RUC*, Teléfono / Celular*, Correo*, Cuéntanos (opcional).
- **Backend:** `public/send-email.php` L378 arma el correo de `servicios` con una lista **fija** de campos, así que los campos nuevos no llegarían al correo sin tocar el PHP.
- **Canales de Soporte** (`src/components/soporte/SoporteV2React.tsx`): ya es una lista en Tina (`soporteTecnico.channels[]`, con `rows[]`). El componente pinta lo que haya en la lista. Falta comprobar en el editor por qué el cliente no logra agregar o eliminar.
- **WhatsApp flotante** (`src/components/shared/WhatsAppButton.tsx`, montado en `BaseLayout.astro` L397–404): configurado en `global.whatsapp`, sin switch para ocultarlo. No existe un botón de llamada.

---

## Scope

**Incluye:**

- **Formulario de soluciones (79)**, solo `servicios.json` (`/contacto` no se toca):
  - Orden y labels del prototipo: Nombre (`nombre`), Apellido (`apellidos`, label en singular), Servicio de tu interés (`servicio`), **Sede** (`sede`, select, nuevo, requerido), Empresa (`empresa`), RUC (`ruc`), Teléfono / Celular (`telefono`), Correo (`correo`), **Cuéntanos** (`comentario`, textarea, nuevo, opcional), consentimientos sin cambios.
  - Anchos: pares a media columna (Nombre|Apellido, Empresa|RUC, Teléfono|Correo); Servicio, Sede y Cuéntanos a ancho completo.
  - Placeholders del prototipo: "Tu nombre", "Tu apellido", "Selecciona un servicio", "Selecciona una sede", "Nombre de la empresa", "20123456789", "987654321", "tu@correo.com", "Cuéntanos cómo podemos ayudarte…". Con `_en`.
  - `send-email.php` (caso `servicios`) suma **Sede** y **Mensaje** al correo, y `panel-leads.php` los muestra si lista columnas por formulario.
- **Canales de Soporte (81).**
  - Verificar en Tina local que se puede agregar, eliminar y reordenar un canal y una fila, y que el sitio lo refleja.
  - Corregir lo que falle (por ejemplo `itemProps` sin label, un `type` sin opción por defecto, o un canal sin filas que deja un tab vacío).
  - Un canal sin filas no se pinta.
- **Botón flotante de llamada (95).**
  - Nuevo bloque `global.callButton` en Tina y switch `global.whatsapp.enabled` para el de WhatsApp.
  - Posición: **apilado encima** del de WhatsApp, mismo tamaño y separación de 12px, mismo lado (derecha abajo). Si uno está oculto, el otro ocupa la posición base.
  - El botón abre `tel:+51…`. Ícono de teléfono en morado (`#96237A`) para diferenciarlo del verde de WhatsApp. `aria-label` editable.
  - Visible en mobile siempre que esté activo. En desktop solo si `callButton.desktop = true` (default `false`).
  - La burbuja de WhatsApp (`bubble`) sigue saliendo junto al botón de WhatsApp y no tapa al de llamada.

**Fuera de scope:**

- Cambiar el formulario de `/contacto` (`contacto.json`).
- Los planes Cyberguard en "Servicio de interés" (SPEC 124).
- Rediseñar la sección de canales de Soporte.
- Horarios de atención o mostrar el botón de llamada por franja horaria.
- Enrutar destinatarios del correo según la sede.

---

## Modelo de datos

### `src/content/dynamic-forms/servicios.json` → campos nuevos

```jsonc
{
  "name": "sede", "type": "select", "label": "Sede", "label_en": "Location",
  "placeholder": "Selecciona una sede", "placeholder_en": "Select a location",
  "width": "full", "validation": { "required": true },
  "options": [
    { "value": "lima", "label": "Lima" },
    { "value": "callao", "label": "Callao" },
    { "value": "arequipa", "label": "Arequipa" }
    // … los 24 departamentos + Callao, editables en Tina
  ]
},
{
  "name": "comentario", "type": "textarea", "label": "Cuéntanos", "label_en": "Tell us more",
  "placeholder": "Cuéntanos cómo podemos ayudarte…", "width": "full",
  "validation": { "required": false }
}
```

### `tina/config.ts` → `global`

```ts
// global.whatsapp — campo nuevo
{ name: "enabled", label: "Mostrar botón de WhatsApp", type: "boolean" }   // ausente ⇒ true

// global.callButton — objeto nuevo
{
  name: "callButton", label: "Botón flotante de llamada", type: "object",
  fields: [
    { name: "enabled", label: "Mostrar botón de llamada", type: "boolean" },   // default false
    { name: "phone", label: "Teléfono (con código de país, ej. +5116000000)", type: "string" },
    { name: "label", label: "Texto accesible", type: "string" },               // "Llámanos"
    { name: "label_en", label: "Texto accesible (EN)", type: "string" },
    { name: "desktop", label: "Mostrar también en desktop", type: "boolean" }, // default false
  ],
}
```

```jsonc
// src/content/global/index.json
"whatsapp": { "enabled": true, /* resto igual */ },
"callButton": { "enabled": false, "phone": "", "label": "Llámanos", "label_en": "Call us", "desktop": false }
```

- `whatsapp.enabled` ausente se toma como `true`, para no apagar el botón actual al desplegar.
- `callButton.enabled = true` con `phone` vacío ⇒ no se pinta.
- El número de llamada lo carga el cliente en Tina; arranca apagado.

---

## Plan de implementación

Rama: `spec-125-formulario-canales-llamada` contra `staging`.

1. **Campos del formulario.** Reordenar `servicios.json` y agregar `sede` y `comentario` con sus `_en`. Verificación: en una categoría, a 1512 y 390px el formulario sigue el orden y los anchos del prototipo (PDF pág. 9, "Después").
2. **Backend.** Sumar `Sede` y `Mensaje` al caso `servicios` de `send-email.php` (y al panel si aplica). Verificación: envío en local con `config.local.php` de prueba; el correo trae Sede y Mensaje.
3. **Canales de Soporte.** Probar en `/admin` agregar, eliminar y reordenar un canal y una fila. Documentar el hallazgo en el tracker y corregir. Verificación: un canal nuevo "Correo comercial" aparece como tab en `/soporte-tecnico` y desaparece al borrarlo.
4. **Schema de botones.** `global.whatsapp.enabled` y `global.callButton` en `tina/config.ts` + JSON. Verificación: build verde; el WhatsApp sigue visible sin tocar nada.
5. **Botón de llamada.** Extender `WhatsAppButton.tsx` (o un contenedor `FloatingContact.tsx` en `BaseLayout.astro`) para apilar los dos botones según los switches. Verificación: las 4 combinaciones (ninguno, solo WA, solo llamada, ambos) a 390px; desktop respeta `callButton.desktop`.
6. **Registro.** obs 79, 81, 95 → `Hecho` en `specs/observaciones-cliente.md`. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] El formulario de soluciones muestra, en orden: Nombre, Apellido, Servicio de tu interés, Sede, Empresa, RUC, Teléfono / Celular, Correo, Cuéntanos, consentimientos.
- [ ] Sede es obligatoria y Cuéntanos es opcional.
- [ ] El formulario de `/contacto` no cambia.
- [ ] El correo de un lead de soluciones incluye Sede y Mensaje.
- [ ] Las opciones de Sede se editan desde Tina (colección `dynamicForms`).
- [ ] Desde Tina se puede agregar y eliminar un canal de Soporte y una fila de un canal, y el cambio se ve en `/soporte-tecnico`.
- [ ] Un canal sin filas no genera un tab vacío.
- [ ] Con `callButton.enabled = true` y un teléfono, a 390px aparece un botón de llamada encima del de WhatsApp que abre `tel:`.
- [ ] Con `whatsapp.enabled = false` el botón de WhatsApp desaparece y el de llamada baja a la posición base.
- [ ] Con los dos apagados no hay botón flotante.
- [ ] En desktop el botón de llamada solo aparece con `callButton.desktop = true`.
- [ ] Al desplegar sin tocar Tina, el WhatsApp se ve igual que hoy y no aparece el botón de llamada.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Sí:** Sede y Cuéntanos solo en el formulario de soluciones. Lo confirmó el autor; `/contacto` ya tiene "Cuéntanos".
- **Sí:** Sede como select editable en Tina, sembrado con los 24 departamentos + Callao. El cliente no pasó la lista; un select evita texto libre y se ajusta desde el CMS.
- **No:** Sede como texto libre. Daría datos sucios para enrutar o filtrar leads.
- **Sí:** mantener los `name` existentes (`apellidos`, `empresa`…). Solo cambian orden y labels, así el backend y el panel no pierden datos.
- **Sí:** botón de llamada apilado encima del de WhatsApp. Es la zona del pulgar en mobile, y al costado obligaría a mover el WhatsApp de su lugar habitual.
- **Sí:** llamada visible en desktop solo si se activa. En desktop `tel:` abre una app de llamadas que muchos no tienen configurada.
- **Sí:** `whatsapp.enabled` ausente = `true`. Desplegar el cambio no puede apagar el canal principal de leads.
- **Sí:** el botón de llamada arranca apagado. Falta el número del cliente.
- **No:** rehacer la sección de canales de Soporte. El schema ya permite agregar y eliminar; se corrige solo lo que falle en el editor.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El cliente esperaba otra lista de sedes (por ejemplo, las oficinas de Fiberlux) | Las opciones viven en Tina; se cambian sin código. Se pregunta en el resumen para el cliente. |
| Cambiar el PHP rompe el envío de otros formularios | El cambio se limita al `case 'servicios'`. Probar en local `servicios`, `contacto` y un reclamo. |
| El problema de obs 81 no es del editor, sino que el cliente miraba otra sección (`/contacto`, colección `contact`) | El paso 3 lo comprueba en las dos colecciones antes de tocar código. |
| Dos botones flotantes tapan contenido en pantallas chicas (360×640) | Revisar a 360×640 con el popup, el banner de cookies y la burbuja de WhatsApp abiertos. |

---

## Qué **no** entra en este spec

- Cambios al formulario de `/contacto`.
- Planes Cyberguard en el formulario (SPEC 124).
- Rediseño de la sección de canales de Soporte.
- Enrutamiento de leads por sede.
