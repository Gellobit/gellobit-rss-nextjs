'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Rss, BarChart3, Settings, ScrollText, LogOut } from 'lucide-react';
import Dashboard from './Dashboard';
import ManageFeeds from './ManageFeeds';
import ManageAISettings from './ManageAISettings';
import Analytics from './Analytics';
import ProcessingLog from './ProcessingLog';

type Section = 'dashboard' | 'feeds' | 'analytics' | 'settings' | 'logs';

interface AdminLayoutProps {
    initialSection: string;
}

export default function AdminLayout({ initialSection }: AdminLayoutProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<Section>(initialSection as Section || 'dashboard');

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && ['dashboard', 'feeds', 'analytics', 'settings', 'logs'].includes(section)) {
            setActiveSection(section as Section);
        }
    }, [searchParams]);

    const navigateToSection = (section: Section) => {
        setActiveSection(section);
        router.push(`/admin?section=${section}`);
    };

    const handleLogout = async () => {
        // TODO: Implement logout
        router.push('/auth');
    };

    const sections = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'feeds', label: 'RSS Feeds', icon: Rss },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'logs', label: 'Processing Log', icon: ScrollText },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                            <div>
                                <div className="font-black text-xl tracking-tighter text-[#1a1a1a]">Gellobit</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin Panel</div>
                            </div>
                        </div>

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

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
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
                {activeSection === 'analytics' && <Analytics />}
                {activeSection === 'settings' && (
                    <div>
                        <h1 className="text-3xl font-black text-[#1a1a1a] mb-6">Settings</h1>
                        <ManageAISettings />
                    </div>
                )}
                {activeSection === 'logs' && <ProcessingLog />}
            </main>
        </div>
    );
}
