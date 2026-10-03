# danielcz.xyz

Personal research portfolio of Daniel Campos Zamora. A static [Astro](https://astro.build)
site deployed to GitHub Pages by GitHub Actions. No CMS: content is plain YAML and Markdown
in `src/content/`, layout code never needs to change to add a paper or a project.

## Requirements

- Node 22.12 or newer (`node -v`), npm 9 or newer.
- Playwright's Chromium for the local test suite: `npx playwright install chromium` (once).

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321/ with hot reload
npm run build      # writes the static site to dist/
npm run preview    # serves dist/ exactly as GitHub Pages will
```

## Quality gates

One command runs every gate; run it before every commit and paste the output in your report:

```sh
npm run check
```

| Step            | Command                | What it verifies                                                                             |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Format          | `npm run format:check` | Prettier (with the Astro plugin). `npm run format` fixes.                                    |
| Lint            | `npm run lint`         | ESLint: TypeScript, Astro, and jsx-a11y rules.                                               |
| Types + content | `npm run typecheck`    | `astro check`: TypeScript and content-collection schemas.                                    |
| Build           | `npm run build`        | `astro build` exits 0.                                                                       |
| JS budget       | `npm run budget`       | Pages without a demo reference zero external scripts; demo pages ship at most 60 KB gzipped. |
| Accessibility   | `npm run test:e2e`     | axe-core on every built page, in light and dark mode: zero violations.                       |
| Theme           | `npm run test:e2e`     | Light / dark / system toggle changes colors and persists across reloads.                     |
| Links           | `npm run test:e2e`     | linkinator crawl: no broken internal links (external failures are listed, not fatal).        |
| Screenshots     | `npm run test:e2e`     | Home at 375, 900, and 1280 px (plus 1280 dark) compared with `tests/__screenshots__/`.       |

`npm run check:ci` is the subset that runs in GitHub Actions before every deploy (everything
except the Playwright suite, whose screenshot baselines are macOS renders).

After an intentional visual change, regenerate the baselines and commit them:

```sh
npm run shots:update
```

## Project structure

```
.github/workflows/deploy.yml   build, run gates, deploy to GitHub Pages
public/                        static files copied as-is (favicon, pdfs/)
scripts/js-budget.mjs          JS budget gate
scripts/serve-dist.mjs         static server for the Playwright tests (mimics GitHub Pages)
src/
  components/                  Header, Footer, ThemeToggle (+ cards and figures from Phase 2)
  layouts/Base.astro           <head>, skip link, header, main, footer
  lib/paths.ts                 href() helper so links work at "/" and "/danielcz.xyz/"
  pages/                       index.astro, robots.txt.ts (+ project pages from Phase 3)
  styles/tokens.css            design tokens: color, type scale, spacing, motion
  styles/global.css            reset, typography, links, focus, layout helpers
tests/                         Playwright: a11y, theme, links, screenshots
tests/__screenshots__/         committed visual baselines
```

## Design tokens

Everything visual starts in `src/styles/tokens.css`. Fonts are Poppins 300/400/500,
self-hosted from `@fontsource/poppins` (latin subset, woff2, `font-display: swap`). Colors are
grayscale in both themes; `--accent` is the single token to change if a color is wanted later.
Dark mode follows the system preference and can be overridden with the toggle in the footer,
which stores the choice in `localStorage`.

## Add a paper

_Content collections arrive in Phase 1. This section will describe the YAML file to add under
`src/content/publications/` and where to put the thumbnail (`src/assets/images/pubs/`) and PDF
(`public/pdfs/`)._

## Add a project

_Content collections arrive in Phase 1. This section will describe the Markdown file to add
under `src/content/projects/` and the images under `src/assets/images/projects/<slug>/`._

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: install, `npm run check:ci`, then
deploy `dist/` with `actions/deploy-pages`. The repository's Pages source must be set to
"GitHub Actions" (Settings → Pages).

The build target is chosen by two environment variables set in the workflow:

| Variable    | Staging (now)               | Production (after launch) |
| ----------- | --------------------------- | ------------------------- |
| `SITE_URL`  | `https://dcz-xyz.github.io` | `https://danielcz.xyz`    |
| `BASE_PATH` | `/danielcz.xyz/`            | `/`                       |

All internal links go through `href()` from `src/lib/paths.ts`, so the same code works at
both locations. `robots.txt` and a `noindex` meta tag keep the staging site out of search
engines automatically; production is detected by `SITE_URL` being `https://danielcz.xyz`.

To rehearse a staging build locally:

```sh
SITE_URL=https://dcz-xyz.github.io BASE_PATH=/danielcz.xyz/ npm run check
```

## Launch (DNS cutover)

1. Change `SITE_URL` and `BASE_PATH` in `.github/workflows/deploy.yml` to the production values.
2. Add `public/CNAME` containing `danielcz.xyz`.
3. Push, then in Settings → Pages set the custom domain to `danielcz.xyz` and enforce HTTPS
   once the DNS check passes. Full steps are in the launch checklist of the project spec.
