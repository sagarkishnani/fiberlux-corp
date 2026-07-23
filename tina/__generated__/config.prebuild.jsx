// tina/config.ts
import { defineConfig } from "tinacms";
var BLOG_TAG_OPTIONS = [
  "Conectividad",
  "Ciberseguridad",
  "Cloud",
  "Data Center",
  "Comunicaciones",
  "Continuidad de negocio"
];
var config_default = defineConfig({
  branch: process.env.TINA_BRANCH || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public"
    }
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          {
            type: "object",
            name: "hero",
            label: "Hero \u2014 Inicio",
            fields: [
              {
                type: "string",
                name: "title",
                label: "T\xEDtulo principal",
                required: true,
                description: "Mant\xE9n \u2264 60 caracteres para evitar saltos largos en mobile."
              },
              {
                type: "string",
                name: "subtitle",
                label: "Subt\xEDtulo",
                ui: { component: "textarea" },
                description: "Frase de apoyo bajo el t\xEDtulo. \u2264 140 caracteres."
              },
              {
                type: "string",
                name: "splineSceneUrl",
                label: "URL de la escena de Spline",
                description: "Pega aqu\xED la URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode"
              },
              {
                type: "image",
                name: "splinePosterUrl",
                label: "Poster est\xE1tico de la escena (respaldo)",
                description: "Captura PNG de la escena. Se muestra en equipos d\xE9biles / red lenta / reduce-motion en vez del 3D, y como base mientras carga."
              },
              {
                type: "object",
                name: "buttons",
                label: "Botones (CTAs)",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.text || "Bot\xF3n sin texto"
                  })
                },
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Texto del bot\xF3n",
                    required: true
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Enlace (URL o ancla #seccion)"
                  },
                  {
                    type: "string",
                    name: "variant",
                    label: "Estilo del bot\xF3n",
                    options: [
                      { value: "primary", label: "Primario (magenta s\xF3lido)" },
                      { value: "secondary", label: "Secundario (outline)" }
                    ]
                  }
                ]
              }
            ]
          },
          // ── Servicios ──
          {
            name: "services",
            label: "Servicios",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Servicios",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Servicio" })
                },
                fields: [
                  { name: "number", label: "N\xFAmero", type: "string" },
                  { name: "title", label: "T\xEDtulo", type: "string" },
                  {
                    name: "description",
                    label: "Descripci\xF3n",
                    type: "string",
                    ui: { component: "textarea" }
                  },
                  {
                    name: "icon",
                    label: "\xCDcono (SVG o imagen)",
                    type: "image"
                  },
                  {
                    name: "bullets",
                    label: "Bullets",
                    type: "string",
                    list: true
                  },
                  { name: "url", label: "URL del servicio", type: "string" }
                ]
              }
            ]
          },
          // ── Caso de éxito / Testimonio ──
          {
            name: "testimonials",
            label: "Testimonios",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar secci\xF3n de testimonios",
                type: "boolean",
                description: "Desact\xEDvalo para ocultar la secci\xF3n de testimonios en todo el sitio (ej. mientras no haya suficientes quotes)."
              },
              {
                name: "sectionTitle",
                label: "T\xEDtulo de secci\xF3n",
                type: "string"
              },
              {
                name: "items",
                label: "Testimonios",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.name || "Testimonio" })
                },
                fields: [
                  {
                    name: "quote",
                    label: "Cita principal",
                    type: "string",
                    ui: { component: "textarea" }
                  },
                  {
                    name: "description",
                    label: "Descripci\xF3n extendida",
                    type: "string",
                    ui: { component: "textarea" }
                  },
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "role", label: "Cargo", type: "string" },
                  { name: "company", label: "Empresa", type: "string" },
                  { name: "avatar", label: "Foto", type: "image" },
                  { name: "logo", label: "Logo empresa", type: "image" }
                ]
              }
            ]
          },
          // ── Stats ──
          {
            name: "stats",
            label: "Por qu\xE9 Fiberlux",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "items",
                label: "Estad\xEDsticas",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
                fields: [
                  { name: "number", label: "N\xFAmero", type: "string" },
                  { name: "label", label: "Etiqueta superior", type: "string" },
                  { name: "description", label: "Descripci\xF3n", type: "string" }
                ]
              }
            ]
          },
          {
            name: "blogPreview",
            label: "Secci\xF3n Blog (Insights)",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              { name: "buttonText", label: "Texto del bot\xF3n", type: "string" },
              { name: "buttonUrl", label: "URL del bot\xF3n", type: "string" }
            ]
          }
        ]
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
            slugify: (values) => (values?.slug || values?.title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          }
        },
        fields: [
          {
            name: "title",
            label: "Nombre de la soluci\xF3n",
            type: "string",
            required: true,
            isTitle: true
          },
          { name: "slug", label: "URL slug", type: "string", required: true },
          // ── SPEC 63: qué tags del blog aparecen en las novedades de esta página ──
          {
            name: "blogTags",
            label: "Tags del blog a mostrar",
            description: "Las entradas del blog con alguno de estos tags aparecen en la secci\xF3n de novedades de esta p\xE1gina. Vac\xEDo = 6 m\xE1s recientes.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS
          },
          // ── Hero (form ¿Conversamos? = DynamicForm servicios) ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              {
                name: "heading",
                label: "T\xEDtulo (H1)",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "intro",
                label: "P\xE1rrafo intro",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "ctaLabel",
                label: "Texto bot\xF3n (ancla al cat\xE1logo)",
                type: "string"
              },
              {
                name: "formTitle",
                label: "T\xEDtulo del form del hero",
                type: "string"
              },
              {
                name: "heroMode",
                label: "Mostrar en el hero",
                type: "string",
                options: [
                  { value: "form", label: "Formulario" },
                  { value: "image", label: "Imagen" }
                ],
                description: "Formulario '\xBFConversamos?' (por defecto) o una imagen de categor\xEDa a sangre."
              },
              {
                name: "heroImage",
                label: "Imagen del hero (modo imagen)",
                type: "image"
              }
            ]
          },
          // ── "El valor de la resiliencia" (bento 3 cards) ──
          {
            name: "valor",
            label: "El valor de la resiliencia",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "subtitle",
                label: "Subt\xEDtulo de secci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "cards",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.heading || "Card" }),
                  min: 3,
                  max: 3
                },
                fields: [
                  { name: "heading", label: "T\xEDtulo", type: "string" },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" }
                  },
                  {
                    name: "tags",
                    label: "Etiquetas (chips)",
                    description: "Tecnolog\xEDas/servicios mostrados como chips. Se usan en la card 'Nuestra soluci\xF3n'.",
                    type: "string",
                    list: true
                  },
                  { name: "image", label: "Imagen/gr\xE1fico", type: "image" }
                ]
              }
            ]
          },
          // ── "Catálogo de soluciones" (hover-reveal; items placeholder → nivel-2) ──
          {
            name: "catalogo",
            label: "Cat\xE1logo de soluciones",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Items",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Item" }) },
                fields: [
                  {
                    name: "icon",
                    label: "\xCDcono",
                    type: "string",
                    options: [
                      { value: "internet", label: "Internet / Fibra" },
                      { value: "disponibilidad", label: "Alta disponibilidad" },
                      { value: "satelital", label: "Satelital" },
                      { value: "radioenlace", label: "Radioenlace" },
                      { value: "transmision", label: "Transmisi\xF3n de datos" },
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
                      { value: "storage", label: "Storage / C\xF3mputo" },
                      { value: "mesa-ayuda", label: "Mesa de ayuda" },
                      { value: "wifi", label: "WiFi gestionado" },
                      { value: "videovigilancia", label: "Videovigilancia" },
                      { value: "generico", label: "Gen\xE9rico" }
                    ]
                  },
                  { name: "title", label: "T\xEDtulo", type: "string" },
                  {
                    name: "description",
                    label: "Descripci\xF3n (se revela en hover)",
                    type: "string",
                    ui: { component: "textarea" }
                  },
                  { name: "buttonLabel", label: "Texto del bot\xF3n", type: "string" },
                  {
                    name: "url",
                    label: "URL (placeholder \u2192 nivel-2)",
                    type: "string"
                  },
                  {
                    name: "colSpan",
                    label: "Columnas que ocupa (desktop)",
                    type: "string",
                    options: [
                      { value: "1", label: "1 columna" },
                      { value: "2", label: "2 columnas" },
                      { value: "3", label: "3 columnas (ancho completo)" }
                    ]
                  },
                  {
                    name: "featured",
                    label: "Destacado (fondo magenta + descripci\xF3n visible)",
                    type: "boolean"
                  }
                ]
              }
            ]
          },
          // ── Partners tecnológicos (por categoría; marquee propio de la solución) ──
          {
            name: "partners",
            label: "Partners tecnol\xF3gicos",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "logos",
                label: "Logos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.alt || "Logo" }) },
                fields: [
                  { name: "image", label: "Logo", type: "image" },
                  { name: "alt", label: "Alt / Nombre", type: "string" },
                  { name: "url", label: "Enlace (opcional)", type: "string" }
                ]
              }
            ]
          },
          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "T\xEDtulo '\xBFPor qu\xE9 Fiberlux?'",
            type: "string"
          },
          // ── "Preguntas frecuentes" (acordeón, respuesta rich-text) ──
          {
            name: "faq",
            label: "Preguntas frecuentes",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar secci\xF3n",
                type: "boolean",
                description: "Desact\xEDvalo para ocultar el bloque de preguntas frecuentes en esta p\xE1gina."
              },
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Preguntas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question || "Pregunta" })
                },
                fields: [
                  { name: "question", label: "Pregunta", type: "string" },
                  { name: "answer", label: "Respuesta", type: "rich-text" }
                ]
              }
            ]
          },
          // ── SEO / meta (por servicio; cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
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
          router: ({ document }) => `/servicios/${document.solucionSlug}/${document._sys.filename}`,
          filename: {
            slugify: (values) => (values?.slug || values?.title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          }
        },
        fields: [
          {
            name: "title",
            label: "Nombre del sub-servicio",
            type: "string",
            required: true,
            isTitle: true
          },
          { name: "slug", label: "URL slug", type: "string", required: true },
          {
            name: "solucionSlug",
            label: "Soluci\xF3n padre (slug)",
            type: "string",
            required: true,
            options: [
              { value: "conectividad-empresarial", label: "Conectividad Empresarial" },
              { value: "ciberseguridad-gestionada", label: "Ciberseguridad Gestionada" },
              { value: "data-center-cloud", label: "Data Center, Cloud y Continuidad" },
              { value: "servicios-gestionados", label: "Servicios Gestionados" }
            ]
          },
          {
            name: "solucionTitle",
            label: "Soluci\xF3n padre (nombre para breadcrumb)",
            type: "string"
          },
          // ── SPEC 63: qué tags del blog aparecen en las novedades de esta página ──
          {
            name: "blogTags",
            label: "Tags del blog a mostrar",
            description: "Las entradas del blog con alguno de estos tags aparecen en la secci\xF3n de novedades de esta p\xE1gina. Vac\xEDo = 6 m\xE1s recientes.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS
          },
          // ── Hero ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              {
                name: "heading",
                label: "T\xEDtulo (H1)",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "intro",
                label: "P\xE1rrafo intro",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "note",
                label: "Caja de nota",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "ctaLabel",
                label: "Texto bot\xF3n (ancla al form inferior)",
                type: "string"
              },
              {
                name: "formTitle",
                label: "T\xEDtulo del form del hero",
                type: "string"
              },
              {
                name: "heroBackground",
                label: "Fondo del hero",
                type: "string",
                options: [
                  { value: "grafico", label: "Gr\xE1fico decorativo (actual)" },
                  { value: "imagen", label: "Imagen propia del subservicio" }
                ]
                // default "grafico"; el seed pone "imagen" en los 34
              },
              {
                name: "heroImage",
                label: "Imagen del hero (modo imagen)",
                type: "image"
              }
            ]
          },
          // ── "Beneficios" (cards ícono + título + texto) ──
          {
            name: "beneficios",
            label: "Beneficios",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Beneficio" })
                },
                fields: [
                  {
                    name: "icon",
                    label: "\xCDcono",
                    type: "string",
                    options: [
                      { value: "velocidad", label: "Velocidad / Rendimiento" },
                      { value: "simetria", label: "Carga y descarga sim\xE9trica" },
                      { value: "soporte", label: "Soporte / Atenci\xF3n" },
                      { value: "escudo", label: "Seguridad / Escudo" },
                      { value: "disponibilidad", label: "Alta disponibilidad" },
                      { value: "nube", label: "Nube / Cloud" },
                      { value: "reloj", label: "24/7 / Tiempo" },
                      { value: "red", label: "Red / Conectividad" },
                      { value: "ahorro", label: "Ahorro / Costo" },
                      { value: "cobertura", label: "Cobertura / Alcance" },
                      { value: "escalabilidad", label: "Escalabilidad" },
                      { value: "generico", label: "Gen\xE9rico" }
                    ]
                  },
                  { name: "title", label: "T\xEDtulo", type: "string" },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          // ── "Casos de uso" (statement rich-text con resaltado) ──
          {
            name: "casosDeUso",
            label: "Casos de uso",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              {
                name: "statement",
                label: "Statement",
                type: "rich-text",
                description: "Usa negrita (bold) para resaltar palabras en magenta."
              }
            ]
          },
          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "T\xEDtulo '\xBFPor qu\xE9 Fiberlux?'",
            type: "string"
          },
          // ── "Preguntas frecuentes" (propio del sub-servicio) ──
          {
            name: "faq",
            label: "Preguntas frecuentes",
            type: "object",
            fields: [
              {
                name: "visible",
                label: "Mostrar secci\xF3n",
                type: "boolean",
                description: "Desact\xEDvalo para ocultar el bloque de preguntas frecuentes en esta p\xE1gina."
              },
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Preguntas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question || "Pregunta" })
                },
                fields: [
                  { name: "question", label: "Pregunta", type: "string" },
                  { name: "answer", label: "Respuesta", type: "rich-text" }
                ]
              }
            ]
          },
          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          {
            name: "hero",
            label: "Hero",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "subtitle",
                label: "Subt\xEDtulo",
                type: "string",
                ui: { component: "textarea" }
              }
            ]
          },
          // ── Misión y Visión ──
          {
            name: "missionVisionTitle",
            label: "T\xEDtulo secci\xF3n Misi\xF3n/Visi\xF3n",
            type: "string"
          },
          {
            name: "mission",
            label: "Misi\xF3n",
            type: "object",
            fields: [
              {
                name: "icon",
                label: "\xCDcono",
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
                  "zap"
                ]
              },
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" }
              }
            ]
          },
          {
            name: "vision",
            label: "Visi\xF3n",
            type: "object",
            fields: [
              {
                name: "icon",
                label: "\xCDcono",
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
                  "chart"
                ]
              },
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" }
              }
            ]
          },
          {
            name: "missionImage",
            label: "Imagen secci\xF3n misi\xF3n/visi\xF3n",
            type: "image"
          },
          // ── Valores ──
          {
            name: "values",
            label: "Valores",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "subtitle",
                label: "Subt\xEDtulo",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "items",
                label: "Valores",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Valor" }) },
                fields: [{ name: "name", label: "Nombre", type: "string" }]
              }
            ]
          },
          // ── Timeline ──
          {
            name: "timeline",
            label: "Timeline",
            type: "object",
            fields: [
              { name: "title", label: "Ant\xEDtulo (eyebrow)", type: "string" },
              { name: "startYear", label: "A\xF1o inicio (etiqueta barra)", type: "string" },
              { name: "endYear", label: "A\xF1o fin (etiqueta barra)", type: "string" },
              {
                name: "milestones",
                label: "Hitos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.year || "Hito" }) },
                fields: [
                  { name: "year", label: "A\xF1o", type: "string" },
                  {
                    name: "heading",
                    label: "Texto del hito",
                    type: "string",
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          // ── Rubros ──
          {
            name: "rubros",
            label: "Rubros (secci\xF3n Nosotros)",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "items",
                label: "Rubros",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Rubro" }) },
                fields: [
                  {
                    name: "icon",
                    label: "\xCDcono",
                    type: "string",
                    options: [
                      { value: "mineria", label: "Miner\xEDa" },
                      { value: "restaurantes", label: "Restaurantes" },
                      { value: "educacion", label: "Educaci\xF3n" },
                      { value: "hoteleria", label: "Hoteler\xEDa" },
                      { value: "salud", label: "Salud / Cl\xEDnicas" },
                      { value: "retail", label: "Retail / Comercio" },
                      { value: "banca", label: "Banca y Finanzas" },
                      { value: "industria", label: "Industria / Manufactura" },
                      { value: "logistica", label: "Log\xEDstica y Transporte" },
                      { value: "gobierno", label: "Gobierno / Sector p\xFAblico" },
                      { value: "construccion", label: "Construcci\xF3n / Inmobiliaria" },
                      { value: "agroindustria", label: "Agroindustria" },
                      { value: "tecnologia", label: "Tecnolog\xEDa / Software" },
                      { value: "energia", label: "Energ\xEDa" },
                      { value: "telecomunicaciones", label: "Telecomunicaciones" },
                      { value: "turismo", label: "Turismo" },
                      { value: "entretenimiento", label: "Entretenimiento" },
                      { value: "corporativo", label: "Corporativo / Oficinas" },
                      { value: "consultoria", label: "Consultor\xEDa" },
                      { value: "servicios", label: "Servicios" }
                    ]
                  },
                  { name: "label", label: "Nombre del rubro", type: "string" },
                  {
                    name: "image",
                    label: "Imagen de fondo (opcional)",
                    type: "image"
                  }
                ]
              }
            ]
          },
          // ── Stats ──
          {
            name: "stats",
            label: "Por qu\xE9 Fiberlux",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "items",
                label: "Stats",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
                fields: [
                  { name: "number", label: "N\xFAmero", type: "string" },
                  { name: "label", label: "Etiqueta", type: "string" },
                  { name: "description", label: "Descripci\xF3n", type: "string" }
                ]
              }
            ]
          },
          // ── Equipo ──
          {
            name: "team",
            label: "Nuestro equipo",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "members",
                label: "Miembros",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.name || "Miembro" })
                },
                fields: [
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "role", label: "Cargo", type: "string" },
                  { name: "photo", label: "Foto", type: "image" }
                ]
              }
            ]
          }
        ]
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
            label: "T\xEDtulo",
            type: "string",
            required: true,
            isTitle: true
          },
          {
            name: "excerpt",
            label: "Extracto",
            type: "string",
            ui: { component: "textarea" }
          },
          { name: "coverImage", label: "Imagen de portada", type: "image" },
          { name: "date", label: "Fecha", type: "datetime" },
          { name: "readTime", label: "Tiempo de lectura", type: "string" },
          {
            name: "tags",
            label: "Etiquetas",
            description: "Uno o varios tags del tema. El post aparece en las p\xE1ginas de soluci\xF3n/subservicio cuyos 'Tags del blog a mostrar' incluyan alguno de estos.",
            type: "string",
            list: true,
            options: BLOG_TAG_OPTIONS
          },
          { name: "featured", label: "Destacado", type: "boolean" },
          { name: "body", label: "Contenido", type: "rich-text", isBody: true }
        ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "heading", label: "T\xEDtulo principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "P\xE1rrafo introductorio",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "cards",
            label: "Tarjetas de contacto",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.label || "Tarjeta" })
            },
            fields: [
              {
                name: "icon",
                label: "\xCDcono",
                type: "string",
                options: [
                  { value: "phone", label: "Tel\xE9fono" },
                  { value: "email", label: "Correo" },
                  { value: "location", label: "Ubicaci\xF3n" }
                ]
              },
              { name: "label", label: "Etiqueta", type: "string" },
              { name: "value", label: "Valor", type: "string" }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         SOPORTE TÉCNICO (página)
         ══════════════════════════════════════ */
      {
        name: "soporteTecnico",
        label: "Soporte T\xE9cnico (p\xE1gina)",
        path: "src/content/soporte-tecnico",
        format: "json",
        ui: {
          router: () => "/soporte-tecnico",
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "heading", label: "T\xEDtulo principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "P\xE1rrafo introductorio",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "splineSceneUrl",
            label: "URL de la escena de Spline (hero)",
            type: "string",
            description: "URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode. Vac\xEDo = sin 3D."
          },
          {
            name: "splinePosterUrl",
            label: "Poster est\xE1tico de la escena (respaldo)",
            type: "image",
            description: "Captura PNG de la escena. Se muestra en equipos d\xE9biles / red lenta / reduce-motion en vez del 3D, y como base mientras carga."
          },
          // ── Sección Soporte Técnico (acordeón) ──
          { name: "sectionTitle", label: "T\xEDtulo de secci\xF3n", type: "string" },
          {
            name: "sectionSubtitle",
            label: "Subt\xEDtulo de secci\xF3n",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "channels",
            label: "Canales de contacto",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.title || "Canal" })
            },
            fields: [
              {
                name: "type",
                label: "Tipo",
                type: "string",
                options: [
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "call", label: "Llamada" },
                  { value: "email", label: "Correo" }
                ]
              },
              { name: "tabLabel", label: "Etiqueta de pesta\xF1a", type: "string" },
              { name: "title", label: "T\xEDtulo del panel", type: "string" },
              {
                name: "subtitle",
                label: "Subt\xEDtulo del panel",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "defaultOpen", label: "Abierto por defecto", type: "boolean" },
              {
                name: "rows",
                label: "Filas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label || "Fila" })
                },
                fields: [
                  { name: "label", label: "Etiqueta", type: "string" },
                  {
                    name: "value",
                    label: "Valor (tel\xE9fono / WhatsApp / correo)",
                    type: "string"
                  },
                  { name: "optionLabel", label: "Texto opci\xF3n (solo visual)", type: "string" },
                  { name: "message", label: "Mensaje pre-cargado (solo WhatsApp)", type: "string" }
                ]
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         SERVICIOS (página landing)
         ══════════════════════════════════════ */
      {
        name: "servicios",
        label: "Servicios (p\xE1gina)",
        path: "src/content/servicios",
        format: "json",
        ui: {
          router: () => "/servicios",
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "heading", label: "T\xEDtulo principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "P\xE1rrafo introductorio",
            type: "string",
            ui: { component: "textarea" }
          },
          { name: "ctaLabel", label: "Texto del bot\xF3n del hero", type: "string" },
          {
            name: "splineSceneUrl",
            label: "URL de la escena de Spline (hero)",
            type: "string",
            description: "URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode. Vac\xEDo = sin 3D."
          },
          {
            name: "splinePosterUrl",
            label: "Poster est\xE1tico de la escena (respaldo)",
            type: "image",
            description: "Captura PNG de la escena. Se muestra en equipos d\xE9biles / red lenta / reduce-motion en vez del 3D, y como base mientras carga."
          },
          // ── Bloque de formulario ──
          { name: "formTitle", label: "T\xEDtulo del bloque de formulario", type: "string" },
          {
            name: "formSubtitle",
            label: "Subt\xEDtulo del bloque de formulario",
            type: "string",
            ui: { component: "textarea" }
          }
        ]
      },
      /* ══════════════════════════════════════
         CASOS DE ÉXITO (página)
         ══════════════════════════════════════ */
      {
        name: "casosDeExito",
        label: "Casos de \xE9xito (p\xE1gina)",
        path: "src/content/casos-de-exito",
        format: "json",
        ui: {
          router: () => "/casos-de-exito",
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          {
            name: "heading",
            label: "T\xEDtulo principal (H1)",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "intro",
            label: "P\xE1rrafo introductorio",
            type: "string",
            ui: { component: "textarea" }
          },
          { name: "heroImage", label: "Imagen de fondo del hero", type: "image" },
          // ── Sección carrusel ──
          { name: "sectionTitle", label: "T\xEDtulo de la secci\xF3n", type: "string" },
          {
            name: "items",
            label: "Casos",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.author || "Caso de \xE9xito" })
            },
            fields: [
              { name: "poster", label: "Poster del video (imagen)", type: "image" },
              {
                name: "youtubeUrl",
                label: "URL de YouTube (opcional)",
                type: "string",
                description: "Si se completa, el modal embebe el video de YouTube (tiene prioridad sobre el mp4)."
              },
              {
                name: "videoFile",
                label: "Video mp4 auto-alojado (opcional)",
                type: "image",
                description: "Sube aqu\xED un archivo .mp4. Se usa solo si no hay URL de YouTube."
              },
              { name: "logo", label: "Logo del cliente", type: "image" },
              {
                name: "quote",
                label: "Cita / testimonio",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "author", label: "Nombre del autor", type: "string" },
              { name: "role", label: "Cargo (may\xFAsculas)", type: "string" },
              { name: "badge", label: "Texto del badge", type: "string" }
            ]
          },
          // ── SEO / Meta ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          {
            name: "sectionTitle",
            label: "T\xEDtulo de la secci\xF3n",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "items",
            label: "Certificaciones",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.title || "Certificaci\xF3n" })
            },
            fields: [
              { name: "year", label: "A\xF1o", type: "string" },
              {
                name: "icon",
                label: "\xCDcono",
                type: "string",
                options: [
                  { value: "antisoborno", label: "Antisoborno (escudo-check)" },
                  { value: "seguridad", label: "Seguridad de la informaci\xF3n (candado)" },
                  { value: "calidad", label: "Gesti\xF3n de calidad (medalla)" },
                  { value: "ambiental", label: "Ambiental (hoja)" },
                  { value: "seguridad_st", label: "Seguridad y salud (casco)" },
                  { value: "procesos", label: "Procesos (engranaje)" },
                  { value: "certificado", label: "Certificado (sello)" },
                  { value: "cumplimiento", label: "Cumplimiento (balanza)" }
                ]
              },
              { name: "title", label: "C\xF3digo (ej. ISO 37001)", type: "string" },
              { name: "heading", label: "Categor\xEDa (ej. Sistema Antisoborno)", type: "string" },
              {
                name: "description",
                label: "Descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         FORMAS DE PAGO (página)
         ══════════════════════════════════════ */
      {
        name: "formasDePago",
        label: "Formas de pago (p\xE1gina)",
        path: "src/content/formas-de-pago",
        format: "json",
        ui: {
          router: () => "/formas-de-pago",
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Hero ──
          {
            name: "heading",
            label: "T\xEDtulo (H1)",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "intro",
            label: "P\xE1rrafo intro (opcional)",
            type: "string",
            ui: { component: "textarea" }
          },
          // ── Etiquetas de los selectores ──
          {
            name: "bankSelectLabel",
            label: "Placeholder selector de banco",
            type: "string"
          },
          {
            name: "methodSelectLabel",
            label: "Placeholder selector de m\xE9todo",
            type: "string"
          },
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
                description: 'Ej: "Desde BBVA".'
              },
              // ── Métodos (nivel 2) ──
              {
                name: "methods",
                label: "M\xE9todos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "M\xE9todo" }) },
                fields: [
                  {
                    name: "label",
                    label: "Texto en el dropdown",
                    type: "string",
                    description: 'Ej: "Desde la aplicaci\xF3n".'
                  },
                  // ── Pasos (nivel 3) ──
                  {
                    name: "steps",
                    label: "Pasos",
                    type: "object",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.title || "Paso" })
                    },
                    fields: [
                      { name: "title", label: "T\xEDtulo del paso", type: "string" },
                      {
                        name: "description",
                        label: "Descripci\xF3n",
                        type: "rich-text",
                        description: "Usa negrita (bold) para resaltar palabras en magenta."
                      },
                      {
                        name: "image",
                        label: "Imagen del paso",
                        type: "image"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          // ── Navigation ──
          {
            name: "nav",
            label: "Navegaci\xF3n",
            type: "object",
            fields: [
              {
                name: "links",
                label: "Links del men\xFA",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.text || "Link" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                  {
                    name: "children",
                    label: "Submen\xFA",
                    type: "object",
                    list: true,
                    ui: { itemProps: (item) => ({ label: item?.text || "\xCDtem" }) },
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "url", label: "URL", type: "string" },
                      {
                        name: "children",
                        label: "Sub-servicios (solo mobile)",
                        type: "object",
                        list: true,
                        ui: {
                          itemProps: (item) => ({
                            label: item?.text || "Sub-servicio"
                          })
                        },
                        fields: [
                          { name: "text", label: "Texto", type: "string" },
                          { name: "url", label: "URL", type: "string" }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
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
                  { name: "empresasUrl", label: "URL 'Empresas'", type: "string" },
                  { name: "negociosLabel", label: "Texto 'Negocios'", type: "string" },
                  {
                    name: "negociosUrl",
                    label: "URL 'Negocios' (externa)",
                    type: "string",
                    description: "Se abre en pesta\xF1a nueva. Ej: https://negocios.fiberlux.pe/"
                  },
                  {
                    name: "abonadosLabel",
                    label: "Texto 'Informaci\xF3n a abonados' (solo desktop)",
                    type: "string"
                  },
                  { name: "abonadosUrl", label: "URL 'Informaci\xF3n a abonados'", type: "string" }
                ]
              },
              {
                name: "desktopNav",
                label: "Navbar desktop (orden)",
                type: "object",
                list: true,
                description: "\xCDtems horizontales en desktop. Si el URL coincide con un link de 'Navegaci\xF3n' con submen\xFA, se revela al hover.",
                ui: { itemProps: (item) => ({ label: item?.text || "\xCDtem" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "url", label: "URL", type: "string" }
                ]
              },
              {
                name: "secondaryNav",
                label: "Men\xFA secundario (hamburguesa)",
                type: "object",
                list: true,
                description: "\xCDtems del men\xFA hamburguesa: en desktop abre un panel lateral, en mobile van al final del men\xFA (bajo un divisor). Ej: Formas de pago, Fiberlux App, Portal de trabajo.",
                ui: { itemProps: (item) => ({ label: item?.text || "\xCDtem" }) },
                fields: [
                  { name: "text", label: "Texto", type: "string" },
                  { name: "url", label: "URL", type: "string" },
                  {
                    name: "external",
                    label: "Abrir en pesta\xF1a nueva (externa)",
                    type: "boolean"
                  }
                ]
              }
            ]
          },
          // ── Botón flotante de WhatsApp (global) ──
          {
            name: "whatsapp",
            label: "WhatsApp (bot\xF3n flotante)",
            type: "object",
            fields: [
              {
                name: "phone",
                label: "N\xFAmero (formato internacional, solo d\xEDgitos)",
                type: "string",
                description: "Ej: 51986176790"
              },
              {
                name: "message",
                label: "Mensaje por defecto",
                type: "string",
                ui: { component: "textarea" },
                description: "Mensaje prellenado en p\xE1ginas generales. En p\xE1ginas de servicio/soluci\xF3n se reemplaza autom\xE1ticamente por uno que alude a ese servicio."
              }
            ]
          },
          // ── Footer ──
          {
            name: "footer",
            label: "Footer",
            type: "object",
            fields: [
              { name: "tagline", label: "Tagline", type: "string" },
              {
                name: "copyright",
                label: "Texto de copyright",
                type: "string",
                description: "Usa {year} para insertar el a\xF1o actual autom\xE1ticamente. Ej: \xA9 {year} Fiberlux. Todos los derechos reservados"
              },
              {
                name: "columns",
                label: "Columnas",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Columna" })
                },
                fields: [
                  { name: "title", label: "T\xEDtulo", type: "string" },
                  {
                    name: "links",
                    label: "Links",
                    type: "object",
                    list: true,
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "url", label: "URL", type: "string" }
                    ]
                  }
                ]
              },
              {
                name: "social",
                label: "Redes sociales",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.platform || "Red" })
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
                      "GitHub"
                    ]
                  },
                  { name: "url", label: "URL", type: "string" }
                ]
              },
              { name: "logo", label: "Logo del footer", type: "image" },
              { name: "agencyLogo", label: "Logo de la agencia (cr\xE9dito)", type: "image" },
              {
                name: "agencyUrl",
                label: "URL de la agencia (cr\xE9dito)",
                type: "string",
                description: "Enlace del wordmark de cr\xE9dito en el pie (se abre en pesta\xF1a nueva)."
              }
            ]
          },
          // ── Partners tecnológicos ──
          {
            name: "partners",
            label: "Partners tecnol\xF3gicos",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "logos",
                label: "Logos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.alt || "Logo" }) },
                fields: [
                  { name: "image", label: "Logo", type: "image" },
                  { name: "alt", label: "Alt / Nombre", type: "string" },
                  { name: "url", label: "Enlace (opcional)", type: "string" }
                ]
              }
            ]
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
                label: "Descripci\xF3n por defecto",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "ogImage",
                label: "Imagen OG por defecto",
                type: "image"
              }
            ]
          },
          // ── Scripts globales (head / body) ──
          {
            name: "codeInjection",
            label: "Scripts globales (head / body)",
            type: "object",
            fields: [
              {
                name: "head",
                label: "C\xF3digo en <head>",
                type: "string",
                ui: { component: "textarea" },
                description: "HTML/JS crudo inyectado al final del <head>, en TODAS las p\xE1ginas. Ej: Google Analytics, Meta Pixel, verificaci\xF3n de dominio."
              },
              {
                name: "bodyEnd",
                label: "C\xF3digo antes de </body>",
                type: "string",
                ui: { component: "textarea" },
                description: "HTML/JS crudo inyectado justo antes de </body>, en TODAS las p\xE1ginas. Ej: widget de chat."
              }
            ]
          },
          // ── Bloques HTML por sección ──
          {
            name: "htmlInjections",
            label: "Bloques HTML por secci\xF3n",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.label || "Bloque HTML" })
            },
            fields: [
              { name: "label", label: "Nombre (referencia)", type: "string" },
              { name: "enabled", label: "Activo", type: "boolean" },
              {
                name: "location",
                label: "Ubicaci\xF3n",
                type: "string",
                options: [
                  { value: "home-after-hero", label: "Home \u2014 bajo el hero" },
                  { value: "home-before-footer", label: "Home \u2014 antes del footer" },
                  { value: "solucion-after-hero", label: "Soluci\xF3n \u2014 bajo el hero" },
                  { value: "solucion-before-footer", label: "Soluci\xF3n \u2014 antes del footer" },
                  { value: "subservicio-after-hero", label: "Subservicio \u2014 bajo el hero" },
                  { value: "subservicio-before-footer", label: "Subservicio \u2014 antes del footer" }
                ]
              },
              {
                name: "html",
                label: "HTML",
                type: "string",
                ui: { component: "textarea" },
                description: "HTML crudo que se renderiza en el anclaje elegido. Solo aplica a home y p\xE1ginas de soluci\xF3n/subservicio."
              }
            ]
          }
        ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          {
            name: "enabled",
            label: "Activar modo mantenimiento",
            type: "boolean",
            description: "Al activar, TODAS las p\xE1ginas mostrar\xE1n la pantalla de mantenimiento despu\xE9s del pr\xF3ximo deploy."
          },
          {
            name: "title",
            label: "T\xEDtulo",
            type: "string"
          },
          {
            name: "message",
            label: "Mensaje",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "showContact",
            label: "Mostrar contacto",
            type: "boolean"
          },
          {
            name: "contactText",
            label: "Texto de contacto",
            type: "string"
          },
          {
            name: "contactUrl",
            label: "URL de contacto",
            type: "string"
          }
        ]
      },
      /* ══════════════════════════════════════
         INFORMACIÓN A ABONADOS
         ══════════════════════════════════════ */
      {
        name: "infoAbonados",
        label: "Informaci\xF3n a Abonados",
        path: "src/content/info-abonados",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/informacion-abonados"
        },
        fields: [
          { name: "title", label: "T\xEDtulo de la p\xE1gina", type: "string" },
          {
            name: "description",
            label: "Descripci\xF3n",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "sections",
            label: "Secciones",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title || "Secci\xF3n" }) },
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              { name: "visible", label: "Visible", type: "boolean" },
              {
                name: "documents",
                label: "Documentos",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Documento" })
                },
                fields: [
                  { name: "title", label: "T\xEDtulo", type: "string" },
                  { name: "url", label: "URL del documento", type: "string" },
                  {
                    name: "icon",
                    label: "\xCDcono",
                    type: "string",
                    options: [
                      { value: "document", label: "Documento" },
                      { value: "shield", label: "Escudo (seguridad)" },
                      { value: "scale", label: "Balanza (legal)" },
                      { value: "clipboard", label: "Portapapeles" },
                      { value: "folder", label: "Carpeta" },
                      { value: "certificate", label: "Certificado" }
                    ]
                  },
                  { name: "visible", label: "Visible", type: "boolean" }
                ]
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         CONFIGURACIÓN DE FORMULARIOS (recipients)
         ══════════════════════════════════════ */
      {
        name: "formConfig",
        label: "Configuraci\xF3n de formularios",
        path: "src/content/form-config",
        format: "json",
        ui: {
          allowedActions: { create: false, delete: false }
        },
        fields: [
          {
            name: "forms",
            label: "Formularios",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.label || item?.formType || "Formulario"
              })
            },
            fields: [
              {
                name: "formType",
                label: "Tipo (no modificar)",
                type: "string",
                description: "Identificador interno del formulario. No cambiar."
              },
              {
                name: "label",
                label: "Nombre visible",
                type: "string"
              },
              {
                name: "enabled",
                label: "Activo",
                type: "boolean",
                description: "Si est\xE1 desactivado, el formulario no enviar\xE1 correos."
              },
              {
                name: "recipients",
                label: "Correos destinatarios",
                type: "string",
                list: true,
                description: "Agrega uno o m\xE1s correos. Cada formulario puede tener diferentes destinatarios."
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         FORMULARIOS DINÁMICOS
         ══════════════════════════════════════ */
      {
        name: "dynamicForms",
        label: "Formularios Din\xE1micos",
        path: "src/content/dynamic-forms",
        format: "json",
        ui: {
          router: ({ document }) => {
            const slug = document._sys.filename;
            const routes = {
              reclamo: "/reclamos/reclamo",
              apelacion: "/reclamos/apelacion",
              queja: "/reclamos/queja",
              "libro-reclamaciones": "/legales/libro-reclamaciones"
            };
            return routes[slug] || `/${slug}`;
          }
        },
        fields: [
          /* ── General ── */
          {
            name: "formId",
            label: "ID del formulario",
            type: "string",
            required: true,
            description: "Identificador \xFAnico. Debe coincidir con formType en 'Configuraci\xF3n de formularios' para el env\xEDo de correos."
          },
          {
            name: "formTitle",
            label: "T\xEDtulo del formulario",
            type: "string"
          },
          {
            name: "badge",
            label: "Badge (opcional)",
            type: "string",
            description: "Texto peque\xF1o encima del t\xEDtulo. Solo aplica en estilo Est\xE1ndar."
          },
          {
            name: "description",
            label: "Descripci\xF3n",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "styleVariant",
            label: "Estilo visual",
            type: "string",
            options: [
              { value: "default", label: "Est\xE1ndar (formularios OSIPTEL)" },
              { value: "contact", label: "Contacto (estilo Tailwind, claro)" },
              { value: "contact-dark", label: "Contacto (oscuro / corp)" }
            ],
            description: "Define la apariencia visual del formulario."
          },
          /* ── Submit & Messages ── */
          {
            name: "submitButtonText",
            label: "Texto bot\xF3n enviar",
            type: "string"
          },
          {
            name: "successTitle",
            label: "T\xEDtulo de \xE9xito",
            type: "string",
            description: "T\xEDtulo que se muestra despu\xE9s de enviar exitosamente."
          },
          {
            name: "successMessage",
            label: "Mensaje de \xE9xito",
            type: "string",
            ui: { component: "textarea" }
          },
          {
            name: "errorMessage",
            label: "Mensaje de error (servidor)",
            type: "string",
            description: "Se muestra cuando falla el env\xEDo al servidor."
          },
          {
            name: "validationMessage",
            label: "Mensaje de validaci\xF3n",
            type: "string",
            description: "Se muestra cuando el usuario intenta enviar con campos inv\xE1lidos. Ej: 'Por favor completa los campos marcados en rojo'."
          },
          {
            name: "showCorrelativo",
            label: "Mostrar N\xB0 correlativo",
            type: "boolean",
            description: "Mostrar n\xFAmero de correlativo en la pantalla de \xE9xito (si el servidor lo retorna)."
          },
          /* ── Privacy ── */
          {
            name: "privacyText",
            label: "Texto de privacidad",
            type: "string"
          },
          {
            name: "privacyUrl",
            label: "URL Pol\xEDtica de Privacidad",
            type: "string"
          },
          {
            name: "dataUrl",
            label: "URL Tratamiento de Datos",
            type: "string"
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
                const icons = {
                  section_header: "\u{1F4CC}",
                  divider: "\u2500\u2500",
                  note: "\u{1F4DD}",
                  text: "Aa",
                  email: "\u2709",
                  tel: "\u{1F4DE}",
                  number: "#",
                  textarea: "\xB6",
                  select: "\u25BC",
                  radio: "\u25C9",
                  radioGroup: "\u25C9\u25C9",
                  checkbox: "\u2611",
                  checkboxGroup: "\u2611\u2611",
                  upload: "\u{1F4CE}",
                  currency: "S/",
                  date: "\u{1F4C5}",
                  hidden: "\u{1F441}\u200D\u{1F5E8}"
                };
                const icon = icons[type] || "\u2022";
                return { label: `${icon} ${type} \u2014 ${label}` };
              }
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
                    label: "\u{1F4CC} Encabezado de secci\xF3n"
                  },
                  { value: "divider", label: "\u2500\u2500 Separador" },
                  { value: "note", label: "\u{1F4DD} Nota / Texto" },
                  { value: "text", label: "Texto" },
                  { value: "email", label: "Email" },
                  { value: "tel", label: "Tel\xE9fono" },
                  { value: "number", label: "N\xFAmero" },
                  { value: "textarea", label: "\xC1rea de texto" },
                  { value: "select", label: "Desplegable" },
                  { value: "radio", label: "Radio (inline)" },
                  {
                    value: "radioGroup",
                    label: "Radio (cards con descripci\xF3n)"
                  },
                  { value: "checkbox", label: "Casilla de verificaci\xF3n" },
                  { value: "checkboxGroup", label: "Grupo de casillas" },
                  { value: "upload", label: "Subir archivo" },
                  { value: "currency", label: "Moneda (S/)" },
                  { value: "date", label: "Fecha (d\xEDa/mes/a\xF1o)" },
                  { value: "hidden", label: "Campo oculto" }
                ]
              },
              {
                name: "name",
                label: "Nombre interno",
                type: "string",
                description: "Identificador \xFAnico del campo. Se usa como key en el JSON enviado. Sin espacios ni tildes. Ej: nombreCompleto, tipoDoc, adjuntos."
              },
              {
                name: "label",
                label: "Etiqueta visible",
                type: "string",
                description: "Para section_header es el t\xEDtulo de la secci\xF3n."
              },
              {
                name: "placeholder",
                label: "Placeholder",
                type: "string"
              },
              {
                name: "required",
                label: "Obligatorio",
                type: "boolean"
              },
              {
                name: "width",
                label: "Ancho",
                type: "string",
                options: [
                  { value: "full", label: "Completo (100%)" },
                  { value: "half", label: "Mitad (50%) \u2014 2 por fila" },
                  { value: "third", label: "Tercio (33%) \u2014 3 por fila" }
                ],
                description: "En mobile siempre se muestra al 100%."
              },
              {
                name: "order",
                label: "Orden (desktop)",
                type: "number",
                description: "Orden de aparici\xF3n en desktop. Menor = m\xE1s arriba."
              },
              {
                name: "orderMobile",
                label: "Orden (mobile)",
                type: "number",
                description: "Orden en mobile. Si se deja vac\xEDo, usa el orden de desktop."
              },
              /* ── Campos específicos por tipo ── */
              {
                name: "sectionNumber",
                label: "N\xFAmero de secci\xF3n",
                type: "number",
                description: "Solo para section_header. N\xFAmero que se muestra en el c\xEDrculo."
              },
              {
                name: "noteContent",
                label: "Contenido de nota",
                type: "string",
                ui: { component: "textarea" },
                description: "Solo para note. El texto del p\xE1rrafo."
              },
              {
                name: "rows",
                label: "Filas",
                type: "number",
                description: "Solo para textarea. Default: 4."
              },
              /* ── Validation ── */
              {
                name: "validation",
                label: "Validaci\xF3n",
                type: "object",
                fields: [
                  {
                    name: "minLength",
                    label: "Largo m\xEDnimo",
                    type: "number"
                  },
                  {
                    name: "maxLength",
                    label: "Largo m\xE1ximo",
                    type: "number"
                  },
                  {
                    name: "pattern",
                    label: "Patr\xF3n (regex)",
                    type: "string",
                    description: "Expresi\xF3n regular. Ej: ^\\d{11}$ para RUC de 11 d\xEDgitos, ^\\d{8}$ para DNI."
                  },
                  {
                    name: "patternMessage",
                    label: "Mensaje del patr\xF3n",
                    type: "string",
                    description: "Mensaje cuando el valor no cumple el patr\xF3n. Ej: 'El RUC debe tener 11 d\xEDgitos'."
                  }
                ]
              },
              {
                name: "errorMessage",
                label: "Mensaje de error personalizado",
                type: "string",
                description: "Si se deja vac\xEDo, se genera un mensaje autom\xE1tico seg\xFAn la validaci\xF3n que falle."
              },
              {
                name: "helpText",
                label: "Texto de ayuda",
                type: "string",
                description: "Texto peque\xF1o debajo del campo. Para upload aparece como instrucci\xF3n de archivos."
              },
              {
                name: "defaultValue",
                label: "Valor por defecto",
                type: "string"
              },
              /* ── Options (select, radio, radioGroup, checkboxGroup) ── */
              {
                name: "options",
                label: "Opciones",
                type: "object",
                list: true,
                description: "Para select, radio, radioGroup y checkboxGroup.",
                ui: {
                  itemProps: (item) => ({ label: item?.label || "Opci\xF3n" })
                },
                fields: [
                  { name: "value", label: "Valor", type: "string" },
                  { name: "label", label: "Etiqueta", type: "string" },
                  {
                    name: "group",
                    label: "Grupo / Categor\xEDa",
                    type: "string",
                    description: "Solo para select: agrupa las opciones bajo un encabezado (optgroup). Ej: la categor\xEDa del servicio."
                  },
                  {
                    name: "description",
                    label: "Descripci\xF3n",
                    type: "string",
                    description: "Solo para radioGroup (aparece debajo del t\xEDtulo en la tarjeta)."
                  }
                ]
              },
              /* ── Upload config ── */
              {
                name: "accept",
                label: "Tipos de archivo",
                type: "string",
                description: "Solo para upload. Ej: .pdf,.jpg,.png,.doc,.docx"
              },
              {
                name: "maxFileSize",
                label: "Tama\xF1o m\xE1ximo (MB)",
                type: "number",
                description: "Solo para upload."
              },
              {
                name: "multiple",
                label: "M\xFAltiples archivos",
                type: "boolean",
                description: "Solo para upload. Default: true."
              },
              {
                name: "linkText",
                label: "Texto del enlace",
                type: "string",
                description: "Solo para checkbox. Parte del label que se convierte en enlace. Ej: 'Pol\xEDtica de Privacidad'."
              },
              {
                name: "linkUrl",
                label: "URL del enlace",
                type: "string",
                description: "Solo para checkbox. URL a la que apunta el enlace."
              },
              /* ── Conditional ── */
              {
                name: "conditionalField",
                label: "Campo condicional",
                type: "object",
                description: "Solo mostrar este campo si otro campo tiene un valor espec\xEDfico.",
                fields: [
                  {
                    name: "dependsOn",
                    label: "Depende del campo (nombre interno)",
                    type: "string",
                    description: "El 'name' del campo del cual depende."
                  },
                  {
                    name: "showWhen",
                    label: "Mostrar cuando el valor es",
                    type: "string",
                    description: "Valor exacto. Para checkbox usa 'true' o 'false'."
                  }
                ]
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         LEGALES (páginas de contenido)
         ══════════════════════════════════════ */
      {
        name: "legal",
        label: "Legales (p\xE1ginas de contenido)",
        path: "src/content/legal",
        format: "json",
        ui: {
          router: ({ document }) => `/legales/${document._sys.filename}`
        },
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "string" },
          {
            name: "title",
            label: "T\xEDtulo (H1)",
            type: "string",
            isTitle: true,
            required: true
          },
          { name: "updatedAt", label: "\xDAltima actualizaci\xF3n", type: "datetime" },
          { name: "body", label: "Contenido", type: "rich-text" },
          {
            name: "embeddedFormSlug",
            label: "Formulario embebido (slug dynamicForms)",
            type: "string",
            description: "Opcional. Si se define, incrusta ese formulario din\xE1mico debajo del contenido. Ej: derechos-arco."
          },
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
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
          { name: "title", label: "T\xEDtulo del modal", type: "string" },
          { name: "intro", label: "Texto introductorio", type: "rich-text" },
          {
            name: "showMoreText",
            label: "Texto del enlace 'Mostrar m\xE1s'",
            type: "string"
          },
          {
            name: "showMoreUrl",
            label: "URL 'Mostrar m\xE1s'",
            type: "string"
          },
          { name: "btnReject", label: "Texto bot\xF3n rechazar", type: "string" },
          { name: "btnSave", label: "Texto bot\xF3n guardar", type: "string" },
          { name: "btnAccept", label: "Texto bot\xF3n aceptar", type: "string" },
          {
            name: "alwaysActiveLabel",
            label: "Etiqueta 'siempre activa'",
            type: "string"
          },
          {
            name: "categories",
            label: "Categor\xEDas",
            type: "object",
            list: true,
            ui: { itemProps: (c) => ({ label: c?.name || "Categor\xEDa" }) },
            fields: [
              { name: "key", label: "Clave", type: "string" },
              { name: "name", label: "Nombre", type: "string" },
              {
                name: "description",
                label: "Descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "alwaysActive",
                label: "Siempre activa",
                type: "boolean"
              }
            ]
          }
        ]
      },
      /* ══════════════════════════════════════
         PÁGINA FIBERLUX APP  (/fiberlux-app)
         ══════════════════════════════════════ */
      {
        name: "fiberluxApp",
        label: "P\xE1gina Fiberlux App",
        path: "src/content/fiberlux-app",
        format: "json",
        ui: {
          router: () => "/fiberlux-app",
          allowedActions: { create: false, delete: false }
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
                  { value: "imagen", label: "Imagen" }
                ]
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
                  { name: "title", label: "T\xEDtulo (negrita)", type: "string" },
                  { name: "text", label: "Texto", type: "string" }
                ]
              },
              {
                name: "downloadText",
                label: "Texto 'B\xFAscanos como\u2026'",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "androidUrl", label: "URL Play Store (Android)", type: "string" },
              { name: "iosUrl", label: "URL App Store (iOS)", type: "string" },
              { name: "mockup", label: "Imagen del tel\xE9fono", type: "image" },
              // ── Modo imagen (SPEC 60) ──
              { name: "imageMobile", label: "Imagen mobile (\u2264600px)", type: "image" },
              { name: "imageTablet", label: "Imagen tablet (\u22641024px)", type: "image" },
              { name: "imageDesktop", label: "Imagen desktop", type: "image" },
              {
                name: "bgColor",
                label: "Color de fondo (modo imagen)",
                type: "string",
                ui: { component: "color" }
              }
            ]
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
                label: "Descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "note",
                label: "Bajada en contenedor",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "mockup",
                label: "Mockup app (imagen celular)",
                type: "image"
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
                    options: ["appstore", "googleplay"]
                  },
                  { name: "label", label: "Texto", type: "string" },
                  { name: "url", label: "URL", type: "string" }
                ]
              }
            ]
          },
          // ── "Beneficios" ──
          {
            name: "beneficios",
            label: "Beneficios",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo de secci\xF3n", type: "string" },
              {
                name: "items",
                label: "Cards",
                type: "object",
                list: true,
                ui: { itemProps: (i) => ({ label: i?.text || "Beneficio" }) },
                fields: [
                  {
                    name: "icon",
                    label: "\xCDcono",
                    type: "string",
                    options: [
                      "monitoreo",
                      "sedes",
                      "diagnostico",
                      "reloj",
                      "red",
                      "escudo",
                      "grafico",
                      "generico"
                    ]
                  },
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          // ── "Casos de uso" ──
          {
            name: "casosDeUso",
            label: "Casos de uso",
            type: "object",
            fields: [
              { name: "eyebrow", label: "Eyebrow", type: "string" },
              { name: "statement", label: "Statement", type: "rich-text" }
            ]
          },
          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "T\xEDtulo '\xBFPor qu\xE9 Fiberlux?'",
            type: "string"
          },
          // ── SEO / meta (cae a global.seo si vacío) ──
          {
            name: "seo",
            label: "SEO / Meta",
            type: "object",
            fields: [
              { name: "metaTitle", label: "Meta t\xEDtulo", type: "string" },
              {
                name: "metaDescription",
                label: "Meta descripci\xF3n",
                type: "string",
                ui: { component: "textarea" }
              },
              { name: "ogImage", label: "Imagen OG", type: "image" }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
