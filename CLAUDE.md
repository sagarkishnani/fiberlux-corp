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

Copy `.env.example` to `.env`. Leave `TINA_CLIENT_ID`/`TINA_TOKEN` empty to use TinaCMS in local mode (no cloud credentials needed for dev):

```
TINA_CLIENT_ID=
TINA_TOKEN=
TINA_BRANCH=staging
PUBLIC_TURNSTILE_SITE_KEY=
```

**`TINA_BRANCH` matters more than it looks.** TinaCloud indexes content **per branch**, and the branch is baked into `tina/__generated__/client.ts` by `tinacms build` — it is *not* read at runtime. Since the cutover (below) `main` and `staging` carry **different schemas**, so building this tree against `TINA_BRANCH=main` queries production's index with the wrong schema and fails. Working on `staging` ⇒ `TINA_BRANCH=staging`.

## Branch model (cutover — 9 Sept 2026)

- **`main` = production.** Holds the ISO-certification hotfix release (`e5d4ec3` + hotfix): an *older* tree than `staging`. Fiberlux's server publishes it to the docroot root.
- **`staging` = the new site** — the live line of development, ~430 commits ahead of what production serves. Work here and PR here.
- The two **diverged on purpose**: `main` was rewound to the production release. **Never `git pull` on `main`** — it would merge the new site into production. Sync with `git fetch && git reset --hard origin/main`.
- Tag `cutover-2026-09-09-sitio-nuevo` marks the commit `staging` was cut from — the rollback point for the rewind.
- Each branch has its **own TinaCloud index with its own schema** (e.g. the `popup` collection exists only in staging's). Probe one with `POST https://content.tinajs.io/1.6/content/<clientId>/github/<branch>`.
- Shipping the new site to production = force-push `staging` onto `main`, then move `TINA_BRANCH` back to `main` in `.env` and in the server's `deploy.env`.

## Deployment (server pull — not CI push)

Fiberlux's own server publishes the site; nothing pushes into it from outside. `scripts/server-deploy.sh` is the versioned reference copy — TI installs it at `/opt/fiberlux/deploy.sh`. **cron must not run it from inside the clone**: `git reset --hard` rewrites the file mid-execution and bash, which reads scripts in chunks, breaks.

cron every minute under `flock -n`: `git fetch` → if the branch moved, `git reset --hard` → load `/opt/fiberlux/deploy.env` → `npm ci` (only when the lockfile changed) → `npm run build` → `rsync -a --delete ./dist/ <docroot>/`.

- **Publishing is the last step**, so a failed build never reaches the docroot: the live site stays up and the error lands in `/var/log/fiberlux-deploy.log`. A successful run opens with `nuevo commit <sha>` and closes with `publicado <sha>`.
- A content save in TinaCMS is a commit, so **CMS edits publish through this same path**.
- `rsync --delete` preserves exactly three paths: `data/` (submissions, `counter.json`), `uploads/` (attachments) and `fiberlux-config.php`. Their `.htaccess` files **do** sync — they ship in `dist/` and are what block web access to those directories.
- Server env `/opt/fiberlux/deploy.env` (chmod 600, outside the repo): `TINA_CLIENT_ID`, `TINA_TOKEN`, `TINA_BRANCH=main`, `PUBLIC_TURNSTILE_SITE_KEY`, `DEPLOY_BASE=` (empty → site at root; `astro.config.mjs` reads it as `base`, and all runtime paths are `BASE_URL`-aware).
- The script's `BRANCH` and `deploy.env`'s `TINA_BRANCH` **must match**, or the site silently stops receiving content changes with no visible error. The script's own defaults still target staging (`BRANCH=staging`, `DOCROOT=/var/www/fiberlux.pe/staging`); the production install overrides both.
- **Reverting is done on the branch**, never on the server — the next poll applies it.
- Full runbook handed to TI: *Fiberlux — Despliegue en servidor propio, v1.0* (26 Aug 2026).

**`staging` has no automated publisher.** The GitHub Actions + SFTP workflow was removed at the cutover: its FTP secrets had been deleted and every run failed from 3 Aug 2026 onward. To publish staging, either TI adds a second cron with `DEPLOY_BRANCH=staging` and its own `DOCROOT`, or use `npm run deploy` (manual build → GitHub Pages via `scripts/deploy-gh-pages.sh`).

**Secrets (mail backend)** live only in `fiberlux-config.php` — uploaded by SFTP into the docroot, git-ignored, and never inside `dist/` (SPEC 85). `public/config.example.php` is its template; copy it to `public/fiberlux-config.php` to test locally. `send-email.php` and `panel-leads.php` `require` it; `panel-leads.php` refuses login when `panel_user`/`panel_pass_hash` are unset. The PHP mail backend (`public/send-email.php`, `public/panel-leads.php`, `public/phpmailer/`) ships inside `dist/` because Astro copies `public/` verbatim.

**Captcha (Cloudflare Turnstile — SPEC 79).** Every form that hits `send-email.php` carries an invisible Turnstile token (`appearance: interaction-only`, no visible challenge for legit users). `DynamicFormReact` loads the widget with the **public** site key from build env `PUBLIC_TURNSTILE_SITE_KEY`; `send-email.php` verifies the token server-side against Cloudflare's `siteverify` using `turnstile_secret` from `fiberlux-config.php`, and **fail-closed**: a missing/invalid token, or an unreachable `siteverify`, is rejected with no email sent (enforced only while `turnstile_secret` is set). The Turnstile widget lists `fiberlux.pe` (covers `negocios.fiberlux.pe` and the `/portal-de-trabajo` subpath) plus `localhost` for dev.

**Note:** production currently runs the pre-SPEC-79/85 tree, so its forms have **no Turnstile** and its schema predates the `_en` i18n work on several collections. Both arrive when `staging` ships.

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

### Internationalization (i18n ES/EN) — SPEC 80

The site is bilingual: **ES is the default (root URLs), EN lives under `/en/`**. EN falls back to ES per field when a translation is missing.

- **Astro i18n** (`astro.config.mjs`): `defaultLocale: 'es'`, `locales: ['es','en']`, `prefixDefaultLocale: false`. **No `fallback`** — in static output it emits redirect stubs, not rendered pages.
- **Real `/en` pages** are thin wrappers under `src/pages/en/**` that import the ES page and render `<Page />` (dynamic routes re-export `getStaticPaths`). So every route is emitted twice (ES at root, EN under `/en`) sharing one page implementation. **When you add a new page/route, add its `/en` wrapper too.**
- **Locale detection**: `BaseLayout` computes `locale` (`Astro.currentLocale` → `getLocale(Astro.url)` fallback) and passes it as a prop to islands — components don't read `currentLocale` directly. `<html lang={locale}>`.
- **Helpers** (`src/utils/i18n.ts`): `getLocale(url)`, `localizedPath(pathname, locale)` (switcher links), `tField(obj, key, locale)` (reads `key_en` with fallback to `key`). All BASE_URL-aware.
- **CMS content translation — `_en` convention**: each translatable Tina field gets an optional sibling `<field>_en` (e.g. `title` + `title_en`). Empty `_en` ⇒ ES. Render with `tField(obj, 'field', locale)`. This is how **content specs translate each collection**: add `_en` siblings in `tina/config.ts`, fill them in the content JSON, and read via `tField`.
- **Rich-text `_en` fields** (`type: "rich-text"`): read with `richField(obj, 'field', locale)` (also in `src/utils/i18n.ts`), **not** `tField` (which returns strings). `richField` uses `richHasContent()` to detect an empty `_en` (Tina returns a truthy-but-empty rich-text object even when the field is absent) and falls back to the ES node — a plain truthiness check would render blank. Used for `casosDeUso.statement_en`, `faq.items[].answer_en`, `formasDePago` step `description_en`, `legal.body_en`, `post.body_en`.
- **Dynamic form i18n** (`DynamicFormReact`): the form takes a `locale` prop and reads every CMS string via a local `L(obj,key)` = `tField`; options are localized via `locOptions()` (`label_en`/`description_en`/`group_en`), and hardcoded UI defaults (Send/Sending/required/etc.) come from an in-file `FORM_UI[locale]` map. `dynamicForms` schema has `_en` siblings for `formTitle/description/submitButtonText/success*/error*/validationMessage`, per-field `label/placeholder/noteContent/helpText/errorMessage/linkText`, `validation.patternMessage`, and option `label/group/description`. Only `servicios.json` + `contacto.json` content is translated; the OSIPTEL reclamos forms stay ES-fallback.
- **Hardcoded UI strings** (not in the CMS) live in `src/i18n/ui.ts` → `t(key, locale)` (also ES-fallback).
- **Language switcher**: `LangSwitcher` in `HeaderV2React` (topbar, desktop + mobile) links the current path to the other locale via `localizedPath`.
- **Done in SPEC 80**: full site i18n — infra + switcher + chrome + **all page/section content** (home, nosotros, casos, formas de pago, soporte, info-abonados, fiberlux-app, contacto, the 4 solución categories incl. their **partners marquee + catálogo cards**, the 35 subservicios incl. **deep detail — beneficios title/text, casos de uso statement, FAQ questions**, blog card metadata, legal titles), plus the **dynamic contact/servicios forms** (labels, placeholders, options, messages) and the **search index/overlay** (localized entries + `/en` result URLs). EN content is a **draft** the client refines in Tina; empty `_en` falls back to ES. **Still ES-fallback (client fills `_en`)**: long rich-text bodies (`legal.body_en`, `post.body_en`, formas-de-pago step descriptions), subservicio FAQ **answers** (the ES source answers are empty), and the **OSIPTEL reclamos forms** (reclamo/queja/apelacion/libro-reclamaciones/derechos-arco). SEO per-locale (hreflang) is also not done.
- **Adding a new translatable field**: add `<field>_en` in `tina/config.ts`, render with `tField(obj, 'field', locale)`, and make sure the component/page resolves `locale` — page wrappers use `isLocale(Astro.currentLocale) ? Astro.currentLocale : getLocale(Astro.url)` (nested `.astro` wrappers must NOT rely on `getLocale(Astro.url)` alone) and pass `locale` down to islands.

### CMS admin panel

Accessible at `/admin` in dev. Media uploads go to `public/` (media root ``, public folder `public`).

### Specs & references (workflow)

Larger features are spec-driven. `specs/` holds numbered markdown specs (`01-legales-osiptel-y-editabilidad.md`, `02-pagina-contacto-formulario.md`, `03-nosotros-timeline-historia.md`, `04-nosotros-timeline-slide-animation.md`, `05-nosotros-rubros-slider.md`); each is built on its own `spec-NN-*` branch and merged via PR. `references/` holds the design reference screenshots (desktop + mobile) a spec is implemented against — used for visual QA. When implementing or modifying a feature that has a spec, read the matching `specs/NN-*.md` first.
