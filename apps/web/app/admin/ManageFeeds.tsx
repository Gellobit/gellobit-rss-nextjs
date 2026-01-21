'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Plus, ExternalLink, Play, Pencil, X, Save, Tag, Copy, AlertTriangle, RotateCcw } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Feed {
    id: string;
    name: string;
    url: string;
    status: 'active' | 'inactive' | 'error';
    output_type?: 'opportunity' | 'blog_post';
    source_type?: 'rss' | 'url_list';
    url_list?: string | null;
    opportunity_type: string;
    blog_category_id?: string | null;
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
    preserve_source_slug?: boolean;
    preserve_source_title?: boolean;
    last_fetched?: string;
    total_processed?: number;
    total_published?: number;
    error_count?: number;
    last_error?: string | null;
    // New scheduling fields
    schedule_type?: 'interval' | 'daily';
    scheduled_hour?: number | null;
    scheduled_minute?: number | null;
    items_pending?: number;
    last_rss_check?: string;
    processing_status?: 'idle' | 'fetching' | 'processing';
}

interface Category {
    id: string;
    name: string;
    slug: string;
    color: string;
    is_default: boolean;
}

interface FeedFormValues {
    name: string;
    url: string;
    source_type: 'rss' | 'url_list';
    url_list: string;
    output_type: 'opportunity' | 'blog_post';
    opportunity_type: string;
    blog_category_id: string;
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
    preserve_source_slug: boolean;
    preserve_source_title: boolean;
    // New scheduling fields
    schedule_type: 'interval' | 'daily';
    scheduled_hour: number | null;
    scheduled_minute: number;
}

const defaultFeedValues: FeedFormValues = {
    name: '',
    url: '',
    source_type: 'rss',
    url_list: '',
    output_type: 'opportunity',
    opportunity_type: 'giveaway',
    blog_category_id: '',
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
    allow_republishing: false,
    preserve_source_slug: false,
    preserve_source_title: false,
    schedule_type: 'interval',
    scheduled_hour: null,
    scheduled_minute: 0,
};

const outputTypes = [
    { value: 'opportunity', label: 'Opportunity', description: 'Create opportunities in the main feed' },
    { value: 'blog_post', label: 'Blog Post', description: 'Create blog posts for the blog section' },
];

const sourceTypes = [
    { value: 'rss', label: 'RSS Feed', description: 'Fetch content from an RSS feed URL' },
    { value: 'url_list', label: 'URL List', description: 'Process a list of specific URLs' },
];

// Opportunity types will be loaded dynamically from the API
interface OpportunityTypeOption {
    value: string;
    label: string;
}

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

const scheduleTypes = [
    { value: 'interval', label: 'Interval-based' },
    { value: 'daily', label: 'Specific time daily' },
];

// Generate hour options (0-23)
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

// Generate minute options (0, 15, 30, 45)
const minuteOptions = [
    { value: 0, label: ':00' },
    { value: 15, label: ':15' },
    { value: 30, label: ':30' },
    { value: 45, label: ':45' },
];

// FeedForm as a separate component to prevent re-render issues
function FeedForm({
    values,
    onChange,
    isEdit = false,
    categories = [],
    opportunityTypes = []
}: {
    values: FeedFormValues;
    onChange: (field: keyof FeedFormValues, value: any) => void;
    isEdit?: boolean;
    categories?: Category[];
    opportunityTypes?: OpportunityTypeOption[];
}) {
    const handleAIProviderChange = (provider: string) => {
        const selectedProvider = aiProviders.find(p => p.value === provider);
        onChange('ai_provider', provider);
        onChange('ai_model', selectedProvider?.model || '');
    };

    return (
        <div className="space-y-4">
            {/* Output Type Selection */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs text-slate-500 mb-2">Output Type</label>
                <div className="grid grid-cols-2 gap-3">
                    {outputTypes.map(t => (
                        <label
                            key={t.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                values.output_type === t.value
                                    ? 'border-slate-900 bg-white shadow-sm'
                                    : 'border-slate-200 bg-white/50 hover:border-slate-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="output_type"
                                value={t.value}
                                checked={values.output_type === t.value}
                                onChange={e => onChange('output_type', e.target.value)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                values.output_type === t.value
                                    ? 'border-slate-900'
                                    : 'border-slate-300'
                            }`}>
                                {values.output_type === t.value && (
                                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                                )}
                            </div>
                            <div>
                                <span className="font-bold text-sm text-slate-900">{t.label}</span>
                                <p className="text-xs text-slate-500">{t.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

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
                {values.output_type === 'opportunity' && (
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
                )}
                {values.output_type === 'blog_post' && (
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">
                            <Tag size={12} className="inline mr-1" />
                            Blog Category
                        </label>
                        <select
                            className="border p-2 rounded w-full"
                            value={values.blog_category_id}
                            onChange={e => onChange('blog_category_id', e.target.value)}
                        >
                            <option value="">Use Default Category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.is_default ? '(Default)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Blog Post Options - Only shown for blog_post output type */}
            {values.output_type === 'blog_post' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-sm font-bold text-amber-800 mb-3">Blog Post Options</p>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-amber-900">
                            <input
                                type="checkbox"
                                checked={values.preserve_source_slug}
                                onChange={e => onChange('preserve_source_slug', e.target.checked)}
                                className="rounded border-amber-300"
                            />
                            Preserve Source Slug
                            <span className="text-xs text-amber-600">(use original URL slug)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-amber-900">
                            <input
                                type="checkbox"
                                checked={values.preserve_source_title}
                                onChange={e => onChange('preserve_source_title', e.target.checked)}
                                className="rounded border-amber-300"
                            />
                            Preserve Source Title
                            <span className="text-xs text-amber-600">(use original title instead of AI)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Source Type Selection - Only shown for blog_post output type */}
            {values.output_type === 'blog_post' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <label className="block text-xs text-blue-600 mb-2 font-bold">Content Source</label>
                    <div className="grid grid-cols-2 gap-3">
                        {sourceTypes.map(t => (
                            <label
                                key={t.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    values.source_type === t.value
                                        ? 'border-blue-500 bg-white shadow-sm'
                                        : 'border-blue-200 bg-white/50 hover:border-blue-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="source_type"
                                    value={t.value}
                                    checked={values.source_type === t.value}
                                    onChange={e => onChange('source_type', e.target.value)}
                                    className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    values.source_type === t.value
                                        ? 'border-blue-500'
                                        : 'border-blue-300'
                                }`}>
                                    {values.source_type === t.value && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <span className="font-bold text-sm text-blue-900">{t.label}</span>
                                    <p className="text-xs text-blue-600">{t.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* RSS URL - shown for opportunities OR blog_post with rss source */}
            {(values.output_type === 'opportunity' || values.source_type === 'rss') && (
                <div>
                    <label className="block text-xs text-slate-500 mb-1">RSS Feed URL</label>
                    <input
                        type="url"
                        placeholder="https://www.google.com/alerts/feeds/..."
                        className="border p-2 rounded w-full"
                        value={values.url}
                        onChange={e => onChange('url', e.target.value)}
                        required={values.source_type === 'rss'}
                    />
                </div>
            )}

            {/* URL List - shown for blog_post with url_list source */}
            {values.output_type === 'blog_post' && values.source_type === 'url_list' && (
                <div>
                    <label className="block text-xs text-slate-500 mb-1">URL List (one per line)</label>
                    <textarea
                        placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
                        className="border p-2 rounded w-full font-mono text-sm"
                        rows={6}
                        value={values.url_list}
                        onChange={e => onChange('url_list', e.target.value)}
                        required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Enter URLs to scrape, one per line. Each URL will be processed and published as a blog post.
                    </p>
                </div>
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Quality Threshold - Only shown when AI processing is enabled */}
                    {values.enable_ai_processing && (
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
                    )}
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
                </div>

                {/* Schedule Configuration */}
                <div className="bg-slate-50 p-3 rounded-lg space-y-3">
                    <p className="text-xs font-bold text-slate-600">Schedule Configuration</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Schedule Type</label>
                            <select
                                className="border p-2 rounded text-sm w-full"
                                value={values.schedule_type}
                                onChange={e => {
                                    onChange('schedule_type', e.target.value);
                                    if (e.target.value === 'daily' && values.scheduled_hour === null) {
                                        onChange('scheduled_hour', 8); // Default to 8 AM
                                    }
                                }}
                            >
                                {scheduleTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {values.schedule_type === 'interval' ? (
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
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">Hour</label>
                                    <select
                                        className="border p-2 rounded text-sm w-full"
                                        value={values.scheduled_hour ?? 8}
                                        onChange={e => onChange('scheduled_hour', parseInt(e.target.value))}
                                    >
                                        {hourOptions.map(h => (
                                            <option key={h.value} value={h.value}>{h.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-slate-500 mb-1">Minute</label>
                                    <select
                                        className="border p-2 rounded text-sm w-full"
                                        value={values.scheduled_minute}
                                        onChange={e => onChange('scheduled_minute', parseInt(e.target.value))}
                                    >
                                        {minuteOptions.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">
                        {values.schedule_type === 'interval'
                            ? 'Feed will be checked at regular intervals throughout the day'
                            : `Feed will be checked once daily at the specified time (server timezone)`
                        }
                    </p>
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

            {/* AI Configuration - Only shown when AI processing is enabled */}
            {values.enable_ai_processing && (
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
            )}

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
    const [reactivating, setReactivating] = useState<string | null>(null);
    const [newFeed, setNewFeed] = useState<FeedFormValues>(defaultFeedValues);
    const [adding, setAdding] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Edit modal state
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [editForm, setEditForm] = useState<FeedFormValues>(defaultFeedValues);
    const [saving, setSaving] = useState(false);
    const [clearingDuplicates, setClearingDuplicates] = useState(false);
    const [duplicating, setDuplicating] = useState<string | null>(null);

    // Categories for blog posts
    const [categories, setCategories] = useState<Category[]>([]);

    // Opportunity types (loaded dynamically)
    const [opportunityTypes, setOpportunityTypes] = useState<OpportunityTypeOption[]>([]);

    useEffect(() => {
        fetchFeeds();
        fetchCategories();
        fetchOpportunityTypes();
    }, []);

    const fetchOpportunityTypes = async () => {
        try {
            const res = await fetch('/api/opportunity-types');
            const data = await res.json();
            if (data.types) {
                setOpportunityTypes(data.types);
            }
        } catch (error) {
            console.error('Error fetching opportunity types:', error);
            // Fallback to some defaults if API fails
            setOpportunityTypes([
                { value: 'giveaway', label: 'Giveaway' },
                { value: 'contest', label: 'Contest' },
                { value: 'sweepstakes', label: 'Sweepstakes' },
            ]);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (data.categories) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchFeeds = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/feeds');
            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }
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
                setShowAddForm(false);
                fetchFeeds();
            } else {
                alert('Error adding feed: ' + data.error);
            }
        } catch (error) {
            alert('Error adding feed: ' + error);
        }
        setAdding(false);
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewFeed(defaultFeedValues);
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
                const created = data.result.outputType === 'blog_post'
                    ? `Posts Created: ${data.result.postsCreated || 0}`
                    : `Opportunities Created: ${data.result.opportunitiesCreated || 0}`;
                alert(`Sync completed!\n\nProcessed: ${data.result.itemsProcessed}\n${created}\nDuplicates: ${data.result.duplicatesSkipped}\nRejected: ${data.result.aiRejections}`);
                fetchFeeds();
            } else {
                alert('Error syncing feed: ' + data.error);
            }
        } catch (error) {
            alert('Error syncing feed: ' + error);
        }
        setSyncing(null);
    };

    const handleReactivate = async (id: string) => {
        setReactivating(id);
        try {
            const res = await fetch(`/api/admin/feeds/${id}/reactivate`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert('Feed reactivated successfully! Error count has been reset.');
                fetchFeeds();
            } else {
                alert('Error reactivating feed: ' + data.error);
            }
        } catch (error) {
            alert('Error reactivating feed: ' + error);
        }
        setReactivating(null);
    };

    const handleClearDuplicates = async (id: string) => {
        if (!confirm('Are you sure you want to reset tracking for this feed?\n\nThis will:\n- Clear duplicate tracking records\n- Reset Processed and Created counters to 0\n- Allow all URLs to be processed again')) {
            return;
        }

        setClearingDuplicates(true);
        try {
            const res = await fetch(`/api/admin/feeds/${id}/clear-duplicates`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert('Feed tracking has been reset!\n\nAll URLs can now be processed again.');
                fetchFeeds(); // Refresh the list to show updated counters
            } else {
                alert('Error clearing tracking: ' + data.error);
            }
        } catch (error) {
            alert('Error clearing tracking: ' + error);
        }
        setClearingDuplicates(false);
    };

    const handleDuplicate = async (feed: Feed) => {
        setDuplicating(feed.id);
        try {
            const duplicateData = {
                name: `${feed.name} (Copy)`,
                url: feed.url,
                source_type: feed.source_type || 'rss',
                url_list: feed.url_list || '',
                output_type: feed.output_type || 'opportunity',
                opportunity_type: feed.opportunity_type,
                blog_category_id: feed.blog_category_id || '',
                enable_scraping: feed.enable_scraping,
                enable_ai_processing: feed.enable_ai_processing,
                auto_publish: feed.auto_publish,
                status: 'inactive' as const, // Start as inactive
                ai_provider: feed.ai_provider || '',
                ai_model: feed.ai_model || '',
                quality_threshold: feed.quality_threshold ?? 0.6,
                priority: feed.priority ?? 5,
                cron_interval: feed.cron_interval || 'hourly',
                fallback_featured_image_url: feed.fallback_featured_image_url || '',
                allow_republishing: feed.allow_republishing ?? false,
                preserve_source_slug: feed.preserve_source_slug ?? false,
                preserve_source_title: feed.preserve_source_title ?? false,
                schedule_type: feed.schedule_type || 'interval',
                scheduled_hour: feed.scheduled_hour ?? null,
                scheduled_minute: feed.scheduled_minute ?? 0,
            };

            const res = await fetch('/api/admin/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicateData),
            });
            const data = await res.json();
            if (res.ok) {
                fetchFeeds();
            } else {
                alert('Error duplicating feed: ' + data.error);
            }
        } catch (error) {
            alert('Error duplicating feed: ' + error);
        }
        setDuplicating(null);
    };

    const openEditModal = (feed: Feed) => {
        setEditingFeed(feed);
        setEditForm({
            name: feed.name,
            url: feed.url,
            source_type: feed.source_type || 'rss',
            url_list: feed.url_list || '',
            output_type: feed.output_type || 'opportunity',
            opportunity_type: feed.opportunity_type,
            blog_category_id: feed.blog_category_id || '',
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
            allow_republishing: feed.allow_republishing ?? false,
            preserve_source_slug: feed.preserve_source_slug ?? false,
            preserve_source_title: feed.preserve_source_title ?? false,
            schedule_type: feed.schedule_type || 'interval',
            scheduled_hour: feed.scheduled_hour ?? null,
            scheduled_minute: feed.scheduled_minute ?? 0,
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
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <RefreshCw size={20} /> Manage RSS Feeds
                </h3>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Feed
                    </button>
                )}
            </div>

            {/* Add Feed Form - Only shown when showAddForm is true */}
            {showAddForm && (
                <form onSubmit={handleAddFeed} className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700">New Feed</h4>
                        <button
                            type="button"
                            onClick={handleCancelAdd}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <FeedForm values={newFeed} onChange={handleNewFeedChange} categories={categories} opportunityTypes={opportunityTypes} />
                    <div className="flex gap-3 mt-4">
                        <button
                            type="submit"
                            disabled={adding}
                            className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                            <Plus size={16} /> {adding ? 'Adding...' : 'Add Feed'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelAdd}
                            className="px-4 py-2 border border-slate-300 rounded font-bold hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Feeds List */}
            {sessionExpired ? (
                <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                    <p className="text-amber-700 mb-4">Your session has expired. Please log in again to continue.</p>
                    <a
                        href="/auth?redirect=/admin?section=feeds"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                    >
                        Log In Again
                    </a>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw size={24} className="animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading feeds...</span>
                </div>
            ) : feeds.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-400 italic mb-4">No feeds configured yet.</p>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 inline-flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Your First Feed
                        </button>
                    )}
                </div>
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
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            feed.output_type === 'blog_post'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {feed.output_type === 'blog_post' ? 'Blog Post' : 'Opportunity'}
                                        </span>
                                        {feed.output_type === 'blog_post' && feed.source_type === 'url_list' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                                URL List
                                            </span>
                                        )}
                                        {feed.output_type !== 'blog_post' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                                {feed.opportunity_type.replace('_', ' ')}
                                            </span>
                                        )}
                                        {feed.enable_ai_processing ? (
                                            feed.ai_provider && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                                                    AI: {feed.ai_provider}
                                                </span>
                                            )
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                                PASSTHROUGH
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                            PRIORITY: {feed.priority || 5}
                                        </span>
                                    </div>
                                    {feed.source_type === 'url_list' ? (
                                        <span className="text-xs text-slate-500 mb-2">
                                            {feed.url_list ? feed.url_list.split('\n').filter(u => u.trim()).length : 0} URLs in list
                                        </span>
                                    ) : (
                                        <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-2">
                                            {feed.url.length > 60 ? feed.url.substring(0, 60) + '...' : feed.url} <ExternalLink size={10} />
                                        </a>
                                    )}
                                    <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                                        <span>Last: {feed.last_fetched ? new Date(feed.last_fetched).toLocaleString() : 'Never'}</span>
                                        <span>Processed: {feed.total_processed || 0}</span>
                                        <span>Created: {feed.total_published || 0}</span>
                                        {feed.schedule_type === 'daily' ? (
                                            <span className="text-indigo-600 font-medium">
                                                Daily at {(() => {
                                                    const hour = feed.scheduled_hour;
                                                    const minute = feed.scheduled_minute ?? 0;
                                                    if (hour == null) return 'N/A';
                                                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                                    const ampm = hour < 12 ? 'AM' : 'PM';
                                                    return `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
                                                })()}
                                            </span>
                                        ) : (
                                            <span>Interval: {cronIntervals.find(i => i.value === feed.cron_interval)?.label || 'Hourly'}</span>
                                        )}
                                        {feed.items_pending != null && feed.items_pending > 0 && (
                                            <span className="text-amber-600 font-medium">{feed.items_pending} pending</span>
                                        )}
                                        {feed.error_count != null && feed.error_count > 0 && (
                                            <span className="text-red-600 font-medium">Errors: {feed.error_count}/5</span>
                                        )}
                                    </div>
                                    {/* Error message display */}
                                    {feed.status === 'error' && feed.last_error && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-red-700">
                                                    <span className="font-semibold">Last Error:</span>{' '}
                                                    {feed.last_error.length > 150
                                                        ? feed.last_error.substring(0, 150) + '...'
                                                        : feed.last_error}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Reactivate button for error feeds */}
                                    {feed.status === 'error' && (
                                        <button
                                            onClick={() => handleReactivate(feed.id)}
                                            disabled={reactivating === feed.id}
                                            className="p-2 text-red-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                            title="Reactivate Feed"
                                        >
                                            {reactivating === feed.id ? (
                                                <RefreshCw size={18} className="animate-spin" />
                                            ) : (
                                                <RotateCcw size={18} />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSync(feed.id)}
                                        disabled={syncing === feed.id || feed.status === 'error'}
                                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                        title={feed.status === 'error' ? 'Reactivate feed first' : 'Run Now'}
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
                                        onClick={() => handleDuplicate(feed)}
                                        disabled={duplicating === feed.id}
                                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                                        title="Duplicate"
                                    >
                                        {duplicating === feed.id ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <Copy size={18} />
                                        )}
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
                            <FeedForm values={editForm} onChange={handleEditFormChange} isEdit categories={categories} opportunityTypes={opportunityTypes} />
                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50"
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

                            {/* Advanced Actions */}
                            <div className="mt-6 pt-4 border-t border-dashed border-slate-300">
                                <h4 className="text-sm font-semibold text-slate-500 mb-3">Advanced Actions</h4>
                                <button
                                    onClick={() => handleClearDuplicates(editingFeed.id)}
                                    disabled={clearingDuplicates}
                                    className="text-sm px-3 py-2 text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                    {clearingDuplicates ? 'Resetting...' : 'Reset Feed Tracking'}
                                </button>
                                <p className="text-xs text-slate-500 mt-2">
                                    Resets Processed/Created counters to 0 and clears duplicate tracking, allowing all URLs to be processed again.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
