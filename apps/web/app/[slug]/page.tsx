import React from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import { Calendar, Share2, ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import MobileNavBar from '@/components/MobileNavBar';
import AdContainer from '@/components/AdContainer';
import UserNav from '@/components/UserNav';

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
    const content = await getContent(slug);

    if (!content) {
        return {
            title: 'Not Found',
        };
    }

    const title = content.meta_title || content.title;
    const description = content.meta_description || (content.type === 'post' ? content.excerpt : undefined);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: content.featured_image_url ? [content.featured_image_url] : undefined,
            type: content.type === 'post' ? 'article' : 'website',
            publishedTime: content.type === 'post' && content.published_at ? content.published_at : undefined,
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
            {/* Navigation - Desktop */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt={branding.appName}
                                className="h-10 object-contain"
                            />
                        ) : (
                            <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                        )}
                        <span className="text-sm font-bold text-[#1a1a1a]">{branding.appName}</span>
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
                                className="h-8 object-contain"
                            />
                        ) : (
                            <div className="bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm shadow-sm">GB</div>
                        )}
                        <span className="font-black text-lg tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
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
                        {/* Post Header with Date */}
                        {isPost && formattedDate && (
                            <div className="flex items-center gap-4 mb-6 text-slate-500 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <time dateTime={content.published_at || content.created_at}>{formattedDate}</time>
                                </div>
                                <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <Share2 size={18} />
                                </button>
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
