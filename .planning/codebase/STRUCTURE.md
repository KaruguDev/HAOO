# Structure

**Analysis Date:** 2026-08-29

## Repository Layout

```text
ZERO-PAPERHUB/
├── index.html                 # Vite browser document and React mount point
├── src/
│   ├── main.tsx               # React bootstrap/composition root
│   ├── App.tsx                # Complete landing page, state, helpers, content data
│   ├── index.css              # Tailwind layers and global document styles
│   └── vite-env.d.ts           # Vite client type declarations
├── public/
│   ├── zero-paper_hub_hi-def.png # Primary logo used by app/favicon
│   ├── image.png               # Static image asset
│   ├── CNAME.txt               # Published static-hosting domain asset
│   ├── .htaccess               # Static-hosting rewrite/config asset
│   └── marketing/
│       ├── zero-paper-hub-marketing.html # Editable A4 tri-fold source
│       ├── zero-paper-hub-marketing.pdf  # Print/share artifact
│       ├── README.md            # Marketing export/printing instructions
│       └── assets/zero-paper-hub-logo.png # Marketing document logo
├── dist/                       # Existing generated static build/artifacts
├── .bolt/                      # Bolt project metadata/prompts
├── .planning/codebase/         # GSD-generated repository analysis documents
├── package.json                # Scripts and dependencies
├── package-lock.json           # npm lockfile
├── vite.config.ts              # Vite/React build configuration
├── tsconfig*.json              # TypeScript project configurations
├── tailwind.config.js          # Tailwind content scan/theme config
├── postcss.config.js           # Tailwind + Autoprefixer pipeline
├── eslint.config.js            # Flat ESLint configuration
├── CNAME                       # Repository-level custom domain file
└── README.md                   # Contact form activation/deployment notes
```

## Source Organization

The source tree intentionally remains small and page-oriented:

- `src/main.tsx` is the only application entry point. It imports `src/index.css` and mounts `src/App.tsx`.
- `src/App.tsx` contains all visible sections in page order: fixed navigation, hero, About, Impact Stats, Mission/Vision/Values, Services, Values strip, CTA, Contact, and Footer.
- Static arrays in `src/App.tsx` (`NAV_LINKS`, `VALUES`, `SERVICES`) are the correct location for repeated labels/descriptions/icons used in the page.
- `src/index.css` is for global rules only; component styling is represented by Tailwind classes in JSX.

## Where to Add New Code

| Need | Location | Pattern |
|---|---|---|
| New landing-page section | `src/App.tsx` | Add a semantic `<section>` in page order with an `id` when navigable; use Tailwind utilities and `useInView()` if it needs reveal animation. |
| Repeated navigation item | `NAV_LINKS` in `src/App.tsx` | Add `{ label, href }`; renderers already cover desktop, mobile, and footer navigation. |
| Service/value item | `SERVICES` or `VALUES` in `src/App.tsx` | Add static data and a `lucide-react` icon import; retain stable `title`/`label` keys. |
| Page interaction/state | `App()` in `src/App.tsx` | Use a focused `useState`/`useEffect`; clean up listeners/observers in effect return functions. |
| External form/provider setting | Named constants near top of `src/App.tsx` | Keep endpoint and redirect URLs explicit and aligned with native form fields. |
| Global typography/scroll behavior | `src/index.css` | Add document-level CSS only; do not duplicate Tailwind utilities here. |
| Image, favicon, downloadable/static asset | `public/` | Reference with a root-relative path (`/asset-name.ext`). Place marketing-only assets under `public/marketing/`. |
| SEO/document metadata | `index.html` | Update title, favicon, Open Graph, and Twitter metadata in the document head. |
| Build/lint/type behavior | `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, or `tsconfig*.json` | Preserve existing Vite + Tailwind + strict TypeScript toolchain. |

## Naming and Placement Rules

Use PascalCase for React components and camelCase for functions, hooks, and state (`downloadCompanyProfile`, `useInView`, `menuOpen`). Use uppercase names for static page data constants. Keep TypeScript/TSX application code under `src/`; use `public/` only for files that must be served verbatim. Keep editable marketing source and its generated PDF together in `public/marketing/`.

## Build and Generated Files

`dist/` is generated static output and should not be treated as the source of truth for application changes. Edit `src/`, `public/`, and root configuration files, then run `npm run build` to regenerate output. The repository currently contains a checked/available `dist/` tree with built HTML/assets; confirm project policy before committing regenerated artifacts.

## Navigation Map

The single page has no router. `NAV_LINKS` maps to section IDs:

```text
About    → #about
Mission  → #mission
Services → #services
Values   → #values
Contact  → #contact
```

The hero and CTA also link directly to these anchors. Preserve matching `href`/`id` pairs when renaming or adding sections, and close the mobile menu from mobile navigation handlers.

---
*Structure analysis: 2026-08-29*
