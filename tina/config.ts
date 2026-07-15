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
                type: "image",
                name: "splinePosterUrl",
                label: "Poster estático de la escena (respaldo)",
                description:
                  "Captura PNG de la escena. Se muestra en equipos débiles / red lenta / reduce-motion en vez del 3D, y como base mientras carga.",
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
            label: "Por qué Fiberlux",
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
          { name: "slug", label: "URL slug", type: "string", required: true },

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
              {
                name: "intro",
                label: "Párrafo intro",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "ctaLabel",
                label: "Texto botón (ancla al catálogo)",
                type: "string",
              },
              {
                name: "formTitle",
                label: "Título del form del hero",
                type: "string",
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
              {
                name: "subtitle",
                label: "Subtítulo de sección",
                type: "string",
                ui: { component: "textarea" },
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
                  {
                    name: "text",
                    label: "Texto",
                    type: "string",
                    ui: { component: "textarea" },
                  },
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
                      { value: "generico", label: "Genérico" },
                    ],
                  },
                  { name: "title", label: "Título", type: "string" },
                  {
                    name: "description",
                    label: "Descripción (se revela en hover)",
                    type: "string",
                    ui: { component: "textarea" },
                  },
                  { name: "buttonLabel", label: "Texto del botón", type: "string" },
                  {
                    name: "url",
                    label: "URL (placeholder → nivel-2)",
                    type: "string",
                  },
                  {
                    name: "colSpan",
                    label: "Columnas que ocupa (desktop)",
                    type: "string",
                    options: [
                      { value: "1", label: "1 columna" },
                      { value: "2", label: "2 columnas" },
                      { value: "3", label: "3 columnas (ancho completo)" },
                    ],
                  },
                  {
                    name: "featured",
                    label: "Destacado (fondo magenta + descripción visible)",
                    type: "boolean",
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
              { name: "title", label: "Título", type: "string" },
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
                  { name: "answer", label: "Respuesta", type: "rich-text" },
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
          { name: "slug", label: "URL slug", type: "string", required: true },
          {
            name: "solucionSlug",
            label: "Solución padre (slug)",
            type: "string",
            required: true,
            options: [
              { value: "conectividad-empresarial", label: "Conectividad Empresarial" },
              { value: "ciberseguridad-gestionada", label: "Ciberseguridad Gestionada" },
              { value: "data-center-cloud", label: "Data Center, Cloud y Continuidad" },
              { value: "servicios-gestionados", label: "Servicios Gestionados" },
            ],
          },
          {
            name: "solucionTitle",
            label: "Solución padre (nombre para breadcrumb)",
            type: "string",
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
              {
                name: "intro",
                label: "Párrafo intro",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "note",
                label: "Caja de nota",
                type: "string",
                ui: { component: "textarea" },
              },
              {
                name: "ctaLabel",
                label: "Texto botón (ancla al form inferior)",
                type: "string",
              },
              {
                name: "formTitle",
                label: "Título del form del hero",
                type: "string",
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
              {
                name: "items",
                label: "Cards",
                type: "object",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Beneficio" }),
                },
                fields: [
                  {
                    name: "icon",
                    label: "Ícono",
                    type: "string",
                    options: [
                      { value: "velocidad", label: "Velocidad / Rendimiento" },
                      { value: "simetria", label: "Carga y descarga simétrica" },
                      { value: "soporte", label: "Soporte / Atención" },
                      { value: "escudo", label: "Seguridad / Escudo" },
                      { value: "disponibilidad", label: "Alta disponibilidad" },
                      { value: "nube", label: "Nube / Cloud" },
                      { value: "reloj", label: "24/7 / Tiempo" },
                      { value: "red", label: "Red / Conectividad" },
                      { value: "ahorro", label: "Ahorro / Costo" },
                      { value: "cobertura", label: "Cobertura / Alcance" },
                      { value: "escalabilidad", label: "Escalabilidad" },
                      { value: "generico", label: "Genérico" },
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
            ],
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
                description:
                  "Usa negrita (bold) para resaltar palabras en magenta.",
              },
            ],
          },

          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "Título '¿Por qué Fiberlux?'",
            type: "string",
          },

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
                  { name: "answer", label: "Respuesta", type: "rich-text" },
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
              { name: "title", label: "Antítulo (eyebrow)", type: "string" },
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
          { name: "heading", label: "Título principal (H1)", type: "string", ui: { component: "textarea" } },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "splineSceneUrl",
            label: "URL de la escena de Spline (hero)",
            type: "string",
            description:
              "URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode. Vacío = sin 3D.",
          },
          {
            name: "splinePosterUrl",
            label: "Poster estático de la escena (respaldo)",
            type: "image",
            description:
              "Captura PNG de la escena. Se muestra en equipos débiles / red lenta / reduce-motion en vez del 3D, y como base mientras carga.",
          },

          // ── Sección Soporte Técnico (acordeón) ──
          { name: "sectionTitle", label: "Título de sección", type: "string" },
          {
            name: "sectionSubtitle",
            label: "Subtítulo de sección",
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
              { name: "title", label: "Título del panel", type: "string" },
              {
                name: "subtitle",
                label: "Subtítulo del panel",
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
            name: "splineSceneUrl",
            label: "URL de la escena de Spline (hero)",
            type: "string",
            description:
              "URL .splinecode exportada desde Spline. Formato: https://prod.spline.design/XXXX/scene.splinecode. Vacío = sin 3D.",
          },
          {
            name: "splinePosterUrl",
            label: "Poster estático de la escena (respaldo)",
            type: "image",
            description:
              "Captura PNG de la escena. Se muestra en equipos débiles / red lenta / reduce-motion en vez del 3D, y como base mientras carga.",
          },

          // ── Bloque de formulario ──
          { name: "formTitle", label: "Título del bloque de formulario", type: "string" },
          {
            name: "formSubtitle",
            label: "Subtítulo del bloque de formulario",
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
          {
            name: "heading",
            label: "Título principal (H1)",
            type: "string",
            ui: { component: "textarea" },
          },
          {
            name: "intro",
            label: "Párrafo introductorio",
            type: "string",
            ui: { component: "textarea" },
          },
          { name: "heroImage", label: "Imagen de fondo del hero", type: "image" },

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
              { name: "author", label: "Nombre del autor", type: "string" },
              { name: "role", label: "Cargo (mayúsculas)", type: "string" },
              { name: "badge", label: "Texto del badge", type: "string" },
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
            name: "items",
            label: "Certificaciones",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.title || "Certificación" }),
            },
            fields: [
              { name: "year", label: "Año", type: "string" },
              {
                name: "icon",
                label: "Ícono",
                type: "string",
                options: [
                  { value: "antisoborno", label: "Antisoborno (escudo-check)" },
                  { value: "seguridad", label: "Seguridad de la información (candado)" },
                  { value: "calidad", label: "Gestión de calidad (medalla)" },
                  { value: "ambiental", label: "Ambiental (hoja)" },
                  { value: "seguridad_st", label: "Seguridad y salud (casco)" },
                  { value: "procesos", label: "Procesos (engranaje)" },
                  { value: "certificado", label: "Certificado (sello)" },
                  { value: "cumplimiento", label: "Cumplimiento (balanza)" },
                ],
              },
              { name: "title", label: "Código (ej. ISO 37001)", type: "string" },
              { name: "heading", label: "Categoría (ej. Sistema Antisoborno)", type: "string" },
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
          {
            name: "intro",
            label: "Párrafo intro (opcional)",
            type: "string",
            ui: { component: "textarea" },
          },

          // ── Etiquetas de los selectores ──
          {
            name: "bankSelectLabel",
            label: "Placeholder selector de banco",
            type: "string",
          },
          {
            name: "methodSelectLabel",
            label: "Placeholder selector de método",
            type: "string",
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
                description: 'Ej: "Desde BBVA".',
              },

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
                      {
                        name: "description",
                        label: "Descripción",
                        type: "rich-text",
                        description:
                          "Usa negrita (bold) para resaltar palabras en magenta.",
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
                    ui: { itemProps: (item) => ({ label: item?.text || "Ítem" }) },
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
                            label: item?.text || "Sub-servicio",
                          }),
                        },
                        fields: [
                          { name: "text", label: "Texto", type: "string" },
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
                  { name: "empresasUrl", label: "URL 'Empresas'", type: "string" },
                  { name: "negociosLabel", label: "Texto 'Negocios'", type: "string" },
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
                  { name: "url", label: "URL", type: "string" },
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
              { name: "agencyLogo", label: "Logo de la agencia (crédito)", type: "image" },
              {
                name: "agencyUrl",
                label: "URL de la agencia (crédito)",
                type: "string",
                description:
                  "Enlace del wordmark de crédito en el pie (se abre en pestaña nueva).",
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
              { name: "title", label: "Título", type: "string" },
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
                    name: "group",
                    label: "Grupo / Categoría",
                    type: "string",
                    description:
                      "Solo para select: agrupa las opciones bajo un encabezado (optgroup). Ej: la categoría del servicio.",
                  },
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
          {
            name: "title",
            label: "Título (H1)",
            type: "string",
            isTitle: true,
            required: true,
          },
          { name: "updatedAt", label: "Última actualización", type: "datetime" },
          { name: "body", label: "Contenido", type: "rich-text" },
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
              {
                name: "note",
                label: "Bajada en contenedor",
                type: "string",
                ui: { component: "textarea" },
              },
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
                ],
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
              { name: "statement", label: "Statement", type: "rich-text" },
            ],
          },

          // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
          {
            name: "whyUsTitle",
            label: "Título '¿Por qué Fiberlux?'",
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
