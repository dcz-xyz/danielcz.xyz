import type { ImageMetadata } from 'astro';

/**
 * Alt text is encouraged, not required. An image whose alt text is missing or
 * still a "TODO" placeholder renders with alt="" (so it is treated as decorative
 * and passes the accessibility checks) and the build prints one warning naming
 * the entry and the image. Nothing fails. `npm run content` lists the same
 * images before the build.
 */
export const PLACEHOLDER_ALT = /\bTODO\b/i;

const warned = new Set<string>();

/** Returns usable alt text, or "" (with a warning) when none was written. */
export function altText(value: string | undefined, where: string): string {
  const alt = value?.trim() ?? '';
  if (alt && !PLACEHOLDER_ALT.test(alt)) return alt;
  const message = `  warning: ${where}: ${alt ? 'placeholder' : 'no'} alt text, rendering alt=""`;
  if (!warned.has(message)) {
    warned.add(message);
    console.warn(message);
  }
  return '';
}

/** Short file name of an imported image, for warnings. */
export function imageName(image: ImageMetadata): string {
  const file = image.src.split('?')[0]?.split('/').pop() ?? image.src;
  // Built assets are hashed ("beehive.LOk9Dz4Z.jpg"); drop the hash segment.
  return file.replace(/\.[A-Za-z0-9_-]{8}\.(\w+)$/, '.$1');
}
