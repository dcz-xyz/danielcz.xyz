/**
 * Content collections (Astro content layer).
 *
 *   src/content/publications/<key>.yaml   one file per paper
 *   src/content/projects/<slug>.md        frontmatter + Markdown body per project
 *
 * The schemas are deliberately strict: every image needs alt text, tags come
 * from a fixed list, unknown fields are rejected, and cross-references
 * (publication <-> project) must resolve. See README.md for the field guide.
 */
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const PROJECT_TAGS = ['research', 'not-research'] as const;
export const DEMOS = ['MoireExplorer'] as const;

const nonEmpty = z.string().trim().min(1, 'must not be empty');
const httpUrl = z.string().url().startsWith('http', 'must be an absolute http(s) URL');

const publications = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/publications' }),
  schema: ({ image }) =>
    z
      .object({
        title: nonEmpty,
        /** Authors in publication order, exactly as they should print. */
        authors: z.array(nonEmpty).min(1),
        /** Names (from `authors`) that carry the equal-contribution marker. */
        equalContribution: z.array(nonEmpty).default([]),
        /** Short tag shown on the card, e.g. "ACM UIST 2024". */
        venue: nonEmpty,
        /** Full venue / citation string, verbatim. */
        venueFull: nonEmpty,
        year: z.number().int().min(1990).max(2100),
        /** Publication date; drives the newest-first ordering. */
        date: z.coerce.date(),
        thumbnail: image(),
        thumbnailAlt: nonEmpty,
        links: z
          .object({
            /** Site-root path to a self-hosted PDF in public/pdfs/. */
            pdf: z
              .string()
              .regex(/^\/pdfs\/[\w.-]+\.pdf$/, 'pdf must look like /pdfs/<file>.pdf')
              .optional(),
            doi: httpUrl.optional(),
            video: httpUrl.optional(),
            code: httpUrl.optional(),
          })
          .strict()
          .default({}),
        /** Optional slug of the related project page. */
        project: reference('projects').optional(),
      })
      .strict()
      .refine((p) => p.equalContribution.every((name) => p.authors.includes(name)), {
        message: 'every equalContribution name must also appear in authors',
        path: ['equalContribution'],
      })
      .refine((p) => p.date.getUTCFullYear() === p.year, {
        message: 'date and year disagree',
        path: ['date'],
      }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: nonEmpty,
        subtitle: nonEmpty,
        /** A year or a range, e.g. 2024 or "2011-2015". */
        year: z.union([z.number().int(), nonEmpty]).transform(String),
        tags: z.array(z.enum(PROJECT_TAGS)).min(1),
        /** Large image at the top of the project page. */
        hero: image(),
        heroAlt: nonEmpty,
        /** Card image for the Work grid; defaults to the hero when omitted. */
        thumbnail: image().optional(),
        thumbnailAlt: nonEmpty.optional(),
        /** Further images for the project page gallery, in display order. */
        gallery: z
          .array(
            z
              .object({
                src: image(),
                alt: nonEmpty,
                caption: z.string().optional(),
              })
              .strict(),
          )
          .default([]),
        /** Optional YouTube URL shown in the hero slot. */
        video: httpUrl.optional(),
        /** Position in the Work grid (1 = first). */
        order: z.number().int().positive(),
        collaborators: z.array(nonEmpty).default([]),
        links: z
          .object({
            /** Key of the related publication (file name without .yaml). */
            paper: reference('publications').optional(),
          })
          .strict()
          .default({}),
        /** Old Squarespace paths that redirect here, e.g. "/key-1". */
        legacyPaths: z
          .array(z.string().regex(/^\/[a-z0-9-]+$/, 'legacy path like /old-slug'))
          .default([]),
        /** Name of the interactive island to mount (Phase 4). */
        demo: z.enum(DEMOS).optional(),
      })
      .strict()
      .refine((p) => !p.thumbnail || !!p.thumbnailAlt, {
        message: 'thumbnailAlt is required when thumbnail is set',
        path: ['thumbnailAlt'],
      }),
});

export const collections = { publications, projects };
