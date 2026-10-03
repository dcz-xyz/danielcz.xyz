import type { APIRoute } from 'astro';

// The staging site (GitHub Pages at github.io) is not crawlable; production and local builds are.
const isStaging = new URL(import.meta.env.SITE).hostname.endsWith('github.io');

const body = isStaging ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n';

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
