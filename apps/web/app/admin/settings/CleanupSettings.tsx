'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, Clock, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface CleanupConfig {
    days_after_deadline: number;
    max_age_by_type: {
        contest: number;
        giveaway: number;
        sweepstakes: number;
        dream_job: number;
        get_paid_to: number;
        instant_win: number;
        job_fair: number;
        scholarship: number;
        volunteer: number;
        free_training: number;
        promo: number;
        evergreen: number;
    };
}

interface ExpirationStats {
    expiredCount: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    noDeadlineCount: number;
}

interface CleanupResult {
    success: boolean;
    deleted_count: number;
    deleted_by_type: Record<string, number>;
    skipped_evergreen: number;
    errors: string[];
}

const OPPORTUNITY_TYPES = [
    { key: 'contest', label: 'Contest', description: 'Skill-based competitions' },
    { key: 'giveaway', label: 'Giveaway', description: 'Free product giveaways' },
    { key: 'sweepstakes', label: 'Sweepstakes', description: 'Random prize drawings' },
    { key: 'dream_job', label: 'Dream Job', description: 'Job opportunities' },
    { key: 'get_paid_to', label: 'Get Paid To', description: 'Paid activities' },
    { key: 'instant_win', label: 'Instant Win', description: 'Immediate prize games' },
    { key: 'job_fair', label: 'Job Fair', description: 'Employment events' },
    { key: 'scholarship', label: 'Scholarship', description: 'Educational funding' },
    { key: 'volunteer', label: 'Volunteer', description: 'Volunteer opportunities' },
    { key: 'free_training', label: 'Free Training', description: 'Educational courses' },
    { key: 'promo', label: 'Promo', description: 'Promotional offers' },
    { key: 'evergreen', label: 'Evergreen', description: 'Permanent content' },
] as const;

const DEFAULT_CONFIG: CleanupConfig = {
    days_after_deadline: 7,
    max_age_by_type: {
        contest: 30,
        giveaway: 30,
        sweepstakes: 30,
        dream_job: 60,
        get_paid_to: 45,
        instant_win: 14,
        job_fair: 30,
        scholarship: 90,
        volunteer: 60,
        free_training: 60,
        promo: 14,
        evergreen: -1,
    },
};

export default function CleanupSettings() {
    const [config, setConfig] = useState<CleanupConfig>(DEFAULT_CONFIG);
    const [stats, setStats] = useState<ExpirationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [runningCleanup, setRunningCleanup] = useState(false);
    const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch settings
            const settingsRes = await fetch('/api/admin/settings/cleanup');
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                if (data.settings) {
                    setConfig({
                        days_after_deadline: data.settings.days_after_deadline ?? DEFAULT_CONFIG.days_after_deadline,
                        max_age_by_type: {
                            ...DEFAULT_CONFIG.max_age_by_type,
                            ...data.settings.max_age_by_type,
                        },
                    });
                }
            }

            // Fetch stats
            const statsRes = await fetch('/api/admin/cleanup');
            if (statsRes.ok) {
                const data = await statsRes.json();
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching cleanup data:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Cleanup settings saved successfully!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
        setSaving(false);
    };

    const handleRunCleanup = async () => {
        if (!confirm('Are you sure you want to run cleanup now? This will delete expired opportunities based on current settings.')) {
            return;
        }

        setRunningCleanup(true);
        setMessage(null);
        setLastCleanupResult(null);

        try {
            const res = await fetch('/api/admin/cleanup', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                setLastCleanupResult(data);
                setMessage({
                    type: 'success',
                    text: `Cleanup completed! Deleted ${data.deleted_count} opportunities. Skipped ${data.skipped_evergreen} evergreen items.`,
                });
                // Refresh stats
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.error || 'Cleanup failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to run cleanup' });
        }
        setRunningCleanup(false);
    };

    const handleTypeMaxAgeChange = (type: string, value: number) => {
        setConfig((prev) => ({
            ...prev,
            max_age_by_type: {
                ...prev.max_age_by_type,
                [type]: value,
            },
        }));
    };

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
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : message.type === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                >
                    {message.type === 'success' && <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />}
                    {message.type === 'error' && <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />}
                    {message.type === 'info' && <Info size={20} className="flex-shrink-0 mt-0.5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Expiration Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase">Expired</span>
                        </div>
                        <div className="text-2xl font-black text-red-700">{stats.expiredCount}</div>
                        <div className="text-xs text-red-600">Past deadline</div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Expiring Soon</span>
                        </div>
                        <div className="text-2xl font-black text-amber-700">{stats.expiringIn7Days}</div>
                        <div className="text-xs text-amber-600">Next 7 days</div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase">Expiring</span>
                        </div>
                        <div className="text-2xl font-black text-blue-700">{stats.expiringIn30Days}</div>
                        <div className="text-xs text-blue-600">Next 30 days</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-600 mb-1">
                            <Info size={16} />
                            <span className="text-xs font-bold uppercase">No Deadline</span>
                        </div>
                        <div className="text-2xl font-black text-slate-700">{stats.noDeadlineCount}</div>
                        <div className="text-xs text-slate-600">Age-based cleanup</div>
                    </div>
                </div>
            )}

            {/* Run Cleanup Now */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Run Cleanup Now</h3>
                        <p className="text-xs text-slate-600 mt-1">
                            Manually trigger cleanup of expired opportunities based on current settings
                        </p>
                    </div>
                    <button
                        onClick={handleRunCleanup}
                        disabled={runningCleanup}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {runningCleanup ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} />
                                Run Cleanup
                            </>
                        )}
                    </button>
                </div>

                {/* Last Cleanup Result */}
                {lastCleanupResult && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 mb-2">Last Cleanup Result</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                                <span className="text-slate-500">Deleted:</span>
                                <span className="ml-1 font-bold text-slate-900">{lastCleanupResult.deleted_count}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Skipped Evergreen:</span>
                                <span className="ml-1 font-bold text-slate-900">{lastCleanupResult.skipped_evergreen}</span>
                            </div>
                        </div>
                        {Object.keys(lastCleanupResult.deleted_by_type).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-500">By type: </span>
                                <span className="text-xs text-slate-700">
                                    {Object.entries(lastCleanupResult.deleted_by_type)
                                        .map(([type, count]) => `${type}: ${count}`)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cleanup Settings</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Configure how long opportunities are kept before automatic deletion.
                    Cleanup runs automatically daily at 3:00 AM UTC.
                </p>
            </div>

            {/* Days After Deadline */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Grace Period After Deadline (days)
                </label>
                <input
                    type="number"
                    min="0"
                    max="90"
                    value={config.days_after_deadline}
                    onChange={(e) => setConfig({ ...config, days_after_deadline: Number(e.target.value) })}
                    className="w-full max-w-xs border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    Opportunities with a deadline will be deleted this many days after the deadline passes.
                    Set to 0 to delete immediately after deadline.
                </p>
            </div>

            {/* Max Age by Type */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1">
                        Maximum Age by Opportunity Type (days)
                    </label>
                    <p className="text-xs text-slate-500 mb-4">
                        For opportunities without a deadline, they will be deleted after this many days.
                        Set to <strong>-1</strong> to never delete (for evergreen content).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {OPPORTUNITY_TYPES.map((type) => {
                        const value = config.max_age_by_type[type.key as keyof typeof config.max_age_by_type];
                        const isNeverDelete = value === -1;

                        return (
                            <div
                                key={type.key}
                                className={`border rounded-lg p-3 ${
                                    isNeverDelete
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{type.label}</div>
                                        <div className="text-xs text-slate-500">{type.description}</div>
                                    </div>
                                    {isNeverDelete && (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                            Never Delete
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="-1"
                                        max="365"
                                        value={value}
                                        onChange={(e) => handleTypeMaxAgeChange(type.key, Number(e.target.value))}
                                        className="w-20 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-500">
                                        {isNeverDelete ? 'Never' : 'days'}
                                    </span>
                                    {!isNeverDelete && (
                                        <button
                                            onClick={() => handleTypeMaxAgeChange(type.key, -1)}
                                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Set to never
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
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
                    onClick={fetchData}
                    className="bg-white text-slate-700 px-6 py-2 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Blog posts (in the Posts table) are never affected by cleanup.
                    They are managed separately and are meant to be evergreen SEO content.
                    This cleanup only affects the Opportunities table.
                </div>
            </div>
        </div>
    );
}
