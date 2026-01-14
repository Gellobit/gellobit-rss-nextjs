'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Heart, User } from 'lucide-react';
import { useUserAvatar } from '@/context/UserContext';

export default function MobileNavBar() {
    const pathname = usePathname();
    const { avatarUrl } = useUserAvatar();

    // Don't show on admin pages
    if (pathname.startsWith('/admin')) {
        return null;
    }

    const navItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/opportunities', label: 'Explore', icon: Search },
        { href: '/saved', label: 'Saved', icon: Heart },
        { href: '/account', label: 'Account', icon: null }, // Special handling for account
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    // Special rendering for Account with avatar
                    if (item.href === '/account') {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                                    isActive ? 'text-slate-900' : 'text-slate-400'
                                }`}
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Account"
                                        className={`w-6 h-6 rounded-full object-cover ${
                                            isActive ? 'ring-2 ring-slate-900' : ''
                                        }`}
                                    />
                                ) : (
                                    <User
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                )}
                                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    const Icon = item.icon!;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                                isActive ? 'text-slate-900' : 'text-slate-400'
                            }`}
                        >
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                fill={isActive && item.icon === Heart ? 'currentColor' : 'none'}
                            />
                            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
