# SPEC 06 — Página "Soporte Técnico" (`/soporte-tecnico`)

> **Status:** Aprobado
> **Depends on:** SPEC 02 (patrón de página dual + tema oscuro corp + reuso de Header/Footer). Reutiliza `StickyCards` y `TestimonialSlider` (componentes compartidos alimentados por la colección `home`).
> **Date:** 2026-06-30
> **Objective:** Construir la ruta `/soporte-tecnico` según los frames de Figma (desktop y mobile): un hero oscuro con breadcrumb / H1 / intro y un **placeholder reservado para un elemento 3D (pendiente, fuera de alcance)**, una sección "Soporte Técnico" con un **acordeón horizontal estilo Effortel** de canales editables (WhatsApp / Llamada / Correo) cuyas filas son accionables (`wa.me` / `tel:` / `mailto:`), y debajo las secciones reutilizadas de **Servicios** (`StickyCards` del Home) y **Testimonios** (`TestimonialSlider`), todo editable desde una nueva colección `soporteTecnico` en TinaCMS.

---

## Scope

**In:**

- **Ruta `/soporte-tecnico`.** Crear `src/pages/soporte-tecnico/index.astro` que hereda `BaseLayout` (Header + Footer + maintenance + Lenis existentes) y compone la página.
- **Actualizar el enlace del footer** en `src/content/global/index.json`: el link "Soporte técnico" pasa de `/soporte` a `/soporte-tecnico` (único cambio de navegación).
- **Hero (patrón dual)** `src/components/soporte/HeroSoporte.astro` + `HeroSoporteReact.tsx`:
  - Columna izquierda: breadcrumb `Inicio / Soporte técnico`, H1 "Contáctate con nuestros ingenieros especializados", párrafo intro. Todo editable (`data-tina-field`).
  - Columna derecha: se reserva el espacio del layout (proporción/grid del Figma) pero **se deja vacía** — sin escena 3D ni placeholder visual.
- **Sección "Soporte Técnico" — acordeón horizontal estilo Effortel** `src/components/soporte/CanalesSoporte.tsx` (island):
  - Fondo rosa (`#FFD4F4`/según Figma), heading "Soporte Técnico" + subtítulo editable.
  - **Acordeón de canales** (`channels[]`, editable): el panel activo se expande mostrando su contenido; los inactivos colapsan a **barras verticales con el texto rotado** ("Contáctate por WhatsApp" / "…por correo") y un botón "+" para expandir. Solo un panel abierto a la vez; al abrir uno, los demás colapsan.
  - Cada panel activo muestra su `title` ("Contáctate por llamada"), `subtitle` y su lista de **filas accionables**:
    - `call` → `tel:` al teléfono de la fila; muestra etiqueta (NOC/Telefonía/SOC) + número + "Opción N" (**etiqueta visual**) + chevron.
    - `whatsapp` → `wa.me/<número>?text=<mensaje>` (placeholders editables).
    - `email` → `mailto:<correo>` (placeholders editables).
  - Estado inicial: el primer canal con `defaultOpen` (o el primero de la lista) abierto, como en el Figma ("Llamada" abierto).
  - Accesible por teclado (las barras colapsadas y el "+" son botones; foco visible).
- **Sección "Servicios de conectividad empresarial":** montar el componente compartido **`StickyCards`** (alimentado por la query `home`, misma fuente que el Home). Sin duplicar contenido.
- **Sección "Empresas que confían en nuestra red":** montar el componente compartido **`TestimonialSlider`** existente.
- **Nueva colección `soporteTecnico`** en `tina/config.ts` + `src/content/soporte-tecnico/index.json`: documento único editable con el contenido del hero y los `channels[]` del acordeón (ver Data model).
- **QA visual** contra `references/soporte-tecnico.png` (desktop) y `references/soporte-tecnico-mob.png` (mobile) con Playwright MCP (screenshots en `.playwright-screens/`).

**Out of scope (para futuras specs / pendientes):**

- **Visual 3D del hero (PENDIENTE).** Esta spec deja la columna derecha vacía con el espacio reservado pero **no** integra ningún elemento 3D. **La tecnología queda sin decidir** (Spline como en `HeroHome`, o three.js); se resuelve en una spec aparte.
- **El footer CTA "Potencia tu conectividad empresarial":** ya forma parte del `Footer` compartido; no se rediseña ni se duplica.
- **Backend de las acciones:** los enlaces son `tel:` / `wa.me` / `mailto:` nativos; no hay formulario ni `send-email.php` en esta página.
- **Editar el contenido de Servicios o Testimonios desde la colección de soporte:** se reusan tal cual (fuente: colección `home`); cambiar esos textos se hace donde ya viven hoy.
- **Rediseñar Header/Footer/maintenance** o el tema de otras páginas.
- **Indicadores/animaciones extra del acordeón** más allá de expandir/colapsar (sin autoplay ni drag; no es un carrusel).

---

## Data model

Esta spec introduce **una colección nueva**, `soporteTecnico` (documento único, patrón de `contact`/`about`/`infoAbonados`). Los Servicios y Testimonios **no** se modelan aquí: se reusan de la colección `home`.

### 1. Schema en `tina/config.ts` (colección `soporteTecnico`)

```js
{
  name: "soporteTecnico",
  label: "Soporte Técnico (página)",
  path: "src/content/soporte-tecnico",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } }, // documento único
  fields: [
    // ── Hero ──
    { name: "breadcrumb", label: "Breadcrumb", type: "string" },         // "Soporte técnico"
    { name: "heading",    label: "Título (H1)", type: "string" },
    { name: "intro",      label: "Párrafo intro", type: "string", ui: { component: "textarea" } },

    // ── Sección Soporte Técnico (acordeón) ──
    { name: "sectionTitle",    label: "Título de sección", type: "string" },   // "Soporte Técnico"
    { name: "sectionSubtitle", label: "Subtítulo de sección", type: "string", ui: { component: "textarea" } },
    {
      name: "channels",
      label: "Canales de contacto",
      type: "object",
      list: true,
      ui: { itemProps: (i) => ({ label: i?.title || "Canal" }) },
      fields: [
        {
          name: "type", label: "Tipo", type: "string",
          options: [
            { value: "whatsapp", label: "WhatsApp" },
            { value: "call",     label: "Llamada" },
            { value: "email",    label: "Correo" },
          ],
        },
        { name: "tabLabel",   label: "Etiqueta de pestaña", type: "string" }, // "Contáctate por WhatsApp"
        { name: "title",      label: "Título del panel", type: "string" },    // "Contáctate por llamada"
        { name: "subtitle",   label: "Subtítulo del panel", type: "string", ui: { component: "textarea" } },
        { name: "defaultOpen",label: "Abierto por defecto", type: "boolean" },
        {
          name: "rows", label: "Filas", type: "object", list: true,
          ui: { itemProps: (i) => ({ label: i?.label || "Fila" }) },
          fields: [
            { name: "label",       label: "Etiqueta", type: "string" },        // "NOC" / "Telefonía" / "SOC"
            { name: "value",       label: "Valor (teléfono / WhatsApp / correo)", type: "string" }, // destino del tel:/wa.me/mailto:
            { name: "optionLabel", label: "Texto opción (visual)", type: "string" }, // "Opción 1" — solo visual
            { name: "message",     label: "Mensaje pre-cargado (solo WhatsApp)", type: "string" },
          ],
        },
      ],
    },
  ],
}
```

### 2. Contenido sembrado `src/content/soporte-tecnico/index.json`

```jsonc
{
  "breadcrumb": "Soporte técnico",
  "heading": "Contáctate con nuestros ingenieros especializados",
  "intro": "En el Grupo Fiberlux estamos comprometidos con la calidad de la atención a nuestros clientes; por ello contamos con un equipo totalmente personalizado pensado en su empresa.",
  "sectionTitle": "Soporte Técnico",
  "sectionSubtitle": "Contáctate con nuestros especialistas al (01) 748 0606. Elige el canal que mejor se adapte a tus necesidades:",
  "channels": [
    {
      "type": "whatsapp",
      "tabLabel": "Contáctate por WhatsApp",
      "title": "Contáctate por WhatsApp",
      "subtitle": "Escríbenos por WhatsApp y un especialista te atenderá.",
      "defaultOpen": false,
      "rows": [
        { "label": "Soporte", "value": "51900000000", "optionLabel": "", "message": "Hola, necesito soporte técnico" }
      ]
    },
    {
      "type": "call",
      "tabLabel": "Contáctate por llamada",
      "title": "Contáctate por llamada",
      "subtitle": "Llama directamente a nuestro equipo especializado. Selecciona la opción que corresponda a tu necesidad.",
      "defaultOpen": true,
      "rows": [
        { "label": "NOC",       "value": "(01) 748 0606", "optionLabel": "Opción 1", "message": "" },
        { "label": "Telefonía", "value": "(01) 748 0606", "optionLabel": "Opción 2", "message": "" },
        { "label": "SOC",       "value": "(01) 748 0606", "optionLabel": "Opción 3", "message": "" }
      ]
    },
    {
      "type": "email",
      "tabLabel": "Contáctate por correo",
      "title": "Contáctate por correo",
      "subtitle": "Envíanos un correo y te responderemos a la brevedad.",
      "defaultOpen": false,
      "rows": [
        { "label": "Soporte", "value": "soporte@fiberlux.pe", "optionLabel": "", "message": "" }
      ]
    }
  ]
}
```

### 3. Tipos y convenciones en runtime (`CanalesSoporte.tsx` / `HeroSoporteReact.tsx`)

```ts
type ChannelType = "whatsapp" | "call" | "email";
interface Row { label?: string|null; value?: string|null; optionLabel?: string|null; message?: string|null; }
interface Channel { type?: ChannelType|null; tabLabel?: string|null; title?: string|null; subtitle?: string|null; defaultOpen?: boolean|null; rows?: (Row|null)[]|null; }
```

- **Construcción del `href` por tipo** (en runtime, no editable): `call` → `tel:` con `value` saneado a dígitos/`+`; `whatsapp` → `https://wa.me/<digits(value)>?text=<encodeURIComponent(message)>`; `email` → `mailto:<value>`.
- Fallback chain como en el resto del proyecto: `useTina` data → `initialData`; si `channels` está vacío, el acordeón **no se renderiza** (la página no rompe).
- Panel abierto inicial: el primer canal con `defaultOpen: true`; si ninguno, el primero de la lista.
- `optionLabel` es **solo visual** (no afecta el `href`).

---

## Implementation plan

> Todo el trabajo vive en: nueva colección `soporteTecnico` (`tina/config.ts` + `src/content/soporte-tecnico/index.json`), nuevos componentes en `src/components/soporte/`, la página `src/pages/soporte-tecnico/index.astro`, y un cambio de enlace en `src/content/global/index.json`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `soporteTecnico` en `tina/config.ts`** (documento único, `create/delete: false`) con los campos del Data model (hero + `channels[]` con `rows[]`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores y en `/admin` aparece la colección **Soporte Técnico (página)** con todos los campos editables (incluida la lista de canales y sus filas).

2. **Sembrar `src/content/soporte-tecnico/index.json`** con el contenido del Figma (hero + 3 canales: WhatsApp, Llamada con NOC/Telefonía/SOC, Correo). *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Hero (patrón dual).** Crear `src/components/soporte/HeroSoporte.astro` (resuelve `soporteTecnico` vía `client` y pasa `{query, variables, data}`) + `HeroSoporteReact.tsx` (envuelve en `useTina`, render del breadcrumb + H1 + intro con `data-tina-field`; **columna derecha vacía** con el espacio reservado del grid). *Test:* el componente compila; aún no enlazado a una ruta.

4. **Ruta `/soporte-tecnico`.** Crear `src/pages/soporte-tecnico/index.astro` con `BaseLayout` + `<HeroSoporte />`. *Test:* `/soporte-tecnico` carga con el hero oscuro (breadcrumb, H1, intro) y la zona derecha vacía; Header/Footer existentes presentes.

5. **Acordeón estático `CanalesSoporte.tsx`.** Island con `useTina` + fallback chain; render del fondo rosa, `sectionTitle`/`sectionSubtitle` y los paneles **sin interacción todavía** (todos visibles en disposición horizontal). Mapear filas por tipo a su markup (etiqueta, valor, `optionLabel`, chevron) y construir el `href` (`tel:`/`wa.me`/`mailto:`) — los enlaces ya funcionales. Montarlo en la página debajo del hero. *Test:* la sección aparece con los 3 canales y los enlaces abren `tel:`/`wa.me`/`mailto:` correctos al hacer clic.

6. **Interacción del acordeón (expandir/colapsar).** `useState` del índice abierto (inicial: `defaultOpen` o el primero). El panel activo se expande mostrando título/subtítulo/filas; los inactivos colapsan a **barra vertical con texto rotado** (`tabLabel`) + botón "+"; clic en una barra/"+" la abre y cierra las demás (solo una abierta). Barras y "+" como `<button>` accesibles, foco visible. Transición CSS de ancho/opacidad. *Test:* clic en cada barra expande su panel y colapsa el resto; navegable por teclado; un solo panel abierto a la vez.

7. **Montar Servicios (reuso `StickyCards`).** Insertar `<StickyCards />` (compartido, query `home`) debajo del acordeón. *Test:* aparecen los 5 cards de "Servicios de conectividad empresarial", idénticos al Home.

8. **Montar Testimonios (reuso `TestimonialSlider`).** Insertar `<TestimonialSlider />` debajo de Servicios. *Test:* "Empresas que confían en nuestra red" se renderiza y funciona como en el Home.

9. **Actualizar el enlace del footer.** En `src/content/global/index.json`, cambiar el `url` del link "Soporte técnico" de `/soporte` a `/soporte-tecnico`. *Test:* el link "Soporte técnico" del footer navega a `/soporte-tecnico` sin 404.

10. **QA visual desktop + mobile.** Comparar contra `references/soporte-tecnico.png` (desktop ~1440px) y `references/soporte-tecnico-mob.png` (mobile ~390px) con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar el hero (espaciados, zona 3D vacía), el acordeón (anchos colapsado/expandido, texto rotado, botón "+", filas) y el responsive hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–4 dejan la página con hero + chrome; 5–6 construyen el acordeón (primero estático con enlaces, luego la interacción); 7–9 ensamblan secciones reusadas y la navegación.
- El visual 3D del hero queda **pendiente** (otra spec); el paso 3 solo reserva el espacio.
- La verificación visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] La ruta `/soporte-tecnico` carga y renderiza, en orden: **hero**, **sección Soporte Técnico (acordeón)**, **Servicios de conectividad empresarial**, **Empresas que confían en nuestra red**, y el **Footer** existente.
- [ ] El hero muestra breadcrumb `Inicio / Soporte técnico`, el H1 "Contáctate con nuestros ingenieros especializados" y el párrafo intro; la **columna derecha está vacía** (espacio reservado, sin elemento 3D ni placeholder visual).
- [ ] En `/admin` existe la colección **Soporte Técnico (página)** con el contenido del hero y la lista editable de **Canales**, cada uno con tipo, etiquetas, subtítulo, `defaultOpen` y sus **filas** (`label`, `value`, `optionLabel`, `message`).
- [ ] Editar en el CMS el H1, el intro, el subtítulo de sección, o agregar/quitar/reordenar un canal o una fila se refleja en la página sin tocar código.
- [ ] La sección "Soporte Técnico" muestra el acordeón con un **solo panel abierto a la vez**; al inicio está abierto el canal con `defaultOpen` (o el primero).
- [ ] Los canales inactivos se muestran como **barras verticales con el texto rotado** (`tabLabel`) y un botón "+"; al hacer clic en una barra/"+" esa se expande y las demás colapsan.
- [ ] El panel activo muestra su título, subtítulo y filas; en el canal **Llamada** cada fila muestra etiqueta (NOC/Telefonía/SOC), número y el texto **"Opción N"** como etiqueta visual.
- [ ] Las filas son **accionables**: `call` abre `tel:`, `whatsapp` abre `https://wa.me/...` (con `text` si hay `message`), `email` abre `mailto:`; el destino se construye desde el `value` de cada fila.
- [ ] La **"Opción N"** es solo visual y **no** altera el destino del `tel:`.
- [ ] El acordeón es **accesible por teclado**: las barras colapsadas y el "+" son botones enfocables y operables con Enter/Espacio, con foco visible.
- [ ] Si `channels` está vacío, el acordeón **no se renderiza** y la página no rompe.
- [ ] La sección "Servicios de conectividad empresarial" se renderiza reusando **`StickyCards`** (mismo contenido que el Home), sin duplicar datos.
- [ ] La sección "Empresas que confían en nuestra red" se renderiza reusando **`TestimonialSlider`** existente.
- [ ] El enlace "Soporte técnico" del **footer** apunta a `/soporte-tecnico` y navega sin 404.
- [ ] En **desktop (~1440px)** el layout coincide con `references/soporte-tecnico.png`.
- [ ] En **mobile (~390px)** el layout coincide con `references/soporte-tecnico-mob.png` (hero apilado, acordeón y secciones en una columna).
- [ ] El breadcrumb, H1, intro, títulos de sección y textos de los canales/filas son editables visualmente desde Tina (`data-tina-field` donde aplique).
- [ ] No se modificaron `StickyCards`, `TestimonialSlider`, Header, Footer ni otras páginas (salvo el cambio del `url` del link de soporte en `global`).

---

## Decisiones

- **Sí:** ruta `/soporte-tecnico` (slug descriptivo) y se actualiza el enlace del footer (`/soporte` → `/soporte-tecnico`). El usuario lo eligió; un solo cambio de navegación, sin redirecciones que mantener.
- **No:** mantener `/soporte`. El slug descriptivo es más claro y el enlace del footer es el único punto que lo referencia.
- **Sí:** reusar el componente compartido **`StickyCards`** (query `home`) para "Servicios de conectividad empresarial". El Figma muestra exactamente los 5 cards del Home; una sola fuente de contenido evita duplicar y desincronizar.
- **No:** copia editable aparte de los servicios en la colección de soporte. Habría dos fuentes para el mismo contenido y riesgo de divergencia; si en el futuro deben diferir, irá en otra spec.
- **Sí:** reusar **`TestimonialSlider`** existente para "Empresas que confían en nuestra red". Mismo patrón y contenido que el Home, sin reimplementar.
- **Sí:** **acordeón horizontal estilo Effortel** para los canales (un panel abierto, los demás como barras verticales con texto rotado + "+"). Replica el frame de Figma y la mecánica pedida.
- **No:** carrusel/autoplay/dots o drag en la sección de canales. No es un slider; el Figma solo expande/colapsa. Evita complejidad innecesaria.
- **Sí:** **canales y filas totalmente editables** (`channels[]` con `rows[]`) en una colección nueva `soporteTecnico`. El editor ajusta textos, números y hasta agrega/quita canales sin tocar código; coherente con el proyecto CMS-driven.
- **No:** hardcodear los 3 canales o los números en el componente. Obligaría a deploy por cada cambio de número/anexo y rompe el patrón del proyecto.
- **Sí:** filas **accionables** construyendo el `href` en runtime por tipo (`tel:` / `wa.me` / `mailto:`) desde el `value`. Conecta al usuario directamente sin backend.
- **Sí:** **placeholders editables** para los paneles WhatsApp y Correo (el Figma solo detalla "Llamada"). Deja la estructura lista y el contenido real se carga en Tina cuando exista.
- **Sí:** `optionLabel` ("Opción N") como **etiqueta puramente visual**, separada del `value` que arma el `tel:`. El Figma muestra el mismo número con distintas opciones de IVR; el texto guía no debe alterar el marcado.
- **Sí:** dejar la **columna derecha del hero vacía** (espacio reservado) en vez de maquetar un placeholder. El usuario podría migrar de Spline a three.js; un placeholder específico sería trabajo a desechar.
- **No:** integrar el visual 3D (Spline o three.js) en esta spec. La tecnología no está decidida; se difiere a una spec propia para no acoplar la decisión.
- **Sí:** colección `soporteTecnico` como **documento único** (`create/delete: false`), patrón de `contact`/`about`/`infoAbonados`. Es una página única; no necesita múltiples documentos.
- **Sí:** componentes nuevos bajo `src/components/soporte/` con el **patrón dual** (`.astro` + `React.tsx`) para el hero y island para el acordeón, como el resto del proyecto.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **acordeón horizontal** (texto rotado, anchos colapsado/expandido) descuadra en **mobile**, donde el Figma lo apila en vertical. | Definir layout responsive explícito: horizontal con barras rotadas en desktop, apilado en columna en mobile; QA visual contra `references/soporte-tecnico-mob.png` antes de cerrar. |
| El `tel:` construido desde un `value` con formato visual (`(01) 748 0606`) marca un número inválido. | Sanear `value` a dígitos/`+` al construir el `href` (quitar espacios, paréntesis y guiones); el texto mostrado conserva el formato del CMS. |
| Un canal `whatsapp` con `value` mal formateado (con `+`, espacios o `0` inicial) genera un `wa.me` roto. | Normalizar a solo dígitos en formato internacional al armar `wa.me`; documentar en el label del campo que el `value` de WhatsApp va con código de país. |
| Reusar **`StickyCards`** (query `home`) acopla la página de soporte al contenido del Home: editar servicios en Home cambia ambas. | Es una decisión consciente (fuente única). Queda registrada; si deben divergir, se separa en otra spec. |
| Reusar `StickyCards` arrastra su **scroll-sticky** (rAF + `position: sticky`) y podría chocar con el orden de secciones de esta página. | Montarlo en su propio bloque como en el Home; QA del comportamiento sticky en `/soporte-tecnico` igual que en `/`. |
| Si `channels` queda vacío o un canal sin `rows`, el acordeón podría romper o verse vacío. | Fallback: si `channels` está vacío, no renderizar la sección; un canal sin filas muestra solo título/subtítulo sin reventar. |
| La **columna derecha vacía** del hero deja un hueco visual raro hasta que llegue el 3D. | Reservar el espacio del grid con el layout del Figma; aceptable como estado intermedio documentado (visual 3D pendiente). |
| El acordeón de **un solo panel abierto** podría dejar todo cerrado si ningún canal tiene `defaultOpen`. | Regla determinista: abrir el primer canal con `defaultOpen`, y si ninguno, el primero de la lista. |
| Cambiar el `url` del link de soporte en `global` podría afectar otros lugares que apunten a `/soporte`. | Buscar referencias a `/soporte` antes del cambio (solo el footer lo usa hoy); actualizar únicamente ese enlace. |
