# SPEC 29 — Botón del hero de subservicios: "Conocer más" que baja a Beneficios

> **Estado:** Implementado
> **Depende de:** SPEC 12 (plantilla de subservicio nivel-2: hero con `ctaLabel` + sección Beneficios)
> **Fecha:** 2026-07-13
> **Objetivo:** En las 35 páginas de subservicio nivel-2, cambiar el botón del hero de "Solicitar cotización" (que baja al formulario) a "Conocer más" que hace scroll suave a la sección Beneficios de la misma página.

## Por qué existe este spec

Hoy, en el hero de cada subservicio, el botón dice "Solicitar cotización" y enlaza a `#contacto-servicios` (el formulario "Déjanos tus datos"). El cliente prefiere que ese botón invite a explorar el contenido de la página: que diga "Conocer más" y lleve al usuario a la sección **Beneficios**, que está justo debajo del hero. El formulario sigue disponible (en la columna derecha del propio hero y en su sección más abajo); solo el botón deja de apuntar a él.

## Alcance

**Dentro:**

- En `src/components/servicios/HeroSubservicioReact.tsx` (línea ~129), cambiar el `href` del botón CTA de `#contacto-servicios` a `#beneficios`.
- En `src/components/servicios/BeneficiosReact.tsx` (línea 76), agregar `id="beneficios"` y `scroll-mt-24` a la `<section>`, espejando el patrón ya usado en el catálogo (`id="catalogo" ... scroll-mt-24`).
- Actualizar `hero.ctaLabel` de `"Solicitar cotización"` a `"Conocer más"` en los **35** JSON de `src/content/subservicios/*.json`.

**Fuera de alcance:**

- El botón "Ver soluciones" de las páginas de categoría (`HeroSolucionReact`, SPEC 11): no se toca.
- El botón del hero del índice `/soluciones` (`HeroServiciosReact`, que también apunta a `#contacto-servicios`): no se toca.
- El formulario "¿Conversamos?" del hero y la sección "Déjanos tus datos" (`#contacto-servicios`): se quedan; solo el botón del hero deja de enlazarlos.
- No se agrega un botón extra: el de cotización se **reemplaza**.
- El schema del campo `ctaLabel` en Tina (`tina/config.ts`): se mantiene editable; solo cambia su valor sembrado.
- El scroll suave global (Lenis, `BaseLayout`): no se modifica; se reutiliza.

## Modelo de datos

Este spec no introduce ni modifica estructuras de datos. Solo cambia el valor de contenido `hero.ctaLabel` en 35 JSON (de "Solicitar cotización" a "Conocer más") y agrega un `id` + `scroll-mt-24` en un componente de presentación.

## Plan de implementación

1. En `src/components/servicios/BeneficiosReact.tsx`, agregar `id="beneficios"` y `scroll-mt-24` a la `<section>` (línea 76), espejando `CatalogoSolucionesReact` (`id="catalogo" ... scroll-mt-24`). *Test:* la sección Beneficios es navegable vía `#beneficios`.
2. En `src/components/servicios/HeroSubservicioReact.tsx`, cambiar el `href` del botón CTA (línea ~129) de `#contacto-servicios` a `#beneficios`. *Test:* en un subservicio, el botón baja a Beneficios.
3. Actualizar los 35 JSON de `src/content/subservicios/*.json`: `hero.ctaLabel` → `"Conocer más"`. *Test:* el botón muestra "Conocer más" en todas las páginas.
4. `npm run build` compila. *QA visual:* click en el botón hace scroll suave a Beneficios, con el offset del header sticky correcto (no queda tapada).

## Criterios de aceptación

- [ ] En las 35 páginas de subservicio, el botón del hero dice **"Conocer más"**.
- [ ] Al hacer click, la página hace **scroll suave** hasta la sección **Beneficios** (no al formulario).
- [ ] La sección Beneficios queda debajo del header sticky sin quedar tapada, gracias al `scroll-mt-24`.
- [ ] Ningún JSON de subservicio conserva `"Solicitar cotización"` en `hero.ctaLabel`.
- [ ] El botón "Ver soluciones" de las páginas de categoría no cambió.
- [ ] El botón del hero del índice `/soluciones` sigue apuntando a `#contacto-servicios`.
- [ ] No hay un botón adicional en el hero de subservicio; el de cotización fue reemplazado.
- [ ] El campo `ctaLabel` sigue editable desde el CMS (solo cambió su valor).
- [ ] `npm run build` compila sin errores.

## Decisiones

- **Sí:** texto **"Conocer más"** (consistente con las cards del catálogo, que ya usan ese texto), no "Conoce más".
- **Sí:** **actualizar el contenido** en los 35 JSON manteniendo el campo `ctaLabel` editable, en vez de hardcodear el texto en el componente. Respeta el patrón CMS/dual-component del proyecto y deja el texto editable a futuro.
- **Sí:** ancla `id="beneficios"` + `scroll-mt-24` espejando el patrón del catálogo (`#catalogo`), para que el header sticky no tape la sección al hacer scroll.
- **No:** tocar los botones del índice de soluciones ni de las páginas de categoría. Fuera de lo pedido (solo subservicios).
- **No:** eliminar el formulario "Déjanos tus datos" ni su ancla `#contacto-servicios`. El form sigue disponible (hero + sección); solo el botón deja de enlazarlo.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un subservicio sin items de beneficios no renderiza la sección → `#beneficios` no existe y el botón no scrollea. | Los 35 subservicios tienen items (algunos placeholder "Beneficio por definir"). Si a futuro alguno queda sin beneficios, revisar antes de publicarlo. |
| El `scroll-mt-24` (96px) no calza con la altura real del header sticky y la sección queda algo tapada o con demasiado aire. | Usar el mismo valor que el catálogo (`scroll-mt-24`), ya validado en el proyecto; ajustar en QA visual si hiciera falta. |

## Qué **NO** entra en este spec

- Botones de los heroes del índice `/soluciones` y de las páginas de categoría.
- Eliminar o mover el formulario de contacto / su ancla `#contacto-servicios`.
- Cambios al schema `ctaLabel` en Tina o al scroll suave global.
- Un segundo botón en el hero (el de cotización se reemplaza, no se suma).
