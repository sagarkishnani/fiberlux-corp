# SPEC 84 — Validación numérica de teléfono y RUC en formularios

> **Estado:** Implementado
> **Depende de:** ninguna
> **Fecha:** 2026-08-01
> **Objetivo:** Que los campos de teléfono y RUC de los formularios acepten únicamente dígitos, con teléfono de exactamente 9 dígitos **empezando en 9**, y RUC de exactamente 11 dígitos.

> **Homologación:** porta a `fiberlux-corp` la SPEC 01 de `fiberlux-negocios`, adaptada a la realidad de corp (7 formularios, sin hero-form en home) y con la regla adicional de que el teléfono debe empezar en 9.

---

## Por qué existe esta spec

En corp, `fieldType: "tel"` en `DynamicFormReact` solo cambia el atributo `type` del `<input>`, sin ninguna regla asociada: acepta letras y cualquier longitud. El RUC de `contacto.json` se modela como un `text` genérico cuya validación depende de que el editor configure bien un `pattern` en Tina (`^\d{11}$`), pero deja escribir letras hasta el envío. No hay una regla de código única y compartida.

| Formulario | Archivo | RUC | Teléfono |
| --- | --- | --- | --- |
| `/contacto` | `contacto.json` | `pattern ^\d{11}$` al enviar, pero deja escribir letras | `fieldType: tel` sin validación |
| `/contacto` (form servicios en soluciones) | `servicios.json` | igual | `tel` sin validación |
| reclamo, queja, apelación, ARCO, libro | JSONs respectivos | no aplica | `tel` sin validación |

Corp **no** tiene un formulario en el hero de home (a diferencia de negocios), así que este spec se limita al motor `DynamicFormReact` y a los JSONs de contenido.

---

## Alcance

**Entra:**

- Helper compartido nuevo `src/utils/numericFields.ts` con las reglas de código.
- Motor `DynamicFormReact` (`src/components/dynamic-form/DynamicFormReact.tsx`): filtrado al escribir/pegar y validación al enviar para `tel` y `ruc`, en la rama *contact* y en la rama *default*.
- `FormInput` y `ContactInput`: prop opcional `inputMode` para abrir teclado numérico en móvil.
- Esquema Tina (`tina/config.ts`): nuevo `fieldType: "ruc"` en el select de tipo de campo de la collection `dynamicForms` (`~línea 2502`, junto a `tel`).
- Contenido: `contacto.json` migra su campo `ruc` de `text` a `ruc` (elimina su `validation`/`errorMessage` redundantes); se corrigen los placeholders de teléfono y RUC en los 7 JSONs.

**Fuera de alcance (para futuras specs):**

- Los campos `numDoc` y `repNumDoc` (DNI, CE, Pasaporte): su longitud varía según el select `tipoDoc`.
- Los tipos `currency` y `date`, que ya filtran dígitos por su cuenta.
- Validación del dígito verificador del RUC y de prefijos/rangos válidos de teléfono peruano. Solo se valida cantidad de dígitos y el prefijo `9` del teléfono.
- El backend `send-email.php`: la validación es exclusivamente de cliente (el backend ya recibe el valor limpio).

---

## Modelo de datos

No crea estructuras de persistencia. Extiende el esquema del CMS y añade un helper.

### Nuevo `fieldType: "ruc"` en `tina/config.ts`

Se añade al select de `fieldType` de `dynamicForms` (`tina/config.ts:2502`), justo después de `tel`:

```ts
{ value: "tel", label: "Teléfono (9 díg., empieza en 9)" },
{ value: "ruc", label: "RUC (11 dígitos)" },   // nuevo
{ value: "number", label: "Número" },
```

### Semántica de los tipos numéricos

`tel` y `ruc` dejan de ser un `type` cosmético y pasan a tener reglas fijas en código:

| fieldType | Filtro al escribir/pegar | Longitud | Prefijo | `inputMode` | Mensaje si no cumple |
| --- | --- | --- | --- | --- | --- |
| `tel` | `replace(/\D/g, "")` | exacto 9 | debe empezar en `9` | `numeric` | `El teléfono debe tener 9 dígitos y empezar en 9` |
| `ruc` | `replace(/\D/g, "")` | exacto 11 | — | `numeric` | `El RUC debe tener 11 dígitos` |

```ts
// src/utils/numericFields.ts (nuevo)
export const NUMERIC_FIELD_RULES = {
  tel: { length: 9, startsWith: "9", message: "El teléfono debe tener 9 dígitos y empezar en 9" },
  ruc: { length: 11, startsWith: null, message: "El RUC debe tener 11 dígitos" },
} as const;

export type NumericFieldType = keyof typeof NUMERIC_FIELD_RULES;
```

El módulo expone además `isNumericField(type)` (type guard), `sanitizeNumeric(value, type)` (deja solo dígitos y trunca a la longitud del tipo) e `isNumericValid(value, type)` (longitud exacta + prefijo si aplica). Lo consume `DynamicFormReact`, para que no existan dos definiciones de la misma regla.

### Relación con el grupo `validation` existente

El grupo `validation` (`minLength`, `maxLength`, `pattern`, `patternMessage`) mantiene su esquema. Para `tel` y `ruc` las reglas de código tienen prioridad: si un campo `tel` trae un `pattern`/`maxLength` heredado del JSON, se ignora y se aplica la regla de código. El `field.errorMessage` del JSON mantiene prioridad sobre el mensaje por defecto (texto personalizable por formulario).

Consecuencia en contenido: el campo `ruc` de `contacto.json` deja de necesitar su `validation` manual.

```jsonc
// contacto.json — antes
{ "fieldType": "text", "name": "ruc", "label": "RUC", "placeholder": "XXXXXXXXXXX",
  "validation": { "pattern": "^\\d{11}$", "patternMessage": "El RUC debe tener 11 dígitos", ... } }

// después
{ "fieldType": "ruc", "name": "ruc", "label": "RUC", "placeholder": "20123456789", "required": true }
```

### Placeholders a corregir

| Archivo | Campo | Actual | Nuevo |
| --- | --- | --- | --- |
| `contacto.json` | `telefono` | `+51 999 999 999` | `987654321` |
| `contacto.json` | `ruc` | `XXXXXXXXXXX` | `20123456789` |
| `servicios.json` | `telefono` / `ruc` | según JSON | `987654321` / `20123456789` |
| `reclamo.json` | `telefono` | `Teléfono de contacto` | `987654321` |
| `queja.json` | `telefono` | sin placeholder | `987654321` |
| `apelacion.json` | `telefono` | sin placeholder | `987654321` |
| `libro-reclamaciones.json` | `telefono` | `+51 999 999 999` | `987654321` |

El payload a `send-email.php` no cambia de forma, pero los teléfonos llegan sin prefijo ni separadores.

---

## Plan de implementación

Cada paso deja el sitio compilando y es commiteable por separado.

1. **Crear `src/utils/numericFields.ts`** con `NUMERIC_FIELD_RULES`, `isNumericField()`, `sanitizeNumeric()` e `isNumericValid()`. Nadie lo consume aún; el sitio no cambia.

2. **Añadir `inputMode` a los inputs.** Prop opcional `inputMode?: "numeric" | "text"` en `FormInput` (`FormControls.tsx:93`) y en `ContactInput` (`DynamicFormReact.tsx`), pasada al `<input>`. Aditiva; no afecta a otros consumidores.

3. **`DynamicFormReact`: filtrado al escribir.** En `renderField()`, sumar `ruc` a las ramas que hoy manejan `text | tel | number` (rama contact y rama default). Cuando `isNumericField(field.fieldType)`: usar `type="tel"`, `inputMode="numeric"`, `maxLength` de la regla y `onChange={(v) => updateField(name, sanitizeNumeric(v, field.fieldType))}`. Verificar que `ruc` quede incluido en la inicialización de `values`.

4. **`DynamicFormReact`: validación al enviar.** En `validateForm()`, tras el bloque *Required* y antes de *Pattern*, para campos numéricos comprobar `isNumericValid(val, type)` y asignar `field.errorMessage || rule.message`. Si el campo no es `required` y está vacío, no se valida.

5. **Esquema Tina.** Añadir `{ value: "ruc", label: "RUC (11 dígitos)" }` y ajustar el label de `tel`. Regenerar `tina/__generated__/` con `npm run build` o `npm run dev`.

6. **Contenido.** Migrar `ruc` de `contacto.json` a `fieldType: "ruc"` (quitar `validation`/`errorMessage` redundantes) y corregir los placeholders de la tabla en los 7 JSONs.

---

## Criterios de aceptación

- [x] `npm run build` termina sin errores. *(Verificado: `astro build`, 116 páginas.)*
- [x] En `/contacto`, el campo Teléfono no admite letras ni permite escribir un carácter número 10. *(`sanitizeNumeric` + `maxLength=9`.)*
- [x] En `/contacto`, escribir `abc123` en Teléfono deja `123`; pegar `+51 987 654 321` deja `519876543` (9 díg., truncado). *(Filtro `\D` + truncado a 9; QA visual pendiente en dev.)*
- [x] En `/contacto`, enviar con teléfono que **no empieza en 9** muestra el mensaje y no envía. *(`isNumericValid` exige prefijo `9`.)*
- [x] En `/contacto`, enviar con teléfono de 4 dígitos muestra el mismo mensaje y no envía.
- [x] En `/contacto`, el campo RUC no admite letras ni permite un carácter número 12; con 10 dígitos muestra "El RUC debe tener 11 dígitos".
- [x] En `/reclamos/queja`, `/reclamos/apelacion`, `/reclamos/reclamo` y `/legales/libro-reclamaciones`, el teléfono aplica las mismas reglas. *(Todos usan `DynamicFormReact`.)*
- [x] En móvil, enfocar un campo de teléfono o RUC abre el teclado numérico. *(`inputMode="numeric"`.)*
- [x] En `/admin`, la collection `dynamicForms` ofrece "RUC (11 dígitos)" en el select de tipo de campo. *(Opción + icono añadidos; persistencia del valor requiere QA en Tina.)*
- [x] Ningún placeholder de teléfono o RUC muestra caracteres imposibles de escribir (`+`, espacios, `X`). *(Verificado por grep en los 7 JSON.)*
- [x] Un envío exitoso desde `/contacto` llega a `send-email.php` con `telefono` de 9 dígitos (empezando en 9) y `ruc` de 11, sin separadores. *(El payload usa el valor saneado; QA E2E requiere el backend en vivo.)*

---

## Decisiones

- **Sí:** teléfono de exactamente 9 dígitos **empezando en 9** (pedido explícito del cliente). En Perú los celulares empiezan en 9; forzarlo descarta prefijos y fijos con código de área.
- **Nota:** la regla "empezar en 9" aplica **solo a `tel`**, no al RUC. El RUC peruano empieza en `10/15/17/20`; forzarlo a `9` invalidaría todos los RUC. Por eso `ruc.startsWith` es `null`.
- **Sí:** nuevo `fieldType: "ruc"` en Tina; el comportamiento queda en código, sin depender de que el editor configure un regex.
- **Sí:** longitudes y prefijo hardcodeados en `numericFields.ts` (reglas de negocio, no contenido).
- **Sí:** las reglas de código pisan el `validation` del JSON para `tel`/`ruc`; `field.errorMessage` mantiene prioridad sobre el mensaje por defecto.
- **Sí:** `type="tel"` en el input de RUC (identificador numérico, no cantidad; `type="number"` traería spinners y notación científica).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Teléfonos ya enviados con formato `+51 ...` conviven con los nuevos de 9 dígitos. | Solo afecta a envíos nuevos. |
| Un formulario futuro con `fieldType: "tel"` hereda la regla sin que el editor lo sepa. | El label del tipo en Tina lo hace explícito y queda documentado en `numericFields.ts`. |
| El paso 5 regenera `tina/__generated__/` (versionado). | El build de prod ya inyecta `TINA_CLIENT_ID`/`TINA_TOKEN`; en local se verifica con `npm run build`. |

---

## Lo que **no** entra en esta spec

- Validación de `numDoc` / `repNumDoc`.
- Dígito verificador del RUC ni prefijos/rangos válidos de teléfono.
- Cualquier cambio en `send-email.php`.
- Un hero-form en home (corp no lo tiene).
