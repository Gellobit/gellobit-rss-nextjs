'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Mail, Send, TestTube } from 'lucide-react';

interface EmailConfig {
    resend_api_key: string;
    from_email: string;
    from_name: string;
    reply_to: string;
}

export default function EmailSettings() {
    const [config, setConfig] = useState<EmailConfig>({
        resend_api_key: '',
        from_email: '',
        from_name: '',
        reply_to: '',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/settings/email');
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
            console.error('Error fetching email settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Email settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
        setSaving(false);
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Please enter a test email address' });
            return;
        }

        setTesting(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Test email sent to ${testEmail}!` });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send test email' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test email' });
        }
        setTesting(false);
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

            {/* Resend Configuration */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Email Provider (Resend)</h3>
                        <p className="text-xs text-slate-500">Configure Resend API for sending transactional emails</p>
                    </div>
                </div>

                <div className="space-y-4 pl-13">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Resend API Key
                        </label>
                        <input
                            type="password"
                            value={config.resend_api_key}
                            onChange={(e) => setConfig({ ...config, resend_api_key: e.target.value })}
                            placeholder="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            className="w-full max-w-lg border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <p className="text-xs text-slate-500">
                            Get your API key from{' '}
                            <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Resend Dashboard
                            </a>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            From Email Address
                        </label>
                        <input
                            type="email"
                            value={config.from_email}
                            onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                            placeholder="noreply@yourdomain.com"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                            Must be a verified domain in Resend. Default: noreply@gellobit.com
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            From Name
                        </label>
                        <input
                            type="text"
                            value={config.from_name}
                            onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                            placeholder="Gellobit"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                            The name that appears in the "From" field of emails
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Reply-To Email (optional)
                        </label>
                        <input
                            type="email"
                            value={config.reply_to}
                            onChange={(e) => setConfig({ ...config, reply_to: e.target.value })}
                            placeholder="support@yourdomain.com"
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                            Where replies to emails will be sent
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Email */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <TestTube className="text-green-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Test Email Configuration</h3>
                        <p className="text-xs text-slate-500">Send a test email to verify your configuration works</p>
                    </div>
                </div>

                <div className="flex items-end gap-3 pl-13">
                    <div className="flex-1 max-w-md space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Test Email Address
                        </label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button
                        onClick={handleSendTestEmail}
                        disabled={testing || !config.resend_api_key}
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
                                Send Test
                            </>
                        )}
                    </button>
                </div>

                {!config.resend_api_key && (
                    <p className="text-xs text-amber-600 pl-13">
                        Save your API key first before sending a test email
                    </p>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2">Email Types Supported</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>New Opportunity Alerts:</strong> Sent when new opportunities match user preferences</li>
                    <li>• <strong>Weekly Digest:</strong> Summary of opportunities sent every Monday at 9am ET</li>
                    <li>• <strong>Favorite Expiring:</strong> Reminders when saved opportunities are about to expire</li>
                    <li>• <strong>Membership Updates:</strong> Subscription and billing notifications</li>
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
