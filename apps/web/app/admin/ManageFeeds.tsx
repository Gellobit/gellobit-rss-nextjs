'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react';

export default function ManageFeeds() {
    const supabase = createClientComponentClient();
    const [feeds, setFeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newFeed, setNewFeed] = useState({ name: '', url: '' });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rss_feeds')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching feeds:', error);
        else setFeeds(data || []);
        setLoading(false);
    };

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);

        const { error } = await supabase
            .from('rss_feeds')
            .insert([newFeed]);

        if (error) {
            alert('Error adding feed: ' + error.message);
        } else {
            setNewFeed({ name: '', url: '' });
            fetchFeeds();
        }
        setAdding(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feed?')) return;

        const { error } = await supabase
            .from('rss_feeds')
            .delete()
            .eq('id', id);

        if (error) alert('Error deleting feed');
        else fetchFeeds();
    };

    const handleSync = async (id: string) => {
        // Placeholder for API call
        alert('Sync functionality coming in next step (Backend API)');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <RefreshCw size={20} /> Manage RSS Feeds
            </h3>

            {/* Add Feed Form */}
            <form onSubmit={handleAddFeed} className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-50 p-4 rounded-lg">
                <input
                    type="text"
                    placeholder="Feed Name (e.g. TechCrunch)"
                    className="border p-2 rounded flex-1"
                    value={newFeed.name}
                    onChange={e => setNewFeed({ ...newFeed, name: e.target.value })}
                    required
                />
                <input
                    type="url"
                    placeholder="RSS URL"
                    className="border p-2 rounded flex-[2]"
                    value={newFeed.url}
                    onChange={e => setNewFeed({ ...newFeed, url: e.target.value })}
                    required
                />
                <button
                    type="submit"
                    disabled={adding}
                    className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 justify-center"
                >
                    <Plus size={16} /> Add Feed
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
                        <div key={feed.id} className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-[#1a1a1a]">{feed.name}</h4>
                                <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                    {feed.url} <ExternalLink size={10} />
                                </a>
                                <p className="text-xs text-slate-400 mt-1">
                                    Last synced: {feed.last_fetched ? new Date(feed.last_fetched).toLocaleString() : 'Never'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${feed.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {feed.status}
                                </span>
                                <button
                                    onClick={() => handleSync(feed.id)}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Sync Now"
                                >
                                    <RefreshCw size={18} />
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
                    ))}
                </div>
            )}
        </div>
    );
}
