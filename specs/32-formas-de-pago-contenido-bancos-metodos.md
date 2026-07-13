# SPEC 32 — Contenido real de Formas de pago (6 métodos: BCP y BBVA)

> **Estado:** Aprobado
> **Depende de:** SPEC 14 (página `/formas-de-pago`, colección `formasDePago`, render de pasos con imagen + rich-text)
> **Fecha:** 2026-07-13
> **Objetivo:** Poblar la colección `formasDePago` con el contenido real de los 6 métodos de pago (3 en BCP, 3 en BBVA), cada uno con sus pasos y las imágenes ya subidas en `public/images/formas-de-pago/`, reemplazando los placeholders del SPEC 14.

## Sección 1 — Por qué existe este spec

El SPEC 14 dejó la página `/formas-de-pago` funcional pero sembrada con **placeholders** ("[Contenido por completar]") salvo BBVA → app. El cliente entregó el texto real de los pasos de **6 métodos** y subió las capturas a `public/images/formas-de-pago/`. Este spec solo **rellena contenido**: no toca componentes, schema ni estilos (el modelo `banks[] → methods[] → steps[]` ya soporta N métodos por banco).

## Alcance

**Dentro:**

- Reemplazar `src/content/formas-de-pago/index.json` con el contenido real:
  - **BBVA** (3 métodos): **Banca Móvil Personas** (5 pasos), **Banca Empresas** (4 pasos), **Banca Personas** (5 pasos).
  - **BCP** (3 métodos): **Banca Móvil** (4 pasos), **Telecrédito** (5 pasos), **Banca por Internet** (5 pasos).
- Copy real de cada paso, con **negrita** en las palabras clave (el render las pinta en magenta) y **sub-viñetas** `- ME para dólares` / `- MN para soles` donde aplique.
- Conectar cada paso a su imagen en `public/images/formas-de-pago/` (rutas `/images/formas-de-pago/<archivo>`), respetando extensiones reales (`.jpg`/`.png`).
- Etiquetas del segundo dropdown = **nombres reales del método** (no "Desde la app/web").
- Títulos de paso = **"Paso N"** (el método ya da el contexto arriba).
- **Telecrédito**: 5 pasos, con el **paso 5 sin imagen** (solo hay 4 capturas `bcp-web-1..4`); el render lo soporta.

**Fuera de alcance (para futuras specs):**

- Cualquier cambio de **schema** (`tina/config.ts`), **componentes** o **estilos**: el modelo y el render ya existen (SPEC 14).
- **Optimizar / renombrar** las imágenes subidas: se usan tal cual las dejó el cliente.
- La **5.ª imagen de Telecrédito**: se sube luego por el CMS.
- **Reordenar bancos**, cambiar el hero o las etiquetas de los selectores de banco.
- Lo ya excluido en SPEC 14: integración de pago, deep-linking por banco/método, lightbox/zoom, buscador de bancos.

## Modelo de datos

Esta feature **no introduce estructuras de datos nuevas**. Reutiliza el modelo del SPEC 14 (`banks[] → methods[] → steps[]`, con `steps[].{ title, description, image }`). Solo cambia el **contenido** de `src/content/formas-de-pago/index.json`.

Convenciones que se respetan (del SPEC 14):

- `description` se guarda como **string markdown** (`**negrita**` para el magenta, `\n- …` para sub-viñetas), igual que el seed actual de BBVA.
- `image` es una ruta bajo `public/`, servida como `/images/formas-de-pago/<archivo>`. Un paso con `image: ""` renderiza solo título + descripción.
- Etiquetas: `bank.optionLabel` ("Desde BBVA" / "Desde BCP") se conservan; `method.label` pasa a ser el nombre real del método.

### Mapeo de contenido (fuente de verdad para el sembrado)

**BBVA — `optionLabel: "Desde BBVA"`**

1. **Banca Móvil Personas** (5 pasos)
   1. `bbva-app-1.jpg` — Seleccione la opción de: **Pagar Servicio**
   2. `bbva-app-2.png` — Seleccionar: **Agregar servicio a pagar**
   3. `bbva-app-3.png` — Escribir **FIBERLUX TECH** en el cuadro de búsqueda y seleccionar el tipo de moneda según la factura · `- ME para dólares` · `- MN para soles`
   4. `bbva-app-4.png` — Colocar su número de DNI o RUC que figura en la factura
   5. `bbva-app-5.png` — Seleccionar el servicio a pagar. La deuda figura en orden de antigüedad, así que verá primero la deuda más vencida.
2. **Banca Empresas** (4 pasos)
   1. `bbva-empresas-1.png` — Seleccionar la opción de **PAGOS A INSTITUCIONES**
   2. `bbva-empresas-2.png` — Escribir en el recuadro de búsqueda **FIBERLUX TECH** y buscar. Seleccionar la empresa **FIBERLUX TECH** y el servicio que se desea pagar en Soles o Dólares y continuar. · `- ME para dólares` · `- MN para soles`
   3. `bbva-empresas-3.png` — Ingrese su **código de cliente**
   4. `bbva-empresas-4.png` — Seleccione el recibo o los recibos que se van a pagar. El cliente puede seleccionar el monto a pagar de su factura.
3. **Banca Personas** (5 pasos)
   1. `bbva-personas-1.png` — Selecciona la opción de **Pago de Servicio**
   2. `bbva-personas-2.png` — Seleccionar **INSTITUCIONES Y EMPRESAS**. Escribir y buscar **Fiberlux Tech**
   3. `bbva-personas-3.png` — Seleccionar la opción de **PAGO** en la moneda de tu deuda. · `- ME para dólares` · `- MN para soles`
   4. `bbva-personas-4.png` — Ingresar el **Código de Cliente**
   5. `bbva-personas-5.png` — Seleccionar el recibo que se pagará

**BCP — `optionLabel: "Desde BCP"`**

1. **Banca Móvil** (4 pasos)
   1. `bcp-movil-1.png` — Selecciona la opción de **Pago de Servicios**
   2. `bcp-movil-2.png` — Escribir en el recuadro de búsqueda **FIBERLUX TECH** y buscar. Elegir la moneda según factura.
   3. `bcp-movil-3.png` — Seleccionar el servicio que se desea pagar en Soles o Dólares. · `- ME para dólares` · `- MN para soles` · Ingresar su número de DNI o RUC.
   4. `bcp-movil-4.png` — Seleccionar las facturas a pagar. Se muestran las facturas más antiguas **PRIMERO**.
2. **Telecrédito** (5 pasos)
   1. `bcp-web-1.jpg` — Selecciona la opción de **Pago de Servicios**
   2. `bcp-web-2.jpg` — Escribir en el recuadro de búsqueda **FIBERLUX TECH** y buscar
   3. `bcp-web-3.jpg` — Seleccionar la empresa **FIBERLUX TECH** y el servicio que se desea pagar en Soles o Dólares y continuar. · `- ME para dólares` · `- MN para soles`
   4. `bcp-web-4.jpg` — Ingresar su número de DNI o RUC
   5. _(sin imagen)_ — Seleccionar las facturas a pagar y finaliza la transacción
3. **Banca por Internet** (5 pasos)
   1. `bcp-banca-1.png` — Selecciona la opción de **Pago de Servicios**
   2. `bcp-banca-2.png` — Escribir en el recuadro de búsqueda **FIBERLUX TECH** y buscar
   3. `bcp-banca-3.png` — Seleccionar el servicio que se desea pagar en Soles o Dólares y continuar. · `- ME para dólares` · `- MN para soles`
   4. `bcp-banca-4.png` — Ingresar su número de DNI o RUC
   5. `bcp-banca-5.png` — Seleccionar las facturas a pagar y finaliza la transacción. Se muestran las facturas más antiguas **PRIMERO**.

> El separador `·` arriba indica saltos de línea / párrafos dentro de la misma descripción; en el JSON se escriben con `\n`.

## Plan de implementación

Todo el trabajo vive en **un solo archivo**: `src/content/formas-de-pago/index.json`. Cada paso deja el proyecto ejecutable y es commiteable por separado.

1. **BBVA.** Reemplazar los 2 métodos actuales por los **3 reales** (Banca Móvil Personas 5 pasos, Banca Empresas 4, Banca Personas 5), con copy + rutas de imagen según el mapeo. *Test:* en `/formas-de-pago` con BBVA, el dropdown de método lista los 3; cada uno muestra sus pasos con imagen y énfasis magenta.
2. **BCP.** Reemplazar los 2 métodos actuales por los **3 reales** (Banca Móvil 4, Telecrédito 5 con paso 5 sin imagen, Banca por Internet 5). *Test:* con BCP, el dropdown lista los 3; Telecrédito muestra 5 pasos y el 5.º sin imagen (solo título + descripción).
3. **Verificación de assets.** Confirmar que cada ruta `/images/formas-de-pago/<archivo>` referenciada responde 200 y que no queda ninguna referencia a un archivo inexistente (ojo con `.jpg` vs `.png`). *Test:* `curl`/Network de cada imagen = 200; sin 404 en la página.
4. **QA visual.** Con el dev server, recorrer en `/formas-de-pago`: BBVA (3 métodos) y BCP (3 métodos). Confirmar swap sin recarga, pasos correctos, imágenes visibles, **negrita en magenta**, sub-viñetas ME/MN, y apilado en mobile. *Test:* recorrido completo sin errores de consola; `astro build` sin errores nuevos.

## Criterios de aceptación

- [ ] BBVA muestra en el dropdown de método: **Banca Móvil Personas**, **Banca Empresas**, **Banca Personas**.
- [ ] BCP muestra en el dropdown de método: **Banca Móvil**, **Telecrédito**, **Banca por Internet**.
- [ ] Cada método tiene el número correcto de pasos: BBVA 5/4/5 y BCP 4/5/5.
- [ ] Cada paso (salvo Telecrédito paso 5) muestra su **imagen** correcta desde `/images/formas-de-pago/`.
- [ ] Telecrédito paso 5 renderiza solo **título + descripción**, sin romper el layout ni dar 404.
- [ ] Las palabras clave en negrita se ven en **magenta**; las sub-viñetas `ME para dólares` / `MN para soles` se listan correctamente donde aplica.
- [ ] Los títulos de paso son **"Paso 1", "Paso 2"…** (formato corto).
- [ ] Cambiar de banco resetea el método al primero; el swap ocurre **en cliente, sin recarga**.
- [ ] Ninguna ruta de imagen apunta a un archivo inexistente (extensiones `.jpg`/`.png` correctas).
- [ ] No se modificó `tina/config.ts`, ni componentes, ni estilos, ni otras páginas.
- [ ] `astro build` termina sin errores nuevos.

## Decisiones

- **Sí:** etiquetas del método = **nombres reales** (Banca Móvil / Telecrédito / Banca por Internet; Banca Móvil Personas / Banca Empresas / Banca Personas). El banco ya lo da el primer dropdown; el cliente reconoce los nombres propios (p.ej. "Telecrédito").
- **No:** genéricos "Desde la app / Desde la web". BCP tiene **dos** métodos web (Telecrédito y Banca por Internet), así que "web" no distingue.
- **Sí:** títulos de paso **cortos** ("Paso N"). El nombre del método encabeza la lista; repetirlo en cada fila es ruido.
- **Sí:** Telecrédito con **5 pasos y el 5.º sin imagen**. El copy de los 5 pasos existe; solo faltó la captura del último. El render tolera imagen ausente; la 5.ª se sube luego por CMS.
- **No:** reutilizar una imagen para el paso 5 de Telecrédito. Mostraría una captura equivocada; mejor sin imagen.
- **Sí:** usar las imágenes **tal cual** están en `public/images/formas-de-pago/`, con sus extensiones mixtas (`.jpg`/`.png`). Evita renombrar/optimizar en este spec (va aparte si se quiere).
- **No:** tocar schema/componentes. El modelo `banks[] → methods[] → steps[]` ya soporta 3 métodos por banco; es puro contenido.
- **Sí:** conservar el orden de bancos actual (**BBVA primero**) y `optionLabel` existentes, para minimizar el cambio; la selección inicial sigue siendo primer banco + primer método.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Extensión equivocada en una ruta (`.jpg` vs `.png`) → imagen 404. | Mapeo explícito por archivo en este spec; paso 3 del plan verifica 200 en cada imagen. |
| El énfasis magenta no aplica si la negrita no se escribe como `**…**` en el string. | Seguir el formato del seed BBVA existente (`**bold**`, `\n- viñeta`), verificado en QA. |
| Telecrédito paso 5 sin imagen se ve incompleto para el cliente. | Es intencional y documentado; el cliente sube la captura faltante por CMS. Criterio de aceptación explícito de que no rompe. |
| Un párrafo con dos instrucciones (p.ej. BCP Banca Móvil paso 3) se ve amontonado. | Separar con `\n` en la descripción para que el render muestre párrafos/viñetas legibles. |

## Qué **NO** entra en este spec

- Cambios de schema (`tina/config.ts`), componentes o estilos de `/formas-de-pago`.
- Optimizar o renombrar las imágenes subidas; añadir la 5.ª imagen de Telecrédito.
- Reordenar bancos o cambiar el hero / etiquetas de los selectores.
- Integración de pago, deep-linking por banco/método, lightbox/zoom, buscador de bancos (siguen fuera, como en SPEC 14).

Cada uno de estos, si aterriza, va en su propio spec.
