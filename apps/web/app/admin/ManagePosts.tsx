'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    FileText,
    RefreshCw,
    Trash2,
    Eye,
    EyeOff,
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    Pencil,
    X,
    Save,
    Plus,
    Calendar,
    MapPin,
    Gift,
    Link,
    Image,
    Globe,
    Type
} from 'lucide-react';

// Dynamic import for WYSIWYG editor (SSR-safe)
const WysiwygEditor = dynamic(() => import('@/components/WysiwygEditor'), {
    ssr: false,
    loading: () => (
        <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[300px] flex items-center justify-center">
            <p className="text-slate-400">Loading editor...</p>
        </div>
    ),
});

interface Opportunity {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    opportunity_type: string;
    status: 'draft' | 'published' | 'rejected';
    source_url: string;
    source_feed_id: string | null;
    confidence_score: number | null;
    featured_image_url: string | null;
    rejection_reason: string | null;
    ai_provider: string | null;
    created_at: string;
    deadline: string | null;
    prize_value: string | null;
    location: string | null;
    feed_name?: string;
    // SEO fields
    meta_title: string | null;
    meta_description: string | null;
    is_public: boolean;
    // Application URL
    apply_url: string | null;
}

interface OpportunityForm {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    opportunity_type: string;
    status: 'draft' | 'published' | 'rejected';
    deadline: string;
    prize_value: string;
    location: string;
    source_url: string;
    apply_url: string;
    featured_image_url: string;
    meta_title: string;
    meta_description: string;
    is_public: boolean;
}

const emptyForm: OpportunityForm = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    opportunity_type: 'giveaway',
    status: 'draft',
    deadline: '',
    prize_value: '',
    location: '',
    source_url: '',
    apply_url: '',
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    is_public: false,
};

interface Feed {
    id: string;
    name: string;
}

const opportunityTypes = [
    { value: '', label: 'All Types' },
    { value: 'giveaway', label: 'Giveaway' },
    { value: 'contest', label: 'Contest' },
    { value: 'sweepstakes', label: 'Sweepstakes' },
    { value: 'dream_job', label: 'Dream Job' },
    { value: 'get_paid_to', label: 'Get Paid To' },
    { value: 'instant_win', label: 'Instant Win' },
    { value: 'job_fair', label: 'Job Fair' },
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'free_training', label: 'Free Training' },
    { value: 'promo', label: 'Promo' },
];

export default function ManagePosts() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [feedFilter, setFeedFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(20);

    // Edit/Create modal
    const [editingPost, setEditingPost] = useState<Opportunity | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editForm, setEditForm] = useState<OpportunityForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
    });

    // Date filter
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // Fetch pagination settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings/general');
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings?.admin_items_per_page) {
                        setLimit(data.settings.admin_items_per_page);
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
        fetchFeeds();
    }, []);

    useEffect(() => {
        fetchOpportunities();
    }, [page, statusFilter, typeFilter, feedFilter, dateFrom, dateTo, limit]);

    const fetchFeeds = async () => {
        try {
            const res = await fetch('/api/admin/feeds');
            const data = await res.json();
            if (res.ok) {
                setFeeds(data.feeds || []);
            }
        } catch (error) {
            console.error('Error fetching feeds:', error);
        }
    };

    const fetchOpportunities = async () => {
        setRefreshing(true);
        setSessionExpired(false);
        try {
            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            params.append('offset', ((page - 1) * limit).toString());
            params.append('exclude_rejected', 'true'); // Always exclude rejected
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('opportunity_type', typeFilter);
            if (feedFilter) params.append('feed_id', feedFilter);
            if (searchQuery) params.append('search', searchQuery);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const res = await fetch(`/api/admin/opportunities?${params.toString()}`);

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setOpportunities(data.opportunities || []);
                setTotalCount(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / limit));
                setStats({
                    total: data.stats?.total || 0,
                    published: data.stats?.published || 0,
                    draft: data.stats?.draft || 0,
                });
            } else {
                console.error('Error fetching opportunities:', data.error);
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleSearch = () => {
        setPage(1);
        fetchOpportunities();
    };

    const handleStatusChange = async (id: string, newStatus: 'draft' | 'published' | 'rejected') => {
        try {
            const res = await fetch(`/api/admin/opportunities/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                fetchOpportunities();
            } else {
                const data = await res.json();
                alert('Error updating status: ' + data.error);
            }
        } catch (error) {
            alert('Error updating status: ' + error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/admin/opportunities/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchOpportunities();
            } else {
                const data = await res.json();
                alert('Error deleting post: ' + data.error);
            }
        } catch (error) {
            alert('Error deleting post: ' + error);
        }
    };

    const handleBulkDelete = async (status: string) => {
        const statusLabel = status === 'rejected' ? 'rejected' : status;
        if (!confirm(`Are you sure you want to delete ALL ${statusLabel} opportunities? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/admin/opportunities?status=${status}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchOpportunities();
            } else {
                const data = await res.json();
                alert('Error deleting opportunities: ' + data.error);
            }
        } catch (error) {
            alert('Error deleting opportunities: ' + error);
        }
    };

    const openEditModal = (post: Opportunity) => {
        setEditingPost(post);
        setIsCreating(false);
        setEditForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content || '',
            opportunity_type: post.opportunity_type,
            status: post.status,
            deadline: post.deadline ? post.deadline.split('T')[0] : '',
            prize_value: post.prize_value || '',
            location: post.location || '',
            source_url: post.source_url || '',
            apply_url: post.apply_url || '',
            featured_image_url: post.featured_image_url || '',
            meta_title: post.meta_title || '',
            meta_description: post.meta_description || '',
            is_public: post.is_public || false,
        });
    };

    const openCreateModal = () => {
        setEditingPost(null);
        setIsCreating(true);
        setEditForm({ ...emptyForm });
    };

    const closeModal = () => {
        setEditingPost(null);
        setIsCreating(false);
        setEditForm(emptyForm);
    };

    // Generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 100);
    };

    const handleSaveEdit = async () => {
        if (!editingPost) return;
        setSaving(true);
        try {
            const payload = {
                ...editForm,
                deadline: editForm.deadline || null,
                prize_value: editForm.prize_value || null,
                location: editForm.location || null,
                apply_url: editForm.apply_url || null,
                featured_image_url: editForm.featured_image_url || null,
                meta_title: editForm.meta_title || null,
                meta_description: editForm.meta_description || null,
            };

            const res = await fetch(`/api/admin/opportunities/${editingPost.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeModal();
                fetchOpportunities();
            } else {
                const data = await res.json();
                alert('Error updating opportunity: ' + data.error);
            }
        } catch (error) {
            alert('Error updating opportunity: ' + error);
        }
        setSaving(false);
    };

    const handleCreate = async () => {
        if (!editForm.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!editForm.source_url.trim()) {
            alert('Source URL is required');
            return;
        }

        setSaving(true);
        try {
            const slug = editForm.slug || generateSlug(editForm.title);
            const payload = {
                ...editForm,
                slug,
                deadline: editForm.deadline || null,
                prize_value: editForm.prize_value || null,
                location: editForm.location || null,
                apply_url: editForm.apply_url || null,
                featured_image_url: editForm.featured_image_url || null,
                meta_title: editForm.meta_title || null,
                meta_description: editForm.meta_description || null,
            };

            const res = await fetch('/api/admin/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeModal();
                fetchOpportunities();
            } else {
                const data = await res.json();
                alert('Error creating opportunity: ' + data.error);
            }
        } catch (error) {
            alert('Error creating opportunity: ' + error);
        }
        setSaving(false);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            published: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Published' },
            draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Draft' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
        };
        const badge = badges[status as keyof typeof badges] || badges.draft;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const getCategoryLabel = (type: string) => {
        const found = opportunityTypes.find(t => t.value === type);
        return found?.label || type;
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
                        href="/auth?redirect=/admin?section=posts"
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
                <h1 className="text-3xl font-black text-[#1a1a1a]">Opportunities</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-[#FFDE59] text-[#1a1a1a] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
                    >
                        <Plus size={18} />
                        New Opportunity
                    </button>
                    <button
                        onClick={() => fetchOpportunities()}
                        disabled={refreshing}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${statusFilter === '' ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setStatusFilter(''); setPage(1); }}
                >
                    <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                    <div className="text-sm font-bold text-slate-500">Total Opportunities</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${statusFilter === 'published' ? 'border-green-500' : 'border-slate-200 hover:border-green-200'}`}
                    onClick={() => { setStatusFilter('published'); setPage(1); }}
                >
                    <div className="text-2xl font-black text-green-600">{stats.published}</div>
                    <div className="text-sm font-bold text-slate-500">Published</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${statusFilter === 'draft' ? 'border-yellow-500' : 'border-slate-200 hover:border-yellow-200'}`}
                    onClick={() => { setStatusFilter('draft'); setPage(1); }}
                >
                    <div className="text-2xl font-black text-yellow-600">{stats.draft}</div>
                    <div className="text-sm font-bold text-slate-500">Drafts</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        {opportunityTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>

                    <select
                        value={feedFilter}
                        onChange={(e) => { setFeedFilter(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="">All Feeds</option>
                        {feeds.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Search title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">From:</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">To:</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center"
                    >
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Results Info */}
            <div className="text-sm text-slate-600 font-bold">
                Showing {opportunities.length} of {totalCount} opportunities
                {statusFilter && ` (${statusFilter})`}
            </div>

            {/* Opportunities Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Feed</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {opportunities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                        No opportunities found. Process some feeds to create opportunities.
                                    </td>
                                </tr>
                            ) : (
                                opportunities.map((opp) => (
                                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="max-w-[300px]">
                                                <div className="font-bold text-slate-900 truncate" title={opp.title}>
                                                    {opp.title}
                                                </div>
                                                {opp.rejection_reason && (
                                                    <div className="text-xs text-red-600 mt-1 truncate" title={opp.rejection_reason}>
                                                        {opp.rejection_reason}
                                                    </div>
                                                )}
                                                {opp.confidence_score !== null && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        Confidence: {(opp.confidence_score * 100).toFixed(0)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                {getCategoryLabel(opp.opportunity_type)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[120px] truncate">
                                            {opp.feed_name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(opp.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(opp.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Quick status toggle - only show publish for drafts, not rejected */}
                                                {opp.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleStatusChange(opp.id, 'published')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Publish"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {opp.status === 'published' && (
                                                    <button
                                                        onClick={() => handleStatusChange(opp.id, 'draft')}
                                                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                                        title="Unpublish (move to draft)"
                                                    >
                                                        <EyeOff size={16} />
                                                    </button>
                                                )}
                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEditModal(opp)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                {/* View source */}
                                                <a
                                                    href={opp.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                                                    title="View Source"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                {/* View live (if published) */}
                                                {opp.status === 'published' && (
                                                    <a
                                                        href={`/opportunities/${opp.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="View Live"
                                                    >
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(opp.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="px-4 py-2 font-bold text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Edit/Create Modal */}
            {(editingPost || isCreating) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold">
                                {isCreating ? 'New Opportunity' : 'Edit Opportunity'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Basic Info Section */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Type size={16} />
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => {
                                                setEditForm({ ...editForm, title: e.target.value });
                                                if (isCreating && !editForm.slug) {
                                                    // Auto-generate slug while creating
                                                }
                                            }}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="Enter opportunity title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Slug</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editForm.slug}
                                                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                                className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                                placeholder="url-friendly-slug"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, slug: generateSlug(editForm.title) })}
                                                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 whitespace-nowrap"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                        <select
                                            value={editForm.opportunity_type}
                                            onChange={(e) => setEditForm({ ...editForm, opportunity_type: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                        >
                                            {opportunityTypes.filter(t => t.value).map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'draft' | 'published' | 'rejected' })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Source URL *</label>
                                        <div className="flex items-center gap-2">
                                            <Link size={16} className="text-slate-400" />
                                            <input
                                                type="url"
                                                value={editForm.source_url}
                                                onChange={(e) => setEditForm({ ...editForm, source_url: e.target.value })}
                                                className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                                placeholder="https://example.com/opportunity"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Apply URL</label>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink size={16} className="text-slate-400" />
                                            <input
                                                type="url"
                                                value={editForm.apply_url}
                                                onChange={(e) => setEditForm({ ...editForm, apply_url: e.target.value })}
                                                className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                                placeholder="https://example.com/apply (optional, falls back to source URL)"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Direct link to apply/enter. If empty, "Apply Now" button will use Source URL.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Excerpt</label>
                                <textarea
                                    value={editForm.excerpt}
                                    onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                                    className="border border-slate-200 p-2.5 rounded-lg w-full h-20 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                    placeholder="Brief summary of the opportunity"
                                />
                            </div>

                            {/* Content - WYSIWYG Editor */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Content</label>
                                <WysiwygEditor
                                    value={editForm.content}
                                    onChange={(html) => setEditForm({ ...editForm, content: html })}
                                    placeholder="Write the full opportunity description..."
                                />
                            </div>

                            {/* Details Section */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Gift size={16} />
                                    Opportunity Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> Deadline</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.deadline}
                                            onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            <span className="flex items-center gap-1"><Gift size={12} /> Prize Value</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.prize_value}
                                            onChange={(e) => setEditForm({ ...editForm, prize_value: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="$1,000 or Varies"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> Location</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.location}
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="USA, Worldwide, etc."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Media Section */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    <span className="flex items-center gap-1"><Image size={12} /> Featured Image URL</span>
                                </label>
                                <input
                                    type="url"
                                    value={editForm.featured_image_url}
                                    onChange={(e) => setEditForm({ ...editForm, featured_image_url: e.target.value })}
                                    className="border border-slate-200 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {editForm.featured_image_url && (
                                    <div className="mt-2">
                                        <img
                                            src={editForm.featured_image_url}
                                            alt="Preview"
                                            className="h-24 object-cover rounded-lg border border-slate-200"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* SEO Section */}
                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Globe size={16} />
                                    SEO Settings
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Meta Title</label>
                                        <input
                                            type="text"
                                            value={editForm.meta_title}
                                            onChange={(e) => setEditForm({ ...editForm, meta_title: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="Custom SEO title (leave empty to use title)"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            {editForm.meta_title.length}/60 characters
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Meta Description</label>
                                        <textarea
                                            value={editForm.meta_description}
                                            onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                                            className="border border-slate-200 p-2.5 rounded-lg w-full h-20 bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="Custom SEO description (leave empty to use excerpt)"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            {editForm.meta_description.length}/160 characters
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_public}
                                                onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                        <div>
                                            <span className="font-bold text-sm text-slate-700">Public (Indexable)</span>
                                            <p className="text-xs text-slate-500">
                                                {editForm.is_public
                                                    ? 'This opportunity will be indexed by search engines and have social sharing previews'
                                                    : 'This opportunity is private and will not be indexed by search engines'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    onClick={isCreating ? handleCreate : handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {saving ? 'Saving...' : isCreating ? 'Create Opportunity' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-3 border border-slate-300 rounded-lg font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
