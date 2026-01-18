'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, BarChart3, DollarSign, Smartphone, Image } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface AnalyticsConfig {
    google_analytics_id: string;
    // AdSense settings for web
    adsense_client_id: string;
    adsense_slot_id: string; // Default/fallback slot
    adsense_slot_sticky: string;
    adsense_slot_sidebar: string;
    adsense_slot_below_title: string;
    adsense_slot_in_content: string;
    adsense_slot_end_of_post: string;
    adsense_slot_after_cta: string;
    // AdMob settings for native mobile app
    admob_app_id: string;
    admob_banner_id: string;
    admob_interstitial_id: string;
    admob_sticky_id: string;
    admob_in_content_id: string;
    // Manual banner
    manual_banner_image_url: string;
    manual_banner_target_url: string;
    manual_banner_enabled: boolean;
}

export default function AnalyticsSettings() {
    const [config, setConfig] = useState<AnalyticsConfig>({
        google_analytics_id: '',
        // AdSense
        adsense_client_id: '',
        adsense_slot_id: '',
        adsense_slot_sticky: '',
        adsense_slot_sidebar: '',
        adsense_slot_below_title: '',
        adsense_slot_in_content: '',
        adsense_slot_end_of_post: '',
        adsense_slot_after_cta: '',
        // AdMob
        admob_app_id: '',
        admob_banner_id: '',
        admob_interstitial_id: '',
        admob_sticky_id: '',
        admob_in_content_id: '',
        // Manual banner
        manual_banner_image_url: '',
        manual_banner_target_url: '',
        manual_banner_enabled: false,
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
            const res = await fetch('/api/admin/settings/analytics');
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
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Your AdSense publisher ID starting with "ca-pub-"
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Default Slot ID (Fallback)
                        </label>
                        <input
                            type="text"
                            value={config.adsense_slot_id}
                            onChange={(e) => setConfig({ ...config, adsense_slot_id: e.target.value })}
                            placeholder="1234567890"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Used when a position-specific slot is not configured
                        </p>
                    </div>

                    {/* Position-specific Ad Slots */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">Ad Slots by Position</h4>
                        <p className="text-xs text-slate-500 mb-4">
                            Configure different ad units for each position. Create separate ad units in AdSense for better tracking.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Sticky Anchor (Mobile)
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_sticky}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_sticky: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">320x50 banner at bottom</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Sidebar (Desktop)
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_sidebar}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_sidebar: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">300x600 skyscraper</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Below Title
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_below_title}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_below_title: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">300x250 rectangle</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    In-Content
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_in_content}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_in_content: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">Native/horizontal ad</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    End of Post
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_end_of_post}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_end_of_post: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">Horizontal banner</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    After CTA
                                </label>
                                <input
                                    type="text"
                                    value={config.adsense_slot_after_cta}
                                    onChange={(e) => setConfig({ ...config, adsense_slot_after_cta: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                />
                                <p className="text-xs text-slate-400">High CTR position</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-green-800">
                        <strong>Tip:</strong> Create separate ad units in your AdSense account for each position.
                        This allows you to track performance and optimize each placement independently.
                    </p>
                </div>
            </div>

            {/* AdMob Section */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Smartphone className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Google AdMob</h3>
                        <p className="text-xs text-slate-500">Display ads on native mobile app (Capacitor/iOS/Android)</p>
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
                            Standard banner ad (320x50) - used for in-content ads
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Sticky Banner Ad Unit ID
                        </label>
                        <input
                            type="text"
                            value={config.admob_sticky_id}
                            onChange={(e) => setConfig({ ...config, admob_sticky_id: e.target.value })}
                            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            For sticky anchor banner at bottom of screen
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            In-Content Ad Unit ID
                        </label>
                        <input
                            type="text"
                            value={config.admob_in_content_id}
                            onChange={(e) => setConfig({ ...config, admob_in_content_id: e.target.value })}
                            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            For ads placed within opportunity/post content
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Interstitial Ad Unit ID
                        </label>
                        <input
                            type="text"
                            value={config.admob_interstitial_id}
                            onChange={(e) => setConfig({ ...config, admob_interstitial_id: e.target.value })}
                            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Full-screen interstitial ad shown on external link clicks
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                        <strong>Platform Detection:</strong> The app automatically detects the platform.
                        AdSense is used for web browsers (desktop & mobile PWA), while AdMob is used for
                        native Capacitor apps (Android/iOS).
                    </p>
                </div>
            </div>

            {/* Manual Banner Section */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Image className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Manual Banner Ad</h3>
                        <p className="text-xs text-slate-500">Display a custom banner image instead of AdSense (useful for testing or sponsors)</p>
                    </div>
                </div>

                <div className="space-y-4 pl-13">
                    {/* Enable Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, manual_banner_enabled: !config.manual_banner_enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                config.manual_banner_enabled ? 'bg-purple-600' : 'bg-slate-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    config.manual_banner_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <label className="text-sm font-bold text-slate-700">
                            Enable Manual Banner (overrides AdSense)
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Banner Image
                        </label>
                        <ImageUpload
                            value={config.manual_banner_image_url}
                            onChange={(url) => setConfig({ ...config, manual_banner_image_url: url })}
                            folder="banners"
                            entityType="setting"
                            placeholder="Upload banner image or paste URL"
                        />
                        <p className="text-xs text-slate-500">
                            Recommended size: 728x90 (horizontal) or 300x250 (rectangle)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Target URL (click destination)
                        </label>
                        <input
                            type="text"
                            value={config.manual_banner_target_url}
                            onChange={(e) => setConfig({ ...config, manual_banner_target_url: e.target.value })}
                            placeholder="https://sponsor.com/offer"
                            className="w-full max-w-lg border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-slate-500">
                            Where users will be redirected when they click the banner
                        </p>
                    </div>

                    {/* Preview */}
                    {config.manual_banner_image_url && (
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Preview</label>
                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-w-lg">
                                <img
                                    src={config.manual_banner_image_url}
                                    alt="Banner preview"
                                    className="max-w-full h-auto rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-purple-800">
                        <strong>Tip:</strong> When enabled, the manual banner will be displayed to all free users
                        instead of AdSense. Premium and Lifetime members will not see any ads.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
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
