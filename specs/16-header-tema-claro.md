# SPEC 16 — Header tema claro + opacidad al scroll

> **Estado:** Implementado
> **Depende de:**
> - Modifica el header existente (`Header.astro` + `HeaderReact.tsx`) y `BaseLayout.astro` (nuevo prop de tema).
> - Base para el **Spec 17** (plantillas y formularios de legales en tema claro), que consumirá `theme="light"` en cada página.
> - No depende de specs previos; reutiliza el patrón dual `.astro` + `React` y el overlay de menú (SPEC 09).
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Agregar al header una **variante de tema claro** (fondo blanco, logo/hamburguesa/texto oscuros, y al hacer scroll fondo blanco con opacidad + blur) seleccionable **por página** vía un prop `headerTheme` en `BaseLayout`, con `dark` como default (cero regresión), y aplicarla a las páginas de legales existentes que ya tienen fondo blanco.

---

## Alcance

**Dentro:**

- **Prop de tema en el header.** Agregar `theme?: "light" | "dark"` a `HeaderReact.tsx` y `Header.astro` (passthrough), con default `"dark"` (comportamiento actual).

- **Prop en `BaseLayout`.** Agregar `headerTheme?: "light" | "dark"` a `BaseLayout.astro` (default `"dark"`) y pasarlo a `<Header theme={headerTheme} />`. Es el único punto de entrada que usan las páginas.

- **Variante clara del header (menú cerrado):**
  - **Al tope (sin scroll):** fondo transparente sobre el blanco de la página; **logo oscuro** (sin el `brightness-0 invert`), **hamburguesa** y **texto** en `greyscale-darkest`.
  - **Al hacer scroll (> `SCROLL_THRESHOLD`):** fondo **blanco con opacidad + blur** (`bg-white/80 backdrop-blur-md`) + separador inferior sutil (`border-b border-black/5`), replicando el patrón oscuro (`bg-greyscale-darkest/80 backdrop-blur-md`).

- **Menú abierto (ambos temas):** al abrir el overlay morado, hamburguesa/"Cerrar"/logo vuelven a **blanco** (el color de los controles depende de `theme && !menuOpen`). El overlay morado, la animación y el drill de navegación no cambian.

- **Aplicar `headerTheme="light"`** a las páginas de legales existentes con fondo blanco: `/legales/libro-reclamaciones` y `/reclamos/` (selector), `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion`. Garantizar que su lienzo base sea blanco para que el header claro sea legible (sin rediseñar aún el formulario/contenido).

- **QA visual** del header claro (tope + scroll, desktop y mobile) contra el header del frame Figma `764-15466`; y **regresión** del header oscuro en una página oscura (ej. home / servicios).

**Fuera de alcance (para futuras specs):**

- **Rediseñar los formularios y el contenido** de las páginas de legales al tema claro del Figma (**Spec 17**).
- **Crear las páginas de contenido legal** nuevas (Derechos ARCO, Tratamiento de datos, Política de cookies) — **Spec 17**.
- **Modal de política de cookies** — **Spec 18**.
- **Auto-detección** del fondo de la sección bajo el header (se decidió por prop explícito por página).
- **Cambiar el comportamiento del menú** overlay, el drill, la animación o el hide-on-scroll de mobile.
- **Tema claro global** (el resto del sitio sigue oscuro por default).
- **Tokenizar el tema del header en Tina** (el tema lo fija la página en código, no el CMS).

---

## Modelo de datos

**Esta feature no introduce colecciones ni campos nuevos en TinaCMS.** El tema del header es un **prop de página**, no contenido editable. Se documenta la forma concreta de los props y la lógica de color.

### 1. Props (contratos)

```ts
// BaseLayout.astro
interface Props {
  title?: string;
  description?: string;
  headerTheme?: "light" | "dark"; // default "dark"
}

// Header.astro  → pasa a HeaderReact
interface HeaderAstroProps { theme?: "light" | "dark" }

// HeaderReact.tsx
interface HeaderProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  theme?: "light" | "dark"; // default "dark"
}
```

### 2. Lógica de color derivada (en `HeaderReact`)

El fondo del header ya existe (`headerBg`); se extiende para el tema claro. Los **controles** (logo, hamburguesa, texto "Cerrar") se pintan oscuros solo cuando `theme === "light"` **y** el menú está cerrado; con el menú abierto siempre van en blanco (overlay morado).

```ts
const isLight = theme === "light";
const controlsDark = isLight && !menuOpen; // logo/hamburguesa/texto oscuros

// Fondo de la barra
const headerBg = menuOpen
  ? "bg-brand-purple"
  : scrolled
    ? (isLight
        ? "bg-white/80 backdrop-blur-md border-b border-black/5"
        : "bg-greyscale-darkest/80 backdrop-blur-md")
    : "bg-transparent";

// Logo: hoy siempre "brightness-0 invert" (lo pinta blanco).
//   controlsDark → sin invert (logo en su color oscuro original).
// Hamburguesa/texto: text-greyscale-darkest cuando controlsDark, si no text-white.
```

**Notas del modelo:**

- **Un solo eje de decisión:** `theme` (por página) + los estados ya existentes `scrolled` y `menuOpen`. No se agregan flags nuevos de estado más allá de derivar `isLight`/`controlsDark`.
- **Default seguro:** ausencia de `headerTheme` ⇒ `"dark"` ⇒ clases idénticas a hoy (cero regresión).
- **El logo** se sirve del mismo `logoSrc`; el tema solo alterna el filtro `brightness-0 invert` (blanco) vs. sin filtro (oscuro). Si el SVG del logo no es oscuro en su forma base, se usa `brightness-0` (negro puro) para el tema claro.

---

## Plan de implementación

> Todo el trabajo vive en: `HeaderReact.tsx` (variante clara + lógica de color), `Header.astro` (passthrough del prop), `BaseLayout.astro` (nuevo prop `headerTheme`), y las páginas de legales existentes (`/legales/libro-reclamaciones`, `/reclamos/index`, `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion`) que pasan `headerTheme="light"`. Cada paso deja el proyecto ejecutable (`npm run dev`) y es commiteable por separado.

1. **Prop `theme` en el header (sin cambio visual aún).** Agregar `theme?: "light" | "dark"` (default `"dark"`) a `HeaderReact.tsx` y al passthrough en `Header.astro`. Derivar `isLight` y `controlsDark`, pero mantener las clases actuales. *Test:* `npm run dev` levanta; el header se ve idéntico a hoy en todas las páginas (default dark).

2. **Fondo claro al scroll.** Extender `headerBg`: cuando `isLight && scrolled && !menuOpen` → `bg-white/80 backdrop-blur-md border-b border-black/5`; el resto de ramas igual. *Test:* aún sin páginas claras, el header oscuro no cambia; con `theme="light"` forzado en dev, al scrollear aparece la barra blanca translúcida.

3. **Controles oscuros en tema claro (menú cerrado).** Aplicar a logo (quitar `brightness-0 invert` cuando `controlsDark`), hamburguesa (`bg-white` → `bg-greyscale-darkest`) y texto "Cerrar" (`text-white` → `text-greyscale-darkest`) según `controlsDark`. Verificar que con el menú **abierto** vuelven a blanco sobre el overlay morado. *Test:* con `theme="light"`, al tope el logo/hamburguesa se ven oscuros; al abrir el menú, blancos sobre morado; al cerrar, oscuros de nuevo.

4. **Prop `headerTheme` en `BaseLayout`.** Agregar `headerTheme?: "light" | "dark"` (default `"dark"`) a `Props`, desestructurar y pasar `<Header theme={headerTheme} />`. *Test:* páginas sin el prop siguen en dark; una página de prueba con `headerTheme="light"` muestra el header claro.

5. **Aplicar `headerTheme="light"` a las páginas de legales.** En `/legales/libro-reclamaciones` y `/reclamos/index`, `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion`: pasar `headerTheme="light"` al `BaseLayout` y asegurar que el lienzo base de la página sea blanco (las de formulario ya lo tienen; el selector `/reclamos` se ajusta a fondo blanco si hace falta para legibilidad del header). *Test:* en esas rutas el header se ve claro (tope y scroll) y legible sobre el fondo blanco.

6. **QA visual + regresión.** Comparar el header claro (tope + scroll, desktop ~1440 y mobile ~400) contra el header del frame Figma `764-15466` con Playwright MCP (screenshots en `.playwright-screens/`). Verificar que una página oscura (home / servicios) mantiene el header oscuro sin cambios. *Test:* `astro build` sin errores/warnings nuevos; QA aprobado en claro y sin regresión en oscuro.

**Notas del plan:**

- Pasos 1–4 construyen la capacidad del header (default seguro en cada paso); 5 la aplica a legales; 6 cierra con QA.
- El hide-on-scroll de mobile, el drill del menú y la animación del overlay no se tocan.
- El separador inferior (`border-b border-black/5`) solo aparece en tema claro al scrollear; se ajusta en QA si el Figma muestra sombra en vez de borde.

---

## Criterios de aceptación

- [ ] `npm run dev` y `astro build` terminan sin errores ni warnings nuevos en consola.
- [ ] `BaseLayout` acepta `headerTheme?: "light" | "dark"`; sin el prop, el default es `"dark"`.
- [ ] `Header.astro` y `HeaderReact` aceptan `theme?: "light" | "dark"` (default `"dark"`) y el valor fluye `BaseLayout → Header.astro → HeaderReact`.
- [ ] **Regresión:** todas las páginas que no pasan `headerTheme` (home, servicios, nosotros, blog, etc.) muestran el header **idéntico a hoy** (transparente al tope, `bg-greyscale-darkest/80 + blur` al scroll, logo/hamburguesa blancos).
- [ ] En **tema claro, al tope**: el logo, la hamburguesa y el texto se ven **oscuros** (`greyscale-darkest`) y legibles sobre fondo blanco.
- [ ] En **tema claro, al hacer scroll** (> `SCROLL_THRESHOLD`): la barra pasa a **blanco con opacidad + blur** (`bg-white/80 backdrop-blur-md`) con separador inferior sutil.
- [ ] En **tema claro con el menú abierto**: la hamburguesa/"Cerrar"/logo vuelven a **blanco** sobre el overlay morado; al cerrar el menú vuelven a oscuros.
- [ ] El **overlay de menú** (morado), su animación, el drill de navegación y el hide-on-scroll de mobile funcionan igual que antes en ambos temas.
- [ ] Las rutas `/legales/libro-reclamaciones`, `/reclamos/`, `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion` renderizan el **header claro** y es legible sobre su fondo blanco.
- [ ] El header claro (tope y scroll, desktop y mobile) coincide con el header del frame Figma `764-15466`.
- [ ] Hay screenshots de QA en `.playwright-screens/` del header claro (tope + scroll) y de una página oscura sin regresión, en desktop (~1440px) y mobile (~400px).
- [ ] No se modificó el schema de Tina, el contenido, ni componentes fuera de `HeaderReact.tsx`, `Header.astro`, `BaseLayout.astro` y las 5 páginas de legales listadas.

---

## Decisiones

- **Sí:** **tema por página vía prop `headerTheme` en `BaseLayout`** (default `"dark"`). El usuario lo confirmó ("es por página, pero solo aplicaría a legales"). Un único punto de entrada por página, sin tocar cada consumidor del header. Descartado un tema global (rompería el contraste en los heros oscuros).
- **No:** **auto-detección del fondo bajo el header.** Más complejo y frágil en transiciones; el usuario eligió prop explícito. Si a futuro se quiere automático, va en otra spec.
- **Sí:** **default `"dark"` en los tres niveles** (`BaseLayout`, `Header.astro`, `HeaderReact`). Garantiza cero regresión: cualquier página que no opte-in queda igual que hoy.
- **Sí:** **replicar el patrón de opacidad existente** para el claro (`bg-white/80 backdrop-blur-md`), en espejo del oscuro (`bg-greyscale-darkest/80 backdrop-blur-md`). Coherencia con "al igual que en el resto de secciones" y con lo que ya hace el header oscuro.
- **Sí:** **color de controles = `theme === "light" && !menuOpen`.** Con el menú abierto el overlay es morado, así que logo/hamburguesa deben ir blancos en ambos temas; solo con el menú cerrado el tema claro los pinta oscuros. Evita un estado ilegible (oscuro sobre morado).
- **Sí:** **logo por filtro CSS** (`brightness-0 invert` = blanco; sin filtro / `brightness-0` = oscuro), no un segundo asset. Reutiliza el `logoSrc` actual sin duplicar media ni tocar Tina.
- **Sí:** **separador inferior sutil al scrollear en claro** (`border-b border-black/5`). En el oscuro el contraste basta, pero sobre blanco el header translúcido necesita un límite; ajustable a sombra en QA si el Figma lo muestra así.
- **Sí:** **aplicar el claro solo a las 5 páginas de legales existentes** en este spec. Son las que ya tienen fondo blanco; el resto de legales (que hoy son 404) se crea en el Spec 17 y opta-in ahí. Mantiene el 16 acotado y verificable.
- **No:** **rediseñar formularios/contenido de legales ni crear páginas nuevas.** Explícitamente diferido al Spec 17; este spec entrega solo la capacidad del header + el lienzo claro base.
- **No:** **tokenizar el tema del header en TinaCMS.** El tema es una decisión de layout de cada página (código), no contenido que edite el cliente. Overengineering para este caso.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **logo** (`fiberlux.svg`) no queda oscuro con solo quitar `invert` (si su forma base no es oscura), y en tema claro se ve mal. | Usar `brightness-0` (negro puro) para el tema claro en vez de "sin filtro"; validar en QA (paso 6). Si se requiere color de marca, se evalúa un segundo asset en otra spec. |
| **Regresión** en el header oscuro por refactorizar `headerBg`/colores de controles. | Default `"dark"` idéntico a hoy y criterio de aceptación de regresión explícito; QA en una página oscura (home/servicios) antes de cerrar. |
| El header claro **al tope es transparente** y, si una página clara tiene contenido claro pegado arriba, los controles oscuros pierden contraste. | Las 5 páginas de legales tienen fondo blanco uniforme; los controles oscuros contrastan. Para heros claros con imagen, se decidirá tratamiento en el Spec 17. |
| Nuevas **clases Tailwind** (`bg-white/80`, `border-black/5`) fallan en dev por staleness del JIT (memoria del proyecto). | Son utilidades estándar ya presentes en el proyecto; si alguna no aplica, reiniciar el dev server y correr `astro build` desde la raíz. |
| El **hydration** del header (`client:load`) muestra un flash del tema equivocado antes de montar. | El tema es un prop estático conocido en SSR (no depende de scroll inicial); el estado `scrolled` arranca en `false` igual que hoy, sin flash nuevo. |
| El **contraste del texto "Cerrar"/hamburguesa** cambia mal en la transición menú abierto↔cerrado en tema claro. | La lógica `controlsDark = isLight && !menuOpen` cubre ambos estados; criterio de aceptación explícito para abrir/cerrar el menú en claro. |

---

## Qué **NO** entra en este spec

- Rediseñar los formularios o el contenido de las páginas de legales (Spec 17).
- Crear las páginas de contenido legal nuevas: Derechos ARCO, Tratamiento de datos, Política de cookies (Spec 17).
- El modal de política de cookies (Spec 18).
- Auto-detección del fondo bajo el header.
- Tema claro global o tokenizar el tema del header en TinaCMS.
- Cambiar el overlay del menú, su animación, el drill o el hide-on-scroll de mobile.

Cada uno de estos, si aterriza, va en su propio spec.

---

## Notas de implementación (2026-07-01)

Implementado en la rama `spec-16-header-tema-claro` (creada desde `main`, independiente de `spec-15-blog`). QA visual con dev server (modo local) + Playwright MCP; screenshots en `.playwright-screens/` (gitignored). `astro build` completo: **29 páginas, sin errores**.

**Capacidad del header (`HeaderReact.tsx`):** prop `theme` (default `"dark"`); derivados `isLight`, `controlsDark = isLight && !menuOpen`, y helpers `barColor` / `controlText` / `logoFilter`. El `headerBg` gana la rama clara al scroll (`bg-white/80 backdrop-blur-md border-b border-black/5`). Logo por filtro CSS (`brightness-0` oscuro vs `brightness-0 invert` blanco). Plumbing: `BaseLayout.headerTheme → Header.astro theme → HeaderReact`.

**Aplicación (5 páginas):** `headerTheme="light"` en `/legales/libro-reclamaciones`, `/reclamos` (selector), `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion`.
- `libro-reclamaciones` y `reclamo` ya tenían sección blanca.
- `queja` y `apelacion` se envolvieron en una sección blanca (mismo patrón que `reclamo`) para dar lienzo claro — sin rediseñar el formulario.
- El selector `/reclamos` renderizaba contenido claro sobre el body oscuro (`bg-greyscale-darkest`), quedando ilegible; se le dio `main` con fondo blanco + `min-height:100vh`, lo que además **corrige** ese estado roto preexistente.

**QA verificado:** header claro al tope (controles oscuros), al scroll (blanco+blur+borde), menú abierto (controles blancos sobre morado), regresión del header oscuro en home (sin cambios), y mobile. Sin errores de consola nuevos.

**Nota de borde 16↔17:** el cuerpo/formularios de estas páginas sigue en su estado actual; su rediseño al tema claro del Figma es el **Spec 17**. Este spec solo entregó la capacidad del header + el lienzo blanco base.
