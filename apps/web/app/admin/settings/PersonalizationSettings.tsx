'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface PersonalizationConfig {
    app_logo_url: string | null;
    app_name: string;
}

export default function PersonalizationSettings() {
    const [config, setConfig] = useState<PersonalizationConfig>({
        app_logo_url: null,
        app_name: 'GelloBit',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/personalization');
            const data = await res.json();
            if (res.ok && data.settings) {
                setConfig(data.settings);
                setPreviewUrl(data.settings.app_logo_url);
            }
        } catch (error) {
            console.error('Error fetching personalization settings:', error);
        }
        setLoading(false);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 2MB' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Upload to API
            const res = await fetch('/api/admin/upload/logo', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setConfig({ ...config, app_logo_url: data.url });
                setPreviewUrl(data.url);
                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to upload logo' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload logo' });
        }

        setUploading(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveLogo = () => {
        setConfig({ ...config, app_logo_url: null });
        setPreviewUrl(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings/personalization', {
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

            {/* App Logo */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-900">
                    App Logo
                </label>
                <p className="text-xs text-slate-500">
                    Upload your app logo. It will appear in the header navigation. Recommended size: 200x50px. Max 2MB.
                </p>

                {/* Logo Preview */}
                <div className="flex items-start gap-6">
                    <div className="w-48 h-16 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="App Logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="text-center">
                                <ImageIcon size={24} className="mx-auto text-slate-400" />
                                <span className="text-xs text-slate-400 mt-1">No logo</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Upload Logo
                                </>
                            )}
                        </button>

                        {/* Remove button */}
                        {previewUrl && (
                            <button
                                onClick={handleRemoveLogo}
                                className="text-red-600 px-4 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={16} />
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* App Name */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    App Name
                </label>
                <input
                    type="text"
                    value={config.app_name}
                    onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                    placeholder="GelloBit"
                    className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                    The name displayed in the header when no logo is set
                </p>
            </div>

            {/* Preview */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
                <label className="block text-sm font-bold text-slate-900">
                    Header Preview
                </label>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Logo Preview"
                                className="h-10 object-contain"
                            />
                        ) : (
                            <>
                                <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                                <span className="font-black text-2xl tracking-tighter text-[#1a1a1a]">
                                    {config.app_name || 'GelloBit'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
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
