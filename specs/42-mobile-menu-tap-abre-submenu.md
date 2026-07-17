# SPEC 42 — Menú mobile: tocar el ítem abre su submenú

> **Estado:** Implementado
> **Depende de:** SPEC 09 (menú multinivel; revierte su decisión mobile de "texto navega / flecha drillea"). Interactúa con SPEC 33 (HeaderV2) y SPEC 20 (rename a Soluciones).
> **Fecha:** 2026-07-17
> **Objetivo:** En el overlay mobile del header, hacer que tocar el ítem completo (no solo la flecha) despliegue su submenú, y que la página propia del padre se alcance tocando el título del submenú.

---

## Alcance

**Dentro:**

- **Toda la fila dispara el drill.** En el overlay mobile (`lg:hidden`, `<1024px`), un ítem con hijos deja de partirse en `<a>` (navega) + `<button>` chevron (drillea): ahora **toda la fila** es un único control tappable que hace `drillInto` y abre el submenú.
- **Título del submenú = link al padre.** Dentro de la pantalla drilleada, el **título** (el nombre del padre, ej. "Soluciones") es en sí un link que navega a la `url` del padre (ej. `/soluciones`, `/nosotros`) y cierra el menú. No se usa un link "Ver todo" aparte.
- **Aplica a todos los niveles con hijos.** Nivel 1 (Soluciones, Nosotros) y nivel 2 (cada solución con sub-servicios). En cada nivel con hijos la fila entera drillea, y el título de su pantalla drilleada lleva a la página del padre.
- **Chevron visible.** La flecha se mantiene como señal visual de "tiene submenú", pero ya no es el único punto tappable — la fila completa lo es.
- **Ítems sin hijos, intactos.** Soporte técnico y Contacto (y las hojas de nivel 3) siguen como link plano: tap navega y cierra.
- **Solo mobile.** El navbar desktop (`hidden lg:flex`) no se toca.

**Fuera (para futuros specs):**

- Cambiar el modelo de drill-down por un acordeón inline.
- Tocar el comportamiento desktop (hover reveal).
- Cambios de contenido/CMS del nav (`nav.links`), schema o URLs.
- Rediseñar el shell del overlay (animación, hamburguesa, redes, bloqueo de scroll).

---

## Modelo de datos

**No introduce ni modifica datos, colecciones, schema ni props.** Reutiliza `nav.links` (colección `global`) y el estado `mobilePath: number[]` ya existente. Solo cambia el markup/handlers del overlay mobile en `HeaderV2React.tsx`. El link "Ver todo" usa la `url` del nodo actual (`nodeAtPath(mobilePath)`), ya disponible.

---

## Plan de implementación

> Todo el trabajo vive en `src/components/shared/HeaderV2React.tsx`. Cada paso deja el proyecto ejecutable.

1. **Fila tappable en nivel 1.** En el render de `mainLinks` con `hasChildren(link)`, reemplazar el par `<a>` + `<button>` chevron por un único elemento tappable (un `<button>` de fila) que llame a `drillInto(i)`, manteniendo el texto a la izquierda y el chevron a la derecha dentro del mismo control. Cuidar no anidar interactivos (nada de botón dentro de botón). *Test:* en mobile, tocar cualquier parte de la fila de "Soluciones"/"Nosotros" abre su submenú; ya no navega. Commit.

2. **Título del submenú como link.** En el bloque `depth > 0`, convertir el título (`<p>{currentNode.text}</p>`) en un `<a href={currentNode.url}` onClick={closeMenu}>` cuando el nodo tiene `url`. *Test:* al entrar a Soluciones, el título "Soluciones" lleva a `/soluciones` y cierra el menú; no hay link "Ver todo" aparte. Commit.

3. **Mismo patrón en nivel 2.** En el render de `currentChildren` con `childWithChildren`, aplicar el mismo cambio de fila-tappable (drillea al nivel 3), y confirmar que en nivel 3 el título de la solución (mismo bloque `depth > 0`) lleva a su página. *Test:* en Soluciones → una solución, tocar la fila abre sus sub-servicios; el título de la solución lleva a `/soluciones/{solución}`. Commit.

4. **Regresión.** Verificar que ítems sin hijos (Soporte técnico, Contacto y hojas de nivel 3) siguen navegando al tap; que "Atrás" retrocede un nivel; que cerrar/reabrir parte del nivel 1 sin estado residual; que el desktop no cambió; y que `astro build` termina sin errores ni warnings nuevos. Commit.

---

## Criterios de aceptación

- [x] En mobile (`<1024px`), tocar **cualquier parte** de la fila de un ítem con hijos (nivel 1 y nivel 2) abre su submenú (drill); no navega.
- [x] El **título** de la pantalla drilleada es un link que navega a la `url` del padre y cierra el menú (sin link "Ver todo" aparte).
- [x] El chevron sigue visible en las filas con hijos.
- [x] Los ítems sin hijos (Soporte técnico, Contacto, hojas de nivel 3) navegan al tap y cierran el menú, como antes.
- [x] "Atrás" retrocede un nivel; al cerrar y reabrir, el menú parte del nivel 1 sin estado residual.
- [x] El navbar desktop (`≥1024px`) se comporta igual que antes.
- [x] No hay interactivos anidados (ningún botón/enlace dentro de otro botón) en las filas nuevas.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** toda la fila del ítem con hijos hace el drill. *(Nuevo pedido del usuario: tocar solo la flecha es incómodo.)* **Revierte** la decisión de SPEC 09 ("texto navega / flecha drillea").
- **Sí:** la página del padre se alcanza tocando el **título** del submenú (con un chevron sutil como affordance), para no perder el acceso a `/soluciones` y `/nosotros`. *(Ajuste post-implementación pedido por el usuario: el link "Ver todo" separado era redundante con el título.)*
- **No:** un link **"Ver todo {padre}"** aparte bajo el título. Se descarta por redundante — el título ya nombra e identifica al padre.
- **No:** dejar el padre sin acceso a su página en mobile. Se descarta por regresión de navegación.
- **Sí:** aplicar el cambio a **todos los niveles con hijos**, por consistencia del drill.
- **Sí:** mantener el **chevron visible** como affordance de "hay submenú".

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Convertir la fila en un solo control puede dejar un interactivo anidado (chevron `<button>` dentro del botón de fila), inválido en HTML/a11y. | La fila es un único `<button>`; el chevron va como `<span>`/icono decorativo dentro, no como botón propio. Cubierto por criterio de aceptación. |
| Perder el path directo a la página del padre en mobile. | El título del submenú es un link a la página del padre, con un chevron como affordance. |
| El título como link puede no leerse como tappable. | Se le añade un chevron `›` al lado y estado hover; se valida en QA. |

---

## Lo que **no** entra en este spec

- Acordeón inline en lugar del drill-down.
- Cambios en el comportamiento desktop.
- Contenido/CMS/schema del nav.
- Rediseño del shell del overlay.
