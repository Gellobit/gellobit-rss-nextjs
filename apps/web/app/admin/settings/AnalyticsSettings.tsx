'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, BarChart3, DollarSign, Smartphone } from 'lucide-react';

interface AnalyticsConfig {
    google_analytics_id: string;
    adsense_client_id: string;
    adsense_slot_id: string;
    admob_app_id: string;
    admob_banner_id: string;
}

export default function AnalyticsSettings() {
    const [config, setConfig] = useState<AnalyticsConfig>({
        google_analytics_id: '',
        adsense_client_id: '',
        adsense_slot_id: '',
        admob_app_id: '',
        admob_banner_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/analytics');
            const data = await res.json();
            if (res.ok && data.settings) {
                setConfig(data.settings);
            }
        } catch (error) {
            console.error('Error fetching analytics settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/analytics', {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
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

            {/* Google Analytics Section */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="text-orange-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Google Analytics</h3>
                        <p className="text-xs text-slate-500">Track visitors and behavior across your entire app</p>
                    </div>
                </div>

                <div className="space-y-2 pl-13">
                    <label className="block text-sm font-bold text-slate-700">
                        Measurement ID (GA4)
                    </label>
                    <input
                        type="text"
                        value={config.google_analytics_id}
                        onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-xs text-slate-500">
                        Find this in Google Analytics &gt; Admin &gt; Data Streams &gt; Your stream &gt; Measurement ID
                    </p>
                </div>
            </div>

            {/* Google AdSense Section */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="text-green-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Google AdSense</h3>
                        <p className="text-xs text-slate-500">Display ads on opportunities and blog posts (desktop/web)</p>
                    </div>
                </div>

                <div className="space-y-4 pl-13">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Publisher Client ID
                        </label>
                        <input
                            type="text"
                            value={config.adsense_client_id}
                            onChange={(e) => setConfig({ ...config, adsense_client_id: e.target.value })}
                            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Your AdSense publisher ID starting with "ca-pub-"
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Ad Slot ID
                        </label>
                        <input
                            type="text"
                            value={config.adsense_slot_id}
                            onChange={(e) => setConfig({ ...config, adsense_slot_id: e.target.value })}
                            placeholder="1234567890"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            The ad unit slot ID for display ads
                        </p>
                    </div>
                </div>
            </div>

            {/* AdMob Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Smartphone className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Google AdMob</h3>
                        <p className="text-xs text-slate-500">Display ads on mobile app (iOS/Android) - for PWA use AdSense</p>
                    </div>
                </div>

                <div className="space-y-4 pl-13">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            AdMob App ID
                        </label>
                        <input
                            type="text"
                            value={config.admob_app_id}
                            onChange={(e) => setConfig({ ...config, admob_app_id: e.target.value })}
                            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Your AdMob App ID (required for native mobile apps)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Banner Ad Unit ID
                        </label>
                        <input
                            type="text"
                            value={config.admob_banner_id}
                            onChange={(e) => setConfig({ ...config, admob_banner_id: e.target.value })}
                            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            The banner ad unit ID for mobile display
                        </p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-amber-800">
                        <strong>Note:</strong> AdMob is for native mobile apps. For this PWA (Progressive Web App),
                        ads will use Google AdSense which works on both desktop and mobile browsers.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
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
