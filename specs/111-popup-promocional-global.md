# SPEC 111 — Pop-up promocional global (editable en Tina)

> **Estado:** Implementado
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
- **Cuándo aparece:** campo `trigger` con cinco modos — `inmediato`, `segundos` (con `delaySeconds`), `scroll` (con `scrollPercent`), `seccion` (con `sectionIndex`) y `salida` (intención de salida, con repliegue a `delaySeconds` en dispositivos táctiles).
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

## Notas de implementación

### Entrada y salida del panel (pedido del cliente)

El cliente reportó que la entrada se sentía tosca. **Y no era la curva: no
había animación.** El estado visual se activaba con un `requestAnimationFrame`
simple, y el navegador coalesce el montaje y ese cambio en el mismo fotograma:
nunca llegaba a pintar el estado inicial, así que la transición no arrancaba y
el panel aparecía de golpe en su posición final. Se arregla con **doble rAF**
—el primer frame pinta el «antes», el segundo dispara el «después»—.

Con eso ya animando, se separan los dos comportamientos que pidió:

- **Mobile:** sube desde abajo al abrir y baja al cerrar, con la curva de las
  hojas de iOS (`cubic-bezier(0.32, 0.72, 0, 1)`, 420ms), que arranca rápido y
  frena largo. Medido en la entrada: y 688 → 405 → 168 en los primeros 114ms y
  luego 82 → 45 → 25 → 13 → 6 → 2 → 0.
- **Desktop:** sólo fundido, sin desplazamiento. Medido: `y = 0` en todo el
  recorrido y opacidad 0 → 1 en ~290ms; al cerrar, 1.00 → 0.42 → 0.09 → 0.00.

La salida obligó a **retrasar el desmontaje**: antes `close()` ponía
`open: false` y el panel desaparecía de golpe, sin margen para animar. Ahora
apaga el estado visual, espera `EXIT_MS` (420ms, o 0 con
`prefers-reduced-motion`) y recién entonces desmonta. El fondo oscuro funde con
el panel en vez de aparecer y desaparecer de golpe.

### Animación de los íconos (pedido del cliente)

El alcance original dejaba fuera la animación de entrada del contenido
(«sólo la entrada del panel»). El cliente la pidió después, ligera, así que
entra como ampliación:

- **Íconos de los puntos:** entrada escalonada al abrirse el pop-up — opacidad
  0→1 con escala 0.86 → 1.04 → 1, 420ms, retardos de 140/230/320ms. El
  `animation-fill-mode: both` es obligatorio: sin él los íconos se ven un
  instante antes de que arranque su retardo.
- **Ícono de app (mobile):** latido lento del halo, ciclo de 3.2s, escala
  1.000 → 1.035 y desenfoque de 30 → 46px.

Los keyframes viven en `tailwind.config.mjs` y no en `global.css`, que en este
repo **no se bundlea**. Ambas respetan `prefers-reduced-motion` vía
`motion-reduce:animate-none`.

Verificado reiniciando las animaciones con la Web Animations API (medir tras el
montaje no sirve: la isla es `client:idle` y para cuando responde ya
terminaron): a 280ms el primer ícono va al 96%, el segundo al 54% y el tercero
sin arrancar; a 800ms los tres asientan en escala 1.000.

### Ajustes de diseño contra la referencia (pedido del cliente)

Comparando la implementación con los dos artboards, el cliente marcó cinco
diferencias. Todas corregidas:

- **La pill «FIBERLUX APP»** estaba tosca y grande, y sin el degradado del
  diseño. Ahora es más pequeña (11px, `px-3.5 py-1.5`) y lleva un degradado
  horizontal magenta que se apaga hacia la derecha.
- **El panel izquierdo era negro plano.** Lleva el tinte ciruela de la esquina
  superior que tiene el diseño.
- **La imagen de la columna derecha** flotaba con hueco arriba y abajo. Se
  añade el campo `phonePosition` (`bottom` por defecto, o `centro`): abajo se
  pega al borde inferior y se recorta contra él, centrada se ve completa.
- **En mobile la tipografía estaba grande**: el titular entraba en tres líneas
  cuando en la referencia son dos. Titular 28px → 24px, texto de los puntos
  15px → 14px y padding de la hoja 32px → 24px. Verificado: titular en 2
  líneas y cada punto en 2, igual que el artboard.
- **Faltaba el ícono de celular** de la cabecera mobile. Como no hay asset en
  el repo, se dibuja de forma nativa —cuadrado redondeado con el degradado
  rosa→magenta, glifo `LuSmartphone` y halo— y sigue pudiéndose reemplazar
  subiendo una imagen en `appIcon`.

**Pendiente de asset:** en la referencia el teléfono de la columna derecha
arranca más arriba y llena el panel. `mobile-app.png` es un recorte de
416×427, casi cuadrado, así que anclado abajo deja aire ciruela en la parte
superior. Llenarlo del todo requiere un recorte más alto de la imagen; forzarlo
por CSS deformaría el teléfono o le comería los bordes.

### Ampliación posterior — disparador por sección (pedido del cliente)

El cliente pidió que el pop-up salte **al llegar a la segunda sección**. Eso no
es un porcentaje: en la portada la segunda sección empieza en y=928 en desktop
(ventana de 900) y en y=836 en móvil (ventana de 844), así que un `scrollPercent`
fijo acertaría en un tamaño de pantalla y fallaría en el resto.

Se añade un quinto modo, `seccion`, con un campo `sectionIndex` (por defecto 2):
cuenta los bloques de nivel superior de `<main>` **que ocupan espacio** —los que
no pintan nada, como una inyección de HTML vacía, no cuentan— y dispara cuando
el elegido llega al borde superior del viewport. Si la página no tiene esa
sección, se repliega al modo por segundos en vez de no mostrarse nunca.

**Bug encontrado al probarlo:** la primera evaluación corría al montar y la isla
monta con `client:idle`, cuando el layout aún no está asentado: varios bloques
miden 0 y el «segundo visible» puede ser uno que ya está en pantalla. Medido, el
pop-up salía con `scrollY = 0` y la sección todavía a 836px. Se corrige con dos
guardas: no evaluar mientras `scrollY <= 0` (sin scroll no se ha «llegado» a
ninguna sección) y **rebuscar** el bloque en cada evaluación en vez de cachearlo
al montar. Verificado en las dos ventanas: la distancia baja 636 → 436 → 236 →
86 → 6 y dispara al cruzar 0.

El contenido queda **activo** (`enabled: true`) con este modo, que es lo que
pidió el cliente.


Implementado en la rama `spec-111-popup-promocional-global`, un commit por
step del plan. `astro build` verde: 108 páginas, exit 0.

**Dos desviaciones del plan, ambas por necesidad y ninguna cambia el alcance:**

- `stripBase()` se exportó en el **step 2**, no en el 10: la comparación de
  rutas del alcance la necesita desde el primer momento y adelantarla evitó
  escribir código desechable.
- La espera al modal de cookies entró en el **step 7**, no en el 10: es una de
  las seis condiciones de la misma compuerta de visibilidad y separarla habría
  dejado el step 7 con la regla a medias.

**Dos bugs que sólo aparecieron al probar en el navegador** (ambos corregidos
en el step 8, ver `5e6b85f`):

- `body { overflow: hidden }` **no frena a Lenis**, que scrollea por su cuenta
  desde su propio `raf`. Y como la isla monta con `client:idle`, a veces lo
  hace **antes** de que el script del layout asigne `window.__lenis`, así que
  un `stop()` único se perdía: medido, la página corría 1134px por detrás del
  pop-up abierto. Se reintenta el `stop()` hasta 120 frames.
- Al cerrar, el disparador **se rearmaba** y el pop-up volvía solo: al
  instante en vista previa y a los N segundos en el modo por tiempo. Hizo
  falta un estado `dismissed` aparte de `open`, porque `open: false` es
  justo la condición que el disparador espera para volver a armarse.

**Pendientes de contenido** (no de código; el cliente los llena en Tina):

- Las **URLs de las tiendas** ya están puestas: se copiaron de
  `fiberluxApp.hero.downloads[]`, que es donde vivían las de la página
  `/fiberlux-app`. Al ser externas, `localizeHref` las deja intactas también
  en `/en`. Nota de comportamiento: un botón **sin** URL no se pinta —
  deliberado, para no dejar enlaces muertos, y advertido en la ayuda del
  campo en Tina.
- El **ícono de app de mobile** (`appIcon`) está vacío: el mockup lo muestra,
  pero no hay un asset para él en el repo y el spec no autorizaba inventarlo.

## Lo que **no** entra en este spec

- Más de un pop-up, o rotación entre varios.
- Segmentación por idioma, dispositivo, UTM, geografía o tipo de visitante.
- Programación por fechas de inicio y fin.
- Formulario de captura dentro del pop-up.
- Métricas de impresiones, cierres o clics.
- Variantes de layout nativo más allá de la del mockup.
- Arte nuevo: se usa la imagen que el cliente ya subió.

Cada una de esas, si aterriza, va en su propio spec.
