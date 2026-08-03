# SPEC 88 — Botones CTA a radio 8px (fuente única) y hero home centrado con fondo waveform

> **Estado:** Aprobado
> **Depende de:** SPEC 76 (fondos de hero 3d/video/imagen) · rama `feat/background-effects` (componente `WaveformEffect`)
> **Fecha:** 2026-08-03
> **Objetivo:** Unificar los botones CTA del sitio en un componente único con radio 8px, alto 48px y sin glow, y rediseñar el hero del home a contenido centrado con fondo animado waveform.

---

## Por qué existe este spec

Hoy no hay fuente única de botón: las clases `btn-primary`/`btn-secondary` viven en `src/styles/global.css`, que **nunca se bundlea** (dead code), así que cada botón está estilizado inline en su componente (~27 archivos, ~54 `rounded-full`). Cambiar la forma de "todos los botones" sin una fuente única obliga a editar decenas de archivos y garantiza drift. Este spec crea la fuente única y, de paso, aplica el rediseño del hero del home (centrado + fondo waveform) que pidió el cliente en Figma.

---

## Alcance

**Dentro:**

- Nueva **fuente única de botón CTA**: `src/components/shared/Button.tsx` (React) + helper de clases (`buttonClass()`) para usar en `.astro`. Variantes `primary` (relleno magenta) y `secondary` (borde); radio **8px**, alto **48px**, **sin** sombra/glow.
- Migrar **todos los CTA interactivos** del sitio (`<a>`/`<button>` de acción) a esa fuente única.
- Hero del **home** (`HeroHomeReact.tsx`): contenido **centrado** (título, subtítulo y botones al centro).
- Hero del home: nuevo modo de fondo **`waveform`** (WebGL2, **animado también en móvil**) usando `WaveformEffect`; se agrega `waveform` al enum `heroBackground` en `tina/config.ts` y se activa en `src/content/home/index.json`.
- Actualizar el **subtítulo** del home al texto de la imagen: _"Desde Fiberlux impulsamos tu operación con servicios de alta calidad sobre una red privada 100% de fibra óptica."_
- Traer `WaveformEffect` desde `feat/background-effects` a la rama de implementación.

**Fuera (para otros specs):**

- Cambiar el **texto del botón** del hero (se mantiene "Ver soluciones").
- Centrar/rediseñar **otros heroes** (servicios, soporte, nosotros, etc.).
- Tocar elementos redondeados **no-CTA**: círculos de icono (WhatsApp, accesibilidad), badges/tags, dots de carrusel, avatares.
- Rediseñar **inputs** de formularios (solo entran los botones _submit_).
- Integrar los **otros efectos** (grid/swirl/smoke/flow) en otras secciones.
- Traducción `subtitle_en` (la ajusta el cliente en Tina).

---

## Modelo de datos

Este feature **no introduce datos persistentes nuevos**. Cambian tres cosas concretas y se añade una API de componente.

**1. Enum de fondo del hero** (`tina/config.ts`, campo `heroBackground` del `home`): añadir la opción `waveform` a las existentes (`3d`, `video`, `imagen`).

**2. Contenido del home** (`src/content/home/index.json`):

```jsonc
{
  "hero": {
    "subtitle": "Desde Fiberlux impulsamos tu operación con servicios de alta calidad sobre una red privada 100% de fibra óptica.",
    "heroBackground": "waveform" // antes: "3d"
    // title y botones se mantienen
  }
}
```

**3. API del botón** (`src/components/shared/Button.tsx`):

```ts
type ButtonVariant = "primary" | "secondary";
interface ButtonProps {
  variant?: ButtonVariant; // default "primary"
  href?: string;           // si viene, renderiza <a>; si no, <button>
  type?: "button" | "submit";
  className?: string;      // extra (ancho, etc.)
  children: ReactNode;
}
// Helper para .astro: buttonClass(variant) => string de clases Tailwind
```

**Tokens de estilo (fijos, no del token custom de Tailwind):**

- Radio: `rounded-[8px]` (valor explícito, no `rounded-lg`, porque el proyecto tiene `borderRadius` custom).
- Alto: `h-12` (48px).
- `primary`: relleno `#96237A` (hover `#650F50`), texto blanco, **sin** `shadow`/glow.
- `secondary`: borde blanco, fondo transparente, texto blanco.

---

## Plan de implementación

1. **Traer `WaveformEffect`** desde `feat/background-effects` a `src/components/effects/WaveformEffect.tsx` en la rama de implementación. _Test:_ importa sin errores.
2. **Crear la fuente única** `src/components/shared/Button.tsx` (variantes `primary`/`secondary`, `<a>`/`<button>`, radio 8px, alto 48px, sin glow) + `buttonClass()` para `.astro`. _Test:_ render aislado de ambas variantes.
3. **Migrar el hero del home**: en `HeroHomeReact.tsx`, centrar el contenedor de contenido (título, subtítulo, botones) y reemplazar los botones inline por `Button`. _Test:_ hero centrado, botones 8px/48px sin glow.
4. **Añadir modo waveform**: enum en `tina/config.ts`; en `HeroHomeReact`/`HeroHome` renderizar `WaveformEffect` cuando `heroBackground === "waveform"` (animado también en móvil, sin poster); actualizar `heroBackground` y `subtitle` en `src/content/home/index.json`. _Test:_ el home muestra el waveform en desktop y móvil, con las vignettes/scrim de legibilidad intactas.
5. **Migrar el resto de CTAs por lotes** (un commit por lote): `shared` (Header/Footer), `home`, `servicios`, `soporte`, `nosotros`, `blog`, `casos-de-exito`, `fiberlux-app`, `dynamic-form` (submit), `reclamos`, `cookies`, `search`. Cada CTA de acción pasa a usar `Button`/`buttonClass()`. _Test por lote:_ los CTA de esa área tienen radio 8px/alto 48px, sin glow; los no-CTA (círculos, badges, dots) intactos.
6. (Opcional) Retirar/actualizar `btn-primary`/`btn-secondary` muertos de `src/styles/global.css` para dejar la fuente única como única definición.

---

## Criterios de aceptación

- [ ] Existe `src/components/shared/Button.tsx` con variantes `primary` y `secondary` y soporte `<a>`/`<button>`.
- [ ] Ningún CTA de acción del sitio conserva forma de píldora (`rounded-full`); todos usan la fuente única.
- [ ] Los botones CTA tienen `border-radius: 8px` y alto 48px.
- [ ] El botón primario ya no tiene sombra/glow magenta.
- [ ] El hero del home muestra título, subtítulo y botones **centrados**.
- [ ] El subtítulo del home es el texto nuevo ("Desde Fiberlux impulsamos tu operación…").
- [ ] El fondo del hero del home es el efecto **waveform**, animado en desktop **y** móvil.
- [ ] `heroBackground` admite `"waveform"` en `tina/config.ts` y está activo en `src/content/home/index.json`.
- [ ] El texto del botón primario del hero sigue siendo "Ver soluciones".
- [ ] Los elementos no-CTA (círculos de icono WhatsApp/accesibilidad, badges, dots, avatares) conservan su forma redonda.
- [ ] No hay errores en consola en `/` ni en las páginas con CTAs migrados.

---

## Decisiones

- **Sí:** fuente única `Button`. Evita drift entre ~27 archivos con botones inline.
- **Sí:** radio 8px + alto 48px + sin glow. Coincide con el Figma del cliente.
- **Sí:** valor explícito `rounded-[8px]` en vez de `rounded-lg`. El proyecto tiene `borderRadius` custom en `tailwind.config.mjs`; no depender del token evita sorpresas.
- **Sí:** waveform **animado también en móvil**, sin poster estático. Elección del usuario.
- **No:** cambiar el texto del botón del hero. El usuario lo mantiene ("Ver soluciones").
- **No:** centrar otros heroes ni integrar otros efectos. Van en otros specs.
- **No:** tocar elementos redondeados no-CTA. Riesgo visual alto y no lo pidió el cliente.
- **Pendiente:** `subtitle_en` se deja como está; el cliente lo ajusta en Tina.
- **Dependencia de código:** `WaveformEffect` vive en `feat/background-effects`; la rama de implementación de este spec debe partir de/mergear ese componente.

---

## Riesgos

| Riesgo                                                        | Mitigación                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| WebGL2 no disponible o gama baja en móvil                    | `WaveformEffect` degrada sin crashear (canvas vacío); el fondo base `#0a0a0a` de la sección queda.  |
| Migrar ~27 archivos introduce inconsistencias                | Fuente única + migración por lotes con revisión visual por página.                                  |
| `rounded-lg` del proyecto ≠ 8px (borderRadius custom)        | Usar valor explícito `rounded-[8px]` en el componente.                                              |
| Legibilidad del texto del hero sobre el waveform             | Conservar las vignettes/scrim existentes del hero.                                                  |
| Rendimiento del shader en móvil (elegido animado)            | `WaveformEffect` pausa el rAF fuera de viewport y respeta `prefers-reduced-motion`.                 |

---

## Lo que **no** entra en este spec

- Cambiar el texto del botón del hero (se mantiene "Ver soluciones").
- Centrar/rediseñar otros heroes del sitio.
- Tocar elementos redondeados no-CTA (círculos de icono, badges, dots, avatares).
- Rediseñar inputs de formularios.
- Integrar los efectos grid/swirl/smoke/flow en otras secciones.

Cada uno de esos, si aterriza, va en su propio spec.
