# SPEC 49 — Rediseño de testimonios al tema claro del Figma (panel claro, título magenta, card outline con texto oscuro)

> **Estado:** Implementado
> **Depende de:** SPEC 40 (motor de arrastre `useDragSlider`), SPEC 35/48 (patrón de panel + flechas de los sliders)
> **Fecha:** 2026-07-21
> **Objetivo:** Rediseñar la sección de testimonios (`TestimonialSlider` / `TestimonialCard`) al tema claro del Figma —panel `#F3E4EF` con esquinas superiores redondeadas encimado sobre la sección oscura previa, título magenta, card con borde notched magenta y texto oscuro, y flechas en versión clara— en las 2 páginas que la usan, dejando comentado el diseño oscuro actual.

---

## Alcance

**Dentro:**

- **Rediseñar `src/components/shared/TestimonialSliderReact.tsx`** al tema claro, conservando su motor (`useDragSlider`), el `sectionTitle`, la lista `items`, el toggle `visible` y los estados placeholder:
  - Sección como **panel claro `#F3E4EF`** (token `brand-purple.lightest`) con **esquinas superiores muy redondeadas** (`rounded-t-[…]`), encimado sobre la sección oscura de arriba (Soluciones) usando el solape `-mt`/`z` que ya existe en las páginas.
  - **Título** "Empresas que confían en nuestra red" en **magenta** (`brand-purple` `#96237A`).
  - **Pill de flechas en versión clara:** prev tenue (rosa claro), next magenta con flecha blanca; misma mecánica prev/next.
- **Rediseñar `src/components/shared/TestimonialCard.tsx`** al tema claro:
  - Conservar el **borde notched magenta** (SVG desktop/mobile) y el **frame magenta del avatar** (ya existen y coinciden con el Figma).
  - **Texto oscuro:** quote y nombre en near-black; descripción y cargo en gris; **logo de empresa** a la derecha del bloque de texto, según la referencia.
  - Card **sin relleno** (deja ver el panel claro), solo el contorno.
- **Comentar (no borrar)** el markup/estilos del tema oscuro dentro de ambos archivos, con nota "tema oscuro anterior — reutilizar luego".
- **Aplicar a las 2 páginas** que montan `<TestimonialSlider />` (home + soporte-técnico) al ser el mismo componente compartido.
- **Ajustar el wrapper de la sección** en las páginas **solo si** el solape `-mt`/`z` o el redondeo superior lo requieren para que el panel claro tape la costura con la sección oscura.
- **Mobile:** el layout apilado actual se conserva, adaptado al tema claro (texto oscuro, panel claro).

**Fuera de alcance (para futuros specs):**

- **Cambiar el schema** de `home.testimonials` (`visible`, `sectionTitle`, `items[]{ quote, description, name, role, company, avatar, logo }`): se reutiliza tal cual.
- **Tocar las secciones vecinas** (Soluciones arriba, HomePartners/footer abajo): la barra magenta inferior es la sección siguiente y **no** se modifica.
- **Cambiar el motor de arrastre** (`useDragSlider`) ni la lógica del toggle `visible` (sigue controlada por CMS).
- **Cambiar el contenido** de los testimonios (quotes, nombres, logos ya existen).
- **Rediseñar otras secciones** del home / soporte-técnico.

---

## Modelo de datos

Esta feature **no introduce estructuras nuevas ni cambia el schema**. Reutiliza `home.testimonials` (ya definido en `tina/config.ts` y poblado en `src/content/home/index.json`):

```js
// home.testimonials — se conserva sin cambios de schema
testimonials: {
  visible: boolean,        // toggle CMS: oculta la sección en todo el sitio si está off
  sectionTitle: string,    // "Empresas que confían en nuestra red" → título (ahora magenta)
  items: [
    {
      quote: string,        // titular del testimonio (texto oscuro, semibold)
      description: string,  // párrafo de detalle (texto gris)
      name: string,         // "Bernardo Olivar" (texto oscuro, semibold)
      role: string,         // "Jefe de tecnología" (texto gris)
      company: string,      // alt del logo
      avatar: image,        // foto cuadrada dentro del frame magenta
      logo: image,          // logo de la empresa (a la derecha del bloque de texto)
    },
  ],
}
```

**Cambios de contenido:** ninguno. Solo cambian estilos (colores/tema), no el contenido ni la forma del dato.

**Tokens/colores del tema claro (Tailwind, `tailwind.config.mjs`):**

- Panel de fondo: `brand-purple.lightest` = `#F3E4EF`.
- Título, borde notched, frame del avatar, flecha next: `brand-purple` = `#96237A`.
- Prev de la pill (tenue): `brand-purple.light` = `#D5A7CA` / `#F3E4EF`.
- Texto principal (quote, nombre): near-black (`greyscale-darkest` `#0A0A0A` o `#1a1a1a`).
- Texto secundario (descripción, cargo): gris (`greyscale` medio, p. ej. `#4b4b4b`/`text-black/60`).

**Convenciones de runtime:**

- Fallback chain intacto: `useTina` data → `initialData`; `visible !== true` → la sección no se renderiza.
- Se conservan los estados placeholder ("Testimonio — próximamente") cuando no hay items, adaptados al tema claro.
- El borde notched (SVG desktop/mobile) y el frame del avatar se conservan tal cual (ya son magenta y coinciden con el Figma); solo cambian los colores de texto y el fondo de sección.

---

## Plan de implementación

> El trabajo vive en `src/components/shared/TestimonialSliderReact.tsx` y `TestimonialCard.tsx`, más un posible ajuste menor de los wrappers en `src/pages/index.astro` / `src/pages/soporte-tecnico/index.astro`. No se toca el schema ni el contenido. Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Comentar el tema oscuro y armar el panel claro en `TestimonialSliderReact.tsx`.** Envolver el markup/clases del diseño oscuro actual en un comentario rotulado (`/* ── Tema oscuro anterior — reutilizar luego ── */`), sin borrar. Cambiar la `<section>` a **panel claro** (`bg-[#F3E4EF]`, `rounded-t-[…]` grande) y el título a **magenta**. *Verificación:* la sección se ve como panel claro con título magenta, encimada sobre Soluciones.

2. **Flechas en versión clara.** Reestilizar la pill: prev tenue (rosa claro), next magenta con flecha blanca; misma lógica `prev/next`/`atStart`/`atEnd`. *Verificación:* las flechas se ven claras y navegan card por card.

3. **Comentar el tema oscuro y recolorear `TestimonialCard.tsx`.** Comentar el markup oscuro; recolorear quote/nombre a near-black y descripción/cargo a gris; conservar el borde notched magenta y el frame del avatar; ubicar el logo a la derecha del bloque de texto según la referencia. Mantener el layout mobile apilado, en tema claro. *Verificación:* la card se ve como el Figma (contorno magenta, texto oscuro, avatar con frame, logo a la derecha).

4. **Verificar solape y redondeo en los wrappers de página.** Revisar `index.astro` (`-mt-6 relative z-25`) y el equivalente en soporte-técnico: el panel claro debe tapar la costura con la sección oscura y el redondeo superior verse limpio. Ajustar `-mt`/`z`/`rounded` **solo si** hace falta. *Verificación:* no hay costura ni corte entre Soluciones (oscuro) y Testimonios (claro), ni con HomePartners debajo.

5. **QA visual + consola en las 2 páginas.** Comparar contra la referencia en home y soporte-técnico (desktop + mobile). *Verificación:* `npm run build` sin errores/warnings nuevos; navegación por flechas/drag correcta; sin errores en consola.

**Notas del plan:**

- Paso 1–2 dejan la sección con el nuevo panel/título/flechas; paso 3 la card; paso 4 cuida los solapes; paso 5 cierra QA.
- El motor `useDragSlider`, el toggle `visible` y el schema **no** se tocan.
- El QA visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] El tema oscuro anterior queda **comentado** dentro de `TestimonialSliderReact.tsx` y `TestimonialCard.tsx`, rotulado y sin borrar.
- [ ] La sección de testimonios es un **panel claro `#F3E4EF`** con **esquinas superiores redondeadas**, encimado sobre la sección oscura (Soluciones), sin costura visible.
- [ ] El **título** "Empresas que confían en nuestra red" se ve en **magenta** (`#96237A`).
- [ ] La **pill de flechas** está en **versión clara** (prev rosa claro, next magenta con flecha blanca) y navega card por card con `atStart`/`atEnd`.
- [ ] La **card** muestra el **borde notched magenta**, **sin relleno** (deja ver el panel claro).
- [ ] El **avatar** conserva el **frame magenta** con la foto cuadrada.
- [ ] El **quote** y el **nombre** se ven en texto **oscuro**; la **descripción** y el **cargo** en **gris**.
- [ ] El **logo de la empresa** aparece a la **derecha** del bloque de texto, según la referencia.
- [ ] Se conserva la mecánica: **drag** con snap y **flechas**; el toggle `visible` sigue ocultando/mostrando la sección desde el CMS.
- [ ] En **mobile** la card mantiene el layout apilado, en **tema claro** (texto oscuro, panel claro).
- [ ] El rediseño se ve en las **2 páginas** (home + soporte-técnico) al ser el mismo componente compartido.
- [ ] No se tocaron las **secciones vecinas** (Soluciones, HomePartners/footer) ni el **schema** de testimonios.
- [ ] El **título** y cada campo editable siguen siendo editables desde Tina (`data-tina-field`).

---

## Decisiones tomadas y descartadas

- **Sí:** rediseñar **el mismo `TestimonialSlider`/`TestimonialCard`** (no crear componentes nuevos). Es el bloque compartido por las 2 páginas; evolucionarlo propaga el tema sin duplicar.
- **Sí:** **panel claro `#F3E4EF` con esquinas superiores redondeadas**, encimado sobre lo oscuro. Confirmado por el cliente; coincide con la referencia y reusa el patrón `rounded-t` + solape `-mt` del proyecto.
- **No:** fondo claro a sangre ni "solo recolorear contenido sobre fondo oscuro". Descartado por la respuesta del cliente.
- **Sí:** usar el token existente `brand-purple.lightest` (`#F3E4EF`) para el panel y `brand-purple` (`#96237A`) para título/borde/flecha. Mantiene consistencia con el design system.
- **Sí:** **conservar el borde notched y el frame del avatar** (ya son magenta y calzan con el Figma). Solo cambian colores de texto y fondo.
- **Sí:** **flechas en versión clara** (prev rosa claro, next magenta). El pill oscuro no encaja en el panel claro.
- **Sí:** la **barra magenta** inferior es la **sección siguiente existente**; **no** se toca. Confirmado por el cliente.
- **No:** agregar una banda magenta nueva al pie del panel. Descartado por la respuesta del cliente.
- **Sí:** **comentar** el tema oscuro dentro de los componentes en vez de borrarlo. Preferencia del cliente (igual que en el SPEC 48 de soluciones).
- **Sí:** aplicar a **ambas páginas** (home + soporte-técnico) vía el componente compartido. Confirmado.
- **Sí:** **conservar `useDragSlider`, el toggle `visible` y el schema**. Solo cambia el tema visual; la mecánica y el dato ya están probados.
- **Definición semi-rápida:** las secciones de Modelo de datos, Plan, Criterios, Decisiones y Riesgos se redactaron asumiendo defaults razonables (a pedido del cliente: "asume los temas y guarda"), tras cerrar las 4 decisiones clave por preguntas.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El solape `-mt`/`z` con la sección oscura deja una **costura** o corta el redondeo superior del panel claro. | Paso 4 revisa y ajusta `-mt`/`z`/`rounded` en los wrappers; QA visual del empalme Soluciones → Testimonios. |
| El **borde notched SVG** (stroke magenta) pierde contraste o se ve raro sobre el panel claro. | El stroke ya es magenta `#96237A`, con buen contraste sobre `#F3E4EF`; verificar en QA desktop/mobile. |
| Al **comentar** el tema oscuro quedan **clases/estilos huérfanos** o imports sin uso que rompan el build. | Mantener helpers/imports que el tema claro siga usando; comentar juntos markup + estilos que solo servían al oscuro. |
| El **texto oscuro** sobre el panel claro no cumple contraste mínimo en descripción/cargo (gris sobre rosa claro). | Elegir un gris con contraste suficiente sobre `#F3E4EF`; verificar contraste en QA. |
| El cambio de tema **rompe el layout mobile** (que hoy es apilado y oscuro). | Adaptar el mobile al tema claro conservando el layout apilado; QA a ~390px. |
| La sección está **oculta** por el toggle `visible=false` y el QA no ve nada. | Verificar/activar `visible` en el contenido durante el QA (sin dejarlo forzado si el cliente lo quiere oculto en prod). |
| El **logo de empresa** (PNG con fondo/tinte pensado para oscuro) se ve mal sobre el panel claro. | QA por logo; si algún logo no contrasta, es tema de contenido/asset (se nota, no se corrige aquí). |

---

## Qué **NO** entra en este spec

- Cambiar el schema de `home.testimonials` en `tina/config.ts`.
- Tocar las secciones vecinas (Soluciones, HomePartners/footer) ni la barra magenta inferior.
- Cambiar el motor de arrastre (`useDragSlider`) o la lógica del toggle `visible`.
- Cambiar el contenido de los testimonios (quotes, nombres, logos, fotos).
- Rediseñar otras secciones del home / soporte-técnico.

Cada uno de estos, si aterriza, va en su propio spec.
