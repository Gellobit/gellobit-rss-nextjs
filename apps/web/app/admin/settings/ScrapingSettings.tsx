'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface ScrapingConfig {
    request_timeout: number;
    max_redirects: number;
    min_content_length: number;
    max_content_length: number;
    user_agent: string;
    follow_google_feedproxy: boolean;
}

export default function ScrapingSettings() {
    const [config, setConfig] = useState<ScrapingConfig>({
        request_timeout: 10000,
        max_redirects: 5,
        min_content_length: 100,
        max_content_length: 50000,
        user_agent: 'Gellobit RSS Bot/1.0',
        follow_google_feedproxy: true,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/settings/scraping');
            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (res.ok && data.settings) {
                setConfig(data.settings);
            }
        } catch (error) {
            console.error('Error fetching scraping settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/scraping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
        setSaving(false);
    };

    if (sessionExpired) {
        return (
            <div className="text-center py-12 px-8 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-amber-600 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                <p className="text-amber-700 mb-4">Your session has expired. Please log in again to continue.</p>
                <a href="/auth?redirect=/admin?section=settings" className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors">
                    Log In Again
                </a>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Request Timeout */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Request Timeout (milliseconds)
                </label>
                <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={config.request_timeout}
                    onChange={(e) => setConfig({ ...config, request_timeout: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    How long to wait for a page to load before timing out (default: 10000ms = 10 seconds)
                </p>
            </div>

            {/* Max Redirects */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Maximum Redirects
                </label>
                <input
                    type="number"
                    min="0"
                    max="20"
                    value={config.max_redirects}
                    onChange={(e) => setConfig({ ...config, max_redirects: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    How many URL redirects to follow before giving up (default: 5)
                </p>
            </div>

            {/* Min Content Length */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Minimum Content Length (characters)
                </label>
                <input
                    type="number"
                    min="50"
                    max="5000"
                    value={config.min_content_length}
                    onChange={(e) => setConfig({ ...config, min_content_length: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    Reject pages with less content than this (prevents scraping errors)
                </p>
            </div>

            {/* Max Content Length */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Maximum Content Length (characters)
                </label>
                <input
                    type="number"
                    min="1000"
                    max="200000"
                    step="1000"
                    value={config.max_content_length}
                    onChange={(e) => setConfig({ ...config, max_content_length: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    Truncate content longer than this to save AI tokens (default: 50000)
                </p>
            </div>

            {/* User Agent */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    User Agent
                </label>
                <input
                    type="text"
                    value={config.user_agent}
                    onChange={(e) => setConfig({ ...config, user_agent: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    The User-Agent string sent with HTTP requests
                </p>
            </div>

            {/* Follow Google FeedProxy */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.follow_google_feedproxy}
                        onChange={(e) => setConfig({ ...config, follow_google_feedproxy: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                        <div className="text-sm font-bold text-slate-900">Follow Google FeedProxy Redirects</div>
                        <div className="text-xs text-slate-500">
                            Automatically resolve feedproxy.google.com URLs to their final destination
                        </div>
                    </div>
                </label>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Settings
                        </>
                    )}
                </button>
                <button
                    onClick={fetchSettings}
                    className="bg-white text-slate-700 px-6 py-2 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
