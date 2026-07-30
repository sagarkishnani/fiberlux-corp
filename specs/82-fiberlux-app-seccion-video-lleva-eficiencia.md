# SPEC 82 — Fiberlux App · Sección "Lleva la eficiencia" con video (`/fiberlux-app`)

> **Estado:** Implementado
> **Depende de:**
> - **SPEC 37** (página `/fiberlux-app` y colección single-doc `fiberluxApp`: hero, beneficios, casos de uso, `Stats`, `BlogPreview`; patrón dual `.astro`+`React.tsx`; overlap-sticky de SPEC 70).
> - **SPEC 13** (página Casos de éxito): reutiliza su **modal de video** `src/components/casos-de-exito/VideoModal.tsx` (parseo de URL de YouTube + embed `youtube-nocookie`, cierre por Esc/backdrop/botón, scroll-lock).
> - **SPEC 80** (i18n ES/EN): campos `_en` por campo, `tField`/`richField`, sin necesidad de nuevo wrapper `/en`.
> - `BaseLayout` (Header + Footer + maintenance + Lenis) y utilidades `mediaUrl`.
>
> **Fecha:** 2026-07-30
>
> **Objetivo:** Agregar en `/fiberlux-app`, **inmediatamente después de "Beneficios"**, una sección de tema claro "Lleva la eficiencia de tu empresa al siguiente nivel": titular + párrafo a la izquierda, y a la derecha una **imagen de laptop** con **botón de play**; tanto el play como un botón **"Ver video ↑"** abren el **mismo modal de video que Casos de éxito** con un video de YouTube. Video, imagen (con campo **desktop** y **mobile**) y textos son **editables desde Tina**.

---

## Alcance

**Dentro:**

- **Nueva sección propia** `VideoShowcaseApp.astro` + `VideoShowcaseAppReact.tsx` en `src/components/fiberlux-app/` (patrón dual). Lee la colección `fiberluxApp` (`client.queries.fiberluxApp({ relativePath: "index.json" })`), recibe `locale` como prop y usa `useTina` para edición visual.
  - **Tema claro** (fondo blanco, esquinas superiores redondeadas), a 2 columnas en desktop:
    - **Izquierda:** titular (H2, "Lleva la eficiencia de tu empresa al siguiente nivel") + **párrafo en rich-text** ("En **Fiberlux App** encontrarás el estado de tus servicios en tiempo real, sedes operativas, diagnósticos avanzados y mucho más." — la negrita la controla el editor).
    - **Derecha:** **imagen de la laptop** (responsive desktop/mobile) con un **botón de play** superpuesto (círculo con triángulo, `react-icons/fa6`).
  - Debajo, centrado: **botón "Ver video ↑"** (pill magenta).
  - **Ambos disparadores** (el play sobre la laptop y el botón "Ver video") abren el modal.
  - En **mobile** se apila: titular → párrafo → imagen (con play) → botón "Ver video".

- **Modal de video reutilizado tal cual** de Casos de éxito: se importa `VideoModal` y se controla desde el estado del island (`open`/`close`). El video se pasa como una **fuente mínima** `{ youtubeUrl }`. Comportamiento idéntico al de Casos de éxito (embed `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`, cierre por Esc/backdrop/botón, scroll-lock).

- **Campos nuevos en la colección `fiberluxApp`** (`tina/config.ts`), en un objeto `videoShowcase` colocado **después de `beneficios`**:
  - `heading` (+ `heading_en`)
  - `body` **rich-text** (+ `body_en`)
  - `buttonLabel` (+ `buttonLabel_en`) — "Ver video"
  - `videoUrl` (**string**, URL de YouTube; sembrado con el link dado)
  - `imageDesktop` (**image**) — laptop en desktop
  - `imageMobile` (**image**) — laptop en mobile (**si está vacío, cae a `imageDesktop`**)
  - Regenerar el cliente Tina.

- **Contenido sembrado** en `src/content/fiberlux-app/index.json` (bloque `videoShowcase`) con el copy de la referencia, el `videoUrl` de YouTube y las imágenes vacías/placeholder (el editor sube el asset de la laptop en Tina).

- **Montaje en la página**: insertar `<VideoShowcaseApp />` en `src/pages/fiberlux-app.astro` **inmediatamente después del bloque de "Beneficios"** (fin del wrapper overlap-sticky) y **antes de `CasosDeUsoApp`**, envuelto en `data-reveal="up"`.

- **i18n**: `heading`/`buttonLabel` vía `tField`, `body` vía `richField`; `videoUrl` e imágenes no se traducen (la imagen ya es responsive por breakpoint). El wrapper `/en` existente (`src/pages/en/fiberlux-app.astro`) re-renderiza la página; **no se crea wrapper nuevo**.

- **QA visual desktop (~1440px) + mobile** con Playwright MCP: seam con Beneficios (oscuro→claro), posición del play sobre la pantalla de la laptop, apilado mobile, y apertura/cierre del modal con el video real.

**Fuera de alcance (para otras specs):**

- **Producir el asset final** de la imagen de la laptop (desktop y mobile) — se dejan editables en Tina; el cliente sube el arte.
- **Promover `VideoModal` a `src/components/shared/`** o refactorizar Casos de éxito — se reutiliza en su ubicación actual sin tocar esa página.
- **Reordenar o rediseñar** el resto de secciones de `/fiberlux-app` (Hero, Casos de uso, `Stats`, `BlogPreview`) o el banner de descarga.
- **Autoplay/preview** del video dentro de la laptop (es imagen estática + play; el video solo corre en el modal).
- **Traducir el video** (un solo `videoUrl` para ambos idiomas).

---

## Modelo de datos

Reusa la colección existente `fiberluxApp` (single-doc, SPEC 37). Solo **agrega** el objeto `videoShowcase`. No toca `home`, `casos`, ni `global`.

### 1. Campos nuevos en la colección `fiberluxApp` (`tina/config.ts`)

Insertar el objeto **después del campo `beneficios`** y antes de `casosDeUso`:

```js
// ── "Lleva la eficiencia" (video showcase) ──
{ name: "videoShowcase", label: "Sección video (Lleva la eficiencia)", type: "object", fields: [
  { name: "heading",     label: "Titular",        type: "string" },  // "Lleva la eficiencia de tu empresa al siguiente nivel"
  { name: "heading_en",  label: "Titular (EN)",   type: "string" },
  { name: "body",        label: "Párrafo",        type: "rich-text" }, // "En **Fiberlux App** encontrarás…"
  { name: "body_en",     label: "Párrafo (EN)",   type: "rich-text" },
  { name: "buttonLabel", label: "Texto del botón", type: "string" },  // "Ver video"
  { name: "buttonLabel_en", label: "Texto del botón (EN)", type: "string" },
  { name: "videoUrl",    label: "URL del video (YouTube)", type: "string",
    description: "Link de YouTube; se abre en el mismo modal que Casos de éxito." },
  { name: "imageDesktop", label: "Imagen laptop (desktop)", type: "image" },
  { name: "imageMobile",  label: "Imagen laptop (mobile)",  type: "image",
    description: "Si se deja vacío, se usa la imagen de desktop." },
]},
```

> Nota: **no existe un tipo `video` en el schema del proyecto**. El patrón de video (igual que la colección `casos`) es un **`string`** para la URL de YouTube. `mediaUrl` ya normaliza rutas de `images/…` para las imágenes de la laptop.

### 2. Contenido sembrado (`src/content/fiberlux-app/index.json`)

Agregar la clave `videoShowcase` (el `body` es rich-text con "Fiberlux App" en negrita; imágenes vacías hasta subir el asset):

```jsonc
"videoShowcase": {
  "heading": "Lleva la eficiencia de tu empresa al siguiente nivel",
  "heading_en": "Take your company's efficiency to the next level",
  "body": { "type": "root", "children": [ /* "En " + <strong>Fiberlux App</strong> + " encontrarás el estado de tus servicios en tiempo real, sedes operativas, diagnósticos avanzados y mucho más." */ ] },
  "body_en": { "type": "root", "children": [] },
  "buttonLabel": "Ver video",
  "buttonLabel_en": "Watch video",
  "videoUrl": "https://www.youtube.com/watch?v=3gFQ_iDwl4A",
  "imageDesktop": "",
  "imageMobile": ""
}
```

### 3. Tipos / props en runtime

- `VideoShowcaseApp.astro`: resuelve la query `fiberluxApp` y `locale` (`isLocale(Astro.currentLocale) ? Astro.currentLocale : getLocale(Astro.url)`), y monta `VideoShowcaseAppReact` con `client:visible` pasando `query/variables/data/locale`.
- `VideoShowcaseAppReact.tsx`:
  - `const vs = useTina(...).data?.fiberluxApp?.videoShowcase;` (render condicional si no existe).
  - Textos: `tField(vs, "heading", locale)`, `tField(vs, "buttonLabel", locale)`; párrafo: `richField(vs, "body", locale)` renderizado con el runtime rich-text de Tina (`TinaMarkdown`), con la marca `bold`→`<strong>`.
  - Imagen: `const desktop = mediaUrl(vs.imageDesktop); const mobile = mediaUrl(vs.imageMobile || vs.imageDesktop);` — dos `<img>` (`hidden lg:block` / `lg:hidden`) para el responsive, con `data-tina-field`.
  - Estado del modal: `const [open, setOpen] = useState(false);` El play y el botón "Ver video" hacen `setOpen(true)`.
  - Modal: `import VideoModal from "../casos-de-exito/VideoModal";` y `<VideoModal caso={open && vs.videoUrl ? { youtubeUrl: vs.videoUrl } : null} onClose={() => setOpen(false)} />` (la prop se tipa de forma laxa/`as any`; `VideoModal` solo lee `youtubeUrl`/`videoFile`).

---

## Plan de implementación

> Todo el trabajo vive en: colección `fiberluxApp` (`tina/config.ts` + `src/content/fiberlux-app/index.json`), un componente dual nuevo en `src/components/fiberlux-app/`, y una línea de montaje en `src/pages/fiberlux-app.astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`).

1. **Schema**: agregar el objeto `videoShowcase` a la colección `fiberluxApp` (después de `beneficios`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` → **Página Fiberlux App** aparece "Sección video (Lleva la eficiencia)" con todos los campos.

2. **Contenido**: sembrar `videoShowcase` en `index.json` (titular, párrafo rich-text con "Fiberlux App" en negrita, `buttonLabel`, `videoUrl` de YouTube, imágenes vacías). *Test:* el JSON valida contra el schema (sin warnings de Tina).

3. **Componente `VideoShowcaseAppReact.tsx`** (island): sección tema claro, 2 columnas, titular + párrafo (`richField`), imagen responsive (`mediaUrl`, desktop + mobile con fallback), botón de play superpuesto, botón "Ver video ↑", y estado `open`. Reutiliza `VideoModal`. Todos los textos/imágenes con `data-tina-field`. *Test:* compila; ambos disparadores abren el modal; el modal embebe el YouTube y cierra por Esc/backdrop/botón.

4. **Wrapper `VideoShowcaseApp.astro`**: query `fiberluxApp` + `locale`, monta el island `client:visible`. *Test:* compila; recibe datos.

5. **Montaje** en `src/pages/fiberlux-app.astro`: insertar `<div data-reveal="up"><VideoShowcaseApp /></div>` **después del wrapper overlap-sticky (Beneficios)** y **antes de `CasosDeUsoApp`**. *Test:* `/fiberlux-app` muestra la sección entre Beneficios y Casos de uso.

6. **i18n**: verificar que en `/en/fiberlux-app` el titular/párrafo/botón usan `_en` (con fallback a ES si vacío) y el video es el mismo. *Test:* `/en/fiberlux-app` renderiza EN (o cae a ES) sin romper.

7. **QA visual desktop + mobile** (Playwright MCP): seam Beneficios→sección clara, posición del play sobre la pantalla de la laptop, tamaños tipográficos, apilado mobile, y apertura/cierre del modal con el video real. *Test:* `npm run build` sin errores/warnings nuevos y QA aprobado en ambos breakpoints.

**Notas del plan:**

- Orden final de la página: **Hero → Beneficios → [NUEVA: Lleva la eficiencia (video)] → Casos de uso → ¿Por qué Fiberlux? → Insights & Novedades → Footer.**
- Reutilizar tokens/clases existentes de tema claro (p.ej. los paneles claros de `MissionVision`/SPEC 49) para el fondo blanco, redondeo superior y el pill magenta, evitando clases Tailwind nuevas (staleness del JIT).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] En `/fiberlux-app`, **inmediatamente después de "Beneficios"** (y antes de "Casos de uso"), aparece la sección de tema claro con el titular "Lleva la eficiencia de tu empresa al siguiente nivel", el párrafo, la imagen de laptop con botón de play y el botón "Ver video ↑".
- [ ] **Ambos** disparadores (el play sobre la laptop y el botón "Ver video") abren el **mismo modal de video que Casos de éxito**, con el video de YouTube (`3gFQ_iDwl4A`) reproduciéndose; cierra por **Esc**, **clic en el backdrop** y **botón de cerrar**; el scroll del body queda bloqueado mientras está abierto.
- [ ] En `/admin` → **Página Fiberlux App** son editables sin tocar código: **titular**, **párrafo** (rich-text, con negrita controlable), **texto del botón**, **URL del video (YouTube)**, **imagen laptop desktop** e **imagen laptop mobile**.
- [ ] La **imagen de la laptop** usa el campo **desktop** en `lg+` y el **mobile** en `<lg`; **si `imageMobile` está vacío, se usa `imageDesktop`** (sin hueco).
- [ ] El **párrafo** se renderiza con "Fiberlux App" en negrita; si el nodo rich-text está vacío no rompe el render.
- [ ] i18n: en `/en/fiberlux-app` el titular/párrafo/botón salen de los `_en` cuando existen y **caen a ES** si están vacíos; el `videoUrl` es el mismo en ambos idiomas.
- [ ] **Desktop (~1440px)**: layout de 2 columnas (texto | laptop) sobre fondo claro con redondeo superior, coherente con la referencia; el play queda centrado sobre la pantalla de la laptop.
- [ ] **Mobile**: la sección se apila (titular → párrafo → imagen con play → botón "Ver video").
- [ ] **No se modificó** la página de Casos de éxito ni `VideoModal.tsx` (se reutiliza tal cual); tampoco Header, Footer, `Stats`, `BlogPreview` ni el resto de secciones de `/fiberlux-app`.

---

## Decisiones

- **Sí:** **reutilizar `VideoModal` de Casos de éxito sin modificarlo**, controlado desde el estado del island y alimentado con una fuente mínima `{ youtubeUrl }`. Cumple literal el pedido ("que se abra como los casos de éxito") con cero riesgo sobre esa página. (Alternativa descartada por ahora: promover el modal a `shared/`, que tocaría Casos de éxito.)
- **Sí:** **párrafo en rich-text** (`body`/`body_en`) para que el editor controle qué va en negrita (mismo criterio que `casosDeUso.statement`), en lugar de texto plano con negrita fija.
- **Sí:** **dos campos de imagen** (`imageDesktop` + `imageMobile`) **con fallback** de mobile→desktop, según lo pedido ("un campo para mobile y para desktop"). Evita huecos si solo se sube una.
- **Sí:** **un solo `videoUrl`** (string YouTube) sin variante EN: el video es el mismo para ambos idiomas.
- **Sí:** **insertar entre Beneficios y Casos de uso** ("posterior a beneficios") en un bloque `data-reveal="up"`, respetando el overlap-sticky (SPEC 70) que envuelve Hero+Beneficios. Si el cliente prefiere ubicarla **después** de Casos de uso, es mover una línea.
- **Sí:** **componente propio** `VideoShowcaseApp` que lee `fiberluxApp` (coherente con el resto de secciones de la página), en vez de reutilizar componentes de otras colecciones.
- **No:** producir el arte de la laptop en este spec; se deja editable en Tina con placeholder (el cliente sube el asset).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El prop de `VideoModal` está tipado como `Caso \| null`; pasar `{ youtubeUrl }` puede quejar en TypeScript. | Tipar la fuente de forma laxa (`as any` / objeto mínimo). `VideoModal` solo lee `youtubeUrl`/`videoFile`, así que funciona; documentar el porqué en un comentario. |
| **Imagen de laptop vacía** (aún sin asset) deja un hueco o rompe el layout. | Render condicional / placeholder con proporción de laptop cuando `imageDesktop` está vacío; criterio de subir el asset antes de publicar. |
| **Seam visual** Beneficios (oscuro) → sección clara con los `-mt-16` de overlap de las secciones vecinas. | Redondeo superior + fondo propio de la sección; ajustar márgenes en QA (paso 7) sin tocar el overlap-sticky del Hero/Beneficios. |
| El **rich-text vacío** (`{type:"root",children:[]}`) en `body_en` renderiza hueco/warning. | `richField` ya cae a ES si el `_en` está vacío; render condicional del cuerpo si el nodo no tiene contenido. |
| Posicionar el **play** exactamente sobre la pantalla de la laptop depende del arte final (la zona de pantalla varía según el mockup). | Centrar el play sobre el contenedor de la imagen y afinar offset en QA cuando esté el asset real. |
| **Autoplay del iframe** bloqueado por el navegador. | Igual que Casos de éxito: `youtube-nocookie…?autoplay=1&rel=0` con `allow="autoplay; …"`; el usuario ya interactuó (clic), así que el autoplay es permitido. |
| **Clases Tailwind nuevas** (tema claro/pill) no aplican por staleness del JIT (memoria del proyecto). | Reutilizar clases/tokens existentes de paneles claros; reiniciar dev server y correr `astro build` desde la raíz si una clase nueva no aplica. |

---

## Qué **NO** entra en este spec

- **Producir** el asset final de la laptop (desktop/mobile) ni un preview en vivo del video dentro de la laptop.
- **Promover/mover** `VideoModal` a `shared/` o **modificar** la página de Casos de éxito.
- **Reordenar/rediseñar** las demás secciones de `/fiberlux-app` (Hero, Casos de uso, `Stats`, `BlogPreview`, banner).
- **Traducir el video** o soportar múltiples videos/galería.
- **Enlazar** `/fiberlux-app` en Header/Footer (se maneja en su spec de navegación).

Cada uno de estos, si aterriza, va en su propio spec.
