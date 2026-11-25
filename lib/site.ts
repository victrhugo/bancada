/**
 * Canonical public URL of the site. Every absolute link, canonical tag,
 * sitemap entry and social-image URL is built from this value.
 *
 * To move to a custom domain, set NEXT_PUBLIC_SITE_URL in the hosting
 * provider instead of editing code.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada-9g8r.vercel.app'
).replace(/\/+$/, '');

/** Host part of SITE_URL, for display in UI text. */
export const SITE_HOST = new URL(SITE_URL).host;
