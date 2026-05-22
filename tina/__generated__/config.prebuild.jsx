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
      }
    ]
  }
});
export {
  config_default as default
};
