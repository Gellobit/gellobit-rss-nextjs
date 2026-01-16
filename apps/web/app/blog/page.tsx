import React from 'react';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import { Calendar } from 'lucide-react';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import AdContainer from '@/components/AdContainer';
import UserNav from '@/components/UserNav';

// Revalidate page every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Blog',
    description: 'Latest articles and guides',
};

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

// Cached function to fetch published posts
const getPosts = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, featured_image_url, published_at, created_at')
            .eq('status', 'published')
            .order('published_at', { ascending: false, nullsFirst: false });

        if (error) {
            console.error('Error fetching posts:', error);
            return [];
        }

        return data || [];
    },
    ['blog-posts'],
    { revalidate: 60, tags: ['posts'] }
);

export default async function BlogPage() {
    const [posts, branding] = await Promise.all([
        getPosts(),
        getBranding()
    ]);

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
                    <UserNav />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-4">Blog</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Latest articles, guides, and updates
                    </p>
                </div>

                {/* Ad Unit */}
                <AdContainer format="horizontal" position="top" className="mb-8" />

                {/* Posts Grid */}
                {posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                        <p className="text-slate-500 text-lg">No posts published yet.</p>
                        <p className="text-slate-400 text-sm mt-2">Check back soon for new content!</p>
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
                                <a
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
                                        <div className="aspect-video w-full bg-gradient-to-br from-[#FFDE59] to-yellow-400 flex items-center justify-center">
                                            <span className="text-6xl font-black text-white/30">GB</span>
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
                                </a>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
