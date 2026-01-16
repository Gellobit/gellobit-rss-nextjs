'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, Gift, Trash2, RefreshCw } from 'lucide-react';
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

export default function SavedPage() {
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

    return (
        <main className="px-4 py-4">
            {/* Page Title */}
            <h1 className="text-2xl font-black text-[#1a1a1a] mb-4">Saved</h1>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-16">
                    <Heart className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">No saved items</h2>
                    <p className="text-slate-500 mb-4">
                        Tap the heart icon on any opportunity to save it here.
                    </p>
                    <Link
                        href="/opportunities"
                        className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
                    >
                        Browse Opportunities
                    </Link>
                </div>
            ) : (
                <>
                    <p className="text-sm text-slate-500 mb-4">{total} saved</p>
                    <div className="space-y-3">
                        {favorites.map((favorite) => {
                            const opp = favorite.opportunity;
                            const expired = isExpired(opp.deadline);

                            return (
                                <div
                                    key={favorite.id}
                                    className={`bg-white rounded-2xl border overflow-hidden ${
                                        expired ? 'border-red-200 opacity-60' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="flex">
                                        {/* Image */}
                                        <Link href={`/opportunities/${opp.slug}`} className="w-24 shrink-0">
                                            {opp.featured_image_url ? (
                                                <img
                                                    src={opp.featured_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover min-h-[80px]"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center min-h-[80px]">
                                                    <Gift className="text-slate-300" size={20} />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Content */}
                                        <div className="flex-1 p-3 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                                                        {typeLabels[opp.opportunity_type] || opp.opportunity_type}
                                                    </span>
                                                    {expired && (
                                                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                                <Link href={`/opportunities/${opp.slug}`}>
                                                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                                                        {opp.title}
                                                    </h3>
                                                </Link>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    {opp.deadline && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Calendar size={10} />
                                                            {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {opp.prize_value && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Gift size={10} />
                                                            {opp.prize_value}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(opp.id)}
                                                    disabled={removing === opp.id}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                                                >
                                                    {removing === opp.id ? (
                                                        <RefreshCw size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </main>
    );
}
