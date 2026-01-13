'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Plus, ExternalLink, Play, Pencil, X, Save } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Feed {
    id: string;
    name: string;
    url: string;
    status: 'active' | 'inactive' | 'error';
    opportunity_type: string;
    enable_scraping: boolean;
    enable_ai_processing: boolean;
    auto_publish: boolean;
    ai_provider?: string | null;
    ai_model?: string | null;
    quality_threshold?: number;
    priority?: number;
    cron_interval?: string;
    fallback_featured_image_url?: string | null;
    allow_republishing?: boolean;
    last_fetched?: string;
    total_items_processed?: number;
    opportunities_created?: number;
}

interface FeedFormValues {
    name: string;
    url: string;
    opportunity_type: string;
    enable_scraping: boolean;
    enable_ai_processing: boolean;
    auto_publish: boolean;
    status: 'active' | 'inactive' | 'error';
    ai_provider: string;
    ai_model: string;
    quality_threshold: number;
    priority: number;
    cron_interval: string;
    fallback_featured_image_url: string;
    allow_republishing: boolean;
}

const defaultFeedValues: FeedFormValues = {
    name: '',
    url: '',
    opportunity_type: 'giveaway',
    enable_scraping: true,
    enable_ai_processing: true,
    auto_publish: false,
    status: 'active',
    ai_provider: '',
    ai_model: '',
    quality_threshold: 0.6,
    priority: 5,
    cron_interval: 'hourly',
    fallback_featured_image_url: '',
    allow_republishing: false
};

const opportunityTypes = [
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

const cronIntervals = [
    { value: 'every_5_minutes', label: 'Every 5 minutes' },
    { value: 'every_15_minutes', label: 'Every 15 minutes' },
    { value: 'every_30_minutes', label: 'Every 30 minutes' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'every_2_hours', label: 'Every 2 hours' },
    { value: 'every_6_hours', label: 'Every 6 hours' },
    { value: 'every_12_hours', label: 'Every 12 hours' },
    { value: 'daily', label: 'Daily' },
];

const aiProviders = [
    { value: '', label: 'Use Global AI Settings', model: '' },
    { value: 'openai', label: 'OpenAI (GPT-4o-mini)', model: 'gpt-4o-mini' },
    { value: 'anthropic', label: 'Anthropic (Claude 3.7 Sonnet)', model: 'claude-3-7-sonnet-20250219' },
    { value: 'deepseek', label: 'DeepSeek (DeepSeek-Chat)', model: 'deepseek-chat' },
    { value: 'gemini', label: 'Google (Gemini 2.0 Flash)', model: 'gemini-2.0-flash-exp' },
];

// FeedForm as a separate component to prevent re-render issues
function FeedForm({
    values,
    onChange,
    isEdit = false
}: {
    values: FeedFormValues;
    onChange: (field: keyof FeedFormValues, value: any) => void;
    isEdit?: boolean;
}) {
    const handleAIProviderChange = (provider: string) => {
        const selectedProvider = aiProviders.find(p => p.value === provider);
        onChange('ai_provider', provider);
        onChange('ai_model', selectedProvider?.model || '');
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Feed Name</label>
                    <input
                        type="text"
                        placeholder="e.g. TechCrunch Giveaways"
                        className="border p-2 rounded w-full"
                        value={values.name}
                        onChange={e => onChange('name', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Opportunity Type</label>
                    <select
                        className="border p-2 rounded w-full"
                        value={values.opportunity_type}
                        onChange={e => onChange('opportunity_type', e.target.value)}
                    >
                        {opportunityTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">RSS URL</label>
                <input
                    type="url"
                    placeholder="https://www.google.com/alerts/feeds/..."
                    className="border p-2 rounded w-full"
                    value={values.url}
                    onChange={e => onChange('url', e.target.value)}
                    required
                />
            </div>

            {isEdit && (
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Status</label>
                    <select
                        className="border p-2 rounded w-full"
                        value={values.status}
                        onChange={e => onChange('status', e.target.value)}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            )}

            {/* Feed Settings */}
            <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Feed Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Quality Threshold</label>
                        <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            className="border p-2 rounded text-sm w-full"
                            value={values.quality_threshold}
                            onChange={e => onChange('quality_threshold', parseFloat(e.target.value) || 0.6)}
                        />
                        <p className="text-xs text-slate-400 mt-1">Min AI confidence (0-1)</p>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Priority</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className="border p-2 rounded text-sm w-full"
                            value={values.priority}
                            onChange={e => onChange('priority', parseInt(e.target.value) || 5)}
                        />
                        <p className="text-xs text-slate-400 mt-1">1-10 (10 = highest)</p>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Check Interval</label>
                        <select
                            className="border p-2 rounded text-sm w-full"
                            value={values.cron_interval}
                            onChange={e => onChange('cron_interval', e.target.value)}
                        >
                            {cronIntervals.map(i => (
                                <option key={i.value} value={i.value}>{i.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Fallback Featured Image</label>
                    <ImageUpload
                        value={values.fallback_featured_image_url}
                        onChange={(url) => onChange('fallback_featured_image_url', url)}
                        folder="feed-defaults"
                        entityType="feed"
                        placeholder="Upload default image for this feed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Used when no image is found in scraped content</p>
                </div>
            </div>

            {/* AI Configuration */}
            <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">AI Provider Override (Optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                        className="border p-2 rounded text-sm"
                        value={values.ai_provider}
                        onChange={e => handleAIProviderChange(e.target.value)}
                    >
                        {aiProviders.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="AI Model (auto-filled)"
                        className="border p-2 rounded text-sm"
                        value={values.ai_model}
                        onChange={e => onChange('ai_model', e.target.value)}
                        disabled={!values.ai_provider}
                    />
                </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4 border-t pt-4">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={values.enable_scraping}
                        onChange={e => onChange('enable_scraping', e.target.checked)}
                        className="rounded"
                    />
                    Enable Scraping
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={values.enable_ai_processing}
                        onChange={e => onChange('enable_ai_processing', e.target.checked)}
                        className="rounded"
                    />
                    Enable AI Processing
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={values.auto_publish}
                        onChange={e => onChange('auto_publish', e.target.checked)}
                        className="rounded"
                    />
                    Auto Publish
                </label>
                <label className="flex items-center gap-2 text-sm" title="Allow processing the same URL multiple times">
                    <input
                        type="checkbox"
                        checked={values.allow_republishing}
                        onChange={e => onChange('allow_republishing', e.target.checked)}
                        className="rounded"
                    />
                    Allow Republishing
                </label>
            </div>
        </div>
    );
}

export default function ManageFeeds() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [newFeed, setNewFeed] = useState<FeedFormValues>(defaultFeedValues);
    const [adding, setAdding] = useState(false);

    // Edit modal state
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [editForm, setEditForm] = useState<FeedFormValues>(defaultFeedValues);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/feeds');
            const data = await res.json();
            if (res.ok) {
                setFeeds(data.feeds || []);
            } else {
                console.error('Error fetching feeds:', data.error);
            }
        } catch (error) {
            console.error('Error fetching feeds:', error);
        }
        setLoading(false);
    };

    const handleNewFeedChange = (field: keyof FeedFormValues, value: any) => {
        setNewFeed(prev => ({ ...prev, [field]: value }));
    };

    const handleEditFormChange = (field: keyof FeedFormValues, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch('/api/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFeed),
            });
            const data = await res.json();
            if (res.ok) {
                setNewFeed(defaultFeedValues);
                fetchFeeds();
            } else {
                alert('Error adding feed: ' + data.error);
            }
        } catch (error) {
            alert('Error adding feed: ' + error);
        }
        setAdding(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feed?')) return;
        try {
            const res = await fetch(`/api/admin/feeds/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchFeeds();
            } else {
                const data = await res.json();
                alert('Error deleting feed: ' + data.error);
            }
        } catch (error) {
            alert('Error deleting feed: ' + error);
        }
    };

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            const res = await fetch(`/api/admin/feeds/${id}/sync`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(`Sync completed!\n\nProcessed: ${data.result.itemsProcessed}\nCreated: ${data.result.opportunitiesCreated}\nDuplicates: ${data.result.duplicatesSkipped}\nRejected: ${data.result.aiRejections}`);
                fetchFeeds();
            } else {
                alert('Error syncing feed: ' + data.error);
            }
        } catch (error) {
            alert('Error syncing feed: ' + error);
        }
        setSyncing(null);
    };

    const openEditModal = (feed: Feed) => {
        setEditingFeed(feed);
        setEditForm({
            name: feed.name,
            url: feed.url,
            opportunity_type: feed.opportunity_type,
            enable_scraping: feed.enable_scraping,
            enable_ai_processing: feed.enable_ai_processing,
            auto_publish: feed.auto_publish,
            status: feed.status,
            ai_provider: feed.ai_provider || '',
            ai_model: feed.ai_model || '',
            quality_threshold: feed.quality_threshold ?? 0.6,
            priority: feed.priority ?? 5,
            cron_interval: feed.cron_interval || 'hourly',
            fallback_featured_image_url: feed.fallback_featured_image_url || '',
            allow_republishing: feed.allow_republishing ?? false
        });
    };

    const closeEditModal = () => {
        setEditingFeed(null);
        setEditForm(defaultFeedValues);
    };

    const handleSaveEdit = async () => {
        if (!editingFeed) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/feeds/${editingFeed.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (res.ok) {
                closeEditModal();
                fetchFeeds();
            } else {
                alert('Error updating feed: ' + data.error);
            }
        } catch (error) {
            alert('Error updating feed: ' + error);
        }
        setSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <RefreshCw size={20} /> Manage RSS Feeds
            </h3>

            {/* Add Feed Form */}
            <form onSubmit={handleAddFeed} className="mb-8 bg-slate-50 p-4 rounded-lg">
                <FeedForm values={newFeed} onChange={handleNewFeedChange} />
                <button
                    type="submit"
                    disabled={adding}
                    className="mt-4 bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50"
                >
                    <Plus size={16} /> {adding ? 'Adding...' : 'Add Feed'}
                </button>
            </form>

            {/* Feeds List */}
            {loading ? (
                <p className="text-center text-slate-500">Loading feeds...</p>
            ) : feeds.length === 0 ? (
                <p className="text-center text-slate-400 italic">No feeds configured yet.</p>
            ) : (
                <div className="space-y-4">
                    {feeds.map((feed) => (
                        <div key={feed.id} className="flex flex-col border border-slate-200 rounded-lg p-4 gap-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold text-[#1a1a1a]">{feed.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            feed.status === 'active' ? 'bg-green-100 text-green-700' :
                                            feed.status === 'error' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {feed.status}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                            {feed.opportunity_type.replace('_', ' ')}
                                        </span>
                                        {feed.ai_provider && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                                                AI: {feed.ai_provider}
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                            P{feed.priority || 5}
                                        </span>
                                    </div>
                                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-2">
                                        {feed.url.length > 60 ? feed.url.substring(0, 60) + '...' : feed.url} <ExternalLink size={10} />
                                    </a>
                                    <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                                        <span>Last: {feed.last_fetched ? new Date(feed.last_fetched).toLocaleString() : 'Never'}</span>
                                        <span>Processed: {feed.total_items_processed || 0}</span>
                                        <span>Created: {feed.opportunities_created || 0}</span>
                                        <span>Interval: {feed.cron_interval || 'hourly'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSync(feed.id)}
                                        disabled={syncing === feed.id}
                                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                        title="Run Now"
                                    >
                                        {syncing === feed.id ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <Play size={18} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(feed)}
                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(feed.id)}
                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingFeed && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Edit Feed: {editingFeed.name}</h3>
                            <button
                                onClick={closeEditModal}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <FeedForm values={editForm} onChange={handleEditFormChange} isEdit />
                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={closeEditModal}
                                    className="px-4 py-2 border border-slate-300 rounded font-bold hover:bg-slate-50"
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
