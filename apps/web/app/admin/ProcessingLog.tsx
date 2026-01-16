'use client';

import { useState, useEffect } from 'react';
import { Filter, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle, Eye, FileText } from 'lucide-react';
import Link from 'next/link';

interface LogEntry {
    id: string;
    date: string;
    feed_name: string;
    category: string;
    provider: string;
    title: string;
    status: 'published' | 'rejected' | 'draft';
    reason: string;
    source_url: string;
    opportunity_id: string | null;
    opportunity_slug: string | null;
    confidence_score: number | null;
}

interface LogFilters {
    status: string;
    provider: string;
    feed: string;
    search: string;
}

export default function ProcessingLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [filters, setFilters] = useState<LogFilters>({
        status: 'all',
        provider: 'all',
        feed: 'all',
        search: '',
    });

    const [availableFeeds, setAvailableFeeds] = useState<Array<{ id: string; name: string }>>([]);
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);

    useEffect(() => {
        fetchLogs();
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            // Get feeds
            const feedsRes = await fetch('/api/admin/feeds');
            const feedsData = await feedsRes.json();
            if (feedsRes.ok) {
                setAvailableFeeds(feedsData.feeds || []);
            }

            // Get AI providers
            const providersRes = await fetch('/api/admin/ai-settings');
            const providersData = await providersRes.json();
            if (providersRes.ok && providersData.settings) {
                const providers = ['Default'];
                if (providersData.settings.provider) {
                    providers.push(providersData.settings.provider);
                }
                setAvailableProviders(providers);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchLogs = async () => {
        setRefreshing(true);
        setSessionExpired(false);
        try {
            const params = new URLSearchParams();
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.provider !== 'all') params.append('provider', filters.provider);
            if (filters.feed !== 'all') params.append('feed_id', filters.feed);
            if (filters.search) params.append('search', filters.search);

            const res = await fetch(`/api/admin/logs?${params.toString()}`);

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setLogs(data.logs || []);
            } else {
                console.error('Error fetching logs:', data.error);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleFilter = () => {
        fetchLogs();
    };

    const handleReset = () => {
        setFilters({
            status: 'all',
            provider: 'all',
            feed: 'all',
            search: '',
        });
        setTimeout(() => fetchLogs(), 100);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            published: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: CheckCircle,
                label: 'Published',
            },
            rejected: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: XCircle,
                label: 'Rejected',
            },
            draft: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: AlertCircle,
                label: 'Draft',
            },
        };

        const badge = badges[status as keyof typeof badges] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const categoryLabels: Record<string, string> = {
        giveaway: 'Giveaway',
        contest: 'Contest',
        sweepstakes: 'Sweepstakes',
        dream_job: 'Dream Job',
        get_paid_to: 'Get Paid To',
        instant_win: 'Instant Win',
        job_fair: 'Job Fair',
        scholarship: 'Scholarship',
        volunteer: 'Volunteering',
        free_training: 'Free Training',
        promo: 'Promo',
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
                        href="/auth?redirect=/admin?section=logs"
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#1a1a1a]">Processing Log</h1>
                <button
                    onClick={fetchLogs}
                    disabled={refreshing}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh Log"
                >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="rejected">Rejected</option>
                        <option value="draft">Draft</option>
                    </select>

                    <select
                        value={filters.provider}
                        onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All providers</option>
                        {availableProviders.map((provider) => (
                            <option key={provider} value={provider.toLowerCase()}>
                                {provider}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.feed}
                        onChange={(e) => setFilters({ ...filters, feed: e.target.value })}
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All feeds</option>
                        {availableFeeds.map((feed) => (
                            <option key={feed.id} value={feed.id}>
                                {feed.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Search title..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleFilter}
                        disabled={refreshing}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Filter size={16} />
                        Filter
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-white text-slate-700 px-6 py-2 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-slate-600 font-bold">
                Showing {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Feed</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase" title="Hover over icon to see title">Info</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Reason</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        No log entries found. Process some feeds to see activity here.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(log.date).toLocaleString('en-US', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900 max-w-[120px] truncate" title={log.feed_name}>
                                            {log.feed_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                {categoryLabels[log.category] || log.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div
                                                className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-help transition-colors group relative"
                                                title={`${log.title}${log.confidence_score !== null ? ` (${(log.confidence_score * 100).toFixed(0)}% confidence)` : ''}${log.provider ? ` - ${log.provider}` : ''}`}
                                            >
                                                <FileText size={16} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(log.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[250px]">
                                            <span className={`truncate block ${log.status === 'rejected' ? 'text-red-600 font-medium' : ''}`} title={log.reason}>
                                                {log.reason || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <a
                                                    href={log.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Original Source"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                {log.status === 'published' && log.opportunity_slug && (
                                                    <Link
                                                        href={`/opportunities/${log.opportunity_slug}`}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="View Published Post"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Info */}
            {logs.length > 0 && (
                <div className="text-sm text-slate-500 text-center">
                    Showing most recent 100 entries. Use filters to narrow down results.
                </div>
            )}
        </div>
    );
}
