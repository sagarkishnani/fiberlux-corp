# SPEC 111 — Pop-up promocional global (editable en Tina)

> **Estado:** Aprobado
> **Depende de:** SPEC 60 (patrón `modo: nativo | imagen` del `BannerApp`), SPEC 80 (i18n `_en` + `tField`), SPEC 81 (bloqueo de scroll con Lenis en overlays), assets en `public/images/fiberlux-app/`
> **Fecha:** 2026-08-30
> **Objetivo:** Crear un pop-up promocional **único** y editable desde Tina, que aparece según un disparador configurable (inmediato, segundos, scroll o intención de salida), se recuerda cerrado durante N días y se renderiza en modo nativo o de solo imagen.

---

## Sección 1 — Por qué existe este spec

El sitio ya tiene **dos overlays globales** —el modal de cookies (`src/components/cookies/`) y el buscador (`SearchOverlay.tsx`)— pero ninguno es promocional ni lo controla el cliente. Cuando marketing quiere anunciar algo (hoy la Fiberlux App, mañana una promo o un evento) la única vía es pedir un cambio de código y un deploy.

Este spec cierra ese hueco con una pieza que el cliente enciende, apaga, reescribe y reprograma desde Tina sin tocar el repo. La restricción de **un solo pop-up a la vez** no es una limitación técnica sino una decisión de producto: dos pop-ups compitiendo en la misma sesión es una mala experiencia y multiplica los estados a probar. Se modela con el mismo recurso que ya usan `maintenance` y `cookieConsent` — una colección de **documento único** con `create: false, delete: false`, de modo que en el panel el cliente ve *el* pop-up, no una lista donde podría crear un segundo.

El otro motivo es que el mockup entregado es **un caso de uso, no la plantilla eterna**. Por eso ninguna parte del contenido está horneada: las features y los botones son listas de largo libre, cada bloque desaparece si su campo va vacío, y existe una salida de emergencia (modo imagen) para cuando el cliente reciba una pieza ya diseñada que no encaje en la estructura nativa.

---

## Sección 2 — Alcance

**Dentro:**

- **Colección nueva `popup`** en `tina/config.ts`, documento único (`path: src/content/popup`, `allowedActions: { create: false, delete: false }`), con su `src/content/popup/index.json` precargado con el contenido del mockup de la Fiberlux App.
- **Par de componentes nuevos** `src/components/popup/Popup.astro` + `PopupReact.tsx` (patrón dual del proyecto), montados globalmente en `BaseLayout.astro` junto a `<CookieConsent />`.
- **Dónde aparece:** campo `scope` con tres valores — `todo` (todo el sitio), `home` (solo la portada) y `rutas` (lista de paths editable). El filtrado ocurre **en build**: si la página no está en alcance, la isla no se emite.
- **Cuándo aparece:** campo `trigger` con cuatro modos — `inmediato`, `segundos` (con `delaySeconds`), `scroll` (con `scrollPercent`) y `salida` (intención de salida, con repliegue a `delaySeconds` en dispositivos táctiles).
- **Cada cuánto vuelve:** `remindAfterDays` (default 7). Una vez **mostrado** no reaparece en la misma sesión; una vez **cerrado** no reaparece hasta que pasen N días.
- **`campaignId`:** al cambiarlo, el pop-up vuelve a mostrarse incluso a quien ya lo había cerrado.
- **Modo nativo** (el del mockup, todo editable): badge tipo pill, titular, `features[]` de largo libre (ícono de un set fijo + texto), `buttons[]` de largo libre (etiqueta, URL, ícono, variante primaria/secundaria), imagen del teléfono a sangre en la mitad derecha (desktop) e ícono de app arriba (mobile). Cada bloque se oculta si su campo va vacío.
- **Corrección de diseño:** los botones van **todos al mismo ancho** (el de su columna) en desktop y mobile. El mockup desktop los muestra con anchos distintos; eso es un error del diseño y no se replica.
- **Modo imagen:** una imagen por breakpoint (`imageDesktop`, `imageMobile`) con enlace opcional, para piezas ya diseñadas.
- **Mobile:** el pop-up es una **hoja que sube desde abajo**, no un modal centrado; con scroll interno (`data-lenis-prevent`) si el contenido excede `88vh`.
- **Cierre y accesibilidad:** botón ✕, tecla Escape, clic en el fondo, `role="dialog"` + `aria-modal`, foco al abrir, trampa de foco, bloqueo de scroll con la receta de `SearchOverlay.tsx` (`body.style.overflow` + `window.__lenis?.stop()`), y respeto a `prefers-reduced-motion`.
- **Convivencia:** no se muestra en modo mantenimiento y **espera** a que el modal de cookies esté resuelto antes de aparecer.
- **i18n (SPEC 80):** hermanos `_en` en todos los campos de texto, leídos con `tField`; se muestra igual en `/en` y la comparación de rutas ignora el prefijo de idioma y el `BASE_URL`.
- **Previsualización:** `?popup=1` en la URL fuerza el pop-up ignorando disparador y persistencia, para que el cliente revise sus cambios.

**Fuera de alcance (specs futuros):**

- **Más de un pop-up** o rotación entre varios. Es la restricción central del spec.
- **Segmentación** por idioma, dispositivo, origen de tráfico (UTM), usuario nuevo vs. recurrente o geografía.
- **Programación por fechas** (`desde`/`hasta`). Hoy se enciende y apaga con `enabled`.
- **Formulario dentro del pop-up** (captura de leads). Si llega, se apoya en `dynamicForms` y va en su propio spec.
- **Métricas** de impresiones, cierres o clics. Si se necesitan, salen de GTM vía SPEC 64 (inyección de código).
- **Animación de entrada del contenido** (escalonado de features, parallax de la imagen). Sólo la entrada del panel.
- **Variantes de layout nativo** (imagen a la izquierda, texto centrado a una columna, vídeo).
- **Producir arte nuevo:** se usa `public/images/fiberlux-app/mobile-app.png`, que el cliente ya subió.

---

## Sección 3 — Modelo de datos

Colección nueva **`popup`** en `tina/config.ts`. Documento único en `src/content/popup/index.json`. Los nombres de campo van en inglés y las etiquetas en español, como el resto del schema.

```js
{
  name: "popup",
  label: "Pop-up promocional",
  path: "src/content/popup",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { name: "enabled",    label: "Activar pop-up", type: "boolean" },
    { name: "campaignId", label: "ID de campaña",  type: "string" },
      // Cambiarlo hace que el pop-up vuelva a mostrarse a quien ya lo cerró.

    // ── Dónde aparece ──
    { name: "scope", label: "Dónde aparece", type: "string",
      options: [
        { value: "todo",  label: "En todo el sitio" },
        { value: "home",  label: "Solo en la portada" },
        { value: "rutas", label: "Solo en rutas específicas" },
      ] },
    { name: "paths", label: "Rutas", type: "string", list: true },
      // Sin BASE_URL ni prefijo de idioma: "/", "/fiberlux-app", "/soluciones/conectividad".

    // ── Cuándo aparece ──
    { name: "trigger", label: "Cuándo aparece", type: "string",
      options: [
        { value: "inmediato", label: "Al cargar la página" },
        { value: "segundos",  label: "Después de N segundos" },
        { value: "scroll",    label: "Al llegar a N% de scroll" },
        { value: "salida",    label: "Al intentar salir de la página" },
      ] },
    { name: "delaySeconds",   label: "Segundos de espera",  type: "number" },  // default 5
    { name: "scrollPercent",  label: "% de scroll",          type: "number" }, // default 40
    { name: "remindAfterDays",label: "Volver a mostrar tras (días)", type: "number" }, // default 7

    // ── Presentación ──
    { name: "mode", label: "Modo", type: "string",
      options: [
        { value: "nativo", label: "Nativo (editable)" },
        { value: "imagen", label: "Solo imagen" },
      ] },

    // ── Modo nativo ──
    { name: "badge",    label: "Etiqueta (pill)", type: "string" },
    { name: "badge_en", label: "Etiqueta (EN)",   type: "string" },
    { name: "heading",    label: "Titular", type: "string", ui: { component: "textarea" } },
    { name: "heading_en", label: "Titular (EN)", type: "string", ui: { component: "textarea" } },
    { name: "features", label: "Puntos", type: "object", list: true,
      ui: { itemProps: (i) => ({ label: i?.text || "Punto" }) },
      fields: [
        { name: "icon", label: "Ícono", type: "string", options: FEATURE_ICON_OPTIONS },
        { name: "text",    label: "Texto",      type: "string", ui: { component: "textarea" } },
        { name: "text_en", label: "Texto (EN)", type: "string", ui: { component: "textarea" } },
      ] },
    { name: "buttons", label: "Botones", type: "object", list: true,
      ui: { itemProps: (i) => ({ label: i?.label || "Botón" }) },
      fields: [
        { name: "label",    label: "Texto",      type: "string" },
        { name: "label_en", label: "Texto (EN)", type: "string" },
        { name: "url",   label: "URL",   type: "string" },
        { name: "icon",  label: "Ícono", type: "string", options: BUTTON_ICON_OPTIONS },
        { name: "variant", label: "Estilo", type: "string",
          options: [
            { value: "primario",   label: "Magenta (primario)" },
            { value: "secundario", label: "Contorno (secundario)" },
          ] },
      ] },
    { name: "phoneImage", label: "Imagen desktop (columna derecha)", type: "image" },
    { name: "appIcon",    label: "Ícono de app (mobile, arriba)",    type: "image" },

    // ── Modo imagen ──
    { name: "imageDesktop", label: "Imagen desktop", type: "image" },
    { name: "imageMobile",  label: "Imagen mobile",  type: "image" },
    { name: "imageUrl",     label: "Enlace al hacer clic", type: "string" },
  ],
}
```

### Sets de íconos

Dos listas de opciones a nivel de módulo, junto al patrón que ya usa `about.rubros` (`tina/config.ts:1487`) y su mapa en `RubrosReact.tsx:48`. Ambas incluyen `ninguno`.

- `FEATURE_ICON_OPTIONS` → `react-icons/lu`: `pulso` (`LuActivity`), `edificio` (`LuBuilding2`), `lupa` (`LuScanSearch`), `escudo` (`LuShieldCheck`), `rayo` (`LuZap`), `reloj` (`LuClock`), `nube` (`LuCloud`), `wifi` (`LuWifi`), `grafico` (`LuChartLine`), `check` (`LuCircleCheck`), `ninguno`.
- `BUTTON_ICON_OPTIONS` → `react-icons/fa6`: `apple` (`FaApple`), `google-play` (`FaGooglePlay`), `descarga` (`FaDownload`), `flecha` (`FaArrowRight`), `whatsapp` (`FaWhatsapp`), `ninguno`.

El mapa `string → componente` vive en `PopupReact.tsx`. Un valor desconocido cae en "sin ícono", nunca revienta.

### Persistencia (navegador)

Dos claves, versionadas como `flx-cookie-consent:v1`:

```js
// localStorage — sobrevive al cierre del navegador
"flx-popup:v1"          // { closedAt: 1756598400000, campaignId: "app-2026-08" }

// sessionStorage — se limpia al cerrar la pestaña
"flx-popup-session:v1"  // "1" en cuanto el pop-up se muestra una vez
```

Regla de visibilidad, en orden. Basta que una diga "no" para que no se muestre:

1. `enabled === true`.
2. La página está en alcance (resuelto en build).
3. No estamos en modo mantenimiento.
4. El modal de cookies ya fue resuelto (existe la clave `flx-cookie-consent:v1`).
5. `sessionStorage["flx-popup-session:v1"]` no existe.
6. `localStorage["flx-popup:v1"]` no existe, **o** su `campaignId` no coincide con el actual, **o** han pasado más de `remindAfterDays` días desde `closedAt`.

`?popup=1` en la URL salta los pasos 4, 5 y 6 y el disparador: muestra el pop-up de inmediato y **no** escribe nada en storage.

### Contenido inicial (`src/content/popup/index.json`)

El del mockup: `enabled: false` (lo enciende el cliente), `scope: "todo"`, `trigger: "segundos"`, `delaySeconds: 5`, `remindAfterDays: 7`, `mode: "nativo"`, badge `FIBERLUX APP`, titular *"Obtén control total de tu red desde tu celular"*, tres features (pulso / edificio / lupa) con los textos del mockup, dos botones (App Store y Google Play, ambos `variant` distinto y URL vacía hasta que el cliente las entregue) y `phoneImage: "images/fiberlux-app/mobile-app.png"`.

---

## Sección 4 — Plan de implementación

Cada paso deja el sitio compilando y navegable.

1. **Colección `popup`** en `tina/config.ts` con todos los campos de la Sección 3, más `src/content/popup/index.json` con el contenido inicial. Regenerar el cliente Tina. Verificación: `/admin` lista "Pop-up promocional" y no ofrece crear ni borrar documentos.
2. **`Popup.astro`** — resuelve `client.queries.popup({ relativePath: "index.json" })` dentro de un `try/catch` (como `CookieConsent.astro`), calcula el alcance contra `Astro.url.pathname` y **no renderiza nada** si la página queda fuera. Pasa `{ query, variables, data, locale }` a la isla con `client:idle`. Montarlo en `BaseLayout.astro` junto a `<CookieConsent />`, dentro del fragmento `{!maintenanceMode && …}`.
3. **`PopupReact.tsx` mínimo** — `useTina()`, panel siempre visible con el titular y el botón de cerrar, `z-[90]` (encima del header `z-[80]` y del buscador `z-[85]`, debajo del modal de cookies `z-[100]`). Verificación: se ve el panel en la portada y se cierra.
4. **Layout nativo desktop** (`lg+`) — panel de dos columnas 50/50, `max-w-[1000px]`, esquinas de 24px; izquierda con badge, titular, `features[]` y `buttons[]`; derecha con el degradado magenta y `phoneImage` a sangre. Los botones se apilan a **`w-full`** dentro de una columna de `max-w-[420px]`: mismo ancho los dos.
5. **Layout mobile** (`<lg`) — hoja anclada abajo (`fixed inset-x-0 bottom-0`), esquinas superiores de 24px, `max-h-[88vh]`, cuerpo con scroll interno marcado `data-lenis-prevent`; `appIcon` centrado arriba, features como tarjetas con borde, botones a ancho completo. Entrada con `translateY(100%) → 0` en 320ms.
6. **Disparadores** — los cuatro modos de `trigger`. `salida` escucha `mouseout` en `document` con `clientY <= 0` y sin `relatedTarget`; en punteros gruesos (`matchMedia("(pointer: coarse)")`) no puede dispararse, así que cae a `delaySeconds`.
7. **Persistencia** — las dos claves de la Sección 3, el corte por `campaignId`, `remindAfterDays` y el atajo `?popup=1`. Toda lectura y escritura de storage va en `try/catch`: con storage deshabilitado el pop-up sigue funcionando, sólo deja de recordar.
8. **Cierre y accesibilidad** — Escape, clic en el fondo, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al titular, foco al botón de cerrar al abrir y devuelto al `document.body` al cerrar, trampa de foco con Tab/Shift+Tab, bloqueo de scroll con la receta de `SearchOverlay.tsx:76-88` y desactivación de la animación bajo `prefers-reduced-motion`.
9. **Modo imagen** — `mode === "imagen"` renderiza `imageMobile` / `imageDesktop` según breakpoint, con `width: 100%; height: auto`, las mismas esquinas y el botón de cerrar encima; si hay `imageUrl`, toda la imagen enlaza. Si falta la imagen de un breakpoint, se usa la del otro.
10. **i18n y convivencia** — exportar `stripBase()` desde `src/utils/i18n.ts` (hoy es privada) y usarla en `Popup.astro` para comparar rutas sin `BASE_URL` ni prefijo `/en`; leer todos los textos con `tField`; y añadir el paso 4 de la regla de visibilidad (esperar a que el modal de cookies esté resuelto).

---

## Sección 5 — Criterios de aceptación

- [ ] En `/admin` la colección "Pop-up promocional" muestra un único documento y no ofrece los botones de crear ni de borrar.
- [ ] Con `enabled: false` el pop-up no aparece en ninguna página.
- [ ] Con `scope: "home"` aparece en `/` y no aparece en `/nosotros`.
- [ ] Con `scope: "rutas"` y `paths: ["/fiberlux-app"]` aparece en `/fiberlux-app` y en `/en/fiberlux-app`, y en ninguna otra.
- [ ] Con `trigger: "segundos"` y `delaySeconds: 3` el pop-up aparece a los 3 segundos, no antes.
- [ ] Con `trigger: "scroll"` y `scrollPercent: 40` aparece al pasar el 40% del alto scrolleable y no al 39%.
- [ ] Con `trigger: "salida"` aparece al sacar el cursor por el borde superior en desktop, y en un dispositivo táctil cae al modo por segundos.
- [ ] Tras cerrarlo y recargar, no vuelve a aparecer.
- [ ] Tras cerrarlo, cambiar `campaignId` y recargar, vuelve a aparecer.
- [ ] Con la fecha del sistema adelantada más de `remindAfterDays` días, vuelve a aparecer.
- [ ] Mostrado una vez, navegar a otra página en alcance dentro de la misma sesión no lo muestra de nuevo.
- [ ] `?popup=1` lo muestra al instante aunque esté cerrado en storage, y al cerrarlo no escribe nada en `localStorage`.
- [ ] En desktop los dos botones miden exactamente el mismo ancho (medido en DevTools).
- [ ] En mobile el panel entra deslizándose desde el borde inferior, no aparece centrado.
- [ ] En mobile, con 8 features, el cuerpo del pop-up scrollea por dentro y la página de fondo no se mueve.
- [ ] Escape, el clic en el fondo y el botón ✕ cierran el pop-up.
- [ ] Con el pop-up abierto, Tab no alcanza ningún elemento por detrás del panel.
- [ ] Al cerrar, la página vuelve a scrollear con Lenis normalmente.
- [ ] Con `prefers-reduced-motion: reduce` el panel aparece sin deslizamiento.
- [ ] Con `mode: "imagen"` sólo se ve la imagen del breakpoint correspondiente y, si hay `imageUrl`, al hacer clic navega.
- [ ] En `/en` los textos con `_en` salen en inglés y los que estén vacíos caen al español.
- [ ] Con `maintenance.enabled: true` el pop-up no aparece.
- [ ] Con el consentimiento de cookies sin responder, el pop-up no aparece; al responderlo, aparece según su disparador.
- [ ] Dejar `features` y `buttons` vacíos no rompe el layout: el pop-up muestra sólo badge, titular e imagen.
- [ ] `astro build` termina sin errores y sin advertencias de tipos nuevos.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** colección de **documento único** con `create: false, delete: false`. Es la forma que ya usan `maintenance` y `cookieConsent`, y hace imposible por construcción tener dos pop-ups.
- **No:** una colección de lista con un `activo` por documento. Permitiría marcar dos como activos y obligaría a inventar una regla de desempate.
- **Sí:** filtrar el alcance **en build**, en el `.astro`. En las páginas fuera de alcance no se emite ni el HTML ni el JS de la isla, así que no hay parpadeo ni coste.
- **No:** filtrar en el cliente comparando `location.pathname`. Cargaría la isla en las 100+ páginas para descartarla en casi todas.
- **Sí:** `scope` con tres valores (`todo` / `home` / `rutas`) en vez de sólo una lista de rutas. "Todo el sitio" es el caso más común y no debería obligar a enumerar 100 paths.
- **Sí:** **un solo `mode`** que aplica a los dos breakpoints, con una imagen por breakpoint. Es el mismo patrón de SPEC 60 y cubre "que tanto mobile como desktop puedan llevar sólo una imagen".
- **No:** un `mode` independiente por breakpoint (desktop nativo + mobile imagen). Duplica los caminos de render y las combinaciones a probar para un caso que nadie ha pedido.
- **Sí:** **dos claves de storage**. `sessionStorage` evita que el pop-up salte en cada navegación dentro de la misma visita; `localStorage` con `closedAt` implementa los N días. Separarlas permite que "visto" y "cerrado" caduquen distinto.
- **Sí:** `campaignId` en la clave de `localStorage`. Sin eso, quien cerró la promo de agosto no vería nunca la de septiembre — el error clásico de esta pieza.
- **Sí:** repliegue del modo `salida` a `delaySeconds` en punteros gruesos. La intención de salida no existe en táctil; sin repliegue, el pop-up simplemente no se vería en móviles y el cliente lo reportaría como un bug.
- **No:** implementar intención de salida en móvil con `visibilitychange` o el gesto de scroll hacia arriba. Son señales ruidosas que disparan falsos positivos.
- **Sí:** el pop-up **espera** al modal de cookies. Dos modales apilados es la peor primera impresión posible, y el de cookies tiene prioridad legal.
- **Sí:** `z-[90]` — encima del header (`z-[80]`) y del buscador (`z-[85]`), debajo del modal de cookies (`z-[100]`). Coherente con la decisión anterior.
- **Sí:** `?popup=1` para previsualizar. Sin eso, el cliente edita en Tina, publica, y para verlo tiene que borrar el storage a mano.
- **Sí:** **sin `transition:persist`**. Con View Transitions (SPEC 110) la isla se remonta en cada navegación; la clave de sesión es la que evita que reaparezca, no la persistencia del nodo. Persistirla dejaría el pop-up flotando al navegar a una página fuera de alcance.
- **Sí:** los botones al **mismo ancho**, ignorando el mockup desktop. Confirmado por el cliente como error de diseño.
- **Sí:** set fijo de íconos con desplegable en Tina, como `about.rubros`. Subir un SVG por ítem termina en logos mal exportados y tamaños dispares.
- **Sí:** exportar `stripBase()` desde `src/utils/i18n.ts` en lugar de duplicar su lógica. Ya es la función que define qué significa "la misma ruta" en este proyecto.
- **Nota de método:** el cliente pidió definir las secciones 2 a 7 sin revisión intermedia una vez cerradas las cinco preguntas de alcance. Los supuestos que quedaron a criterio propio están todos declarados arriba como decisiones.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El pop-up tapa el contenido en cuanto entras y se percibe como spam | Default `trigger: "segundos"` con 5s y `enabled: false` de fábrica. El cliente decide cuándo encenderlo. |
| El cliente cambia el contenido de la campaña y nadie lo ve porque ya lo cerraron | `campaignId` invalida el cierre guardado. Va documentado en la descripción del campo dentro de Tina. |
| `localStorage` deshabilitado (modo privado, navegador restringido) | Todo acceso a storage va en `try/catch`. El pop-up se muestra igual; sólo deja de recordarse, que es el modo degradado aceptable. |
| El scroll queda bloqueado si el pop-up se desmonta sin pasar por su rutina de cierre | La restauración de `body.style.overflow` y `__lenis.start()` va en el `return` del `useEffect`, no en el manejador del clic. |
| La hoja mobile queda más alta que la pantalla en teléfonos pequeños con texto agrandado (SPEC 30/51) | `max-h-[88vh]` con scroll interno y `data-lenis-prevent`; el botón de cerrar va fijo en la cabecera de la hoja, nunca fuera de vista. |
| Dos overlays a la vez si el usuario abre el buscador con el pop-up abierto | El pop-up bloquea el scroll y atrapa el foco mientras está abierto, así que el atajo del buscador no es alcanzable por teclado desde dentro. |
| `mobile-app.png` (untracked) no llega al deploy | El paso 1 del plan incluye añadirla a git junto al `index.json`. |

---

## Lo que **no** entra en este spec

- Más de un pop-up, o rotación entre varios.
- Segmentación por idioma, dispositivo, UTM, geografía o tipo de visitante.
- Programación por fechas de inicio y fin.
- Formulario de captura dentro del pop-up.
- Métricas de impresiones, cierres o clics.
- Variantes de layout nativo más allá de la del mockup.
- Arte nuevo: se usa la imagen que el cliente ya subió.

Cada una de esas, si aterriza, va en su propio spec.
