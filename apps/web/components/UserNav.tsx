'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Settings, Heart, Bell, LogOut, Shield, ChevronDown, Briefcase, FileText, Crown, Sparkles } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    membership_type?: string;
}

interface UserNavProps {
    hideOpportunities?: boolean;
}

export default function UserNav({ hideOpportunities = false }: UserNavProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        checkAuth();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUser(data.profile);
            }
        } catch (error) {
            // Not logged in
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Render static content on server to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="flex items-center gap-4">
                <Link href="/auth?mode=signin">
                    <button className="text-sm font-bold text-[#1a1a1a] hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">
                        Sign In
                    </button>
                </Link>
                <Link href="/auth?mode=signup">
                    <button className="bg-[#1a1a1a] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
                        Sign Up Free
                    </button>
                </Link>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center gap-4">
                <Link href="/auth?mode=signin">
                    <button className="text-sm font-bold text-[#1a1a1a] hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">
                        Sign In
                    </button>
                </Link>
                <Link href="/auth?mode=signup">
                    <button className="bg-[#1a1a1a] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
                        Sign Up Free
                    </button>
                </Link>
            </div>
        );
    }

    const isAdmin = user.role === 'admin';
    const isPremium = user.membership_type === 'premium' || user.membership_type === 'lifetime';

    return (
        <div className="flex items-center gap-4">
            {!hideOpportunities && (
                <Link
                    href="/opportunities"
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors"
                >
                    <Briefcase size={18} />
                    Opportunities
                </Link>
            )}
            <div className="relative" ref={menuRef}>
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
            >
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.display_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-slate-500" />
                    </div>
                )}
                <span className="text-sm font-bold text-slate-700 hidden sm:inline">
                    {user.display_name || 'My Account'}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    {/* User Info */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <p className="font-bold text-slate-900 truncate">
                            {user.display_name || 'User'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>

                    {/* Upgrade to Pro - Only for non-premium, non-admin users */}
                    {!isPremium && !isAdmin && (
                        <div className="p-2 border-b border-slate-100">
                            <Link
                                href="/pricing"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all shadow-md"
                            >
                                <div className="flex items-center gap-2">
                                    <Crown size={18} />
                                    <span>Upgrade to Pro</span>
                                </div>
                                <Sparkles size={16} />
                            </Link>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="p-2">
                        <Link
                            href="/opportunities"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <Briefcase size={18} />
                            Browse Opportunities
                        </Link>
                        <Link
                            href="/blog"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <FileText size={18} />
                            Blog
                        </Link>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <Link
                            href="/account"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <User size={18} />
                            My Account
                        </Link>
                        <Link
                            href="/account/favorites"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <Heart size={18} />
                            Favorites
                        </Link>
                        <Link
                            href="/account/notifications"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <Bell size={18} />
                            Notifications
                        </Link>

                        {isAdmin && (
                            <>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <Link
                                    href="/admin"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                                >
                                    <Shield size={18} />
                                    Admin Panel
                                </Link>
                            </>
                        )}

                        <div className="h-px bg-slate-100 my-2"></div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
