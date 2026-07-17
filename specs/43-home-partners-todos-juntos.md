# SPEC 43 — Home: bloque de partners (todos juntos) entre Testimonios y ¿Por qué Fiberlux?

> **Estado:** Implementado
> **Depende de:** SPEC 11 (componentes y modelo de partners: `PartnersMarquee`, `service.partners`, `global.partners`). Interactúa con SPEC 28 (hover del marquee), SPEC 24 (Testimonios) y SPEC 22 (¿Por qué Fiberlux?).
> **Fecha:** 2026-07-17
> **Objetivo:** Agregar en el home, entre Testimonios y ¿Por qué Fiberlux?, una franja de partners que reúne todos los logos de las 4 soluciones (unión deduplicada), reutilizando el marquee existente.

---

## Alcance

**Dentro:**

- **Nueva franja de partners en el home.** Un componente nuevo `HomePartners.astro` que, en build, consulta las 4 soluciones (`serviceConnection`), toma sus `partners.logos`, los **une y deduplica** (por ruta de imagen) y los pasa al `PartnersMarquee` compartido.
- **Copy reutilizado.** El `eyebrow` (`[ PARTNERS TECNOLÓGICOS ]`) y el `title` (`Trabajamos con los líderes de la industria`) salen de `global.partners` (los mismos de las soluciones).
- **Ubicación.** Se monta en `src/pages/index.astro` **entre `TestimonialSlider` y `Stats`** (líneas ~76–77), con el wrapper (márgenes negativos / `z-index`) afinado para mantener el look de solape entre secciones.
- **Mismo look.** Reusa `PartnersMarquee` tal cual: logos en blanco al 55% en desktop con hover al 100% (SPEC 28), comportamiento mobile intacto, marquee infinito, `prefers-reduced-motion` respetado.
- **Auto-sincronizado.** Si una solución agrega o quita un logo en su `partners.logos`, el bloque del home se actualiza solo en el próximo build, sin tocar el componente.

**Fuera (para futuros specs):**

- Hacer los **logos** del bloque del home editables uno a uno desde el CMS (se resuelve por agregación automática).
- Tocar las franjas de partners **per-solución** (`ServicePartners`) o el bloque global existente (`Partners.astro`, que queda sin montar).
- Cambiar el orden del resto del home ni el resto de secciones.
- Rediseñar el marquee, su animación, el hover o el estado mobile.
- Añadir un enlace/CTA por logo distinto al `url` que ya soporta `PartnersMarquee`.

---

## Modelo de datos

**No introduce ni modifica schema ni colecciones.** Reutiliza:

- `service.partners.logos[]` (`{ image, alt, url }`) de cada una de las 4 soluciones — la fuente de los logos.
- `global.partners.eyebrow` y `global.partners.title` — el copy.

La agregación es **lógica de build** dentro de `HomePartners.astro` (aplanar + deduplicar por `image`, preservando el orden de aparición por solución). El resultado alimenta el prop `partners: { eyebrow, title, logos }` de `PartnersMarquee`. No hay dato nuevo persistido.

---

## Plan de implementación

> Trabajo en `src/components/shared/HomePartners.astro` (nuevo) y `src/pages/index.astro`. Cada paso deja el proyecto ejecutable.

1. **Componente agregador.** Crear `HomePartners.astro`: consultar `serviceConnection` (como hace `soluciones/[solucion].astro`) y `global`; aplanar los `partners.logos` de las soluciones, **deduplicar por `image`** (descartando nulos), y renderizar `<PartnersMarquee client:visible partners={{ eyebrow, title, logos }} />` dentro de un wrapper. *Test:* el componente compila y la lista deduplicada tiene ~31 logos únicos.

2. **Montaje en el home.** En `src/pages/index.astro`, insertar `<HomePartners />` entre el bloque de `TestimonialSlider` y el de `Stats`, afinando márgenes/`z-index` del wrapper para conservar el solape visual entre secciones. *Test:* en `/`, entre Testimonios y ¿Por qué Fiberlux? aparece el marquee con todos los logos, sin romper el solape ni el orden de las demás secciones.

3. **QA visual + build.** Revisar desktop y mobile: el marquee anima, logos blancos al 55% con hover al 100% en desktop, sin scroll horizontal, y el solape con la sección morada de Stats se ve bien. Correr `astro build`. *Test:* checklist de aceptación en verde y build sin errores ni warnings nuevos.

---

## Criterios de aceptación

- [x] En el home, entre **Testimonios** y **¿Por qué Fiberlux?**, aparece una franja de partners.
- [x] La franja muestra la **unión deduplicada** de los `partners.logos` de las 4 soluciones (~31 logos, sin repetidos).
- [x] El `eyebrow` y el `title` son los de `global.partners` (`[ PARTNERS TECNOLÓGICOS ]` / `Trabajamos con los líderes de la industria`).
- [x] Reusa `PartnersMarquee`: en desktop los logos están blancos al 55% y suben a 100% en hover; en mobile se comporta igual que en las soluciones.
- [x] Si se agrega o quita un logo en `service.partners.logos` de una solución, el bloque del home refleja el cambio tras rebuild, sin editar `HomePartners.astro`.
- [x] No cambia el orden ni el comportamiento del resto del home; las franjas per-solución (`ServicePartners`) siguen igual.
- [x] Sin scroll horizontal en `/`; `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** **auto-agregar** los partners desde las 4 soluciones y deduplicar por `image`. Siempre en sync con lo que cada solución declara; cero mantenimiento manual. *(Elección del usuario.)*
- **No:** curar una lista global a mano (montar `Partners.astro` y sembrar los 31 logos en `global.partners`). Se descarta por mantenimiento manual y riesgo de drift respecto a las soluciones.
- **Sí:** reusar el **copy** de `global.partners` (eyebrow + title), por consistencia con las soluciones. *(Elección del usuario.)*
- **Sí:** logos automáticos, **solo el copy editable** (vía el form de `global.partners` en `/admin`). *(Elección del usuario.)*
- **Nota:** por ser los logos una **agregación de build** (no un único doc CMS), `HomePartners.astro` renderiza `PartnersMarquee` directo como island, sin envoltorio `useTina`. El copy sigue editable en el CMS, pero no tiene live-preview en el editor visual — trade-off aceptable para esta franja.
- **Sí:** deduplicar por **ruta de imagen** (`image`), preservando el orden de aparición por solución.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los márgenes negativos / `z-index` del solape entre Testimonios y la sección morada de Stats pueden descuadrar al meter un bloque en medio. | El wrapper de `HomePartners` afina sus márgenes/`z`; se valida visualmente en desktop y mobile (paso 3). |
| El fondo del marquee vs el `bg-brand-purple` con `rounded-t-3xl` de Stats podría verse raro en el empalme. | QA visual del empalme; ajustar fondo/espaciado del wrapper si hace falta, sin tocar `PartnersMarquee`. |
| Duplicados entre soluciones (fortinet, huawei, aruba… aparecen en varias). | Dedupe por `image` en la agregación; cubierto por criterio de aceptación. |
| Alguna solución sin `partners.logos` o con entradas nulas. | Filtrar nulos y arrays vacíos al aplanar; el marquee ya devuelve `null` si no hay logos. |

---

## Lo que **no** entra en este spec

- Logos del home editables uno a uno desde el CMS.
- Cambios a las franjas per-solución o al bloque `Partners.astro` global.
- Rediseño del marquee, su hover o el estado mobile.
- Reordenar el resto del home.
