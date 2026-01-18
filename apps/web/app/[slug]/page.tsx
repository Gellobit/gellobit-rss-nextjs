import React from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import { Calendar, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import MobileNavBar from '@/components/MobileNavBar';
import AdContainer from '@/components/AdContainer';
import UserNav from '@/components/UserNav';
import ShareButton from '@/components/ShareButton';

// Revalidate page every 60 seconds
export const revalidate = 60;

// Cached function to fetch branding settings
const getBranding = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data: logoSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_logo_url')
            .maybeSingle();

        const { data: nameSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_name')
            .maybeSingle();

        return {
            logoUrl: logoSetting?.value || null,
            appName: nameSetting?.value || 'GelloBit',
        };
    },
    ['branding'],
    { revalidate: 300, tags: ['branding'] }
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

// Get content by slug (checks pages first, then posts)
async function getContent(slug: string) {
    // First check if it's a page
    const page = await getPage(slug);
    if (page) return page;

    // Then check if it's a post
    const post = await getPost(slug);
    if (post) return post;

    return null;
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

    const title = content.meta_title || content.title;
    const description = content.meta_description || (content.type === 'post' ? content.excerpt : undefined);
    const isPost = content.type === 'post';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gellobit.com';
    const canonicalUrl = `${siteUrl}/${slug}`;

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

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [content, branding] = await Promise.all([
        getContent(slug),
        getBranding()
    ]);

    if (!content) {
        notFound();
    }

    const isPost = content.type === 'post';
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
                                className="app-logo h-10 object-contain"
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
                                className="app-logo h-8 object-contain"
                            />
                        ) : (
                            <div className="app-logo bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm shadow-sm">GB</div>
                        )}
                        <span className="app-name font-black text-lg tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
                    </a>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
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

                                {/* Share Button */}
                                <ShareButton title={content.title} />
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

                        {/* Content */}
                        <div
                            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600 prose-strong:text-slate-900 prose-img:rounded-2xl"
                            dangerouslySetInnerHTML={{ __html: content.content }}
                        />

                        {/* Ad Unit */}
                        <AdContainer format="horizontal" position="bottom" className="mt-8" />
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
