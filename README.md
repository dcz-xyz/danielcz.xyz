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

| Step          | Command                | What it verifies                                                                                                                                                                               |
| ------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format        | `npm run format:check` | Prettier (with the Astro plugin). `npm run format` fixes.                                                                                                                                      |
| Lint          | `npm run lint`         | ESLint: TypeScript, Astro, and jsx-a11y rules.                                                                                                                                                 |
| Types         | `npm run typecheck`    | `astro check`: TypeScript across pages, components, and tests.                                                                                                                                 |
| Content       | `npm run content`      | Entry counts, PDF files present, placeholder alt text listed. Schemas themselves are enforced by the build.                                                                                    |
| Build         | `npm run build`        | `astro build` exits 0.                                                                                                                                                                         |
| JS budget     | `npm run budget`       | Pages without a demo reference zero external scripts; demo pages ship at most 60 KB gzipped.                                                                                                   |
| Accessibility | `npm run test:e2e`     | axe-core on every built page, in light and dark mode: zero violations.                                                                                                                         |
| Theme         | `npm run test:e2e`     | Light / dark / system toggle changes colors and persists across reloads.                                                                                                                       |
| Links         | `npm run test:e2e`     | linkinator crawl: no broken internal links (external failures are listed, not fatal).                                                                                                          |
| Redirects     | `npm run test:e2e`     | Every `legacyPaths` entry lands on its project page with a 200.                                                                                                                                |
| Screenshots   | `npm run test:e2e`     | Home and the MobiPrint project page at 375, 900, and 1280 px (plus 1280 dark) compared with `tests/__screenshots__/`.                                                                          |
| Lighthouse    | `npm run lighthouse`   | Lighthouse CI (mobile) on the home page, `/projects/mobiprint/` and `/projects/moirewidgets/`: Performance, Accessibility, Best Practices, SEO all at least 95. Needs Google Chrome installed. |

`npm run check:ci` is the subset that runs in GitHub Actions before every deploy (everything
except the Playwright suite, whose screenshot baselines are macOS renders, and Lighthouse).

After an intentional visual change, regenerate the baselines and commit them:

```sh
npm run shots:update
```

## Project structure

```
.github/workflows/deploy.yml   build, run gates, deploy to GitHub Pages
public/pdfs/                   self-hosted paper PDFs, linked from publications
scripts/js-budget.mjs          JS budget gate
scripts/pdf-thumbnails.mjs     renders page 1 of each paper PDF as its thumbnail
scripts/serve-dist.mjs         static server for the Playwright tests (mimics GitHub Pages)
src/
  assets/images/              portrait, pubs/<key>.*, projects/<slug>/*
  content.config.ts           collection schemas (publications, projects)
  content/publications/       one YAML file per paper
  content/projects/           one Markdown file per project
  components/                  Header, Footer, ThemeToggle (+ cards and figures from Phase 2)
  layouts/Base.astro           <head>, skip link, header, main, footer
  lib/paths.ts                 href() helper so links work at "/" and "/danielcz.xyz/"
  components/home/             About, Publications, Projects sections of the home page
  components/Demo.astro        mounts an interactive island by name
  components/demos/            island code (MoireExplorer.ts)
  components/Figure.astro      image or looping video with caption
  layouts/Project.astro        project page: hero, metadata strip, prose, gallery, prev/next
  pages/                       index.astro, projects/[slug].astro, 404.astro, robots.txt.ts
public/video/                  MP4 clips for gallery items
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

### Section dividers

The wavy lines between the home sections are two SVG files, `src/assets/dividers/wave-1.svg`
and `wave-2.svg`, inlined by `src/components/SectionDivider.astro`. Edit the path in either
file with any drawing tool (keep the `viewBox` and `stroke="currentColor"`), change
`--divider-height`, `--divider-stroke` or `--divider-color` in `tokens.css`, or remove the
`<SectionDivider />` lines from `src/pages/index.astro` to go back to plain spacing.

### CV

The CV link in the header and the "CV" button in About both point at `CV_PATH` in
`src/lib/site.ts` (currently `public/pdfs/danielcz-cv-2026.pdf`). To update the CV, add the new
PDF to `public/pdfs/` and change that one path; the link checker fails if it does not exist.

## Content

All site content lives in `src/content/` and is validated against the schemas in
`src/content.config.ts` on every build. An entry with a missing field, an unknown field, a bad tag,
a missing image, or empty alt text fails the build with a message naming the file. The original
material Daniel supplied is kept in `content-source/` for reference; after Phase 1 it is **not**
read by the site, so edit `src/content/`.

`npm run content` prints a report: entry counts, publication order, and any alt text still marked
`TODO`. Placeholder alt text is allowed during development and becomes a hard failure at launch
(`node scripts/content-report.mjs --strict`).

### Add a paper

1. Put the PDF in `public/pdfs/<key>-<venue><year>.pdf` (for example `mobiprint-uist2024.pdf`).
2. Create `src/content/publications/<key>.yaml` (below), then run `npm run pdf-thumbs`, which
   renders page 1 of the PDF to `src/assets/images/pubs/<key>-page1.png` with poppler's
   `pdftoppm` (`brew install poppler`). That image is the clickable thumbnail in the list, as on
   the Makeability Lab publications page. Any other image works too; point `thumbnail` at it.

```yaml
title: 'MobiPrint: A Mobile 3D Printer for Environment-Scale Design and Fabrication'
authors: # in print order
  - Daniel Campos Zamora
  - Liang He
  - Jon E. Froehlich
equalContribution: [] # names from `authors` that get the * marker
venue: ACM UIST 2024 # short tag shown on the card
venueFull: In Proceedings of the 37th Annual ACM Symposium on User Interface Software and Technology (UIST '24)
year: 2024
date: 2024-10-11 # drives newest-first ordering; the DOI record has it
thumbnail: ../../assets/images/pubs/mobiprint-page1.png # from `npm run pdf-thumbs`
thumbnailAlt: First page of the paper
links:
  pdf: /pdfs/mobiprint-uist2024.pdf # optional
  doi: https://doi.org/10.1145/3654777.3676459 # optional
  video: https://www.youtube.com/watch?v=SknW-Oygh3w # optional
  code: https://github.com/... # optional
project: mobiprint # optional: slug of the related project page
```

The file name (without `.yaml`) is the paper's key, used by `project.links.paper`.

### Add a project

1. Put the images in `src/assets/images/projects/<slug>/`.
2. Create `src/content/projects/<slug>.md`. The slug becomes the URL: `/projects/<slug>/`.

```markdown
---
title: MobiPrint
subtitle: A pipeline for in-situ design and fabrication to adapt physical environments.
year: 2024 # or a range as a string, e.g. "2011-2015"
tags: [research] # research | not-research
order: 3 # position in the Projects grid, 1 = first
collaborators: [Jon E. Froehlich, Liang He]
hero: ../../assets/images/projects/mobiprint/img-8880.jpg
heroAlt: The MobiPrint robot on a white background
thumbnail: ../../assets/images/projects/mobiprint/banner-2.jpg # optional card image, defaults to hero
thumbnailAlt: MobiPrint printing on a wooden floor
gallery: # optional, shown in this order on the project page
  - src: ../../assets/images/projects/mobiprint/banner-2.jpg
    alt: MobiPrint printing on a wooden floor
    caption: Optional caption
video: https://www.youtube.com/watch?v=... # optional, shown in the hero slot
links:
  paper: mobiprint # optional publication key
legacyPaths: [/mobiprint] # old Squarespace paths that redirect here
---

Body text in Markdown. Paragraphs, links and emphasis work as usual.
```

Project pages render at `/projects/<slug>/` with the title, subtitle, hero, a metadata strip
(year, type, collaborators, venue and links from the linked paper), the body, the gallery, and
previous / next links. Every `legacyPaths` entry becomes a static redirect page at build time
(read from the frontmatter by `astro.config.mjs`), so old Squarespace URLs keep working.

### Gallery layouts

Each project chooses how its images are shown with `galleryLayout:` in the frontmatter
(`src/lib/gallery.ts` holds the list and the site-wide default, currently `slideshow`):

| Layout      | What it does                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slideshow` | The default. One large image at a time on a 16:10 stage with arrows, a thumbnail strip, keyboard and swipe, like the old Squarespace carousel. The hero is the first slide. Works without JavaScript as a swipeable strip. |
| `grid`      | Hero on top; after the text, a two-column grid of figures with captions.                                                                                                                                                   |
| `stack`     | Hero on top; after the text, full-width figures one after another (photo-essay style).                                                                                                                                     |
| `filmstrip` | Hero on top; after the text, a horizontally scrolling row at one height, natural aspect ratios side by side.                                                                                                               |

The components live in `src/components/gallery/`; `Gallery.astro` picks one by name.

### Interactive demos

A project can mount an interactive island with `demo: MoireExplorer` in its frontmatter. The
island's code (`src/components/demos/MoireExplorer.ts`, a plain web component, no framework)
is loaded only when it scrolls near the viewport; pages without a demo ship no JavaScript, and
the static SVG inside the element shows until the code arrives or when JavaScript is off. To add
another demo: add its name to `DEMOS` in `src/lib/tags.ts`, write the element in
`src/components/demos/`, and add a block for it in `src/components/Demo.astro`. The JS budget
allows up to 60 KB gzipped on a demo page, lazy chunks included.

### Animated GIFs and clips

Animated GIFs in a gallery are served exactly as uploaded (the image optimizer would freeze
them), so keep them as small as you can. A gallery item can alternatively be a silent looping
video: put an MP4 in `public/video/<slug>/`, give the item a still frame as `src` (the poster)
and add `video: /video/<slug>/<file>.mp4`; `ffmpeg -i in.gif -c:v libx264 -crf 26 -pix_fmt yuv420p -an out.mp4`
makes one. Videos pause for visitors who prefer reduced motion and always have controls.

### YouTube videos

A project's `video` field (a YouTube URL) adds a "Watch the video" button over the hero. The site
does not embed YouTube's player, which keeps third-party scripts and cookies off the page.

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
both locations. When `SITE_URL` is a `github.io` address the build adds a `noindex` meta tag
and a disallow-all `robots.txt`, so the staging site stays out of search engines automatically.

To rehearse a staging build locally:

```sh
SITE_URL=https://dcz-xyz.github.io BASE_PATH=/danielcz.xyz/ npm run check
```

## Launch (DNS cutover)

1. Change `SITE_URL` and `BASE_PATH` in `.github/workflows/deploy.yml` to the production values.
2. Add `public/CNAME` containing `danielcz.xyz`.
3. Push, then in Settings → Pages set the custom domain to `danielcz.xyz` and enforce HTTPS
   once the DNS check passes. Full steps are in the launch checklist of the project spec.
