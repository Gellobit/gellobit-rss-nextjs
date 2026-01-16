'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Camera, Save, RefreshCw, Key, Crown, Calendar, Heart, Bell, LogOut, ChevronRight, ChevronDown, Settings, FileText, Info, Briefcase } from 'lucide-react';
import { APP_VERSION } from '@/components/LandingPage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useShowAds } from '@/context/UserContext';

interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    membership_type: string;
    membership_expires_at: string | null;
    role: string;
    created_at: string;
}

interface MenuPage {
    id: string;
    title: string;
    slug: string;
}

export default function AccountPage() {
    const router = useRouter();
    const { profile: contextProfile, loading: contextLoading, updateProfile: updateContextProfile, clearProfile } = useUser();
    const { shouldShowAds, isPremium } = useShowAds();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [displayName, setDisplayName] = useState('');

    // Password form
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Menu pages state
    const [menuPages, setMenuPages] = useState<MenuPage[]>([]);
    const [showInfoPages, setShowInfoPages] = useState(false);

    // Sync with context profile
    useEffect(() => {
        if (contextProfile) {
            setProfile(contextProfile as Profile);
            setDisplayName(contextProfile.display_name || '');
            setLoading(false);
        } else if (!contextLoading) {
            setLoading(false);
        }
    }, [contextProfile, contextLoading]);

    // Fetch menu pages
    useEffect(() => {
        const fetchMenuPages = async () => {
            try {
                const res = await fetch('/api/pages?menu=true');
                if (res.ok) {
                    const data = await res.json();
                    setMenuPages(data.pages || []);
                }
            } catch (error) {
                console.error('Error fetching menu pages:', error);
            }
        };
        fetchMenuPages();
    }, []);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            clearProfile();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        }
        setSigningOut(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ display_name: displayName }),
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                // Update context so other components reflect the change
                updateContextProfile({ display_name: displayName });
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        }

        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(prev => prev ? { ...prev, avatar_url: data.url } : null);
                // Update context so navbar avatar updates immediately
                updateContextProfile({ avatar_url: data.url });
                setMessage({ type: 'success', text: 'Avatar updated!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to upload avatar' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload avatar' });
        }

        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Remove your avatar?')) return;

        try {
            const res = await fetch('/api/user/avatar', { method: 'DELETE' });
            if (res.ok) {
                setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
                // Update context so navbar avatar updates immediately
                updateContextProfile({ avatar_url: null });
                setMessage({ type: 'success', text: 'Avatar removed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove avatar' });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setShowPasswordForm(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to change password' });
        }

        setChangingPassword(false);
    };

    const getMembershipLabel = (type: string) => {
        switch (type) {
            case 'premium': return 'Premium';
            case 'lifetime': return 'Lifetime';
            default: return 'Free';
        }
    };

    const getMembershipColor = (type: string) => {
        switch (type) {
            case 'premium': return 'bg-purple-100 text-purple-700';
            case 'lifetime': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Mobile Menu - Only visible on mobile */}
            <div className="md:hidden space-y-3">
                {/* Profile Summary */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center gap-4">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-14 h-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="text-slate-400" size={24} />
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-bold text-slate-900">{profile?.display_name || 'Guest'}</p>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getMembershipColor(profile?.membership_type || 'free')}`}>
                                {getMembershipLabel(profile?.membership_type || 'free')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <Link
                        href="/opportunities"
                        className="flex items-center justify-between px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Briefcase className="text-blue-600" size={20} />
                            </div>
                            <span className="font-medium">Browse Opportunities</span>
                        </div>
                        <ChevronRight className="text-slate-400" size={20} />
                    </Link>

                    <Link
                        href="/saved"
                        className="flex items-center justify-between px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <Heart className="text-red-600" size={20} />
                            </div>
                            <span className="font-medium">Saved Opportunities</span>
                        </div>
                        <ChevronRight className="text-slate-400" size={20} />
                    </Link>

                    <Link
                        href="/account/notifications"
                        className="flex items-center justify-between px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Bell className="text-amber-600" size={20} />
                            </div>
                            <span className="font-medium">Notifications</span>
                        </div>
                        <ChevronRight className="text-slate-400" size={20} />
                    </Link>

                    <Link
                        href="/account/settings"
                        className="flex items-center justify-between px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Settings className="text-slate-600" size={20} />
                            </div>
                            <span className="font-medium">Settings & Profile</span>
                        </div>
                        <ChevronRight className="text-slate-400" size={20} />
                    </Link>

                    {shouldShowAds && !isPremium && (
                        <Link
                            href="/pricing"
                            className="w-full flex items-center justify-between px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Crown className="text-yellow-600" size={20} />
                                </div>
                                <span className="font-medium">Upgrade to Pro</span>
                            </div>
                            <ChevronRight className="text-slate-400" size={20} />
                        </Link>
                    )}

                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                <LogOut className="text-red-500" size={20} />
                            </div>
                            <span className="font-medium text-red-600">
                                {signingOut ? 'Signing out...' : 'Sign Out'}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Pages Section - Collapsible */}
                {menuPages.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => setShowInfoPages(!showInfoPages)}
                            className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <FileText className="text-purple-600" size={20} />
                                </div>
                                <span className="font-medium">Information</span>
                            </div>
                            <ChevronDown
                                className={`text-slate-400 transition-transform ${showInfoPages ? 'rotate-180' : ''}`}
                                size={20}
                            />
                        </button>

                        {showInfoPages && (
                            <div className="border-t border-slate-100">
                                {menuPages.map((page, index) => (
                                    <Link
                                        key={page.id}
                                        href={`/${page.slug}`}
                                        className={`flex items-center justify-between px-4 py-3 pl-16 hover:bg-slate-50 transition-colors ${
                                            index < menuPages.length - 1 ? 'border-b border-slate-100' : ''
                                        }`}
                                    >
                                        <span className="text-sm text-slate-700">{page.title}</span>
                                        <ChevronRight className="text-slate-400" size={16} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Version Info */}
                <div className="text-center py-4">
                    <span className="text-xs text-slate-400 font-medium">{APP_VERSION}</span>
                </div>
            </div>

            {/* Desktop View */}
            <h1 className="hidden md:block text-2xl font-black text-slate-900">My Account</h1>

            {/* Desktop Content - Hidden on mobile */}
            <div className="hidden md:block space-y-6">
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

                {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-bold text-lg">Profile Information</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="text-slate-400" size={32} />
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {uploadingAvatar ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <Camera size={14} />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{profile?.display_name || 'No name set'}</p>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            {profile?.avatar_url && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                                >
                                    Remove photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Email Address
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-slate-600">
                            <Mail size={18} />
                            {profile?.email}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
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
            </div>

            {/* Membership Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-bold text-lg">Membership</h2>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-xl">
                                <Crown className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                        {getMembershipLabel(profile?.membership_type || 'free')} Plan
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getMembershipColor(profile?.membership_type || 'free')}`}>
                                        {getMembershipLabel(profile?.membership_type || 'free')}
                                    </span>
                                </div>
                                {profile?.membership_expires_at && (
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <Calendar size={14} />
                                        Expires: {new Date(profile.membership_expires_at).toLocaleDateString()}
                                    </p>
                                )}
                                <p className="text-sm text-slate-500 mt-1">
                                    Member since {new Date(profile?.created_at || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {shouldShowAds && !isPremium && (
                            <Link
                                href="/pricing"
                                className="bg-[#FFDE59] text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"
                            >
                                Upgrade
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-bold text-lg">Password & Security</h2>
                </div>

                <div className="p-6">
                    {!showPasswordForm ? (
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="flex items-center gap-3 text-slate-700 hover:text-slate-900"
                        >
                            <Key size={18} />
                            <span className="font-medium">Change Password</span>
                        </button>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {changingPassword ? 'Changing...' : 'Change Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="px-6 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            </div> {/* End Desktop Content */}
        </div>
    );
}
