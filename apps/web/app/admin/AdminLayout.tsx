'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Rss, BarChart3, Settings as SettingsIcon, ScrollText, FileText, BookOpen, StickyNote } from 'lucide-react';
import UserNav from '@/components/UserNav';
import Dashboard from './Dashboard';
import ManageFeeds from './ManageFeeds';
import ManagePosts from './ManagePosts';
import ManageBlogPosts from './ManageBlogPosts';
import ManagePages from './ManagePages';
import Settings from './Settings';
import Analytics from './Analytics';
import ProcessingLog from './ProcessingLog';

type Section = 'dashboard' | 'feeds' | 'posts' | 'blog' | 'pages' | 'analytics' | 'settings' | 'logs';

interface Branding {
    logoUrl: string | null;
    appName: string;
}

interface AdminLayoutProps {
    initialSection: string;
    branding: Branding;
}

export default function AdminLayout({ initialSection, branding }: AdminLayoutProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<Section>(initialSection as Section || 'dashboard');

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && ['dashboard', 'feeds', 'posts', 'blog', 'pages', 'analytics', 'settings', 'logs'].includes(section)) {
            setActiveSection(section as Section);
        }
    }, [searchParams]);

    const navigateToSection = (section: Section) => {
        setActiveSection(section);
        router.push(`/admin?section=${section}`);
    };

    const sections = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'feeds', label: 'RSS Feeds', icon: Rss },
        { id: 'posts', label: 'Opportunities', icon: FileText },
        { id: 'blog', label: 'Blog Posts', icon: BookOpen },
        { id: 'pages', label: 'Pages', icon: StickyNote },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'logs', label: 'Processing Log', icon: ScrollText },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    alt={branding.appName}
                                    className="h-10 object-contain"
                                />
                            ) : (
                                <>
                                    <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                                    <div>
                                        <div className="font-black text-xl tracking-tighter text-[#1a1a1a]">{branding.appName}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin Panel</div>
                                    </div>
                                </>
                            )}
                        </Link>

                        {/* Navigation Tabs */}
                        <div className="hidden md:flex items-center gap-1">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => navigateToSection(section.id as Section)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                            isActive
                                                ? 'bg-slate-900 text-white'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <UserNav hideOpportunities />
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
                <select
                    value={activeSection}
                    onChange={(e) => navigateToSection(e.target.value as Section)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold text-sm"
                >
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeSection === 'dashboard' && <Dashboard />}
                {activeSection === 'feeds' && (
                    <div>
                        <h1 className="text-3xl font-black text-[#1a1a1a] mb-6">RSS Feeds Management</h1>
                        <ManageFeeds />
                    </div>
                )}
                {activeSection === 'posts' && <ManagePosts />}
                {activeSection === 'blog' && <ManageBlogPosts />}
                {activeSection === 'pages' && <ManagePages />}
                {activeSection === 'analytics' && <Analytics />}
                {activeSection === 'settings' && <Settings />}
                {activeSection === 'logs' && <ProcessingLog />}
            </main>
        </div>
    );
}
