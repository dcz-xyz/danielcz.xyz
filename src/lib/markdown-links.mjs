/**
 * Markdown plugin (for Astro's Sätteri processor) for links in project bodies:
 *
 *  - root-relative links and images (e.g. /pdfs/file.pdf) get the deploy base,
 *    so they work both at "/" (production) and "/danielcz.xyz/" (staging);
 *    frontmatter links already go through href() in src/lib/paths.ts.
 *  - links to other sites (absolute http(s) URLs) open in a new tab with
 *    rel="noopener", matching src/lib/links.ts for the rest of the site.
 *
 * Wired up in astro.config.mjs.
 */
export default function markdownLinks(base = '/') {
  const prefix = base.replace(/\/+$/, '');
  return {
    name: 'links',
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        const key = node.tagName === 'a' ? 'href' : 'src';
        const value = node.properties?.[key];
        if (typeof value !== 'string') return;
        if (prefix && value.startsWith('/') && !value.startsWith('//')) {
          ctx.setProperty(node, key, `${prefix}${value}`);
        } else if (node.tagName === 'a' && /^https?:\/\//i.test(value)) {
          ctx.setProperty(node, 'target', '_blank');
          ctx.setProperty(node, 'rel', 'noopener');
        }
      },
    },
  };
}
