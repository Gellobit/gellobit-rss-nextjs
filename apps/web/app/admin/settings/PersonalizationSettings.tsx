'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Upload, Trash2, Image as ImageIcon, Plus, GripVertical, X, Sun, Moon, Smartphone, Type, Link2 } from 'lucide-react';

interface ExploreLink {
    id: string;
    label: string;
    url: string;
}

interface SocialLink {
    platform: string;
    url: string;
}

interface PersonalizationConfig {
    // Branding
    app_logo_url: string | null;
    app_logo_footer_url: string | null;
    app_name: string;
    // Homepage Content
    hero_badge_text: string;
    hero_title: string;
    hero_title_highlight: string;
    hero_subtitle: string;
    hero_cta_primary: string;
    hero_cta_secondary: string;
    hero_background_color: string;
    // App Download Section
    app_section_title: string;
    app_section_subtitle: string;
    app_playstore_url: string;
    app_appstore_url: string;
    app_mockup_image_url: string | null;
    // Footer
    footer_tagline: string;
    footer_explore_links: ExploreLink[];
    footer_info_page_ids: string[];
    footer_social_links: SocialLink[];
    footer_bottom_left: string;
    footer_bottom_right: string;
}

interface Page {
    id: string;
    title: string;
    slug: string;
}

const SOCIAL_PLATFORMS = [
    { id: 'facebook', label: 'Facebook', icon: 'F' },
    { id: 'instagram', label: 'Instagram', icon: 'I' },
    { id: 'twitter', label: 'Twitter/X', icon: 'X' },
    { id: 'tiktok', label: 'TikTok', icon: 'T' },
    { id: 'youtube', label: 'YouTube', icon: 'Y' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'L' },
    { id: 'threads', label: 'Threads', icon: '@' },
    { id: 'website', label: 'Website', icon: 'W' },
];

const DEFAULT_CONFIG: PersonalizationConfig = {
    app_logo_url: null,
    app_logo_footer_url: null,
    app_name: 'GelloBit',
    hero_badge_text: 'New Platform 2.0 Available!',
    hero_title: 'Verified USA Opportunities',
    hero_title_highlight: 'just a click away.',
    hero_subtitle: 'Gellobit connects you with real giveaways, job fairs, and scholarships. No scams, just value verified daily by experts.',
    hero_cta_primary: 'Explore Feed Now',
    hero_cta_secondary: 'View Pro Plan',
    hero_background_color: '#ffffff',
    app_section_title: 'Carry opportunities in your pocket.',
    app_section_subtitle: 'Download the mobile App and never miss a job fair or verified giveaway by not being at your PC.',
    app_playstore_url: '',
    app_appstore_url: '',
    app_mockup_image_url: null,
    footer_tagline: 'Empowering the USA community through verified opportunities and valuable content since 2025.',
    footer_explore_links: [],
    footer_info_page_ids: [],
    footer_social_links: [],
    footer_bottom_left: '© 2026 Gellobit.com. All rights reserved.',
    footer_bottom_right: 'Developed with ❤️ for USA',
};

export default function PersonalizationSettings() {
    const [config, setConfig] = useState<PersonalizationConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingHeader, setUploadingHeader] = useState(false);
    const [uploadingFooter, setUploadingFooter] = useState(false);
    const [uploadingMockup, setUploadingMockup] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFooterUrl, setPreviewFooterUrl] = useState<string | null>(null);
    const [previewMockupUrl, setPreviewMockupUrl] = useState<string | null>(null);
    const [availablePages, setAvailablePages] = useState<Page[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const footerFileInputRef = useRef<HTMLInputElement>(null);
    const mockupFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
        fetchPages();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const res = await fetch('/api/admin/settings/personalization');
            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (res.ok && data.settings) {
                // Filter out null values so defaults aren't overwritten
                const filteredSettings: Record<string, any> = {};
                Object.entries(data.settings).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        filteredSettings[key] = value;
                    }
                });

                setConfig({
                    ...DEFAULT_CONFIG,
                    ...filteredSettings,
                    footer_explore_links: data.settings.footer_explore_links || [],
                    footer_info_page_ids: data.settings.footer_info_page_ids || [],
                    footer_social_links: data.settings.footer_social_links || [],
                });
                setPreviewUrl(data.settings.app_logo_url);
                setPreviewFooterUrl(data.settings.app_logo_footer_url);
                setPreviewMockupUrl(data.settings.app_mockup_image_url);
            }
        } catch (error) {
            console.error('Error fetching personalization settings:', error);
        }
        setLoading(false);
    };

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/admin/pages');
            const data = await res.json();
            if (res.ok) {
                setAvailablePages(data.pages || []);
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer' | 'mockup') => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 5MB' });
            return;
        }

        if (type === 'header') setUploadingHeader(true);
        else if (type === 'footer') setUploadingFooter(true);
        else setUploadingMockup(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload/logo', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                if (type === 'header') {
                    setConfig({ ...config, app_logo_url: data.url });
                    setPreviewUrl(data.url);
                } else if (type === 'footer') {
                    setConfig({ ...config, app_logo_footer_url: data.url });
                    setPreviewFooterUrl(data.url);
                } else {
                    setConfig({ ...config, app_mockup_image_url: data.url });
                    setPreviewMockupUrl(data.url);
                }
                setMessage({ type: 'success', text: 'Image uploaded successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to upload image' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload image' });
        }

        if (type === 'header') {
            setUploadingHeader(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else if (type === 'footer') {
            setUploadingFooter(false);
            if (footerFileInputRef.current) footerFileInputRef.current.value = '';
        } else {
            setUploadingMockup(false);
            if (mockupFileInputRef.current) mockupFileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (type: 'header' | 'footer' | 'mockup') => {
        if (type === 'header') {
            setConfig({ ...config, app_logo_url: null });
            setPreviewUrl(null);
        } else if (type === 'footer') {
            setConfig({ ...config, app_logo_footer_url: null });
            setPreviewFooterUrl(null);
        } else {
            setConfig({ ...config, app_mockup_image_url: null });
            setPreviewMockupUrl(null);
        }
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

    // Explore Links Management
    const addExploreLink = () => {
        const newLink: ExploreLink = {
            id: crypto.randomUUID(),
            label: '',
            url: '',
        };
        setConfig({ ...config, footer_explore_links: [...config.footer_explore_links, newLink] });
    };

    const updateExploreLink = (id: string, field: 'label' | 'url', value: string) => {
        setConfig({
            ...config,
            footer_explore_links: config.footer_explore_links.map(link =>
                link.id === id ? { ...link, [field]: value } : link
            ),
        });
    };

    const removeExploreLink = (id: string) => {
        setConfig({
            ...config,
            footer_explore_links: config.footer_explore_links.filter(link => link.id !== id),
        });
    };

    // Social Links Management
    const addSocialLink = (platform: string) => {
        if (config.footer_social_links.some(s => s.platform === platform)) return;
        setConfig({
            ...config,
            footer_social_links: [...config.footer_social_links, { platform, url: '' }],
        });
    };

    const updateSocialLink = (platform: string, url: string) => {
        setConfig({
            ...config,
            footer_social_links: config.footer_social_links.map(link =>
                link.platform === platform ? { ...link, url } : link
            ),
        });
    };

    const removeSocialLink = (platform: string) => {
        setConfig({
            ...config,
            footer_social_links: config.footer_social_links.filter(link => link.platform !== platform),
        });
    };

    // Pages Selection
    const togglePageSelection = (pageId: string) => {
        if (config.footer_info_page_ids.includes(pageId)) {
            setConfig({
                ...config,
                footer_info_page_ids: config.footer_info_page_ids.filter(id => id !== pageId),
            });
        } else {
            setConfig({
                ...config,
                footer_info_page_ids: [...config.footer_info_page_ids, pageId],
            });
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

            {/* ===================== BRANDING SECTION ===================== */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
                    Branding
                </h3>

                {/* Logos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Header Logo */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sun size={18} className="text-yellow-500" />
                            <label className="block text-sm font-bold text-slate-900">Header Logo (Dark)</label>
                        </div>
                        <p className="text-xs text-slate-500">For light backgrounds. Upload a dark-colored logo.</p>

                        <div className="flex items-start gap-4">
                            <div className="w-40 h-14 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Header Logo" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon size={20} className="mx-auto text-slate-400" />
                                        <span className="text-[10px] text-slate-400">No logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'header')} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingHeader} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-xs">
                                    {uploadingHeader ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                    Upload
                                </button>
                                {previewUrl && (
                                    <button onClick={() => handleRemoveImage('header')} className="text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2 text-xs">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Logo */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Moon size={18} className="text-slate-600" />
                            <label className="block text-sm font-bold text-slate-900">Footer Logo (Light)</label>
                        </div>
                        <p className="text-xs text-slate-500">For dark backgrounds. Upload a light/white logo.</p>

                        <div className="flex items-start gap-4">
                            <div className="w-40 h-14 bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                                {previewFooterUrl ? (
                                    <img src={previewFooterUrl} alt="Footer Logo" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon size={20} className="mx-auto text-slate-500" />
                                        <span className="text-[10px] text-slate-500">No logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input ref={footerFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'footer')} className="hidden" />
                                <button onClick={() => footerFileInputRef.current?.click()} disabled={uploadingFooter} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-xs">
                                    {uploadingFooter ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                    Upload
                                </button>
                                {previewFooterUrl && (
                                    <button onClick={() => handleRemoveImage('footer')} className="text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2 text-xs">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* App Name */}
                <div className="space-y-2 pt-4 border-t border-slate-200">
                    <label className="block text-sm font-bold text-slate-900">App Name</label>
                    <input
                        type="text"
                        value={config.app_name}
                        onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                        placeholder="GelloBit"
                        className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">Displayed when no logo is set</p>
                </div>
            </div>

            {/* ===================== HOMEPAGE CONTENT SECTION ===================== */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Type size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Homepage Content</h3>
                </div>

                {/* Hero Badge */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Hero Badge Text</label>
                    <input
                        type="text"
                        value={config.hero_badge_text}
                        onChange={(e) => setConfig({ ...config, hero_badge_text: e.target.value })}
                        placeholder="New Platform 2.0 Available!"
                        className="w-full max-w-lg border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">Small badge shown above the main title</p>
                </div>

                {/* Hero Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Hero Title (Main)</label>
                        <input
                            type="text"
                            value={config.hero_title}
                            onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                            placeholder="Verified USA Opportunities"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Hero Title (Highlight)</label>
                        <input
                            type="text"
                            value={config.hero_title_highlight}
                            onChange={(e) => setConfig({ ...config, hero_title_highlight: e.target.value })}
                            placeholder="just a click away."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">This part appears in yellow color</p>
                    </div>
                </div>

                {/* Hero Subtitle */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Hero Subtitle</label>
                    <textarea
                        value={config.hero_subtitle}
                        onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                        placeholder="Gellobit connects you with real giveaways..."
                        rows={2}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Hero Background Color */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Hero Background Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={config.hero_background_color}
                            onChange={(e) => setConfig({ ...config, hero_background_color: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={config.hero_background_color}
                            onChange={(e) => setConfig({ ...config, hero_background_color: e.target.value })}
                            placeholder="#ffffff"
                            className="w-32 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <div
                            className="w-20 h-10 rounded-lg border border-slate-300"
                            style={{ backgroundColor: config.hero_background_color }}
                        />
                    </div>
                    <p className="text-xs text-slate-500">Background color for the full-height hero section</p>
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Primary Button Text</label>
                        <input
                            type="text"
                            value={config.hero_cta_primary}
                            onChange={(e) => setConfig({ ...config, hero_cta_primary: e.target.value })}
                            placeholder="Explore Feed Now"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Secondary Button Text</label>
                        <input
                            type="text"
                            value={config.hero_cta_secondary}
                            onChange={(e) => setConfig({ ...config, hero_cta_secondary: e.target.value })}
                            placeholder="View Pro Plan"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* ===================== APP DOWNLOAD SECTION ===================== */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Smartphone size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-slate-900">App Download Section</h3>
                </div>

                {/* Section Texts */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Section Title</label>
                    <input
                        type="text"
                        value={config.app_section_title}
                        onChange={(e) => setConfig({ ...config, app_section_title: e.target.value })}
                        placeholder="Carry opportunities in your pocket."
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Section Subtitle</label>
                    <textarea
                        value={config.app_section_subtitle}
                        onChange={(e) => setConfig({ ...config, app_section_subtitle: e.target.value })}
                        placeholder="Download the mobile App and never miss..."
                        rows={2}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Store Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">▶</span>
                            </div>
                            Google Play Store URL
                        </label>
                        <input
                            type="url"
                            value={config.app_playstore_url}
                            onChange={(e) => setConfig({ ...config, app_playstore_url: e.target.value })}
                            placeholder="https://play.google.com/store/apps/details?id=..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Leave empty to hide the button</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold"></span>
                            </div>
                            App Store URL (iOS)
                        </label>
                        <input
                            type="url"
                            value={config.app_appstore_url}
                            onChange={(e) => setConfig({ ...config, app_appstore_url: e.target.value })}
                            placeholder="https://apps.apple.com/app/..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Leave empty to hide the button</p>
                    </div>
                </div>

                {/* Phone Mockup Image */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <label className="block text-sm font-bold text-slate-900">Phone Mockup Image</label>
                    <p className="text-xs text-slate-500">Upload a screenshot of your app. Recommended size: 300x600px (portrait)</p>

                    <div className="flex items-start gap-6">
                        <div className="w-32 h-64 bg-slate-800 rounded-[24px] border-4 border-slate-700 flex items-center justify-center overflow-hidden relative">
                            <div className="absolute top-0 w-16 h-3 bg-slate-700 rounded-b-xl"></div>
                            {previewMockupUrl ? (
                                <img src={previewMockupUrl} alt="App Screenshot" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <ImageIcon size={24} className="mx-auto text-slate-500" />
                                    <span className="text-[10px] text-slate-500 mt-1 block">App Screenshot</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <input ref={mockupFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'mockup')} className="hidden" />
                            <button onClick={() => mockupFileInputRef.current?.click()} disabled={uploadingMockup} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm">
                                {uploadingMockup ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                                Upload Screenshot
                            </button>
                            {previewMockupUrl && (
                                <button onClick={() => handleRemoveImage('mockup')} className="text-red-600 px-4 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm">
                                    <Trash2 size={16} /> Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===================== FOOTER SECTION ===================== */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Link2 size={20} className="text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Footer Configuration</h3>
                </div>

                {/* Footer Tagline */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900">Tagline (Text below logo)</label>
                    <textarea
                        value={config.footer_tagline}
                        onChange={(e) => setConfig({ ...config, footer_tagline: e.target.value })}
                        placeholder="Empowering your community..."
                        rows={2}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Explore Column Links */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-bold text-slate-900">Explore Column Links</label>
                            <p className="text-xs text-slate-500">Custom links in the "Explore" column</p>
                        </div>
                        <button onClick={addExploreLink} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-1">
                            <Plus size={14} /> Add Link
                        </button>
                    </div>

                    {config.footer_explore_links.length === 0 ? (
                        <div className="text-sm text-slate-400 bg-white rounded-lg p-4 border border-dashed border-slate-300 text-center">
                            No links added yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {config.footer_explore_links.map((link) => (
                                <div key={link.id} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                                    <GripVertical size={16} className="text-slate-400" />
                                    <input type="text" value={link.label} onChange={(e) => updateExploreLink(link.id, 'label', e.target.value)} placeholder="Label" className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="text" value={link.url} onChange={(e) => updateExploreLink(link.id, 'url', e.target.value)} placeholder="URL" className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <button onClick={() => removeExploreLink(link.id)} className="text-red-500 hover:text-red-700 p-1"><X size={18} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Information Column - Pages Selection */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-900">Information Column (Pages)</label>
                        <p className="text-xs text-slate-500">Select pages for the "Information" column</p>
                    </div>

                    {availablePages.length === 0 ? (
                        <div className="text-sm text-slate-400 bg-white rounded-lg p-4 border border-dashed border-slate-300 text-center">
                            No pages available.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {availablePages.map((page) => (
                                <label key={page.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config.footer_info_page_ids.includes(page.id) ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <input type="checkbox" checked={config.footer_info_page_ids.includes(page.id)} onChange={() => togglePageSelection(page.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm font-medium text-slate-700">{page.title}</span>
                                    <span className="text-xs text-slate-400">/{page.slug}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-900">Social Links</label>
                        <p className="text-xs text-slate-500">Add your social media profiles</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {SOCIAL_PLATFORMS.filter(p => !config.footer_social_links.some(s => s.platform === p.id)).map((platform) => (
                            <button key={platform.id} onClick={() => addSocialLink(platform.id)} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Plus size={14} /> {platform.label}
                            </button>
                        ))}
                    </div>

                    {config.footer_social_links.length > 0 && (
                        <div className="space-y-2">
                            {config.footer_social_links.map((social) => {
                                const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
                                return (
                                    <div key={social.platform} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">{platform?.icon || '?'}</div>
                                        <span className="text-sm font-medium text-slate-700 w-24">{platform?.label}</span>
                                        <input type="text" value={social.url} onChange={(e) => updateSocialLink(social.platform, e.target.value)} placeholder={`https://${social.platform}.com/...`} className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        <button onClick={() => removeSocialLink(social.platform)} className="text-red-500 hover:text-red-700 p-1"><X size={18} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ===================== BOTTOM BAR SECTION ===================== */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Footer Bottom Bar</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Left Text</label>
                        <input type="text" value={config.footer_bottom_left} onChange={(e) => setConfig({ ...config, footer_bottom_left: e.target.value })} placeholder="© 2026 Company. All rights reserved." className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-900">Right Text</label>
                        <input type="text" value={config.footer_bottom_right} onChange={(e) => setConfig({ ...config, footer_bottom_right: e.target.value })} placeholder="Developed with ❤️" className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {saving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Settings</>}
                </button>
                <button onClick={fetchSettings} className="bg-white text-slate-700 px-6 py-2 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors">
                    Reset
                </button>
            </div>
        </div>
    );
}
