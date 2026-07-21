# Observaciones del cliente — checklist de seguimiento

> Fuente: carpeta `~/Downloads/observaciones_fiberlux/` (capturas + videos + textos de WhatsApp de Miguel).
> Registrado: 2026-07-21. Este archivo es la **fuente de verdad** del estado de cada observación.

**Estados:** `Pendiente` · `En curso` · `Hecho` (implementado en rama) · `Mergeado` · `Diferido` · `Necesita aclaración`

---

## Checklist

| # | Observación | Página / Sección | Tipo | Estado | Notas |
|---|---|---|---|---|---|
| 1 | Raya/línea **blanca** arriba (bajo la topbar) al hacer scroll | Home + subservicio · **mobile** | Bug visual | **Hecho** | Causa: html/body con fondo transparente → canvas blanco del navegador en overscroll (Android). Fix: `html { background:#0a0a0a }`. |
| 2 | El **drag se queda a la mitad** y no corre a la siguiente card | Soluciones slider · **mobile** | Bug (motor slider) | **Hecho (pend. verif. Android)** | `snap-mandatory` en soluciones. Verificado en desktop; falta prueba touch real. |
| 3 | La sección **se lagea** al cambiar de testimonio | Testimonios · **mobile** | Bug (motor slider) | **Hecho (pend. verif. Android)** | Sin blur/re-render; era feel del snap → `snap-mandatory`. Si persiste, requiere profiling en el device. |
| 4 | Agregar **degradado de profundidad** + **cambio de color en las letras** (números) | Stats "¿Por qué Fiberlux?" | Mejora diseño | **Hecho (best-effort)** | Panel con degradé de profundidad + cards glass + números con gradiente. |
| 5 | Agregar detalle **glass** al fondo de las cards ISO (no se nota el contenedor en bajo brillo) | Certificaciones (ISO) · mobile | Mejora diseño | **Hecho (best-effort)** | Cards ISO con glass (brillo arriba + magenta abajo + borde). |
| 6 | **Rubros: actualizar íconos** según referencia | Rubros (Nosotros) | Diseño/contenido | **Hecho** | Todos los íconos de rubros remapeados al estilo outline (Lucide), coincidiendo con la referencia. |
| 7 | Bug del **carrusel al dar clic en la flecha** (video 0:07) | Rubros (Nosotros) | Bug (motor slider) | **Hecho (pend. verif. Android)** | Motor: se suprime el touch-settle tras un scroll programático (`suppressSettleUntil`) → la flecha ya no salta. Aplica a los 3. |
| 8 | Se **bugea el carrusel al dar clic en las flechas** (video 0:04) | Catálogo de soluciones | Bug (motor slider) | **Hecho (pend. verif. Android)** | Mismo fix del motor (7). Catálogo ya era `snap-mandatory`. |
| 9 | Subir el **degradado a negro más arriba** (legibilidad) + **raya blanca** | Subservicio hero (modo imagen) · mobile | Mejora + bug | **Hecho** | Raya blanca (=obs_1) + overlay reforzado arriba (degradado vertical extra en mobile). |
| 10 | Más **glass/degradado** en las cards; en bajo brillo no se diferencia la card | Soluciones slider (cards) | Mejora diseño | **Hecho (best-effort)** | Card activa glass (blur+brillo+magenta multi-tono) + glow derecho + grano. |
| 11 | Usar el **mismo texto que casos de éxito** (Gloria) + opción de **cambiar foto por logo** | Testimonios | Contenido + CMS | **Hecho** | Contenido replicado de casos + card usa logo si no hay foto (sin cambio de schema). |
| 12 | Opción de poner el **logo del grupo en vez de las comillas** | Casos de éxito (card) | CMS | **Hecho** | Card de casos: logo en vez de comilla cuando hay logo. + mediaUrl en poster/logo. |
| 13 | Revisar **contenido de testimonios** (texto/logo Boticas + 3ro de casos de éxito) | Testimonios | Contenido | **Hecho** | Testimonios = Boticas + Cámara Arequipa + Gloria (contenido de casos). Avatares vacíos (cliente sube foto/logo). |
| 14a | Un **vector distinto** en el "desafío" de cada categoría | Sección "El desafío" (por categoría) | Asset/contenido | Pendiente | Requiere un gráfico por categoría. |
| 14b | La info **solo se amplía en Conectividad**, no en las otras categorías | Catálogo de soluciones (hover-reveal) | Bug/feature | **Hecho** | Era contenido: solo Conectividad tenía descripciones. Autocompletadas las 3 categorías (27 items) desde el intro del subservicio. Cliente puede refinar en Tina. |
| 15 | Notar **más el degradé de fondo** | Form "Déjanos tus datos" (subservicio) | Mejora diseño | **Hecho (best-effort)** | Degradés de fondo del form subidos. |
| 16 | Otro **degradé a la derecha**, más fuerte, **efecto grano**, 3 tonalidades (no morado→negro) | Soluciones slider · desktop | Mejora diseño | **Hecho (best-effort)** | Ídem 10 (glow ambos lados, grano, multi-tono). |
| 17 | En pantallas **grandes** el formulario se aleja mucho; acercarlo | Contacto · desktop grande | Mejora responsive | **Hecho (best-effort)** | Grid acotada a 1200 + gap menor → form más cerca en pantallas grandes. |
| 18 | **Fade/desvanecimiento** en los bordes al deslizar (sin corte brusco) | Carruseles ISO + Soluciones | Mejora diseño | **Hecho (best-effort)** | Máscara de fade en el borde derecho de carruseles soluciones + ISO. |
| 21 | Aumentar el tamaño de la **statement de "Casos de uso"** (similar a soluciones/partners) | Subservicio · sección Casos de uso | Mejora | **Hecho** | `text-[24px] md:text-[36px]` → `text-[30px] md:text-[48px]`. |
| 20 | Header **opaco/blur desde el inicio** (sin scroll) para que el menú no se pierda sobre el hero de imagen | Páginas de solución (`/soluciones/*`) | Mejora | **Hecho** | Prop `solidOnLoad` en el header, activada por ruta en BaseLayout. Home y demás siguen transparentes al tope. |
| 19 | Subir **opacidad del glass** de los forms para que se note más | Forms de soluciones ("¿Conversamos?") | Mejora diseño | **Hecho** | Glass de forms de hero (subservicio+solución) subido a bg-white/[0.08] + border/blur. |

---

## Agrupaciones sugeridas (para specs)

- **A · Motor de sliders (flechas + drag):** 2, 7, 8 → un solo fix del `useDragSlider` (flechas que no avanzan / drag a medias).
- **B · Glass / degradados / grano:** 5, 10, 15, 16, 19 (y en parte 9) → tratamiento visual unificado de cards y forms (más glass, degradé más fuerte, grano, visibilidad en bajo brillo).
- **C · Testimonios ↔ Casos de éxito (contenido + logo/comillas):** 11, 12, 13 → alinear contenido y agregar opción logo.
- **D · Bugs visuales sueltos:** 1/9 (raya blanca), 3 (lag testimonios), 14b (catálogo solo en Conectividad).
- **E · Ajustes puntuales:** 14a (vector por categoría), 17 (spacing contacto), 18 (fade edges), 4 (diferido), 6 (aclarar).

---

## Bitácora

- 2026-07-21 — Registradas 19 observaciones (20 ítems) desde `~/Downloads/observaciones_fiberlux/`. Todas en `Pendiente` salvo #4 (Diferido) y #6 (Necesita aclaración).
- 2026-07-21 — Cliente aclara con referencias: **#6** (ref. íconos de rubros → Pendiente), **#4** (ya no diferido: degrade de profundidad + color en números → Pendiente), **#10/#16** (glass soluciones: ref. Figma con grano + multi-tono + glows ambos lados). Orden confirmado: **A (bugs slider) → D (bugs visuales) → B (glass: soluciones → ¿por qué Fiberlux? → ISO) → C (contenido)**.
- 2026-07-21 — Lote de fixes en rama `fixes-observaciones-batch`: A (2,7,8), D (1,3,9,14b), C (11,12,13), + 19. Build OK. **Pendiente (best-effort de diseño):** 4, 5, 6, 10, 15, 16, 18. Diferido: 14a.
- 2026-07-21 — Cluster B + puntuales best-effort hechos (4,5,10,15,16,18) + 6,17. Build OK. **Solo queda 14a (diferido).** Lote listo para 1 deploy. Nota: los ajustes visuales de glass/degradados son best-effort; afinar en el device.
- 2026-07-21 — obs_6: remapeo completo de íconos de rubros a Lucide (outline) por pedido del cliente. Build OK, verificado visualmente.
- 2026-07-21 — Nueva obs_20 (pedido del cliente): header opaco/blur desde el inicio solo en rutas `/soluciones/*` (categorías + subservicios), para legibilidad del menú sobre el hero de imagen. Build OK.
