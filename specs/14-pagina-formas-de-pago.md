# SPEC 14 — Página "Formas de pago" (`/formas-de-pago`)

> **Estado:** Aprobado
> **Depende de:**
> - Reutiliza `BaseLayout` (Header + Footer + maintenance + Lenis).
> - Reutiliza el patrón **hero oscuro corp** y el patrón **dual `.astro` + `React.tsx` con `useTina`** de specs previas (06/13).
> - Reutiliza el render **rich-text vía `TinaMarkdown`** ya usado en `FaqSolucionReact` / `BlogDetailReact`.
> - Enlaza la página desde el **footer** (`src/content/global/index.json`).
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Construir la ruta `/formas-de-pago` según los frames desktop y mobile de Figma — un selector de **banco** + **método** que intercambia en cliente una lista de **pasos personalizados** (título + descripción rich-text + imagen), todo alimentado por una nueva colección `formasDePago` editable desde TinaCMS y sembrada con BBVA y BCP.

---

## Alcance

**Dentro:**

- **Ruta `/formas-de-pago`.** Crear `src/pages/formas-de-pago/index.astro` que hereda `BaseLayout` y compone la página (hero + selector + pasos).

- **Enlace en el footer.** Agregar el enlace **"Formas de pago" → `/formas-de-pago`** en `src/content/global/index.json`, en la columna **"Sobre nosotros"** (junto a Soporte técnico / Contacto). Único cambio de navegación.

- **Hero (patrón dual)** `src/components/formas-de-pago/HeroFormasPago.astro` + `HeroFormasPagoReact.tsx`, tema oscuro:
  - H1 editable ("Selecciona tu banco y paga tus recibos de manera sencilla"), sin breadcrumb. Párrafo intro opcional editable.

- **Selector + lista de pasos (isla React)** `FormasPagoSelector.astro` + `FormasPagoSelectorReact.tsx`:
  - **Dos dropdowns**: banco ("Desde BBVA") y método ("Desde la aplicación"). El de método muestra solo los métodos del banco seleccionado.
  - Al cambiar banco o método, la **lista de pasos se intercambia en cliente** (sin recarga). Todo el contenido va en el HTML estático y se filtra en cliente.
  - Selección inicial: primer banco + su primer método.
  - **Lista de pasos** del método activo: cada paso = título (ej. "Banca Móvil Personas – Paso 1"), descripción **rich-text** (con énfasis magenta y sub-viñetas) e **imagen** a la derecha (placeholder editable). En mobile se apila: título → descripción → imagen.

- **Nueva colección `formasDePago`** en `tina/config.ts` (documento único, `create/delete: false`) + `src/content/formas-de-pago/index.json`: contenido del hero y una lista **anidada** `banks[] → methods[] → steps[]` (ver Modelo de datos).

- **Sembrado de contenido:** **BBVA** y **BCP**, cada uno con métodos **"Desde la aplicación"** y **"Desde la web"**; solo **BBVA → app** con los **5 pasos reales** del diseño (1:1 contra la referencia); el resto con pasos placeholder marcados. Imágenes de pasos como placeholders (se suben en el CMS).

- **SEO/meta** de la página con fallback a `global.seo` (mismo patrón que specs previas).

- **QA visual** contra `references/Formas de pago desktop.jpg` (~1440px) y `references/Formas de pago mobile.jpg` con Playwright MCP (screenshots en `.playwright-screens/`).

**Fuera de alcance (para futuras specs):**

- **Redirigir a la banca real / integración de pago.** La página es informativa (pasos guía); no procesa pagos ni enlaza a la banca de cada banco.
- **Deep-linking por banco/método** (ej. `?banco=bbva&metodo=web` o rutas separadas). El swap es solo estado en cliente; no se sincroniza con la URL.
- **Buscador/filtro de bancos.** Con 2 bancos basta un dropdown; un buscador va en otra spec si la lista crece.
- **Lightbox/zoom de las imágenes de pasos.** Se muestran inline como en el diseño.
- **Rediseñar** Header / Footer / maintenance / Lenis / el hero 3D.
- **Editar el segundo eje como matriz banco×método global.** Los métodos y pasos viven anidados dentro de cada banco, no en una matriz compartida.

---

## Modelo de datos

Introduce **una colección nueva** (`formasDePago`, documento único). Estructura anidada de 3 niveles: `banks[] → methods[] → steps[]`. Cada paso lleva descripción **rich-text** (para el énfasis magenta y las sub-viñetas) e imagen opcional.

### 1. Colección `formasDePago` en `tina/config.ts` (documento único)

```js
{
  name: "formasDePago",
  label: "Formas de pago (página)",
  path: "src/content/formas-de-pago",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    // ── Hero ──
    { name: "heading", label: "Título (H1)", type: "string", ui: { component: "textarea" } },
    { name: "intro",   label: "Párrafo intro (opcional)", type: "string", ui: { component: "textarea" } },

    // ── Etiquetas de los selectores ──
    { name: "bankSelectLabel",   label: "Placeholder selector de banco",  type: "string" }, // "Selecciona tu banco"
    { name: "methodSelectLabel", label: "Placeholder selector de método", type: "string" }, // "Selecciona el método"

    // ── Bancos (nivel 1) ──
    { name: "banks", label: "Bancos", type: "object", list: true,
      ui: { itemProps: (b) => ({ label: b?.name || "Banco" }) },
      fields: [
        { name: "name",      label: "Nombre del banco", type: "string" },              // "BBVA"
        { name: "optionLabel", label: "Texto en el dropdown", type: "string" },         // "Desde BBVA"

        // ── Métodos (nivel 2) ──
        { name: "methods", label: "Métodos", type: "object", list: true,
          ui: { itemProps: (m) => ({ label: m?.label || "Método" }) },
          fields: [
            { name: "label", label: "Texto en el dropdown", type: "string" },           // "Desde la aplicación"

            // ── Pasos (nivel 3) ──
            { name: "steps", label: "Pasos", type: "object", list: true,
              ui: { itemProps: (s) => ({ label: s?.title || "Paso" }) },
              fields: [
                { name: "title",       label: "Título del paso", type: "string" },       // "Banca Móvil Personas – Paso 1"
                { name: "description", label: "Descripción", type: "rich-text" },         // énfasis magenta + sub-viñetas
                { name: "image",       label: "Imagen del paso", type: "image" },         // placeholder editable
              ]},
          ]},
      ]},

    // ── SEO / meta (cae a global.seo si vacío) ──
    { name: "seo", label: "SEO / Meta", type: "object", fields: [
      { name: "metaTitle",       label: "Meta título", type: "string" },
      { name: "metaDescription", label: "Meta descripción", type: "string", ui: { component: "textarea" } },
      { name: "ogImage",         label: "Imagen OG", type: "image" },
    ]},
  ],
}
```

### 2. Contenido sembrado `src/content/formas-de-pago/index.json` (extracto)

```jsonc
{
  "heading": "Selecciona tu banco y paga tus recibos de manera sencilla",
  "intro": "",
  "bankSelectLabel": "Selecciona tu banco",
  "methodSelectLabel": "Selecciona el método",
  "banks": [
    {
      "name": "BBVA",
      "optionLabel": "Desde BBVA",
      "methods": [
        {
          "label": "Desde la aplicación",
          "steps": [
            {
              "title": "Banca Móvil Personas – Paso 1",
              "description": /* rich-text */ "Seleccione la opción de: **Pagar Servicio**",
              "image": "/uploads/formas-pago/bbva-app-paso1.png"
            },
            {
              "title": "Banca Móvil Personas – Paso 2",
              "description": "Seleccionar: **Agregar servicio a pagar**",
              "image": "/uploads/formas-pago/bbva-app-paso2.png"
            },
            {
              "title": "Banca Móvil Personas – Paso 3",
              "description": "Escribir **FIBERLUX TECH** en el cuadro de búsqueda y seleccionar el tipo de moneda según la factura\n- ME para dólares\n- MN para soles",
              "image": "/uploads/formas-pago/bbva-app-paso3.png"
            },
            {
              "title": "Banca Móvil Personas – Paso 4",
              "description": "Colocar su número de DNI o RUC que figura en la factura",
              "image": "/uploads/formas-pago/bbva-app-paso4.png"
            },
            {
              "title": "Banca Móvil Personas – Paso 5",
              "description": "Seleccionar el servicio a pagar. La deuda figura en orden de antigüedad, así que verá primero la deuda más vencida.",
              "image": "/uploads/formas-pago/bbva-app-paso5.png"
            }
          ]
        },
        { "label": "Desde la web", "steps": [ /* 1 paso placeholder marcado */ ] }
      ]
    },
    {
      "name": "BCP",
      "optionLabel": "Desde BCP",
      "methods": [
        { "label": "Desde la aplicación", "steps": [ /* pasos placeholder marcados */ ] },
        { "label": "Desde la web",        "steps": [ /* pasos placeholder marcados */ ] }
      ]
    }
  ],
  "seo": {
    "metaTitle": "Formas de pago | Fiberlux Corp",
    "metaDescription": "Aprende a pagar tus recibos de Fiberlux desde tu banco de forma sencilla, paso a paso.",
    "ogImage": ""
  }
}
```

> El campo `description` real es rich-text de Tina (estructura JSON, no string plano); arriba se muestra en markdown por brevedad.

**Notas del modelo:**

- **Énfasis magenta:** en el render, `TinaMarkdown` sobreescribe `bold`/`strong` para pintarlos en `brand-purple` (magenta del diseño). El editor solo aplica **negrita**; el color lo da el render. Las **sub-viñetas** ("– ME para dólares") son una lista rich-text estándar.
- **Filtrado en cliente:** el `.astro` resuelve toda la estructura `banks[]` vía `client` y la pasa al island; el swap banco/método es solo estado React (índices), sin recarga.
- **Selección inicial determinista:** primer banco de `banks[]` y su primer método; si un método no tiene `steps`, la lista se muestra vacía sin romper.
- **Assets:** las imágenes de pasos (`image`) van a `public/uploads/formas-pago/`; el sembrado deja rutas placeholder y los reales se suben en el CMS. Un paso sin imagen renderiza solo título + descripción.

---

## Plan de implementación

> Todo el trabajo vive en: nueva colección `formasDePago` (`tina/config.ts` + `src/content/formas-de-pago/index.json`), nuevos componentes en `src/components/formas-de-pago/`, la página `src/pages/formas-de-pago/index.astro`, y un enlace nuevo en `src/content/global/index.json`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `formasDePago`** en `tina/config.ts` (documento único, `create/delete: false`) con los campos del Modelo de datos (hero + selectores + `banks[] → methods[] → steps[]` + `seo`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` aparece **Formas de pago (página)** con la estructura anidada editable (bancos, métodos, pasos con rich-text e imagen).

2. **Sembrar `src/content/formas-de-pago/index.json`** con el hero + BBVA (app con los 5 pasos reales del diseño; web placeholder) + BCP (app y web placeholder). *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Hero (patrón dual)** — `HeroFormasPago.astro` (resuelve `formasDePago` vía `client`, pasa `{query, variables, data}`) + `HeroFormasPagoReact.tsx` (envuelve en `useTina`; H1 + intro opcional con `data-tina-field`, tema oscuro, sin breadcrumb). *Test:* compila; aún no enlazado a la ruta.

4. **Ruta `/formas-de-pago`** — `src/pages/formas-de-pago/index.astro` con `BaseLayout` + `<HeroFormasPago />` + SEO (fallback a `global.seo`). *Test:* `/formas-de-pago` carga con el hero oscuro (H1); Header/Footer existentes presentes.

5. **Lista de pasos (render estático)** — `FormasPagoSelectorReact.tsx`: dado un método, renderiza su `steps[]` (título + descripción rich-text vía `TinaMarkdown` con `bold`→magenta + imagen a la derecha). Fila alterna/separador como el diseño. Mobile apila título → descripción → imagen. *Test:* con BBVA→app fijo, se ven los 5 pasos 1:1 con la referencia (magenta y sub-viñetas correctos).

6. **Selectores + swap en cliente** — agregar los dos dropdowns (banco + método) al island: estado de índice de banco y de método; el dropdown de método lista solo los métodos del banco activo; al cambiar banco se resetea al primer método. La lista de pasos se intercambia al instante. Selección inicial: primer banco + primer método. *Test:* cambiar banco/método intercambia los pasos sin recarga; BCP y "Desde la web" muestran sus placeholders; sin métodos/pasos no rompe.

7. **Montar el selector en la página** — `FormasPagoSelector.astro` (resuelve `formasDePago` vía `client`) + montar `<FormasPagoSelector />` bajo el hero en `index.astro`. *Test:* la página completa carga: hero → selectores → pasos → Footer.

8. **Enlace del footer** — en `src/content/global/index.json`, agregar `{ "text": "Formas de pago", "url": "/formas-de-pago" }` a la columna "Sobre nosotros". *Test:* el enlace del footer navega a `/formas-de-pago` sin 404.

9. **QA visual desktop + mobile.** Comparar `/formas-de-pago` contra `references/Formas de pago desktop.jpg` (~1440px) y `references/Formas de pago mobile.jpg` con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar hero, dropdowns, filas de paso (título, magenta, sub-viñetas, imagen, separadores) y el apilado mobile hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–2 dejan schema y contenido listos; 3–4 levantan la página navegable con el hero; 5–7 construyen el render de pasos y luego el swap; 8–9 cierran navegación y QA.
- Orden de secciones en la página: **Hero → Selectores + pasos → Footer.**
- Los métodos/pasos placeholder se sirven del mismo render; su QA fino queda para cuando su copy/imágenes reales existan (BBVA→app es la referencia de validación).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] La ruta `/formas-de-pago` carga y renderiza, en orden: **hero**, **selectores + lista de pasos** y el **Footer** existente.
- [ ] El hero muestra el H1 "Selecciona tu banco y paga tus recibos de manera sencilla" (sin breadcrumb) sobre fondo oscuro; el intro opcional se muestra solo si tiene contenido.
- [ ] Hay **dos dropdowns**: banco y método; el de método lista **solo los métodos del banco seleccionado**.
- [ ] Al cargar, está seleccionado el **primer banco** y su **primer método**, y se ven sus pasos.
- [ ] Cambiar el banco o el método **intercambia la lista de pasos en cliente, sin recargar** la página; al cambiar de banco, el método se resetea al primero de ese banco.
- [ ] Cada paso renderiza **título**, **descripción rich-text** e **imagen** (a la derecha en desktop, apilada en mobile).
- [ ] Las palabras en **negrita** de la descripción se muestran en **magenta** (`brand-purple`) y las **sub-viñetas** ("– ME para dólares / – MN para soles") se listan correctamente.
- [ ] BBVA → "Desde la aplicación" muestra los **5 pasos reales** 1:1 con `references/Formas de pago desktop.jpg`.
- [ ] BCP y el método "Desde la web" muestran sus **pasos placeholder** sin romper el layout.
- [ ] Un método **sin pasos** no rompe la página (lista vacía); un paso **sin imagen** renderiza solo título + descripción.
- [ ] En `/admin` existe la colección **Formas de pago (página)** con el hero, los placeholders de selectores y la estructura anidada **Bancos → Métodos → Pasos** (título, descripción rich-text, imagen); editar/agregar/quitar/reordenar cualquier banco, método o paso se refleja en la página sin tocar código.
- [ ] El enlace **"Formas de pago"** del footer (columna "Sobre nosotros") navega a `/formas-de-pago` sin 404.
- [ ] La página define **SEO/meta** editable (`seo.metaTitle/metaDescription/ogImage`); si vacíos, cae al default de `global.seo`.
- [ ] En **desktop (~1440px)** el layout coincide con `references/Formas de pago desktop.jpg`.
- [ ] En **mobile** el layout coincide con `references/Formas de pago mobile.jpg` (hero, dropdowns y pasos apilados en una columna).
- [ ] El H1, intro, etiquetas de selectores y textos de bancos/métodos/pasos son editables desde Tina (`data-tina-field` donde aplique).
- [ ] No se modificaron Header, Footer (salvo el enlace nuevo en `global`), maintenance, Lenis ni otras páginas.

---

## Decisiones

- **Sí:** **página nueva `/formas-de-pago`** con `BaseLayout` y patrón dual (`.astro` + `React.tsx` con `useTina`), como el resto del proyecto. El usuario lo eligió; slug descriptivo.
- **Sí:** **modelo anidado `banks[] → methods[] → steps[]`** (documento único). Cada banco tiene sus métodos y cada método su propia lista de pasos, porque "cada paso es diferente en cada banco" y el diseño muestra dos ejes (banco + método). Descartada una matriz banco×método global: acopla más y no aporta con 2 bancos.
- **No:** **modelo plano `banks[] → steps[]`** (segundo selector fijo). El diseño ya muestra un segundo dropdown real ("Desde la aplicación") y el usuario confirmó que el método es un eje propio; aplanarlo obligaría a rehacer el schema al agregar "web".
- **Sí:** **swap en cliente (isla React)**, todo el contenido en el HTML estático y filtrado por estado. Coincide con el diseño de dropdowns, es instantáneo y SSG-friendly. Descartadas páginas/URLs separadas por banco (recarga, no coincide con el diseño).
- **No:** **deep-linking en la URL** (`?banco=&metodo=`). Fuera de alcance; el swap es solo estado. Si se necesita compartir un banco concreto por link, irá en otra spec.
- **Sí:** **descripción de paso en rich-text** (`type: "rich-text"`), renderizada con `TinaMarkdown` (patrón de `FaqSolucionReact`/`BlogDetailReact`). Soporta el énfasis y las sub-viñetas del diseño de forma editable.
- **Sí:** **magenta por render, no por editor.** El override de `bold`→`brand-purple` en `TinaMarkdown` pinta el énfasis; el editor solo aplica negrita. Evita pedirle color manual al editor y mantiene consistencia de marca. Descartado un campo de color por paso (overengineering).
- **Sí:** **imagen por paso (opcional), placeholder ahora.** El diseño tiene una imagen por paso; se dejan rutas placeholder en `public/uploads/formas-pago/` y se suben en el CMS. Un paso sin imagen no rompe.
- **Sí:** **sembrar BBVA (app real) + BCP + método web, resto placeholder.** Valida BBVA→app 1:1 contra la única referencia visual sin bloquear en copy/imágenes inexistentes; deja la estructura de 2 bancos × 2 métodos lista para llenar en Tina.
- **Sí:** **colección single-doc con listas anidadas**, patrón de `about`/`contact`/`casosDeExito`. Es una sola landing; multi-doc añadiría overhead sin rutas de detalle.
- **Sí:** **enlace en el footer, columna "Sobre nosotros"** (junto a Soporte técnico / Contacto). Es la columna de ayuda/atención más afín; `informacion-abonados` hoy no está en el footer, así que se elige la columna existente más cercana. Ajustable si el usuario prefiere otra.
- **Sí:** **SEO editable con fallback a `global.seo`**, como specs previas. `ogImage` queda modelado aunque `BaseLayout` hoy no emita OG (limitación transversal ya documentada en SPEC 13).
- **No:** **integración de pago / redirección a la banca real, lightbox de imágenes, buscador de bancos.** Fuera de alcance; la página es informativa (guía paso a paso).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **magenta** aplicado vía override de `bold` en `TinaMarkdown` afecta todo el sitio o no aplica solo aquí. | El override de componentes se pasa **local** a la instancia de `TinaMarkdown` de este componente; no toca el render global. QA del énfasis en los 5 pasos reales. |
| Nuevas **clases Tailwind** (fondo del dropdown, separadores, magenta) fallan en dev por staleness del JIT (memoria del proyecto). | Usar tokens/clases existentes de `global.css` o estilos inline; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El **swap banco→método** deja un método fuera de rango al cambiar de banco (el índice de método viejo no existe en el nuevo banco). | Al cambiar de banco, **resetear** el índice de método a `0`; clamp defensivo si el método seleccionado no existe. Criterio de aceptación explícito. |
| Un banco **sin métodos** o un método **sin pasos** (placeholder incompleto) rompe el render o deja el dropdown vacío. | Fallbacks: sin métodos, el segundo dropdown se oculta/deshabilita; sin pasos, lista vacía sin reventar. Criterio de aceptación explícito. |
| Las **rutas de imágenes placeholder** del sembrado quedan en 404 hasta que se suban las reales. | Documentar que las imágenes reales se suben en el CMS; el render tolera imagen ausente (solo título + descripción). |
| El **dropdown nativo `<select>`** oscuro no coincide con el estilo del diseño en todos los navegadores. | Estilizar con las clases del proyecto; si el `<select>` nativo no basta para el look del Figma, dropdown custom accesible (botón + lista, teclado y foco visible) — decisión de QA visual. |
| El campo `image` de Tina usado para imágenes de pasos se confunde con otros assets. | Media a `public/uploads/formas-pago/`; label claro ("Imagen del paso") por paso. |

---

## Qué **NO** entra en este spec

- Integración de pago / redirección a la banca real de cada banco.
- Deep-linking por banco/método en la URL o rutas separadas por banco.
- Buscador/filtro de bancos.
- Lightbox/zoom de las imágenes de pasos.
- Matriz banco×método global (los métodos y pasos viven anidados por banco).
- Rediseñar Header / Footer / maintenance / Lenis / hero 3D.

Cada uno de estos, si aterriza, va en su propio spec.
