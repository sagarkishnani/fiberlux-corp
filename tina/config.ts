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
          router: () => "/contacto",
          allowedActions: { create: false, delete: false },
        },
        fields: [
          { name: "breadcrumb", label: "Migaja de pan (breadcrumb)", type: "string" },
          { name: "heading", label: "Título principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
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
              { name: "value", label: "Valor", type: "string" },
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
                name: "copyright",
                label: "Texto de copyright",
                type: "string",
                description:
                  "Usa {year} para insertar el año actual automáticamente. Ej: © {year} Fiberlux. Todos los derechos reservados",
              },
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
          {
            name: "description",
            label: "Descripción",
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
            name: "styleVariant",
            label: "Estilo visual",
            type: "string",
            options: [
              { value: "default", label: "Estándar (formularios OSIPTEL)" },
              { value: "contact", label: "Contacto (estilo Tailwind)" },
            ],
            description: "Define la apariencia visual del formulario.",
          },

          /* ── Submit & Messages ── */
          {
            name: "submitButtonText",
            label: "Texto botón enviar",
            type: "string",
          },
          {
            name: "successTitle",
            label: "Título de éxito",
            type: "string",
            description:
              "Título que se muestra después de enviar exitosamente.",
          },
          {
            name: "successMessage",
            label: "Mensaje de éxito",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "errorMessage",
            label: "Mensaje de error (servidor)",
            type: "string",
            description: "Se muestra cuando falla el envío al servidor.",
          },
          {
            name: "validationMessage",
            label: "Mensaje de validación",
            type: "string",
            description:
              "Se muestra cuando el usuario intenta enviar con campos inválidos. Ej: 'Por favor completa los campos marcados en rojo'.",
          },
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
                  { value: "tel", label: "Teléfono" },
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
              {
                name: "placeholder",
                label: "Placeholder",
                type: "string",
              },
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
                ],
              },
              {
                name: "errorMessage",
                label: "Mensaje de error personalizado",
                type: "string",
                description:
                  "Si se deja vacío, se genera un mensaje automático según la validación que falle.",
              },
              {
                name: "helpText",
                label: "Texto de ayuda",
                type: "string",
                description:
                  "Texto pequeño debajo del campo. Para upload aparece como instrucción de archivos.",
              },
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
                  {
                    name: "description",
                    label: "Descripción",
                    type: "string",
                    description:
                      "Solo para radioGroup (aparece debajo del título en la tarjeta).",
                  },
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
    ],
  },
});
