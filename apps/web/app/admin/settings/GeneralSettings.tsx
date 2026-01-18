'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Globe, FileText, ExternalLink, CheckCircle } from 'lucide-react';

interface GeneralConfig {
    automatic_processing: boolean;
    processing_interval: number;
    auto_publish: boolean;
    quality_threshold: number;
    max_posts_per_run: number;
}

export default function GeneralSettings() {
    const [config, setConfig] = useState<GeneralConfig>({
        automatic_processing: true,
        processing_interval: 60,
        auto_publish: false,
        quality_threshold: 0.7,
        max_posts_per_run: 10,
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
            const res = await fetch('/api/admin/settings/general');
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
            console.error('Error fetching general settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/general', {
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

            {/* SEO Information */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <Globe size={18} className="text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-900">SEO Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sitemap */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">Sitemap</span>
                                    <CheckCircle size={14} className="text-green-500" />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Auto-generated sitemap includes homepage, blog posts, and static pages.
                                    Opportunities are excluded (protected content).
                                </p>
                                <a
                                    href="/sitemap.xml"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                                >
                                    View sitemap.xml
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Robots.txt */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">Robots.txt</span>
                                    <CheckCircle size={14} className="text-green-500" />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Configured to block crawlers from protected routes (/opportunities, /admin, /api).
                                    AI crawlers are also blocked.
                                </p>
                                <a
                                    href="/robots.txt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                                >
                                    View robots.txt
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-100 rounded-lg p-3">
                    <strong>Protected Routes:</strong> /opportunities, /saved, /account, /admin, /auth are protected with multiple layers:
                    middleware auth redirect, X-Robots-Tag headers, noindex metadata, and robots.txt disallow rules.
                </div>
            </div>

            {/* Automatic Processing */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.automatic_processing}
                        onChange={(e) => setConfig({ ...config, automatic_processing: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                        <div className="text-sm font-bold text-slate-900">Enable Automatic Processing</div>
                        <div className="text-xs text-slate-500">
                            Process RSS feeds automatically using Vercel Cron
                        </div>
                    </div>
                </label>
            </div>

            {/* Processing Interval */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Processing Interval (minutes)
                </label>
                <select
                    value={config.processing_interval}
                    onChange={(e) => setConfig({ ...config, processing_interval: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!config.automatic_processing}
                >
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour (recommended)</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Once per day</option>
                </select>
                <p className="text-xs text-slate-500">
                    Configure this in vercel.json cron schedule. This setting is informational only.
                </p>
            </div>

            {/* Auto Publish */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.auto_publish}
                        onChange={(e) => setConfig({ ...config, auto_publish: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                        <div className="text-sm font-bold text-slate-900">Auto-Publish Opportunities</div>
                        <div className="text-xs text-slate-500">
                            Automatically publish opportunities that pass quality threshold (otherwise saved as draft)
                        </div>
                    </div>
                </label>
            </div>

            {/* Quality Threshold */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Quality Threshold: {(config.quality_threshold * 100).toFixed(0)}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.quality_threshold}
                    onChange={(e) => setConfig({ ...config, quality_threshold: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500">
                    <span>0% (Accept all)</span>
                    <span>50%</span>
                    <span>100% (Very strict)</span>
                </div>
                <p className="text-xs text-slate-500">
                    Opportunities with AI confidence score below this threshold will be rejected
                </p>
            </div>

            {/* Max Posts Per Run */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Maximum Posts Per Processing Run
                </label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.max_posts_per_run}
                    onChange={(e) => setConfig({ ...config, max_posts_per_run: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    Limit how many posts can be processed in a single run (prevents API rate limits)
                </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
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
