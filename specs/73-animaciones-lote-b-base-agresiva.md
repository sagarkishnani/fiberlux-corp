# SPEC 73 — Animaciones Lote B (contenido/soporte) + base más agresiva y variada

> **Estado:** Implementado
> **Depende de:** SPEC 69/71 (base de animaciones), SPEC 72 (lote A)
> **Fecha:** 2026-07-26
> **Objetivo:** Hacer la base de animaciones más agresiva (mayor distancia global) y variada (diagonales + mezcla de efectos), y aplicarla al Lote B (blog, casos, fiberlux-app, soporte, formas de pago, información a abonados) al estilo on.pe.

---

## Scope

**In:**

- **Base más agresiva (global):** subir la distancia por defecto de los reveals (40 → **80px**) en `reveal.ts` y en el CSS anti-FOUC de `BaseLayout` (afecta todo el sitio, incl. Home/Nosotros → consistencia).
- **Diagonales nuevas:** agregar direcciones `diag-ur`, `diag-ul`, `diag-dr`, `diag-dl` a `data-reveal` (reveal, scrub y CSS inicial), como on.pe.
- **Aplicar a Lote B** con **mezcla de efectos** (no solo fade-up):
  - Bloques grandes / dos columnas → **scrub** (aparece/desaparece ligado al scroll).
  - Grillas/listas de cards → **stagger** (una vez) + hover.
  - Media/íconos → **scale** o **draw** (SVGs de línea).
  - Cifras → **count-up**; fondos/glows → **parallax**; acentos → **diagonales**.
  - Heroes interiores → fade-in/scale sobrio (excluyendo los de lógica especial: Embla del blog, etc.).
- **Páginas:** `blog` (listado + artículo), `casos-de-exito`, `fiberlux-app`, `soporte-tecnico`, `formas-de-pago`, `informacion-abonados`.
- **Accesibilidad:** todo respeta `prefers-reduced-motion`.

**Out of scope (futuro):**

- **Lote C** (contacto, reclamos, legales) → su propio spec (fade-up sobrio).
- Reescribir/renombrar componentes; solo se agregan atributos/clases y se ajusta la base.
- Sliders ya migrados (BlogHero/Casos/Certificaciones/Soluciones) — se dejan; se anima su entorno, no el motor.
- Config de animaciones desde Tina.

---

## Data model

Sin datos nuevos ni Tina. Cambios en la base + atributos por página.

**1. Base (`src/scripts/reveal.ts`):**
```
DEFAULT_DISTANCE: 40 → 80
Direcciones nuevas (enter → 0,0; scrub sale ×1.7):
  diag-ur → x:-d, y:+d      diag-ul → x:+d, y:+d
  diag-dr → x:-d, y:-d      diag-dl → x:+d, y:-d
```

**2. CSS anti-FOUC (`BaseLayout`):** actualizar translate 40→80 y agregar estado inicial de las diagonales:
```
.reveal-js [data-reveal="up"]      { transform: translateY(80px) }   (idem down/left/right → 80)
.reveal-js [data-reveal="diag-ur"] { transform: translate(-80px, 80px) }   (idem ul/dr/dl)
```

**3. Paleta de efectos por tipo de sección** (guía para la aplicación):
```
Hero interior            → fade/scale sobrio (once)
Bloque de 2 columnas     → scrub (izq/der o diagonal)
Bloque grande de texto   → scrub o fade-up agresivo
Grilla/lista de cards    → stagger (once) + hover
Imagen/media destacada   → scale (once) o parallax
SVG de línea             → draw
Cifras                   → count-up
Fondos/glows             → parallax
```

**4. Mapeo por página** (nivel intención; el detalle se resuelve leyendo cada página en impl):
```
blog/index      → BlogGrid: cards stagger + hover; barra de filtros fade; (BlogHero slider: intacto)
blog/[slug]     → título/portada fade+scale; bloques del cuerpo fade-up; relacionados stagger (sobrio)
casos-de-exito  → hero fade-in; secciones fade-up/scrub; (CasosSlider intacto)
fiberlux-app    → hero fade/scale; bloques 2-col → scrub; features grid → stagger; cifras → count-up
soporte-tecnico → hero fade-in; acordeón/ítems stagger; bloques → scrub/fade-up
formas-de-pago  → hero fade-in; métodos/bancos grid → stagger + hover; bloques → fade-up
informacion-abonados → hero fade-in; lista de documentos → stagger + hover
```

> Regla transversal (igual que lote A): **no duplicar** animación en secciones ya animadas; `data-reveal` en wrappers `.astro`, `stagger`/`hover` dentro del componente.

---

## Implementation plan

1. **Base más agresiva + diagonales.**
   En `reveal.ts`: `DEFAULT_DISTANCE` 40→80; agregar `diag-ur/ul/dr/dl` a `enterKeyframes`, `hiddenTarget` y `initScrub`. En `BaseLayout` `<style>`: translate 40→80 en up/down/left/right y estado inicial de las 4 diagonales. Prueba manual: un `data-reveal="diag-ur"` de prueba entra en diagonal; los reveals existentes se sienten más marcados.

2. **blog (listado + artículo).**
   `BlogGrid`: `data-reveal-stagger` + hover en las cards; barra de filtros con fade. `blog/[slug]` (`BlogDetailReact`): título/portada `fade`+`scale`, bloques del cuerpo `fade-up`, relacionados con stagger (sobrio). BlogHero (Embla) intacto. Prueba manual: listado en cascada; artículo con entrada sobria.

3. **casos-de-exito.**
   Hero fade-in; secciones alrededor del `CasosSlider` con fade-up/scrub; slider intacto. Prueba manual.

4. **fiberlux-app.**
   Hero fade/scale; bloques de dos columnas → scrub (izq/der o diagonal); grilla de features → stagger + hover; cifras → count-up; fondos/glows → parallax. Prueba manual.

5. **soporte-tecnico.**
   Hero fade-in; ítems del acordeón → stagger; bloques → scrub/fade-up. Prueba manual.

6. **formas-de-pago.**
   Hero fade-in; grilla de métodos/bancos → stagger + hover; bloques → fade-up. Prueba manual.

7. **informacion-abonados.**
   Hero fade-in; lista de documentos → stagger + hover. Prueba manual.

8. **Verificación cruzada + build.**
   Revisar todas las páginas de B (desktop y mobile): sin FOUC, sin doble animación (sliders/count-up/overlaps intactos), sin overflow horizontal por left/right/diagonales, reduced-motion sin animación. Confirmar que Home/Nosotros siguen bien con la distancia global mayor. `npm run build` compila.

---

## Acceptance criteria

- [ ] La distancia global de reveals es mayor (más agresiva) y los reveals existentes (Home/Nosotros) siguen funcionando sin FOUC ni saltos.
- [ ] Existen y funcionan las diagonales (`diag-ur/ul/dr/dl`) en reveal y scrub.
- [ ] Blog listado: cards en cascada con hover; artículo con entrada sobria (título/portada/cuerpo); BlogHero intacto.
- [ ] casos-de-exito, fiberlux-app, soporte-tecnico, formas-de-pago, informacion-abonados: cada sección anima según la paleta (mezcla de scrub / stagger / scale / count-up / parallax / hover), no solo fade-up.
- [ ] Los bloques scrub aparecen y desaparecen ligados al scroll (simétrico al subir).
- [ ] Con `prefers-reduced-motion`: nada anima, todo visible, sin contenido oculto.
- [ ] Sin overflow horizontal por movimientos left/right/diagonal; sin regresiones en sliders/count-up/overlaps.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** subir la distancia global (40→80) para agresividad consistente en todo el sitio (afecta Home/Nosotros a propósito).
- **Sí:** agregar diagonales a la base (paridad con on.pe) y usar una **mezcla** de efectos, no solo fade-up.
- **Sí:** modo **mixto** por sección: scrub en bloques grandes/2-col; stagger (once) en grillas/cards.
- **Sí:** animar también el artículo de blog, pero **sobrio** (no distraer la lectura).
- **No:** tocar los motores de slider ya migrados; solo su entorno.
- **No:** Lote C ni config Tina en este spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Subir la distancia global hace saltar layouts o marea | 80px es moderado; se verifica Home/Nosotros en el paso 8; ajustable en un solo lugar. |
| Diagonales/left/right generan overflow horizontal | Aplicar dentro de contenedores con `overflow-hidden` o secciones; verificación paso 8. |
| Scrub en muchas secciones cansa | Modo mixto: scrub solo en bloques grandes/2-col; grillas usan once. |
| Doble animación en secciones ya animadas (sliders, count-up) | Regla transversal de no-duplicar; se anima el entorno, no el motor. |
| Artículo de blog: animar el cuerpo puede entorpecer la lectura | Entrada sobria una vez (sin scrub que reaparezca/desaparezca al leer). |
| Reduced-motion | Guard global ya existente en `reveal.ts`/`fx.ts`. |

---

## Lo que **no** está en este spec

- Lote C (contacto, reclamos, legales).
- Motores de slider (BlogHero/Casos/etc.).
- Config de animaciones desde Tina.

Cada uno, si aterriza, va en su propio spec.
