'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';

interface AdvancedConfig {
    log_retention_days: number;
    debug_mode: boolean;
}

export default function AdvancedSettings() {
    const [config, setConfig] = useState<AdvancedConfig>({
        log_retention_days: 30,
        debug_mode: false,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/settings/advanced');
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
            console.error('Error fetching advanced settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/advanced', {
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

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear all processing logs? This cannot be undone.')) {
            return;
        }

        setClearing(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/clear-logs', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Cleared ${data.deleted} log entries` });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to clear logs' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to clear logs' });
        }
        setClearing(false);
    };

    const handleExportSettings = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/admin/settings/export');
            const data = await res.json();

            if (res.ok) {
                // Download as JSON file
                const blob = new Blob([JSON.stringify(data.settings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gellobit-settings-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setMessage({ type: 'success', text: 'Settings exported successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to export settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to export settings' });
        }
        setExporting(false);
    };

    const handleImportSettings = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const settings = JSON.parse(text);

                const res = await fetch('/api/admin/settings/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings }),
                });

                if (res.ok) {
                    setMessage({ type: 'success', text: 'Settings imported successfully! Refreshing...' });
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    setMessage({ type: 'error', text: 'Failed to import settings' });
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Invalid settings file' });
            }
        };
        input.click();
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

            {/* Log Retention */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Processing Log Retention (days)
                </label>
                <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.log_retention_days}
                    onChange={(e) => setConfig({ ...config, log_retention_days: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    Automatically delete processing logs older than this many days (default: 30)
                </p>
            </div>

            {/* Debug Mode */}
            <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.debug_mode}
                        onChange={(e) => setConfig({ ...config, debug_mode: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                        <div className="text-sm font-bold text-slate-900">Enable Debug Mode</div>
                        <div className="text-xs text-slate-500">
                            Log detailed information about processing steps (increases log volume)
                        </div>
                    </div>
                </label>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
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

            {/* Divider */}
            <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Data Management</h3>
            </div>

            {/* Export/Import Settings */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Backup & Restore</h4>
                    <p className="text-xs text-slate-600 mb-3">
                        Export all settings to a JSON file for backup, or import from a previous backup
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportSettings}
                            disabled={exporting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {exporting ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    Export Settings
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleImportSettings}
                            className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-2"
                        >
                            <Upload size={14} />
                            Import Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear Processing Logs */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <div className="flex gap-3">
                    <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900 mb-2">Danger Zone</h4>
                        <p className="text-xs text-red-800 mb-3">
                            Clear all processing logs from the database. This action cannot be undone.
                        </p>
                        <button
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {clearing ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={14} />
                                    Clear All Logs
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
