# SPEC 130 — Textos de los correos editables desde TinaCMS

> **Estado:** Borrador
> **Depende de:** SPEC 79 (Turnstile), SPEC 85 (secretos en `fiberlux-config.php`)
> **Fecha:** 2026-11-13
> **Objetivo:** Que el cliente pueda editar desde Tina los asuntos y textos de los correos que envía `send-email.php`, tanto el aviso interno como la confirmación al lead, sin tocar PHP ni arriesgar el HTML que se ve bien en Outlook.

---

## Situación actual

Hoy los correos se escriben a mano en `public/send-email.php`. Desde Tina (`formConfig`) solo se editan `label`, `enabled` y `recipients[]`.

| Correo | Dónde vive | Lo que está escrito a mano |
|---|---|---|
| Aviso interno (al equipo) | `buildEmailBody()` | Asunto vía `getSubjectPrefix()`, pie "Correo generado desde fiberlux.pe" |
| Confirmación simple (reclamo, queja, apelación, libro, ARCO) | `buildConfirmSimple()` | Asunto "Recibimos tu mensaje [COR] — Fiberlux", saludo, plazo "24 horas", teléfono `(01) 748-0606`, nota "mensaje automático" |
| Confirmación completa (contacto, servicios) | `buildConfirmRich()` | Asunto "Gracias por contactarnos — Fiberlux", preheader, 2 párrafos, banda morada "¿Tienes una consulta urgente?", redes sociales, aviso de confidencialidad, texto de protección de datos (RNPDP) |
| Qué formulario usa qué plantilla | `$richTypes = ['contacto','servicios']` | Lista fija en el código |

## Decisión: textos editables, estructura fija

**No** se edita HTML crudo desde Tina:
- El HTML de correo con tablas y condicionales MSO se rompe con facilidad, y el editor de Tina no ofrece vista previa de correo.
- Un HTML libre que llega a `$mail->Body` abre la puerta a inyección si alguien con acceso al CMS pega contenido externo.

Las dos plantillas siguen en PHP. Tina controla **los textos, los asuntos y qué plantilla usa cada formulario**. Todo campo vacío cae al texto que hay hoy en el código, así que el PHP nuevo puede salir antes que el contenido sin cambiar nada de lo que se ve.

## Cambios

### 1. Schema (`tina/config.ts` → colección `formConfig`)

**Por formulario** (`forms[]`) se agrega un objeto `email` con campos opcionales:

| Campo | Tipo | Uso | Default (vacío) |
|---|---|---|---|
| `internalSubject` | string | Asunto del aviso interno. El sistema agrega ` [COR] - Nombre` al final. | `getSubjectPrefix()` |
| `confirmEnabled` | boolean | Enviar o no la confirmación al lead | `true` |
| `confirmLayout` | select `rica` / `simple` | Plantilla de la confirmación | `rica` para contacto/servicios, `simple` para el resto |
| `confirmSubject` (+`_en`) | string | Asunto de la confirmación | textos actuales |
| `confirmPreheader` (+`_en`) | string | Texto de vista previa en la bandeja (solo `rica`) | texto actual |
| `confirmGreeting` (+`_en`) | string | Saludo. Ej: `Hola {nombre},` | `Hola {nombre}` |
| `confirmBody` (+`_en`) | textarea | Párrafos separados por una línea en blanco | párrafos actuales |
| `confirmHighlight` (+`_en`) | textarea | Banda morada (solo `rica`). La primera línea va en negrita. | "¿Tienes una consulta urgente?…" |

**Global** (raíz de `formConfig`) se agrega un objeto `emailSettings`:

| Campo | Uso | Default |
|---|---|---|
| `contactPhone` | Teléfono que aparece en la plantilla simple (`{telefono}`) | `(01) 748-0606` |
| `responseTime` | Plazo prometido (`{plazo}`) | `24 horas` |
| `socialLinks[]` (`network` select + `url`) | Íconos de redes en la plantilla rica | los 4 actuales |
| `legalNotice` (textarea) | Aviso de confidencialidad | texto actual |
| `dataProtectionNotice` (textarea) | Texto RNPDP | texto actual |
| `arcoEmail` | Correo del texto RNPDP | `atencionalcliente@fiberlux.pe` |

Todos los campos llevan `description` con los marcadores disponibles y un ejemplo.

### 2. Export (`src/pages/form-config.json.ts`)

Agregar `email` por formulario y `emailSettings` en la raíz. Hay que filtrar los `null` que devuelve Tina para que el JSON no crezca sin necesidad.

> `form-config.json` es público (hoy ya expone los `recipients`). Los textos de correo no son sensibles, pero **no** se deben agregar secretos aquí.

### 3. PHP (`public/send-email.php`)

- `findFormConfig()` devuelve también `email`. Se agrega `loadEmailSettings($config)`.
- Nueva función `tpl(string $text, array $vars): string`: primero escapa con `h()` y después reemplaza los marcadores `{nombre}`, `{correlativo}`, `{telefono}`, `{plazo}` y `{formulario}`. Los valores de los marcadores también van escapados.
- Nueva función `paragraphs(string $text): string`: separa por línea en blanco, pone cada bloque en un `<p>` con los estilos inline actuales y aplica `nl2br`.
- `buildConfirmRich()` y `buildConfirmSimple()` reciben un arreglo `$t` con los textos ya resueltos (dato de Tina o default) en vez de literales.
- La plantilla se elige con `confirmLayout` y queda `$richTypes` como default. Si `confirmEnabled === false`, no se envía la confirmación.
- `AltBody` se arma con los mismos textos, sin HTML.
- **Locale:** se usa `_en` cuando el payload trae `locale: "en"` (ver punto 4). Si el campo `_en` está vacío, cae al ES.
- El cuerpo del aviso interno (`getFieldRows`) **no** cambia. Las etiquetas de los campos siguen en código porque dependen de los `name` del formulario.

### 4. Front (`src/utils/submitForm.ts` + `DynamicFormReact.tsx`)

- `submitForm` envía `locale` (que ya existe como prop del form) en JSON y en multipart.
- `send-email.php` saca `locale` de `$input` antes de guardar el envío y armar el correo, igual que hace con `captchaToken`, para que no aparezca como fila.

### 5. Vista previa (`public/panel-leads.php`)

Agregar en el panel, ya con login, un botón "Ver correo" por formulario. Abre `send-email.php?preview=<formType>&layout=…&locale=…`. El modo preview:
- solo responde si hay una sesión válida del panel (misma `session_start()` y el mismo flag de login de `panel-leads.php`);
- renderiza la confirmación con datos de ejemplo (`{nombre}` = "María Pérez", `{correlativo}` = "CON-000123");
- no envía correos, no guarda el envío y no incrementa el contador.

Como el contenido llega con el build, la vista previa muestra lo **publicado**, no un borrador sin guardar. Hay que avisarlo en la `description` del campo.

### 6. Contenido inicial

Copiar los textos actuales a `src/content/form-config/index.json` para que el cliente los vea en Tina en vez de campos vacíos. Las traducciones `_en` las completa el cliente.

## Fuera de alcance

- Editar el HTML o el diseño (colores, imágenes, orden de bloques).
- Cambiar la imagen de cabecera `public/mail/header-contact-mail.png`. Se puede agregar después como campo `image` de Tina, pero hoy se sirve desde `/mail/`, que es una ruta fija.
- Las etiquetas de las filas del aviso interno.
- Traducir los correos de los formularios OSIPTEL (siguen en ES, igual que sus formularios).

## Criterios de aceptación

1. Con todos los campos nuevos vacíos, los 3 correos salen **idénticos** a los de hoy (comparar el HTML antes y después con `diff`).
2. Si se cambia `confirmSubject` de `contacto` en Tina y se publica, el lead recibe el asunto nuevo.
3. Si se escribe `<b>hola</b>` en `confirmBody`, en el correo aparece el texto literal, no la negrita.
4. Los marcadores `{nombre}` y `{correlativo}` se reemplazan. Uno desconocido (`{foo}`) queda como texto.
5. `confirmEnabled: false` en `queja` hace que el lead no reciba confirmación, pero el equipo sí recibe el aviso.
6. Un envío desde `/en/contacto` con `confirmSubject_en` lleno usa el asunto en inglés. Con el campo vacío, usa el ES.
7. `locale` no aparece en el correo interno ni en `data/submissions/*.json`.
8. La vista previa sin sesión del panel responde 403.
9. La plantilla rica se ve bien en Outlook (escritorio y web), Gmail y Apple Mail. Probar con Litmus/Email on Acid o con cuentas reales.

## Pruebas locales

```bash
cp public/config.example.php public/fiberlux-config.php   # completar SMTP de prueba (Mailtrap)
npm run build
php -S localhost:8080 -t dist
# POST a http://localhost:8080/send-email.php con formType=contacto, correo=<buzón de prueba>
```

Hay que dejar `turnstile_secret` vacío en local para que no se exija captcha.

## Archivos

- `tina/config.ts`, `tina/tina-lock.json` (y `tina/__generated__/*` vía build)
- `src/content/form-config/index.json`
- `src/pages/form-config.json.ts`
- `src/utils/submitForm.ts`, `src/components/dynamic-form/DynamicFormReact.tsx`
- `public/send-email.php`, `public/panel-leads.php`
