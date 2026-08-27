import { defineConfig } from "tinacms";

/* SPEC 63: lista compartida de tags del blog. La usan el campo `tags` del post
   y el campo `blogTags` de cada página de solución/subservicio. Agregar un tag
   nuevo = agregarlo aquí (valores legibles, se muestran tal cual). */
const BLOG_TAG_OPTIONS = [
  "Conectividad",
  "Ciberseguridad",
  "Cloud",
  "Data Center",
  "Comunicaciones",
  "Continuidad de negocio",
  "Infraestructura",
];

/* SPEC 105 (ampliado en el 107): las diecisiete plantillas de ilustración de una card de "Beneficios",
   en `src/components/servicios/beneficios/`. Con 35 sub-servicios y 3 a 4 cards
   cada uno son más de cien gráficos: dibujarlos como imágenes significaría cien
   archivos que alguien tendría que exportar de nuevo cada vez que cambiara un
   dato, así que el editor elige una plantilla y la alimenta con `datos`. */
const PLANTILLA_BENEFICIO_OPTIONS = [
  { value: "velocidad", label: "Velocidad — tarjetas apiladas con anillo" },
  { value: "simetria", label: "Simetría — curva de área con columnas" },
  { value: "gauge", label: "Prioridad — semicírculo de rayitas" },
  { value: "sedes", label: "Sedes — nodos que confluyen en un hub" },
  { value: "dwdm", label: "DWDM — dos racks unidos por hilos" },
  { value: "uptime", label: "Uptime — anillo grande con cifra" },
  { value: "prioridad", label: "Tráfico — lista priorizada con foco que recorre" },
  { value: "conmutacion", label: "Conmutación — ruta principal y respaldo" },
  { value: "mfa", label: "MFA — móvil con OTP y factores" },
  { value: "escudo", label: "Escudo — perímetro que se traza y valida" },
  { value: "reloj", label: "Reloj — esfera con aguja que barre" },
  { value: "checklist", label: "Checklist — filas que se van marcando" },
  { value: "escalera", label: "Escalera — barras que crecen por escalones" },
  { value: "consola", label: "Panel en vivo — filas de estado que laten" },
  { value: "tunel", label: "Túnel cifrado — carriles con paquetes y candado" },
  { value: "zerotrust", label: "Zero Trust — anillos concéntricos que respiran" },
  { value: "bitacora", label: "Bitácora — eventos que aparecen uno a uno" },
];

/* SPEC 105: datos de la ilustración de una card de beneficio.

   Es UN objeto con todos los campos opcionales, no un objeto por plantilla: así
   la query de GraphQL y el componente se mantienen planos. Cada descripción
   dice a qué plantilla pertenece su campo, que es como se orienta el editor
   dentro del panel. Ninguno es obligatorio: cada ilustración trae valores de
   reserva codificados.

   Las etiquetas llevan su `_en` porque se dibujan dentro del SVG y en /en
   quedarían en español (SPEC 80). Vacío = se usa la española. */
const datosIlustracionField = () => ({
  name: "datos",
  label: "Datos de la ilustración",
  type: "object" as const,
  description:
    "Solo aplican los campos de la plantilla elegida arriba. Vacío = la ilustración usa sus valores por defecto.",
  fields: [
    {
      name: "etiqueta",
      label: "Etiqueta",
      type: "string" as const,
      description:
        "Plantillas Velocidad, Panel en vivo (cabecera), Escudo (pie) y Túnel cifrado (pie). Ej: Velocidad sin caídas",
    },
    { name: "etiqueta_en", label: "Etiqueta (EN)", type: "string" as const },
    {
      name: "valor",
      label: "Cifra",
      type: "string" as const,
      description: "Plantillas Uptime y Panel en vivo (píldora). Ej: 99,95",
    },
    {
      name: "unidad",
      label: "Unidad de la cifra",
      type: "string" as const,
      description: "Plantilla Uptime. Ej: % UPTIME",
    },
    { name: "unidad_en", label: "Unidad de la cifra (EN)", type: "string" as const },
    {
      name: "porcentaje",
      label: "Porcentaje (0–100)",
      type: "number" as const,
      description:
        "Plantillas Velocidad, Prioridad (semicírculo) y Uptime: cuánto se llena. Simetría: en qué punto del gráfico cae la columna destacada. Escalera: cuántos escalones están ocupados.",
    },
    {
      name: "hilos",
      label: "Número de hilos (3–8)",
      type: "number" as const,
      description:
        "Plantilla DWDM: cuántas fibras unen los dos racks. Túnel cifrado: cuántos carriles hay (3–5).",
    },
    {
      name: "barras",
      label: "Número de columnas (5–9)",
      type: "number" as const,
      description:
        "Plantilla Simetría. Cuántas columnas tiene el gráfico. La destacada la elige 'Porcentaje'.",
    },
    {
      name: "tarjetas",
      label: "Tarjetas apiladas",
      type: "object" as const,
      list: true,
      description:
        "Plantilla Velocidad. Máximo 3. Se van turnando delante, así que todas se ven.",
      ui: {
        max: 3,
        itemProps: (item: any) => ({ label: item?.etiqueta || "Tarjeta" }),
      },
      fields: [
        { name: "etiqueta", label: "Texto", type: "string" as const },
        { name: "etiqueta_en", label: "Texto (EN)", type: "string" as const },
        { name: "porcentaje", label: "Relleno del anillo (0–100)", type: "number" as const },
      ],
    },
    {
      name: "filas",
      label: "Filas de tráfico",
      type: "object" as const,
      list: true,
      description:
        "Plantillas Tráfico y Bitácora. Máximo 4. En Bitácora, 'Servicio' es el evento y 'Prioridad' la etiqueta de la izquierda.",
      ui: {
        max: 4,
        itemProps: (item: any) => ({ label: item?.label || "Fila" }),
      },
      fields: [
        { name: "label", label: "Servicio", type: "string" as const },
        { name: "label_en", label: "Servicio (EN)", type: "string" as const },
        {
          name: "nivel",
          label: "Prioridad",
          type: "string" as const,
          options: [
            { value: "CRÍTICO", label: "Crítico" },
            { value: "ALTA", label: "Alta" },
            { value: "MEDIA", label: "Media" },
            { value: "BAJA", label: "Baja" },
          ],
        },
        { name: "porcentaje", label: "Ancho de la barra (0–100)", type: "number" as const },
      ],
    },
    {
      name: "rutas",
      label: "Rutas de conmutación",
      type: "object" as const,
      list: true,
      description: "Plantilla Conmutación. Máximo 4. Ej: FIBRA, LTE, SATELITAL.",
      ui: {
        max: 4,
        itemProps: (item: any) => ({ label: item?.label || "Ruta" }),
      },
      fields: [
        { name: "label", label: "Nombre", type: "string" as const },
        { name: "label_en", label: "Nombre (EN)", type: "string" as const },
        {
          name: "activa",
          label: "Es la ruta activa",
          type: "boolean" as const,
          description: "La que queda iluminada al final del ciclo.",
        },
      ],
    },
    {
      name: "nodos",
      label: "Nodos de la LAN",
      type: "object" as const,
      list: true,
      description:
        "Plantillas Sedes, Panel en vivo y Zero Trust. Máximo 4 (Panel usa 3; Zero Trust los nombra en su pie).",
      ui: {
        max: 4,
        itemProps: (item: any) => ({ label: item?.label || "Nodo" }),
      },
      fields: [
        { name: "label", label: "Etiqueta", type: "string" as const },
        { name: "label_en", label: "Etiqueta (EN)", type: "string" as const },
      ],
    },
    {
      name: "chips",
      label: "Factores / ítems",
      type: "object" as const,
      list: true,
      description:
        "Plantillas MFA y Checklist. Máximo 4. Ej: Contraseña, Token / App, Biometría.",
      ui: {
        max: 4,
        itemProps: (item: any) => ({ label: item?.label || "Factor" }),
      },
      fields: [
        { name: "label", label: "Etiqueta", type: "string" as const },
        { name: "label_en", label: "Etiqueta (EN)", type: "string" as const },
      ],
    },
  ],
});

export default defineConfig({
  branch: process.env.TINA_BRANCH || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      /* ══════════════════════════════════════
         HOME PAGE
         ══════════════════════════════════════ */
      {
        name: "home",
        label: "Home",
        path: "src/content/home",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          {
            type: "object",
            name: "hero",
            label: "Hero — Inicio",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Título principal",
                required: true,
                description:
                  "Mantén ≤ 60 caracteres para evitar saltos largos en mobile.",
              },
              { type: "string", name: "title_en", label: "Título principal (EN)" },
              {
                type: "string",
                name: "subtitle",
                label: "Subtítulo",
                ui: { component: "textarea" },
                description: "Frase de apoyo bajo el título. ≤ 140 caracteres.",
              },
              { type: "string", name: "subtitle_en", label: "Subtítulo (EN)", ui: { component: "textarea" } },
              {
                type: "string",
                name: "heroBackground",
                label: "Fondo del hero",
                options: [
                  { value: "3d", label: "Escena 3D (Spline)" },
                  { value: "video", label: "Video de fondo" },
                  { value: "imagen", label: "Imagen de fondo" },
                  { value: "waveform", label: "Waveform (shader animado)" },
                  { value: "nodefield", label: "Node field (partículas plexus)" },
                  { value: "morph", label: "Morph (globo de partículas → soluciones)" },
                  { value: "cinematic", label: "Cinematic (god-rays + tokens flotantes)" },
                ],
                description:
                  "Elige qué se muestra detrás del texto del hero. Default: Escena 3D.",
              },
              {
                type: "string",
                name: "splineSceneUrl",
                label: "URL de la escena de Spline (modo 3D)",
                description:
                  "Pega aquí la URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode",
              },
              {
                type: "image",
                name: "splinePosterUrl",
                label: "Imagen estática mobile (modo 3D)",
                description:
                  "Imagen a sangre que se muestra en mobile en lugar del 3D (el 3D solo carga en desktop).",
              },
              {
                type: "image",
                name: "heroBgVideo",
                label: "Video de fondo (modo Video)",
                description:
                  "Video a sangre (mp4) detrás del texto. Se reproduce en loop, silenciado, en desktop y mobile.",
              },
              {
                type: "image",
                name: "heroBgImage",
                label: "Imagen de fondo (modo Imagen)",
                description: "Imagen a sangre detrás del texto.",
              },
              {
                type: "number",
                name: "heroBgOpacity",
                label: "Opacidad del fondo (video/imagen) — 0 a 100",
                description:
                  "Opacidad del video/imagen de fondo. Baja el valor para que se funda con el negro y el texto se lea mejor. Default 60.",
              },
              {
                type: "object",
                name: "buttons",
                label: "Botones (CTAs)",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.text || "Botón sin texto",
                  }),
                },
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Texto del botón",
                    required: true,
                  },
                  { type: "string", name: "text_en", label: "Texto del botón (EN)" },
                  {
                    type: "string",
                    name: "url",
                    label: "Enlace (URL o ancla #seccion)",
                  },
                  {
                    type: "string",
                    name: "variant",
                    label: "Estilo del botón",
                    options: [
                      { value: "primary", label: "Primario (magenta sólido)" },
                      { value: "secondary", label: "Secundario (outline)" },
                    ],
                  },
                ],
              },
              // ── Modo Morph (SPEC 96): globo de partículas → soluciones ──
              {
                type: "object",
                name: "morph",
                label: "Hero — modo Morph (globo → soluciones)",
                description:
                  "Solo aplica si el 'Fondo del hero' es 'Morph'. Texto del trigger y los 4 nodos-solución que aparecen al pulsarlo.",
                fields: [
                  { type: "string", name: "triggerLabel", label: "Texto del trigger (ES)" },
                  { type: "string", name: "triggerLabel_en", label: "Texto del trigger (EN)" },
                  {
                    type: "object",
                    name: "solutionNodes",
                    label: "Nodos-solución (hasta 4)",
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({ label: item?.label || "Nodo" }),
                    },
                    fields: [
                      { type: "string", name: "label", label: "Label (ES)" },
                      { type: "string", name: "label_en", label: "Label (EN)" },
                      {
                        type: "string",
                        name: "url",
                        label: "URL destino (página de solución)",
                      },
                      {
                        type: "string",
                        name: "icon",
                        label: "Ícono",
                        options: [
                          { value: "datacenter", label: "Data Center / Cloud" },
                          { value: "conectividad", label: "Conectividad" },
                          { value: "ciberseguridad", label: "Ciberseguridad" },
                          { value: "gestionados", label: "Servicios Gestionados" },
                        ],
                      },
                    ],
                  },
                ],
              },
              // ── Modo Cinematic (SPEC 97): god-rays + tokens flotantes ──
              {
                type: "object",
                name: "cinematic",
                label: "Hero — modo Cinematic (god-rays + tokens)",
                description:
                  "Solo aplica si el 'Fondo del hero' es 'Cinematic'. Tokens de conectividad que flotan en el fondo (ej. 1 Gbps, 99.9%, 12 ms). Si lo dejas vacío se usa un set por defecto.",
                fields: [
                  {
                    type: "object",
                    name: "floatingTokens",
                    label: "Tokens flotantes (fondo)",
                    list: true,
                    ui: {
                      itemProps: (item: any) => ({
                        label: item?.text || "Token",
                      }),
                    },
                    fields: [
                      {
                        type: "string",
                        name: "text",
                        label: "Texto del token (ej. Gbps, 99.9%, 12 ms)",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          // ── Servicios ──
          {
            name: "services",
            label: "Servicios",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Servicios",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Servicio" }),
                },
                fields: [
                  { name: "number", label: "Número", type: "string" },
                  { name: "title", label: "Título", type: "string" },
                  { name: "title_en", label: "Título (EN)", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "description_en", label: "Descripción (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "icon",
                    label: "Ícono (SVG o imagen)",
                    type: "image",
                  },
                  // SPEC 103 — panel de soluciones (chips + card en stack).
                  {
                    name: "tabIcon",
                    label: "Ícono de categoría",
                    type: "string",
                    description:
                      "Ícono del chip de categoría y de la card visual en el bloque de soluciones.",
                    options: [
                      { value: "rayo", label: "Rayo / Conectividad" },
                      { value: "escudo", label: "Escudo / Seguridad" },
                      { value: "nube", label: "Nube / Cloud" },
                      { value: "engranaje", label: "Engranajes / Servicios gestionados" },
                      { value: "personas", label: "Personas / Equipo gestionado" },
                      { value: "red", label: "Red / Nodos" },
                      { value: "servidor", label: "Servidor / Data Center" },
                      { value: "globo", label: "Globo / Cobertura" },
                      { value: "soporte", label: "Soporte / NOC" },
                      { value: "datos", label: "Datos / Base de datos" },
                      { value: "wifi", label: "Wi-Fi / Inalámbrico" },
                      { value: "telefonia", label: "Telefonía / Comunicaciones" },
                    ],
                  },
                  {
                    name: "tabLabel",
                    label: "Nombre corto (chip)",
                    type: "string",
                    description:
                      "Nombre corto para el chip de categoría. Si se deja vacío se usa el título.",
                  },
                  { name: "tabLabel_en", label: "Nombre corto (chip) (EN)", type: "string" },
                  {
                    name: "bullets",
                    label: "Subservicios",
                    type: "object",
                    list: true,
                    ui: {
                      itemProps: (b) => ({ label: b?.label || "Subservicio" }),
                    },
                    fields: [
                      { name: "label", label: "Nombre", type: "string" },
                      { name: "label_en", label: "Nombre (EN)", type: "string" },
                      { name: "url", label: "URL destino", type: "string" },
                    ],
                  },
                  { name: "url", label: "URL del servicio", type: "string" },
                ],
              },
            ],
          },

          // ── Caso de éxito / Testimonio ──
          {
            name: "testimonials",
            label: "Testimonios",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar sección de testimonios",
                type: "boolean",
                description:
                  "Desactívalo para ocultar la sección de testimonios en todo el sitio (ej. mientras no haya suficientes quotes).",
              },
              {
                name: "sectionTitle",
                label: "Título de sección",
                type: "string",
              },
              { name: "sectionTitle_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "ctaLabel",
                label: "Botón — texto",
                type: "string",
                description: "Botón bajo el slider (ej. \"Ver casos de éxito\"). Vacío = sin botón.",
              },
              { name: "ctaLabel_en", label: "Botón — texto (EN)", type: "string" },
              {
                name: "ctaUrl",
                label: "Botón — URL",
                type: "string",
                description: "Ruta interna (ej. /casos-de-exito) o URL completa.",
              },
              {
                name: "items",
                label: "Testimonios",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.name || "Testimonio" }),
                },
                fields: [
                  {
                    name: "quote",
                    label: "Cita principal",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "quote_en", label: "Cita principal (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "description",
                    label: "Descripción extendida",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "description_en", label: "Descripción extendida (EN)", type: "string", ui: { component: "textarea" } },
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "role", label: "Cargo", type: "string" },
                  { name: "role_en", label: "Cargo (EN)", type: "string" },
                  { name: "company", label: "Empresa", type: "string" },
                  { name: "avatar", label: "Foto", type: "image" },
                  { name: "logo", label: "Logo empresa", type: "image" },
                ],
              },
            ],
          },

          // ── Stats ──
          {
            name: "stats",
            label: "Por qué Fiberlux",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "items",
                label: "Estadísticas",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
                fields: [
                  { name: "number", label: "Número", type: "string" },
                  { name: "label", label: "Etiqueta superior", type: "string" },
                  { name: "label_en", label: "Etiqueta superior (EN)", type: "string" },
                  { name: "description", label: "Descripción", type: "string" },
                  { name: "description_en", label: "Descripción (EN)", type: "string" },
                ],
              },

              // ── Franja de clientes (home): logos + copy bajo las cifras ──
              {
                name: "clientsHighlight",
                label: "Franja de clientes — destacado",
                type: "string",
                description: "Texto en magenta de la franja de logos (ej. \"+5,500 empresas\").",
              },
              { name: "clientsHighlight_en", label: "Franja de clientes — destacado (EN)", type: "string" },
              {
                name: "clientsNote",
                label: "Franja de clientes — texto",
                type: "string",
                description: "Segunda línea de la franja de logos (ej. \"confían en la red de Fiberlux\").",
              },
              { name: "clientsNote_en", label: "Franja de clientes — texto (EN)", type: "string" },
              {
                name: "clientLogos",
                label: "Franja de clientes — logos",
                type: "object",
                list: true,
                description: "Logos de empresas clientes que se muestran junto a las cifras. Mínimo 3.",
                ui: { itemProps: (item) => ({ label: item?.name || "Logo" }) },
                fields: [
                  { name: "name", label: "Empresa", type: "string" },
                  { name: "image", label: "Logo", type: "image" },
                ],
              },
            ],
          },
          {
            name: "blogPreview",
            label: "Sección Blog (Insights)",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              { name: "buttonText", label: "Texto del botón", type: "string" },
              { name: "buttonText_en", label: "Texto del botón (EN)", type: "string" },
              { name: "buttonUrl", label: "URL del botón", type: "string" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         SERVICE PAGES
         ══════════════════════════════════════ */
      {
        name: "service",
        label: "Servicios (soluciones)",
        path: "src/content/services",
        format: "json",
        ui: {
          router: ({ document }) => `/servicios/${document._sys.filename}`,
          filename: {
            slugify: (values) =>
              (values?.slug || values?.title || "")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
          },
        },
        fields: [
          {
            name: "title",
            label: "Nombre de la solución",
            type: "string",
            required: true,
            isTitle: true,
          },
          { name: "title_en", label: "Nombre de la solución (EN)", type: "string" },
          { name: "slug", label: "URL slug", type: "string", required: true },

          // ── SPEC 63: qué tags del blog aparecen en las novedades de esta página ──
          {
            name: "blogTags",
            label: "Tags del blog a mostrar",
            description:
              "Las entradas del blog con alguno de estos tags aparecen en la sección de novedades de esta página. Vacío = 6 más recientes.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS,
          },

          // ── Hero (form ¿Conversamos? = DynamicForm servicios) ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              {
                name: "heading",
                label: "Título (H1)",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "heading_en", label: "Título (H1) (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "intro",
                label: "Párrafo intro",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "intro_en", label: "Párrafo intro (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "ctaLabel",
                label: "Texto botón (ancla al catálogo)",
                type: "string",
              },
              { name: "ctaLabel_en", label: "Texto botón (EN)", type: "string" },
              {
                name: "formTitle",
                label: "Título del form del hero",
                type: "string",
              },
              { name: "formTitle_en", label: "Título del form del hero (EN)", type: "string" },
              {
                name: "heroMode",
                label: "Mostrar en el hero",
                type: "string",
                options: [
                  { value: "form", label: "Formulario" },
                  { value: "image", label: "Imagen" },
                ],
                description:
                  "Formulario '¿Conversamos?' (por defecto) o una imagen de categoría a sangre.",
              },
              {
                name: "heroImage",
                label: "Imagen del hero (modo imagen)",
                type: "image",
              },
            ],
          },

          // ── "El valor de la resiliencia" (bento 3 cards) ──
          {
            name: "valor",
            label: "El valor de la resiliencia",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "subtitle",
                label: "Subtítulo de sección",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "subtitle_en", label: "Subtítulo de sección (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "desafioClickable",
                label: "El desafío — activar interacción por click (por defecto: animación en loop)",
                description:
                  "Off (por defecto): la animación del card 'El desafío' corre sola en loop. On: reactiva la interacción por click con tooltip (SPEC 93).",
                type: "boolean",
              },
              {
                name: "cards",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.heading || "Card" }),
                  min: 3,
                  max: 3,
                },
                fields: [
                  { name: "heading", label: "Título", type: "string" },
                  { name: "heading_en", label: "Título (EN)", type: "string" },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "text_en", label: "Texto (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "tags",
                    label: "Etiquetas (chips)",
                    description:
                      "Tecnologías/servicios mostrados como chips. Se usan en la card 'Nuestra solución'.",
                    type: "string",
                    list: true,
                  },
                  { name: "image", label: "Imagen/gráfico", type: "image" },
                ],
              },
            ],
          },

          // ── "Catálogo de soluciones" (hover-reveal; items placeholder → nivel-2) ──
          {
            name: "catalogo",
            label: "Catálogo de soluciones",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Items",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Item" }) },
                fields: [
                  {
                    name: "icon",
                    label: "Ícono",
                    type: "string",
                    options: [
                      { value: "internet", label: "Internet / Fibra" },
                      { value: "disponibilidad", label: "Alta disponibilidad" },
                      { value: "satelital", label: "Satelital" },
                      { value: "radioenlace", label: "Radioenlace" },
                      { value: "transmision", label: "Transmisión de datos" },
                      { value: "fibra-oscura", label: "Fibra oscura" },
                      { value: "sd-wan", label: "SD-WAN" },
                      { value: "balanceo", label: "Balanceo de enlaces" },
                      { value: "firewall", label: "Firewall / Perimetral" },
                      { value: "vpn", label: "VPN" },
                      { value: "edr", label: "EDR / XDR / MDR" },
                      { value: "correo", label: "Seguridad de correo" },
                      { value: "mfa", label: "MFA / Identidad" },
                      { value: "ztna", label: "ZTNA" },
                      { value: "waf", label: "WAF" },
                      { value: "ddos", label: "Anti-DDoS" },
                      { value: "soc", label: "SOC 24/7" },
                      { value: "pentesting", label: "Pentesting" },
                      { value: "cloud", label: "Cloud / Nube" },
                      { value: "backup", label: "Backup / BaaS" },
                      { value: "storage", label: "Storage / Cómputo" },
                      { value: "mesa-ayuda", label: "Mesa de ayuda" },
                      { value: "wifi", label: "WiFi gestionado" },
                      { value: "videovigilancia", label: "Videovigilancia" },
                      { value: "comunicaciones", label: "Comunicaciones unificadas" },
                      { value: "colaboracion", label: "Colaboración empresarial" },
                      { value: "redes-lan", label: "Redes LAN" },
                      { value: "endpoints", label: "Endpoints" },
                      { value: "segmentacion", label: "Segmentación de red" },
                      { value: "escritorio-virtual", label: "Escritorio virtual" },
                      { value: "autocontenido", label: "Data Center autocontenido" },
                      { value: "nas", label: "NAS / Almacenamiento en red" },
                      { value: "switch", label: "Switches" },
                      { value: "servidor", label: "Servidores" },
                      { value: "energia", label: "Energía / UPS" },
                      { value: "pbx", label: "Cloud PBX" },
                      { value: "pantalla", label: "Pantallas táctiles" },
                      { value: "contact-center", label: "Contact Center" },
                      { value: "generico", label: "Genérico" },
                    ],
                  },
                  { name: "title", label: "Título", type: "string" },
                  { name: "title_en", label: "Título (EN)", type: "string" },
                  {
                    name: "description",
                    label: "Descripción breve",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "description_en",
                    label: "Descripción (EN)",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "url",
                    label: "URL (placeholder → nivel-2)",
                    type: "string",
                  },
                ],
              },
            ],
          },

          // ── Partners tecnológicos (por categoría; marquee propio de la solución) ──
          {
            name: "partners",
            label: "Partners tecnológicos",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "eyebrow_en", label: "Eyebrow (EN)", type: "string" },
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "logos",
                label: "Logos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.alt || "Logo" }) },
                fields: [
                  { name: "image", label: "Logo", type: "image" },
                  { name: "alt", label: "Alt / Nombre", type: "string" },
                  { name: "url", label: "Enlace (opcional)", type: "string" },
                ],
              },
            ],
          },

          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "Título '¿Por qué Fiberlux?'",
            type: "string",
          },
          { name: "whyUsTitle_en", label: "Título '¿Por qué Fiberlux?' (EN)", type: "string" },

          // ── "Preguntas frecuentes" (acordeón, respuesta rich-text) ──
          {
            name: "faq",
            label: "Preguntas frecuentes",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar sección",
                type: "boolean",
                description:
                  "Desactívalo para ocultar el bloque de preguntas frecuentes en esta página.",
              },
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Preguntas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question || "Pregunta" }),
                },
                fields: [
                  { name: "question", label: "Pregunta", type: "string" },
                  { name: "question_en", label: "Pregunta (EN)", type: "string" },
                  { name: "answer", label: "Respuesta", type: "rich-text" },
                  { name: "answer_en", label: "Respuesta (EN)", type: "rich-text" },
                ],
              },
            ],
          },

          // ── SEO / meta (por servicio; cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         SUB-SERVICIOS (nivel 2)
         ══════════════════════════════════════ */
      {
        name: "subservicio",
        label: "Sub-servicios (nivel 2)",
        path: "src/content/subservicios",
        format: "json",
        ui: {
          router: ({ document }) =>
            `/servicios/${(document as any).solucionSlug}/${document._sys.filename}`,
          filename: {
            slugify: (values) =>
              (values?.slug || values?.title || "")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
          },
        },
        fields: [
          {
            name: "title",
            label: "Nombre del sub-servicio",
            type: "string",
            required: true,
            isTitle: true,
          },
          { name: "title_en", label: "Nombre del sub-servicio (EN)", type: "string" },
          { name: "slug", label: "URL slug", type: "string", required: true },
          {
            name: "solucionSlug",
            label: "Solución padre (slug)",
            type: "string",
            required: true,
            options: [
              { value: "conectividad", label: "Conectividad" },
              { value: "ciberseguridad", label: "Ciberseguridad" },
              { value: "data-center", label: "Data Center" },
              { value: "infraestructura", label: "Infraestructura" },
              { value: "comunicaciones", label: "Comunicaciones Unificadas" },
            ],
          },
          {
            name: "solucionTitle",
            label: "Solución padre (nombre para breadcrumb)",
            type: "string",
          },
          { name: "solucionTitle_en", label: "Solución padre (EN)", type: "string" },

          // ── SPEC 63: qué tags del blog aparecen en las novedades de esta página ──
          {
            name: "blogTags",
            label: "Tags del blog a mostrar",
            description:
              "Las entradas del blog con alguno de estos tags aparecen en la sección de novedades de esta página. Vacío = 6 más recientes.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS,
          },

          // ── Hero ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              {
                name: "heading",
                label: "Título (H1)",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "heading_en", label: "Título (H1) (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "intro",
                label: "Párrafo intro",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "intro_en", label: "Párrafo intro (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "note",
                label: "Caja de nota",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "note_en", label: "Caja de nota (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "ctaLabel",
                label: "Texto botón (ancla al form inferior)",
                type: "string",
              },
              { name: "ctaLabel_en", label: "Texto botón (EN)", type: "string" },
              {
                name: "formTitle",
                label: "Título del form del hero",
                type: "string",
              },
              { name: "formTitle_en", label: "Título del form del hero (EN)", type: "string" },
              {
                name: "heroBackground",
                label: "Fondo del hero",
                type: "string",
                options: [
                  { value: "grafico", label: "Gráfico decorativo (actual)" },
                  { value: "imagen", label: "Imagen propia del subservicio" },
                ],
                // default "grafico"; el seed pone "imagen" en los 34
              },
              {
                name: "heroImage",
                label: "Imagen del hero (modo imagen)",
                type: "image",
              },
            ],
          },

          // ── "Beneficios" (cards ícono + título + texto) ──
          {
            name: "beneficios",
            label: "Beneficios",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Beneficio" }),
                },
                fields: [
                  { name: "title", label: "Título", type: "string" },
                  { name: "title_en", label: "Título (EN)", type: "string" },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "text_en", label: "Texto (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "plantilla",
                    label: "Ilustración",
                    type: "string",
                    options: PLANTILLA_BENEFICIO_OPTIONS,
                    description: "Vacío = card sin ilustración, sólo título y texto.",
                  },
                  datosIlustracionField(),
                  {
                    name: "image",
                    label: "Gráfico ilustrativo",
                    type: "image",
                    description:
                      "Imagen decorativa al pie de la card (opcional). Si la subes, manda sobre la ilustración.",
                  },
                ],
              },
            ],
          },

          // ── "Casos de uso" (statement rich-text con resaltado) ──
          {
            name: "casosDeUso",
            label: "Casos de uso",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "eyebrow_en", label: "Eyebrow (EN)", type: "string" },
              {
                name: "statement",
                label: "Statement",
                type: "rich-text",
                description:
                  "Usa negrita (bold) para resaltar palabras en magenta.",
              },
              {
                name: "statement_en",
                label: "Statement (EN)",
                type: "rich-text",
              },
            ],
          },

          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "Título '¿Por qué Fiberlux?'",
            type: "string",
          },
          { name: "whyUsTitle_en", label: "Título '¿Por qué Fiberlux?' (EN)", type: "string" },

          // ── "Preguntas frecuentes" (propio del sub-servicio) ──
          {
            name: "faq",
            label: "Preguntas frecuentes",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar sección",
                type: "boolean",
                description:
                  "Desactívalo para ocultar el bloque de preguntas frecuentes en esta página.",
              },
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Preguntas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question || "Pregunta" }),
                },
                fields: [
                  { name: "question", label: "Pregunta", type: "string" },
                  { name: "question_en", label: "Pregunta (EN)", type: "string" },
                  { name: "answer", label: "Respuesta", type: "rich-text" },
                  { name: "answer_en", label: "Respuesta (EN)", type: "rich-text" },
                ],
              },
            ],
          },

          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         NOSOTROS
         ══════════════════════════════════════ */
      {
        name: "about",
        label: "Nosotros",
        path: "src/content/about",
        format: "json",
        ui: {
          router: () => "/nosotros",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "subtitle",
                label: "Subtítulo",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "subtitle_en", label: "Subtítulo (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "image",
                label: "Imagen de fondo del hero",
                type: "image",
                description:
                  "Foto a sangre del hero. El sujeto debe quedar a la derecha: el degradado oscurece la izquierda para el texto.",
              },
              {
                name: "ctaLabel",
                label: "Texto del botón",
                type: "string",
                description: "Déjalo vacío para ocultar el botón del hero.",
              },
              { name: "ctaLabel_en", label: "Texto del botón (EN)", type: "string" },
              {
                name: "ctaUrl",
                label: "Enlace del botón",
                type: "string",
                description: "Ruta interna (ej. /contacto) o URL completa.",
              },
            ],
          },

          // ── Misión y Visión ──
          {
            name: "missionVisionTitle",
            label: "Título sección Misión/Visión",
            type: "string",
          },
          {
            name: "missionVisionTitle_en",
            label: "Título sección Misión/Visión (EN)",
            type: "string",
          },
          {
            name: "mission",
            label: "Misión",
            type: "object",
            fields: [
              {
                name: "icon",
                label: "Ícono",
                type: "string",
                options: [
                  "globe",
                  "target",
                  "rocket",
                  "compass",
                  "flag",
                  "lightbulb",
                  "heart",
                  "shield",
                  "star",
                  "zap",
                ],
              },
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "text_en", label: "Texto (EN)", type: "string", ui: { component: "textarea" } },
            ],
          },
          {
            name: "vision",
            label: "Visión",
            type: "object",
            fields: [
              {
                name: "icon",
                label: "Ícono",
                type: "string",
                options: [
                  "sparkles",
                  "eye",
                  "telescope",
                  "mountain",
                  "sun",
                  "trophy",
                  "gem",
                  "crown",
                  "bolt",
                  "chart",
                ],
              },
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "text_en", label: "Texto (EN)", type: "string", ui: { component: "textarea" } },
            ],
          },
          {
            name: "missionImage",
            label: "Imagen sección misión/visión",
            type: "image",
          },

          // ── Valores ──
          {
            name: "values",
            label: "Valores",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "subtitle",
                label: "Subtítulo",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "subtitle_en", label: "Subtítulo (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "items",
                label: "Valores",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Valor" }) },
                fields: [
                  {
                    name: "icon",
                    label: "\u00cdcono",
                    type: "string",
                    options: [
                      { value: "eye", label: "Ojo (transparencia)" },
                      { value: "shield", label: "Escudo (resiliencia)" },
                      { value: "check", label: "Check (confiabilidad)" },
                      { value: "pin", label: "Pin de mapa (impacto local)" },
                      { value: "link", label: "Enlace (conectividad)" },
                      { value: "bolt", label: "Rayo (innovaci\u00f3n)" },
                      { value: "network", label: "Red / nodos" },
                      { value: "clock", label: "Reloj (24/7)" },
                      { value: "users", label: "Personas (equipo)" },
                      { value: "spark", label: "Destello (calidad)" },
                      { value: "star", label: "Estrella (calidad)" },
                    ],
                  },
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "name_en", label: "Nombre (EN)", type: "string" },
                  {
                    name: "description",
                    label: "Descripci\u00f3n",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "description_en",
                    label: "Descripci\u00f3n (EN)",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── Timeline ──
          {
            name: "timeline",
            label: "Timeline",
            type: "object",
            fields: [
              { name: "title", label: "Antítulo (eyebrow)", type: "string" },
              { name: "title_en", label: "Antítulo (eyebrow) (EN)", type: "string" },
              { name: "startYear", label: "Año inicio (etiqueta barra)", type: "string" },
              { name: "endYear", label: "Año fin (etiqueta barra)", type: "string" },
              {
                name: "milestones",
                label: "Hitos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.year || "Hito" }) },
                fields: [
                  { name: "year", label: "Año", type: "string" },
                  {
                    name: "heading",
                    label: "Texto del hito",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "heading_en",
                    label: "Texto del hito (EN)",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── Rubros ──
          {
            name: "rubros",
            label: "Rubros (sección Nosotros)",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              { name: "description", label: "Descripción", type: "string", ui: { component: "textarea" } },
              { name: "description_en", label: "Descripción (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "items",
                label: "Rubros",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Rubro" }) },
                fields: [
                  {
                    name: "icon",
                    label: "Ícono",
                    type: "string",
                    options: [
                      { value: "mineria", label: "Minería" },
                      { value: "restaurantes", label: "Restaurantes" },
                      { value: "educacion", label: "Educación" },
                      { value: "hoteleria", label: "Hotelería" },
                      { value: "salud", label: "Salud / Clínicas" },
                      { value: "retail", label: "Retail / Comercio" },
                      { value: "banca", label: "Banca y Finanzas" },
                      { value: "industria", label: "Industria / Manufactura" },
                      { value: "logistica", label: "Logística y Transporte" },
                      { value: "gobierno", label: "Gobierno / Sector público" },
                      { value: "construccion", label: "Construcción / Inmobiliaria" },
                      { value: "agroindustria", label: "Agroindustria" },
                      { value: "tecnologia", label: "Tecnología / Software" },
                      { value: "energia", label: "Energía" },
                      { value: "telecomunicaciones", label: "Telecomunicaciones" },
                      { value: "turismo", label: "Turismo" },
                      { value: "entretenimiento", label: "Entretenimiento" },
                      { value: "corporativo", label: "Corporativo / Oficinas" },
                      { value: "consultoria", label: "Consultoría" },
                      { value: "servicios", label: "Servicios" },
                    ],
                  },
                  { name: "label", label: "Nombre del rubro", type: "string" },
                  { name: "label_en", label: "Nombre del rubro (EN)", type: "string" },
                  {
                    name: "image",
                    label: "Imagen de fondo (opcional)",
                    type: "image",
                  },
                ],
              },
            ],
          },

          // ── Stats ──
          {
            name: "stats",
            label: "Por qué Fiberlux",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              {
                name: "items",
                label: "Stats",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
                fields: [
                  { name: "number", label: "Número", type: "string" },
                  { name: "label", label: "Etiqueta", type: "string" },
                  { name: "description", label: "Descripción", type: "string" },
                ],
              },
            ],
          },

          // ── Equipo ──
          {
            name: "team",
            label: "Nuestro equipo",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              {
                name: "members",
                label: "Miembros",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.name || "Miembro" }),
                },
                fields: [
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "role", label: "Cargo", type: "string" },
                  { name: "photo", label: "Foto", type: "image" },
                ],
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         BLOG
         ══════════════════════════════════════ */
      {
        name: "post",
        label: "Blog",
        path: "src/content/blog",
        format: "mdx",
        fields: [
          {
            name: "title",
            label: "Título",
            type: "string",
            required: true,
            isTitle: true,
          },
          { name: "title_en", label: "Título (EN)", type: "string" },
          {
            name: "excerpt",
            label: "Extracto",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "excerpt_en", label: "Extracto (EN)", type: "string", ui: { component: "textarea" } },
          { name: "body_en", label: "Contenido (EN)", type: "rich-text" },
          { name: "coverImage", label: "Imagen de portada", type: "image" },
          { name: "date", label: "Fecha", type: "datetime" },
          { name: "readTime", label: "Tiempo de lectura", type: "string" },
          {
            name: "tags",
            label: "Etiquetas",
            description:
              "Uno o varios tags del tema. El post aparece en las páginas de solución/subservicio cuyos 'Tags del blog a mostrar' incluyan alguno de estos.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS,
          },
          { name: "featured", label: "Destacado", type: "boolean" },
          { name: "body", label: "Contenido", type: "rich-text", isBody: true },
        ],
      },

      /* ══════════════════════════════════════
         CONTACTO
         ══════════════════════════════════════ */
      {
        name: "contact",
        label: "Contacto",
        path: "src/content/contact",
        format: "json",
        ui: {
          router: () => "/contacto",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "breadcrumb_en", label: "Migaja de pan (EN)", type: "string" },
          { name: "heading", label: "Título principal (H1)", type: "string", ui: { component: "textarea" } },
          { name: "heading_en", label: "Título principal (H1) (EN)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "intro_en",
            label: "Párrafo introductorio (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "cards",
            label: "Tarjetas de contacto",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.label || "Tarjeta" }),
            },
            fields: [
              {
                name: "icon",
                label: "Ícono",
                type: "string",
                options: [
                  { value: "phone", label: "Teléfono" },
                  { value: "email", label: "Correo" },
                  { value: "location", label: "Ubicación" },
                ],
              },
              { name: "label", label: "Etiqueta", type: "string" },
              { name: "label_en", label: "Etiqueta (EN)", type: "string" },
              { name: "value", label: "Valor", type: "string" },
              {
                name: "href",
                label: "Enlace (opcional)",
                type: "string",
                description:
                  "Hace la tarjeta clickeable. Ej.: 'tel:+5117480606', 'mailto:hola@fiberlux.pe' o un link de Google Maps. Si se deja vacío, se genera automáticamente según el ícono (teléfono→tel:, correo→mailto:, ubicación→Google Maps).",
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         SOPORTE TÉCNICO (página)
         ══════════════════════════════════════ */
      {
        name: "soporteTecnico",
        label: "Soporte Técnico (página)",
        path: "src/content/soporte-tecnico",
        format: "json",
        ui: {
          router: () => "/soporte-tecnico",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "breadcrumb_en", label: "Migaja de pan (EN)", type: "string" },
          { name: "heading", label: "Título principal (H1)", type: "string", ui: { component: "textarea" } },
          { name: "heading_en", label: "Título principal (H1) (EN)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "intro_en",
            label: "Párrafo introductorio (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "heroImage",
            label: "Imagen de fondo del hero",
            type: "image",
            description:
              "Foto a sangre del hero. El sujeto debe quedar a la derecha: el degradado oscurece la izquierda para el texto.",
          },
          {
            name: "heroVideo",
            label: "Video del hero (loop)",
            type: "image",
            description:
              "Video corto en loop (mp4) que reemplaza al 3D. Se mezcla con mix-blend-mode: screen sobre el fondo. Vacío = sin video.",
          },
          {
            name: "heroVideoPoster",
            label: "Poster del video (respaldo)",
            type: "image",
            description:
              "Imagen que se muestra mientras carga el video y en reduce-motion (sin reproducción).",
          },

          // ── Sección Soporte Técnico (acordeón) ──
          { name: "sectionTitle", label: "Título de sección", type: "string" },
          { name: "sectionTitle_en", label: "Título de sección (EN)", type: "string" },
          {
            name: "sectionSubtitle",
            label: "Subtítulo de sección",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "sectionSubtitle_en",
            label: "Subtítulo de sección (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "channels",
            label: "Canales de contacto",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.title || "Canal" }),
            },
            fields: [
              {
                name: "type",
                label: "Tipo",
                type: "string",
                options: [
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "call", label: "Llamada" },
                  { value: "email", label: "Correo" },
                ],
              },
              { name: "tabLabel", label: "Etiqueta de pestaña", type: "string" },
              { name: "tabLabel_en", label: "Etiqueta de pestaña (EN)", type: "string" },
              { name: "title", label: "Título del panel", type: "string" },
              { name: "title_en", label: "Título del panel (EN)", type: "string" },
              {
                name: "subtitle",
                label: "Subtítulo del panel",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "subtitle_en",
                label: "Subtítulo del panel (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "defaultOpen", label: "Abierto por defecto", type: "boolean" },
              {
                name: "rows",
                label: "Filas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label || "Fila" }),
                },
                fields: [
                  { name: "label", label: "Etiqueta", type: "string" },
                  {
                    name: "value",
                    label: "Valor (teléfono / WhatsApp / correo)",
                    type: "string",
                  },
                  { name: "optionLabel", label: "Texto opción (solo visual)", type: "string" },
                  { name: "message", label: "Mensaje pre-cargado (solo WhatsApp)", type: "string" },
                ],
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         SERVICIOS (página landing)
         ══════════════════════════════════════ */
      {
        name: "servicios",
        label: "Servicios (página)",
        path: "src/content/servicios",
        format: "json",
        ui: {
          router: () => "/servicios",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "heading", label: "Título principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "ctaLabel", label: "Texto del botón del hero", type: "string" },
          {
            name: "heroImage",
            label: "Imagen de fondo del hero",
            type: "image",
            description:
              "Foto a sangre del hero. El sujeto debe quedar a la derecha: el degradado oscurece la izquierda para el texto.",
          },
          {
            name: "heroVideo",
            label: "Video del hero (loop)",
            type: "image",
            description:
              "Video corto en loop (mp4) que reemplaza al 3D. Se mezcla con mix-blend-mode: screen sobre el fondo. Vacío = sin video.",
          },
          {
            name: "heroVideoPoster",
            label: "Poster del video (respaldo)",
            type: "image",
            description:
              "Imagen que se muestra mientras carga el video y en reduce-motion (sin reproducción).",
          },

          // ── Bloque de formulario ──
          { name: "formTitle", label: "Título del bloque de formulario", type: "string" },
          { name: "formTitle_en", label: "Título del bloque de formulario (EN)", type: "string" },
          {
            name: "formSubtitle",
            label: "Subtítulo del bloque de formulario",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "formSubtitle_en",
            label: "Subtítulo del bloque de formulario (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
        ],
      },

      /* ══════════════════════════════════════
         CASOS DE ÉXITO (página)
         ══════════════════════════════════════ */
      {
        name: "casosDeExito",
        label: "Casos de éxito (página)",
        path: "src/content/casos-de-exito",
        format: "json",
        ui: {
          router: () => "/casos-de-exito",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "breadcrumb_en", label: "Migaja de pan (EN)", type: "string" },
          {
            name: "heading",
            label: "Título principal (H1)",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "heading_en", label: "Título principal (H1) (EN)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "intro_en", label: "Párrafo introductorio (EN)", type: "string", ui: { component: "textarea" } },
          {
            // Obsoleto (SPEC 100): el hero ya no usa imagen de fondo. Se mantiene
            // el campo para no perder el dato existente, pero se oculta del panel.
            name: "heroImage",
            label: "Imagen de fondo del hero (obsoleto)",
            type: "image",
            ui: { component: () => null },
          },

          // ── Sección carrusel ──
          { name: "sectionTitle", label: "Título de la sección", type: "string" },
          {
            name: "items",
            label: "Casos",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.author || "Caso de éxito" }),
            },
            fields: [
              { name: "poster", label: "Poster del video (imagen)", type: "image" },
              {
                name: "youtubeUrl",
                label: "URL de YouTube (opcional)",
                type: "string",
                description:
                  "Si se completa, el modal embebe el video de YouTube (tiene prioridad sobre el mp4).",
              },
              {
                name: "videoFile",
                label: "Video mp4 auto-alojado (opcional)",
                type: "image",
                description:
                  "Sube aquí un archivo .mp4. Se usa solo si no hay URL de YouTube.",
              },
              { name: "logo", label: "Logo del cliente", type: "image" },
              {
                name: "quote",
                label: "Cita / testimonio",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "quote_en",
                label: "Cita / testimonio (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "author", label: "Nombre del autor", type: "string" },
              { name: "role", label: "Cargo (mayúsculas)", type: "string" },
              { name: "role_en", label: "Cargo (EN)", type: "string" },
              { name: "badge", label: "Texto del badge", type: "string" },
              { name: "badge_en", label: "Texto del badge (EN)", type: "string" },
            ],
          },

          // ── SEO / Meta ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         CERTIFICACIONES ISO (bloque Home)
         ══════════════════════════════════════ */
      {
        name: "certificaciones",
        label: "Certificaciones ISO (Home)",
        path: "src/content/certificaciones",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            name: "sectionTitle",
            label: "Título de la sección",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "sectionTitle_en",
            label: "Título de la sección (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "sectionDescription",
            label: "Descripción de la sección",
            type: "string",
            ui: { component: "textarea" },
            description: "Párrafo bajo el título, en la columna izquierda.",
          },
          {
            name: "sectionDescription_en",
            label: "Descripción de la sección (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "items",
            label: "Certificaciones",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.norm || item?.code || "Certificación" }),
            },
            fields: [
              {
                name: "code",
                label: "Número del sello (ej. 37001)",
                type: "string",
                description: "Número grande en el centro del sello. Sin la palabra ISO.",
              },
              {
                name: "label",
                label: "Etiqueta del sello (ej. ISO ANTISOBORNO)",
                type: "string",
                description: "Texto pequeño bajo el número, dentro del sello.",
              },
              { name: "label_en", label: "Etiqueta del sello (EN)", type: "string" },
              {
                name: "ringText",
                label: "Texto curvo del anillo",
                type: "string",
                ui: { component: "textarea" },
                description:
                  "Se repite alrededor del sello hasta cerrar la vuelta. Ej: CERTIFICACIÓN ISO 37001 · SISTEMA DE GESTIÓN ANTISOBORNO",
              },
              {
                name: "ringText_en",
                label: "Texto curvo del anillo (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "norm",
                label: "Norma completa",
                type: "string",
                ui: { component: "textarea" },
                description: "Línea bajo el sello. Ej: ISO 37001:2016 — Sistemas de gestión antisoborno",
              },
              {
                name: "norm_en",
                label: "Norma completa (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "scope",
                label: "Alcance / entidad certificadora",
                type: "string",
                ui: { component: "textarea" },
                description: "Última línea de la card. Ej: Alcance: toda la operación del Grupo Fiberlux.",
              },
              {
                name: "scope_en",
                label: "Alcance / entidad certificadora (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         FORMAS DE PAGO (página)
         ══════════════════════════════════════ */
      {
        name: "formasDePago",
        label: "Formas de pago (página)",
        path: "src/content/formas-de-pago",
        format: "json",
        ui: {
          router: () => "/formas-de-pago",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Hero ──
          {
            name: "heading",
            label: "Título (H1)",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "heading_en", label: "Título (H1) (EN)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo intro (opcional)",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "intro_en", label: "Párrafo intro (EN)", type: "string", ui: { component: "textarea" } },

          // ── Etiquetas de los selectores ──
          {
            name: "bankSelectLabel",
            label: "Placeholder selector de banco",
            type: "string",
          },
          { name: "bankSelectLabel_en", label: "Placeholder selector de banco (EN)", type: "string" },
          {
            name: "methodSelectLabel",
            label: "Placeholder selector de método",
            type: "string",
          },
          { name: "methodSelectLabel_en", label: "Placeholder selector de método (EN)", type: "string" },

          // ── Bancos (nivel 1) ──
          {
            name: "banks",
            label: "Bancos",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.name || "Banco" }) },
            fields: [
              { name: "name", label: "Nombre del banco", type: "string" },
              {
                name: "optionLabel",
                label: "Texto en el dropdown",
                type: "string",
                description: 'Ej: "Desde BBVA".',
              },
              { name: "optionLabel_en", label: "Texto en el dropdown (EN)", type: "string" },

              // ── Métodos (nivel 2) ──
              {
                name: "methods",
                label: "Métodos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Método" }) },
                fields: [
                  {
                    name: "label",
                    label: "Texto en el dropdown",
                    type: "string",
                    description: 'Ej: "Desde la aplicación".',
                  },
                  { name: "label_en", label: "Texto en el dropdown (EN)", type: "string" },

                  // ── Pasos (nivel 3) ──
                  {
                    name: "steps",
                    label: "Pasos",
                    type: "object",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.title || "Paso" }),
                    },
                    fields: [
                      { name: "title", label: "Título del paso", type: "string" },
                      { name: "title_en", label: "Título del paso (EN)", type: "string" },
                      {
                        name: "description",
                        label: "Descripción",
                        type: "rich-text",
                        description:
                          "Usa negrita (bold) para resaltar palabras en magenta.",
                      },
                      {
                        name: "description_en",
                        label: "Descripción (EN)",
                        type: "rich-text",
                        description:
                          "Traducción EN opcional; si está vacía se usa la versión en español.",
                      },
                      {
                        name: "image",
                        label: "Imagen del paso",
                        type: "image",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         GLOBAL (Nav, Footer, SEO)
         ══════════════════════════════════════ */
      {
        name: "global",
        label: "Global (Nav / Footer)",
        path: "src/content/global",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Cursor del sitio (SPEC 99) ──
          {
            name: "cursor",
            label: "Cursor del sitio",
            type: "object",
            fields: [
              {
                name: "type",
                label: "Tipo de cursor",
                type: "string",
                options: [
                  { value: "none", label: "Ninguno (cursor del sistema)" },
                  { value: "trail", label: "Estela luminosa (por defecto)" },
                  { value: "reticle", label: "Retícula técnica" },
                  { value: "dot", label: "Punto minimal" },
                ],
              },
              {
                name: "glow",
                label: "Intensidad del glow (estela)",
                type: "string",
                options: [
                  { value: "low", label: "Bajo" },
                  { value: "med", label: "Medio (por defecto)" },
                  { value: "high", label: "Alto" },
                ],
              },
            ],
          },
          // ── Navigation ──
          {
            name: "nav",
            label: "Navegación",
            type: "object",
            fields: [
              {
                name: "links",
                label: "Links del menú",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.text || "Link" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "text_en", label: "Texto (EN)", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                  {
                    name: "children",
                    label: "Submenú",
                    type: "object",
                    list: true,
                    ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "text_en", label: "Texto (EN)", type: "string" },
                      { name: "url", label: "URL", type: "string" },
                      {
                        name: "children",
                        label: "Sub-servicios (solo mobile)",
                        type: "object",
                        list: true,
                        ui: {
                          itemProps: (item) => ({
                            label: item?.text || "Sub-servicio",
                          }),
                        },
                        fields: [
                          { name: "text", label: "Texto", type: "string" },
                          { name: "text_en", label: "Texto (EN)", type: "string" },
                          { name: "url", label: "URL", type: "string" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },

          // ── Header (top bar / navbar) ──
          {
            name: "header",
            label: "Header (top bar / navbar)",
            type: "object",
            fields: [
              { name: "logo", label: "Logo", type: "image" },
              {
                name: "topBar",
                label: "Barra superior",
                type: "object",
                fields: [
                  { name: "empresasLabel", label: "Texto 'Empresas'", type: "string" },
                  { name: "empresasLabel_en", label: "Texto 'Empresas' (EN)", type: "string" },
                  { name: "empresasUrl", label: "URL 'Empresas'", type: "string" },
                  { name: "negociosLabel", label: "Texto 'Negocios'", type: "string" },
                  { name: "negociosLabel_en", label: "Texto 'Negocios' (EN)", type: "string" },
                  {
                    name: "negociosUrl",
                    label: "URL 'Negocios' (externa)",
                    type: "string",
                    description: "Se abre en pestaña nueva. Ej: https://negocios.fiberlux.pe/",
                  },
                  {
                    name: "abonadosLabel",
                    label: "Texto 'Información a abonados' (solo desktop)",
                    type: "string",
                  },
                  {
                    name: "abonadosLabel_en",
                    label: "Texto 'Información a abonados' (EN)",
                    type: "string",
                  },
                  { name: "abonadosUrl", label: "URL 'Información a abonados'", type: "string" },
                ],
              },
              {
                name: "desktopNav",
                label: "Navbar desktop (orden)",
                type: "object",
                list: true,
                description:
                  "Ítems horizontales en desktop. Si el URL coincide con un link de 'Navegación' con submenú, se revela al hover.",
                ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "text_en", label: "Texto (EN)", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                ],
              },
              {
                name: "secondaryNav",
                label: "Menú secundario (hamburguesa)",
                type: "object",
                list: true,
                description:
                  "Ítems del menú hamburguesa: en desktop abre un panel lateral, en mobile van al final del menú (bajo un divisor). Ej: Formas de pago, Fiberlux App, Portal de trabajo.",
                ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "text_en", label: "Texto (EN)", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                  {
                    name: "external",
                    label: "Abrir en pestaña nueva (externa)",
                    type: "boolean",
                  },
                ],
              },
            ],
          },

          // ── Botón flotante de WhatsApp (global) ──
          {
            name: "whatsapp",
            label: "WhatsApp (botón flotante)",
            type: "object",
            fields: [
              {
                name: "phone",
                label: "Número (formato internacional, solo dígitos)",
                type: "string",
                description: "Ej: 51986176790",
              },
              {
                name: "message",
                label: "Mensaje por defecto",
                type: "string",
                ui: { component: "textarea" },
                description:
                  "Mensaje prellenado en páginas generales. En páginas de servicio/solución se reemplaza automáticamente por uno que alude a ese servicio.",
              },
              {
                name: "bubble",
                label: "Mensaje flotante (burbuja)",
                type: "object",
                description:
                  "Burbuja que aparece junto al botón según la página. Si el visitante la cierra, no reaparece durante la sesión.",
                fields: [
                  {
                    name: "enabled",
                    label: "Mostrar burbuja",
                    type: "boolean",
                  },
                  {
                    name: "home",
                    label: "Mensaje en Home",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "home_en", label: "Mensaje en Home (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "contacto",
                    label: "Mensaje en Contacto",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "contacto_en", label: "Mensaje en Contacto (EN)", type: "string", ui: { component: "textarea" } },
                  {
                    name: "solucion",
                    label: "Mensaje en páginas de Solución",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "solucion_en", label: "Mensaje en Solución (EN)", type: "string", ui: { component: "textarea" } },
                ],
              },
            ],
          },

          // ── Footer ──
          {
            name: "footer",
            label: "Footer",
            type: "object",
            fields: [
              { name: "tagline", label: "Tagline", type: "string" },
              { name: "tagline_en", label: "Tagline (EN)", type: "string" },
              {
                name: "copyright",
                label: "Texto de copyright",
                type: "string",
                description:
                  "Usa {year} para insertar el año actual automáticamente. Ej: © {year} Fiberlux. Todos los derechos reservados",
              },
              { name: "copyright_en", label: "Texto de copyright (EN)", type: "string" },
              {
                name: "columns",
                label: "Columnas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Columna" }),
                },
                fields: [
                  { name: "title", label: "Título", type: "string" },
                  { name: "title_en", label: "Título (EN)", type: "string" },
                  {
                    name: "links",
                    label: "Links",
                    type: "object",
                    list: true,
                    ui: { itemProps: (item) => ({ label: item?.text || "Link" }) },
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "text_en", label: "Texto (EN)", type: "string" },
                      { name: "url", label: "URL", type: "string" },
                      {
                        name: "external",
                        label: "Abrir en pestaña nueva",
                        type: "boolean",
                        description:
                          "Actívalo para links externos o documentos PDF (abre en nueva pestaña, target=_blank). Déjalo apagado para páginas internas del sitio.",
                      },
                    ],
                  },
                ],
              },
              {
                name: "social",
                label: "Redes sociales",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.platform || "Red" }),
                },
                fields: [
                  {
                    name: "platform",
                    label: "Plataforma",
                    type: "string",
                    options: [
                      "Facebook",
                      "LinkedIn",
                      "Instagram",
                      "WhatsApp",
                      "X",
                      "YouTube",
                      "TikTok",
                      "GitHub",
                    ],
                  },
                  { name: "url", label: "URL", type: "string" },
                ],
              },
              { name: "logo", label: "Logo del footer", type: "image" },
              { name: "agencyLogo", label: "Logo de la agencia (crédito)", type: "image" },
              {
                name: "agencyUrl",
                label: "URL de la agencia (crédito)",
                type: "string",
                description:
                  "Enlace del wordmark de crédito en el pie (se abre en pestaña nueva).",
              },
              // ── Fondo del footer ──
              {
                name: "background",
                label: "Fondo del footer",
                type: "object",
                description:
                  "Controla el fondo del footer: morado sólido, oscuro con resplandor (recomendado), una imagen, o gradientes CSS personalizados.",
                fields: [
                  {
                    name: "mode",
                    label: "Tipo de fondo",
                    type: "string",
                    options: [
                      { value: "purple", label: "Morado sólido (clásico)" },
                      { value: "dark-glow", label: "Oscuro con resplandor (recomendado)" },
                      { value: "image", label: "Imagen" },
                      { value: "custom", label: "Gradientes personalizados" },
                    ],
                  },
                  {
                    name: "baseColor",
                    label: "Color base",
                    type: "string",
                    ui: { component: "color" },
                    description:
                      "Color de fondo sólido detrás del resplandor / imagen. Por defecto casi negro (#0A0A0A).",
                  },
                  {
                    name: "glowColor",
                    label: "Color del resplandor",
                    type: "string",
                    ui: { component: "color" },
                    description:
                      "Color del resplandor difuso (modo «Oscuro con resplandor»). Por defecto magenta de marca.",
                  },
                  {
                    name: "image",
                    label: "Imagen de fondo",
                    type: "image",
                    description:
                      "Solo para el modo «Imagen». Se muestra a cover, centrada, sobre el color base.",
                  },
                  {
                    name: "gradients",
                    label: "Gradientes personalizados (CSS)",
                    type: "object",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.value || "Gradiente" }),
                    },
                    description:
                      "Solo para el modo «Gradientes personalizados». Cada entrada es un valor CSS de fondo (ej: radial-gradient(...) o linear-gradient(...)). Se apilan en orden (el primero queda arriba) sobre el color base.",
                    fields: [
                      {
                        name: "value",
                        label: "Valor CSS",
                        type: "string",
                        ui: { component: "textarea" },
                        description:
                          "Ej: radial-gradient(100% 120% at 15% 60%, rgba(150,35,122,0.55), transparent 55%)",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          // ── Partners tecnológicos ──
          {
            name: "partners",
            label: "Partners tecnológicos",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "eyebrow_en", label: "Eyebrow (EN)", type: "string" },
              { name: "title", label: "Título", type: "string" },
              { name: "title_en", label: "Título (EN)", type: "string" },
              {
                name: "logos",
                label: "Logos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.alt || "Logo" }) },
                fields: [
                  { name: "image", label: "Logo", type: "image" },
                  { name: "alt", label: "Alt / Nombre", type: "string" },
                  { name: "url", label: "Enlace (opcional)", type: "string" },
                ],
              },
            ],
          },

          // ── SEO defaults ──
          {
            name: "seo",
            label: "SEO por defecto",
            type: "object",
            fields: [
              { name: "siteName", label: "Nombre del sitio", type: "string" },
              {
                name: "defaultDescription",
                label: "Descripción por defecto",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "ogImage",
                label: "Imagen OG por defecto",
                type: "image",
              },
            ],
          },

          // ── Scripts globales (head / body) ──
          {
            name: "codeInjection",
            label: "Scripts globales (head / body)",
            type: "object",
            fields: [
              {
                name: "head",
                label: "Código en <head>",
                type: "string",
                ui: { component: "textarea" },
                description:
                  "HTML/JS crudo inyectado al final del <head>, en TODAS las páginas. Ej: Google Analytics, Meta Pixel, verificación de dominio.",
              },
              {
                name: "bodyEnd",
                label: "Código antes de </body>",
                type: "string",
                ui: { component: "textarea" },
                description:
                  "HTML/JS crudo inyectado justo antes de </body>, en TODAS las páginas. Ej: widget de chat.",
              },
            ],
          },

          // ── Bloques HTML por sección ──
          {
            name: "htmlInjections",
            label: "Bloques HTML por sección",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.label || "Bloque HTML" }),
            },
            fields: [
              { name: "label", label: "Nombre (referencia)", type: "string" },
              { name: "enabled", label: "Activo", type: "boolean" },
              {
                name: "location",
                label: "Ubicación",
                type: "string",
                options: [
                  { value: "home-after-hero", label: "Home — bajo el hero" },
                  { value: "home-before-footer", label: "Home — antes del footer" },
                  { value: "solucion-after-hero", label: "Solución — bajo el hero" },
                  { value: "solucion-before-footer", label: "Solución — antes del footer" },
                  { value: "subservicio-after-hero", label: "Subservicio — bajo el hero" },
                  { value: "subservicio-before-footer", label: "Subservicio — antes del footer" },
                ],
              },
              {
                name: "html",
                label: "HTML",
                type: "string",
                ui: { component: "textarea" },
                description:
                  "HTML crudo que se renderiza en el anclaje elegido. Solo aplica a home y páginas de solución/subservicio.",
              },
            ],
          },

          // ── Sliders (autoplay) — SPEC 68 ──
          {
            name: "sliders",
            label: "Sliders (autoplay)",
            type: "object",
            description:
              "Autoplay e intervalo por tipo de slider. El autoplay se pausa al pasar el mouse/interactuar y se desactiva si el usuario prefiere menos movimiento.",
            fields: [
              {
                name: "certificaciones",
                label: "Certificaciones",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                  { name: "edgeHover", label: "Navegar al pasar el mouse por los bordes", type: "boolean", description: "Si está activo, pasar el cursor por el borde izquierdo/derecho del carrusel avanza a la certificación anterior/siguiente. Desactivado por defecto." },
                ],
              },
              {
                name: "soluciones",
                label: "Soluciones (home)",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
              {
                name: "testimonios",
                label: "Testimonios (home)",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
              {
                name: "casos",
                label: "Casos de éxito",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
              {
                name: "catalogoSoluciones",
                label: "Catálogo de soluciones",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
              {
                name: "blogPreview",
                label: "Blog (novedades)",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
              {
                name: "rubros",
                label: "Rubros (nosotros)",
                type: "object",
                fields: [
                  { name: "autoplay", label: "Autoplay", type: "boolean" },
                  { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
                  { name: "effect", label: "Efecto", type: "string", options: [ { value: "none", label: "Ninguno" }, { value: "scale", label: "Escala" }, { value: "opacity", label: "Opacidad" }, { value: "parallax", label: "Parallax" } ] },
                ],
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         MODO MANTENIMIENTO
         ══════════════════════════════════════ */
      {
        name: "maintenance",
        label: "Modo Mantenimiento",
        path: "src/content/maintenance",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            name: "enabled",
            label: "Activar modo mantenimiento",
            type: "boolean",
            description:
              "Al activar, TODAS las páginas mostrarán la pantalla de mantenimiento después del próximo deploy.",
          },
          {
            name: "title",
            label: "Título",
            type: "string",
          },
          {
            name: "message",
            label: "Mensaje",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "showContact",
            label: "Mostrar contacto",
            type: "boolean",
          },
          {
            name: "contactText",
            label: "Texto de contacto",
            type: "string",
          },
          {
            name: "contactUrl",
            label: "URL de contacto",
            type: "string",
          },
        ],
      },

      /* ══════════════════════════════════════
         INFORMACIÓN A ABONADOS
         ══════════════════════════════════════ */
      {
        name: "infoAbonados",
        label: "Información a Abonados",
        path: "src/content/info-abonados",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/informacion-abonados",
        },
        fields: [
          { name: "title", label: "Título de la página", type: "string" },
          { name: "title_en", label: "Título de la página (EN)", type: "string" },
          {
            name: "description",
            label: "Descripción",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "description_en",
            label: "Descripción (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "sections",
            label: "Secciones",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title || "Sección" }) },
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              { name: "visible", label: "Visible", type: "boolean" },
              {
                name: "documents",
                label: "Documentos",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Documento" }),
                },
                fields: [
                  { name: "title", label: "Título", type: "string" },
                  { name: "title_en", label: "Título (EN)", type: "string" },
                  { name: "url", label: "URL del documento", type: "string" },
                  {
                    name: "icon",
                    label: "Ícono",
                    type: "string",
                    options: [
                      { value: "document", label: "Documento" },
                      { value: "shield", label: "Escudo (seguridad)" },
                      { value: "scale", label: "Balanza (legal)" },
                      { value: "clipboard", label: "Portapapeles" },
                      { value: "folder", label: "Carpeta" },
                      { value: "certificate", label: "Certificado" },
                    ],
                  },
                  { name: "visible", label: "Visible", type: "boolean" },
                ],
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         CONFIGURACIÓN DE FORMULARIOS (recipients)
         ══════════════════════════════════════ */
      {
        name: "formConfig",
        label: "Configuración de formularios",
        path: "src/content/form-config",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            name: "forms",
            label: "Formularios",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.label || item?.formType || "Formulario",
              }),
            },
            fields: [
              {
                name: "formType",
                label: "Tipo (no modificar)",
                type: "string",
                description:
                  "Identificador interno del formulario. No cambiar.",
              },
              {
                name: "label",
                label: "Nombre visible",
                type: "string",
              },
              {
                name: "enabled",
                label: "Activo",
                type: "boolean",
                description:
                  "Si está desactivado, el formulario no enviará correos.",
              },
              {
                name: "recipients",
                label: "Correos destinatarios",
                type: "string",
                list: true,
                description:
                  "Agrega uno o más correos. Cada formulario puede tener diferentes destinatarios.",
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         FORMULARIOS DINÁMICOS
         ══════════════════════════════════════ */
      {
        name: "dynamicForms",
        label: "Formularios Dinámicos",
        path: "src/content/dynamic-forms",
        format: "json",
        ui: {
          router: ({ document }) => {
            const slug = document._sys.filename;
            const routes: Record<string, string> = {
              reclamo: "/reclamos/reclamo",
              apelacion: "/reclamos/apelacion",
              queja: "/reclamos/queja",
              "libro-reclamaciones": "/legales/libro-reclamaciones",
            };
            return routes[slug] || `/${slug}`;
          },
        },
        fields: [
          /* ── General ── */
          {
            name: "formId",
            label: "ID del formulario",
            type: "string",
            required: true,
            description:
              "Identificador único. Debe coincidir con formType en 'Configuración de formularios' para el envío de correos.",
          },
          {
            name: "formTitle",
            label: "Título del formulario",
            type: "string",
          },
          { name: "formTitle_en", label: "Título del formulario (EN)", type: "string" },
          {
            name: "badge",
            label: "Badge (opcional)",
            type: "string",
            description:
              "Texto pequeño encima del título. Solo aplica en estilo Estándar.",
          },
          {
            name: "description",
            label: "Descripción",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "description_en",
            label: "Descripción (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "styleVariant",
            label: "Estilo visual",
            type: "string",
            options: [
              { value: "default", label: "Estándar (formularios OSIPTEL)" },
              { value: "contact", label: "Contacto (estilo Tailwind, claro)" },
              { value: "contact-dark", label: "Contacto (oscuro / corp)" },
            ],
            description: "Define la apariencia visual del formulario.",
          },

          /* ── Submit & Messages ── */
          {
            name: "submitButtonText",
            label: "Texto botón enviar",
            type: "string",
          },
          { name: "submitButtonText_en", label: "Texto botón enviar (EN)", type: "string" },
          {
            name: "successTitle",
            label: "Título de éxito",
            type: "string",
            description:
              "Título que se muestra después de enviar exitosamente.",
          },
          { name: "successTitle_en", label: "Título de éxito (EN)", type: "string" },
          {
            name: "successMessage",
            label: "Mensaje de éxito",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "successMessage_en",
            label: "Mensaje de éxito (EN)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "errorMessage",
            label: "Mensaje de error (servidor)",
            type: "string",
            description: "Se muestra cuando falla el envío al servidor.",
          },
          { name: "errorMessage_en", label: "Mensaje de error (EN)", type: "string" },
          {
            name: "validationMessage",
            label: "Mensaje de validación",
            type: "string",
            description:
              "Se muestra cuando el usuario intenta enviar con campos inválidos. Ej: 'Por favor completa los campos marcados en rojo'.",
          },
          { name: "validationMessage_en", label: "Mensaje de validación (EN)", type: "string" },
          {
            name: "showCorrelativo",
            label: "Mostrar N° correlativo",
            type: "boolean",
            description:
              "Mostrar número de correlativo en la pantalla de éxito (si el servidor lo retorna).",
          },

          /* ── Privacy ── */
          {
            name: "privacyText",
            label: "Texto de privacidad",
            type: "string",
          },
          {
            name: "privacyUrl",
            label: "URL Política de Privacidad",
            type: "string",
          },
          {
            name: "dataUrl",
            label: "URL Tratamiento de Datos",
            type: "string",
          },

          /* ══════════════════════════════════════════════
       FIELDS — Array dinámico de campos
       ══════════════════════════════════════════════ */
          {
            name: "fields",
            label: "Campos del formulario",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => {
                const type = item?.fieldType || "campo";
                const label = item?.label || item?.name || "";
                const icons: Record<string, string> = {
                  section_header: "📌",
                  divider: "──",
                  note: "📝",
                  text: "Aa",
                  email: "✉",
                  tel: "📞",
                  ruc: "🆔",
                  number: "#",
                  textarea: "¶",
                  select: "▼",
                  radio: "◉",
                  radioGroup: "◉◉",
                  checkbox: "☑",
                  checkboxGroup: "☑☑",
                  upload: "📎",
                  currency: "S/",
                  date: "📅",
                  hidden: "👁‍🗨",
                };
                const icon = icons[type] || "•";
                return { label: `${icon} ${type} — ${label}` };
              },
            },
            fields: [
              {
                name: "fieldType",
                label: "Tipo de campo",
                type: "string",
                required: true,
                options: [
                  {
                    value: "section_header",
                    label: "📌 Encabezado de sección",
                  },
                  { value: "divider", label: "── Separador" },
                  { value: "note", label: "📝 Nota / Texto" },
                  { value: "text", label: "Texto" },
                  { value: "email", label: "Email" },
                  { value: "tel", label: "Teléfono (9 díg., empieza en 9)" },
                  { value: "ruc", label: "RUC (11 dígitos)" },
                  { value: "number", label: "Número" },
                  { value: "textarea", label: "Área de texto" },
                  { value: "select", label: "Desplegable" },
                  { value: "radio", label: "Radio (inline)" },
                  {
                    value: "radioGroup",
                    label: "Radio (cards con descripción)",
                  },
                  { value: "checkbox", label: "Casilla de verificación" },
                  { value: "checkboxGroup", label: "Grupo de casillas" },
                  { value: "upload", label: "Subir archivo" },
                  { value: "currency", label: "Moneda (S/)" },
                  { value: "date", label: "Fecha (día/mes/año)" },
                  { value: "hidden", label: "Campo oculto" },
                ],
              },
              {
                name: "name",
                label: "Nombre interno",
                type: "string",
                description:
                  "Identificador único del campo. Se usa como key en el JSON enviado. Sin espacios ni tildes. Ej: nombreCompleto, tipoDoc, adjuntos.",
              },
              {
                name: "label",
                label: "Etiqueta visible",
                type: "string",
                description: "Para section_header es el título de la sección.",
              },
              { name: "label_en", label: "Etiqueta visible (EN)", type: "string" },
              {
                name: "placeholder",
                label: "Placeholder",
                type: "string",
              },
              { name: "placeholder_en", label: "Placeholder (EN)", type: "string" },
              {
                name: "required",
                label: "Obligatorio",
                type: "boolean",
              },
              {
                name: "width",
                label: "Ancho",
                type: "string",
                options: [
                  { value: "full", label: "Completo (100%)" },
                  { value: "half", label: "Mitad (50%) — 2 por fila" },
                  { value: "third", label: "Tercio (33%) — 3 por fila" },
                ],
                description: "En mobile siempre se muestra al 100%.",
              },
              {
                name: "order",
                label: "Orden (desktop)",
                type: "number",
                description:
                  "Orden de aparición en desktop. Menor = más arriba.",
              },
              {
                name: "orderMobile",
                label: "Orden (mobile)",
                type: "number",
                description:
                  "Orden en mobile. Si se deja vacío, usa el orden de desktop.",
              },

              /* ── Campos específicos por tipo ── */
              {
                name: "sectionNumber",
                label: "Número de sección",
                type: "number",
                description:
                  "Solo para section_header. Número que se muestra en el círculo.",
              },
              {
                name: "noteContent",
                label: "Contenido de nota",
                type: "string",
                ui: { component: "textarea" },
                description: "Solo para note. El texto del párrafo.",
              },
              {
                name: "noteContent_en",
                label: "Contenido de nota (EN)",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "rows",
                label: "Filas",
                type: "number",
                description: "Solo para textarea. Default: 4.",
              },

              /* ── Validation ── */
              {
                name: "validation",
                label: "Validación",
                type: "object",
                fields: [
                  {
                    name: "minLength",
                    label: "Largo mínimo",
                    type: "number",
                  },
                  {
                    name: "maxLength",
                    label: "Largo máximo",
                    type: "number",
                  },
                  {
                    name: "pattern",
                    label: "Patrón (regex)",
                    type: "string",
                    description:
                      "Expresión regular. Ej: ^\\d{11}$ para RUC de 11 dígitos, ^\\d{8}$ para DNI.",
                  },
                  {
                    name: "patternMessage",
                    label: "Mensaje del patrón",
                    type: "string",
                    description:
                      "Mensaje cuando el valor no cumple el patrón. Ej: 'El RUC debe tener 11 dígitos'.",
                  },
                  { name: "patternMessage_en", label: "Mensaje del patrón (EN)", type: "string" },
                ],
              },
              {
                name: "errorMessage",
                label: "Mensaje de error personalizado",
                type: "string",
                description:
                  "Si se deja vacío, se genera un mensaje automático según la validación que falle.",
              },
              { name: "errorMessage_en", label: "Mensaje de error personalizado (EN)", type: "string" },
              {
                name: "helpText",
                label: "Texto de ayuda",
                type: "string",
                description:
                  "Texto pequeño debajo del campo. Para upload aparece como instrucción de archivos.",
              },
              { name: "helpText_en", label: "Texto de ayuda (EN)", type: "string" },
              {
                name: "defaultValue",
                label: "Valor por defecto",
                type: "string",
              },

              /* ── Options (select, radio, radioGroup, checkboxGroup) ── */
              {
                name: "options",
                label: "Opciones",
                type: "object",
                list: true,
                description: "Para select, radio, radioGroup y checkboxGroup.",
                ui: {
                  itemProps: (item) => ({ label: item?.label || "Opción" }),
                },
                fields: [
                  { name: "value", label: "Valor", type: "string" },
                  { name: "label", label: "Etiqueta", type: "string" },
                  { name: "label_en", label: "Etiqueta (EN)", type: "string" },
                  {
                    name: "group",
                    label: "Grupo / Categoría",
                    type: "string",
                    description:
                      "Solo para select: agrupa las opciones bajo un encabezado (optgroup). Ej: la categoría del servicio.",
                  },
                  { name: "group_en", label: "Grupo / Categoría (EN)", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    description:
                      "Solo para radioGroup (aparece debajo del título en la tarjeta).",
                  },
                  { name: "description_en", label: "Descripción (EN)", type: "string" },
                ],
              },

              /* ── Upload config ── */
              {
                name: "accept",
                label: "Tipos de archivo",
                type: "string",
                description: "Solo para upload. Ej: .pdf,.jpg,.png,.doc,.docx",
              },
              {
                name: "maxFileSize",
                label: "Tamaño máximo (MB)",
                type: "number",
                description: "Solo para upload.",
              },
              {
                name: "multiple",
                label: "Múltiples archivos",
                type: "boolean",
                description: "Solo para upload. Default: true.",
              },
              {
                name: "linkText",
                label: "Texto del enlace",
                type: "string",
                description:
                  "Solo para checkbox. Parte del label que se convierte en enlace. Ej: 'Política de Privacidad'.",
              },
              { name: "linkText_en", label: "Texto del enlace (EN)", type: "string" },
              {
                name: "linkUrl",
                label: "URL del enlace",
                type: "string",
                description:
                  "Solo para checkbox. URL a la que apunta el enlace.",
              },

              /* ── Conditional ── */
              {
                name: "conditionalField",
                label: "Campo condicional",
                type: "object",
                description:
                  "Solo mostrar este campo si otro campo tiene un valor específico.",
                fields: [
                  {
                    name: "dependsOn",
                    label: "Depende del campo (nombre interno)",
                    type: "string",
                    description: "El 'name' del campo del cual depende.",
                  },
                  {
                    name: "showWhen",
                    label: "Mostrar cuando el valor es",
                    type: "string",
                    description:
                      "Valor exacto. Para checkbox usa 'true' o 'false'.",
                  },
                ],
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         LEGALES (páginas de contenido)
         ══════════════════════════════════════ */
      {
        name: "legal",
        label: "Legales (páginas de contenido)",
        path: "src/content/legal",
        format: "json",
        ui: {
          router: ({ document }) => `/legales/${document._sys.filename}`,
        },
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "string" },
          { name: "eyebrow_en", label: "Eyebrow (EN)", type: "string" },
          {
            name: "title",
            label: "Título (H1)",
            type: "string",
            isTitle: true,
            required: true,
          },
          { name: "title_en", label: "Título (H1) (EN)", type: "string" },
          { name: "updatedAt", label: "Última actualización", type: "datetime" },
          { name: "body", label: "Contenido", type: "rich-text" },
          {
            name: "body_en",
            label: "Contenido (EN) — traducción oficial",
            type: "rich-text",
            description:
              "Versión oficial en inglés del documento legal. Si está vacía, se muestra la versión en español.",
          },
          {
            name: "embeddedFormSlug",
            label: "Formulario embebido (slug dynamicForms)",
            type: "string",
            description:
              "Opcional. Si se define, incrusta ese formulario dinámico debajo del contenido. Ej: derechos-arco.",
          },
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         CONSENTIMIENTO DE COOKIES (modal)
         ══════════════════════════════════════ */
      {
        name: "cookieConsent",
        label: "Consentimiento de cookies (modal)",
        path: "src/content/cookie-consent",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { name: "title", label: "Título del modal", type: "string" },
          { name: "intro", label: "Texto introductorio", type: "rich-text" },
          {
            name: "showMoreText",
            label: "Texto del enlace 'Mostrar más'",
            type: "string",
          },
          {
            name: "showMoreUrl",
            label: "URL 'Mostrar más'",
            type: "string",
          },
          { name: "btnReject", label: "Texto botón rechazar", type: "string" },
          { name: "btnSave", label: "Texto botón guardar", type: "string" },
          { name: "btnAccept", label: "Texto botón aceptar", type: "string" },
          {
            name: "alwaysActiveLabel",
            label: "Etiqueta 'siempre activa'",
            type: "string",
          },
          {
            name: "categories",
            label: "Categorías",
            type: "object",
            list: true,
            ui: { itemProps: (c) => ({ label: c?.name || "Categoría" }) },
            fields: [
              { name: "key", label: "Clave", type: "string" },
              { name: "name", label: "Nombre", type: "string" },
              {
                name: "description",
                label: "Descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "alwaysActive",
                label: "Siempre activa",
                type: "boolean",
              },
            ],
          },
        ],
      },

      /* ══════════════════════════════════════
         PÁGINA FIBERLUX APP  (/fiberlux-app)
         ══════════════════════════════════════ */
      {
        name: "fiberluxApp",
        label: "Página Fiberlux App",
        path: "src/content/fiberlux-app",
        format: "json",
        ui: {
          router: () => "/fiberlux-app",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          // ── Banner de descarga (componente reutilizable, SPEC 53) ──
          {
            name: "banner",
            label: "Banner de descarga (app)",
            type: "object",
            fields: [
              {
                name: "mode",
                label: "Modo del banner",
                type: "string",
                options: [
                  { value: "nativa", label: "Nativa (editable)" },
                  { value: "imagen", label: "Imagen" },
                ],
              },
              { name: "headingLead", label: "Titular (parte normal)", type: "string" },
              { name: "headingStrong", label: "Titular (parte negrita)", type: "string" },
              { name: "pillText", label: "Texto de la pill", type: "string" },
              {
                name: "bullets",
                label: "Bullets",
                type: "object",
                list: true,
                ui: { itemProps: (i) => ({ label: i?.title || "Bullet" }) },
                fields: [
                  { name: "title", label: "Título (negrita)", type: "string" },
                  { name: "text", label: "Texto", type: "string" },
                ],
              },
              {
                name: "downloadText",
                label: "Texto 'Búscanos como…'",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "androidUrl", label: "URL Play Store (Android)", type: "string" },
              { name: "iosUrl", label: "URL App Store (iOS)", type: "string" },
              { name: "mockup", label: "Imagen del teléfono", type: "image" },
              // ── Modo imagen (SPEC 60) ──
              { name: "imageMobile", label: "Imagen mobile (≤600px)", type: "image" },
              { name: "imageTablet", label: "Imagen tablet (≤1024px)", type: "image" },
              { name: "imageDesktop", label: "Imagen desktop", type: "image" },
              {
                name: "bgColor",
                label: "Color de fondo (modo imagen)",
                type: "string",
                ui: { component: "color" },
              },
            ],
          },
          // ── Hero ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              { name: "heading", label: "Titular (H1)", type: "string" },
              {
                name: "description",
                label: "Descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "description_en", label: "Descripción (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "note",
                label: "Bajada en contenedor",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "note_en", label: "Bajada en contenedor (EN)", type: "string", ui: { component: "textarea" } },
              {
                name: "mockup",
                label: "Mockup app (imagen celular)",
                type: "image",
              },
              {
                name: "downloads",
                label: "Botones de descarga",
                type: "object",
                list: true,
                ui: { itemProps: (i) => ({ label: i?.label || "Descarga" }) },
                fields: [
                  {
                    name: "store",
                    label: "Tienda",
                    type: "string",
                    options: ["appstore", "googleplay"],
                  },
                  { name: "label", label: "Texto", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                ],
              },
            ],
          },

          // ── "Beneficios" ──
          {
            name: "beneficios",
            label: "Beneficios",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
              { name: "title_en", label: "Título de sección (EN)", type: "string" },
              {
                name: "items",
                label: "Cards",
                type: "object",
                list: true,
                ui: { itemProps: (i) => ({ label: i?.text || "Beneficio" }) },
                fields: [
                  {
                    name: "icon",
                    label: "Ícono",
                    type: "string",
                    options: [
                      "monitoreo",
                      "sedes",
                      "diagnostico",
                      "reloj",
                      "red",
                      "escudo",
                      "grafico",
                      "generico",
                    ],
                  },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "text_en",
                    label: "Texto (EN)",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── "Lleva la eficiencia" (video showcase) ──
          {
            name: "videoShowcase",
            label: "Sección video (Lleva la eficiencia)",
            type: "object",
            fields: [
              { name: "heading", label: "Titular", type: "string" },
              { name: "heading_en", label: "Titular (EN)", type: "string" },
              { name: "body", label: "Párrafo", type: "rich-text" },
              { name: "body_en", label: "Párrafo (EN)", type: "rich-text" },
              { name: "buttonLabel", label: "Texto del botón", type: "string" },
              {
                name: "buttonLabel_en",
                label: "Texto del botón (EN)",
                type: "string",
              },
              {
                name: "videoUrl",
                label: "URL del video (YouTube)",
                type: "string",
                description:
                  "Link de YouTube; se abre en el mismo modal que Casos de éxito.",
              },
              {
                name: "imageDesktop",
                label: "Imagen laptop (desktop)",
                type: "image",
              },
              {
                name: "imageMobile",
                label: "Imagen laptop (mobile)",
                type: "image",
                description: "Si se deja vacío, se usa la imagen de desktop.",
              },
            ],
          },

          // ── "Casos de uso" ──
          {
            name: "casosDeUso",
            label: "Casos de uso",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "eyebrow_en", label: "Eyebrow (EN)", type: "string" },
              { name: "statement", label: "Statement", type: "rich-text" },
              { name: "statement_en", label: "Statement (EN)", type: "rich-text" },
            ],
          },

          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "Título '¿Por qué Fiberlux?'",
            type: "string",
          },
          {
            name: "whyUsTitle_en",
            label: "Título '¿Por qué Fiberlux?' (EN)",
            type: "string",
          },

          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta título", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripción",
                type: "string",
                ui: { component: "textarea" },
              },
              { name: "ogImage", label: "Imagen OG", type: "image" },
            ],
          },
        ],
      },
    ],
  },
});
