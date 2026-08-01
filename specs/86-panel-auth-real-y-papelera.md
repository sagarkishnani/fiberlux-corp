# SPEC 86 — Panel con autenticación real y papelera de leads

> **Estado:** Draft
> **Depende de:** SPEC 85 (`fiberlux-config.php` con `panel_user` / `panel_pass_hash`)
> **Fecha:** 2026-08-01
> **Objetivo:** Que `panel-leads.php` valide la sesión **antes** de entregar cualquier dato, use credenciales hasheadas fuera del código, endurezca la sesión, y permita mandar leads a una papelera con confirmación y CSRF.

> **Homologación:** porta la SPEC 03 de `fiberlux-negocios`. Corp ya tiene un único panel (`panel-leads.php`) con buscador, filtros, paginación y CSV, así que **no hay fusión de dos paneles** como en negocios: solo el arreglo de seguridad y la papelera.

---

## Por qué existe esta spec

`panel-leads.php` tiene el mismo fallo que tenía negocios: **el login no protege nada**. Los datos se cargan y serializan siempre; `$isLoggedIn` solo decide si el overlay de login lleva la clase `hidden`:

```php
$isLoggedIn = !empty($_SESSION['panel_auth']);   // :55
$submissions = loadSubmissions($SUBMISSIONS_DIR); // :56  ← se ejecuta siempre
```

Un `curl https://.../panel-leads.php` devuelve todos los leads en el HTML: nombres, correos, teléfonos, RUC, DNI, direcciones y el detalle de reclamos y quejas. Las credenciales viven en `config.local.php` en claro (`PANEL_USER` / `PANEL_PASS`).

---

## Alcance

**Entra:**

- Los datos dejan de imprimirse en el HTML si no hay sesión válida (carga condicional).
- Usuario y contraseña se leen de `fiberlux-config.php` (SPEC 85), con la contraseña como **hash bcrypt** (`panel_pass_hash`), validada con `password_verify`.
- Endurecer la sesión: `session_regenerate_id(true)` al entrar, cookie `HttpOnly` y `SameSite=Strict`.
- Papelera de leads: enviar uno o varios registros a `data/deleted/`, arrastrando sus adjuntos de `uploads/<correlativo>/`, con registro en `data/deleted.log`.
- Token CSRF para la acción de borrado.
- `scripts/reset-panel-pass.sh` para generar/rotar el hash.

**Fuera de alcance (para futuras specs):**

- Multiusuario, roles o recuperación de contraseña (sigue siendo un único par de credenciales).
- Limitar intentos de login.
- Rediseño visual del panel (se conserva tal cual).
- La zona horaria de las fechas mostradas (SPEC 87).
- Restaurar leads o vaciar la papelera desde la interfaz (se hace por FTP, a conciencia).
- Editar el contenido de un lead.

---

## Modelo de datos

Sin estructuras nuevas de submission. Cambian las claves de panel en `fiberlux-config.php` (creado en SPEC 85):

```php
'panel_user'      => 'admin',
'panel_pass_hash' => '$2y$10$...',   // password_hash('<nueva>', PASSWORD_DEFAULT)
```

`panel_pass` en claro desaparece. El hash se genera con `scripts/reset-panel-pass.sh` (pide la contraseña por teclado, no queda en el historial del shell) y se pega en el config.

### La corrección del fallo

La carga de datos pasa a depender de la sesión:

```php
$isLoggedIn = !empty($_SESSION['panel_auth']);
$submissions = $isLoggedIn ? loadSubmissions($SUBMISSIONS_DIR) : [];
```

Como el login actual solo oculta el overlay por JavaScript sin recargar, tras autenticarse hay que hacer `location.reload()` para que PHP re-renderice con los datos. El export CSV ya comprueba la sesión (`panel-leads.php:36`), así que ese camino no cambia.

### La papelera

Estructura nueva en el servidor, bajo `data/` (ya protegida por el `.htaccess` de la SPEC 85):

```
data/
├── submissions/          registros activos (sin cambios)
├── deleted/
│   ├── CON-000042.json   el JSON movido tal cual
│   └── uploads/
│       └── CON-000042/   los adjuntos que colgaban de uploads/<correlativo>/
└── deleted.log           una línea por operación: "2026-08-01 14:32:11 | CON-000042 | 190.234.12.7"
```

### Validación del correlativo (anti path-traversal)

El borrado recibe correlativos del navegador y construye rutas con ellos. Se validan contra el formato exacto que genera `send-email.php` (prefijos `CON/SER/REC/APE/QUE/ARC/LIB` + 6 dígitos) **antes** de tocar disco:

```php
if (!preg_match('/^[A-Z]{3}-\d{6}\z/', $correlativo)) continue;   // \z, no $ (evita "CON-000042\n")
```

### Token CSRF

Se genera al iniciar sesión, se guarda en `$_SESSION['csrf']`, se imprime en el HTML solo con sesión, y se compara con `hash_equals` en cada POST de borrado. `data/counter.json` no se toca: un lead borrado nunca reutiliza su número.

---

## Plan de implementación

Cada paso deja el panel funcional y es commiteable por separado.

1. **Cerrar la fuga:** carga condicional de `$submissions`, `location.reload()` tras login correcto, `$_SESSION['panel_auth']` como única puerta. Verificación: `curl https://.../panel-leads.php | grep -c correlativo` devuelve 0.

2. **Credenciales desde el config:** leer `panel_user` y `panel_pass_hash` de `fiberlux-config.php`, validar con `password_verify`, eliminar `PANEL_USER`/`PANEL_PASS` en claro.

3. **Endurecer la sesión:** `session_set_cookie_params` con `httponly` y `samesite=Strict`, y `session_regenerate_id(true)` tras autenticar.

4. **Token CSRF:** generarlo al autenticar, guardarlo en `$_SESSION['csrf']`, imprimirlo en el HTML solo con sesión. Aún no lo consume nadie.

5. **Papelera, lado servidor:** manejador `action=delete` por POST que exige sesión y token, valida cada correlativo contra `^[A-Z]{3}-\d{6}$`, mueve el JSON a `data/deleted/`, mueve `uploads/<correlativo>/` a `data/deleted/uploads/` si existe, y escribe la línea en `data/deleted.log`. Crea los directorios si faltan.

6. **Papelera, lado interfaz:** botón de borrar por fila y en la vista de detalle, casillas de selección múltiple con "borrar seleccionados", y diálogo de confirmación que muestra los correlativos antes de enviar.

7. **`scripts/reset-panel-pass.sh`** para generar el hash bcrypt.

8. **Desplegar y verificar** login, filtros, paginación, CSV y borrado.

---

## Criterios de aceptación

- [ ] `curl -s https://fiberlux.pe/panel-leads.php` no contiene ningún correlativo, correo, teléfono ni RUC.
- [ ] La misma petición devuelve 200 con el formulario de login, no un error.
- [ ] `curl -s '.../panel-leads.php?export=csv'` sin sesión no devuelve un CSV con datos.
- [ ] `grep -rn "PANEL_PASS\|panel_pass'.*=>" public/panel-leads.php` no encuentra contraseñas en claro.
- [ ] Con usuario y contraseña correctos, el panel carga y muestra el total de submissions.
- [ ] Con credenciales incorrectas, muestra el error y no carga datos.
- [ ] Buscador, rango de fechas, paginación y export CSV funcionan tras autenticarse.
- [ ] Cerrar sesión y recargar deja el panel sin datos en el HTML.
- [ ] La cookie de sesión se emite con `HttpOnly` y `SameSite=Strict`.
- [ ] Borrar un lead lo saca de la tabla y del CSV, y deja su JSON intacto en `data/deleted/`.
- [ ] Si tenía adjuntos, `uploads/<correlativo>/` queda vacío/inexistente y los archivos aparecen en `data/deleted/uploads/<correlativo>/`.
- [ ] `data/deleted.log` gana una línea con fecha, correlativo e IP por cada borrado.
- [ ] Seleccionar tres leads y borrarlos mueve los tres y añade tres líneas al log.
- [ ] El diálogo de confirmación muestra los correlativos antes de borrar; cancelarlo no mueve nada.
- [ ] Un POST de borrado sin sesión, o con sesión pero sin token CSRF válido, no mueve nada.
- [ ] Un POST con `correlativo=../../send-email.php` no mueve ni borra nada y el sitio sigue funcionando.
- [ ] Devolver un JSON de `data/deleted/` a `data/submissions/` por FTP lo hace reaparecer en el panel.
- [ ] `data/counter.json` no cambia al borrar; el siguiente lead recibe el correlativo que le tocaba.

---

## Decisiones

- **Sí:** conservar el nombre `panel-leads.php` (corp ya tiene uno solo; no hay fusión ni renombrado que hacer).
- **Sí:** `password_verify` contra hash en vez de comparar cadenas. Protege frente a **reutilización**: el config acaba en copias FTP y respaldos; una contraseña en claro reutilizada en otro sitio se filtra entera.
- **Sí:** `scripts/reset-panel-pass.sh` para regenerar el hash. Un hash no provoca olvidos, solo cambia la recuperación de "consultar" a "resetear".
- **Sí:** `location.reload()` tras el login. Cambio mínimo para que la carga condicional en PHP tenga efecto sin reescribir el panel como app cliente.
- **Sí:** papelera en `data/deleted/` en vez de `unlink`. Un clic accidental sobre datos que solo existen en el servidor sería irreversible.
- **Sí:** los adjuntos acompañan al lead a la papelera, bajo `data/` (heredan el bloqueo HTTP sin otro `.htaccess`).
- **Sí:** selección múltiple + diálogo con los correlativos a la vista, para acotar el riesgo de un borrado equivocado.
- **Sí:** token CSRF propio para el borrado, además de `SameSite=Strict` (una acción destructiva no debe depender de una sola capa).
- **Sí:** validar el correlativo contra `^[A-Z]{3}-\d{6}$` antes de tocar disco (único freno entre un borrado y un movimiento arbitrario de archivos).
- **No:** limitar intentos, multiusuario o restaurar/vaciar desde la interfaz (otras specs / por FTP).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un hash mal generado deja el panel inaccesible. | El paso 8 verifica el login; rehacer el hash es editar una línea del config por FTP. |
| Las sesiones abiertas hoy siguen válidas tras el despliegue. | `session_regenerate_id` solo afecta a logins nuevos; si preocupa, se cambia el nombre de sesión para invalidar todas. |
| El panel queda sin datos si `fiberlux-config.php` falta. | Mismo comportamiento que `send-email.php` en SPEC 85: fallar visible antes que degradar en silencio. |
| Un correlativo manipulado convertiría el borrado en movimiento arbitrario de archivos. | Validación estricta `^[A-Z]{3}-\d{6}$` con criterio propio que prueba `../../send-email.php`. |
| El borrado múltiple falla a medias (JSON movido, adjuntos no). | Cada lead se procesa por separado; el log solo registra los completados; los adjuntos huérfanos quedan visibles en FTP. |

---

## Lo que **no** entra en esta spec

- Multiusuario, roles ni recuperación de contraseña.
- Límite de intentos de login.
- Rediseño visual del panel.
- Zona horaria de las fechas mostradas (SPEC 87).
- Restaurar/vaciar la papelera desde la interfaz, o editar un lead.
