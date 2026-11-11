# SPEC 129 — Portafolio según el Excel: Cyberguard en búsqueda y Home, sin páginas retiradas, NOC y sede en contacto

> **Estado:** Aprobado
> **Depende de:** SPEC 81, SPEC 124, SPEC 125
> **Fecha:** 2026-11-10
> **Objetivo:** Alinear el sitio al portafolio del Excel: retirar las páginas de servicios que ya no se venden, hacer que la búsqueda y el Home lleven a los planes Cyberguard, actualizar el WhatsApp del NOC y agregar Sede al formulario de contacto.

---

## Por qué existe este spec

| Obs | Origen | Pedido |
|---|---|---|
| 97 | WhatsApp (búsqueda "Edr") | Las páginas viejas de Ciberseguridad (Perimetral, End Point, …) no deben salir en la búsqueda; se desactivan. |
| 98 | WhatsApp (mismo mensaje) | Buscar un término de los planes (p. ej. "EPP") debe mostrar **Cyberguard** con el fragmento que lo menciona. |
| 99 | WhatsApp (Home móvil) | Los chips de Ciberseguridad en Soluciones del Home siguen listando las subcategorías. |
| 100 | WhatsApp | El WhatsApp de soporte técnico (NOC) pasa a **938 606 193**. |
| 101 | WhatsApp (/contacto) | El formulario de contacto no tiene Sede. |
| 102 | WhatsApp (select) + Excel | El "Servicio de interés" incluye servicios que ya no se venden. Fuente de verdad: `Fiberlux_Portafolio_Servicios.xlsx`. |

**Excel frente a `staging`:** el Excel tiene una hoja por categoría y un "Catálogo de soluciones". Conectividad (6), Data Center (6), Infraestructura (6) y Comunicaciones Unificadas (5) coinciden con las opciones del formulario, salvo **Construcción de Data Center**. Ese ítem no está en el Excel: lo agregó SPEC 124 a partir del prototipo del menú.

La hoja de Ciberseguridad todavía lista las 7 subcategorías. Ciberseguridad se vende como 3 planes Cyberguard (SPEC 124), así que esas 7 quedan retiradas.

"EPP" no aparece en el contenido del sitio. Solo está en el proveedor que trae el Excel de la matriz Cyberguard ("WithSecure EPP / EDR / XDR"), que en el CMS quedó guardado como "WithSecure".

---

## Scope

**Incluye:**

- **Retirar 8 subservicios (97, 102).** Se borran sin redirección (su URL pasa a dar 404) estos JSON de `src/content/subservicios/`:
  - `perimetral`, `end-point`, `correo`, `usuarios`, `aplicaciones`, `concientizacion-phishing`, `transporte-redes`;
  - `construccion-data-center`.

  Se quitan también de todo lo que los referencia:
  - `services/ciberseguridad.json` → `catalogo.items` (las 7);
  - `services/data-center.json` → `catalogo` (Construcción);
  - `global/index.json` → hijo "Construcción de Data Center" del nav;
  - opciones `servicio` de `dynamic-forms/servicios.json` y `contacto.json` (Construcción);
  - `home/index.json` → `services.items[1].bullets` (las 7).

  Al no existir los JSON, desaparecen solos del índice de búsqueda, de las rutas ES/EN y del sitemap.
- **Chips del Home (99).** Los bullets de Ciberseguridad pasan a ser:
  - Cyberguard Start → `/soluciones/ciberseguridad#plan-start`
  - Cyberguard Pro → `/soluciones/ciberseguridad#plan-pro`
  - Cyberguard Max → `/soluciones/ciberseguridad#plan-max`

  Los `label_en` quedan iguales: los nombres de los planes no se traducen.
- **Búsqueda dentro de Cyberguard (98).**
  - La entrada de la categoría Ciberseguridad se titula **"Cyberguard"**, con categoría "Ciberseguridad" (solo cuando la categoría usa la plantilla Cyberguard, o sea, cuando tiene `cyberguard.hero.title`).
  - Esa entrada indexa además una lista de **fragmentos** buscables:
    - cada plan: nombre, subtítulo, ideal para y cada feature;
    - cada frente: título y texto;
    - cada pregunta del FAQ;
    - cada fila de la matriz como `«Capa» · «función» — incluido en Start, Pro, Max` (planes con valor `si` o con texto, este último entre paréntesis);
    - el proveedor de cada capa: `«Capa» (proveedor)`;
    - cada término de un campo nuevo `cyberguard.searchKeywords`, editable en Tina.
  - Si un término de la búsqueda no está en el título, la categoría ni la descripción, pero sí en un fragmento, el resultado se muestra con **ese fragmento como extracto** en lugar de la descripción.
  - El proveedor de "Endpoint seguro" vuelve a ser "WithSecure EPP / EDR / XDR", como en el Excel. Se sigue sin mostrar en la página mientras `matriz.showVendors = false`.
  - En `/en` los fragmentos usan los campos `_en`; si están vacíos, se usa el texto en ES.
- **NOC (100).** `src/content/soporte-tecnico/index.json`, canal `whatsapp`, fila "NOC": `value` → `51938606193`.
- **Sede en contacto (101).**
  - `dynamic-forms/contacto.json` suma el campo `sede`, idéntico al de `servicios.json` (select, 25 departamentos, requerido, ancho completo, con `_en`). Va justo después de "Servicio de tu interés".
  - `public/send-email.php` (caso `contacto`, L377) suma `'Sede' => $data['sede'] ?? ''`.
  - `panel-leads.php` la muestra si lista columnas por formulario.

**Fuera de scope:**

- Devolver Switches, Balanceadores, Energía y Pantallas táctiles al **menú**. Siguen en el formulario, el Home y el catálogo, y fuera del menú, como se decidió en la obs 86 / SPEC 124.
- Cambiar el WhatsApp flotante comercial (`global.whatsapp.phone`).
- Redirecciones 301 de las URLs retiradas.
- Búsqueda de texto completo en el resto de páginas (blog, legales, subservicios).
- Renombrar servicios según el Excel (las etiquetas actuales ya coinciden).
- Un resultado de búsqueda por plan Cyberguard.

---

## Modelo de datos

### `tina/config.ts` → `service.cyberguard`

```ts
// campo nuevo, junto a hero/frentes/…
{
  name: "searchKeywords",
  label: "Palabras clave para el buscador",
  description: "Términos que deben encontrar esta página (siglas, marcas, sinónimos). Uno por línea.",
  type: "string",
  list: true,
}
```

```jsonc
// src/content/services/ciberseguridad.json
"cyberguard": {
  "searchKeywords": ["EPP", "EDR", "XDR", "MDR", "SOC", "Firewall", "Antivirus", "Antispam", "Backup", "DNS"],
  "matriz": {
    "capas": [
      // …
      { "name": "Endpoint seguro", "vendor": "WithSecure EPP / EDR / XDR", "rows": [ /* sin cambios */ ] }
    ]
  }
}
```

### `src/pages/search-index.json.ts` / `src/utils/search.ts` → `SearchEntry`

```ts
export interface SearchFragment {
  text: string;      // ES
  text_en?: string;  // EN (vacío ⇒ ES)
}

export interface SearchEntry {
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  url: string;
  type: SearchType;
  category?: string;
  category_en?: string;
  fragments?: SearchFragment[]; // nuevo — solo lo llena la entrada Cyberguard
}

// Resultado de searchEntries: la entrada + el fragmento que hizo match (si lo hubo)
export interface SearchHit {
  entry: SearchEntry;
  excerpt?: string;
}
```

Reglas de puntuación:

- Un término que solo aparece en un fragmento cuenta **+1** (menos que la descripción, +2).
- Para que la entrada siga siendo válida, todos los términos tienen que aparecer en algún campo o fragmento.
- El `excerpt` es el **primer fragmento que contiene más términos** de la búsqueda.
- El overlay pinta `excerpt ?? description`.

### `src/content/dynamic-forms/contacto.json` → campo nuevo

Copia literal del objeto `sede` de `servicios.json` (mismo `name`, opciones y `_en`).

---

## Plan de implementación

Rama: `spec-129-portafolio-excel-cyberguard-busqueda` contra `staging`. Un commit por step.

1. **NOC.** Cambiar el número en `soporte-tecnico/index.json`.
   - Verificación: en `/soporte-tecnico`, el WhatsApp del NOC abre `wa.me/51938606193`.
2. **Retirar subservicios.** Borrar los 8 JSON y limpiar sus referencias (catálogos, nav, opciones de formularios, bullets del Home).
   - Verificación: `grep -rn "perimetral\|end-point\|construccion-data-center" src/content` no devuelve referencias a URLs de subservicio.
   - Build verde; las 8 URLs (ES y EN) no se generan en `dist/`.
3. **Chips del Home.** Bullets de Ciberseguridad → Cyberguard Start/Pro/Max con `#plan-*`.
   - Verificación: a 390 y 1512px los chips muestran los 3 planes; un clic en "Cyberguard Pro" lleva a la card Pro resaltada.
4. **Schema y contenido Cyberguard.** Agregar `searchKeywords` en `tina/config.ts`, sembrar las palabras clave y restaurar el proveedor de Endpoint.
   - Verificación: build verde (según la memoria *build-local-tina-client-localhost*, sin dejar `client.ts` apuntando a localhost); la matriz sigue sin mostrar proveedores.
5. **Índice de búsqueda.** En `search-index.json.ts`, la entrada de la categoría con plantilla Cyberguard toma el título "Cyberguard" y arma `fragments` según el Scope.
   - Verificación: `/search-index.json` tiene una sola entrada con `url` `/soluciones/ciberseguridad`, titulada "Cyberguard", con fragmentos.
6. **Búsqueda y overlay.** `searchEntries` devuelve `SearchHit[]` con `excerpt`; `SearchOverlay.tsx` pinta el extracto, usa `text_en` en `/en` y adapta los consumidores del nuevo tipo.
   - Verificación: "EPP", "edr", "antispam", "sandbox" y "backup" devuelven "Cyberguard" con el fragmento correspondiente; "Edr" ya no devuelve "End Point".
7. **Sede en contacto.** Campo en `contacto.json` y línea `Sede` en el caso `contacto` de `send-email.php` (y en el panel si aplica).
   - Verificación: en `/contacto` y `/en/contact…`, Sede aparece después de Servicio, es obligatoria y el envío local trae "Sede" en el correo.
8. **Registro.** Obs 97–102 → `Hecho` en `specs/observaciones-cliente.md`, con fecha. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] Buscar "Edr", "End Point", "Perimetral" o "Phishing" no devuelve ninguna página de subservicio de Ciberseguridad.
- [ ] Buscar "EPP" devuelve "Cyberguard" (categoría "Ciberseguridad") con un extracto que contiene "EPP".
- [ ] Buscar "sandbox" devuelve "Cyberguard" con el extracto de la fila de la matriz y los planes que la incluyen (solo Max).
- [ ] En `/en`, la misma búsqueda devuelve "Cyberguard" y su URL empieza con `/en/`.
- [ ] Las URLs `/soluciones/ciberseguridad/{perimetral,end-point,correo,usuarios,aplicaciones,concientizacion-phishing,transporte-redes}` y `/soluciones/data-center/construccion-data-center` (y sus `/en`) no existen en `dist/`.
- [ ] Ningún enlace del sitio apunta a esas URLs (menú, catálogos, Home, formularios).
- [ ] Los chips de Ciberseguridad del Home dicen Cyberguard Start, Pro y Max y llevan a la card de cada plan.
- [ ] El "Servicio de interés" de soluciones y de contacto coincide con el Excel: 6 Conectividad, 3 planes Cyberguard, 6 Data Center (sin Construcción), 6 Infraestructura y 5 Comunicaciones.
- [ ] El mega menú no incluye Construcción de Data Center, Switches, Balanceadores, Energía ni Pantallas táctiles.
- [ ] El WhatsApp NOC de `/soporte-tecnico` abre el chat de `51938606193`; el WhatsApp flotante sigue en `51986176790`.
- [ ] El formulario de `/contacto` tiene Sede obligatoria después de Servicio, y el correo de contacto incluye la sede.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Definición rápida.** El autor contestó el bloque de preguntas y pidió asumir el resto de las secciones sin revisarlas una por una.
- **Sí:** el Excel es el portafolio vigente (autor, opción 1a). Por eso sale "Construcción de Data Center" y se quedan Switches, Balanceadores, Energía y Pantallas táctiles en el formulario, el Home y el catálogo.
- **Sí:** esos cuatro **no vuelven al menú** (autor). El menú sigue el prototipo de la obs 86.
- **Sí:** las 7 páginas de Ciberseguridad y la de Construcción se borran **sin redirección** (autor, opción 2c). Construcción sigue la misma regla por consistencia: es una página que ya no está en el portafolio.
- **No:** dejar las páginas vivas y solo sacarlas de la búsqueda. El cliente pidió que "no salgan o se desactiven", y seguirían llegando por Google.
- **Sí:** chips del Home = los 3 planes con ancla a su card (autor, opción 3a). Reutiliza los `#plan-*` de SPEC 124.
- **Sí:** un único resultado "Cyberguard" con el fragmento que coincide (autor confirmó). No se hace un resultado por plan.
- **Sí:** fragmentos en el índice en vez de indexar el HTML renderizado. El índice se arma desde los JSON (SPEC 81) y los fragmentos dan extractos limpios.
- **Sí:** `searchKeywords` editable en Tina. "EPP" y otras siglas no están en el texto visible; así el cliente puede sumar términos sin tocar código.
- **Sí:** el proveedor de Endpoint vuelve al texto del Excel. Sigue oculto en la página, pero aporta EPP/EDR/XDR al buscador.
- **Sí:** solo cambia el WhatsApp del NOC (autor). El flotante es comercial y sigue igual.
- **Sí:** la Sede de contacto usa la misma lista que la de soluciones. No hubo respuesta explícita; es la opción coherente con SPEC 125.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| URLs borradas indexadas en Google dan 404 | Decisión del autor (2c). Se puede pedir la retirada en Search Console; anotarlo en el resumen para el cliente. |
| TinaCloud indexa por rama: borrar documentos y sumar `searchKeywords` cambia el schema | Pushear a `staging` y comprobar que el build del servidor regenera el cliente (memoria *build-local-tina-client-localhost*). |
| Algún componente (catálogo, `relatedPosts`, mega menú, `SolucionV2React` hermanos) espera encontrar un subservicio borrado | El step 2 incluye `grep` de los 8 slugs en `src/` y un build completo; las URLs de catálogo apuntan a rutas que dejan de existir. |
| Leads viejos con `servicio=construccion-data-center` o `sede` ausente en contacto | El backend guarda texto libre; el panel muestra lo que haya. |
| Un fragmento demasiado largo (filas de Backup) llena el overlay | El overlay mantiene `line-clamp-2` en el extracto. |
| Cambiar la firma de `searchEntries` rompe otros consumidores | Buscar usos de `searchEntries` y adaptarlos en el step 6. |
