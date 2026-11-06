# SPEC 122 — Lote QA rápido: anclas, textos, orden mobile, timeline, blog y drawer

> **Estado:** Aprobado
> **Depende de:** SPEC 117, SPEC 118, SPEC 119, SPEC 121
> **Fecha:** 2026-11-06
> **Objetivo:** Resolver las observaciones chicas e independientes de la revisión de noviembre (PDF desktop + capturas mobile) que no necesitan un spec propio.

---

## Por qué existe este spec

El cliente mandó 21 observaciones desktop (PDF `Observaciones_Web_Corporativo_Fiberlux.pdf`), 9 mobile (WhatsApp) y un pedido de íconos.
Se registran en `specs/observaciones-cliente.md` como **obs 66–96**. El PDF numera del 1 al 21 y las capturas mobile del 1 al 9.
Mapeo: PDF N → obs 65+N; mobile M → obs 86+M; íconos → obs 96.
El lote se repartió en 7 specs (122–128). Este junta los ajustes de pocas líneas, como hizo SPEC 121.

---

## Scope

**Incluye:**

| Obs | Origen | Observación | Componente / contenido | Cambio |
|---|---|---|---|---|
| 67 | PDF 2 | Al abrir el video debe leerse solo "Fiberlux" | `src/content/home/index.json` → `reel.fullVideoTitle` | "Fiberlux Corporativo" → "Fiberlux" (y `_en` "Fiberlux"). |
| 68 + 72 | PDF 3 y 7 | "Ver soluciones" (Home, `#soluciones`) y "Agendar diagnóstico gratuito" (Cyberguard, `#formulario`) llevan al top | Handler de anclas en `src/layouts/BaseLayout.astro` (~L468–493) | Los `href` y los `id` existen, así que el fallo está en el salto. Se reproduce primero con Playwright; arreglo en el handler compartido. |
| 74 | PDF 9 | La etiqueta dice "PRO Y MAX"; debe decir "PRO" | `src/content/services/ciberseguridad.json` → `cyberguard.escalas.items[1].tag` | "PRO Y MAX" → "PRO" (+ `tag_en`). |
| 76 | PDF 11 | Elementos desalineados en el listado de escenarios | `src/components/servicios/CiberCierreReact.tsx` L26–55 (`queCambia`) | Las 3 celdas de cada fila comparten fila de grid y la misma alineación vertical, con un padding uniforme. |
| 77 | PDF 12 | El FAQ de Cyberguard debe aceptar más ítems | `CiberCierreReact.tsx` L104–140 | Ya es una lista sin límite en Tina (`cyberguard.faq.items`). Lo que falla es `maxHeight: open ? 260 : 0`, que corta las respuestas largas. Se reemplaza por una altura medida (o la técnica `grid-template-rows: 0fr → 1fr`). |
| 80 | PDF 15 | Favicon: antena morada con fondo transparente | `public/` + `BaseLayout.astro` L131 | Nuevo `public/favicon.svg` desde `public/images/soporte-tecnico/isotipo-fiberlux.svg`, relleno `#96237A` y sin fondo. Fallback `favicon-32.png` + `apple-touch-icon.png` (180, este sí con fondo). Se corrige el `type` (hoy declara `image/svg+xml` sobre un PNG). |
| 82 | PDF 17 | Cifra de cobertura "92" → "+100 ciudades" | `src/content/about/index.json` → `stats.items[2].number` (se ve en `/casos-de-exito`) | "92" → "+100". El hito del timeline "Red propia presente en 92 ciudades" **no** se toca (es un dato histórico). |
| 83 | PDF 18 | Ocultar la franja de aliados en todas las páginas | `src/components/home/HomePartnersV2.astro` (Home, `/soluciones`) y `src/components/servicios/CategoriaCierreReact.tsx` L41–67 (categorías) | Nuevo toggle global `global.partners.visible` (default `false`). Ninguna franja se pinta si está apagado. |
| 85 | PDF 20 | ¿Las opciones de "Más soluciones" son editables? | `SolucionV2React.tsx` L148–176 | Ya lo son: salen del "Catálogo de soluciones" de cada categoría. Sin cambio de código; se responde al cliente y se registra. |
| 88 | Mobile 2 | Las manos deben juntarse a mitad de pantalla | `src/components/home/HomeManifestoReact.tsx` L24–39 | En mobile el progreso se calcula sobre el centro de la franja de manos (no sobre el 55% de la sección). `p = 1` cuando ese centro llega a `H/2`. Desktop igual. |
| 89 | Mobile 3 | "+10000 clientes" → "+5500" (también desktop) | `about/index.json` → `porQue.items[2].title` (+ `_en`) | "+5500 clientes del segmento empresarial" / "5,500+ business clients". |
| 90 | Mobile 4 | Bloque de Nosotros alternado: en mobile debe leerse texto/foto/texto/foto | `src/components/nosotros/NosotrosIntroReact.tsx` L62–120 | En `< lg` el texto va siempre primero (`order` en mobile). Desktop conserva la alternancia. |
| 91 | Mobile 5 | El punto de la línea de Metodología debe ir más arriba (desde mitad de pantalla) | `src/components/shared/fx/StepsTimeline.tsx` L15–55 | En vertical (`< lg`) el punto sigue la línea `H/2`: `p = clamp((H*0.5 − rect.top) / rect.height, 0, 1)`. Horizontal (desktop) sin cambios. Aplica también a los pasos de Cyberguard (mismo componente). |
| 92 | Mobile 6 | Misión/Visión con orden consistente en mobile | `src/components/nosotros/NosotrosMisionValoresReact.tsx` L67–74 | En `< lg` ambos bloques van texto → foto. Desktop igual. |
| 93 | Mobile 7 | El filtro "Todos" no muestra todos y "Cloud" sí | `src/components/blog/BlogV2React.tsx` L41–51 | Hoy "Todos" excluye al destacado (`posts.slice(1)`) y las categorías no. Las categorías también filtran sobre `posts.slice(1)`, porque el destacado ya se ve arriba. Así "Todos" siempre es el superconjunto. |
| 94 | Mobile 8 | En el drawer no se puede ir a la página de la categoría | `src/components/shared/HeaderV3React.tsx` L542–566 | La fila de cada categoría suma un enlace "Saber más" a la derecha (al sitio marcado por el cliente), que lleva a la categoría. El nombre + chevron siguen abriendo el acordeón. Clave i18n `drawer.more` ("Saber más" / "Learn more") en `src/i18n/ui.ts`. |

**Fuera de scope (otros specs):**

- Reel del Home: sonido, activación y expansión (obs 66, 69, 70, 87) → SPEC 123.
- Matriz de Cyberguard, efecto 24/7, planes en el formulario y menú de portafolio (obs 73, 75, 78, 86) → SPEC 124.
- Campos del formulario, canales de Soporte y botón de llamada (obs 79, 81, 95) → SPEC 125.
- Sello ISO animado (obs 84) → SPEC 126.
- Legales como páginas (obs 71) → SPEC 127.
- Íconos Lucide en el CMS (obs 96) → SPEC 128.
- Cambiar el hito "92 ciudades" del timeline de Nosotros.

---

## Modelo de datos

Un solo cambio de schema en `tina/config.ts`, dentro de `global.partners`:

```ts
{ name: "visible", label: "Mostrar franja de aliados en el sitio", type: "boolean" }
```

```jsonc
// src/content/global/index.json
"partners": { "visible": false, /* resto igual */ }
```

- `visible` ausente o `false` ⇒ no se pinta ninguna franja (Home, `/soluciones`, categorías).
- `service.partners.logos` y `global.partners` se conservan para cuando se vuelva a encender.

El resto son cambios de contenido JSON (obs 67, 74, 82, 89) y de presentación.

---

## Plan de implementación

Rama: `fix-lote-qa-obs-66-96` contra `staging`.

1. **Contenido (67, 74, 82, 89).** Editar los 4 valores en JSON (ES + `_en`). Verificación: `npm run build` y revisar el modal del reel, la etiqueta de escalas, `/casos-de-exito` y Nosotros.
2. **Anclas (68 + 72).** Reproducir con Playwright a 1512×900 y 390×844: clic en "Ver soluciones" (Home) y en "Agendar diagnóstico gratuito" / "Ver planes" (`/soluciones/ciberseguridad`). Documentar la causa en el tracker y arreglar el handler de `BaseLayout.astro`. Verificación: el `top` del destino queda a 80px ±8px del borde superior.
3. **Escenarios (76).** Alinear las celdas por fila. Verificación: a 1512px, las 4 filas tienen las 3 celdas con el mismo `top` de texto (±2px).
4. **FAQ (77).** Quitar el tope de 260px. Verificación: una respuesta de 600 caracteres se ve entera a 390px; se agrega un ítem en Tina local y aparece.
5. **Favicon (80).** Generar el SVG y los PNG y actualizar los `<link>`. Verificación: pestaña con la antena morada sin fondo, en Chrome y Safari.
6. **Franja de aliados (83).** Agregar `global.partners.visible` y condicionar los dos renders. Verificación: con `false` no hay franja en Home, `/soluciones` ni las 4 categorías; con `true` vuelve.
7. **Manos (88).** Recalcular el progreso mobile sobre el centro de la franja. Verificación: a 390×844, offset 0 cuando el centro de las manos está a `H/2` ±20px.
8. **Orden mobile (90, 92).** Reordenar con `order-*` solo bajo `lg`. Verificación: a 390px, Nosotros alterna texto/foto en los dos bloques; a 1512px igual que hoy.
9. **Timeline (91).** Progreso vertical ligado a `H/2`. Verificación: a 390×844 la cabeza del punto queda en `H/2` ±24px mientras la lista cruza el centro (Nosotros y Cyberguard).
10. **Blog (93).** Filtrar las categorías sobre `posts.slice(1)`. Verificación: con N posts, "Todos" muestra N−1 en la grilla y cada categoría ≤ N−1.
11. **Drawer (94).** Enlace "Saber más" en la fila de cada categoría. Verificación: a 390px, tocar "Saber más" navega a `/soluciones/{cat}` (y `/en/...` en EN); tocar el nombre solo abre el acordeón.
12. **Registro.** obs 66–96 en `specs/observaciones-cliente.md` (el resto queda `Pendiente` con su spec). Las de este spec pasan a `Hecho`, y la 85 a `Hecho (ya existía)`. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] El modal del video completo muestra "Fiberlux" (ES y EN).
- [ ] Clic en "Ver soluciones" (Home) desplaza hasta `#soluciones`, no al top (desktop y mobile).
- [ ] Clic en "Agendar diagnóstico gratuito" y en "Ver planes" desplaza hasta `#formulario` y `#planes`.
- [ ] La segunda escala de Cyberguard dice "PRO".
- [ ] En "Qué cambia", las 3 celdas de cada fila están alineadas (±2px) a 1512px.
- [ ] Una respuesta larga del FAQ de Cyberguard no se corta.
- [ ] El favicon es la antena morada con fondo transparente; no hay `<link rel="icon">` con un `type` incorrecto.
- [ ] `/casos-de-exito` muestra "+100" en la cifra de ciudades.
- [ ] Nosotros muestra "+5500 clientes del segmento empresarial" (ES) y "5,500+ business clients" (EN).
- [ ] Con `global.partners.visible = false` no hay franja de aliados en ninguna página.
- [ ] A 390×844 las manos del Manifiesto se tocan cuando su centro está a mitad de pantalla.
- [ ] A 390px los bloques de Nosotros (intro y Misión/Visión) siguen el orden texto → foto.
- [ ] A 390×844 el punto del timeline (Nosotros y Cyberguard) avanza a la altura de la mitad de pantalla.
- [ ] En el blog, "Todos" nunca muestra menos tarjetas que una categoría.
- [ ] En el drawer mobile cada categoría tiene "Saber más", que navega a su página.
- [ ] A 1512px no cambia nada de lo que no está en esta tabla (manos, timeline y orden desktop iguales).
- [ ] `npm run build` en verde, sin scroll horizontal nuevo a 390px.
- [ ] obs 66–96 registradas en `specs/observaciones-cliente.md`.

---

## Decisiones

- **Sí:** repartir las 31 observaciones en 7 specs. Así se pueden implementar, revisar y mergear por separado; este lote no espera a los que tienen diseño o contenido pendiente.
- **Sí:** el autor pidió escribir los 7 specs juntos, con una sola revisión consolidada, para no perder ninguna observación. Se cambió el flujo sección por sección por este.
- **Sí:** reproducir el bug de anclas antes de tocarlo. Los `href` (`#soluciones`, `#formulario`) y los `id` existen, así que la causa no es de contenido.
- **Sí:** el toggle de aliados es global (`global.partners.visible`), no uno por página. El cliente pidió ocultarla "en todas las páginas"; un solo switch es más simple de prender después.
- **No:** borrar logos o el schema de partners. Se van a volver a mostrar.
- **Sí:** en el blog, el destacado no se repite en la grilla con ningún filtro. Es la forma consistente de que "Todos" sea siempre el superconjunto.
- **No:** mostrar el destacado también en la grilla de "Todos". Se duplicaría la tarjeta.
- **Sí:** "Saber más" como enlace aparte en la fila de la categoría, como propuso el cliente. Convertir el nombre en enlace rompería el acordeón en touch.
- **Sí:** favicon SVG con fallback PNG. Se usa el isotipo existente del sitio; si no es la "antena" que espera el cliente, se cambia el asset sin tocar el código.
- **No:** cambiar el "92 ciudades" del timeline. Es un hito con año, no la cifra actual.
- **Sí:** el ajuste del timeline vale también para Cyberguard, porque comparten `StepsTimeline`.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El bug de anclas viene de las secciones pinneadas o scroll-jacked (reel de 240vh, Soluciones) que cambian el layout mientras Lenis anima | Paso 2 reproduce primero. Si es eso, se calcula el destino al final de la animación (o se re-apunta con `lenis.scrollTo` al terminar). |
| El isotipo SVG no es la "antena" que pidió el cliente | Se muestra en el QA. Cambiar el archivo no toca el código. |
| El reorden mobile con `order-*` rompe los reveals por dirección (`data-reveal="left/right"`) | Revisar los `data-reveal` del bloque a 390px; si hace falta, `data-reveal-only` (obs 37) para limitar la dirección a desktop. |
| `p` ligado a `rect.height` hace que el punto avance muy lento en listas largas | Es lo que pide el cliente (que acompañe la lectura). Se verifica en las dos instancias. |

---

## Qué **no** entra en este spec

- Reel del Home (SPEC 123).
- Cyberguard: matriz, efecto 24/7, formulario y menú (SPEC 124).
- Formularios, canales y botón de llamada (SPEC 125).
- Sello ISO (SPEC 126).
- Legales como páginas (SPEC 127).
- Íconos Lucide (SPEC 128).
