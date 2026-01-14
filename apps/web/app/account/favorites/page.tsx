'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, Gift, MapPin, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    opportunity_type: string;
    featured_image_url: string | null;
    deadline: string | null;
    prize_value: string | null;
    status: string;
    published_at: string | null;
}

interface Favorite {
    id: string;
    created_at: string;
    opportunity: Opportunity;
}

const typeLabels: Record<string, string> = {
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
    evergreen: 'Evergreen',
};

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await fetch('/api/user/favorites');
            const data = await res.json();

            if (res.ok) {
                setFavorites(data.favorites || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
        setLoading(false);
    };

    const handleRemove = async (opportunityId: string) => {
        setRemoving(opportunityId);

        try {
            const res = await fetch(`/api/user/favorites?opportunity_id=${opportunityId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.opportunity.id !== opportunityId));
                setTotal(prev => prev - 1);
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }

        setRemoving(null);
    };

    const isExpired = (deadline: string | null) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const isExpiringSoon = (deadline: string | null) => {
        if (!deadline) return false;
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 3;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">My Favorites</h1>
                    <p className="text-slate-500 text-sm mt-1">{total} saved opportunities</p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <Heart className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No favorites yet</h3>
                    <p className="text-slate-500 mb-6">
                        Save opportunities you're interested in to find them easily later.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Browse Opportunities
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {favorites.map((favorite) => {
                        const opp = favorite.opportunity;
                        const expired = isExpired(opp.deadline);
                        const expiringSoon = isExpiringSoon(opp.deadline);

                        return (
                            <div
                                key={favorite.id}
                                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                                    expired
                                        ? 'border-red-200 opacity-60'
                                        : expiringSoon
                                        ? 'border-yellow-300'
                                        : 'border-slate-100 hover:border-slate-200'
                                }`}
                            >
                                <div className="flex">
                                    {/* Image */}
                                    <div className="w-32 md:w-48 shrink-0">
                                        {opp.featured_image_url ? (
                                            <img
                                                src={opp.featured_image_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center min-h-[120px]">
                                                <Gift className="text-slate-300" size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 md:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                {/* Badges */}
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                                                        {typeLabels[opp.opportunity_type] || opp.opportunity_type}
                                                    </span>
                                                    {expired && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                            Expired
                                                        </span>
                                                    )}
                                                    {expiringSoon && !expired && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                                            Expiring Soon
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <Link href={`/opportunities/${opp.slug}`}>
                                                    <h3 className="font-bold text-lg text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
                                                        {opp.title}
                                                    </h3>
                                                </Link>

                                                {/* Excerpt */}
                                                {opp.excerpt && (
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                        {opp.excerpt}
                                                    </p>
                                                )}

                                                {/* Meta */}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                                    {opp.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(opp.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {opp.prize_value && (
                                                        <span className="flex items-center gap-1">
                                                            <Gift size={12} />
                                                            {opp.prize_value}
                                                        </span>
                                                    )}
                                                    <span>
                                                        Saved {new Date(favorite.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/opportunities/${opp.slug}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <ExternalLink size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleRemove(opp.id)}
                                                    disabled={removing === opp.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Remove from favorites"
                                                >
                                                    {removing === opp.id ? (
                                                        <RefreshCw size={18} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
