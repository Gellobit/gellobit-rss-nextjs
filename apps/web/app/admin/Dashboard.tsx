'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Settings, Rss, Play, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    system: {
        status: 'operational' | 'error' | 'warning';
        lastProcessing: string | null;
        activeFeeds: number;
        totalFeeds: number;
    };
    posts: {
        today: number;
        thisWeek: number;
        total: number;
    };
    feeds: Array<{
        id: string;
        name: string;
        status: 'active' | 'inactive' | 'error';
        opportunity_type: string;
        last_fetched: string | null;
    }>;
    recentActivity: Array<{
        id: string;
        message: string;
        timestamp: string;
        type: 'success' | 'warning' | 'error' | 'info';
    }>;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setRefreshing(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/dashboard');

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setStats(data);
            } else {
                console.error('Error fetching dashboard stats:', data.error);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleProcessAllFeeds = async () => {
        if (!confirm('Process all active feeds now? This may take several minutes.')) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/admin/feeds/process-all', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Processing completed!\n\nFeeds Processed: ${data.summary.total_feeds_processed}\nOpportunities Created: ${data.summary.total_opportunities_created}\nDuplicates Skipped: ${data.summary.total_duplicates_skipped}`);
                fetchDashboardStats();
            } else {
                alert('Error processing feeds: ' + data.error);
            }
        } catch (error) {
            alert('Error processing feeds: ' + error);
        }
        setProcessing(false);
    };

    if (sessionExpired) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center py-12 px-8 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                    <div className="text-amber-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                    <p className="text-amber-700 mb-4">Your session has expired. Please log in again to continue.</p>
                    <a
                        href="/auth?redirect=/admin"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                    >
                        Log In Again
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center text-slate-500 py-12">
                Failed to load dashboard data. Please refresh the page.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#1a1a1a]">Gellobit RSS Processor Dashboard</h1>
                <button
                    onClick={fetchDashboardStats}
                    disabled={refreshing}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh Dashboard"
                >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* System Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-600 mb-3">System Status</h3>
                    <div className="flex items-center gap-2 mb-3">
                        {stats.system.status === 'operational' ? (
                            <CheckCircle className="text-green-500" size={20} />
                        ) : (
                            <AlertCircle className="text-red-500" size={20} />
                        )}
                        <span className="font-bold text-slate-900">
                            {stats.system.status === 'operational' ? 'All Systems Operational' : 'System Error'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                        <div>Last Processing: {stats.system.lastProcessing ? new Date(stats.system.lastProcessing).toLocaleString() : 'Never'}</div>
                        <div>Active Feeds: {stats.system.activeFeeds}/{stats.system.totalFeeds}</div>
                    </div>
                </div>

                {/* Today's Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-600 mb-3">Today's Activity</h3>
                    <div className="text-4xl font-black text-blue-600 mb-2">{stats.posts.today}</div>
                    <div className="text-xs text-slate-500">Posts Created Today</div>
                </div>

                {/* This Week */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-600 mb-3">This Week</h3>
                    <div className="text-4xl font-black text-blue-600 mb-2">{stats.posts.thisWeek}</div>
                    <div className="text-xs text-slate-500">Posts Created This Week</div>
                </div>

                {/* Total Posts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-600 mb-3">Total Posts</h3>
                    <div className="text-4xl font-black text-blue-600 mb-2">{stats.posts.total}</div>
                    <div className="text-xs text-slate-500">All Time</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleProcessAllFeeds}
                        disabled={processing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Process All Feeds Now
                            </>
                        )}
                    </button>
                    <button
                        onClick={fetchDashboardStats}
                        disabled={refreshing}
                        className="bg-white text-slate-700 px-6 py-3 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        Refresh Dashboard
                    </button>
                    <Link href="/admin?section=feeds">
                        <button className="bg-white text-slate-700 px-6 py-3 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-2">
                            <Rss size={18} />
                            Manage Feeds
                        </button>
                    </Link>
                    <Link href="/admin?section=settings">
                        <button className="bg-white text-slate-700 px-6 py-3 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-2">
                            <Settings size={18} />
                            Settings
                        </button>
                    </Link>
                </div>
            </div>

            {/* Feed Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Feed Status</h3>
                    <Link href="/admin?section=feeds" className="text-sm text-blue-600 hover:text-blue-700 font-bold">
                        View All Feeds ({stats.system.totalFeeds})
                    </Link>
                </div>

                {stats.feeds.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        No feeds configured yet. Add your first feed to get started.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.feeds.slice(0, 6).map((feed) => (
                            <div key={feed.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-slate-900 text-sm">{feed.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        feed.status === 'active' ? 'bg-green-100 text-green-700' :
                                        feed.status === 'error' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {feed.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <div>Type: {feed.opportunity_type}</div>
                                    <div>Last: {feed.last_fetched ? new Date(feed.last_fetched).toLocaleString() : 'Never'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>

                {stats.recentActivity.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        No recent activity. Process feeds to see activity here.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className={`p-2 rounded-lg ${
                                    activity.type === 'success' ? 'bg-green-100 text-green-600' :
                                    activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                    activity.type === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {activity.type === 'success' ? <CheckCircle size={16} /> :
                                     activity.type === 'warning' ? <AlertCircle size={16} /> :
                                     activity.type === 'error' ? <AlertCircle size={16} /> :
                                     <TrendingUp size={16} />}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-900">{activity.message}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
