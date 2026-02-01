import React from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import { Calendar, Share2, ArrowLeft, Tag, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { createServerClient } from '@/lib/utils/supabase-server';
import MobileNavBar from '@/components/MobileNavBar';
import UserNav from '@/components/UserNav';
import ShareButton from '@/components/ShareButton';
import Sidebar from '@/components/Sidebar';
import DynamicSidebarCTA from '@/components/DynamicSidebarCTA';
import ContentWithAds from '@/components/ContentWithAds';
import AdContainer from '@/components/AdContainer';
import OpportunityPreviewGrid from '@/components/OpportunityPreviewGrid';

// Map opportunity type values to display labels
const opportunityTypeLabels: Record<string, string> = {
    giveaway: 'Giveaways',
    contest: 'Contests',
    sweepstakes: 'Sweepstakes',
    dream_job: 'Dream Jobs',
    get_paid_to: 'Get Paid To',
    instant_win: 'Instant Wins',
    job_fair: 'Job Fairs',
    scholarship: 'Scholarships',
    volunteer: 'Volunteer Opportunities',
    free_training: 'Free Training',
    promo: 'Promos',
};

// Revalidate page every 60 seconds
export const revalidate = 60;

// Cached function to fetch branding settings
const getBranding = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const [logoResult, nameResult, spinEnabledResult, spinDurationResult] = await Promise.all([
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.app_logo_url')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.app_name')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.logo_spin_enabled')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.logo_spin_duration')
                .maybeSingle(),
        ]);

        // Parse logo spin enabled (could be boolean or string)
        const spinEnabled = spinEnabledResult.data?.value;
        const logoSpinEnabled = spinEnabled === true || spinEnabled === 'true';

        // Parse logo spin duration (default to 6 seconds)
        const spinDuration = spinDurationResult.data?.value;
        const logoSpinDuration = typeof spinDuration === 'number' ? spinDuration : parseInt(spinDuration) || 6;

        return {
            logoUrl: logoResult.data?.value || null,
            appName: nameResult.data?.value || 'GelloBit',
            logoSpinEnabled,
            logoSpinDuration,
        };
    },
    ['branding'],
    { revalidate: 300, tags: ['branding'] }
);

// Cached function to fetch category by slug
const getCategory = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return null;
        }

        return { ...data, type: 'category' as const };
    },
    ['category'],
    { revalidate: 60, tags: ['categories'] }
);

// Cached function to fetch posts by category
const getPostsByCategory = unstable_cache(
    async (categoryId: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, featured_image_url, published_at, created_at')
            .eq('status', 'published')
            .eq('category_id', categoryId)
            .order('published_at', { ascending: false, nullsFirst: false });

        if (error || !data) {
            return [];
        }

        return data;
    },
    ['category-posts'],
    { revalidate: 60, tags: ['posts', 'categories'] }
);

// Cached function to fetch page by slug
const getPage = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !data) {
            return null;
        }

        return { ...data, type: 'page' as const };
    },
    ['static-page'],
    { revalidate: 60, tags: ['pages'] }
);

// Cached function to fetch blog post by slug
const getPost = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !data) {
            return null;
        }

        return { ...data, type: 'post' as const };
    },
    ['blog-post'],
    { revalidate: 60, tags: ['posts'] }
);

// Get content by slug (checks categories first, then pages, then posts)
async function getContent(slug: string) {
    // First check if it's a category
    const category = await getCategory(slug);
    if (category) return category;

    // Then check if it's a page
    const page = await getPage(slug);
    if (page) return page;

    // Finally check if it's a post
    const post = await getPost(slug);
    if (post) return post;

    return null;
}

// Cached function to fetch opportunities by type for pillar pages
const getOpportunitiesByType = unstable_cache(
    async (opportunityType: string, limit: number = 6) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('opportunities')
            .select('id, slug, title, excerpt, featured_image_url, opportunity_type, deadline, prize_value, published_at')
            .eq('status', 'published')
            .eq('opportunity_type', opportunityType)
            .order('published_at', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data;
    },
    ['pillar-opportunities'],
    { revalidate: 300, tags: ['opportunities'] }
);

// Cached function to fetch related posts
const getRelatedPosts = unstable_cache(
    async (currentSlug: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select('slug, title, featured_image_url, published_at')
            .eq('status', 'published')
            .neq('slug', currentSlug)
            .order('published_at', { ascending: false })
            .limit(5);

        if (error || !data) {
            return [];
        }

        return data.map(post => ({
            title: post.title,
            slug: post.slug,
            imageUrl: post.featured_image_url,
            date: post.published_at,
        }));
    },
    ['related-posts'],
    { revalidate: 300, tags: ['posts'] }
);

// Check if current user is admin (not cached - user-specific)
async function checkIsAdmin(): Promise<boolean> {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'admin';
    } catch {
        return false;
    }
}

// Calculate reading time from content
function calculateReadingTime(content: string): string {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed
    return `${minutes} min read`;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const [content, branding] = await Promise.all([
        getContent(slug),
        getBranding()
    ]);

    if (!content) {
        return {
            title: 'Not Found',
        };
    }

    const isCategory = content.type === 'category';
    const isPost = content.type === 'post';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';
    const canonicalUrl = `${siteUrl}/${slug}${isCategory ? '/' : ''}`;

    // For categories
    if (isCategory) {
        const title = content.meta_title || `${content.name} - ${branding.appName}`;
        const description = content.meta_description || content.description || `Browse all ${content.name} articles and posts.`;

        return {
            title,
            description,
            alternates: {
                canonical: canonicalUrl,
            },
            openGraph: {
                title,
                description,
                url: canonicalUrl,
                siteName: branding.appName,
                type: 'website',
            },
            twitter: {
                card: 'summary',
                title,
                description,
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
        };
    }

    // For pages and posts
    const title = content.meta_title || content.title;
    const description = content.meta_description || (isPost ? content.excerpt : undefined);

    return {
        title,
        description,
        authors: isPost ? [{ name: 'Gellobit Team', url: `${siteUrl}/about` }] : undefined,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: branding.appName,
            images: content.featured_image_url ? [{
                url: content.featured_image_url,
                width: 1200,
                height: 630,
                alt: title,
            }] : undefined,
            type: isPost ? 'article' : 'website',
            ...(isPost && content.published_at && {
                publishedTime: content.published_at,
                modifiedTime: content.updated_at || content.published_at,
                authors: ['Gellobit Team'],
            }),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: content.featured_image_url ? [content.featured_image_url] : undefined,
        },
        robots: {
            index: true,
            follow: true,
            noimageindex: true,
            googleBot: {
                index: true,
                follow: true,
                noimageindex: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [content, branding] = await Promise.all([
        getContent(slug),
        getBranding()
    ]);

    if (!content) {
        notFound();
    }

    const isCategory = content.type === 'category';
    const isPost = content.type === 'post';

    // For categories, render the category page
    if (isCategory) {
        const posts = await getPostsByCategory(content.id);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';

        // JSON-LD for category (CollectionPage)
        const categoryJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: content.name,
            description: content.description || `Articles in ${content.name} category`,
            url: `${siteUrl}/${slug}/`,
            publisher: {
                '@type': 'Organization',
                name: branding.appName,
                url: siteUrl,
            },
        };

        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
                {/* JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
                />

                {/* Navigation - Desktop */}
                <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 hidden md:block">
                    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                        <a href="/" className="flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    alt={branding.appName}
                                    className={`app-logo h-10 object-contain${branding.logoSpinEnabled ? ' logo-spin' : ''}`}
                                    style={branding.logoSpinEnabled && branding.logoSpinDuration
                                        ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
                                        : undefined}
                                />
                            ) : (
                                <div className="app-logo bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                            )}
                            <span className="app-name text-sm font-bold text-[#1a1a1a]">{branding.appName}</span>
                        </a>
                        <UserNav />
                    </div>
                </nav>

                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <a href="/" className="flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    alt={branding.appName}
                                    className={`app-logo h-8 object-contain${branding.logoSpinEnabled ? ' logo-spin' : ''}`}
                                    style={branding.logoSpinEnabled && branding.logoSpinDuration
                                        ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
                                        : undefined}
                                />
                            ) : (
                                <div className="app-logo bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm shadow-sm">GB</div>
                            )}
                            <span className="app-name font-black text-lg tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
                        </a>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 py-12">
                    {/* Category Header */}
                    <div className="text-center mb-12">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
                            style={{ backgroundColor: `${content.color}20`, color: content.color }}
                        >
                            <Tag size={16} />
                            Category
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-4">{content.name}</h1>
                        {content.description && (
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                {content.description}
                            </p>
                        )}
                    </div>

                    {/* Ad Unit */}
                    <AdContainer format="horizontal" position="top" className="mb-8" />

                    {/* Posts Grid */}
                    {posts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                            <p className="text-slate-500 text-lg">No posts in this category yet.</p>
                            <p className="text-slate-400 text-sm mt-2">Check back soon for new content!</p>
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Browse All Posts
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => {
                                const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });

                                return (
                                    <Link
                                        key={post.id}
                                        href={`/${post.slug}`}
                                        className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all group"
                                    >
                                        {/* Featured Image */}
                                        {post.featured_image_url ? (
                                            <div className="aspect-video w-full overflow-hidden">
                                                <img
                                                    src={post.featured_image_url}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className="aspect-video w-full flex items-center justify-center"
                                                style={{ backgroundColor: `${content.color}20` }}
                                            >
                                                <span className="text-6xl font-black" style={{ color: `${content.color}40` }}>
                                                    {content.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-6">
                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                                                <Calendar size={14} />
                                                <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
                                            </div>

                                            {/* Title */}
                                            <h2 className="text-xl font-bold text-[#1a1a1a] mb-3 group-hover:text-yellow-600 transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>

                                            {/* Excerpt */}
                                            {post.excerpt && (
                                                <p className="text-slate-600 text-sm line-clamp-3">
                                                    {post.excerpt}
                                                </p>
                                            )}

                                            {/* Read More */}
                                            <div className="mt-4 text-sm font-bold text-yellow-600 group-hover:text-yellow-700">
                                                Read more &rarr;
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Back link */}
                    <div className="text-center mt-12">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to all posts
                        </Link>
                    </div>
                </main>

                {/* Footer - desktop only */}
                <footer className="hidden md:block bg-white border-t border-slate-100 py-8 mt-12">
                    <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
                        <p>&copy; {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                    </div>
                </footer>

                {/* Mobile Nav Bar */}
                <MobileNavBar />
            </div>
        );
    }

    // For pages and posts
    // Fetch related posts only for blog posts
    const [relatedPosts, isAdmin] = await Promise.all([
        isPost ? getRelatedPosts(slug) : Promise.resolve([]),
        checkIsAdmin()
    ]);
    const readingTime = isPost ? calculateReadingTime(content.content) : undefined;

    // Check if this is a pillar page (page with linked opportunity type)
    const isPillarPage = !isPost && content.linked_opportunity_type;
    const pillarOpportunities = isPillarPage
        ? await getOpportunitiesByType(content.linked_opportunity_type, 6)
        : [];
    const opportunityTypeLabel = isPillarPage
        ? opportunityTypeLabels[content.linked_opportunity_type] || content.linked_opportunity_type
        : '';

    const formattedDate = isPost && content.published_at
        ? new Date(content.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

    // JSON-LD structured data for blog posts
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';
    const jsonLd = isPost ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: content.title,
        description: content.excerpt || content.meta_description,
        image: content.featured_image_url || undefined,
        datePublished: content.published_at,
        dateModified: content.updated_at || content.published_at,
        author: {
            '@type': 'Organization',
            name: 'Gellobit Team',
            url: `${siteUrl}/about`,
            logo: branding.logoUrl || `${siteUrl}/logo.png`,
        },
        publisher: {
            '@type': 'Organization',
            name: branding.appName,
            url: siteUrl,
            logo: branding.logoUrl || `${siteUrl}/logo.png`,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/${slug}`,
        },
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* JSON-LD Structured Data for SEO */}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {/* Navigation - Desktop */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt={branding.appName}
                                className={`app-logo h-10 object-contain${branding.logoSpinEnabled ? ' logo-spin' : ''}`}
                                style={branding.logoSpinEnabled && branding.logoSpinDuration
                                    ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
                                    : undefined}
                            />
                        ) : (
                            <div className="app-logo bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                        )}
                        <span className="app-name text-sm font-bold text-[#1a1a1a]">{branding.appName}</span>
                    </a>
                    <UserNav />
                </div>
            </nav>

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4">
                <div className="flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt={branding.appName}
                                className={`app-logo h-8 object-contain${branding.logoSpinEnabled ? ' logo-spin' : ''}`}
                                style={branding.logoSpinEnabled && branding.logoSpinDuration
                                    ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
                                    : undefined}
                            />
                        ) : (
                            <div className="app-logo bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm shadow-sm">GB</div>
                        )}
                        <span className="app-name font-black text-lg tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
                    </a>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="flex gap-8">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <article className="bg-white rounded-2xl md:rounded-[32px] overflow-hidden shadow-sm border border-slate-100">

                            {/* Featured Image */}
                            {content.featured_image_url && (
                                <div className="aspect-video w-full overflow-hidden">
                                    <img
                                        src={content.featured_image_url}
                                        alt={content.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-6 md:p-12">
                                {/* Post Header with Author, Date, and Share */}
                                {isPost && (
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            {/* Author */}
                                            <Link href="/about" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                {branding.logoUrl ? (
                                                    <img
                                                        src={branding.logoUrl}
                                                        alt="Gellobit Team"
                                                        className="w-8 h-8 rounded-full object-contain bg-[#FFDE59]"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-[#FFDE59] rounded-full flex items-center justify-center font-black text-xs text-[#1a1a1a]">
                                                        GB
                                                    </div>
                                                )}
                                                <span className="text-sm font-bold text-slate-700">Gellobit Team</span>
                                            </Link>

                                            {/* Date */}
                                            {formattedDate && (
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <span className="hidden sm:inline">•</span>
                                                    <Calendar size={14} className="hidden sm:inline" />
                                                    <time dateTime={content.published_at || content.created_at}>{formattedDate}</time>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {/* Admin Edit Button */}
                                            {isAdmin && (
                                                <a
                                                    href={`/admin?section=blog&edit=${content.id}`}
                                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit Post"
                                                >
                                                    <Edit2 size={18} />
                                                </a>
                                            )}
                                            {/* Share Button */}
                                            <ShareButton title={content.title} />
                                        </div>
                                    </div>
                                )}

                                <h1 className="text-2xl md:text-4xl font-black text-[#1a1a1a] mb-6 md:mb-8 leading-tight">
                                    {content.title}
                                </h1>

                                {/* Excerpt for posts */}
                                {isPost && content.excerpt && (
                                    <p className="text-xl text-slate-600 mb-10 leading-relaxed border-l-4 border-[#FFDE59] pl-6">
                                        {content.excerpt}
                                    </p>
                                )}

                                {/* Content with Inline Ads (for posts) */}
                                {isPost ? (
                                    <ContentWithAds
                                        content={content.content}
                                        className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600 prose-strong:text-slate-900 prose-img:rounded-2xl"
                                        showAds={true}
                                        adFormat="horizontal"
                                        showAdAfterFirst={true}
                                        showAdMiddle={true}
                                        showAdBottom={true}
                                        minParagraphsForMiddleAd={6}
                                    />
                                ) : (
                                    <>
                                        {/* Static pages - no inline ads */}
                                        <div
                                            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600 prose-strong:text-slate-900 prose-img:rounded-2xl"
                                            dangerouslySetInnerHTML={{ __html: content.content }}
                                        />

                                        {/* Pillar Page - Show opportunities grid */}
                                        {isPillarPage && (
                                            <OpportunityPreviewGrid
                                                opportunities={pillarOpportunities}
                                                opportunityType={content.linked_opportunity_type}
                                                opportunityTypeLabel={opportunityTypeLabel}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </article>

                        {/* Back link - desktop only */}
                        <div className="hidden md:block text-center mt-12">
                            <a
                                href={isPost ? "/blog" : "/"}
                                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors"
                            >
                                <ArrowLeft size={16} />
                                {isPost ? 'Back to all posts' : 'Back to home'}
                            </a>
                        </div>
                    </div>

                    {/* Sidebar - Desktop only, only for posts */}
                    {isPost && (
                        <Sidebar
                            showAd={true}
                            adPosition="top"
                            author={{
                                name: 'Gellobit Team',
                                imageUrl: branding.logoUrl || undefined,
                                description: 'Helping you discover the best opportunities online.',
                                link: '/about'
                            }}
                            publishedDate={content.published_at}
                            readingTime={readingTime}
                            relatedItems={relatedPosts}
                            relatedTitle="More Posts"
                        >
                            {/* Dynamic CTA Widget - changes based on user auth state */}
                            <DynamicSidebarCTA />
                        </Sidebar>
                    )}
                </div>
            </main>

            {/* Footer - desktop only */}
            <footer className="hidden md:block bg-white border-t border-slate-100 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                </div>
            </footer>

            {/* Mobile Nav Bar */}
            <MobileNavBar />
        </div>
    );
}
