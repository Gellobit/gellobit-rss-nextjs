'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Heart, Bell, Settings, LogOut, Crown } from 'lucide-react';

const menuItems = [
    { href: '/account', label: 'My Account', icon: User },
    { href: '/account/favorites', label: 'Favorites', icon: Heart },
    { href: '/account/notifications', label: 'Notifications', icon: Bell },
];

export default function AccountSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        // Client-side logout
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/';
        }
    };

    return (
        <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-lg text-slate-900">Account</h2>
                </div>

                <ul className="p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                                        isActive
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}

                    <li className="border-t border-slate-100 mt-2 pt-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Membership Card */}
            <div className="mt-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                    <Crown size={20} className="text-yellow-400" />
                    <span className="font-bold">Free Plan</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                    Upgrade to unlock premium features and get notified first.
                </p>
                <button className="w-full bg-[#FFDE59] text-slate-900 font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors">
                    Upgrade Plan
                </button>
            </div>
        </aside>
    );
}
