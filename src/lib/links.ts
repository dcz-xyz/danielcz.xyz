/**
 * Which links open in a new tab: links that leave the site, and PDFs (papers,
 * the CV, press material). Internal pages are always root-relative (they go
 * through href() in paths.ts), so any absolute http(s) URL is another site.
 * Hand-written anchors in .astro files use newTabAttrs() too; Markdown bodies
 * get the same treatment from src/lib/markdown-links.mjs.
 */
export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function isPdf(url: string): boolean {
  return /\.pdf(?:[?#]|$)/i.test(url);
}

export function opensInNewTab(url: string): boolean {
  return isExternal(url) || isPdf(url);
}

/** Spread onto an <a>: `<a href={url} {...newTabAttrs(url)}>`. */
export function newTabAttrs(url: string): { target?: '_blank'; rel?: string } {
  return opensInNewTab(url) ? { target: '_blank', rel: 'noopener' } : {};
}
