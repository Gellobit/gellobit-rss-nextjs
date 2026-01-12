'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Plus, ExternalLink, Play } from 'lucide-react';

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
    ai_api_key?: string | null;
    last_fetched?: string;
    total_items_processed?: number;
    opportunities_created?: number;
}

export default function ManageFeeds() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [newFeed, setNewFeed] = useState({
        name: '',
        url: '',
        opportunity_type: 'giveaway',
        enable_scraping: true,
        enable_ai_processing: true,
        auto_publish: false,
        status: 'active',
        ai_provider: '',
        ai_model: '',
        ai_api_key: ''
    });
    const [adding, setAdding] = useState(false);

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
                setNewFeed({
                    name: '',
                    url: '',
                    opportunity_type: 'giveaway',
                    enable_scraping: true,
                    enable_ai_processing: true,
                    auto_publish: false,
                    status: 'active',
                    ai_provider: '',
                    ai_model: '',
                    ai_api_key: ''
                });
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
            const res = await fetch(`/api/admin/feeds/${id}`, {
                method: 'DELETE',
            });

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
            const res = await fetch(`/api/admin/feeds/${id}/sync`, {
                method: 'POST',
            });

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

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <RefreshCw size={20} /> Manage RSS Feeds
            </h3>

            {/* Add Feed Form */}
            <form onSubmit={handleAddFeed} className="mb-8 bg-slate-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Feed Name (e.g. TechCrunch)"
                        className="border p-2 rounded"
                        value={newFeed.name}
                        onChange={e => setNewFeed({ ...newFeed, name: e.target.value })}
                        required
                    />
                    <select
                        className="border p-2 rounded"
                        value={newFeed.opportunity_type}
                        onChange={e => setNewFeed({ ...newFeed, opportunity_type: e.target.value })}
                        required
                    >
                        <option value="giveaway">Giveaway</option>
                        <option value="contest">Contest</option>
                        <option value="sweepstakes">Sweepstakes</option>
                        <option value="dream_job">Dream Job</option>
                        <option value="get_paid_to">Get Paid To</option>
                        <option value="instant_win">Instant Win</option>
                        <option value="job_fair">Job Fair</option>
                        <option value="scholarship">Scholarship</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="free_training">Free Training</option>
                        <option value="promo">Promo</option>
                    </select>
                </div>

                <input
                    type="url"
                    placeholder="RSS URL (e.g. Google Alerts RSS)"
                    className="border p-2 rounded w-full"
                    value={newFeed.url}
                    onChange={e => setNewFeed({ ...newFeed, url: e.target.value })}
                    required
                />

                {/* AI Configuration (Optional) */}
                <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-bold text-slate-700">AI Configuration (Optional - Leave empty to use global settings)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            className="border p-2 rounded text-sm"
                            value={newFeed.ai_provider}
                            onChange={e => {
                                const provider = e.target.value;
                                const defaultModels: Record<string, string> = {
                                    'openai': 'gpt-4o-mini',
                                    'anthropic': 'claude-3-5-sonnet-20241022',
                                    'deepseek': 'deepseek-chat',
                                    'gemini': 'gemini-1.5-flash'
                                };
                                setNewFeed({
                                    ...newFeed,
                                    ai_provider: provider,
                                    ai_model: provider ? defaultModels[provider] || '' : ''
                                });
                            }}
                        >
                            <option value="">Use Global AI Provider</option>
                            <option value="openai">OpenAI (GPT-4o-mini)</option>
                            <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                            <option value="deepseek">DeepSeek (DeepSeek-Chat)</option>
                            <option value="gemini">Google (Gemini 1.5 Flash)</option>
                        </select>
                        <input
                            type="text"
                            placeholder="AI Model (auto-filled)"
                            className="border p-2 rounded text-sm"
                            value={newFeed.ai_model}
                            onChange={e => setNewFeed({ ...newFeed, ai_model: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="API Key (optional)"
                            className="border p-2 rounded text-sm"
                            value={newFeed.ai_api_key}
                            onChange={e => setNewFeed({ ...newFeed, ai_api_key: e.target.value })}
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        Configure a specific AI provider for this feed. If not set, the global AI settings will be used.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={newFeed.enable_scraping}
                            onChange={e => setNewFeed({ ...newFeed, enable_scraping: e.target.checked })}
                            className="rounded"
                        />
                        Enable Scraping
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={newFeed.enable_ai_processing}
                            onChange={e => setNewFeed({ ...newFeed, enable_ai_processing: e.target.checked })}
                            className="rounded"
                        />
                        Enable AI Processing
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={newFeed.auto_publish}
                            onChange={e => setNewFeed({ ...newFeed, auto_publish: e.target.checked })}
                            className="rounded"
                        />
                        Auto Publish
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={adding}
                    className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50"
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-[#1a1a1a]">{feed.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            feed.status === 'active' ? 'bg-green-100 text-green-700' :
                                            feed.status === 'error' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {feed.status}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                            {feed.opportunity_type}
                                        </span>
                                        {feed.ai_provider && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700" title={`Using ${feed.ai_provider} (${feed.ai_model})`}>
                                                AI: {feed.ai_provider}
                                            </span>
                                        )}
                                    </div>
                                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-2">
                                        {feed.url.substring(0, 60)}... <ExternalLink size={10} />
                                    </a>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>Last: {feed.last_fetched ? new Date(feed.last_fetched).toLocaleDateString() : 'Never'}</span>
                                        <span>Processed: {feed.total_items_processed || 0}</span>
                                        <span>Created: {feed.opportunities_created || 0}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSync(feed.id)}
                                        disabled={syncing === feed.id}
                                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                        title="Sync Now"
                                    >
                                        {syncing === feed.id ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <Play size={18} />
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
        </div>
    );
}
