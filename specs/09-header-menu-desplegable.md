# SPEC 09 — Header: menú desplegable multinivel (hover desktop / drill mobile)

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (fijó las 4 soluciones y sus URLs en el footer; se reutilizan aquí). Reutiliza el shell del overlay actual de `HeaderReact.tsx`.
> **Fecha:** 2026-06-30
> **Objetivo:** Rediseñar el menú overlay del Header para que en **desktop** al hacer hover sobre *Servicios* o *Nosotros* se revele su submenú a la derecha (y el click del texto navegue), y en **mobile** el texto navegue mientras la **flecha** expande el nivel inferior en una jerarquía CMS de 3 niveles (Servicios → 4 soluciones → sub-servicios; Nosotros → Casos de éxito, Blog).

---

## Alcance

**Dentro:**

- **Schema CMS (nivel 3).** Extender `global.nav.links[].children[]` en `tina/config.ts` para anidar un tercer nivel `children[]` (sub-servicios), con `text` + `url`. Regenerar el cliente Tina.
- **Contenido del nav** en `src/content/global/index.json`: reescribir `nav.links` a la estructura del PDF:
  - *Servicios* (`/servicios`) → 4 soluciones (nivel 2), cada una con su lista de sub-servicios (nivel 3, del PDF).
  - *Nosotros* (`/nosotros`) → Casos de éxito, Blog (nivel 2, sin nivel 3).
  - *Soporte técnico* (`/soporte-tecnico`) y *Contacto* (`/contacto`) → links planos (sin hijos).
  - Se elimina el ítem *Blog* de nivel superior (pasa a ser hijo de *Nosotros*) y el *Inicio*.
- **Desktop (≥768px) — hover reveal.** Columna izquierda = nav de nivel superior. Al hacer **hover** sobre un ítem con hijos (*Servicios*/*Nosotros*), la columna derecha revela sus hijos de nivel 2 (con `→`), y el ítem activo se subraya. El hover sobre un ítem sin hijos limpia la columna derecha. **Click en el texto navega** a su `url`.
- **Desktop — solo 2 niveles visibles.** En desktop la columna derecha muestra el nivel 2; las flechas de las soluciones **navegan** a la página de la solución (no hay drill al nivel 3 en desktop). El nivel 3 es exclusivo de mobile.
- **Mobile (<768px) — drill por flecha.** Cada ítem con hijos se parte en **texto** (navega a su `url`) + **flecha** (expande el siguiente nivel). Tres niveles: nivel superior → soluciones → sub-servicios. Cada nivel drilleado muestra un botón "Atrás".
- **Mobile — hermanos bajo divisor.** Al abrir un ítem de nivel superior (Servicios/Nosotros), bajo un divisor se listan los **otros ítems de nivel superior** (como el Figma), navegables.
- **Eliminar el CTA "Paga tu recibo".** Quitar el bloque comentado del botón y su lógica (`ctaText`/`ctaUrl`) del Header. Ya no existe.
- **Eliminar `categoryGroups` hardcodeado** de `HeaderReact.tsx`: toda la jerarquía sale del CMS.
- **Conservar el shell:** barra fija, hamburguesa/Cerrar, animación de apertura del overlay, ocultar-al-scroll, bloqueo de scroll del body, y las redes sociales al pie del overlay.
- **QA visual** contra `references/servicios-header.png` y `references/nosotros-header.png` (desktop) y los frames mobile del Figma, con Playwright MCP (screenshots en `.playwright-screens/`).

**Fuera de alcance (para otras specs):**

- **Crear las páginas destino** de soluciones (`/servicios/*`), sub-servicios, *Casos de éxito*, etc. Este spec solo pone los **links** con su URL planificada; un 404 temporal es aceptado y documentado (igual que SPEC 07).
- **Nivel 3 en desktop** (drill a sub-servicios en el overlay desktop). Desktop se queda en 2 niveles.
- **Rediseñar el shell** (animación de apertura, hamburguesa, logo, comportamiento de scroll) más allá de quitar el CTA.
- **Tocar el Footer**, `maintenance`, u otros componentes compartidos.
- **Reintroducir un CTA** de pago en el Header.

---

## Modelo de datos

Se reutiliza `global.nav` (colección `global`). El único cambio de **schema** es añadir un tercer nivel; el resto es **contenido**. Cada URL se marca ✓ (existe hoy) o ⚠︎ (planificada, hoy 404).

### 1. Schema — tercer nivel en `tina/config.ts`

Anidar un `children[]` dentro de `nav.links[].children[]`:

```js
{
  name: "children", label: "Submenú", type: "object", list: true,
  ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
  fields: [
    { name: "text", label: "Texto", type: "string" },
    { name: "url",  label: "URL",   type: "string" },
    {
      name: "children", label: "Sub-servicios (solo mobile)",
      type: "object", list: true,
      ui: { itemProps: (item) => ({ label: item?.text || "Sub-servicio" }) },
      fields: [
        { name: "text", label: "Texto", type: "string" },
        { name: "url",  label: "URL",   type: "string" },
      ],
    },
  ],
}
```

Tras editar: regenerar el cliente Tina (`npm run dev`/`build` corre `tinacms build`), de modo que la query `global` incluya `nav.links.children.children`.

### 2. Contenido — `nav.links` (nivel 1 → 2)

```jsonc
"links": [
  { "text": "Servicios", "url": "/servicios",       // ⚠︎ (índice de servicios)
    "children": [ /* 4 soluciones, ver tabla nivel 3 */ ] },
  { "text": "Nosotros",  "url": "/nosotros",         // ✓
    "children": [
      { "text": "Casos de éxito", "url": "/casos-de-exito" },  // ⚠︎
      { "text": "Blog",           "url": "/blog" }             // ✓
    ] },
  { "text": "Soporte técnico", "url": "/soporte-tecnico" },    // ✓ (sin hijos)
  { "text": "Contacto",        "url": "/contacto" }            // ✓ (sin hijos)
]
```

> Los títulos de las 4 soluciones usan la redacción del **header Figma / footer** ("Data Center, Cloud y Continuidad de Negocio"), no la del PDF ("Cloud, Data Center y Continuidad de negocio"), para consistencia con SPEC 07.

### 3. Contenido — soluciones (nivel 2) y sus sub-servicios (nivel 3)

Todas las URLs de nivel 3 son ⚠︎ (rutas anidadas planificadas, hoy 404).

**Conectividad empresarial** — `/servicios/conectividad-empresarial`:

| Sub-servicio | URL |
|---|---|
| Internet Corporativo | `…/internet-corporativo` |
| Internet Corporativo de Alta Disponibilidad | `…/internet-alta-disponibilidad` |
| Conectividad satelital | `…/conectividad-satelital` |
| Radioenlaces Empresariales | `…/radioenlaces-empresariales` |
| Transmisión de datos (L2L) | `…/transmision-de-datos-l2l` |
| Fibra Oscura | `…/fibra-oscura` |
| SD-WAN | `…/sd-wan` |
| Balanceo de enlaces | `…/balanceo-de-enlaces` |

**Ciberseguridad gestionada** — `/servicios/ciberseguridad-gestionada`:

| Sub-servicio | URL |
|---|---|
| NGFW y Seguridad Perimetral | `…/ngfw-seguridad-perimetral` |
| VPN Segura y Acceso Remoto | `…/vpn-segura` |
| EDR / XDR / MDR | `…/edr-xdr-mdr` |
| Seguridad de correo y filtrado web | `…/seguridad-correo-filtrado-web` |
| MFA y Control de Identidad | `…/mfa-control-identidad` |
| ZTNA y Control de Acceso Seguro | `…/ztna` |
| NAC (Network Access Control) | `…/nac` |
| WAF y Protección de Aplicaciones | `…/waf` |
| Anti-DDoS | `…/anti-ddos` |
| Concientización en Phishing | `…/concientizacion-phishing` |
| CYBER SOC 24/7 y Monitoreo | `…/soc-24-7` |
| Correlación de eventos (SIEM/SOAR) | `…/correlacion-eventos` |
| Pentesting y Evaluación de Vulnerabilidades | `…/pentesting` |

**Data Center, Cloud y Continuidad de Negocio** — `/servicios/data-center-cloud`:

| Sub-servicio | URL |
|---|---|
| Housing y Colocación | `…/housing-colocacion` |
| Nube Privada | `…/nube-privada` |
| Nube Pública | `…/nube-publica` |
| Backup as a Service (BaaS) | `…/baas` |
| Disaster Recovery (DRaaS) | `…/draas` |
| Storage y Cómputo Empresarial | `…/storage-computo` |
| Arquitectura basada en Microservicios | `…/microservicios` |

**Servicios gestionados** — `/servicios/servicios-gestionados`:

| Sub-servicio | URL |
|---|---|
| Mesa de Ayuda | `…/mesa-de-ayuda` |
| Comunicaciones Unificadas | `…/comunicaciones-unificadas` |
| Colaboración Empresarial | `…/colaboracion-empresarial` |
| Gestión de Redes LAN | `…/gestion-redes-lan` |
| WiFi Gestionado | `…/wifi-gestionado` |
| Gestión de Endpoints | `…/gestion-endpoints` |
| Videovigilancia gestionada | `…/videovigilancia-gestionada` |

### 4. Tipos en `HeaderReact.tsx`

`NavChild` gana un `children?: (NavGrandChild | null)[] | null`; se añade `interface NavGrandChild { text; url }`. Se elimina la constante `categoryGroups` y el estado/UI del CTA (`ctaText`, `ctaUrl`).

---

## Plan de implementación

Todo el trabajo vive en `tina/config.ts` (schema nivel 3), `src/content/global/index.json` (contenido del nav) y `src/components/shared/HeaderReact.tsx` (lógica de reveal/drill). Cada paso deja el proyecto ejecutable.

1. **Schema nivel 3 en `tina/config.ts`.** Anidar `children[]` dentro de `nav.links[].children[]` (con sus `ui.itemProps`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` → Global → Navegación cada hijo de Servicios permite agregar "Sub-servicios".

2. **Contenido del nav en `src/content/global/index.json`.** Reescribir `nav.links` a la estructura del modelo de datos: Servicios (4 soluciones + sub-servicios), Nosotros (Casos de éxito, Blog), Soporte técnico, Contacto; eliminar *Inicio* y el *Blog* de nivel superior. *Test:* el JSON valida contra el schema; la query `global` devuelve los 3 niveles.

3. **Limpieza de `HeaderReact.tsx`.** Eliminar la constante `categoryGroups`, el estado `activeCategory`/`openCategory`/`goBack` que dependía de ella, y todo el bloque + variables del CTA (`ctaText`, `ctaUrl`). Añadir los tipos `NavGrandChild` y `children` en `NavChild`. *Test:* compila sin referencias muertas; el overlay abre/cierra igual que antes (shell intacto).

4. **Desktop — hover reveal de 2 niveles.** Columna izquierda = `mainLinks`. `onMouseEnter` de un ítem con hijos fija `activeParent` (índice/ref) y subraya el ítem; `onMouseEnter` de un ítem sin hijos limpia `activeParent`. La columna derecha renderiza `activeParent.children` (nivel 2) con su `→`, cada uno enlazando a su `url`. **Click en el texto del nivel 1 navega** a su `url` (sin `preventDefault`). *Test:* en desktop, hover sobre Servicios muestra las 4 soluciones; hover sobre Nosotros muestra Casos de éxito/Blog; click en el texto navega; coincide con `references/*-header.png`.

5. **Mobile — pila de niveles (texto navega / flecha drillea).** Estado de navegación por niveles (p. ej. `mobilePath: number[]` o `{level1, level2}`). Render:
   - **Nivel 1:** ítems con hijos = fila con **texto** (`<a href>` que navega) + **botón flecha** (drillea al nivel 2). Ítems sin hijos = link plano.
   - **Nivel 2 (soluciones):** botón "Atrás", título de la solución, y sus sub-servicios como fila texto+flecha (flecha drillea al nivel 3). El texto de la solución / sub-servicio navega a su `url`.
   - **Nivel 3 (sub-servicios):** botón "Atrás", título, lista de sub-servicios como links planos.
   - **Hermanos bajo divisor:** en el nivel 2 de un padre, listar bajo un divisor los otros ítems de nivel 1 (navegables), como el Figma.
   *Test:* en mobile, tap en la flecha de Servicios expande soluciones; tap en la flecha de una solución expande sus sub-servicios; tap en el texto navega en cualquier nivel; "Atrás" retrocede un nivel.

6. **Reset de estado al cerrar.** Al cerrar el overlay (o cambiar de breakpoint), limpiar `activeParent` y `mobilePath`. *Test:* reabrir el menú siempre parte del nivel 1 sin estado residual.

7. **QA visual desktop + mobile** con Playwright MCP contra `references/servicios-header.png`, `references/nosotros-header.png` y los frames mobile del Figma (screenshots en `.playwright-screens/`). Ajustar tipografías, subrayado activo, espaciados y flechas. *Test:* `npm run build` sin errores/warnings nuevos y QA aprobado en ambos breakpoints.

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos.
- [ ] En `/admin` → Global → Navegación, cada hijo de *Servicios* permite agregar/editar una lista **"Sub-servicios"** (tercer nivel), editable sin tocar código.
- [ ] `nav.links` tiene exactamente 4 ítems de nivel superior: **Servicios**, **Nosotros**, **Soporte técnico**, **Contacto** (ya no aparecen *Inicio* ni *Blog* de nivel superior).
- [ ] *Servicios* tiene 4 hijos (Conectividad empresarial, Ciberseguridad gestionada, Data Center Cloud y Continuidad de Negocio, Servicios gestionados); *Nosotros* tiene 2 (Casos de éxito, Blog); *Soporte técnico* y *Contacto* no tienen hijos.
- [ ] Cada solución tiene sus sub-servicios del PDF (8 / 13 / 7 / 7 respectivamente); *Conectividad empresarial* incluye **Conectividad satelital**.
- [ ] **Desktop (≥768px):** hover sobre *Servicios* revela sus 4 soluciones en la columna derecha con `→`; hover sobre *Nosotros* revela Casos de éxito + Blog; el ítem con hover se subraya.
- [ ] **Desktop:** hover sobre un ítem sin hijos (*Soporte técnico*/*Contacto*) limpia la columna derecha.
- [ ] **Desktop:** click en el **texto** de un ítem de nivel superior navega a su `url` (`/servicios`, `/nosotros`, `/soporte-tecnico`, `/contacto`); las flechas de las soluciones navegan a la página de la solución. No hay drill al nivel 3 en desktop.
- [ ] **Mobile (<768px):** tap en la **flecha** de *Servicios* expande las soluciones; tap en la flecha de una solución expande sus sub-servicios; el botón "Atrás" retrocede un nivel.
- [ ] **Mobile:** tap en el **texto** (en cualquier nivel) navega a su `url`, sin expandir.
- [ ] **Mobile:** al abrir *Servicios*/*Nosotros*, bajo un divisor se listan los otros ítems de nivel superior, navegables.
- [ ] El **CTA "Paga tu recibo"** ya no existe en el Header (ni markup, ni `ctaText`/`ctaUrl`).
- [ ] No quedan referencias a `categoryGroups` en `HeaderReact.tsx`.
- [ ] Al cerrar y reabrir el overlay, el menú parte del nivel 1 sin estado residual.
- [ ] El shell (barra fija, hamburguesa/Cerrar, animación de apertura, ocultar-al-scroll, bloqueo de scroll, redes sociales) funciona igual que antes.
- [ ] Los links a rutas existentes (`/nosotros`, `/blog`, `/soporte-tecnico`, `/contacto`) navegan sin 404; los planificados (⚠︎: `/servicios/*`, sub-servicios, `/casos-de-exito`) llevan su URL definitiva aunque hoy den 404.
- [ ] QA visual aprobado contra `references/servicios-header.png`, `references/nosotros-header.png` (desktop) y los frames mobile del Figma.
- [ ] No hay errores en consola al abrir el menú y navegar por los niveles en ambos breakpoints.

---

## Decisiones tomadas y descartadas

- **Sí:** jerarquía de **3 niveles editable en el CMS** (nivel 3 anidado en `nav.links.children.children`). Coherente con el patrón CMS-driven del proyecto; permite editar soluciones y sub-servicios sin deploy. *(Elección del usuario: opción 1a.)*
- **No:** hardcodear la estructura en el componente (como el actual `categoryGroups`). Se elimina justamente para no volver a editar código por cada cambio de catálogo.
- **Sí:** en **desktop, hover** revela el nivel 2 y **click en el texto navega**. Es lo que muestran las referencias y lo confirmado por el usuario.
- **Sí:** **desktop solo 2 niveles**; el nivel 3 (sub-servicios) es exclusivo de mobile. El Figma desktop no define un drill de nivel 3; las flechas de las soluciones navegan.
- **Sí:** en **mobile, el texto navega y la flecha drillea**, en todos los niveles. *(Elección del usuario.)*
- **No:** en mobile, que el tap en cualquier parte del ítem expanda. Se descarta: el usuario quiere separar navegar (texto) de expandir (flecha).
- **Sí:** mostrar bajo un divisor los **hermanos de nivel superior** al abrir un padre en mobile, replicando el Figma.
- **Sí:** **PDF v3 como fuente de verdad** de los sub-servicios; se incluye *Conectividad satelital* aunque el frame mobile del Figma la omitiera (el Figma quedó desactualizado). *(Elección del usuario.)*
- **Sí:** títulos de las 4 soluciones con la **redacción del header Figma / footer** ("Data Center, Cloud y Continuidad de Negocio"), no la del PDF, por consistencia con SPEC 07.
- **Sí:** **eliminar el CTA "Paga tu recibo"** del Header. *(Elección del usuario: "el cta ya no debe existir".)*
- **No:** dejar el CTA comentado o con URL placeholder. Se elimina por completo.
- **Sí:** **URLs de nivel 3 como rutas anidadas planificadas** (`/servicios/<solución>/<sub-servicio>`), 404 temporal aceptado, igual que SPEC 07. *(Elección del usuario.)*
- **No:** anclas dentro de la página de la solución (`…#sub-servicio`). Se prefiere ruta anidada definitiva.
- **Sí:** **conservar el shell** del overlay (animación, hamburguesa, scroll, social). Solo se reescribe la lógica de reveal/contenido. *(Elección del usuario: "solo la lógica".)*
- **No:** crear en este spec las páginas destino inexistentes. Es trabajo de otros specs.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| La **query `global` generada** por Tina podría no incluir el tercer nivel si no se regenera el cliente tras el cambio de schema. | Correr `tinacms build` (vía `npm run dev`/`build`) y verificar que `nav.links.children.children` llega a `HeaderReact`; el paso 1 lo valida antes de seguir. |
| **Links ⚠︎ a páginas inexistentes** dan 404 hasta que se creen (`/servicios/*`, sub-servicios, `/casos-de-exito`). | Decisión consciente y documentada (URL planificada definitiva, patrón SPEC 07). Crear las páginas es trabajo de otros specs. |
| **Slugs planificados** que difieran de los que use quien construya esas páginas → links rotos permanentes. | Slugs kebab-case fijados en el modelo de datos; al crear cada página, confirmar que su ruta coincide (o actualizar un único punto en el JSON). |
| El **hover reveal** en desktop puede parpadear al mover el cursor entre la columna izquierda y la derecha (gap intermedio). | Mantener `activeParent` mientras el cursor esté dentro del contenedor del menú; no limpiar en el gap entre columnas. Verificar en QA. |
| La **lógica mobile de niveles** puede dejar estado residual al cerrar o al cruzar el breakpoint (768px) con el menú abierto. | Paso 6: resetear `activeParent`/`mobilePath` al cerrar y en el `resize` que cruza el breakpoint. |
| **Staleness de Tailwind JIT:** clases nuevas del rediseño pueden no aplicarse en dev hasta reiniciar. | Reiniciar el dev server tras cambios de clases; validar con `astro build` desde la raíz (memoria del proyecto). |
| La **Ciberseguridad** tiene 13 sub-servicios; el drill mobile puede requerir scroll largo. | El overlay ya es `overflow-y-auto`; verificar que el nivel 3 scrollea sin romper el pie de redes. |
| Un ítem sin hijos (*Soporte técnico*/*Contacto*) que reciba lógica de flecha por error rompería la navegación. | Renderizar texto+flecha solo si `children?.length > 0`; los demás son link plano. Cubierto por criterios de aceptación. |
