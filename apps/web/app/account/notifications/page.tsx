'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Monitor, Save, RefreshCw } from 'lucide-react';

interface NotificationSettings {
    email_new_opportunities: boolean;
    email_favorites_expiring: boolean;
    email_weekly_digest: boolean;
    email_membership_updates: boolean;
    push_enabled: boolean;
    push_new_opportunities: boolean;
    push_favorites_expiring: boolean;
    app_new_opportunities: boolean;
    app_favorites_expiring: boolean;
    opportunity_types: string[];
    min_prize_value: number | null;
}

const opportunityTypes = [
    { value: 'giveaway', label: 'Giveaways' },
    { value: 'contest', label: 'Contests' },
    { value: 'sweepstakes', label: 'Sweepstakes' },
    { value: 'dream_job', label: 'Dream Jobs' },
    { value: 'get_paid_to', label: 'Get Paid To' },
    { value: 'instant_win', label: 'Instant Wins' },
    { value: 'job_fair', label: 'Job Fairs' },
    { value: 'scholarship', label: 'Scholarships' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'free_training', label: 'Free Training' },
    { value: 'promo', label: 'Promos' },
];

export default function NotificationsPage() {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/user/notifications');
            const data = await res.json();

            if (res.ok) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Notification settings saved!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }

        setSaving(false);
    };

    const handleToggle = (key: keyof NotificationSettings) => {
        if (!settings) return;
        setSettings(prev => prev ? { ...prev, [key]: !prev[key] } : null);
    };

    const handleTypeToggle = (type: string) => {
        if (!settings) return;
        const currentTypes = settings.opportunity_types || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        setSettings(prev => prev ? { ...prev, opportunity_types: newTypes } : null);
    };

    const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
        <button
            onClick={onChange}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-colors ${
                checked ? 'bg-green-500' : 'bg-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    checked ? 'left-7' : 'left-1'
                }`}
            />
        </button>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="text-center py-12 text-slate-500">
                Failed to load notification settings
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage how you receive updates</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Email Notifications */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Mail className="text-slate-500" size={20} />
                    <h2 className="font-bold text-lg">Email Notifications</h2>
                </div>

                <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">New Opportunities</p>
                            <p className="text-sm text-slate-500">Get notified when new opportunities match your interests</p>
                        </div>
                        <Toggle
                            checked={settings.email_new_opportunities}
                            onChange={() => handleToggle('email_new_opportunities')}
                        />
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Favorites Expiring</p>
                            <p className="text-sm text-slate-500">Reminder when your saved opportunities are about to expire</p>
                        </div>
                        <Toggle
                            checked={settings.email_favorites_expiring}
                            onChange={() => handleToggle('email_favorites_expiring')}
                        />
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Weekly Digest</p>
                            <p className="text-sm text-slate-500">Summary of the best opportunities every week</p>
                        </div>
                        <Toggle
                            checked={settings.email_weekly_digest}
                            onChange={() => handleToggle('email_weekly_digest')}
                        />
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Membership Updates</p>
                            <p className="text-sm text-slate-500">Information about your subscription and billing</p>
                        </div>
                        <Toggle
                            checked={settings.email_membership_updates}
                            onChange={() => handleToggle('email_membership_updates')}
                        />
                    </div>
                </div>
            </div>

            {/* Push Notifications (for future mobile app) */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Smartphone className="text-slate-500" size={20} />
                        <h2 className="font-bold text-lg">Push Notifications</h2>
                    </div>
                    <Toggle
                        checked={settings.push_enabled}
                        onChange={() => handleToggle('push_enabled')}
                    />
                </div>

                <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">New Opportunities</p>
                            <p className="text-sm text-slate-500">Push notifications for new opportunities</p>
                        </div>
                        <Toggle
                            checked={settings.push_new_opportunities}
                            onChange={() => handleToggle('push_new_opportunities')}
                            disabled={!settings.push_enabled}
                        />
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Favorites Expiring</p>
                            <p className="text-sm text-slate-500">Push alerts for expiring favorites</p>
                        </div>
                        <Toggle
                            checked={settings.push_favorites_expiring}
                            onChange={() => handleToggle('push_favorites_expiring')}
                            disabled={!settings.push_enabled}
                        />
                    </div>
                </div>
            </div>

            {/* In-App Notifications */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Monitor className="text-slate-500" size={20} />
                    <h2 className="font-bold text-lg">In-App Notifications</h2>
                </div>

                <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">New Opportunities</p>
                            <p className="text-sm text-slate-500">Show notifications in the app</p>
                        </div>
                        <Toggle
                            checked={settings.app_new_opportunities}
                            onChange={() => handleToggle('app_new_opportunities')}
                        />
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">Favorites Expiring</p>
                            <p className="text-sm text-slate-500">In-app alerts for expiring favorites</p>
                        </div>
                        <Toggle
                            checked={settings.app_favorites_expiring}
                            onChange={() => handleToggle('app_favorites_expiring')}
                        />
                    </div>
                </div>
            </div>

            {/* Opportunity Type Preferences */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-bold text-lg">Notification Preferences</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Choose which types of opportunities you want to be notified about.
                        Leave all unchecked to receive notifications for all types.
                    </p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {opportunityTypes.map((type) => {
                            const isSelected = settings.opportunity_types?.includes(type.value);
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => handleTypeToggle(type.value)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        {settings.opportunity_types?.length === 0
                            ? 'Receiving notifications for all opportunity types'
                            : `Receiving notifications for ${settings.opportunity_types?.length} type(s)`}
                    </p>
                </div>
            </div>
        </div>
    );
}
