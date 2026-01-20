'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Lock, DollarSign, Bell, Eye, Power } from 'lucide-react';

interface MembershipConfig {
    // System toggle
    system_enabled: boolean;

    // Content access
    free_content_percentage: number;
    free_delay_hours: number;
    free_favorites_limit: number;

    // Display
    show_locked_content: boolean;
    locked_content_blur: boolean;

    // Pricing
    monthly_price: number;
    annual_price: number;

    // PayPal
    paypal_enabled: boolean;
    paypal_client_id: string;
    paypal_plan_id_monthly: string;
    paypal_plan_id_annual: string;

    // Stripe (future)
    stripe_enabled: boolean;

    // Notifications
    free_notifications_daily: number;
    free_email_digest: string;
}

const DEFAULT_CONFIG: MembershipConfig = {
    system_enabled: true,
    free_content_percentage: 60,
    free_delay_hours: 24,
    free_favorites_limit: 5,
    show_locked_content: true,
    locked_content_blur: true,
    monthly_price: 4.99,
    annual_price: 39.99,
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_plan_id_monthly: '',
    paypal_plan_id_annual: '',
    stripe_enabled: false,
    free_notifications_daily: 1,
    free_email_digest: 'weekly',
};

export default function MembershipSettings() {
    const [config, setConfig] = useState<MembershipConfig>(DEFAULT_CONFIG);
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
            const res = await fetch('/api/admin/settings/membership');
            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (res.ok && data.settings) {
                setConfig({ ...DEFAULT_CONFIG, ...data.settings });
            }
        } catch (error) {
            console.error('Error fetching membership settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Membership settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
        setSaving(false);
    };

    // Calculate annual savings percentage
    const annualSavings = Math.round((1 - (config.annual_price / (config.monthly_price * 12))) * 100);

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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

            {/* System Toggle Section */}
            <div className={`rounded-xl p-6 border-2 ${config.system_enabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.system_enabled ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <Power size={24} className={config.system_enabled ? 'text-green-600' : 'text-amber-600'} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Membership System</h3>
                            <p className={`text-sm ${config.system_enabled ? 'text-green-700' : 'text-amber-700'}`}>
                                {config.system_enabled
                                    ? 'Active - Free users have limited access, Premium users have full access'
                                    : 'Disabled - All users have full access to all content (ads still show)'
                                }
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.system_enabled}
                            onChange={(e) => setConfig({ ...config, system_enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
                {!config.system_enabled && (
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> When disabled, the pricing page will show a message that all content is free.
                            Ads will continue to display to all users for monetization.
                        </p>
                    </div>
                )}
            </div>

            {/* Content Access Section */}
            <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lock size={20} className="text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Content Access for Free Users</h3>
                </div>

                <div className="space-y-6">
                    {/* Content Percentage */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Visible Content: {config.free_content_percentage}%
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={config.free_content_percentage}
                            onChange={(e) => setConfig({ ...config, free_content_percentage: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>10% (Very restrictive)</span>
                            <span>60% (Recommended)</span>
                            <span>100% (All content)</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Free users see the oldest {config.free_content_percentage}% of opportunities. Newer content requires Premium.
                        </p>
                    </div>

                    {/* Delay Hours */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            New Content Delay
                        </label>
                        <select
                            value={config.free_delay_hours}
                            onChange={(e) => setConfig({ ...config, free_delay_hours: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={0}>No delay (instant access)</option>
                            <option value={6}>6 hours</option>
                            <option value={12}>12 hours</option>
                            <option value={24}>24 hours (Recommended)</option>
                            <option value={48}>48 hours</option>
                            <option value={72}>72 hours (3 days)</option>
                        </select>
                        <p className="text-xs text-slate-500">
                            Free users must wait this long before seeing new opportunities. Premium users see them instantly.
                        </p>
                    </div>

                    {/* Favorites Limit */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Favorites Limit
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.free_favorites_limit}
                            onChange={(e) => setConfig({ ...config, free_favorites_limit: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-slate-500">
                            Maximum number of favorites for free users. Premium users have unlimited favorites.
                        </p>
                    </div>
                </div>
            </div>

            {/* Display Options Section */}
            <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Eye size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Locked Content Display</h3>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.show_locked_content}
                            onChange={(e) => setConfig({ ...config, show_locked_content: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                            <div className="text-sm font-bold text-slate-900">Show Locked Content with Padlock</div>
                            <div className="text-xs text-slate-500">
                                Display premium-only opportunities with a lock icon to generate FOMO
                            </div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.locked_content_blur}
                            onChange={(e) => setConfig({ ...config, locked_content_blur: e.target.checked })}
                            disabled={!config.show_locked_content}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div>
                            <div className="text-sm font-bold text-slate-900">Blur Locked Content</div>
                            <div className="text-xs text-slate-500">
                                Blur the title and excerpt of locked opportunities
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-slate-900">Pricing</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Monthly Price (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                min="0.99"
                                step="0.01"
                                value={config.monthly_price}
                                onChange={(e) => setConfig({ ...config, monthly_price: Number(e.target.value) })}
                                className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Annual Price (USD)
                            {annualSavings > 0 && (
                                <span className="ml-2 text-green-600 text-xs font-normal">
                                    ({annualSavings}% savings)
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                min="0.99"
                                step="0.01"
                                value={config.annual_price}
                                onChange={(e) => setConfig({ ...config, annual_price: Number(e.target.value) })}
                                className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Equivalent to ${(config.annual_price / 12).toFixed(2)}/month
                        </p>
                    </div>
                </div>
            </div>

            {/* PayPal Section */}
            <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#003087">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                        </svg>
                        <h3 className="text-lg font-bold text-slate-900">PayPal Integration</h3>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.paypal_enabled}
                            onChange={(e) => setConfig({ ...config, paypal_enabled: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-700">Enable</span>
                    </label>
                </div>

                {config.paypal_enabled && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-900">
                                PayPal Client ID
                            </label>
                            <input
                                type="text"
                                value={config.paypal_client_id}
                                onChange={(e) => setConfig({ ...config, paypal_client_id: e.target.value })}
                                placeholder="AeC..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900">
                                    Monthly Plan ID
                                </label>
                                <input
                                    type="text"
                                    value={config.paypal_plan_id_monthly}
                                    onChange={(e) => setConfig({ ...config, paypal_plan_id_monthly: e.target.value })}
                                    placeholder="P-..."
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900">
                                    Annual Plan ID
                                </label>
                                <input
                                    type="text"
                                    value={config.paypal_plan_id_annual}
                                    onChange={(e) => setConfig({ ...config, paypal_plan_id_annual: e.target.value })}
                                    placeholder="P-..."
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            Create subscription plans in your PayPal Developer Dashboard and paste the Plan IDs here.
                        </p>
                    </div>
                )}
            </div>

            {/* Notifications Section */}
            <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={20} className="text-orange-600" />
                    <h3 className="text-lg font-bold text-slate-900">Free User Notifications</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Daily Push Notifications Limit
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={config.free_notifications_daily}
                            onChange={(e) => setConfig({ ...config, free_notifications_daily: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-slate-500">
                            Maximum daily notifications for free users. Premium users receive unlimited instant alerts.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">
                            Email Digest Frequency
                        </label>
                        <select
                            value={config.free_email_digest}
                            onChange={(e) => setConfig({ ...config, free_email_digest: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="none">No digest</option>
                            <option value="daily">Daily digest</option>
                            <option value="weekly">Weekly digest (Recommended)</option>
                        </select>
                        <p className="text-xs text-slate-500">
                            How often free users receive email summaries. Premium users can choose their preference.
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Membership Settings
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
