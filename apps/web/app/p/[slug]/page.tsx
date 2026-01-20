import React from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';
import {
    Share2,
    Flag,
    Calendar,
    MapPin,
    Clock,
    Gift,
    ShieldCheck,
    ExternalLink
} from 'lucide-react';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import FavoriteButton from '@/components/FavoriteButton';
import UserNav from '@/components/UserNav';

// Revalidate page every 60 seconds
export const revalidate = 60;

// Category labels for display
const categoryLabels: Record<string, string> = {
    giveaway: 'Giveaway',
    contest: 'Contest',
    sweepstakes: 'Sweepstakes',
    dream_job: 'Dream Job',
    get_paid_to: 'Get Paid To',
    instant_win: 'Instant Win',
    job_fair: 'Job Fair',
    scholarship: 'Scholarship',
    volunteer: 'Volunteer',
    free_training: 'Free Training',
    promo: 'Promo',
};

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

// Cached function to fetch opportunity with feed settings
const getOpportunity = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();

        // Fetch opportunity with feed settings (for show_source_link)
        const { data, error } = await supabase
            .from('opportunities')
            .select(`
                *,
                source_feed:rss_feeds(show_source_link)
            `)
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !data) {
            return null;
        }

        return data;
    },
    ['opportunity'],
    { revalidate: 60, tags: ['opportunities'] }
);

// Generate metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const [opportunity, branding] = await Promise.all([
        getOpportunity(slug),
        getBranding(),
    ]);

    if (!opportunity) {
        return {
            title: 'Opportunity Not Found',
            robots: { index: false, follow: false },
        };
    }

    const title = opportunity.meta_title || opportunity.title;
    const description = opportunity.meta_description || opportunity.excerpt || `${opportunity.title} - ${categoryLabels[opportunity.opportunity_type] || opportunity.opportunity_type}`;

    // Check if this opportunity should be indexable (public)
    const isPublic = opportunity.is_public === true;

    const metadata: Metadata = {
        title: `${title} | ${branding.appName}`,
        description,
        robots: isPublic
            ? { index: true, follow: true }
            : { index: false, follow: false, nocache: true },
    };

    // Add Open Graph and rich metadata only for public opportunities
    if (isPublic) {
        metadata.openGraph = {
            title,
            description,
            type: 'article',
            publishedTime: opportunity.published_at || opportunity.created_at,
            ...(opportunity.featured_image_url && {
                images: [{ url: opportunity.featured_image_url, width: 1200, height: 630 }],
            }),
        };
        metadata.twitter = {
            card: opportunity.featured_image_url ? 'summary_large_image' : 'summary',
            title,
            description,
            ...(opportunity.featured_image_url && { images: [opportunity.featured_image_url] }),
        };
    }

    return metadata;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [opportunity, branding] = await Promise.all([
        getOpportunity(slug),
        getBranding()
    ]);

    if (!opportunity) {
        notFound();
    }

    const formattedDate = new Date(opportunity.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
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

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content Column */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 p-8 md:p-12">

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                <span className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {categoryLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
                                </span>
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <Calendar size={14} /> <span>{formattedDate}</span>
                                </div>
                                {opportunity.location && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                        <MapPin size={14} /> <span>{opportunity.location}</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-[#1a1a1a] mb-6 leading-tight">
                                {opportunity.title}
                            </h1>

                            {/* Excerpt */}
                            {opportunity.excerpt && (
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                    {opportunity.excerpt}
                                </p>
                            )}

                            <div className="flex items-center justify-between border-y border-slate-100 py-6 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold">
                                        GB
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold text-[#1a1a1a]">Gellobit Team</p>
                                        <p className="text-slate-400">Verified Research Team</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <FavoriteButton
                                        opportunityId={opportunity.id}
                                        className="p-3 rounded-full hover:bg-red-50 transition-colors"
                                        size={20}
                                    />
                                    <button className="p-3 rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                    <button className="p-3 rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
                                        <Flag size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <article
                                className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600 prose-strong:text-slate-900"
                                dangerouslySetInnerHTML={{ __html: opportunity.content }}
                            />

                            {/* Source Link - Only shown if feed has show_source_link enabled */}
                            {opportunity.source_url && opportunity.source_feed?.show_source_link && (
                                <div className="mt-10 pt-6 border-t border-slate-100">
                                    <a
                                        href={opportunity.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                                    >
                                        <ExternalLink size={16} />
                                        View Original Source
                                    </a>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Quick Info Card */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100">
                            <h3 className="font-bold text-lg mb-4">Quick Info</h3>
                            <div className="space-y-4">
                                {/* Publication Date */}
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Published</p>
                                        <p className="font-medium">{new Date(opportunity.published_at || opportunity.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                {opportunity.deadline && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Deadline</p>
                                            <p className="font-medium">{new Date(opportunity.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                )}
                                {opportunity.prize_value && (
                                    <div className="flex items-start gap-3">
                                        <Gift className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Prize / Value</p>
                                            <p className="font-medium">{opportunity.prize_value}</p>
                                        </div>
                                    </div>
                                )}
                                {opportunity.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Location</p>
                                            <p className="font-medium">{opportunity.location}</p>
                                        </div>
                                    </div>
                                )}
                                {opportunity.requirements && (
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Requirements</p>
                                            <p className="font-medium">{opportunity.requirements}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="bg-[#1a1a1a] rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Don't miss out!</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    Opportunities like this expire quickly. Get instant alerts on your phone.
                                </p>
                                <button className="w-full bg-[#FFDE59] text-[#1a1a1a] font-black py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-900/20">
                                    Download App
                                </button>
                            </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-start gap-4">
                            <ShieldCheck className="text-green-500 shrink-0" size={32} />
                            <div>
                                <h4 className="font-bold text-[#1a1a1a] mb-1">AI Verified</h4>
                                <p className="text-sm text-slate-500">
                                    This opportunity has been processed by our AI system. Always verify details before participating.
                                </p>
                                {opportunity.confidence_score && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        Confidence: {(opportunity.confidence_score * 100).toFixed(0)}%
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
