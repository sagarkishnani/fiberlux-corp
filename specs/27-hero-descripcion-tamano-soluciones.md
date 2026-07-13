# SPEC 27 — Aumentar el tamaño de la descripción del Hero en las páginas de soluciones

> **Estado:** Implementado
> **Depende de:** SPEC 10, SPEC 11, SPEC 12
> **Fecha:** 2026-07-13
> **Objetivo:** Subir la descripción/cuerpo del Hero de `text-body-md` (16px) a `text-body-lg` (20px) en las páginas de índice de soluciones, categoría de solución y subservicio, sin tocar titulares ni ningún otro elemento.

## Por qué existe este spec

En las páginas de soluciones el titular del Hero está bien dimensionado, pero el párrafo de descripción usa `text-body-md` (16px), que se percibe pequeño en desktop. Otras páginas del sitio (casos de éxito, formas de pago, home) ya usan `text-body-lg` (20px) para esa misma descripción y se leen mejor. Este spec alinea las páginas de soluciones con ese tamaño.

## Alcance

**Dentro:**

- Cambiar la clase de la descripción del Hero de `text-body-md` a `text-body-lg` en:
  - `src/components/servicios/HeroServiciosReact.tsx` (índice `/soluciones`) — línea ~60
  - `src/components/servicios/HeroSolucionReact.tsx` (categoría `/soluciones/[x]`) — línea ~92
  - `src/components/servicios/HeroSubservicioReact.tsx` (subservicio nivel 2) — línea ~111

**Fuera de alcance:**

- Los titulares del Hero (`text-[32px] md:text-[44px]/[48px]`): no se tocan.
- El botón CTA, el bloque lateral secundario (`text-[22px] md:text-[26px]`) y la nota (`text-body-sm`): no se tocan.
- El resto de páginas (casos de éxito, formas de pago, home, nosotros, contacto, blog, soporte): ya están en 20px o fuera de este pedido.
- El `max-w` y los márgenes (`mb-*`) de la descripción: se dejan igual.
- Móvil/tablet: `text-body-lg` es 20px fijo (sin responsive), aplica igual en todos los breakpoints — es el mismo comportamiento que ya tiene `text-body-md`.

## Modelo de datos

Este spec no introduce ni modifica estructuras de datos. Solo cambia una clase de Tailwind (token tipográfico ya existente) en tres componentes de presentación.

## Plan de implementación

1. En `HeroServiciosReact.tsx`, en el `<p>` de la descripción (línea ~60), cambiar `text-body-md` por `text-body-lg`. Verificar en `/soluciones` que la descripción del Hero se ve más grande.
2. En `HeroSolucionReact.tsx`, en el `<p>` de la descripción (línea ~92), cambiar `text-body-md` por `text-body-lg`. Verificar en `/soluciones/conectividad-empresarial`.
3. En `HeroSubservicioReact.tsx`, en el `<p>` de la descripción (línea ~111), cambiar `text-body-md` por `text-body-lg`. Verificar en una página de subservicio.
4. `npm run build` para confirmar que compila.
5. QA visual en desktop y móvil: la descripción subió a 20px, el titular quedó igual.

## Criterios de aceptación

- [ ] La descripción del Hero en `/soluciones` renderiza a 20px (`text-body-lg`).
- [ ] La descripción del Hero en `/soluciones/[x]` renderiza a 20px.
- [ ] La descripción del Hero en subservicio renderiza a 20px.
- [ ] Los titulares de los tres Heroes no cambiaron de tamaño.
- [ ] Ningún otro texto de esos Heroes (CTA, bloque lateral, nota) cambió.
- [ ] Ninguna otra página cambió.
- [ ] `npm run build` compila sin errores.

## Decisiones

- **Sí:** usar el token existente `text-body-lg` (20px) en vez de un `text-[18px]` puntual. Mantiene la escala tipográfica limpia y alinea con casos de éxito/formas de pago/home, que ya usan 20px. La estimación del cliente ("18px me parece") apuntaba a ese salto.
- **Sí:** aplicar a las tres páginas de soluciones (índice, categoría y subservicio) para consistencia entre los tres niveles.
- **No:** tocar titulares. El cliente confirmó que están bien.
- **No:** crear un tamaño intermedio de 18px fuera de la escala.
