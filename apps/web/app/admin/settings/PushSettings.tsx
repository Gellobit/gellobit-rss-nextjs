'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Bell, Key, Send, Copy, Check } from 'lucide-react';

interface PushConfig {
    vapid_public_key: string;
    vapid_private_key: string;
    vapid_subject: string;
    is_configured: boolean;
}

export default function PushSettings() {
    const [config, setConfig] = useState<PushConfig>({
        vapid_public_key: '',
        vapid_private_key: '',
        vapid_subject: '',
        is_configured: false,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [testing, setTesting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/settings/push');
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
            console.error('Error fetching push settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Push settings saved successfully!' });
                fetchSettings(); // Refresh to get updated is_configured status
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
        setSaving(false);
    };

    const handleGenerateKeys = async () => {
        setGenerating(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generate_keys: true }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'VAPID keys generated and saved!' });
                fetchSettings(); // Refresh to get new keys
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to generate keys' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to generate keys' });
        }
        setGenerating(false);
    };

    const handleSendTest = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/push/test', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Test notification sent! (${data.sent} delivered)` });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send test notification' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test notification' });
        }
        setTesting(false);
    };

    const copyPublicKey = async () => {
        if (config.vapid_public_key) {
            await navigator.clipboard.writeText(config.vapid_public_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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

            {/* VAPID Keys Configuration */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Key className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">VAPID Keys</h3>
                        <p className="text-xs text-slate-500">Required for Web Push notifications</p>
                    </div>
                </div>

                <div className="space-y-4 pl-13">
                    {/* Generate Keys Button */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900">
                                    {config.is_configured ? 'VAPID Keys Configured' : 'No VAPID Keys'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {config.is_configured
                                        ? 'Keys are configured. Generate new keys only if needed.'
                                        : 'Generate VAPID keys to enable push notifications'}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerateKeys}
                                disabled={generating}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Key size={16} />
                                        {config.is_configured ? 'Regenerate Keys' : 'Generate Keys'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Public Key (read-only, for reference) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Public Key
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={config.vapid_public_key}
                                readOnly
                                placeholder="Generated automatically"
                                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50 font-mono text-xs"
                            />
                            <button
                                onClick={copyPublicKey}
                                disabled={!config.vapid_public_key}
                                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Copy public key"
                            >
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            This key is used by browsers to subscribe to push notifications
                        </p>
                    </div>

                    {/* Private Key (masked) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Private Key
                        </label>
                        <input
                            type="password"
                            value={config.vapid_private_key}
                            onChange={(e) => setConfig({ ...config, vapid_private_key: e.target.value })}
                            placeholder="Enter manually or generate"
                            className="w-full max-w-lg border border-slate-300 rounded-lg px-4 py-2 text-sm font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Keep this secret. Used to sign push messages.
                        </p>
                    </div>

                    {/* Subject (contact email/URL) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Subject (Contact)
                        </label>
                        <input
                            type="text"
                            value={config.vapid_subject}
                            onChange={(e) => setConfig({ ...config, vapid_subject: e.target.value })}
                            placeholder="mailto:hello@yourdomain.com"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm"
                        />
                        <p className="text-xs text-slate-500">
                            Contact email (mailto:) or URL. Required by push services.
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Push Notification */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Bell className="text-green-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Test Push Notifications</h3>
                        <p className="text-xs text-slate-500">Send a test notification to your devices</p>
                    </div>
                </div>

                <div className="pl-13">
                    <button
                        onClick={handleSendTest}
                        disabled={testing || !config.is_configured}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testing ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Send Test Notification
                            </>
                        )}
                    </button>

                    {!config.is_configured && (
                        <p className="text-xs text-amber-600 mt-2">
                            Generate VAPID keys first to enable push notifications
                        </p>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                        Make sure you have enabled push notifications in your browser and subscribed on the notifications page.
                    </p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">How Push Notifications Work</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>1. Generate VAPID keys above (one-time setup)</li>
                    <li>2. Users enable push notifications on the Notifications page</li>
                    <li>3. System sends push notifications for new opportunities and expiring favorites</li>
                    <li>4. Works on Chrome, Firefox, Edge, and Safari (macOS Ventura+)</li>
                </ul>
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
