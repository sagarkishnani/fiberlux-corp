# SPEC 117 — Rediseño 1: fundaciones, chrome y Home

> **Estado:** Aprobado
> **Depende de:** SPEC 80 (i18n ES/EN), SPEC 81 (búsqueda overlay), SPEC 110 (View Transitions), SPEC 111 (popup promocional)
> **Fecha:** 2026-11-01
> **Objetivo:** Montar el nuevo sistema visual claro del prototipo (tokens, tipografía, header, footer, flotantes) y rehacer el Home completo, incluido el Reel con video loop y el visor del video completo.

---

## Por qué existe este spec

Fiberlux pasa de un diseño oscuro (staging actual) a un **rediseño claro** definido en dos prototipos HTML (desktop y mobile) con 13 plantillas. Es demasiado grande para un spec, así que se divide en cuatro:

- **SPEC 117 (este):** fundaciones + chrome + Home.
- **SPEC 118:** Nosotros, Casos de éxito, Blog y Artículo.
- **SPEC 119:** Categoría, Solución y Ciberseguridad.
- **SPEC 120:** Contacto, Soporte, Formas de pago, Fiberlux App, Legal e Info abonados.

Este spec va primero porque todo lo demás hereda sus tokens, header y footer.

**Referencia de diseño.** Los prototipos son bundles autocontenidos (`Fiberlux - Prototipo Desktop.html` y `Fiberlux - Prototipo Mobile.html`, en Downloads del autor). Antes de implementar se copian a `references/rediseno/` y se desempaquetan: manifest base64+gzip → `assets/*` + una página `*.dc.html` por plantilla. Medidas, colores, tiempos de animación y textos se toman **de ese HTML**, no a ojo.

**Flujo de ramas.** No hay rama de integración aparte. Cada spec sale de `staging` en su rama `spec-NN-*` y vuelve por PR a `staging`, que despliega en `fiberlux.pe/staging/`. Mientras dure el rediseño, staging convive con páginas claras (nuevas) y oscuras (pendientes). Es una decisión aceptada.

**Respaldo (ya hecho, 2026-11-01).** El diseño oscuro quedó congelado en `67acd01`, el último commit de `origin/staging`:

- Rama `archive/staging-v1-dark`.
- Tag anotado `staging-v1-final-2026-11-01`.

Los dos están en origin y ninguno dispara deploy.

---

## Scope

**In:**

- **Respaldo de staging** (ver arriba; ya ejecutado).
- **Tokens del tema claro** en `tailwind.config.mjs`:
  - Fondo `#F6F6F6`.
  - Morado `#96217A` y sus variantes, con los valores exactos del prototipo.
  - Grises de texto.
  - Radios y sombras.
- **Tipografía:** Poppins (300–700) + JetBrains Mono (400/500). JetBrains Mono reemplaza a Space Mono.
- **Header nuevo:**
  - Topbar: Empresas/Negocios, "Información a abonados y usuarios" y el switcher ES/EN del SPEC 80.
  - Logo.
  - Nav en píldora oscura con el mega-menú de Soluciones (categorías + soluciones destacadas + "Ver todo").
  - Lupa, que mantiene `SearchOverlay` del SPEC 81.
  - CTA "Contacto".
  - Botón de menú (drawer).
  - Versión mobile según el prototipo mobile.
- **Footer nuevo** (morado oscuro, esquinas redondeadas superiores):
  - Columnas Servicios, Sobre nosotros, Legales y Solicitudes.
  - Redes sociales.
  - Créditos TWNSTUDIOS.
- **Flotantes:** botón de accesibilidad (reusa `AccessibilityPanel`) y WhatsApp con la etiqueta expandible "Escríbenos".
- **Home, en el orden del prototipo:**
  1. **Hero:** título con énfasis en morado, subtítulo, dos CTA y mapa mundial de puntos con Perú resaltado.
  2. **Cifras:** barra morada con 4 stats.
  3. **Reel:** sección sticky de 240vh con dos marquees de texto outline. El video arranca dentro de una card y se expande con el scroll.
  4. **Soluciones:** 5 categorías con interacción hover (desktop) y la variante del prototipo mobile.
  5. **Somos más que internet:** composición con las manos.
  6. **Banner Cyberguard.**
  7. **Partners:** marquee de logos en dos filas.
  8. **Testimonios:** slider con flechas, barra de progreso y **visor de video modal**.
  9. **Certificaciones.**
  10. **Insights / Blog:** 3 últimos posts y "Ver todos".
- **Video del Reel:**
  - Loop de **20 s tomado desde el inicio** del original (`fiberlux-corp-video.mp4`, 92 s, 1080p, 107 MB), sin audio.
  - 4 archivos: `reel-1080.webm` (VP9), `reel-1080.mp4` (H.264), `reel-720.webm` y `reel-720.mp4`, más `reel-poster.jpg`, todos en `public/videos/home/`.
  - Carga diferida: `preload="none"` hasta que la sección está cerca del viewport (IntersectionObserver). Se pausa fuera de pantalla.
- **Video completo:**
  - Botón **"Ver video completo"** sobre el Reel que abre un modal con el video de 92 s.
  - Archivos `fiberlux-corp-full-1080.mp4` (H.264 + AAC) y `fiberlux-corp-full-720.mp4`, en `public/videos/home/`.
  - **Solo se descargan al abrir el modal.**
  - Cierre con X, Esc o clic fuera, y el video se pausa al cerrar.
- **Campos CMS** (colección `home`, con `_en` donde aplique) para todo lo nuevo:
  - Hero.
  - Reel (URLs de videos, póster, texto del botón, marquees).
  - Somos más que internet.
  - Banner Cyberguard.
  - Certificaciones intro.
  - Las URLs del video completo son editables, para cambiarlas por YouTube cuando exista.
- **Limpieza del Home oscuro de staging** (el rediseño lo reemplaza entero):
  - Hero actual y todos sus modos de `home.hero.heroBackground` (`3d`, `video`, `imagen`, `waveform`, `nodefield`, `morph`, `cinematic`, `dotfield`, `lattice`, `fiber`, `planeta`): `HeroHomeReact`, `HeroLogoIntro`, `SplineScene` y los efectos en `src/components/effects/` que solo usa el hero.
  - El campo `heroBackground` y sus subcampos en el schema.
  - Tramo narrativo (SPEC 113–116): `ScrollChapter`, `Manifiesto`, `chapters.ts`, `narrativeCut.ts` y el markup `data-narrative` de `index.astro`.
  - `NebulaBackdrop` (SPEC 100) y el prefetch de escenas Spline de `index.astro`.
  - Bloques del Home que el prototipo no tiene o reemplaza: `SolucionesStack`, `EmpresasRed` (con `scrubCounters`, SPEC 114) y `BannerApp`, solo en el Home.
  - Se quitan las dependencias `@splinetool/react-spline`, `@splinetool/viewer`, `three` y `@types/three` **si** ninguna otra página las usa.
  - Se borran los modelos en `public/models/` que queden sin referencia.
  - Regla: antes de borrar cada componente se hace `grep` de imports. Lo que todavía usen otras páginas (pendientes de los SPEC 118–120) **no** se borra.
- **Se mantienen** con el header nuevo: View Transitions (`ClientRouter`, SPEC 110), popup promocional (SPEC 111), `HtmlInjection` y el panel de accesibilidad.
- **i18n:** todo texto nuevo lleva su campo `_en` o pasa por `t()`, y se mantienen las rutas `/en`.

**Fuera de scope (para specs posteriores):**

- Resto de páginas: SPEC 118, 119 y 120.
- Formularios OSIPTEL o reclamos: siguen con su lógica actual y solo heredan header y footer.
- Publicar el video en YouTube (solo se deja el campo listo).
- SEO por idioma (hreflang).
- Cutover a producción y cambios al workflow de deploy.
- Rediseño del panel `/admin` o del panel de leads PHP.

---

## Data model

Se reutilizan las colecciones de Tina actuales. Solo se **agregan** campos a `home` (en `tina/config.ts`) y se elimina `hero.heroBackground` con los subcampos de todos sus modos (Spline, video, waveform, nodefield, morph, cinematic, dotfield, lattice, fiber, planeta).

```ts
// home (campos nuevos; cada string traducible tiene su hermano _en)
hero: {
  titleBefore, titleEmphasis, titleAfter,   // "Soluciones de" / "conectividad y TI" / "para tu empresa"
  subtitle,
  ctaPrimary:   { label, href },            // "Ver soluciones" → #soluciones
  ctaSecondary: { label, href },            // "Conoce más" → /nosotros
}
reel: {
  marqueeTop, marqueeBottom,                // strings con separador " • "
  loopWebm1080, loopMp41080, loopWebm720, loopMp4720, poster,   // rutas en /videos/home/
  fullVideoLabel,                           // "Ver video completo"
  fullVideoMp41080, fullVideoMp4720,        // o URL de YouTube en el futuro
  fullVideoYoutubeUrl,                      // opcional; si existe, el modal usa iframe
}
manifesto: { eyebrow, title }               // "SOMOS MÁS QUE INTERNET" / "Somos la infraestructura..."
cyberguardBanner: { eyebrow, title, text, cta: { label, href }, image }
certificacionesIntro: { eyebrow, title, text }
```

Las cifras, soluciones, partners, testimonios, certificaciones y blog se siguen leyendo de sus fuentes actuales (`home.stats`, `services`, partners, testimonios, `certificaciones`, `post`). Si a una de esas fuentes le falta un dato que el prototipo muestra, se agrega como campo opcional en su colección.

Comando de referencia para los videos (ffmpeg local; los archivos generados sí se versionan):

```bash
# loop 20 s, sin audio
ffmpeg -ss 0 -t 20 -i fiberlux-corp-video.mp4 -an -vf scale=1920:-2 -c:v libvpx-vp9 -crf 36 -b:v 0 reel-1080.webm
ffmpeg -ss 0 -t 20 -i fiberlux-corp-video.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 26 -preset slow -movflags +faststart reel-1080.mp4
# (idem 720 con scale=1280:-2)
# completo 92 s
ffmpeg -i fiberlux-corp-video.mp4 -vf scale=1920:-2 -c:v libx264 -crf 25 -preset slow -c:a aac -b:a 128k -movflags +faststart fiberlux-corp-full-1080.mp4
```

Presupuesto de peso:

- Loop 1080: ≤ 4 MB por formato.
- Loop 720: ≤ 2 MB por formato.
- Completo 1080: ≤ 30 MB.
- Completo 720: ≤ 15 MB.

---

## Implementation plan

1. Rama `spec-117-rediseno-fundaciones-home` desde `staging`. Copiar los prototipos a `references/rediseno/` y desempaquetarlos con un script (`scripts/unpack-prototipo.mjs`). Copiar los assets usados (mapa, manos, logos, svg de redes, a11y) a `public/images/rediseno/`.
2. Tokens en `tailwind.config.mjs` y fuentes (Poppins + JetBrains Mono) en `BaseLayout`. Fondo claro global. El sitio sigue compilando; las páginas viejas pueden verse mal y es aceptado.
3. Nuevo header (`HeaderV3React.tsx` + `.astro`): topbar, nav píldora, mega-menú, lupa con `SearchOverlay`, CTA y drawer mobile. Reemplazarlo en `BaseLayout`.
4. Nuevo footer (`FooterV2React.tsx` + `.astro`) y flotantes (accesibilidad y WhatsApp "Escríbenos"). Reemplazarlos en `BaseLayout`.
5. Schema Tina: campos nuevos de `home` con `_en`, borrar `heroBackground` y sus subcampos y cargar el contenido ES/EN en `src/content/home/`. Build local verde (ver memoria "build local con schema Tina nuevo").
6. Home: Hero (mapa de puntos) + Cifras.
7. Generar los videos con ffmpeg y armar el Reel (sticky, marquees, card que se expande, carga diferida y pausa fuera de viewport).
8. Modal del video completo (botón, descarga solo al abrir, Esc/X/clic fuera, pausa al cerrar, soporte de `fullVideoYoutubeUrl`).
9. Soluciones (hover desktop / variante mobile) + Somos más que internet + Banner Cyberguard.
10. Partners + Testimonios con visor de video + Certificaciones + Insights.
11. Animaciones de entrada (`data-reveal`) con los tiempos del prototipo. Respetar `prefers-reduced-motion`.
12. Limpieza: borrar hero oscuro y todos sus modos, tramo narrativo, Nebula, bloques del Home reemplazados, dependencias y modelos sin uso. Verificar con `grep` que nada los importe y que la navegación con View Transitions siga funcionando.
13. Wrapper `/en` revisado y actualización de `CLAUDE.md` (sección Styling, 3D/animations, nuevo header/footer).

---

## Acceptance criteria

- [ ] `archive/staging-v1-dark` y `staging-v1-final-2026-11-01` existen en origin y apuntan a `67acd01`.
- [ ] `npm run build` termina sin errores.
- [ ] En 1440px, el Home coincide sección por sección con `Fiberlux Home.dc.html` del prototipo desktop (orden, textos, colores, tipografías).
- [ ] En 390px, el Home coincide con el prototipo mobile.
- [ ] Header y footer nuevos se ven en **todas** las rutas, ES y `/en`.
- [ ] La lupa abre la búsqueda del SPEC 81 y el switcher ES/EN funciona.
- [ ] El mega-menú de Soluciones lista las 5 categorías y enlaza a rutas existentes.
- [ ] Los 4 archivos del loop cumplen el presupuesto de peso.
- [ ] El loop no descarga bytes (pestaña Network) antes de que el Reel esté cerca del viewport.
- [ ] En mobile se sirve la variante 720.
- [ ] El video completo no aparece en Network hasta pulsar "Ver video completo".
- [ ] Al pulsar "Ver video completo" se abre el modal y se reproduce con audio los 92 s.
- [ ] Esc, X y clic fuera cierran el modal y el video queda pausado.
- [ ] Si `fullVideoYoutubeUrl` tiene valor, el modal usa el iframe de YouTube.
- [ ] Todos los textos nuevos del Home son editables en `/admin`.
- [ ] En `/en`, el Home muestra los `_en` y cae a ES si están vacíos.
- [ ] `grep -rn "heroBackground\|ScrollChapter\|data-narrative\|NebulaBackdrop\|HeroLogoIntro" src tina/config.ts` no devuelve resultados.
- [ ] `package.json` no contiene `@splinetool/*` ni `three`, salvo que otra página siga usándolos (en ese caso se lista en el PR cuál).
- [ ] Navegar Home → otra página → Home con View Transitions no deja errores ni videos sonando.
- [ ] Con `prefers-reduced-motion: reduce`, el Reel muestra el video sin la expansión animada y los reveals no animan.
- [ ] La consola del navegador queda sin errores en Home ES y EN.

---

## Decisiones

- **Sí:** respaldo en rama + tag (`archive/staging-v1-dark`, `staging-v1-final-2026-11-01`). La rama permite reabrir el diseño oscuro y el tag lo fija de forma inmutable.
- **Sí:** trabajar directo contra `staging` (decisión del autor). Implica que staging mezcla diseños mientras dure el rediseño.
- **No:** rama de integración `redesign` con preview en `fiberlux.pe/redesign/`. Se descartó para no tocar el workflow de deploy.
- **Sí:** dividir el rediseño en 4 specs (117–120), escritos todos desde ya para no perder el plan.
- **Sí:** loop corto de 20 s desde el inicio del video. El tramo exacto se puede redefinir después cambiando solo los archivos.
- **No:** los 92 s en loop dentro de la página. A 107 MB, o incluso comprimido a unos 25 MB, castigaría la carga de todos los visitantes.
- **Sí:** video completo autoalojado y descargado solo al abrir el modal. Hoy no está en YouTube, y el campo `fullVideoYoutubeUrl` deja la migración en un cambio de contenido.
- **Sí:** WebM VP9 + MP4 H.264 en dos resoluciones. VP9 pesa menos y H.264 cubre Safari antiguo.
- **No:** AV1. El encoding es lento y Safari no lo soporta en forma general.
- **No:** CDN o hosting externo del video. Por ahora el servidor SFTP alcanza; se reevalúa si hay problemas de ancho de banda.
- **Sí:** eliminar el hero oscuro con todos sus modos y el tramo narrativo (decisión del autor: "que se limpie"). El código sigue disponible en la rama de respaldo y el tag.
- **Sí:** renumerado de 82–85 a 117–120. La primera versión se numeró mirando `main`, pero `staging` ya llegaba al SPEC 116; la limpieza se corrigió contra el Home real de staging.
- **Sí (asumido):** reutilizar las colecciones de Tina e i18n actuales y agregar solo campos nuevos. El cliente no pierde el contenido cargado.
- **Sí (asumido):** fidelidad 1:1 con el prototipo, con valores extraídos del HTML. El cliente suele exigir réplica fiel.
- **Sí:** componentes nuevos `HeaderV3` y `FooterV2` en vez de editar los actuales. Así el cambio se revierte limpiamente y se pueden comparar.
- **Definición rápida:** el autor pidió asumir el resto y guardar. Las dos decisiones marcadas "asumido" no se confirmaron explícitamente.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Staging se ve inconsistente (páginas claras + oscuras) mientras avanzan 118–120 | Aceptado por el autor. Avisar al cliente que staging está en transición. |
| El tema claro global rompe contraste en páginas viejas | Aceptado temporalmente. Los specs 118–120 las rehacen. |
| Los videos en `public/` engordan el repo y cada deploy SFTP | Solo se versionan los archivos finales comprimidos (≤ unos 55 MB en total). El original de 107 MB **no** entra al repo. |
| Autoplay bloqueado en iOS con ahorro de energía | `muted` + `playsInline` + póster visible; si no reproduce, queda el póster. |
| Borrar componentes que todavía usan páginas pendientes | Antes de borrar cada componente, `grep` de imports. Solo se borra lo que queda sin referencias. |
| Cambio de schema Tina rompe el build en CI | Seguir la memoria "build local con schema Tina nuevo" antes del PR. |

---

## Lo que **no** entra en este spec

- Nosotros, Casos, Blog, Artículo (SPEC 118).
- Categoría, Solución, Ciberseguridad (SPEC 119).
- Contacto, Soporte, Formas de pago, Fiberlux App, Legal, Info abonados (SPEC 120).
- YouTube, hreflang, cutover a producción.
