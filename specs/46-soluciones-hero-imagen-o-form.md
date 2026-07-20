# SPEC 46 — Hero de soluciones: toggle form/imagen editable + imagen de categoría

> **Estado:** Implementado
> **Depende de:** SPEC 11 (plantilla `/soluciones/[solucion]`, hero con form "¿Conversamos?" y `ServiciosForm`).
> **Fecha:** 2026-07-20
> **Objetivo:** Agregar en cada solución un toggle en TinaCMS para mostrar en el hero el formulario o una imagen de categoría (fondo a sangre a la derecha en desktop, fondo arriba en mobile), sembrando las 4 imágenes existentes.

---

## Alcance

**Dentro:**

- **Toggle en el CMS** (`service.hero.heroMode`: `form` | `image`, default `form`) + **campo de imagen** (`service.hero.heroImage`, tipo image), por solución. Regenerar el cliente Tina.
- **Sembrar las 4 soluciones** en modo `image` con su imagen de `public/images/soluciones/`:
  - conectividad-empresarial → `categoriaconectividad1.webp`
  - ciberseguridad-gestionada → `categoriaciberseguridad1.webp`
  - data-center-cloud → `categoriadatacentercloud1.webp`
  - servicios-gestionados → `categoriaserviciosgestionados1.webp`
- **Render en `HeroSolucionReact.tsx`** según `heroMode`:
  - **Modo imagen — desktop:** la imagen de categoría es el fondo del hero **a sangre a la derecha** (reemplaza el backdrop decorativo `hero-img.png`), con el degradado oscuro a la izquierda para legibilidad; **sin la card del formulario**.
  - **Modo imagen — mobile:** la imagen va **de fondo arriba**, detrás del texto del hero (full-bleed, con overlay oscuro para legibilidad); sin la card del formulario.
  - **Modo form:** comportamiento actual intacto (backdrop decorativo + card "¿Conversamos?" a la derecha).
- **El formulario de abajo (`ServiciosForm`) se mantiene** en ambos modos (sigue habiendo un form de contacto en la página).

**Fuera (para futuros specs):**

- Quitar o mover la sección `ServiciosForm` de abajo.
- Cambiar el hero de otras páginas (home, fiberlux-app, soporte).
- Producir/optimizar nuevas imágenes (se usan las `.webp` que ya están).
- Animaciones o parallax sobre la imagen del hero.
- Un segundo/tercer asset por categoría (solo se usa `categoria<X>1.webp`).

---

## Modelo de datos

Se extiende el objeto `hero` de la colección **`service`** (`tina/config.ts`, líneas ~258-286) con dos campos:

```js
// dentro de hero.fields
{ name: "heroMode",  label: "Mostrar en el hero", type: "string",
  options: [ { value: "form", label: "Formulario" }, { value: "image", label: "Imagen" } ],
  // default "form"
},
{ name: "heroImage", label: "Imagen del hero (modo imagen)", type: "image" },
```

Contenido sembrado (por solución) en `src/content/services/*.json`:

```jsonc
"hero": {
  "heading": "…", "intro": "…", "ctaLabel": "Ver soluciones", "formTitle": "¿Conversamos?",
  "heroMode": "image",
  "heroImage": "images/soluciones/categoriaconectividad1.webp"   // según la solución
}
```

No hay colecciones nuevas. `heroMode`/`heroImage` son opcionales; si faltan, el hero cae a modo `form` (comportamiento actual).

---

## Plan de implementación

> Trabajo en `tina/config.ts`, `src/content/services/*.json` (4) y `src/components/servicios/HeroSolucionReact.tsx`. Cada paso deja el proyecto ejecutable.

1. **Schema.** Añadir `heroMode` (select form/image) y `heroImage` (image) al objeto `hero` de `service`. Regenerar Tina. *Test:* en `/admin` → una solución → Hero aparecen el toggle y el campo de imagen.

2. **Contenido.** Sembrar en los 4 JSON `heroMode: "image"` + su `heroImage` correspondiente. *Test:* los JSON validan; los valores llegan al componente.

3. **Render por modo (`HeroSolucionReact.tsx`).** Ramificar según `heroMode`:
   - **Imagen:** usar `heroImage` (con `BASE_URL`) como backdrop — en desktop anclado a la derecha a sangre, en mobile arriba (`object`/`background-position` afinado) — manteniendo el degradado de legibilidad; **no renderizar la card del form**. La columna izquierda (texto + botón) queda igual.
   - **Form:** dejar el render actual (backdrop `hero-img.png` + card del form).
   *Test:* en desktop la solución muestra la imagen a la derecha, texto legible, sin form en el hero; en mobile la imagen de fondo arriba detrás del texto.

4. **QA + build.** Revisar las 4 soluciones en desktop (~1440px) y mobile (~390px): imagen correcta por solución, legibilidad, sin form en el hero, `ServiciosForm` de abajo presente. Cambiar una solución a `form` en el CMS y confirmar que vuelve el form. Correr `astro build`. *Test:* checklist en verde y build sin errores ni warnings nuevos.

---

## Criterios de aceptación

- [x] En `/admin`, cada solución tiene en Hero un **toggle "Mostrar en el hero" (Formulario/Imagen)** y un campo **"Imagen del hero"**.
- [x] Las **4 soluciones** quedan en **modo imagen** con su imagen de categoría correcta (conectividad/ciberseguridad/datacenter/servicios).
- [x] En **desktop**, modo imagen: la imagen se ve **a sangre a la derecha**, el texto de la izquierda es legible (degradado), y **no hay card de formulario** en el hero.
- [x] En **mobile**, modo imagen: la imagen aparece **de fondo arriba** detrás del texto del hero, legible, sin card de formulario.
- [x] En **modo form** (si se togglea en el CMS), el hero vuelve al formulario "¿Conversamos?" como hoy.
- [x] La sección de **formulario de abajo (`ServiciosForm`) sigue presente** en ambos modos.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** campo **`heroImage` editable** por solución (no convención por slug); los nombres de archivo no mapean 1:1 con los slugs y así queda editable/reemplazable en el CMS. *(Elección del usuario.)*
- **Sí:** en desktop, imagen **a sangre a la derecha** (reemplaza el backdrop decorativo), coherente con la referencia. *(Elección del usuario.)*
- **Sí:** en modo imagen se **conserva el `ServiciosForm` de abajo**, así la página nunca se queda sin form de contacto. *(Elección del usuario.)*
- **Sí:** **sembrar las 4 en modo imagen** (el pedido es colocar las imágenes ya); el default del schema es `form` para soluciones futuras.
- **Sí:** en mobile la imagen va **de fondo arriba** detrás del texto (no apilada como bloque), evitando el layout desprolijo de una imagen suelta.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Legibilidad del texto sobre la imagen (según la foto). | Se mantiene/afina el degradado oscuro (izquierda en desktop, arriba en mobile); QA por solución. |
| El recorte a sangre puede cortar la parte interesante de la foto en ciertos anchos/altos. | `object-position`/`background-position` afinables; QA a 1440 y 390. |
| El toggle default (`form`) podría dejar una solución nueva sin imagen. | Es el comportamiento seguro (form actual); documentado. |
| Regenerar Tina puede requerir cuidado con el datalayer en dev. | Se valida que `heroMode`/`heroImage` lleguen al componente tras regenerar (paso 1). |

---

## Lo que **no** entra en este spec

- Quitar/mover el `ServiciosForm` de abajo.
- Heros de otras páginas.
- Producir u optimizar imágenes nuevas.
- Animaciones/parallax sobre la imagen.
