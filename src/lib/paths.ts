/**
 * Build hrefs that work whether the site is served from "/" (production, custom
 * domain) or from "/danielcz.xyz/" (GitHub Pages staging). See astro.config.mjs.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** `href('/#about')` -> `/#about` locally, `/danielcz.xyz/#about` on staging. */
export function href(path: string): string {
  if (/^(?:[a-z]+:|\/\/)/i.test(path)) return path; // absolute URL, mailto:, tel: ...
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/** Base with a guaranteed trailing slash, e.g. "/" or "/danielcz.xyz/". */
export const basePath = `${base}/`;
