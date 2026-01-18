import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with public evergreen URLs for search engines
 *
 * URLs included:
 * - Homepage
 * - Published posts/blog (/[slug]) - evergreen SEO content
 * - Published info pages (/p/[slug]) - static informational pages
 *
 * URLs excluded:
 * - /opportunities/* (protected content, requires login/premium)
 * - /admin/* (admin panel)
 * - /account/* (user area)
 * - /auth (authentication)
 * - /pricing (optional - not indexed)
 *
 * Note: Opportunities are NOT included because:
 * - They are perishable content with deadlines
 * - They are protected behind login/registration/premium
 * - Search engines typically don't index protected content
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Static pages - only homepage (evergreen)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Fetch published posts (blog posts / evergreen SEO content)
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${SITE_URL}/${post.slug}`,
    lastModified: post.updated_at || now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Fetch published info pages (static informational pages)
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const infoPages: MetadataRoute.Sitemap = (pages || []).map((page) => ({
    url: `${SITE_URL}/p/${page.slug}`,
    lastModified: page.updated_at || now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Combine all URLs (only evergreen public content)
  return [
    ...staticPages,
    ...postPages,
    ...infoPages,
  ];
}
