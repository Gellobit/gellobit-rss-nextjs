'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Eye, CheckCircle, XCircle, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';

interface AnalyticsData {
    feedStats: {
        totalFeeds: number;
        activeFeeds: number;
        feedsWithErrors: number;
    };
    postStats: {
        totalPosts: number;
        postsToday: number;
        postsThisWeek: number;
        publishedPosts: number;
        draftPosts: number;
        rejectedPosts: number;
    };
    processingStats: {
        errors24h: number;
        successRate: number;
        lastProcessing: string | null;
        totalProcessed24h: number;
        aiRejections24h: number;
    };
    categoryStats: Array<{
        opportunity_type: string;
        total: number;
        published: number;
        rejected: number;
        views: number;
        successRate: number;
    }>;
    topPerformers: Array<{
        id: string;
        title: string;
        opportunity_type: string;
        views: number;
        created_at: string;
    }>;
}

export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
            const result = await res.json();

            if (res.ok) {
                setData(result);
            } else {
                console.error('Error fetching analytics:', result.error);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center text-slate-500 py-12">
                Failed to load analytics data. Please refresh the page.
            </div>
        );
    }

    const categoryLabels: Record<string, string> = {
        giveaway: 'Giveaways',
        contest: 'Contests',
        sweepstakes: 'Sweepstakes',
        dream_job: 'Dream Jobs',
        get_paid_to: 'Get Paid To',
        instant_win: 'Instant Win',
        job_fair: 'Job Fairs',
        scholarship: 'Scholarships',
        volunteer: 'Volunteer',
        free_training: 'Free Training',
        promo: 'Promos',
    };

    return (
        <div className="space-y-6">
            {/* Header with Time Range Filter */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#1a1a1a]">Analytics</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={fetchAnalytics}
                        disabled={refreshing}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh Analytics"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Feed Statistics */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Feed Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-5xl font-black text-blue-600 mb-2">{data.feedStats.totalFeeds}</div>
                        <div className="text-sm text-slate-600 font-bold">Total Feeds</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-5xl font-black text-green-600 mb-2">{data.feedStats.activeFeeds}</div>
                        <div className="text-sm text-slate-600 font-bold">Active Feeds</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-5xl font-black text-red-600 mb-2">{data.feedStats.feedsWithErrors}</div>
                        <div className="text-sm text-slate-600 font-bold">Feeds with Errors</div>
                    </div>
                </div>
            </div>

            {/* Post Statistics */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Post Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-blue-600 mb-1">{data.postStats.totalPosts}</div>
                        <div className="text-xs text-slate-600 font-bold">Total Posts Created</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-purple-600 mb-1">{data.postStats.postsToday}</div>
                        <div className="text-xs text-slate-600 font-bold">Posts Today</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-indigo-600 mb-1">{data.postStats.postsThisWeek}</div>
                        <div className="text-xs text-slate-600 font-bold">Posts This Week</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-green-600 mb-1">{data.postStats.publishedPosts}</div>
                        <div className="text-xs text-slate-600 font-bold">Published</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-yellow-600 mb-1">{data.postStats.draftPosts}</div>
                        <div className="text-xs text-slate-600 font-bold">Drafts</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-3xl font-black text-red-600 mb-1">{data.postStats.rejectedPosts}</div>
                        <div className="text-xs text-slate-600 font-bold">Rejected by AI</div>
                    </div>
                </div>
            </div>

            {/* Processing Statistics */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Processing Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-4xl font-black text-red-600 mb-2">{data.processingStats.errors24h}</div>
                        <div className="text-sm text-slate-600 font-bold">Errors (24h)</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-4xl font-black text-green-600 mb-2">{data.processingStats.successRate.toFixed(1)}%</div>
                        <div className="text-sm text-slate-600 font-bold">Success Rate</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-4xl font-black text-blue-600 mb-2">{data.processingStats.totalProcessed24h}</div>
                        <div className="text-sm text-slate-600 font-bold">Processed (24h)</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="text-2xl font-black text-slate-600 mb-2">
                            {data.processingStats.lastProcessing
                                ? new Date(data.processingStats.lastProcessing).toLocaleString()
                                : 'Never'}
                        </div>
                        <div className="text-sm text-slate-600 font-bold">Last Processing</div>
                    </div>
                </div>
            </div>

            {/* Category Performance */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Performance by Category</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Category</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Published</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Rejected</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Views</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Success Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.categoryStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                            No data available yet. Process some feeds to see category statistics.
                                        </td>
                                    </tr>
                                ) : (
                                    data.categoryStats.map((stat) => (
                                        <tr key={stat.opportunity_type} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                {categoryLabels[stat.opportunity_type] || stat.opportunity_type}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                                                {stat.total}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm font-bold text-green-600">
                                                    <CheckCircle size={14} />
                                                    {stat.published}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm font-bold text-red-600">
                                                    <XCircle size={14} />
                                                    {stat.rejected}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                                                    <Eye size={14} />
                                                    {stat.views}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-24 bg-slate-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-600 h-2 rounded-full"
                                                            style={{ width: `${stat.successRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {stat.successRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-600" />
                    Top Performing Opportunities
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {data.topPerformers.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-400">
                            No opportunities have been viewed yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {data.topPerformers.map((opp, index) => (
                                <div key={opp.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-black text-yellow-700">#{index + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{opp.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500">
                                                {categoryLabels[opp.opportunity_type] || opp.opportunity_type}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(opp.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Eye size={16} className="text-blue-600" />
                                        <span className="text-lg font-black text-blue-600">{opp.views}</span>
                                        <span className="text-xs text-slate-500">views</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
