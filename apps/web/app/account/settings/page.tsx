'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Camera, Save, RefreshCw, Key, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

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

export default function SettingsPage() {
    const { profile: contextProfile, loading: contextLoading, updateProfile: updateContextProfile } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
                updateContextProfile({ display_name: displayName });
                setMessage({ type: 'success', text: 'Profile updated!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update' });
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
                updateContextProfile({ avatar_url: data.url });
                setMessage({ type: 'success', text: 'Avatar updated!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to upload' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload avatar' });
        }

        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
                setMessage({ type: 'success', text: 'Password changed!' });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile Back Button */}
            <div className="md:hidden">
                <Link href="/account" className="flex items-center gap-2 text-slate-600 mb-4">
                    <ChevronLeft size={20} />
                    <span className="font-medium">Back</span>
                </Link>
            </div>

            <h1 className="text-xl font-black text-slate-900">Settings & Profile</h1>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-xl text-sm ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Avatar & Name */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="text-slate-400" size={28} />
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1.5 rounded-full"
                        >
                            {uploadingAvatar ? (
                                <RefreshCw size={12} className="animate-spin" />
                            ) : (
                                <Camera size={12} />
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
                    <div className="flex-1">
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>
                </div>

                {/* Email (read-only) */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-600">
                    <Mail size={16} />
                    {profile?.email}
                </div>

                <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full mt-4 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            Save Profile
                        </>
                    )}
                </button>
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h2 className="font-bold text-slate-900 mb-3">Password</h2>

                {!showPasswordForm ? (
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className="flex items-center gap-2 text-slate-600"
                    >
                        <Key size={16} />
                        <span className="text-sm font-medium">Change Password</span>
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                            minLength={6}
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                {changingPassword ? 'Changing...' : 'Change'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
