// tina/config.ts
import { defineConfig } from "tinacms";
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
      mediaRoot: "uploads",
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
            label: "Nuestra red en cifras",
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
        label: "Servicios",
        path: "src/content/services",
        format: "json",
        ui: {
          filename: {
            slugify: (values) => (values?.title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          }
        },
        fields: [
          {
            name: "title",
            label: "Nombre del servicio",
            type: "string",
            required: true,
            isTitle: true
          },
          { name: "slug", label: "URL slug", type: "string", required: true },
          {
            name: "heroSubtitle",
            label: "Subt\xEDtulo del hero",
            type: "string",
            ui: { component: "textarea" }
          },
          // ── Grilla magenta ──
          {
            name: "features",
            label: "Caracter\xEDsticas (grilla magenta)",
            type: "object",
            fields: [
              {
                name: "sectionTitle",
                label: "T\xEDtulo de secci\xF3n",
                type: "string"
              },
              {
                name: "sectionSubtitle",
                label: "Subt\xEDtulo",
                type: "string",
                ui: { component: "textarea" }
              },
              {
                name: "items",
                label: "Features",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Feature" }),
                  max: 6
                },
                fields: [
                  { name: "icon", label: "\xCDcono", type: "image" },
                  { name: "title", label: "T\xEDtulo", type: "string" },
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
          // ── Sección servicios expandibles ──
          {
            name: "expandableServices",
            label: "Servicios expandibles",
            type: "object",
            fields: [
              { name: "sectionTitle", label: "T\xEDtulo", type: "string" },
              {
                name: "items",
                label: "Items",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Tab" }) },
                fields: [
                  { name: "icon", label: "\xCDcono", type: "image" },
                  { name: "title", label: "T\xEDtulo", type: "string" },
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
          // ── ¿Por qué elegirnos? ──
          {
            name: "whyUs",
            label: "\xBFPor qu\xE9 elegirnos?",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              { name: "subtitle", label: "Subt\xEDtulo", type: "string" },
              {
                name: "cards",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Card" }),
                  max: 4
                },
                fields: [
                  { name: "icon", label: "\xCDcono", type: "image" },
                  { name: "title", label: "T\xEDtulo", type: "string" },
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
          // ── Stats bar ──
          {
            name: "stats",
            label: "Barra de estad\xEDsticas",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
            fields: [
              { name: "number", label: "N\xFAmero", type: "string" },
              { name: "label", label: "Etiqueta", type: "string" }
            ]
          },
          // ── Checklist ──
          {
            name: "checklist",
            label: "Caracter\xEDsticas (checklist)",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              { name: "items", label: "Items", type: "string", list: true }
            ]
          },
          // ── Expertos ──
          {
            name: "experts",
            label: "Secci\xF3n expertos",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo", type: "string" },
              {
                name: "steps",
                label: "Pasos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Paso" }) },
                fields: [
                  { name: "number", label: "N\xFAmero", type: "string" },
                  { name: "title", label: "T\xEDtulo", type: "string" },
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
          // ── Formulario config ──
          {
            name: "contactForm",
            label: "Formulario de contacto",
            type: "object",
            fields: [
              { name: "title", label: "T\xEDtulo del formulario", type: "string" },
              { name: "subtitle", label: "Subt\xEDtulo", type: "string" },
              { name: "buttonText", label: "Texto del bot\xF3n", type: "string" }
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
              { name: "title", label: "T\xEDtulo", type: "string" },
              { name: "startYear", label: "A\xF1o inicio", type: "string" },
              { name: "endYear", label: "A\xF1o fin", type: "string" }
            ]
          },
          // ── Stats ──
          {
            name: "stats",
            label: "Nuestra red en cifras",
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
            type: "string",
            list: true,
            options: [
              "Redes",
              "Big data",
              "Centro de datos",
              "Ciberseguridad",
              "Cloud",
              "Conectividad",
              "Internet",
              "ISPs",
              "SaaS"
            ]
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
          allowedActions: { create: false, delete: false }
        },
        fields: [
          { name: "title", label: "T\xEDtulo", type: "string" },
          {
            name: "subtitle",
            label: "Subt\xEDtulo",
            type: "string",
            ui: { component: "textarea" }
          },
          { name: "email", label: "Email de contacto", type: "string" },
          { name: "phone", label: "Tel\xE9fono", type: "string" },
          {
            name: "address",
            label: "Direcci\xF3n",
            type: "string",
            ui: { component: "textarea" }
          },
          { name: "buttonText", label: "Texto del bot\xF3n", type: "string" }
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
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "url", label: "URL", type: "string" }
                    ]
                  }
                ]
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
              { name: "logo", label: "Logo del footer", type: "image" }
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
              { value: "contact", label: "Contacto (estilo Tailwind)" }
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
      }
    ]
  }
});
export {
  config_default as default
};
