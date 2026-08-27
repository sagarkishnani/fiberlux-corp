# SPEC 109 — Reestructuración del portafolio: 5 categorías y 30 soluciones

> **Estado:** Aprobado
> **Depende de:** SPEC 89/103/108 (`home.services.items[]` y `SolucionesStack` con sus escenas), SPEC 93/95 (widgets de `ValorSolucion` por slug de categoría), SPEC 105/107 (plantillas de ilustración de `beneficios`), SPEC 80 (i18n `_en` + `tField`), SPEC 81 (índice de búsqueda), SPEC 63 (tags de blog compartidos)
> **Fecha:** 2026-08-27
> **Objetivo:** Reemplazar las 4 categorías y 35 subservicios actuales por las 5 categorías y 30 soluciones del portafolio nuevo (`Fiberlux_Portafolio_Servicios.xlsx`), con URLs renombradas, redirects desde las viejas y beneficios ilustrados con las plantillas existentes.

---

## Sección 1 — Por qué existe este spec

El portafolio comercial de Fiberlux se rehízo. El Excel que entregó el cliente no es una lista de nombres: trae, por categoría, el resumen completo (título, descripción, desafío, solución, industrias, partners) y, por servicio, el título, el "ideal para", los beneficios y los casos de uso. Es la misma estructura que el sitio ya modela en `src/content/services/*.json` y `src/content/subservicios/*.json`, así que no hay que rediseñar plantillas: hay que **rehacer el contenido y la topología de URLs**.

Los cambios de fondo son tres: aparecen dos categorías (**Infraestructura** y **Comunicaciones Unificadas**), desaparece **Servicios Gestionados** repartiéndose entre esas dos, y quince servicios salen del portafolio. Nada de eso se resuelve editando textos: cambia el árbol de rutas, el mega-menú, el índice de búsqueda y el bloque de soluciones de la Home, que hoy tiene cuatro escenas horneadas.

---

## Sección 2 — Alcance

**Dentro:**

- **Colección `service`:** 5 archivos nuevos (`ciberseguridad`, `data-center`, `infraestructura`, `comunicaciones`, `conectividad`), poblados con el bloque *Resumen de categoría* del Excel. Se eliminan los 4 actuales.
- **Colección `subservicios`:** 30 archivos finales — 20 renombrados/reasignados, 10 nuevos, 15 eliminados.
- **Beneficios ilustrados:** por cada uno de los 30, entre 3 y 5 cards `{title, text, plantilla, datos}` derivadas de las viñetas del Excel, usando las 17 plantillas de SPEC 105/107.
- **Redirects** en `astro.config.mjs` desde toda URL renombrada (categoría y subservicio) hacia la nueva.
- **`tina/config.ts`:** opciones nuevas de `solucionSlug` (los 5 slugs), 10 valores nuevos en la lista de `icon` del catálogo, y `"Infraestructura"` agregado a `BLOG_TAG_OPTIONS`.
- **`CatalogoSolucionesReact.tsx`:** mapeo de los 10 íconos nuevos a glifos de `react-icons/fa6`.
- **`ValorSolucionReact.tsx`:** el mapa `WIDGETS` se rekeya a los 5 slugs nuevos.
- **`HeroHomeReact.tsx`:** la lista horneada de 4 categorías pasa a 5 con las URLs nuevas.
- **`src/content/home/index.json` → `services.items[]`:** 5 tarjetas en vez de 4, cada una con `tabLabel`, `tabIcon`, `url`, `description` y los `bullets[]` de sus soluciones.
- **Escena nueva `Telefonia`** en `src/components/shared/soluciones-escenas/` para Comunicaciones Unificadas, registrada en `index.ts`; Infraestructura reusa una escena existente vía su `tabIcon`.
- **`src/content/global/index.json`:** el mega-menú de soluciones se rehace con las 5 categorías y sus 30 hijos.
- **i18n:** borrador `_en` completo de todo el contenido nuevo (títulos, intros, `Ideal para`, beneficios y casos de uso).
- **Imágenes:** los 12 destinos sin arte propio (2 categorías + 10 soluciones nuevas) apuntan a la imagen existente más cercana; el spec deja la lista de las que el cliente debe reemplazar.
- **Partners por categoría:** los logos del Excel que ya viven en `public/images/partners/`; los 6 faltantes quedan listados como pendiente de entrega.

**Fuera de alcance (specs futuros):**

- Rediseñar el layout de las páginas de categoría o de subservicio: se reusan tal cual.
- Redirects para los 15 servicios eliminados — quedan en 404 por decisión explícita.
- Conseguir o dibujar los 6 SVG de partners faltantes (Sophos, Qnap, Gigas, Hanwha, Microsoft, Starlink).
- Producir el arte definitivo de las 12 imágenes nuevas.
- Responder los `faq.items[].answer` (siguen vacíos y con `faq.visible: false`, como hoy).
- Escena animada propia para Infraestructura en el bloque de Soluciones.
- Reasignar los posts del blog a las categorías nuevas.
- `hreflang` / SEO por locale.

---

## Sección 3 — Modelo de datos

**No cambia la forma de los documentos.** Se reusan tal cual los esquemas `service` y `subservicios` de `tina/config.ts`. Lo que cambia es qué archivos existen y cómo se llaman.

### Mapeo columna del Excel → campo del CMS

| Excel (hoja = categoría) | Campo destino |
| --- | --- |
| `Título 1` (fila 5) | `service.hero.heading` |
| `Descripción 1` | `service.hero.intro` |
| `Título 2` (2 líneas) | `service.valor.title` / `valor.subtitle` |
| `El desafío` | `service.valor.cards[0].text` |
| `Nuestra solución` | `service.valor.cards[1].text` |
| `Industrias destacadas` | `service.valor.cards[2].text` |
| `Partners` | `service.partners.logos[]` |
| `Servicio` (catálogo) | `subservicio.title` + `service.catalogo.items[].title` |
| `Título 1` (catálogo) | `subservicio.hero.intro` + `catalogo.items[].description` |
| `Ideal para` | `subservicio.hero.note` |
| `Beneficios` (viñetas) | `subservicio.beneficios.items[]` |
| `Casos de uso` | `subservicio.casosDeUso.statement` |

### Categorías (`src/content/services/`)

| Archivo nuevo | Slug | Sustituye a | Widget `valor` |
| --- | --- | --- | --- |
| `ciberseguridad.json` | `ciberseguridad` | `ciberseguridad-gestionada` | `shield-switch` |
| `data-center.json` | `data-center` | `data-center-cloud` | `cloud-beam` |
| `infraestructura.json` | `infraestructura` | — (nueva) | `noc` |
| `comunicaciones.json` | `comunicaciones` | — (nueva) | `fiber` |
| `conectividad.json` | `conectividad` | `conectividad-empresarial` | `multisede` |

`servicios-gestionados.json` se elimina; sus partners de telefonía pasan a `comunicaciones` y los de red/CCTV a `infraestructura`.

### Soluciones (`src/content/subservicios/`) — 30 finales

**Ciberseguridad** — `/soluciones/ciberseguridad/…`

| Slug nuevo | Título | Origen |
| --- | --- | --- |
| `perimetral` | Perimetral | `ngfw-seguridad-perimetral` |
| `end-point` | End Point | `edr-xdr-mdr` |
| `correo` | Correo | `seguridad-correo-filtrado-web` |
| `usuarios` | Usuarios | `mfa-control-identidad` |
| `aplicaciones` | Aplicaciones | `waf` |
| `concientizacion-phishing` | Concientización en Phishing | igual |
| `transporte-redes` | Transporte (redes) | **nuevo** |

**Data Center** — `/soluciones/data-center/…`

| Slug nuevo | Título | Origen |
| --- | --- | --- |
| `virtual-server` | Virtual Server | `nube-publica` |
| `baas` | Backup as a Service (BaaS) | igual |
| `draas` | Disaster Recovery (DRaaS) | igual |
| `virtual-desktop` | Virtual Desktop | **nuevo** |
| `autocontenido` | Autocontenido (on premise) | **nuevo** |
| `nas` | NAS (on premise) | **nuevo** |

**Infraestructura** — `/soluciones/infraestructura/…`

| Slug nuevo | Título | Origen |
| --- | --- | --- |
| `wifi-gestionado` | WiFi Gestionado | igual (cambia de categoría) |
| `switches` | Switches | **nuevo** |
| `balanceadores` | Balanceadores | `balanceo-de-enlaces` |
| `servidores` | Servidores | **nuevo** |
| `video-vigilancia` | Video Vigilancia | `videovigilancia-gestionada` |
| `energia` | Energía | **nuevo** |

**Comunicaciones Unificadas** — `/soluciones/comunicaciones/…`

| Slug nuevo | Título | Origen |
| --- | --- | --- |
| `comunicaciones-unificadas` | Comunicaciones Unificadas | igual (cambia de categoría) |
| `cloud-pbx` | Cloud PBX | **nuevo** |
| `colaboracion-ia` | Colaboración IA | `colaboracion-empresarial` |
| `pantallas-tactiles` | Pantallas táctiles | **nuevo** |
| `contact-center` | Contact Center Multicanal | **nuevo** |

**Conectividad** — `/soluciones/conectividad/…`

| Slug nuevo | Título | Origen |
| --- | --- | --- |
| `internet-dedicado` | Internet Dedicado | `internet-corporativo` |
| `alta-disponibilidad` | Alta Disponibilidad | `internet-alta-disponibilidad` |
| `acceso-satelital` | Acceso Satelital | `conectividad-satelital` |
| `lan-to-lan` | LAN to LAN | `transmision-de-datos-l2l` |
| `fibra-oscura` | Fibra Oscura | igual |
| `sd-wan` | SD-WAN | igual |

### Eliminados sin redirect (15)

`vpn-segura`, `ztna`, `nac`, `anti-ddos`, `soc-24-7`, `correlacion-eventos`, `pentesting`, `housing-colocacion`, `nube-privada`, `storage-computo`, `microservicios`, `radioenlaces-empresariales`, `mesa-de-ayuda`, `gestion-redes-lan`, `gestion-endpoints`.

### Íconos nuevos de catálogo

Valores a agregar en `tina/config.ts` y a mapear en `CatalogoSolucionesReact.tsx`:

`segmentacion`, `escritorio-virtual`, `autocontenido`, `nas`, `switch`, `servidor`, `energia`, `pbx`, `pantalla`, `contact-center`.

### Imágenes provisionales

Los 12 destinos sin arte propio reusan la imagen existente más cercana hasta que el cliente entregue la suya:

| Destino | Imagen provisional |
| --- | --- |
| Categoría Infraestructura | `images/soluciones/categoriaserviciosgestionados1.webp` |
| Categoría Comunicaciones | `images/soluciones/imagenes/comunicaciones.webp` |
| `transporte-redes` | `images/soluciones/imagenes/gestion-lan.webp` |
| `virtual-desktop` | `images/soluciones/imagenes/nube-publica.webp` |
| `autocontenido` | `images/soluciones/imagenes/housing.webp` |
| `nas` | `images/soluciones/imagenes/storage-empresarial.webp` |
| `switches` | `images/soluciones/imagenes/gestion-lan.webp` |
| `servidores` | `images/soluciones/imagenes/storage-empresarial.webp` |
| `energia` | `images/soluciones/imagenes/housing.webp` |
| `cloud-pbx` | `images/soluciones/imagenes/comunicaciones2.webp` |
| `pantallas-tactiles` | `images/soluciones/imagenes/colaboracion-empresarial.webp` |
| `contact-center` | `images/soluciones/imagenes/mesa-ayuda.webp` |

### Partners por categoría

Del Excel, usando solo lo que existe hoy en `public/images/partners/`:

| Categoría | Logos disponibles | Faltantes (pendiente de entrega) |
| --- | --- | --- |
| Ciberseguridad | Fortinet, SonicWall, Illumio, WithSecure, Palo Alto | Sophos |
| Data Center | Huawei, Acronis, AWS | Qnap, Gigas |
| Infraestructura | Aruba HPE, Huawei, Hikvision, H3C, Fortinet, Peplink, Ubiquiti | Hanwha |
| Comunicaciones | Yealink, Yeastar | Microsoft |
| Conectividad | Cisco, Mikrotik, TP-Link, Huawei, Peplink | Starlink |

---

## Sección 4 — Plan de implementación

Cada paso deja el sitio compilando (`npm run build` verde) y navegable.

1. **Extender el esquema de Tina.** En `tina/config.ts`: los 5 valores nuevos de `solucionSlug`, los 10 valores nuevos de `icon`, y `"Infraestructura"` en `BLOG_TAG_OPTIONS`. Regenerar tipos. Aún no cambia contenido: el sitio sigue idéntico.
2. **Mapear los 10 íconos nuevos** en `CatalogoSolucionesReact.tsx` a glifos de `react-icons/fa6`. Verificación: ningún ícono cae al `generico` por defecto.
3. **Renombrar las 3 categorías que sobreviven.** `ciberseguridad-gestionada.json` → `ciberseguridad.json`, `data-center-cloud.json` → `data-center.json`, `conectividad-empresarial.json` → `conectividad.json`, actualizando `slug` y los `catalogo.items[].url` internos. Rekeyar `WIDGETS` en `ValorSolucionReact.tsx`. Verificación: `/soluciones/ciberseguridad` renderiza con su widget de escudo.
4. **Crear `infraestructura.json` y `comunicaciones.json`** con el resumen de categoría del Excel (hero, valor, industrias, partners, SEO, blogTags) y su entrada en `WIDGETS`. Eliminar `servicios-gestionados.json`. Verificación: las 5 páginas de categoría cargan.
5. **Renombrar y reasignar los 20 subservicios que sobreviven**, un archivo por vez: nuevo nombre de archivo, `slug`, `solucionSlug`, `solucionTitle`, `title` y `hero.heading` según el Excel.
6. **Reescribir `hero.intro`, `hero.note` y `casosDeUso.statement`** de esos 20 con el texto del Excel (columnas `Título 1`, `Ideal para`, `Casos de uso`).
7. **Rehacer los `beneficios.items[]` de esos 20** a partir de las viñetas del Excel: título corto redactado, texto de la viñeta y `plantilla` + `datos` elegidos entre las 17 disponibles. Verificación: cada card muestra su ilustración animada, ninguna cae al fallback.
8. **Eliminar los 15 subservicios fuera del portafolio.** Verificación: `npm run build` no emite sus rutas y no queda ningún enlace roto hacia ellas.
9. **Crear los 10 subservicios nuevos**, uno por archivo, con el mismo perfil de campos que los existentes (hero + note + beneficios ilustrados + casos de uso + SEO + `faq.visible: false`) e imagen provisional.
10. **Rehacer el `catalogo.items[]` de las 5 categorías** con sus soluciones definitivas, en el orden del Excel, con ícono, descripción corta y URL nueva.
11. **Redirects en `astro.config.mjs`:** una entrada por cada categoría y subservicio renombrado, hacia su URL nueva. Verificación: `/soluciones/ciberseguridad-gestionada/ngfw-seguridad-perimetral` lleva a `/soluciones/ciberseguridad/perimetral`.
12. **Actualizar el mega-menú** en `src/content/global/index.json`: 5 categorías con sus 30 hijos y las URLs nuevas.
13. **Actualizar `HeroHomeReact.tsx`** (lista horneada de 4 → 5 categorías) y `home.services.items[]` (5 tarjetas con `tabLabel`, `tabIcon`, `description` y `bullets[]`).
14. **Crear la escena `Telefonia.tsx`** en `src/components/shared/soluciones-escenas/` con el sistema de unidades `--u` de SPEC 107, registrarla en `index.ts` bajo el `tabIcon` de Comunicaciones y asignar a Infraestructura una escena existente. Verificación: las 5 cards del bloque de Soluciones animan y ninguna repite escena con su vecina inmediata.
15. **Sembrar el borrador `_en`** de todo el contenido nuevo: `title_en`, `heading_en`, `intro_en`, `note_en`, beneficios (`title_en`/`text_en`), `statement_en`, `catalogo.items[].title_en`/`description_en` y los labels del mega-menú.
16. **Barrido final de enlaces:** `grep` por los slugs viejos en `src/` y `public/` para que no quede ninguna referencia sin migrar.

---

## Sección 5 — Criterios de aceptación

- [ ] `npm run build` termina sin errores y sin warnings nuevos.
- [ ] Existen exactamente 5 archivos en `src/content/services/` y 30 en `src/content/subservicios/`.
- [ ] Las 5 páginas `/soluciones/{ciberseguridad,data-center,infraestructura,comunicaciones,conectividad}` cargan con su hero, su bloque de valor y su catálogo.
- [ ] Cada una de las 30 páginas de solución carga en su URL nueva, con breadcrumb apuntando a su categoría correcta.
- [ ] Cada página de categoría lista en su catálogo exactamente las soluciones que le asigna el Excel, en ese orden.
- [ ] `/soluciones/ciberseguridad-gestionada` redirige a `/soluciones/ciberseguridad`, y lo mismo para las otras 2 categorías renombradas.
- [ ] Las 16 URLs de subservicio renombradas redirigen a su URL nueva.
- [ ] Los 15 subservicios eliminados devuelven 404 y no aparecen en el mega-menú, el catálogo ni el buscador.
- [ ] Ninguna card de beneficio queda sin `plantilla`; todas dibujan su ilustración animada.
- [ ] Cada subservicio tiene entre 3 y 5 cards de beneficio.
- [ ] El bloque de Soluciones (Home, `/soluciones`, `/soporte-tecnico`) muestra 5 cards y el rail 5 entradas.
- [ ] Comunicaciones Unificadas usa la escena `Telefonia` y ninguna categoría queda sin escena.
- [ ] El overlay de búsqueda encuentra los 10 servicios nuevos y no devuelve ningún resultado de los 15 eliminados.
- [ ] El mega-menú de Soluciones lista 5 categorías con 30 hijos y todos sus enlaces resuelven sin redirect.
- [ ] En `/en`, las 5 categorías y las 30 soluciones muestran título, intro, beneficios y casos de uso en inglés.
- [ ] Ninguna categoría muestra un logo de partner roto.
- [ ] Las 30 páginas de solución muestran imagen de hero (propia o provisional); ninguna queda con hueco.
- [ ] `grep -r "ciberseguridad-gestionada\|conectividad-empresarial\|data-center-cloud\|servicios-gestionados" src/` solo devuelve las entradas de `redirects` en `astro.config.mjs`.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** renombrar todas las URLs al nombre nuevo del portafolio y agregar redirects. Las URLs viejas (`ngfw-seguridad-perimetral`, `ciberseguridad-gestionada`) ya no coinciden con cómo el cliente nombra sus servicios, y arrastrar esa deuda haría que cada edición futura en Tina se leyera contradictoria.
- **No:** conservar los slugs actuales y cambiar solo los títulos. Evitaba los redirects, pero dejaba 30 URLs desalineadas del portafolio para siempre.
- **Sí:** borrar los 15 servicios fuera del portafolio **sin redirect**, dejándolos en 404. Decisión explícita del cliente: son servicios que ya no se ofrecen, y redirigirlos a una categoría genérica daría una señal falsa de que siguen disponibles.
- **No:** dejar los JSON vivos pero desenlazados. Habría dejado 15 páginas huérfanas indexables sin dueño.
- **Sí:** categoría `comunicaciones` con el servicio `comunicaciones-unificadas` adentro. Evita la URL redundante `/comunicaciones-unificadas/comunicaciones-unificadas` sin inventarle al servicio un nombre técnico (`ucaas`) que el cliente no usa en su material.
- **Sí:** redactar título corto y elegir `plantilla` + `datos` por cada viñeta de beneficio. Es el mismo trabajo que se hizo en los 35 actuales (SPEC 105/107) y sin él las páginas nuevas perderían el sistema visual. El cliente ajusta en Tina.
- **No:** volcar la viñeta literal sin ilustración. Habría partido el sitio en dos estéticas.
- **Sí:** escena animada nueva solo para Comunicaciones Unificadas. Es la categoría con identidad visual más clara (voz/telefonía) y sin escena propia quedaría duplicando la de otra; Infraestructura reusa una existente porque su lenguaje (nodos, racks) ya está cubierto.
- **No:** escenas nuevas para las dos categorías nuevas. Duplicaba el costo del bloque animado por un retorno visual menor.
- **Sí:** imágenes provisionales reusadas del banco existente. El sitio queda completo desde el primer deploy y el reemplazo es un cambio de campo en Tina, no una tarea de código.
- **No:** hero sin imagen para los nuevos. Rompía la consistencia con las 20 páginas que sí tienen foto.
- **Sí:** partners solo con los logos que ya están en el repo, y lista explícita de los 6 faltantes. Un logo roto en la marquesina se ve peor que una marquesina más corta.
- **Sí:** borrador `_en` completo del contenido nuevo. Es la misma política de SPEC 80: EN sale como borrador y el cliente refina en Tina.
- **Sí:** agregar `"Infraestructura"` a `BLOG_TAG_OPTIONS`. La categoría nueva no encaja en ninguno de los 6 tags existentes y sin tag propio su bloque de blog quedaría vacío o mal poblado.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Renombrar 3 categorías y 16 subservicios rompe enlaces internos dispersos (menú, home, hero, posts) | Paso 16 es un barrido de `grep` por los slugs viejos en todo `src/` y `public/`, y hay un criterio de aceptación que lo exige limpio |
| Los 15 servicios eliminados quedan indexados en Google y devuelven 404 | Decisión consciente del cliente; el `sitemap` se regenera en build y las URLs desaparecen de él en el mismo deploy |
| Los redirects estáticos de Astro son páginas con `meta refresh`, no 301 reales | Es el mecanismo que el repo ya usa para `/servicios/*` desde SPEC 80; si el cliente necesita 301 reales, se resuelve en el `.htaccess` del servidor en un spec aparte |
| Cambiar los slugs en `solucionSlug` deja los 30 documentos con un valor que Tina ya no ofrece si el orden de pasos se altera | El paso 1 (esquema) va antes que cualquier edición de contenido, precisamente para que el panel nunca muestre un valor inválido |
| Elegir plantilla de beneficio "a ojo" produce ilustraciones que no dicen nada del beneficio | Cada plantilla se elige por el tipo de dato que dibuja (porcentaje, lista priorizada, ciclo, checklist), no por estética; las que no tienen dato natural van a `checklist` o `escudo` |
| El bloque de Soluciones pasa de 4 a 5 cards y el rail sticky se alarga más que el viewport | El rail ya es `sticky` con scroll propio; se verifica en desktop 1366×768, que es el alto más ajustado del set de QA |
| Las imágenes provisionales se quedan en producción indefinidamente | La tabla de 12 imágenes queda en este spec como lista de entrega y se agrega a `specs/observaciones-cliente.md` |

---

## Lo que **no** entra en este spec

- Rediseñar las páginas de categoría o de subservicio.
- Redirects para los 15 servicios eliminados: quedan en 404 a propósito.
- Los 6 SVG de partners faltantes (Sophos, Qnap, Gigas, Hanwha, Microsoft, Starlink).
- El arte definitivo de las 12 imágenes provisionales.
- Responder las FAQ de las páginas de solución.
- Escena animada propia para Infraestructura.
- Reasignar los posts del blog a las categorías nuevas.
- `hreflang` y SEO por locale.

Cada uno de esos, si entra, va en su propio spec.
