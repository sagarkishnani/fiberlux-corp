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

## Architecture

**Astro 5 SSG + React 19 islands + TinaCMS 2 (git-backed CMS)**

### Dual-component pattern

Every CMS-driven section uses a pair:

- `ComponentName.astro` — fetches data from TinaCMS at build time via `client` from `tina/__generated__/client`, passes `{ query, variables, data }` as props.
- `ComponentNameReact.tsx` — receives those props and renders interactively; wraps content in `useTina()` to enable live visual editing in the CMS panel.

Hydration directives: `client:load` for above-fold interactive components, `client:visible` for below-fold.

### Content

All content lives in `src/content/` as JSON (structured pages) or MDX (blog posts). TinaCMS schema is defined in `tina/config.ts` — this is the single source of truth for content shape. Types, GraphQL queries, and the typed client are auto-generated into `tina/__generated__/` (do not edit manually).

Collections: `home`, `service`, `about`, `post` (MDX blog), `contact`, `global` (nav/footer/SEO).

### `client:tina` directive

`astro-tina-directive/` is a custom Astro integration that registers `client:tina` — used to enable TinaCMS visual editing on specific components without full hydration overhead.

### Styling

Tailwind CSS 3 with custom design tokens in `tailwind.config.mjs`. Reusable CSS component classes (`btn-primary`, `btn-secondary`, `card`, `card-magenta`, `section`, `section-dark`, `container-xl`, `container-lg`, gradient utilities) are defined in `src/styles/global.css` — prefer these over inline Tailwind for repeated patterns.

**Brand colors:** `brand-purple` (`#96237A`), `brand-purple-dark` (`#650F50`), `brand-purple-darkest` (`#3B0E30`). Background is near-black (`greyscale-darkest` `#0A0A0A`).

**Fonts:** Poppins (headings + body), Space Mono (technical accents). Typography scale defined as Tailwind utilities (`heading-xxl` → `caption-sm`).

### 3D / animations

Spline scenes are embedded via `@splinetool/react-spline` in `HeroHome`. Scene URL is CMS-managed. Smooth scroll uses Lenis, initialized in `BaseLayout.astro`.

### CMS admin panel

Accessible at `/admin` in dev. Media uploads go to `public/uploads/`.
