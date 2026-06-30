# SPEC 01 — Portar legales OSIPTEL y editabilidad total desde fiberlux-negocios a fiberlux-corp

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-06-30
> **Objective:** Portar a fiberlux-corp el subsistema de formularios dinámicos y las páginas legales obligatorias de OSIPTEL de fiberlux-negocios, más el modo mantenimiento, y dejar 100% editable en Tina todo el contenido textual e imágenes de los bloques existentes de corp, sin alterar sus estilos.

---

## Scope

**In:**

- **Motor de formularios dinámicos.** Portar de negocios a corp: `src/components/dynamic-form/DynamicForm.astro`, `src/components/dynamic-form/DynamicFormReact.tsx`, `src/utils/submitForm.ts`, y los componentes compartidos que estos requieren (`src/components/shared/FormControls.tsx`, `src/components/shared/FormSuccess.tsx`).
- **Colección `dynamicForms`** (`src/content/dynamic-forms/`) en Tina, con los JSON de los formularios OSIPTEL: `reclamo.json`, `queja.json`, `apelacion.json`, `libro-reclamaciones.json`. Contenido copiado de negocios como base (incluye listas de distritos, campos, textos de éxito/error, privacidad).
- **Colección `formConfig`** (`src/content/form-config/index.json`) + endpoint `src/pages/form-config.json.ts`, con recipients placeholder editables en Tina para los formTypes: `reclamo`, `queja`, `apelacion`, `libro_reclamaciones`.
- **Páginas legales OSIPTEL**, en las mismas rutas que negocios y con el look claro/blanco de negocios:
  - `/legales/libro-reclamaciones` (usa `DynamicForm` slug `libro-reclamaciones`).
  - `/reclamos` (selector) + `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion`.
  - `/informacion-abonados`.
- **Colecciones de contenido editable** asociadas a esas páginas, copiadas de negocios: `complaintsForm`, `complaintsBook`, `quejaForm`, `apelacionForm`, `infoAbonados` (las que correspondan a las páginas listadas), más sus componentes `*.astro`/`*React.tsx`.
- **Componentes de reclamos**: `ReclamosSelectorReact.tsx`, `QuejaForm`, `ApelacionForm` (y `ComplaintsForm`/`ComplaintsBook`/`InfoAbonados` necesarios).
- **Modo mantenimiento**: colección `maintenance` (`src/content/maintenance/index.json`), `src/components/shared/Popup.astro` + `PopupReact.tsx`, y el wiring en `src/layouts/BaseLayout.astro`.
- **Editabilidad total de bloques corp existentes**: auditar todos los componentes de corp y exponer en Tina todo texto/imagen hoy hardcodeado (los elementos puramente decorativos/SVG se mantienen en código).
- **Enlaces en el footer** (colección `global`, editable): "Libro de Reclamaciones", "Reclamos" e "Información a Abonados".
- **CSS necesario**: portar a `src/styles/global.css` de corp únicamente las clases/estilos que el motor de formularios y las páginas legales requieran para funcionar con su look claro (sin tocar los estilos existentes de corp).

**Out of scope (para futuras specs):**

- Formularios y páginas **ARCO** (derechos de protección de datos), **FAQ de clientes**, **medios de pago**, **planes** y **listado de servicios** estilo negocios.
- Convertir la página de **Contacto** de corp en formulario funcional (se mantiene solo informativa).
- Adaptar las páginas legales al **tema oscuro** de corp (se portan con el look claro de negocios).
- Despliegue/instalación del backend **`send-email.php`** en el hosting de corp (se asume que existirá en el servidor; el repo solo apunta a él).
- Cargar la **lista final de recipients** (se dejan placeholders editables en Tina).
- Adoptar la **estructura de home** de negocios (hero slider, promo banners, etc.) — corp mantiene sus bloques.
- Exponer en Tina elementos **puramente decorativos/visuales** (SVGs, animaciones).

---

## Data model

Esta spec **reutiliza estructuras ya probadas en negocios**. No inventa formatos nuevos; copia los de producción. Se añaden estas colecciones a `tina/config.ts` de corp y sus archivos de contenido en `src/content/`.

**`dynamicForms` — `src/content/dynamic-forms/{reclamo,queja,apelacion,libro-reclamaciones}.json`**

```jsonc
{
  "formId": "libro-reclamaciones",
  "formTitle": "Libro de Reclamaciones",
  "styleVariant": "contact",        // controla el look del form
  "submitButtonText": "Enviar",
  "successTitle": "¡Registrado!",
  "successMessage": "...",
  "errorMessage": "...",
  "validationMessage": "...",
  "showCorrelativo": true,           // muestra nº correlativo devuelto por el backend
  "privacyText": "He leído y acepto...",
  "privacyUrl": "https://.../politica.pdf",
  "dataUrl": "/legales/tratamiento-datos",
  "fields": [
    {
      "fieldType": "text|email|tel|select|textarea|date|file|checkbox",
      "name": "nombre",
      "label": "Nombre",
      "placeholder": "...",
      "required": true,
      "width": "half|full",
      "order": 1,
      "options": [{ "value": "ate", "label": "Ate" }]  // solo para select
    }
  ]
}
```

**`formConfig` — `src/content/form-config/index.json`** (recipients placeholder, editables en Tina)

```jsonc
{
  "forms": [
    {
      "formType": "reclamo",         // | queja | apelacion | libro_reclamaciones
      "label": "Formulario de Reclamo OSIPTEL",
      "enabled": true,
      "recipients": ["placeholder@fiberlux.pe"]
    }
  ]
}
```

**`maintenance` — `src/content/maintenance/index.json`**

```jsonc
{
  "enabled": false,
  "title": "Estamos en mantenimiento",
  "message": "...",
  "showContact": true,
  "contactText": "Contáctanos",
  "contactUrl": "#"
}
```

**Contenido editable de páginas legales** (copiado de negocios, una colección por página): `complaintsBook` (`src/content/complaints-book/index.json`), `complaintsForm`, `quejaForm`, `apelacionForm`, `infoAbonados` (`src/content/info-abonados/index.json`). Cada una mantiene el shape exacto de negocios (títulos, textos, secciones, ítems). Se copian tal cual.

**Contrato de envío** (`src/utils/submitForm.ts`, sin cambios respecto a negocios):

```
POST {BASE_URL}/send-email.php
  - sin archivos: JSON  { formType, ...campos, website }
  - con archivos: FormData { formType, campos, website, archivo[] }
Respuesta esperada: { success: boolean, correlativo?: string, error?: string }
```

**Editabilidad de bloques corp existentes:** no introduce estructuras nuevas de datos de contenido inventadas; **extiende** las colecciones `home`, `about`, `service`, `contact`, `global` en `tina/config.ts` con los campos faltantes que hoy están hardcodeados en los `*.tsx` de corp (se enumeran y mapean en el plan de implementación, paso de auditoría).

---

## Implementation plan

Cada paso deja el proyecto compilando (`npm run dev` / `npm run build`) y es commiteable por sí solo.

1. **Preparar base.** Confirmar dependencias (corp ya tiene `react-icons`, `@tinacms/cli`, etc. — no falta ninguna). Crear carpeta `src/utils/`. _Test: `npm run dev` arranca sin errores._

2. **Portar infra compartida de formularios.** Copiar de negocios a corp: `src/utils/submitForm.ts`, `src/components/shared/FormControls.tsx`, `src/components/shared/FormSuccess.tsx`. _Test: `tsc`/dev compila sin imports rotos._

3. **Portar el motor de formularios.** Copiar `src/components/dynamic-form/DynamicForm.astro` y `DynamicFormReact.tsx`. Aún sin colección Tina (fallará la query) — se conecta en el paso 5. _Test: compila; el componente todavía no se renderiza en ninguna página._

4. **Portar CSS necesario (look claro).** Copiar a `src/styles/global.css` de corp solo las clases que el motor y las páginas legales usan (variantes de formulario, contenedores claros), sin modificar las clases existentes de corp. _Test: dev compila; estilos previos de corp intactos._

5. **Añadir colecciones `dynamicForms` y `formConfig` a `tina/config.ts`** + crear `src/pages/form-config.json.ts`. Sembrar `src/content/dynamic-forms/{reclamo,queja,apelacion,libro-reclamaciones}.json` y `src/content/form-config/index.json` (recipients placeholder), copiados de negocios. Regenerar cliente Tina. _Test: `/admin` muestra "Formularios Dinámicos" y "Configuración de formularios"; `/form-config.json` responde JSON._

6. **Página Libro de Reclamaciones.** Añadir colección `complaintsBook` a Tina + `src/content/complaints-book/index.json` (copiado). Portar `ComplaintsBook*` si la página lo usa, y crear `src/pages/legales/libro-reclamaciones/index.astro` con `<DynamicForm formSlug="libro-reclamaciones" />`. _Test: `/legales/libro-reclamaciones` carga y muestra el formulario; editable en `/admin`._

7. **Páginas de Reclamos (selector + 3 formularios).** Portar `ReclamosSelectorReact.tsx`, `QuejaForm*`, `ApelacionForm*`, `ComplaintsForm*`. Añadir colecciones `complaintsForm`, `quejaForm`, `apelacionForm` + contenido copiado. Crear `src/pages/reclamos/index.astro`, `reclamos/reclamo/index.astro`, `reclamos/queja/index.astro`, `reclamos/apelacion/index.astro`. _Test: `/reclamos` muestra selector; cada subruta carga su formulario._

8. **Página Información a Abonados.** Añadir colección `infoAbonados` + `src/content/info-abonados/index.json` (copiado), portar `InfoAbonados*`, crear `src/pages/informacion-abonados/index.astro`. _Test: `/informacion-abonados` carga y es editable._

9. **Modo mantenimiento.** Añadir colección `maintenance` + `src/content/maintenance/index.json`, portar `Popup.astro`/`PopupReact.tsx`, integrar el check de mantenimiento en `src/layouts/BaseLayout.astro` (adaptando títulos a "Fiberlux Corp"). _Test: con `enabled: true` en Tina, el sitio muestra la pantalla de mantenimiento; con `false`, todo normal._

10. **Enlaces legales en el footer.** Añadir en `src/content/global/index.json` (y, si hace falta, en el schema de `global`) los enlaces "Libro de Reclamaciones", "Reclamos" e "Información a Abonados". _Test: el footer muestra los 3 enlaces y navegan correctamente; editables en `/admin`._

11. **Auditoría de editabilidad — mapeo.** Recorrer todos los `*.tsx` de corp (`home`, `nosotros`, `blog`, `shared`, `Stats`) y listar cada texto/imagen hardcodeado que no tenga campo en Tina. Producir un mapa "componente → campo nuevo en colección". _Test: documento/lista de gaps revisable (sin cambios de código aún)._

12. **Auditoría de editabilidad — implementación.** Por cada gap del paso 11: añadir el campo a la colección correspondiente en `tina/config.ts`, sembrar su valor actual en el JSON de contenido, y reemplazar el literal en el `.tsx` por el dato de `useTina` con su `tinaField`. Hacerlo en grupos pequeños por componente. _Test: cada bloque muestra el mismo contenido que antes pero ahora editable desde `/admin`._

13. **Verificación final de build.** Regenerar cliente Tina y correr `npm run build`. _Test: build de producción sin errores; todas las rutas nuevas generadas._

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings de imports rotos.
- [ ] En `/admin` aparecen las nuevas colecciones: "Formularios Dinámicos", "Configuración de formularios", "Libro de Reclamaciones", "Formulario de Reclamo", "Formulario de Queja", "Formulario de Apelación", "Información a Abonados" y "Modo Mantenimiento".
- [ ] `/legales/libro-reclamaciones` carga y renderiza el formulario dinámico con el look claro de negocios.
- [ ] `/reclamos` muestra el selector y enlaza a `/reclamos/reclamo`, `/reclamos/queja` y `/reclamos/apelacion`, cada una con su formulario.
- [ ] `/informacion-abonados` carga y su contenido es editable desde `/admin`.
- [ ] `/form-config.json` responde un JSON con los formTypes `reclamo`, `queja`, `apelacion` y `libro_reclamaciones` y sus recipients placeholder.
- [ ] Al enviar un formulario legal, hace `POST` a `{BASE_URL}/send-email.php` con el `formType` correcto (verificable en la pestaña Network, aunque el PHP no exista todavía).
- [ ] Los formularios con `showCorrelativo: true` muestran el correlativo cuando el backend responde `{ success: true, correlativo }`.
- [ ] Editar un texto de cualquier colección legal en `/admin` y guardar cambia el contenido renderizado en la página.
- [ ] Poner `maintenance.enabled = true` en Tina hace que todo el sitio muestre la pantalla de mantenimiento; con `false`, el sitio funciona normal.
- [ ] El footer muestra los enlaces "Libro de Reclamaciones", "Reclamos" e "Información a Abonados", y son editables desde la colección `global`.
- [ ] No queda ningún texto ni imagen hardcodeado en los componentes de corp auditados (home, nosotros, blog, shared, Stats): todo proviene de Tina vía `useTina`.
- [ ] Cada bloque auditado renderiza exactamente el mismo contenido que antes del cambio (sin regresiones visuales ni de texto).
- [ ] Los estilos existentes de corp (tema oscuro, brand-purple, clases previas) no cambiaron en ninguna página preexistente.
- [ ] El blog, Nosotros y el hero Spline de corp siguen funcionando igual que antes.

---

## Decisiones

- **Sí:** portar solo los legales obligatorios de OSIPTEL (libro de reclamaciones, reclamo, queja, apelación, información a abonados). Es lo mínimo legalmente exigible en Perú y evita arrastrar páginas (ARCO, FAQ, medios de pago) que corp no necesita aún.
- **No:** portar ARCO, FAQ de clientes, medios de pago, planes ni listado de servicios. Quedan para specs futuras si se requieren.
- **Sí:** mantener los bloques actuales de corp (Spline, sticky cards, testimonios, blog, Nosotros) y solo hacerlos 100% editables. El objetivo es estructura/editabilidad, no rediseño.
- **No:** adoptar la estructura de home de negocios (hero slider, promo banners). Cambiaría la identidad visual de corp, fuera de alcance.
- **Sí:** reusar el motor de formularios dinámicos + `submitForm.ts` apuntando a `send-email.php`, asumiendo que ese backend PHP existirá en el hosting de corp. Es el patrón ya probado en producción y evita reinventar el envío.
- **No:** incluir el `send-email.php` ni su despliegue en esta spec. Vive en el servidor, no en el repo; instalarlo es tarea de infraestructura.
- **Sí:** recipients como placeholders editables en Tina. Aún no hay lista final de correos de corp y dejarlos editables evita hardcodear datos sensibles.
- **No:** reusar los correos de negocios. Son destinatarios distintos; arrastrarlos provocaría envíos a las casillas equivocadas.
- **Sí:** rutas idénticas a negocios (`/legales/libro-reclamaciones`, `/reclamos/...`, `/informacion-abonados`). Ya validadas en producción y consistentes entre ambos sitios.
- **Sí:** portar las páginas legales con el look claro/blanco de negocios. Reescribirlas al tema oscuro de corp era trabajo de estilado fuera del objetivo; se prioriza paridad funcional. Asumimos el contraste visual como aceptable por ahora.
- **No:** convertir la página de Contacto de corp en formulario funcional. Se mantiene informativa; el motor se usa solo para legales.
- **Sí:** criterio de auditoría "texto/imágenes editables; diseño no". Lo decorativo (SVGs, animaciones de sticky cards) se mantiene en código para no inflar el panel de Tina.
- **Sí:** copiar el contenido de negocios como base inicial. Deja las páginas usables de inmediato y luego se editan en Tina.
- **No:** placeholders vacíos en las páginas legales. Obligarían a redactar todo desde cero antes de tener algo funcional.
- **Sí:** añadir los enlaces legales solo al footer (no al menú principal). Es lo habitual y lo legalmente esperado, sin recargar la navegación.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `send-email.php` no existe aún en el hosting de corp → los formularios fallan al enviar en producción. | El frontend queda listo y verificable (POST en Network). Se documenta como dependencia de infraestructura; el deploy del PHP es prerrequisito antes de publicar los legales. |
| Recipients placeholder se publican por error → correos legales no llegan a nadie. | Criterio de aceptación recuerda que son placeholders; se debe configurar la lista real en Tina antes de exponer las páginas. |
| El look claro de los legales contrasta con el tema oscuro de corp y desentona. | Decisión consciente y registrada; el restyling al tema oscuro queda como spec futura si el cliente lo pide. |
| El CSS portado de negocios pisa o colisiona con clases existentes de corp en `global.css`. | Portar solo las clases que el motor/los legales necesitan, con nombres específicos; verificar que las páginas preexistentes de corp no cambian visualmente (criterio de aceptación). |
| La auditoría de editabilidad introduce regresiones de contenido al reemplazar literales por datos de Tina. | Sembrar en el JSON el valor actual exacto antes de cambiar el `.tsx`; criterio de aceptación exige render idéntico al previo, bloque por bloque. |
| Desfases de versión entre el cliente Tina generado de negocios y el de corp. | No se copian archivos de `tina/__generated__/`; se regenera el cliente con `tinacms build` en corp tras cada cambio de schema. |
| Campos de formulario con subida de archivos (`file`) dependen del manejo `FormData` del PHP. | `submitForm.ts` ya distingue JSON vs `FormData`; se prueba el envío con y sin archivos en Network. |

---

## Lo que **no** está en esta spec

- Formularios/páginas **ARCO**, **FAQ de clientes**, **medios de pago**, **planes** y **listado de servicios** estilo negocios.
- Convertir **Contacto** de corp en formulario funcional.
- Adaptar los legales al **tema oscuro** de corp (se portan con look claro).
- Despliegue/instalación del backend **`send-email.php`**.
- Cargar la **lista final de recipients** (quedan placeholders editables).
- Adoptar la **estructura de home** de negocios.

Cada uno, si se aborda, irá en su propia spec.
