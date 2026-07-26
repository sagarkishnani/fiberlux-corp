# SPEC 69 — Animaciones de entrada (Motion): base `data-reveal` + slider de soluciones

> **Estado:** Aprobado
> **Depende de:** SPEC 68 (slider de soluciones)
> **Fecha:** 2026-07-26
> **Objetivo:** Crear una base reutilizable de animaciones de entrada con Motion vanilla (atributos `data-reveal`, dispara una vez al entrar en viewport, respeta `prefers-reduced-motion`) y estrenarla en el slider de soluciones: el título cae en fade, la descripción y el slider suben en fade.

---

## Scope

**In:**

- **Dependencia:** `motion` (API vanilla: `animate`, `inView`).
- **Módulo base** `src/scripts/reveal.ts`: escanea `[data-reveal]` y los anima al entrar en viewport (una vez), con Motion.
- **Atributos** soportados: `data-reveal` (dirección), `data-reveal-delay`, `data-reveal-duration`, `data-reveal-distance`, `data-reveal-stagger` (cascada de hijos).
- **Cableado global en `BaseLayout.astro`**: (1) script inline en `<head>` que marca `<html class="reveal-js">` antes del primer paint (anti-FOUC), (2) `<style>` con los estados ocultos iniciales + override de `prefers-reduced-motion`, (3) carga del módulo `reveal.ts`.
- **Aplicación en `SolucionesSliderReact`**: envolver título (`down`), descripción (`up`) y el carrusel (`up`) con `data-reveal`, con un pequeño stagger.

**Out of scope (futuro):**

- Animar otras secciones (hero, stats, certificaciones, blog…): van en próximos lotes/specs.
- Modo **scrub** (parallax ligado al scroll de on.pe): se deja para otro spec.
- Animar el eyebrow "[ NUESTRAS SOLUCIONES ]" y las flechas del slider (no pedidos).
- Config de animaciones desde Tina (por ahora, atributos en código).
- Tocar el `sol-fade` existente (la transición del título/descr. al cambiar de slide se mantiene).

---

## Data model

**1. Dependencia:** `motion` en `package.json`.

**2. API de atributos** (en `reveal.ts`):

```
data-reveal="up|down|left|right|fade|scale"   (default "up")
data-reveal-delay="0.1"        segundos (default 0)
data-reveal-duration="0.7"     segundos (default 0.7)
data-reveal-distance="40"      px (default 40)
data-reveal-stagger="0.08"     segundos entre hijos directos (opcional)
```

**3. Dirección → estado inicial** (se anima hacia `opacity:1, translate:0`):

```
up    → opacity:0, translateY(+distance)   (sube a su lugar)
down  → opacity:0, translateY(-distance)   (cae a su lugar)
left  → opacity:0, translateX(-distance)
right → opacity:0, translateX(+distance)
fade  → opacity:0
scale → opacity:0, scale(0.94)
```

Ease por defecto: `cubic-bezier(0.22, 1, 0.36, 1)` (easeOut suave, equivalente a `power3.out`). Trigger: `inView` con `amount: 0.2`, **una sola vez** (se deja de observar tras animar).

**4. Anti-FOUC + accesibilidad** (CSS inline en `BaseLayout`):

```css
.reveal-js [data-reveal]      { opacity: 0; will-change: transform, opacity; }
.reveal-js [data-reveal="up"]   { transform: translateY(40px); }
.reveal-js [data-reveal="down"] { transform: translateY(-40px); }
/* left/right/scale análogos */
@media (prefers-reduced-motion: reduce) {
  .reveal-js [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

La clase `reveal-js` se agrega sincrónicamente en `<head>`; si el JS no corre, el contenido no queda oculto (solo se oculta cuando hay JS, y reduced-motion lo muestra siempre).

**5. Aplicación en soluciones** (`SolucionesSliderReact.tsx`):

```
Título (h2)        → wrapper con data-reveal="down"  (delay 0)
Descripción (p)    → wrapper con data-reveal="up"    (delay 0.1)
Carrusel (viewport)→ wrapper con data-reveal="up"    (delay 0.15)
```

Los wrappers envuelven los elementos (no reemplazan el `sol-fade` interno que corre al cambiar de slide).

---

## Implementation plan

1. **Instalar `motion` + módulo base `reveal.ts`.**
   `npm install motion`. Crear `src/scripts/reveal.ts`: al cargar, si `prefers-reduced-motion` no está activo, seleccionar `[data-reveal]` y, con `inView` (`amount: 0.2`), animar cada uno de su estado inicial (según dirección/distancia) a `opacity:1, transform:none` con `animate` (duración/delay/ease del Data model); dejar de observar tras la primera vez. Soportar `data-reveal-stagger` aplicando delays incrementales a los hijos directos. Prueba manual: un elemento de prueba con `data-reveal` aparece al hacer scroll.

2. **Cableado global en `BaseLayout.astro`.**
   (a) Script inline en `<head>` que hace `document.documentElement.classList.add('reveal-js')`. (b) `<style>` con los estados ocultos iniciales + override `prefers-reduced-motion` (Data model §4). (c) Cargar `reveal.ts` con un `<script>` (módulo) — no en modo mantenimiento. Prueba manual: en una página normal, los `[data-reveal]` arrancan ocultos y aparecen al entrar; con reduced-motion, se ven de una.

3. **Aplicar en `SolucionesSliderReact`.**
   Envolver el título en `<div data-reveal="down">`, la descripción en `<div data-reveal="up" data-reveal-delay="0.1">` y el carrusel en `<div data-reveal="up" data-reveal-delay="0.15">`, sin quitar el `sol-fade` interno. Prueba manual: al hacer scroll a la sección, el título cae en fade, la descripción y el slider suben en fade, en cascada.

4. **Verificar interacción con el slider.**
   Confirmar que el `data-reveal` del carrusel (en un wrapper externo, no en el viewport de Embla) no interfiere con el arrastre/autoplay/tween del slider, ni con el `sol-fade` al cambiar de slide. Prueba manual: tras la animación de entrada, el slider arrastra, autoplaya y cambia título/descr. normalmente.

---

## Acceptance criteria

- [ ] `motion` está en `package.json`; existe `src/scripts/reveal.ts`.
- [ ] En una página normal, un `[data-reveal]` arranca oculto y se anima **una vez** al entrar en viewport; al volver a scrollear no re-anima.
- [ ] Con `prefers-reduced-motion` activo, los `[data-reveal]` se muestran sin animación (nunca quedan invisibles).
- [ ] Si el JS del módulo no corre, el contenido **no** queda oculto (la clase `reveal-js` solo oculta cuando hay JS).
- [ ] En el slider de soluciones: al entrar, el **título cae** en fade, la **descripción sube** en fade y el **slider sube** en fade, con un stagger perceptible (título → descripción → slider).
- [ ] Tras la animación, el slider conserva arrastre, autoplay, flechas, tween opacity y el `sol-fade` al cambiar de slide.
- [ ] No hay parpadeo (FOUC) del contenido de soluciones al cargar la página.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** base por atributos `data-reveal` (global), reutilizable en `.astro` y en islands React — sirve para los próximos lotes sin duplicar lógica.
- **Sí:** Motion vanilla (`animate`/`inView`), no la API React de Motion — funciona sobre el HTML de Astro sin forzar hidratación.
- **Sí:** dispara **una vez** al entrar (patrón de la referencia on.pe).
- **Sí:** anti-FOUC con clase `reveal-js` sincrónica + CSS; reduced-motion muestra todo siempre.
- **Sí:** en soluciones se usan **wrappers** con `data-reveal`, conservando el `sol-fade` interno (transición al cambiar de slide).
- **Sí:** defaults distancia 40px, duración 0.7s, ease `cubic-bezier(0.22,1,0.36,1)`, stagger vía delays (0 / 0.1 / 0.15).
- **No:** modo scrub, config en Tina, ni animar eyebrow/flechas (otros specs).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El island de soluciones es `client:visible`; la hidratación de React podría pisar los estilos que setea Motion | Los `data-reveal` van en **wrappers** que React no controla vía `style`; Motion escribe estilos inline que la hidratación (reuso de nodos) no elimina. |
| `data-reveal` sobre el viewport de Embla rompería el transform del slider | Se aplica en un **wrapper externo** al viewport, no en el viewport (Embla transforma el contenedor interno). |
| FOUC si el CSS oculto aplica pero el módulo falla | La clase `reveal-js` se agrega solo por JS; si el módulo no carga, el contenido se ve. Además, un fallback opcional puede revelar todo tras un timeout. |
| `will-change` permanente afecta memoria en muchos elementos | Se limita a `[data-reveal]`; opcionalmente limpiar `will-change` tras animar. |
| Doble animación (reveal + `sol-fade`) en la primera entrada | El `sol-fade` interno corre bajo el wrapper oculto; al revelarse ya está asentado — sin conflicto visible. |

---

## Lo que **no** está en este spec

- Animar otras secciones (hero, stats, certificaciones, blog, etc.).
- Modo scrub / parallax ligado al scroll.
- Configurar animaciones desde Tina.
- Animar el eyebrow y las flechas del slider.

Cada uno, si aterriza, va en su propio spec.
