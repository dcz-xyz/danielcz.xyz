import type { ImageMetadata } from 'astro';

/**
 * Gallery layouts for project pages. Set per project with `galleryLayout:` in
 * the frontmatter; projects that omit it use DEFAULT_GALLERY_LAYOUT.
 *
 *   slideshow  one large image at a time with arrows and a thumbnail strip
 *              (like the old Squarespace carousel); the hero is the first slide
 *   grid       hero on top, then a two-column grid of figures after the text
 *   stack      hero on top, then full-width figures one after another
 *   filmstrip  hero on top, then a horizontally scrolling row at a fixed height
 */
export const GALLERY_LAYOUTS = ['slideshow', 'grid', 'stack', 'filmstrip'] as const;
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];

export const DEFAULT_GALLERY_LAYOUT: GalleryLayout = 'slideshow';

export interface GalleryItem {
  src: ImageMetadata;
  alt: string;
  caption?: string;
  /** Public path to a silent MP4; `src` is its poster. */
  video?: string;
}
