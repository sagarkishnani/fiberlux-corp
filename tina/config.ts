import { defineConfig } from "tinacms";

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
      mediaRoot: "uploads",
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
              {
                type: "string",
                name: "subtitle",
                label: "Subtítulo",
                ui: { component: "textarea" },
                description: "Frase de apoyo bajo el título. ≤ 140 caracteres.",
              },
              {
                type: "string",
                name: "splineSceneUrl",
                label: "URL de la escena de Spline",
                description:
                  "Pega aquí la URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode",
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
            ],
          },

          // ── Servicios ──
          {
            name: "services",
            label: "Servicios",
            type: "object",
            fields: [
              { name: "title", label: "Título de sección", type: "string" },
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
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  {
                    name: "icon",
                    label: "Ícono (SVG o imagen)",
                    type: "image",
                  },
                  {
                    name: "bullets",
                    label: "Bullets",
                    type: "string",
                    list: true,
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
                name: "sectionTitle",
                label: "Título de sección",
                type: "string",
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
                  {
                    name: "description",
                    label: "Descripción extendida",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "name", label: "Nombre", type: "string" },
                  { name: "role", label: "Cargo", type: "string" },
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
            label: "Nuestra red en cifras",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              {
                name: "items",
                label: "Estadísticas",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
                fields: [
                  { name: "number", label: "Número", type: "string" },
                  { name: "label", label: "Etiqueta superior", type: "string" },
                  { name: "description", label: "Descripción", type: "string" },
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
              { name: "buttonText", label: "Texto del botón", type: "string" },
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
        label: "Servicios",
        path: "src/content/services",
        format: "json",
        ui: {
          filename: {
            slugify: (values) =>
              (values?.title || "")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
          },
        },
        fields: [
          {
            name: "title",
            label: "Nombre del servicio",
            type: "string",
            required: true,
            isTitle: true,
          },
          { name: "slug", label: "URL slug", type: "string", required: true },
          {
            name: "heroSubtitle",
            label: "Subtítulo del hero",
            type: "string",
            ui: { component: "textarea" },
          },

          // ── Grilla magenta ──
          {
            name: "features",
            label: "Características (grilla magenta)",
            type: "object",
            fields: [
              {
                name: "sectionTitle",
                label: "Título de sección",
                type: "string",
              },
              {
                name: "sectionSubtitle",
                label: "Subtítulo",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "items",
                label: "Features",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Feature" }),
                  max: 6,
                },
                fields: [
                  { name: "icon", label: "Ícono", type: "image" },
                  { name: "title", label: "Título", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── Sección servicios expandibles ──
          {
            name: "expandableServices",
            label: "Servicios expandibles",
            type: "object",
            fields: [
              { name: "sectionTitle", label: "Título", type: "string" },
              {
                name: "items",
                label: "Items",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Tab" }) },
                fields: [
                  { name: "icon", label: "Ícono", type: "image" },
                  { name: "title", label: "Título", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── ¿Por qué elegirnos? ──
          {
            name: "whyUs",
            label: "¿Por qué elegirnos?",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "subtitle", label: "Subtítulo", type: "string" },
              {
                name: "cards",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Card" }),
                  max: 4,
                },
                fields: [
                  { name: "icon", label: "Ícono", type: "image" },
                  { name: "title", label: "Título", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── Stats bar ──
          {
            name: "stats",
            label: "Barra de estadísticas",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.label || "Stat" }) },
            fields: [
              { name: "number", label: "Número", type: "string" },
              { name: "label", label: "Etiqueta", type: "string" },
            ],
          },

          // ── Checklist ──
          {
            name: "checklist",
            label: "Características (checklist)",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "items", label: "Items", type: "string", list: true },
            ],
          },

          // ── Expertos ──
          {
            name: "experts",
            label: "Sección expertos",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              {
                name: "steps",
                label: "Pasos",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "Paso" }) },
                fields: [
                  { name: "number", label: "Número", type: "string" },
                  { name: "title", label: "Título", type: "string" },
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                ],
              },
            ],
          },

          // ── Formulario config ──
          {
            name: "contactForm",
            label: "Formulario de contacto",
            type: "object",
            fields: [
              { name: "title", label: "Título del formulario", type: "string" },
              { name: "subtitle", label: "Subtítulo", type: "string" },
              { name: "buttonText", label: "Texto del botón", type: "string" },
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
              {
                name: "subtitle",
                label: "Subtítulo",
                type: "string",
                ui: { component: "textarea" },
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
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" },
              },
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
              {
                name: "text",
                label: "Texto",
                type: "string",
                ui: { component: "textarea" },
              },
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
              {
                name: "subtitle",
                label: "Subtítulo",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "items",
                label: "Valores",
                type: "object",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Valor" }) },
                fields: [{ name: "name", label: "Nombre", type: "string" }],
              },
            ],
          },

          // ── Timeline ──
          {
            name: "timeline",
            label: "Timeline",
            type: "object",
            fields: [
              { name: "title", label: "Título", type: "string" },
              { name: "startYear", label: "Año inicio", type: "string" },
              { name: "endYear", label: "Año fin", type: "string" },
            ],
          },

          // ── Stats ──
          {
            name: "stats",
            label: "Nuestra red en cifras",
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
          {
            name: "excerpt",
            label: "Extracto",
            type: "string",
            ui: { component: "textarea" },
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
              "SaaS",
            ],
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
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { name: "title", label: "Título", type: "string" },
          {
            name: "subtitle",
            label: "Subtítulo",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "email", label: "Email de contacto", type: "string" },
          { name: "phone", label: "Teléfono", type: "string" },
          {
            name: "address",
            label: "Dirección",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "buttonText", label: "Texto del botón", type: "string" },
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
                  { name: "url", label: "URL", type: "string" },
                  {
                    name: "children",
                    label: "Submenú",
                    type: "object",
                    list: true,
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "url", label: "URL", type: "string" },
                    ],
                  },
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
                  {
                    name: "links",
                    label: "Links",
                    type: "object",
                    list: true,
                    fields: [
                      { name: "text", label: "Texto", type: "string" },
                      { name: "url", label: "URL", type: "string" },
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
        ],
      },
    ],
  },
});
