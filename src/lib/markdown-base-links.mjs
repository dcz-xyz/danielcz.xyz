/**
 * Markdown plugin (for Astro's Sätteri processor): prefixes the deploy base onto
 * root-relative links and images in project bodies, so a project can write
 * [Press release](/pdfs/file.pdf) and the link works both at "/" (production)
 * and at "/danielcz.xyz/" (staging). Frontmatter links already go through
 * href() in src/lib/paths.ts; this does the same for prose. Wired up in
 * astro.config.mjs; returns null (no plugin) when the base is "/".
 */
export default function markdownBaseLinks(base = '/') {
  const prefix = base.replace(/\/+$/, '');
  if (!prefix) return null;
  return {
    name: 'base-links',
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        const key = node.tagName === 'a' ? 'href' : 'src';
        const value = node.properties?.[key];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
          ctx.setProperty(node, key, `${prefix}${value}`);
        }
      },
    },
  };
}
