'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Sparkles, FileText, Globe, Wrench, Rss, Palette } from 'lucide-react';
import GeneralSettings from './settings/GeneralSettings';
import AISettings from './settings/AISettings';
import PromptsSettings from './settings/PromptsSettings';
import ScrapingSettings from './settings/ScrapingSettings';
import AdvancedSettings from './settings/AdvancedSettings';
import FeedsSettings from './settings/FeedsSettings';
import PersonalizationSettings from './settings/PersonalizationSettings';

type SettingsTab = 'general' | 'ai' | 'prompts' | 'scraping' | 'feeds' | 'personalization' | 'advanced';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'ai', label: 'AI Settings', icon: Sparkles },
        { id: 'prompts', label: 'Prompts', icon: FileText },
        { id: 'scraping', label: 'Scraping', icon: Globe },
        { id: 'feeds', label: 'Feeds Backup', icon: Rss },
        { id: 'personalization', label: 'Personalization', icon: Palette },
        { id: 'advanced', label: 'Advanced', icon: Wrench },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header */}
            <h1 className="text-3xl font-black text-[#1a1a1a]">Settings</h1>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'ai' && <AISettings />}
                    {activeTab === 'prompts' && <PromptsSettings />}
                    {activeTab === 'scraping' && <ScrapingSettings />}
                    {activeTab === 'feeds' && <FeedsSettings />}
                    {activeTab === 'personalization' && <PersonalizationSettings />}
                    {activeTab === 'advanced' && <AdvancedSettings />}
                </div>
            </div>
        </div>
    );
}
