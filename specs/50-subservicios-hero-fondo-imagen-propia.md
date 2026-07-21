# SPEC 50 — Subservicios: fondo del hero con toggle gráfico/imagen propia (form encima)

> **Estado:** Aprobado
> **Depende de:** SPEC 12 (plantilla subservicio nivel 2, `HeroSubservicioReact`), SPEC 46 (patrón toggle fondo en el hero de categorías)
> **Fecha:** 2026-07-21
> **Objetivo:** Agregar en cada subservicio (nivel 2) un toggle en TinaCMS (`heroBackground`: grafico | imagen) para usar como fondo del hero el gráfico decorativo actual o la foto propia del subservicio (full-bleed con overlay, manteniendo el formulario encima), sembrando los 34 subservicios en modo imagen con su foto de `public/images/soluciones/imagenes/`.

---

## Alcance

**Dentro:**

- **Nuevos campos en la colección `subservicio`** (`tina/config.ts`, objeto `hero`):
  - `heroBackground`: string select `grafico` | `imagen` (default `grafico`).
  - `heroImage`: image (la foto propia del subservicio, en modo imagen).
  - Regenerar el cliente Tina.
- **Render en `HeroSubservicioReact.tsx`** según `heroBackground`:
  - **Modo `grafico`** (actual): backdrop decorativo `images/services/hero-img.png` + degradado oscuro. Sin cambios.
  - **Modo `imagen`**: la `heroImage` como **fondo full-bleed** de todo el hero (detrás del texto a la izquierda y del form a la derecha), con un **overlay/degradado oscuro** para legibilidad. **El formulario "¿Conversamos?" se mantiene encima** (la card conserva su fondo translúcido). Si `heroBackground` es `imagen` pero falta `heroImage`, cae al modo `grafico` (no rompe).
- **Sembrar los 34 subservicios** (`src/content/subservicios/*.json`) con `heroBackground: "imagen"` y su `heroImage` correspondiente de `public/images/soluciones/imagenes/` (mapeo por nombre; ver Modelo de datos).
- **El formulario del hero y el resto de la página** (beneficios, FAQ, form inferior) se mantienen intactos.

**Fuera de alcance (para futuros specs):**

- **Las 4 categorías** (`service`): ya tienen su toggle en el SPEC 46; no se tocan.
- **Ocultar/mover el form** del hero o el form inferior.
- **Producir/optimizar imágenes** nuevas: se usan los `.webp` ya cargados en `public/images/soluciones/imagenes/`.
- **Usar las imágenes sobrantes** (3 `gemini-*`, variantes duplicadas no elegidas, `categoria-*`): quedan en la carpeta sin asignar.
- **Cambiar el hero de otras páginas** (home, soporte, fiberlux-app).
- **Animaciones/parallax** sobre la imagen del hero.

---

## Modelo de datos

Se extiende el objeto `hero` de la colección **`subservicio`** (`tina/config.ts`, ~línea 555) con dos campos. No hay colecciones nuevas.

```js
// dentro de subservicio > hero.fields (junto a heading, intro, note, ctaLabel, formTitle)
{
  name: "heroBackground",
  label: "Fondo del hero",
  type: "string",
  options: [
    { value: "grafico", label: "Gráfico decorativo (actual)" },
    { value: "imagen",  label: "Imagen propia del subservicio" },
  ],
  // default "grafico"; el seed pone "imagen" en los 34
},
{ name: "heroImage", label: "Imagen del hero (modo imagen)", type: "image" },
```

**Convenciones de runtime (`HeroSubservicioReact.tsx`):**

- `heroBackground` opcional; si falta → `grafico` (comportamiento actual).
- En modo `imagen` sin `heroImage` → cae a `grafico` (no rompe).
- La ruta de imagen se sirve `BASE_URL`-aware, igual que el resto del componente.

### Mapeo imagen → subservicio (seed)

Todas las imágenes viven en `public/images/soluciones/imagenes/`. El `heroImage` sembrado es `images/soluciones/imagenes/<archivo>` (ruta relativa, como el SPEC 46). **Todas son editables desde Tina**, así que cualquier elección puede cambiarse sin código.

| # | Subservicio (`src/content/subservicios/*.json`) | `heroImage` (archivo .webp) |
|---|---|---|
| 1 | anti-ddos | antiddos.webp |
| 2 | baas | backup-as-a-service.webp |
| 3 | balanceo-de-enlaces | balanceo-de-enlaces.webp |
| 4 | colaboracion-empresarial | colaboracion-empresarial.webp |
| 5 | comunicaciones-unificadas | comunicaciones.webp ⚠️ |
| 6 | concientizacion-phishing | phishing.webp |
| 7 | conectividad-satelital | conectividad-satelital.webp ⚠️ |
| 8 | correlacion-eventos | correlacion-evento.webp |
| 9 | draas | disaster-recovery.webp |
| 10 | edr-xdr-mdr | edr-xdr.webp |
| 11 | fibra-oscura | fibra-oscura.webp |
| 12 | gestion-endpoints | gestion-endpoints.webp |
| 13 | gestion-redes-lan | gestion-lan.webp |
| 14 | housing-colocacion | housing.webp |
| 15 | internet-alta-disponibilidad | inter-corpo-alta-dispo.webp |
| 16 | internet-corporativo | internet-corporativo.webp |
| 17 | mesa-de-ayuda | mesa-ayuda.webp |
| 18 | mfa-control-identidad | mfa.webp |
| 19 | microservicios | microservicios.webp |
| 20 | nac | nac.webp |
| 21 | ngfw-seguridad-perimetral | ngfw.webp ⚠️ |
| 22 | nube-privada | nube-privada2.webp ⚠️ |
| 23 | nube-publica | nube-publica.webp |
| 24 | pentesting | pentesting.webp |
| 25 | radioenlaces-empresariales | radioenlaces-empresariales.webp |
| 26 | sd-wan | sd-wan.webp |
| 27 | seguridad-correo-filtrado-web | seguridad-de-correo.webp |
| 28 | soc-24-7 | cybersoc1.webp ⚠️ |
| 29 | storage-computo | storage-empresarial.webp |
| 30 | transmision-de-datos-l2l | transmision-de-datos.webp |
| 31 | videovigilancia-gestionada | videovigilancia-gestionada.webp |
| 32 | vpn-segura | vpn-segura.webp |
| 33 | waf | waf.webp |
| 34 | wifi-gestionado | wifi-gestionado.webp |

**⚠️ Elecciones entre variantes duplicadas** (se tomó la de nombre base; la alternativa queda sin usar y se puede cambiar en Tina):

- comunicaciones-unificadas: `comunicaciones.webp` (alt: `comunicaciones2.webp`).
- conectividad-satelital: `conectividad-satelital.webp` (alt: `conectividad-satelital2.webp`).
- ngfw-seguridad-perimetral: `ngfw.webp` (alt: `ngfw-2.webp`).
- nube-privada: `nube-privada2.webp` (alt: `nubep-rivada.webp`, que parece un typo del nombre).
- soc-24-7: `cybersoc1.webp` (alt: `cybersoc2.webp`).

**Imágenes sin asignar** (quedan en la carpeta, fuera de alcance): las 4 `categoria-*.webp` (son de las categorías, no de subservicios) y las 3 `gemini-generated-image-*.webp`.

---

## Plan de implementación

> El trabajo vive en `tina/config.ts` (schema), `src/content/subservicios/*.json` (seed) y `src/components/servicios/HeroSubservicioReact.tsx` (render). Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Extender el schema `subservicio > hero`** en `tina/config.ts`: agregar `heroBackground` (select grafico/imagen, default grafico) y `heroImage` (image). Regenerar el cliente Tina. *Verificación:* `npm run dev` levanta; en `/admin` → Sub-servicios → un item → Hero aparecen "Fondo del hero" (desplegable) e "Imagen del hero".

2. **Render en `HeroSubservicioReact.tsx`.** Leer `hero.heroBackground` (default `grafico`). En modo `imagen` con `heroImage` presente: renderizar la foto como fondo full-bleed (reemplaza el backdrop `hero-img.png`) + overlay/degradado oscuro para legibilidad; el form y el texto se mantienen encima. Modo `grafico` o `imagen` sin foto → backdrop actual. *Verificación:* forzando `heroBackground: imagen` en un JSON, el hero muestra esa foto de fondo con el form legible encima; sin foto o en `grafico`, se ve el backdrop actual.

3. **Sembrar los 34 subservicios** en `src/content/subservicios/*.json` con `heroBackground: "imagen"` y `heroImage` según la tabla del Modelo de datos. *Verificación:* cada página `/servicios/<solucion>/<subservicio>` muestra su foto de fondo; los ⚠️ usan la variante elegida.

4. **QA visual + consola** en varias páginas de subservicio (una por cada solución padre) en desktop y mobile, más el toggle en `/admin`. *Verificación:* `npm run build` sin errores/warnings nuevos; el form sigue legible sobre la foto; alternar a `grafico` en Tina vuelve al backdrop; sin errores en consola.

**Notas del plan:**

- Paso 1–2 habilitan la mecánica (schema + render) con el default en `grafico` (nada cambia visualmente aún); paso 3 activa las fotos vía contenido.
- El mapeo fino ⚠️ se aplica en el paso 3; cualquier elección es reversible desde Tina.
- El QA visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] En `/admin` → **Sub-servicios** → un item → **Hero** aparecen **"Fondo del hero"** (desplegable `Gráfico decorativo` / `Imagen propia`) y **"Imagen del hero"**.
- [ ] Con `heroBackground: "imagen"` y una `heroImage`, el hero del subservicio muestra esa **foto como fondo full-bleed** con **overlay** para legibilidad.
- [ ] El **formulario "¿Conversamos?" se mantiene encima** y legible en modo imagen (card con su fondo translúcido).
- [ ] Con `heroBackground: "grafico"` (o `imagen` sin `heroImage`), el hero muestra el **backdrop decorativo actual** (`hero-img.png`), sin cambios.
- [ ] Los **34 subservicios** quedan sembrados en modo **imagen** con la foto de la tabla del Modelo de datos.
- [ ] Los 5 casos ⚠️ usan la **variante elegida** y son cambiables desde Tina sin tocar código.
- [ ] Cambiar `heroBackground` a `grafico` en Tina para un subservicio vuelve al backdrop, sin romper la página.
- [ ] En **mobile** la foto de fondo se ve correctamente (full-bleed) y el texto + form siguen legibles.
- [ ] No se tocaron las **4 categorías** (`service`) ni otras páginas.
- [ ] Los campos del hero (`heading`, `intro`, etc.) siguen siendo editables desde Tina (`data-tina-field`).

---

## Decisiones tomadas y descartadas

- **Sí:** campo nuevo **`heroBackground` (grafico | imagen)** en vez de reusar `heroMode` del SPEC 46. Confirmado; aquí el form **siempre** queda encima, así que el toggle es de fondo, no de "form vs imagen".
- **No:** reusar `heroMode: form | image`. Su semántica (imagen oculta el form) no aplica a subservicios.
- **Sí:** **sembrar los 34 en modo `imagen`** con su foto. Confirmado ("colocar la imagen de fondo en cada uno"); el editor puede volver a `grafico`.
- **No:** default `grafico` con imagen solo cargada. Descartado por la respuesta del cliente (quiere ver las fotos activas de una).
- **Sí:** **foto full-bleed detrás de todo + overlay**, con el form encima manteniendo su card translúcida. Confirmado; el form sigue legible y es coherente con el hero actual.
- **No:** foto solo detrás del form (mitad derecha). Descartado por la respuesta del cliente.
- **Sí:** `default "grafico"` en el schema (aunque el seed ponga `imagen`). Así, si un subservicio nuevo no configura nada, no depende de una imagen inexistente.
- **Sí:** fallback a `grafico` si falta `heroImage`. Evita un hero roto por contenido incompleto.
- **Sí:** mapeo por nombre con la variante base en los duplicados; alternativas y sobrantes quedan sin usar pero disponibles. Todo editable en Tina, así que no bloquea.
- **Sí:** alcance = **solo subservicios**. Las 4 categorías ya se resolvieron en el SPEC 46.
- **Definición semi-rápida:** Modelo de datos (mapeo), Plan, Criterios, Decisiones y Riesgos se redactaron asumiendo defaults razonables (a pedido del cliente: "asume el resto y guarda"), tras cerrar las 3 decisiones clave por preguntas.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Sobre algunas fotos claras, el **texto o el form pierden legibilidad**. | Overlay/degradado oscuro ajustable sobre la foto; QA por página y reforzar el overlay si hace falta. |
| El **mapeo ⚠️** elige la variante equivocada (ej. `cybersoc1` vs `cybersoc2`). | Todas las imágenes son editables en Tina; el cliente ajusta la que no le guste sin código. |
| Algún subservicio **no tiene foto clara** en la carpeta (nombre no mapeó). | Si falta, se deja en `grafico` (fallback) y se marca para cargar/renombrar imagen luego. |
| Las **fotos pesadas** afectan el LCP del hero. | Ya son `.webp` optimizados (~comprimidas al 80%); `background`/`img` con `cover`; QA de peso si algún hero carga lento. |
| El **typo** `nubep-rivada.webp` confunde el mapeo de `nube-privada`. | Se eligió `nube-privada2.webp`; el cliente confirma/renombra en Tina si corresponde. |
| El overlay full-bleed **cambia el look** de subservicios respecto al gráfico actual de forma no deseada. | El toggle permite volver a `grafico` por subservicio; el default del schema sigue siendo `grafico`. |

---

## Qué **NO** entra en este spec

- Las 4 categorías (`service`) — ya cubiertas por el SPEC 46.
- Ocultar o mover el formulario del hero o el form inferior.
- Producir/optimizar imágenes nuevas o usar las sobrantes (`gemini-*`, `categoria-*`, variantes no elegidas).
- Cambiar el hero de otras páginas (home, soporte, fiberlux-app).
- Animaciones o parallax sobre la imagen del hero.

Cada uno de estos, si aterriza, va en su propio spec.
