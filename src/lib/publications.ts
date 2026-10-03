import type { CollectionEntry } from 'astro:content';

/** Daniel's name as it appears in author lists; rendered in bold. */
export const ME = 'Daniel Campos Zamora';

/** Newest first; same-day papers fall back to title order. */
export function sortPublications(pubs: CollectionEntry<'publications'>[]) {
  return [...pubs].sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.data.title.localeCompare(b.data.title),
  );
}

/** Label for the DOI pill, matching the old site's "ACM DL" / "IEEE Xplore" wording. */
export function doiLabel(url: string): string {
  if (/doi\.org\/10\.1145\//i.test(url) || /dl\.acm\.org/i.test(url)) return 'ACM DL';
  if (/doi\.org\/10\.1109\//i.test(url) || /ieeexplore\.ieee\.org/i.test(url)) return 'IEEE Xplore';
  return 'DOI';
}

/** "A, B, and C" / "A and B" / "A", with each author annotated for rendering. */
export function authorRuns(authors: string[], equal: string[]) {
  const n = authors.length;
  return authors.map((name, i) => ({
    name,
    me: name === ME,
    star: equal.includes(name),
    separator: i >= n - 1 ? '' : i === n - 2 ? (n > 2 ? ', and ' : ' and ') : ', ',
  }));
}
