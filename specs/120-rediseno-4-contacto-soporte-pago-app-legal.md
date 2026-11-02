# SPEC 120 — Rediseño 4: Contacto, Soporte, Formas de pago, Fiberlux App, Legales y formularios

> **Estado:** Aprobado
> **Depende de:** SPEC 117 (fundaciones), SPEC 118 (bloques compartidos testimonios/CTA casos)
> **Fecha:** 2026-11-01
> **Objetivo:** Rehacer las páginas de servicio al cliente y legales con el diseño claro del prototipo y adaptar al tema claro las páginas sin prototipo (Info abonados y formularios OSIPTEL), cerrando el rediseño.

---

## Por qué existe este spec

Es la última parte del rediseño (ver SPEC 117). Al terminarlo no debe quedar ninguna página con el diseño oscuro, y staging queda listo para reemplazar a producción.

Referencia: `references/rediseno/` (desktop y mobile de cada una):

- `Contacto.dc.html`
- `Soporte.dc.html`
- `Formas de Pago.dc.html`
- `Fiberlux App.dc.html`
- `Legal.dc.html`

**Info abonados**, **reclamos** (`/reclamos` y subpáginas) y **libro de reclamaciones** no tienen prototipo. Se adaptan con los tokens y componentes del sistema nuevo.

---

## Scope

**In:**

- **Contacto** (`/contacto`): layout del prototipo con el form `contacto` (`DynamicFormReact`) reestilizado.
- **Soporte técnico** (`/soporte-tecnico`): hero, canales de soporte, soluciones, testimonios y CTA casos.
- **Formas de pago** (`/formas-de-pago`): cabecera y pasos.
- **Fiberlux App** (`/fiberlux-app`): hero, beneficios, eficiencia, testimonios y CTA casos.
- **Legal** (`/legales/[slug]`): hero legal y contenido rich-text con la tipografía del prototipo.
- **Reestilo de `FormControls.tsx` / `FormSuccess.tsx` al tema claro.** Lo heredan todos los forms: contacto, servicios, reclamo, queja, apelación, libro de reclamaciones y derechos ARCO.
- **Info abonados** y **reclamos**: adaptación al tema claro sin cambiar estructura ni lógica.
- **Limpieza final:**
  - Borrar todo componente oscuro sin referencias.
  - Borrar `HeaderV2`, `Footer` viejo y `global.css` muerto.
  - Revisar tokens oscuros sin uso en `tailwind.config.mjs`.
- Rutas `/en` y actualización final de `CLAUDE.md` (describe el sistema visual nuevo).

**Fuera de scope (para specs posteriores):**

- Cambios de lógica de formularios, Turnstile (SPEC 79) o backend PHP.
- Traducción EN de los forms OSIPTEL (sigue ES-fallback).
- Cutover del rediseño a producción (`main`): spec o tarea aparte.

---

## Data model

Se reutilizan `contact`, `soporte-tecnico`, `formas-de-pago`, `fiberlux-app`, `legal`, `infoAbonados` y `dynamicForms`. Solo se agregan campos opcionales con su `_en` donde el prototipo muestra texto que hoy no existe en el CMS. No hay cambios en el modelo de formularios.

---

## Implementation plan

1. Rama `spec-120-rediseno-servicio-legal` desde `staging`. Mapear el prototipo contra las colecciones y listar los faltantes.
2. Schema + contenido ES/EN. Build verde.
3. Reestilo de `FormControls` y `FormSuccess` al tema claro. Verificar visualmente contacto y un form OSIPTEL.
4. Contacto.
5. Soporte técnico.
6. Formas de pago.
7. Fiberlux App.
8. Legal.
9. Info abonados y reclamos (adaptación de tema).
10. Limpieza final de componentes y tokens oscuros, wrappers `/en` y `CLAUDE.md`.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] En 1440px y 390px, Contacto, Soporte, Formas de pago, Fiberlux App y Legal coinciden con sus prototipos.
- [ ] Info abonados, `/reclamos/*` y libro de reclamaciones no muestran fondos ni textos del tema oscuro.
- [ ] Enviar el form de contacto y uno OSIPTEL de prueba produce el correo/lead igual que hoy (incluido Turnstile y adjuntos).
- [ ] `grep -r "HeaderV2\|greyscale-darkest" src` no devuelve resultados.
- [ ] Ninguna ruta del sitio (ES y `/en`) conserva el diseño oscuro (recorrido manual del sitemap).
- [ ] La consola del navegador queda sin errores en las páginas de este spec, ES y EN.

---

## Decisiones

- **Sí:** reestilar `FormControls` una vez para todos los forms en vez de página por página.
- **Sí:** las páginas sin prototipo se adaptan con el sistema nuevo, sin diseño propio.
- **No:** traducir los forms OSIPTEL en este spec (contenido del cliente).
- **Sí (asumido):** fidelidad 1:1 y reutilización del contenido de Tina.
- **Definición rápida:** el autor pidió asumir y guardar.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El reestilo de `FormControls` rompe la validación o la visibilidad condicional | Cambios solo de estilo; probar un form con campos condicionales y adjuntos antes del PR. |
| El cliente pide diseño propio para Info abonados/reclamos | Queda fuera; se haría en un spec adicional con su prototipo. |

---

## Lo que **no** entra en este spec

- Cutover a producción.
- Cambios de backend o de lógica de formularios.
