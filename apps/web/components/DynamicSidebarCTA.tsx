'use client';

import React from 'react';
import { useUser, useShowAds } from '@/context/UserContext';
import { SidebarCTA } from './Sidebar';
import { Sparkles, Search, Crown } from 'lucide-react';

/**
 * Dynamic CTA component that shows different content based on user state:
 * - Logged out: "Never Miss an Opportunity" -> /auth
 * - Logged in (free): "Browse Opportunities" -> /opportunities
 * - Premium/Lifetime: "Welcome Premium Member" with different messaging
 */
export default function DynamicSidebarCTA() {
    const { isAuthenticated, loading } = useUser();
    const { isPremium } = useShowAds();

    // Show a minimal skeleton while loading to avoid layout shift
    if (loading) {
        return (
            <div className="rounded-xl p-5 bg-slate-100 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
                <div className="h-9 bg-slate-200 rounded w-28"></div>
            </div>
        );
    }

    // Not authenticated - show signup CTA
    if (!isAuthenticated) {
        return (
            <SidebarCTA
                title="Never Miss an Opportunity"
                description="Get the latest contests, giveaways, and more delivered to your inbox."
                buttonText="Get Started"
                buttonLink="/auth"
                variant="primary"
            />
        );
    }

    // Premium/Lifetime member - show appreciation message
    if (isPremium) {
        return (
            <div className="rounded-xl p-5 bg-gradient-to-br from-purple-500 to-purple-600">
                <div className="flex items-center gap-2 mb-2">
                    <Crown size={18} className="text-yellow-300" />
                    <h3 className="font-bold text-white">Premium Member</h3>
                </div>
                <p className="text-sm text-purple-100 mb-4">
                    Thank you for supporting us! Enjoy ad-free browsing and full access to all opportunities.
                </p>
                <a
                    href="/opportunities"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-white text-purple-600 hover:bg-purple-50 transition-colors"
                >
                    <Sparkles size={14} />
                    Explore Opportunities
                </a>
            </div>
        );
    }

    // Authenticated free user - show browse CTA
    return (
        <SidebarCTA
            title="Discover Opportunities"
            description="Browse contests, giveaways, scholarships, and more curated just for you."
            buttonText="Browse Now"
            buttonLink="/opportunities"
            variant="primary"
        />
    );
}
