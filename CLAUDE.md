# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # TinaCMS + Astro dev server (always start together)
npm run build      # tinacms build → astro build (production)
npm run preview    # preview production build
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env`. Leave variables empty to use TinaCMS in local mode (no cloud credentials needed for dev):

```
TINA_CLIENT_ID=
TINA_TOKEN=
TINA_BRANCH=main
```

## Deployment (GitHub Actions + FTP)

`.github/workflows/deploy.yml` runs on push to `staging` (or manual `workflow_dispatch`): `npm ci` → `npm run build` → generate `dist/config.local.php` from secrets → deploy `dist/` via **SFTP** (`wlixcc/SFTP-Deploy-Action`, port 22 — the host is SFTP, not FTP). The PHP mail backend (`public/send-email.php`, `public/panel-leads.php`, `public/phpmailer/`) ships inside `dist/` because Astro copies `public/` verbatim. `delete_remote_files: false` means the deploy never removes server files, so runtime `data/` (submissions, `counter.json`) and `uploads/` are preserved.

**Staging vs production.** While the domain still serves WordPress, only `staging` deploys — to a subdirectory `fiberlux.pe/staging/`. The build sets `DEPLOY_BASE=/staging` so `astro.config.mjs` compiles with `base: '/staging'` (all paths, incl. the form endpoint, are `BASE_URL`-aware). At cutover: add a `main` trigger with its own production `server-dir`, and leave `DEPLOY_BASE` empty so production builds at root `/`.

**Secrets (mail backend)** live only in `config.local.php`, which is **git-ignored** and generated at deploy time from GitHub Secrets — never committed. `public/config.example.php` documents its shape (copy it to `public/config.local.php` to test locally). The PHP files `require` it; `panel-leads.php` refuses login if `PANEL_USER`/`PANEL_PASS` are unset.

**Required GitHub Secrets** (repo → Settings → Secrets and variables → Actions):

```
TINA_CLIENT_ID, TINA_TOKEN            # build
FTP_HOST, FTP_USER, FTP_PASS          # deploy connection
FTP_SERVER_DIR                        # remote path dist/ is uploaded to (e.g. /public_html/)
SMTP_USER, SMTP_PASS, MAIL_FALLBACK   # → config.local.php (Office 365 SMTP + fallback recipient)
PANEL_USER, PANEL_PASS                # → config.local.php (panel-leads.php login)
```

The FTP sync **excludes** `data/**` and `uploads/**` so runtime-created submissions, `counter.json` and uploaded attachments on the server are never deleted.

## Architecture

**Astro 5 SSG + React 19 islands + TinaCMS 2 (git-backed CMS)**

The site is statically built (no SSR adapter). Anything dynamic at runtime is either a hydrated React island or hits the PHP form backend (see **Forms**).

### Dual-component pattern

Every CMS-driven section uses a pair:

- `ComponentName.astro` — fetches data from TinaCMS at build time via `client` from `tina/__generated__/client`, passes `{ query, variables, data }` as props.
- `ComponentNameReact.tsx` — receives those props and renders interactively; wraps content in `useTina()` to enable live visual editing in the CMS panel.

Hydration directives: `client:load` for above-fold interactive components, `client:visible` for below-fold.

Components are grouped by page/feature under `src/components/`: `home`, `nosotros`, `blog`, `info-abonados`, `dynamic-form`, `reclamos`, `contact`, and `shared` (cross-page: `Header`, `Footer`, `StickyCards`, testimonial slider, and the form primitives `FormControls.tsx` / `FormSuccess.tsx`). A few components (e.g. `StatsReact`) live directly under `src/components/`.

Some pages compose several islands in the page file itself rather than via paired `.astro` wrappers. `src/pages/nosotros/index.astro` resolves the `about` query once and passes it to `HeroNosotrosReact`, `MissionVisionReact`, `ValuesReact`, `TimelineReact`, and `RubrosReact` (plus `StatsReact` fed by the `home` query). The `nosotros` Timeline renders an editable animated history strip driven by `about.timeline` (eyebrow `title`, `startYear`/`endYear` bar labels, and a `milestones[]` list of `{ year, heading }`). `RubrosReact` renders an editable industries/sectors carousel driven by `about.rubros` (`title` + an `items[]` list of `{ icon, label }`, where `icon` is one of a fixed set of options mapped to a `react-icons` glyph); it supports arrow navigation, pointer drag with snap, autoplay with pause-on-interaction, and honors `prefers-reduced-motion`.

### Content & collections

All content lives in `src/content/` as JSON (structured pages/forms) or MDX (blog posts). The TinaCMS schema in `tina/config.ts` is the single source of truth for content shape. Types, GraphQL queries, and the typed client are auto-generated into `tina/__generated__/` (do not edit manually).

Collections:

- `home`, `service`, `about`, `contact` — structured page content (JSON).
- `post` — MDX blog posts (`src/content/blog/`).
- `global` — nav / footer / SEO.
- `maintenance` — site-wide maintenance mode (see below).
- `infoAbonados` — "Información de Abonados" page content.
- `formConfig` — per-form metadata: `formType`, `label`, `enabled`, `recipients[]`.
- `dynamicForms` — full form definitions, one JSON file per form (`reclamo`, `queja`, `apelacion`, `libro-reclamaciones`, `contacto`).

### Forms (CMS-defined dynamic forms)

Forms are authored entirely in the CMS, not hardcoded:

- Each form is a `dynamicForms` JSON file describing ordered `fields[]` (types like `text`, `email`, `select`, `radio`, `checkbox`, `file`, `currency`, `date_triplet`, `section_header`, `note`, plus per-field `validation`, `width`, conditional visibility via `conditionalField`).
- `dynamic-form/DynamicForm.astro` loads a form by `formSlug` and renders it through `DynamicFormReact.tsx`, which builds the UI from the field list using the primitives in `shared/FormControls.tsx`.
- Submission goes through `src/utils/submitForm.ts` → `POST` to **`send-email.php`** (a PHP backend expected on the production server; it is NOT in this repo). Sends JSON normally, or `multipart/form-data` when files are attached. Includes a `website` honeypot field.
- `src/pages/form-config.json.ts` is a build-time endpoint emitting `/form-config.json` from the `formConfig` collection (the recipient/enabled map the PHP backend reads).
- Form pages: `/reclamos` (a selector → `reclamo`, `queja`, `apelacion` subpages), `/legales/libro-reclamaciones`, and `/contacto` (the contact page composes its own layout but renders the `contacto` form via `DynamicFormReact`).

Paths in form/runtime code are `BASE_URL`-aware (`import.meta.env.BASE_URL`) so the site can deploy under a subpath.

### Maintenance mode

`BaseLayout.astro` queries the `maintenance` collection at build time; when `enabled: true` it replaces the entire page body with a branded maintenance screen (title/message/optional contact CTA from the collection) instead of rendering the page.

### `client:tina` directive

`astro-tina-directive/` is a custom Astro integration that registers `client:tina` — used to enable TinaCMS visual editing on specific components without full hydration overhead.

### Styling

Tailwind CSS 3 with custom design tokens in `tailwind.config.mjs`. Reusable CSS component classes (`btn-primary`, `btn-secondary`, `card`, `card-magenta`, `section`, `section-dark`, `container-xl`, `container-lg`, gradient utilities) are defined in `src/styles/global.css` — prefer these over inline Tailwind for repeated patterns. Note: several form/reclamos components use inline `style` objects rather than Tailwind classes.

Icons come from `react-icons` (Font Awesome 6 set, `react-icons/fa6`).

**Brand colors:** `brand-purple` (`#96237A`), `brand-purple-dark` (`#650F50`), `brand-purple-darkest` (`#3B0E30`). Background is near-black (`greyscale-darkest` `#0A0A0A`).

**Fonts:** Poppins (headings + body), Space Mono (technical accents). Typography scale defined as Tailwind utilities (`heading-xxl` → `caption-sm`).

### 3D / animations

Spline scenes are embedded via `@splinetool/react-spline` in `HeroHome`. Scene URL is CMS-managed. Smooth scroll uses Lenis, initialized in `BaseLayout.astro`.

### CMS admin panel

Accessible at `/admin` in dev. Media uploads go to `public/` (media root ``, public folder `public`).

### Specs & references (workflow)

Larger features are spec-driven. `specs/` holds numbered markdown specs (`01-legales-osiptel-y-editabilidad.md`, `02-pagina-contacto-formulario.md`, `03-nosotros-timeline-historia.md`, `04-nosotros-timeline-slide-animation.md`, `05-nosotros-rubros-slider.md`); each is built on its own `spec-NN-*` branch and merged via PR. `references/` holds the design reference screenshots (desktop + mobile) a spec is implemented against — used for visual QA. When implementing or modifying a feature that has a spec, read the matching `specs/NN-*.md` first.
