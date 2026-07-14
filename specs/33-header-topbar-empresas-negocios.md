# SPEC 33 — Nuevo Header: top bar Empresas/Negocios + navbar inline (legales en hamburguesa)

> **Estado:** Implementado
> **Depende de:** SPEC 09 (jerarquía `nav.links` de 3 niveles, reutilizada intacta para el menú mobile y los submenús hover de desktop), SPEC 07 (columna "Legales" del footer, reusada como fuente de los legales), SPEC 16 (theme claro/oscuro del header, se conserva).
> **Fecha:** 2026-07-14
> **Objetivo:** Crear un Header nuevo (top bar con switcher **Empresas** (activo) / **Negocios** (externo) + link "Información a abonados y usuarios", y barra principal con **navbar horizontal inline** en desktop) donde la **hamburguesa en desktop muestra solo Soporte técnico + legales**, dejando el Header antiguo comentado pero presente.

---

## Alcance

**Dentro:**

- **Componentes nuevos** (`HeaderV2.astro` + `HeaderV2React.tsx`) que reemplazan al Header en `BaseLayout.astro`. Los archivos antiguos (`Header.astro`, `HeaderReact.tsx`) **quedan intactos** en el repo; en `BaseLayout.astro` se **comenta** el import/uso viejo y se usa el nuevo.
- **Top bar** (barra superior fina, en desktop y mobile):
  - Izquierda: **Empresas** (activo, subrayado magenta, enlaza a `/`) y **Negocios** (externo → `https://negocios.fiberlux.pe/`, `target="_blank"`).
  - Derecha (**solo desktop**): **"Información a abonados y usuarios"** → `/informacion-abonados`. Oculto en mobile.
- **Barra principal:**
  - Izquierda: **hamburguesa** (3 líneas) + **logo FIBERLUX** agrupados (el logo deja de estar centrado; va junto a la hamburguesa como en la referencia).
  - Derecha (**solo desktop**): **navbar horizontal inline**: Soluciones · Nosotros · Casos de éxito · Blog · Contacto. Soluciones y Nosotros revelan su submenú (nivel 2) al **hover**; Casos de éxito, Blog y Contacto son links planos.
  - Mobile: solo hamburguesa + logo (sin navbar inline).
- **Hamburguesa:**
  - **Desktop:** el overlay muestra **Soporte técnico** (arriba) + los **legales** (columna "Legales" del footer). Nada más.
  - **Mobile:** mantiene el **menú multinivel actual completo** (Soluciones→subservicios drill, Nosotros→Casos de éxito/Blog, Soporte técnico, Contacto) + los **legales** bajo un divisor al final.
- **Top bar editable en CMS:** nuevo objeto `header` en la colección `global` (labels + URLs de Empresas/Negocios/Abonados + orden del navbar desktop). Regenerar el cliente Tina.
- **Conservar:** theme claro/oscuro (SPEC 16), fondo al scroll, ocultar-al-scroll en mobile, bloqueo de scroll del body, redes sociales al pie del overlay, animación de apertura.
- **QA visual** contra las dos referencias (desktop + mobile) con Playwright MCP.

**Fuera de alcance (para otras specs):**

- **Borrar** el Header antiguo o sus archivos. Solo se comenta su uso en `BaseLayout.astro`.
- **Reestructurar `nav.links`** (se reutiliza tal cual). La promoción de Casos de éxito/Blog a nivel superior ocurre solo en la lista del **navbar desktop** (`header.desktopNav`), no en `nav.links`.
- **Rediseñar el Footer**, `maintenance` u otros componentes.
- **Crear páginas destino** nuevas (todas las rutas del navbar y del top bar ya existen).
- **Menú mega/dropdown rediseñado** más allá de reubicar el submenú hover existente bajo el navbar inline.

---

## Modelo de datos

Dos ideas centrales: **se reutiliza** todo lo que ya existe (nav multinivel + columna de legales) y **solo se añade** un objeto `header` para el top bar y el orden del navbar desktop. Así el navbar de la referencia (con Casos de éxito/Blog promovidos) y el menú multinivel de mobile conviven **sin duplicar contenido de submenús**: el navbar desktop resuelve sus submenús *hover* buscando por `url` dentro de `nav.links`.

### 1. Reutilizado sin cambios

| Fuente | Uso |
|---|---|
| `nav.links[]` (3 niveles, SPEC 09) | Menú **multinivel mobile** (drill completo) + **submenús hover** del navbar desktop (matcheo por `url`). No se toca su contenido. |
| `footer.columns[]` con `title: "Legales"` | Lista de **legales** que muestra la hamburguesa (desktop y mobile). Single-source; no se copia. |
| `nav.links[]` item *Soporte técnico* (`/soporte-tecnico`) | Link **Soporte técnico** que va arriba de los legales en la hamburguesa **desktop**. |
| `footer.social[]` | Redes sociales al pie del overlay (igual que hoy). |

### 2. Schema nuevo — objeto `header` en `global` (`tina/config.ts`)

Hoy **no existe** un objeto `header` en el schema (el `headerConfig?.logo` del código actual cae siempre al default). Se añade dentro de `fields` de la colección `global`:

```js
{
  name: "header",
  label: "Header (top bar / navbar)",
  type: "object",
  fields: [
    { name: "logo", label: "Logo", type: "image" }, // opcional; default /images/logo/fiberlux.svg
    {
      name: "topBar", label: "Barra superior", type: "object",
      fields: [
        { name: "empresasLabel", label: "Texto 'Empresas'", type: "string" },
        { name: "empresasUrl",   label: "URL 'Empresas'",   type: "string" }, // "/"
        { name: "negociosLabel", label: "Texto 'Negocios'", type: "string" },
        { name: "negociosUrl",   label: "URL 'Negocios' (externa)", type: "string" }, // https://negocios.fiberlux.pe/
        { name: "abonadosLabel", label: "Texto 'Información a abonados' (solo desktop)", type: "string" },
        { name: "abonadosUrl",   label: "URL 'Información a abonados'", type: "string" }, // /informacion-abonados
      ],
    },
    {
      name: "desktopNav", label: "Navbar desktop (orden)", type: "object", list: true,
      description: "Ítems horizontales en desktop. Si el URL coincide con un link de 'Navegación' con submenú, se revela al hover.",
      ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
      fields: [
        { name: "text", label: "Texto", type: "string" },
        { name: "url",  label: "URL",   type: "string" },
      ],
    },
  ],
}
```

Tras editar: regenerar el cliente Tina (`npm run dev`/`build` corre `tinacms build`) para que la query `global` incluya `header.topBar` y `header.desktopNav`.

### 3. Contenido — `header` en `src/content/global/index.json`

```jsonc
"header": {
  "topBar": {
    "empresasLabel": "Empresas",  "empresasUrl": "/",
    "negociosLabel": "Negocios",  "negociosUrl": "https://negocios.fiberlux.pe/",
    "abonadosLabel": "Información a abonados y usuarios", "abonadosUrl": "/informacion-abonados"
  },
  "desktopNav": [
    { "text": "Soluciones",     "url": "/soluciones" },      // hover → children de nav.links (/soluciones)
    { "text": "Nosotros",       "url": "/nosotros" },        // hover → children de nav.links (/nosotros): Casos de éxito, Blog
    { "text": "Casos de éxito", "url": "/casos-de-exito" },  // plano
    { "text": "Blog",           "url": "/blog" },            // plano
    { "text": "Contacto",       "url": "/contacto" }         // plano
  ]
}
```

### 4. Lógica de resolución (en `HeaderV2React.tsx`)

- **Navbar desktop:** itera `header.desktopNav`. Para cada ítem, `navChildren = nav.links.find(l => l.url === item.url)?.children`. Si tiene hijos → link con **dropdown hover** (nivel 2, igual que la regla "solo 2 niveles en desktop" de SPEC 09). Si no → link plano.
- **Hamburguesa desktop:** un link **Soporte técnico** (tomado de `nav.links` por url `/soporte-tecnico`) + la lista de la columna `footer.columns` con `title === "Legales"`.
- **Hamburguesa mobile:** el render multinivel actual de `nav.links` **intacto** + los mismos legales bajo un divisor al final.
- **Top bar:** `header.topBar`; "Empresas" activo (subrayado magenta) enlaza a `empresasUrl`; "Negocios" con `target="_blank" rel="noopener"`; "Información a abonados" oculto en `<768px` (`hidden md:block`).

### 5. Tipos nuevos en `HeaderV2React.tsx`

`interface TopBar { empresasLabel; empresasUrl; negociosLabel; negociosUrl; abonadosLabel; abonadosUrl }`, `interface DesktopNavItem { text; url }`. Se reutilizan `NavLink/NavChild/NavGrandChild` (idénticos al Header actual) para el menú mobile y los submenús hover.

---

## Plan de implementación

El trabajo vive en `tina/config.ts` (schema `header`), `src/content/global/index.json` (contenido `header`), dos componentes nuevos en `src/components/shared/` y el punto de aplicación en `src/layouts/BaseLayout.astro`. Cada paso deja el proyecto ejecutable.

1. **Schema `header` en `tina/config.ts`.** Añadir el objeto `header` (logo + `topBar` + `desktopNav`) a la colección `global`. Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` → Global aparece la sección "Header (top bar / navbar)" con sus campos editables.

2. **Contenido `header` en `src/content/global/index.json`.** Agregar el bloque `header` del modelo de datos (top bar + `desktopNav` con los 5 ítems de la referencia). *Test:* el JSON valida contra el schema; la query `global` devuelve `header.topBar` y `header.desktopNav`.

3. **`HeaderV2React.tsx` — shell + top bar.** Nuevo componente basado en el shell del `HeaderReact` actual (barra fija, fondo al scroll, ocultar-al-scroll mobile, bloqueo de scroll del body, theme claro/oscuro de SPEC 16). Render del **top bar**: Empresas (activo/subrayado) + Negocios (externo) a la izquierda; "Información a abonados y usuarios" a la derecha (`hidden md:block`). Barra principal con hamburguesa + logo agrupados a la izquierda. *Test:* el top bar coincide con la referencia; en mobile el link de abonados no se muestra; el logo va junto a la hamburguesa.

4. **Navbar inline desktop (hover reveal).** A la derecha de la barra principal (`hidden md:flex`), renderizar `header.desktopNav`. Cada ítem con `nav.links.find(url)` con hijos abre su **dropdown hover** de nivel 2; los demás son links planos que navegan. Reusar la lógica/estilo de reveal de SPEC 09 adaptada a un dropdown anclado al ítem. *Test:* hover sobre Soluciones muestra las 4 soluciones; hover sobre Nosotros muestra Casos de éxito/Blog; Casos de éxito, Blog y Contacto navegan directo; el ítem con hover se subraya.

5. **Hamburguesa desktop — Soporte técnico + legales.** El overlay/dropdown de la hamburguesa en desktop muestra el link **Soporte técnico** (de `nav.links` por `/soporte-tecnico`) y debajo la lista de la columna `footer.columns` con `title === "Legales"`. Sin nav principal. *Test:* en desktop, abrir la hamburguesa muestra Soporte técnico + los ~11 legales y nada más.

6. **Hamburguesa mobile — nav multinivel + legales.** En mobile la hamburguesa reutiliza el **render multinivel completo** de `nav.links` (drill actual, texto navega / flecha drillea, hermanos bajo divisor, botón "Atrás") + los legales bajo un divisor al final. Redes sociales al pie. *Test:* en mobile el drill de Soluciones→subservicios y Nosotros→Casos/Blog funciona igual que hoy; al final aparecen los legales; Soporte técnico sigue presente como ítem del nav.

7. **Aplicar en `BaseLayout.astro`.** Comentar el import y el uso de `Header` antiguo (dejándolos en el archivo) e importar/usar `HeaderV2` con el mismo prop `theme={headerTheme}`. *Test:* todas las páginas renderizan el Header nuevo; el antiguo queda comentado y recuperable.

8. **Reset de estado + QA visual.** Al cerrar el overlay o cruzar el breakpoint (768px), limpiar estado de navegación (hover desktop / drill mobile). QA con Playwright MCP contra las referencias desktop y mobile (screenshots en `.playwright-screens/`). *Test:* `npm run build` sin errores/warnings nuevos; QA aprobado en ambos breakpoints; sin errores de consola al navegar los menús.

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos.
- [ ] En `/admin` → Global aparece la sección **"Header (top bar / navbar)"** con `topBar` (Empresas/Negocios/Abonados: label + URL) y `desktopNav` (lista ordenada), editable sin tocar código.
- [ ] **Top bar (ambos breakpoints):** a la izquierda **Empresas** (activo, subrayado magenta, enlaza a `/`) y **Negocios** (abre `https://negocios.fiberlux.pe/` en pestaña nueva).
- [ ] **Top bar:** "Información a abonados y usuarios" (→ `/informacion-abonados`) se muestra **solo en desktop** y está **oculto en mobile**.
- [ ] **Barra principal:** hamburguesa (3 líneas) + logo FIBERLUX agrupados a la izquierda (el logo ya no está centrado).
- [ ] **Desktop (≥768px):** navbar horizontal inline a la derecha con Soluciones · Nosotros · Casos de éxito · Blog · Contacto, en ese orden.
- [ ] **Desktop:** hover sobre **Soluciones** revela sus 4 soluciones; hover sobre **Nosotros** revela Casos de éxito + Blog; el ítem con hover se subraya. **Casos de éxito**, **Blog** y **Contacto** navegan directo (sin submenú).
- [ ] **Desktop:** la **hamburguesa** muestra **Soporte técnico** + los legales (columna "Legales" del footer) y **nada del nav principal**.
- [ ] **Mobile (<768px):** no hay navbar inline; la hamburguesa muestra el **menú multinivel completo** (Soluciones→subservicios drill, Nosotros→Casos de éxito/Blog, Soporte técnico, Contacto) **+ los legales bajo un divisor** al final.
- [ ] Los **legales** salen de la columna `footer.columns` con `title === "Legales"` (single-source, no duplicados).
- [ ] El Header antiguo (`Header.astro`, `HeaderReact.tsx`) **sigue en el repo intacto**; en `BaseLayout.astro` su import/uso está **comentado** y se usa `HeaderV2`.
- [ ] Se conservan: theme claro/oscuro (SPEC 16), fondo al scroll, ocultar-al-scroll en mobile, bloqueo de scroll del body, redes sociales al pie del overlay, animación de apertura.
- [ ] Al cerrar/reabrir la hamburguesa o cruzar el breakpoint, no queda estado residual (hover/drill reseteados).
- [ ] Todas las rutas del navbar y del top bar navegan sin 404 (`/soluciones`, `/nosotros`, `/casos-de-exito`, `/blog`, `/contacto`, `/informacion-abonados`, `/soporte-tecnico`).
- [ ] QA visual aprobado contra las referencias desktop y mobile.
- [ ] No hay errores en consola al abrir los menús y navegar en ambos breakpoints.

---

## Decisiones tomadas y descartadas

- **Sí:** **Header nuevo en archivos separados** (`HeaderV2.astro` + `HeaderV2React.tsx`) y **comentar el uso del antiguo** en `BaseLayout.astro`, dejándolo intacto. *(Elección del usuario: "el antiguo solo coméntalo, pero hay que dejarlo por si acaso".)*
- **No:** reescribir los mismos archivos dejando el código viejo comentado dentro. Se prefiere separación limpia y reversible.
- **Sí:** en **desktop, nav principal como navbar horizontal inline**; la hamburguesa queda para **Soporte técnico + legales**. *(Elección del usuario.)*
- **Sí:** **navbar desktop editable** vía nueva lista `header.desktopNav`, en vez de reestructurar `nav.links`. Permite el orden/promoción de la referencia (Casos de éxito y Blog a nivel superior) sin alterar el nav multinivel de mobile ni los submenús hover. *(Confirmado por el usuario.)*
- **No:** promover Casos de éxito/Blog dentro de `nav.links`. Rompería el menú multinivel mobile (donde siguen colgando de Nosotros).
- **Sí:** **submenús hover** de Soluciones/Nosotros resueltos por **matcheo de `url`** contra `nav.links` (single-source de submenús). *(Confirmado.)*
- **Sí:** **legales single-source** desde la columna "Legales" del footer (matcheo por título). *(Confirmado.)* Evita duplicar ~11 links.
- **No:** crear una lista de legales nueva e independiente en el CMS. Se descarta para no mantener dos fuentes.
- **Sí:** **Soporte técnico** en la hamburguesa desktop tomado de `nav.links` por `/soporte-tecnico`. *(Confirmado.)* No se pierde al salir del navbar.
- **Sí:** **top bar en ambos breakpoints**, con "Información a abonados y usuarios" **solo en desktop** (oculto en mobile, como la referencia). *(Elección del usuario + referencia.)*
- **Sí:** **Empresas** = sitio actual (activo, enlaza a `/`); **Negocios** = externo (`https://negocios.fiberlux.pe/`, pestaña nueva). *(Elección del usuario + referencia.)*
- **Sí:** **conservar el shell** (scroll, theme, animación, social, bloqueo de scroll). Solo cambia la estructura/layout del Header.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| La **query `global` generada** por Tina podría no incluir `header.topBar`/`header.desktopNav` si no se regenera el cliente tras el cambio de schema. | Correr `tinacms build` (vía `npm run dev`/`build`) y verificar que `header.*` llega a `HeaderV2React`; el paso 1 lo valida antes de seguir. |
| El **matcheo por `url`** del navbar desktop contra `nav.links` se rompe si los URLs difieren (p. ej. barra final, mayúsculas). | Comparar URLs normalizadas (sin trailing slash); documentar que el `url` de `desktopNav` debe coincidir exacto con el de `nav.links`. Cubierto en QA. |
| El **matcheo de legales por `title === "Legales"`** falla si alguien renombra la columna en el footer. | Comparación case-insensitive y fallback vacío defensivo; documentar el acople título↔header. |
| El **submenú hover** reubicado como dropdown inline puede parpadear al mover el cursor entre el ítem y el panel. | Mantener el estado activo mientras el cursor esté dentro del ítem o del panel (área contigua sin gap); verificar en QA. |
| El **estado residual** (hover desktop / drill mobile) puede quedar sucio al cerrar o cruzar el breakpoint (768px) con el menú abierto. | Paso 8: resetear estado al cerrar y en el `resize` que cruza el breakpoint. |
| **Staleness de Tailwind JIT:** clases nuevas del rediseño pueden no aplicarse en dev hasta reiniciar. | Reiniciar el dev server tras cambios de clases; validar con `astro build` desde la raíz (memoria del proyecto). |
| El **open-hover state del navbar** no aparece en las referencias (solo el estado cerrado). | QA del estado cerrado contra las referencias; el dropdown abierto se valida por consistencia con SPEC 09 y ajuste visual manual. |
| Islas que asumen el **logo centrado** o el alto exacto del header podrían descuadrar (`-mt-16` del hero en `index.astro`). | Mantener el alto de la barra principal (`h-16`) y el spacer; revisar el solape del hero en QA. |
