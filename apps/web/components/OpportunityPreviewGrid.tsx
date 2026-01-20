'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Gift, Trophy, DollarSign, Sparkles, UserPlus } from 'lucide-react';

interface Opportunity {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    opportunity_type: string;
    deadline: string | null;
    prize_value: string | null;
    published_at: string | null;
}

interface OpportunityPreviewGridProps {
    opportunities: Opportunity[];
    opportunityType: string;
    opportunityTypeLabel: string;
}

const typeColors: Record<string, { bg: string; text: string; accent: string }> = {
    giveaway: { bg: 'bg-green-50', text: 'text-green-700', accent: 'bg-green-100' },
    contest: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-100' },
    sweepstakes: { bg: 'bg-purple-50', text: 'text-purple-700', accent: 'bg-purple-100' },
    dream_job: { bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-100' },
    get_paid_to: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'bg-emerald-100' },
    instant_win: { bg: 'bg-pink-50', text: 'text-pink-700', accent: 'bg-pink-100' },
    job_fair: { bg: 'bg-cyan-50', text: 'text-cyan-700', accent: 'bg-cyan-100' },
    scholarship: { bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'bg-indigo-100' },
    volunteer: { bg: 'bg-rose-50', text: 'text-rose-700', accent: 'bg-rose-100' },
    free_training: { bg: 'bg-teal-50', text: 'text-teal-700', accent: 'bg-teal-100' },
    promo: { bg: 'bg-orange-50', text: 'text-orange-700', accent: 'bg-orange-100' },
};

const typeIcons: Record<string, React.ReactNode> = {
    giveaway: <Gift size={16} />,
    contest: <Trophy size={16} />,
    sweepstakes: <Sparkles size={16} />,
    dream_job: <DollarSign size={16} />,
    get_paid_to: <DollarSign size={16} />,
    instant_win: <Sparkles size={16} />,
    scholarship: <Trophy size={16} />,
    default: <Gift size={16} />,
};

export default function OpportunityPreviewGrid({
    opportunities,
    opportunityType,
    opportunityTypeLabel,
}: OpportunityPreviewGridProps) {
    const colors = typeColors[opportunityType] || typeColors.evergreen;
    const icon = typeIcons[opportunityType] || typeIcons.default;

    if (opportunities.length === 0) {
        return (
            <div className="mt-12 pt-12 border-t border-slate-200">
                <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <p className="text-slate-500">No {opportunityTypeLabel.toLowerCase()} available at the moment.</p>
                    <p className="text-slate-400 text-sm mt-2">Check back soon for new opportunities!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-12 border-t border-slate-200">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.accent} ${colors.text}`}>
                        {icon}
                    </div>
                    <h2 className="text-2xl font-black text-[#1a1a1a]">
                        Latest {opportunityTypeLabel}
                    </h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.accent} ${colors.text}`}>
                    {opportunities.length} Available
                </span>
            </div>

            {/* Opportunities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {opportunities.map((opp) => {
                    const formattedDeadline = opp.deadline
                        ? new Date(opp.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                        : null;

                    return (
                        <div
                            key={opp.id}
                            className={`rounded-2xl overflow-hidden border border-slate-100 ${colors.bg} hover:shadow-lg transition-all group`}
                        >
                            {/* Image placeholder - opportunities are members-only */}
                            {opp.featured_image_url ? (
                                <div className="aspect-video w-full overflow-hidden relative">
                                    <img
                                        src={opp.featured_image_url}
                                        alt={opp.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                            ) : (
                                <div className={`aspect-video w-full ${colors.accent} flex items-center justify-center`}>
                                    <div className={`${colors.text} opacity-30`}>
                                        {React.cloneElement(icon as React.ReactElement, { size: 48 })}
                                    </div>
                                </div>
                            )}

                            <div className="p-5">
                                {/* Type Badge & Prize */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colors.accent} ${colors.text}`}>
                                        {opportunityType.replace('_', ' ')}
                                    </span>
                                    {opp.prize_value && (
                                        <span className="text-sm font-bold text-[#1a1a1a]">
                                            {opp.prize_value}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-[#1a1a1a] mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                    {opp.title}
                                </h3>

                                {/* Excerpt */}
                                {opp.excerpt && (
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                        {opp.excerpt}
                                    </p>
                                )}

                                {/* Deadline */}
                                {formattedDeadline && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar size={12} />
                                        <span>Ends {formattedDeadline}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-[#FFDE59] to-yellow-400 rounded-2xl p-8 text-center">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-2xl font-black text-[#1a1a1a] mb-3">
                        Want to see all {opportunityTypeLabel.toLowerCase()}?
                    </h3>
                    <p className="text-[#1a1a1a]/70 mb-6">
                        Create a free account to access our full database of opportunities, get personalized recommendations, and never miss a deadline.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/auth?mode=signup"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <UserPlus size={18} />
                            Create Free Account
                        </Link>
                        <Link
                            href="/auth"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/80 text-[#1a1a1a] font-bold rounded-xl hover:bg-white transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
