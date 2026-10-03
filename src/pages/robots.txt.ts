import type { APIRoute } from 'astro';

// Only the production domain is crawlable; staging (github.io) and local builds are not.
const isProduction = new URL(import.meta.env.SITE).hostname === 'danielcz.xyz';

const body = isProduction ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
