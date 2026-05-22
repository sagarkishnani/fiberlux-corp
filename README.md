# Fiberlux Corporativo

Sitio web corporativo de **Fiberlux**, empresa peruana de soluciones de conectividad y TI empresarial. Construido con Astro, React, TailwindCSS y TinaCMS como headless CMS.

> ⚠️ **Proyecto en desarrollo activo.**

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Astro 5](https://astro.build/) (SSG con islas de interactividad) |
| UI Components | [React 19](https://react.dev/) (hidratación parcial vía `client:load` / `client:visible`) |
| Estilos | [Tailwind CSS 3](https://tailwindcss.com/) + `@tailwindcss/typography` |
| CMS | [TinaCMS 2](https://tina.io/) (Git-backed, edición visual) |
| Animaciones 3D | [Spline](https://spline.design/) (hero home con escena 3D interactiva) |
| Smooth Scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Iconos | [React Icons](https://react-icons.github.io/react-icons/) |
| Lenguaje | TypeScript (strict) |

---

## Estructura del Proyecto

```
fiberlux-corporativo/
├── astro-tina-directive/     # Directiva Astro custom para integrar TinaCMS
│   ├── client-tina.mjs
│   └── index.mjs
├── public/
│   ├── admin/                # Panel de administración TinaCMS
│   └── images/               # Assets estáticos (logo, blog, patrones SVG)
├── src/
│   ├── components/
│   │   ├── blog/             # BlogCard, BlogGrid, BlogHero, BlogDetail, BlogPreview
│   │   ├── home/             # HeroHome (Astro + React, escena Spline 3D)
│   │   ├── nosotros/         # HeroNosotros, MissionVision, Values
│   │   └── shared/           # Header, Footer, StickyCards, TestimonialSlider
│   ├── content/              # Contenido gestionado por TinaCMS (JSON + MDX)
│   │   ├── about/            # Datos de la página "Nosotros"
│   │   ├── blog/             # Posts del blog (MDX)
│   │   ├── contact/          # Datos de contacto
│   │   ├── global/           # Navegación, footer, SEO
│   │   ├── home/             # Datos del homepage
│   │   └── services/         # Fichas de servicios
│   ├── layouts/
│   │   └── BaseLayout.astro  # Layout base (meta tags, Lenis, Header + Footer)
│   ├── pages/
│   │   ├── index.astro       # Home
│   │   ├── nosotros/         # Página "Nosotros"
│   │   └── blog/             # Listado + detalle dinámico [slug].astro
│   └── styles/
│       └── global.css        # Reset, tipografía, componentes Tailwind, gradientes
├── tina/
│   ├── config.ts             # Esquema y colecciones del CMS
│   └── __generated__/        # Tipos, queries y cliente auto-generados
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

---

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Home — Hero 3D (Spline), servicios (sticky cards), testimonios (slider), stats animados, preview del blog |
| `/nosotros` | Hero, misión/visión, valores, estadísticas de red |
| `/blog` | Listado con hero carousel de posts destacados, filtros por tags y paginación |
| `/blog/[slug]` | Detalle del post (MDX) con posts relacionados por coincidencia de tags |

---

## Colecciones del CMS (TinaCMS)

El contenido se administra desde el panel en `/admin`. Las colecciones definidas son:

- **Home** — Hero (título, subtítulo, escena Spline, CTAs), servicios, testimonios, stats, blog preview.
- **Servicios** — Páginas individuales de servicio con features, checklist, stats, formulario de contacto.
- **Nosotros** — Hero, misión/visión, valores, timeline, equipo.
- **Blog** — Posts en MDX con título, excerpt, imagen de portada, fecha, tags, flag de destacado y body rich-text.
- **Contacto** — Email, teléfono, dirección, textos del formulario.
- **Global** — Navegación (con submenús), footer (columnas, redes sociales, logo) y defaults SEO.

---

## Design System

### Tipografía

- **Sans:** Poppins (headings, body, UI)
- **Mono:** Space Mono (acentos, datos técnicos)

Escala tipográfica definida como utilidades Tailwind: `heading-xxl` (80px) hasta `caption-sm` (12px), con subtítulos y body intermedios.

### Paleta de colores

| Token | Hex |
|-------|-----|
| `brand-purple` | `#96237A` (principal) |
| `brand-purple-dark` | `#650F50` |
| `brand-purple-darkest` | `#3B0E30` |
| `brand-purple-light` | `#D5A7CA` |
| `greyscale-darkest` | `#0A0A0A` (fondo principal) |
| `greyscale-white` | `#FFFFFF` |
| Semánticos | `success`, `alert`, `error` con 5 niveles cada uno |

### Componentes CSS

Clases utilitarias definidas en `global.css`: `btn-primary`, `btn-secondary`, `card`, `card-magenta`, `section`, `section-dark`, `container-xl`, `container-lg`, gradientes (`bg-gradient-hero`, `bg-gradient-magenta`, `text-gradient-purple`).

### Accesibilidad

Variables CSS para control de accesibilidad (`--a11y-font-scale`, `--a11y-spacing-scale`, `--a11y-saturation`, `--a11y-contrast`, `--a11y-invert`, etc.).

---

## Patrón de Componentes

El proyecto usa un patrón dual **Astro + React** por componente:

- `ComponentName.astro` — Wrapper estático que hace fetch de datos desde TinaCMS en build time.
- `ComponentNameReact.tsx` — Componente React interactivo que recibe `query`, `variables` y `data` como props, habilitando edición visual en tiempo real con TinaCMS.

Hidratación parcial mediante directivas de Astro: `client:load` para componentes visibles de inmediato, `client:visible` para los que cargan al entrar en viewport.

---

## Scripts Disponibles

```bash
# Desarrollo (TinaCMS + Astro dev server)
npm run dev

# Build de producción (genera contenido TinaCMS + build estático Astro)
npm run build

# Preview del build de producción
npm run preview
```

---

## Variables de Entorno

El proyecto requiere las siguientes variables para TinaCMS:

```env
TINA_CLIENT_ID=       # Client ID de tu proyecto en Tina Cloud
TINA_TOKEN=           # Token de acceso de lectura
TINA_BRANCH=main      # Branch de Git (default: main)
```

---

## Servicios Ofrecidos

El sitio presenta los siguientes servicios empresariales de Fiberlux:

- **Seguridad** — Ciberseguridad endpoints, perímetro, videovigilancia.
- **Conectividad** — Internet dedicado, fibra oscura, Wi-Fi gestionado, transmisión de datos.
- **Infraestructura Cloud** — Hosting, housing, SaaS, continuidad de negocio.
- **Comunicaciones** — Telefonía IP.
- **Continuidad de Negocio** — Respaldo de operaciones ante contingencias.

---

## Blog

Posts escritos en MDX con soporte para rich-text, imágenes y tags categorizados: Redes, Big Data, Centro de Datos, Ciberseguridad, Cloud, Conectividad, Internet, ISPs, SaaS.

Posts actuales:
- *Tendencias en Ciberseguridad Empresarial para 2025*
- *Guía MVNO para Empresas*
- *Telefonía IP y Comunicación*