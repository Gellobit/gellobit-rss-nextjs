import React from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import { Calendar, Share2, ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/utils/supabase-admin';

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

// Cached function to fetch blog post
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

        return data;
    },
    ['blog-post'],
    { revalidate: 60, tags: ['posts'] }
);

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt || undefined,
        openGraph: {
            title: post.meta_title || post.title,
            description: post.meta_description || post.excerpt || undefined,
            images: post.featured_image_url ? [post.featured_image_url] : undefined,
            type: 'article',
            publishedTime: post.published_at || undefined,
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [post, branding] = await Promise.all([
        getPost(slug),
        getBranding()
    ]);

    if (!post) {
        notFound();
    }

    const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt={branding.appName}
                                className="h-10 object-contain"
                            />
                        ) : (
                            <>
                                <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                                <span className="font-black text-2xl tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
                            </>
                        )}
                    </a>
                    <a href="/blog" className="text-sm font-bold text-slate-500 hover:text-[#1a1a1a] flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Blog
                    </a>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <article className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">

                    {/* Featured Image */}
                    {post.featured_image_url && (
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={post.featured_image_url}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
                            </div>
                            <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-[#1a1a1a] mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed border-l-4 border-[#FFDE59] pl-6">
                                {post.excerpt}
                            </p>
                        )}

                        {/* Content */}
                        <div
                            className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600 prose-strong:text-slate-900 prose-img:rounded-2xl"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                </article>

                {/* Back to blog link */}
                <div className="text-center mt-12">
                    <a
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a1a1a] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to all posts
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
