import { MetadataRoute } from 'next';

/**
 * Robots.txt Generator
 * Controls which pages search engines can crawl and index
 *
 * Allowed (public evergreen content):
 * - Homepage
 * - Blog posts (/[slug]) - evergreen SEO content
 * - Info pages (/p/*) - static informational pages
 *
 * Disallowed (protected/private content):
 * - /opportunities/* (protected behind login/premium, perishable content)
 * - /admin/* (admin panel)
 * - /account/* (user account)
 * - /auth (authentication pages)
 * - /pricing (optional)
 * - /api/* (all API endpoints)
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/p/*',
        ],
        disallow: [
          '/opportunities',
          '/opportunities/*',
          '/admin',
          '/admin/*',
          '/account',
          '/account/*',
          '/auth',
          '/auth/*',
          '/pricing',
          '/saved',
          '/api/*',
          '/*.json$',
          '/404',
          '/500',
        ],
      },
      {
        // Block AI training bots (optional - can be removed if you want AI to train on your content)
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
