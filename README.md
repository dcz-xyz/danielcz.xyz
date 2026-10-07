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

| Step          | Command                | What it verifies                                                                                                                                                                                                                                                                                                                                            |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format        | `npm run format:check` | Prettier (with the Astro plugin). `npm run format` fixes.                                                                                                                                                                                                                                                                                                   |
| Lint          | `npm run lint`         | ESLint: TypeScript, Astro, and jsx-a11y rules.                                                                                                                                                                                                                                                                                                              |
| Types         | `npm run typecheck`    | `astro check`: TypeScript across pages, components, and tests.                                                                                                                                                                                                                                                                                              |
| Content       | `npm run content`      | Entry counts, PDF files present, images with missing or placeholder alt text listed as warnings. Schemas themselves are enforced by the build.                                                                                                                                                                                                              |
| Build         | `npm run build`        | `astro build` exits 0.                                                                                                                                                                                                                                                                                                                                      |
| JS budget     | `npm run budget`       | Pages without a demo reference zero external scripts; demo pages ship at most 60 KB gzipped.                                                                                                                                                                                                                                                                |
| Accessibility | `npm run test:e2e`     | axe-core on every built page, in light and dark mode: zero violations.                                                                                                                                                                                                                                                                                      |
| Theme         | `npm run test:e2e`     | Light / dark / system toggle changes colors and persists across reloads.                                                                                                                                                                                                                                                                                    |
| Links         | `npm run test:e2e`     | linkinator crawl: no broken internal links (external failures are listed, not fatal).                                                                                                                                                                                                                                                                       |
| Redirects     | `npm run test:e2e`     | Every `legacyPaths` entry lands on its project page with a 200.                                                                                                                                                                                                                                                                                             |
| Screenshots   | `npm run test:e2e`     | Home and the MobiPrint project page at 375, 900, and 1280 px (plus 1280 dark) compared with `tests/__screenshots__/`.                                                                                                                                                                                                                                       |
| Lighthouse    | `npm run lighthouse`   | Lighthouse CI (mobile) on the home page, `/projects/mobiprint/` and `/projects/moirewidgets/`, in light mode and with Chrome forced to dark mode: Performance, Accessibility, Best Practices, SEO all at least 95, under 300 KB transferred, scripts under 60 KB. The dark run is verified by sampling its final screenshot. Needs Google Chrome installed. |

`npm run check:ci` is the subset that runs in GitHub Actions before every deploy (everything
except the Playwright suite, whose screenshot baselines are macOS renders, and Lighthouse).

`npm run launch-check` is the launch gate: everything in `check`, plus a staging-configured build
checked for base-aware links, redirects, `noindex` and `robots.txt`. It must pass before the DNS
cutover. Missing alt text is reported as warnings and does not block it.

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
scripts/icons.mjs              favicon and app-icon set from one mark
scripts/lighthouse-report.mjs  score table; verifies the dark-mode run rendered dark
scripts/staging-smoke.mjs      checks a staging-configured build (base-aware links, redirects)
scripts/serve-dist.mjs         static server for the Playwright tests (mimics GitHub Pages)
src/
  assets/images/              portrait, pubs/<key>.*, projects/<slug>/*
  content.config.ts           collection schemas (publications, projects)
  content/publications/       one YAML file per paper
  content/projects/           one Markdown file per project
  components/                  Header, Footer, ThemeToggle (+ cards and figures from Phase 2)
  layouts/Base.astro           <head>, skip link, header, main, footer
  lib/paths.ts                 href() helper so links work at "/" and "/danielcz.xyz/"
  lib/alt.ts                   alt text fallback: a missing text renders alt="" with a warning
  lib/markdown-base-links.mjs  base prefix for root-relative links in Markdown bodies
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

### Favicon and app icons

`npm run icons` regenerates `public/favicon.svg` (a Poppins "D" on a rounded square, inverted in
dark mode), `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and
`site.webmanifest` from `scripts/icons.mjs`. Change the letter, colours or corner radius at the
top of that script.

### Sitemap and robots

`@astrojs/sitemap` writes `sitemap-index.xml` on every build, listing the real pages only (no
redirect stubs, no 404). `robots.txt` allows crawling and points at the sitemap on production
and local builds, and disallows everything on the staging site.

### Visitor counter

The site can count page views with [GoatCounter](https://www.goatcounter.com) (free for personal
sites, no cookies) through a 1 px image, so no script is added. Create an account, then put the
site code (the subdomain, e.g. `danielcz` for `danielcz.goatcounter.com`) in `GOATCOUNTER_CODE` in
`src/lib/site.ts`. The image only renders on production builds, never on staging or locally.

### CV

The CV link in the header and the "CV" button in About both point at `CV_PATH` in
`src/lib/site.ts` (currently `public/pdfs/danielcz-cv-2026.pdf`). To update the CV, add the new
PDF to `public/pdfs/` and change that one path; the link checker fails if it does not exist.

## Content

All site content lives in `src/content/` and is validated against the schemas in
`src/content.config.ts` on every build. An entry with a missing field, an unknown field, a bad tag
or a missing image fails the build with a message naming the file. Alt text is the exception: an
image whose alt text is missing or still says `TODO` builds anyway, renders with `alt=""`, and is
printed as a warning (one line naming the entry and the image) by both `npm run content` and
`astro build`. The original material Daniel supplied is kept in `content-source/` for reference;
after Phase 1 it is **not** read by the site, so edit `src/content/`.

`npm run content` prints a report: entry counts, publication order, and every image whose alt text
is missing or still marked `TODO`. These are warnings and never fail a build or the launch gate.
`node scripts/content-report.mjs --strict` turns them into a failure if you ever want a hard check.

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
heroAlt: The MobiPrint robot on a white background # recommended; if missing, the build warns and uses alt=""
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

Body text in Markdown. Paragraphs, links and emphasis work as usual. A root-relative link such
as [Press release](/pdfs/file.pdf) is rewritten for the deploy location at build time.
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

## Verify a deployment

```sh
npm run verify-live -- https://dcz-xyz.github.io/danielcz.xyz/      # staging
npm run verify-live -- https://danielcz.xyz/ --production            # after the cutover
```

Fetches every page, legacy redirect, PDF and icon from the live site and checks `robots.txt`,
the `noindex` meta and the sitemap for the environment.

## Launch (DNS cutover)

Before cutting over: the staging site at `https://dcz-xyz.github.io/danielcz.xyz/` has been
reviewed and `npm run launch-check` passes.

1. In `.github/workflows/deploy.yml` set `SITE_URL: https://danielcz.xyz` and `BASE_PATH: /`.
2. Add `public/CNAME` containing `danielcz.xyz`. Commit and push; wait for the deploy.
3. GitHub repo → Settings → Pages → Custom domain: `danielcz.xyz`. The DNS check fails until step 4.
4. At the registrar for danielcz.xyz (Squarespace → Settings → Domains shows where each domain
   lives), replace the old records with GitHub Pages' records. Check the current values on
   [GitHub's custom-domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
   before entering them; as of October 2026 they are:

   | Host  | Type    | Value               |
   | ----- | ------- | ------------------- |
   | `@`   | `A`     | `185.199.108.153`   |
   | `@`   | `A`     | `185.199.109.153`   |
   | `@`   | `A`     | `185.199.110.153`   |
   | `@`   | `A`     | `185.199.111.153`   |
   | `www` | `CNAME` | `dcz-xyz.github.io` |

   Remove any other `A`, `AAAA` or `CNAME` records for `@` and `www` that pointed at Squarespace.

5. When the Pages DNS check passes, tick "Enforce HTTPS". Then test from a phone on cellular:
   `https://danielcz.xyz/`, a project page, `https://danielcz.xyz/mobiprint` (legacy redirect),
   a PDF, and `https://www.danielcz.xyz/` (should land on the apex).
6. At the registrar for danielcamposzamora.com, set a permanent (301) forward to
   `https://danielcz.xyz`, preserving paths if offered.
7. Google Search Console: add the `danielcz.xyz` property, submit `/sitemap-index.xml`, and
   request removal of the old `/test1/` placeholder URLs.
8. Keep both sites reachable for a week, then cancel the Squarespace site plan (not the domain
   registration).

Rollback: restore the previous DNS records at the registrar; the old site returns within the
propagation window as long as the Squarespace plan is still active.
