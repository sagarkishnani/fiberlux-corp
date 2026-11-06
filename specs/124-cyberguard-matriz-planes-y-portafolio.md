# SPEC 124 — Cyberguard: matriz de funciones por plan, capa 24/7 destacada, planes en el formulario y portafolio del menú

> **Estado:** Borrador
> **Depende de:** SPEC 119, SPEC 122
> **Fecha:** 2026-11-06
> **Objetivo:** Mostrar en Cyberguard la matriz completa de funciones por plan (Excel del cliente), destacar la capa de monitoreo 24/7, ofrecer los planes Cyberguard en el formulario y dejar el menú de soluciones como en el prototipo.

---

## Por qué existe este spec

| Obs | Origen | Pedido |
|---|---|---|
| 73 | PDF 8 | Efecto automático y sutil (borde que recorre o pulso rosa bajo) en la capa donde se monitorea 24/7. |
| 75 | PDF 10 + WhatsApp + Excel | Botón terciario "Ver más" con todos los servicios incluidos por plan, en desplegables por capa. Fuente: `Cyberguard Matriz de funciones 3 (1).xlsx`. |
| 78 | PDF 13 | El "Servicio de interés" del formulario debe mostrar los **planes** de ciberseguridad, no las subcategorías. |
| 86 | PDF 21 | El portafolio del menú debe replicar el prototipo (Conectividad ya está bien). |

Las cuatro giran alrededor de la misma idea: Ciberseguridad se vende como **3 planes Cyberguard**, no como 7 subcategorías.

**El Excel** (hoja "Matriz de funciones", 91 funciones) trae 6 capas, cada una con su proveedor en la columna F:

| Capa | Proveedor | Funciones |
|---|---|---|
| Seguridad perimetral virtual | Fortigate | 17 |
| Endpoint seguro | WithSecure EPP / EDR / XDR | 40 |
| Antispam | Sophos | 6 |
| Servicio al cliente | Fiberlux | 10 |
| Backup | Acronis | 6 |
| DNS seguro | Cloudflare | 12 |

Cada celda Start/Pro/Max vale `✓`, `X` o un texto ("Trimestral", "8 x 5", "Hasta 2 TB").
Las filas 76–80 (subtipos de backup) vienen sin valor por plan.

---

## Scope

**Incluye:**

- **Matriz comparativa (75).**
  - Botón terciario "Ver más" (estilo texto con flecha, debajo de las 3 cards de planes) que despliega **una matriz única de 3 columnas** (Start / Pro / Max) dentro de la misma sección `#planes`.
  - La matriz se agrupa en **desplegables por capa** (acordeón, la primera abierta). Cada fila es función + valor en cada plan.
  - Celdas: `si` → check morado, `no` → guion gris (con `aria-label` "No incluido"), cualquier otro texto → el texto.
  - Encabezado de la matriz sticky dentro del bloque, con el nombre de los planes (columna de Pro resaltada, como la card `highlighted`).
  - Mobile: columna de función flexible + 3 columnas de 56px. Sin scroll horizontal a 360px.
  - Botón "Ver menos" para cerrar. El estado no se persiste.
  - Contenido sembrado desde el Excel (91 filas, ES). Los `_en` quedan vacíos (fallback ES), como el resto del contenido técnico.
  - El proveedor de cada capa se guarda en el CMS, pero **no se muestra** mientras `matriz.showVendors` sea `false` (default).
- **Capa 24/7 destacada (73).**
  - Nuevo booleano `highlight` en `cyberguard.frentes.items[]`. Se activa en "Monitoreo SOC".
  - La card destacada tiene un **borde luminoso que la recorre** (gradiente cónico rosa bajo `#E9A7DC` → `#96237A`, una vuelta cada 6 s) y un halo rosa muy suave que respira. Solo CSS, sin JS.
  - `prefers-reduced-motion`: borde estático, sin animación.
- **Planes en el formulario (78).**
  - En `src/content/dynamic-forms/servicios.json` y `contacto.json`, el grupo "Ciberseguridad" de `servicio` pasa a tener 3 opciones: `cyberguard-start`, `cyberguard-pro`, `cyberguard-max` ("Cyberguard Start/Pro/Max").
  - Las 7 subcategorías salen de las opciones.
  - Los botones "Cotizar Start/Pro/Max" de las cards preseleccionan su plan en el formulario al bajar a `#formulario`.
- **Portafolio del menú (86).** Cambios en `global.nav` (`src/content/global/index.json`). Desktop y drawer mobile leen lo mismo.
  - **Ciberseguridad:** hijos = Cyberguard Start / Pro / Max, con url `/soluciones/ciberseguridad#plan-start|pro|max`. Etiqueta de la columna derecha "PLANES CYBERGUARD".
  - **Data Center:** se agrega "Construcción de Data Center" → nueva página `/soluciones/data-center/construccion-data-center`.
  - **Infraestructura:** quedan WiFi Gestionado, Servidores y Video Vigilancia. Switches, Balanceadores y Energía salen **solo del menú**: sus páginas y su lugar en el catálogo de la categoría siguen.
  - **Comunicaciones Unificadas:** "Comunicaciones Unificadas" → "Comunicaciones Unificadas (UCaaS)"; "Pantallas táctiles" sale **solo del menú**.
  - Nuevo campo opcional por categoría `megaLabel` (+ `_en`) para la etiqueta de la columna derecha. Vacío ⇒ "SOLUCIONES" (`t("mega.label")`), como hoy.
  - Las cards de planes reciben `id="plan-start|pro|max"`. Al llegar con ese hash, la página baja a la card (offset del header) y la resalta 1.6 s con un anillo morado.
- **Página "Construcción de Data Center".** Nuevo `src/content/subservicios/construccion-data-center.json` con la plantilla de subservicio, contenido **borrador** redactado a partir de la categoría Data Center (el cliente lo refina en Tina). Se suma al catálogo de Data Center y a las opciones del formulario (grupo Data Center).

**Fuera de scope:**

- Páginas propias por plan Cyberguard.
- Traducir al inglés las 91 funciones de la matriz.
- Mostrar los proveedores (queda el switch para encenderlo).
- Sacar Switches, Balanceadores, Energía o Pantallas táctiles del catálogo o borrar sus páginas.
- Redirigir o borrar las 7 páginas de subcategorías de Ciberseguridad (`/soluciones/ciberseguridad/perimetral`, etc.).
- Cambiar el contenido de las cards de planes (features, `includes`).
- Campos "Sede" y "Cuéntanos" del formulario (SPEC 125).

---

## Modelo de datos

### `tina/config.ts` → `service.cyberguard`

```ts
// cyberguard.frentes.items[] — campo nuevo
{ name: "highlight", label: "Destacar (borde animado 24/7)", type: "boolean" }

// cyberguard.matriz — objeto nuevo
{
  name: "matriz", label: "Matriz de funciones por plan", type: "object",
  fields: [
    { name: "visible", type: "boolean" },
    { name: "buttonLabel", type: "string" },      // "Ver más"
    { name: "buttonLabel_en", type: "string" },
    { name: "closeLabel", type: "string" },       // "Ver menos"
    { name: "closeLabel_en", type: "string" },
    { name: "title", type: "string" },            // "Todo lo que incluye cada plan"
    { name: "title_en", type: "string" },
    { name: "showVendors", type: "boolean" },     // default false
    {
      name: "capas", type: "object", list: true,
      fields: [
        { name: "name", type: "string" }, { name: "name_en", type: "string" },
        { name: "vendor", type: "string" },
        {
          name: "rows", type: "object", list: true,
          fields: [
            { name: "feature", type: "string" }, { name: "feature_en", type: "string" },
            { name: "start", type: "string" },   // "si" | "no" | texto libre
            { name: "pro", type: "string" },
            { name: "max", type: "string" },
          ],
        },
      ],
    },
  ],
}
```

```jsonc
// src/content/services/ciberseguridad.json → cyberguard.matriz (extracto)
{
  "visible": true,
  "buttonLabel": "Ver más", "buttonLabel_en": "See more",
  "closeLabel": "Ver menos", "closeLabel_en": "See less",
  "title": "Todo lo que incluye cada plan",
  "showVendors": false,
  "capas": [
    { "name": "Seguridad perimetral virtual", "vendor": "Fortigate",
      "rows": [
        { "feature": "Firewall", "start": "si", "pro": "si", "max": "si" },
        { "feature": "Políticas DDoS", "start": "no", "pro": "si", "max": "si" }
      ] },
    { "name": "Servicio al cliente", "vendor": "Fiberlux",
      "rows": [ { "feature": "Soporte técnico requerimientos", "start": "8 x 5", "pro": "12 x 5", "max": "24 x 7" } ] }
  ]
}
```

Reglas de la carga desde el Excel:

- `✓` → `"si"`, `X` → `"no"`, otros valores se copian tal cual ("Hasta 2 TB" normalizado en mayúsculas).
- Se corrigen las erratas evidentes del Excel: "Adminsitración de Vulneravilidades" → "Administración de vulnerabilidades", "ramsonware" → "ransomware", "dipositivo" → "dispositivo", "Politicas" → "Políticas".
- Filas 76–80 (subtipos de backup, sin valor): se cargan como `"si"` en los 3 planes, porque el Excel incluye Backup en todos los planes ("Hasta 2 TB").
- Los 3 proveedores de Endpoint (EPP, EDR, XDR) quedan como `"WithSecure"` en la capa.

### `tina/config.ts` → `global.nav.links[].children[]` (categorías)

```ts
{ name: "megaLabel", label: "Etiqueta de la columna del menú", type: "string" },
{ name: "megaLabel_en", label: "Etiqueta de la columna del menú (EN)", type: "string" },
```

### Formularios

```jsonc
// dynamic-forms/servicios.json y contacto.json → fields[servicio].options (grupo Ciberseguridad)
{ "value": "cyberguard-start", "label": "Cyberguard Start", "group": "Ciberseguridad", "group_en": "Cybersecurity" },
{ "value": "cyberguard-pro",   "label": "Cyberguard Pro",   "group": "Ciberseguridad", "group_en": "Cybersecurity" },
{ "value": "cyberguard-max",   "label": "Cyberguard Max",   "group": "Ciberseguridad", "group_en": "Cybersecurity" }
```

- Preselección del plan: el CTA de cada card dispara `fbx:prefill` con `{ servicio: "cyberguard-pro" }` y `ServiceFormCard` lo aplica. Si el evento no llega, el formulario funciona igual sin preselección.

---

## Plan de implementación

Rama: `spec-124-cyberguard-matriz-portafolio` contra `staging`.

1. **Schema.** Agregar `frentes.items[].highlight`, `cyberguard.matriz` y `megaLabel` en `tina/config.ts`. Regenerar tipos. Verificación: `npm run build` verde con el contenido actual (campos vacíos).
2. **Carga del Excel.** Un script de una sola vez (fuera del repo) genera `cyberguard.matriz` desde el `.xlsx` con las reglas de arriba y lo pega en `ciberseguridad.json`. Verificación: 6 capas, 91 filas, cero celdas vacías.
3. **Componente de la matriz.** `src/components/servicios/CyberMatrix.tsx`, montado en `CiberIntroReact.tsx` bajo las cards de planes, con botón "Ver más" / "Ver menos" y acordeón por capa. Verificación: a 1512 y 360px abre, muestra los 3 planes y no tiene scroll horizontal.
4. **Capa 24/7.** `highlight: true` en "Monitoreo SOC" + clase CSS del borde que recorre la card, en `src/styles/fx.css`. Verificación: la card gira su borde cada 6 s; con reduced motion queda fija.
5. **Formularios.** Cambiar las opciones del grupo Ciberseguridad en los 2 JSON. Agregar `id` a las cards de planes y el `fbx:prefill` en los CTAs. Verificación: "Cotizar Pro" baja al formulario con "Cyberguard Pro" seleccionado; un envío en local llega con `servicio=cyberguard-pro`.
6. **Menú.** Editar `global.nav` (hijos de Ciberseguridad, Data Center, Infraestructura y Comunicaciones) y leer `megaLabel` en `HeaderV3React.tsx` (mega menú y drawer). Verificación: cada categoría muestra exactamente los ítems del prototipo (PDF pág. 10); Ciberseguridad muestra "PLANES CYBERGUARD".
7. **Hash a plan.** Al cargar `/soluciones/ciberseguridad#plan-pro`, bajar a la card y resaltarla. Verificación: desde el menú de otra página se llega a la card Pro resaltada.
8. **Construcción de Data Center.** Crear el JSON de subservicio, sumarlo al catálogo de Data Center y a las opciones del form, y agregar el wrapper `/en` si el patrón lo requiere. Verificación: `/soluciones/data-center/construccion-data-center` y `/en/...` renderizan.
9. **Registro.** obs 73, 75, 78, 86 → `Hecho` en `specs/observaciones-cliente.md`. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] En `/soluciones/ciberseguridad`, debajo de los planes hay un botón "Ver más" que abre la matriz de funciones.
- [ ] La matriz tiene 6 capas desplegables y 91 funciones, con columnas Start / Pro / Max.
- [ ] Los valores coinciden con el Excel (muestreo: Políticas DDoS = no/si/si; Soporte técnico requerimientos = 8 x 5 / 12 x 5 / 24 x 7; Sandbox = no/no/si).
- [ ] A 360px la matriz se lee sin scroll horizontal.
- [ ] Los proveedores no se ven con `showVendors = false` y aparecen junto al nombre de la capa con `true`.
- [ ] La card "Monitoreo SOC" tiene un borde animado sutil; ninguna otra card de frentes lo tiene.
- [ ] Con `prefers-reduced-motion` el borde de la card destacada no se mueve.
- [ ] El "Servicio de interés" de los formularios de soluciones y de contacto lista Cyberguard Start, Pro y Max dentro de Ciberseguridad, y ninguna de las 7 subcategorías.
- [ ] "Cotizar Max" deja "Cyberguard Max" seleccionado en el formulario.
- [ ] El mega menú desktop y el drawer mobile muestran: Ciberseguridad = 3 planes; Data Center = 7 ítems (incluye Construcción de Data Center); Infraestructura = WiFi Gestionado, Servidores, Video Vigilancia; Comunicaciones = Comunicaciones Unificadas (UCaaS), Cloud PBX, Colaboración IA, Contact Center Multicanal; Conectividad sin cambios.
- [ ] La columna de Ciberseguridad del mega menú se titula "PLANES CYBERGUARD"; las demás, "SOLUCIONES".
- [ ] Clic en "Cyberguard Pro" del menú lleva a la card Pro y la resalta.
- [ ] `/soluciones/data-center/construccion-data-center` existe en ES y EN.
- [ ] Las páginas de Switches, Balanceadores, Energía y Pantallas táctiles siguen respondiendo 200.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Sí:** matriz comparativa única con 3 columnas, agrupada por capa. Lo pidió el autor por indicación del cliente.
- **No:** una lista separada por plan. Repetiría 91 filas tres veces y no deja comparar.
- **Sí:** la matriz se despliega dentro de `#planes` y no en un modal. Son 91 filas: un modal largo en mobile es incómodo y no se comparte por URL.
- **Sí:** celdas como string (`si` / `no` / texto). Un solo tipo cubre ✓, X y valores como "8 x 5" sin campos extra en Tina.
- **Sí:** proveedores guardados pero ocultos por defecto. El autor no lo definió; se deja listo para encenderlo desde el CMS.
- **Sí:** el efecto 24/7 va en la card "Monitoreo SOC" de los 6 frentes. Es la única capa cuyo texto describe vigilancia continua. Se controla con `highlight` para moverlo sin código.
- **Sí:** borde que recorre la card, no parpadeo. Es la primera opción del cliente, y un parpadeo rosa compite con los CTAs.
- **Sí:** los planes reemplazan a las subcategorías en **ambos** formularios. El cliente dice "el formulario" y los dos listan hoy las subcategorías; dejarlos distintos confundiría los leads.
- **Sí:** los planes del menú llevan a la card de cada plan en la página de Cyberguard (`#plan-*`). No hay páginas por plan.
- **Sí:** "Construcción de Data Center" con página propia y contenido borrador. El autor eligió crear la página en vez de enlazar a la categoría.
- **Sí:** Switches, Balanceadores, Energía y Pantallas táctiles salen solo del menú. El autor confirmó la primera opción; las páginas siguen indexadas y en el catálogo.
- **Sí:** `megaLabel` editable por categoría en vez de un caso especial para Ciberseguridad en el código.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Interpretar la "capa de monitoreo 24/7" como la card equivocada (podría ser la escala "Detectar y responder") | `highlight` es un booleano por card: se mueve desde Tina sin código. Se confirma con el cliente en el QA. |
| Leads con `servicio=perimetral` (u otras subcategorías) que llegaban antes rompen reportes en `panel-leads.php` | El valor es texto libre en el backend: los leads viejos se siguen viendo. Revisar que el panel no filtre por lista fija. |
| Las páginas de subcategorías de Ciberseguridad hacen `prefill` de un valor que ya no está en las opciones | `SolucionV2React` pasa `prefill={{ servicio: filename }}`; si no coincide con ninguna opción, el select queda vacío. Verificar que no dé error. |
| Las filas de backup sin valor no eran "incluidas en todos" | Están en el JSON: el cliente las corrige en Tina. Se menciona en el resumen para el cliente. |
| La matriz de 91 filas pesa en el island | Es texto. El acordeón no pinta el contenido de las capas cerradas. |

---

## Qué **no** entra en este spec

- Páginas por plan Cyberguard.
- Traducción EN de las funciones de la matriz.
- Borrar o redirigir las subcategorías de Ciberseguridad.
- Campos "Sede" y "Cuéntanos" (SPEC 125).
