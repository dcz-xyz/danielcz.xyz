/**
 * Links that leave the site open in a new tab. Internal links are always
 * root-relative (they go through href() in paths.ts), so any absolute http(s)
 * URL is another site: other people's pages, DOIs, YouTube, GitHub.
 * Hand-written anchors in .astro files add the same two attributes literally;
 * Markdown bodies get them from src/lib/markdown-links.mjs.
 */
export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Spread onto an <a>: `<a href={url} {...externalAttrs(url)}>`. */
export function externalAttrs(url: string): { target?: '_blank'; rel?: string } {
  return isExternal(url) ? { target: '_blank', rel: 'noopener' } : {};
}
