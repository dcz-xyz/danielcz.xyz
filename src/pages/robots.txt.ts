import type { APIRoute } from 'astro';

// The staging site (GitHub Pages at github.io) is not crawlable; production and local builds are.
const site = new URL(import.meta.env.SITE);
const isStaging = site.hostname.endsWith('github.io');
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
const sitemapUrl = new URL(`${base}/sitemap-index.xml`, site).href;

const body = isStaging
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
