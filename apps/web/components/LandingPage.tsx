"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Check, ShieldCheck, Zap, Bell, Smartphone, Search,
    Briefcase, Gift, GraduationCap, Star, Users, ChevronDown, Globe,
    Trophy, ArrowRight
} from 'lucide-react';

import { useUser, useShowAds } from '../context/UserContext';
import { AdUnit } from './AdUnit';
import { FeatureCard } from './FeatureCard';
import { PricingItem } from './PricingItem';
import UserNav from './UserNav';
import MobileNavBar from './MobileNavBar';

interface Branding {
    logoUrl: string | null;
    footerLogoUrl: string | null;
    appName: string;
}

interface ExploreLink {
    id: string;
    label: string;
    url: string;
}

interface SocialLink {
    platform: string;
    url: string;
}

interface FooterPage {
    id: string;
    title: string;
    slug: string;
}

interface FooterConfig {
    tagline: string;
    exploreLinks: ExploreLink[];
    infoPages: FooterPage[];
    socialLinks: SocialLink[];
    bottomLeft: string;
    bottomRight: string;
}

interface HeroContent {
    badgeText: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    backgroundColor: string;
}

interface AppSection {
    title: string;
    subtitle: string;
    playstoreUrl: string;
    appstoreUrl: string;
    mockupImageUrl: string | null;
}

interface LandingPageProps {
    opportunities: any[];
    branding: Branding;
    heroContent?: HeroContent;
    appSection?: AppSection;
    footer?: FooterConfig;
}

const SOCIAL_ICONS: Record<string, string> = {
    facebook: 'F',
    instagram: 'I',
    twitter: 'X',
    tiktok: 'T',
    youtube: 'Y',
    linkedin: 'L',
    threads: '@',
    website: 'W',
};

const APP_VERSION = 'v1.0.0-alpha.7';

const SEARCH_CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'giveaway', label: 'Giveaways' },
    { value: 'contest', label: 'Contests' },
    { value: 'sweepstakes', label: 'Sweepstakes' },
    { value: 'dream_job', label: 'Dream Jobs' },
    { value: 'scholarship', label: 'Scholarships' },
    { value: 'free_training', label: 'Free Training' },
    { value: 'get_paid_to', label: 'Get Paid To' },
];

// Category badge colors and labels for opportunities
const CATEGORY_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
    giveaway: { label: 'GIVEAWAY', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' },
    contest: { label: 'CONTEST', bgColor: 'bg-orange-400', textColor: 'text-orange-900' },
    sweepstakes: { label: 'SWEEPSTAKES', bgColor: 'bg-purple-500', textColor: 'text-white' },
    dream_job: { label: 'JOBS', bgColor: 'bg-slate-900', textColor: 'text-white' },
    job_fair: { label: 'JOB FAIR', bgColor: 'bg-slate-900', textColor: 'text-white' },
    scholarship: { label: 'SCHOLARSHIP', bgColor: 'bg-green-500', textColor: 'text-white' },
    free_training: { label: 'FREE TRAINING', bgColor: 'bg-cyan-500', textColor: 'text-white' },
    get_paid_to: { label: 'GET PAID', bgColor: 'bg-emerald-500', textColor: 'text-white' },
    instant_win: { label: 'INSTANT WIN', bgColor: 'bg-red-500', textColor: 'text-white' },
    volunteer: { label: 'VOLUNTEER', bgColor: 'bg-teal-500', textColor: 'text-white' },
    promo: { label: 'EXCLUSIVE', bgColor: 'bg-amber-500', textColor: 'text-amber-900' },
};

export const LandingPage = ({ opportunities = [], branding, heroContent, appSection, footer }: LandingPageProps) => {
    const router = useRouter();
    const { shouldShowAds, isPremium } = useShowAds();
    const { isAuthenticated } = useUser();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // Scroll state for header
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory) params.set('type', selectedCategory);

        const queryString = params.toString();
        const targetUrl = `/opportunities${queryString ? `?${queryString}` : ''}`;

        // If not authenticated, redirect to auth with the target URL
        if (!isAuthenticated) {
            router.push(`/auth?mode=signin&redirect=${encodeURIComponent(targetUrl)}`);
            return;
        }

        router.push(targetUrl);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Default hero content values
    const heroBadgeText = heroContent?.badgeText || 'New Platform 2.0 Available!';
    const heroTitle = heroContent?.title || 'Verified USA Opportunities';
    const heroTitleHighlight = heroContent?.titleHighlight || 'just a click away.';
    const heroSubtitle = heroContent?.subtitle || 'Gellobit connects you with real giveaways, job fairs, and scholarships. No scams, just value verified daily by experts.';
    const heroBackgroundColor = heroContent?.backgroundColor || '#ffffff';

    // Default app section values
    const appSectionTitle = appSection?.title || 'Carry opportunities in your pocket.';
    const appSectionSubtitle = appSection?.subtitle || 'Download the mobile App and never miss a job fair or verified giveaway by not being at your PC.';
    const appPlaystoreUrl = appSection?.playstoreUrl || '';
    const appAppstoreUrl = appSection?.appstoreUrl || '';
    const appMockupImageUrl = appSection?.mockupImageUrl || null;

    // Default footer values
    const footerTagline = footer?.tagline || 'Empowering the USA community through verified opportunities and valuable content since 2025.';
    const footerExploreLinks = footer?.exploreLinks || [];
    const footerInfoPages = footer?.infoPages || [];
    const footerSocialLinks = footer?.socialLinks || [];
    const footerBottomLeft = footer?.bottomLeft || '© 2026 Gellobit.com. All rights reserved.';
    const footerBottomRight = footer?.bottomRight || 'Developed with ❤️ for USA';

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-yellow-200 pb-20 md:pb-0">
            {/* Upgrade Banner for Free Users */}
            {shouldShowAds && (
                <Link href="/pricing" className="block bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs text-center py-2 font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all">
                    Upgrade to Premium for an ad-free experience and exclusive features
                </Link>
            )}
            {/* Navigation - Hidden on mobile */}
            <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-white/80 backdrop-blur-md border-b border-slate-100'
                    : 'bg-white border-b border-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    alt={branding.appName}
                                    className="h-10 object-contain"
                                />
                            ) : (
                                <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                            )}
                            <span className="text-sm font-bold text-[#1a1a1a]">{branding.appName}</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Pricing</a>
                            <a href="#trust" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Why Us</a>
                            <Link href="/opportunities" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Opportunities</Link>
                        </div>
                        <UserNav hideOpportunities />
                    </div>
                </div>
            </nav>

            {/* ... Hero ... */}
            <header
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: heroBackgroundColor }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                            <Star size={14} fill="currentColor" /> {heroBadgeText}
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1a1a1a] leading-[1.1] mb-6 md:mb-8 tracking-tight">
                            {heroTitle} <span className="text-white">{heroTitleHighlight}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#1a1a1a] mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
                            {heroSubtitle}
                        </p>
                        {/* Search Bar */}
                        <div className="bg-white py-3 px-3 md:py-3 md:px-3 rounded-2xl md:rounded-full shadow-2xl max-w-3xl mx-auto relative">
                            <div className="flex items-center gap-2">
                                {/* Search Input */}
                                <div className="flex-1 flex items-center pl-2 md:pl-4">
                                    <Search className="text-slate-400 mr-3 flex-shrink-0" size={20} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search prizes, jobs, or training..."
                                        className="bg-transparent w-full py-2 outline-none font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>

                                {/* Category Dropdown - Desktop */}
                                <div className="hidden md:block relative">
                                    <button
                                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
                                    >
                                        {SEARCH_CATEGORIES.find(c => c.value === selectedCategory)?.label || 'All Categories'}
                                        <ChevronDown size={16} className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {categoryDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setCategoryDropdownOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20">
                                                {SEARCH_CATEGORIES.map((category) => (
                                                    <button
                                                        key={category.value}
                                                        onClick={() => {
                                                            setSelectedCategory(category.value);
                                                            setCategoryDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                                            selectedCategory === category.value
                                                                ? 'bg-slate-100 text-slate-900'
                                                                : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {category.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Search Button */}
                                <button
                                    onClick={handleSearch}
                                    className="bg-[#1a1a1a] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold hover:bg-slate-800 transition-all flex-shrink-0"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Category Select - Mobile */}
                            <div className="md:hidden mt-3 pt-3 border-t border-slate-100">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-yellow-400"
                                >
                                    {SEARCH_CATEGORIES.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Category Quick Links */}
                        <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-4">
                            {[
                                { type: 'giveaway', label: 'Giveaways', icon: Gift, desc: 'Win prizes & rewards' },
                                { type: 'sweepstakes', label: 'Sweepstakes', icon: Trophy, desc: 'Enter to win big' },
                                { type: 'scholarship', label: 'Scholarships', icon: GraduationCap, desc: 'Fund your education' },
                                { type: 'free_training', label: 'Free Training', icon: Zap, desc: 'Learn new skills' },
                                { type: 'job_fair', label: 'Job Fairs', icon: Briefcase, desc: 'Meet employers' },
                                { type: 'get_paid_to', label: 'Get Paid To', icon: Star, desc: 'Earn rewards' },
                                { type: 'volunteer', label: 'Volunteer', icon: Users, desc: 'Give back' },
                                { type: 'promo', label: 'Promos', icon: Globe, desc: 'Exclusive deals' },
                            ].map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <Link
                                        key={cat.type}
                                        href={isAuthenticated ? `/opportunities?type=${cat.type}` : `/auth?mode=signin&redirect=${encodeURIComponent(`/opportunities?type=${cat.type}`)}`}
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-all group flex items-center gap-3 min-w-[140px]"
                                    >
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                                            <Icon size={20} className="text-yellow-700" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-bold text-slate-900">{cat.label}</span>
                                            <span className="block text-[10px] text-slate-500">{cat.desc}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-3xl -z-10"></div>
            </header>

            {/* --- LIST OF OPPORTUNITIES (NEW SECTION) --- */}
            {opportunities.length > 0 && (
                <section className="py-16 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-[#1a1a1a]">Latest Opportunities</h2>
                                <p className="text-slate-500 mt-1">Updated daily with verified offers.</p>
                            </div>
                            <Link
                                href="/opportunities"
                                className="text-slate-900 font-bold text-sm hover:text-yellow-600 transition-colors flex items-center gap-1 group"
                            >
                                View all offers
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* Desktop Cards Grid */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {opportunities.slice(0, 8).map((opp) => {
                                const oppType = opp.opportunity_type || opp.type || 'other';
                                const categoryConfig = CATEGORY_CONFIG[oppType] || { label: oppType?.toUpperCase() || 'OTHER', bgColor: 'bg-slate-500', textColor: 'text-white' };
                                return (
                                    <Link
                                        key={opp.id}
                                        href={`/opportunities/${opp.slug}`}
                                        className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
                                    >
                                        {/* Image Placeholder */}
                                        <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {opp.featured_image_url ? (
                                                <img
                                                    src={opp.featured_image_url}
                                                    alt={opp.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <span className="text-slate-300 text-lg font-bold">IMAGE</span>
                                            )}
                                            {/* Category Badge */}
                                            <span className={`absolute top-3 left-3 ${categoryConfig.bgColor} ${categoryConfig.textColor} text-[10px] font-black px-2.5 py-1 rounded-full`}>
                                                {categoryConfig.label}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                                                {new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                                            </span>
                                            <h3 className="font-bold text-[#1a1a1a] mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                                {opp.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                                {opp.excerpt || opp.description}
                                            </p>
                                            <span className="text-slate-900 font-bold text-sm flex items-center gap-1 group-hover:text-yellow-600 transition-colors mt-auto">
                                                View Details
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-3">
                            {opportunities.slice(0, 6).map((opp) => {
                                const oppType = opp.opportunity_type || opp.type || 'other';
                                const categoryConfig = CATEGORY_CONFIG[oppType] || { label: oppType?.toUpperCase() || 'OTHER', bgColor: 'bg-slate-500', textColor: 'text-white' };
                                return (
                                    <Link
                                        key={opp.id}
                                        href={`/opportunities/${opp.slug}`}
                                        className="bg-white rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-all active:bg-slate-50"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {opp.featured_image_url ? (
                                                <img
                                                    src={opp.featured_image_url}
                                                    alt={opp.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Gift className="text-slate-300" size={24} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`${categoryConfig.bgColor} ${categoryConfig.textColor} text-[9px] font-black px-2 py-0.5 rounded-full`}>
                                                    {categoryConfig.label}
                                                </span>
                                                <span className="text-slate-400 text-[10px] font-bold">
                                                    {new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-sm text-[#1a1a1a] line-clamp-2 mb-1">
                                                {opp.title}
                                            </h3>
                                            <span className="text-yellow-600 font-bold text-xs flex items-center gap-1">
                                                View Details
                                                <ArrowRight size={12} />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* View All Button Mobile */}
                            <Link
                                href="/opportunities"
                                className="block w-full text-center bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                            >
                                View All Opportunities
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Stats Section */}
            <section className="bg-white py-12 border-y border-slate-50">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-12 md:gap-24">
                    <div className="text-center">
                        <p className="text-4xl font-black text-[#1a1a1a]">50k+</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Users</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-black text-[#1a1a1a]">1.2k</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Opportunities/Month</p>
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-black text-[#1a1a1a]">100%</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Verified</p>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-[#1a1a1a] mb-4">Everything you need to win.</h2>
                        <p className="text-lg text-slate-500">Designed to be fast, private, and highly effective.</p>
                    </div>

                    <AdUnit format="horizontal" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ShieldCheck className="text-green-500" size={32} />}
                            title="Manual Verification"
                            description="Every giveaway and job offer is reviewed by our team to ensure compliance with FTC laws."
                        />
                        <FeatureCard
                            icon={<Zap className="text-yellow-500" size={32} />}
                            title="Instant Alerts"
                            description="Receive real-time notifications directly on your mobile. Be the first to apply and increase your chances."
                        />
                        <FeatureCard
                            icon={<Smartphone className="text-blue-500" size={32} />}
                            title="Native App Experience"
                            description="Browse categories, save your favorites, and manage your profile with total fluidity from our App."
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- Only show for non-premium users */}
            {!isPremium && (
                <section id="pricing" className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-[#1a1a1a] mb-4">Plans for every level.</h2>
                            <p className="text-lg text-slate-500">Start for free or upgrade to Pro to accelerate your results.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Free Plan */}
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col">
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2">Gellobit Free</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">$0</span>
                                        <span className="text-slate-400 text-sm">/ forever</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    <PricingItem text="Full feed access" />
                                    <PricingItem text="Delayed notifications" />
                                    <PricingItem text="Ad-supported" />
                                    <PricingItem text="Max 10 favorites" />
                                </ul>
                                <Link
                                    href="/auth?mode=signup"
                                    className="w-full py-4 rounded-2xl font-bold bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all text-center block"
                                >
                                    Start Free
                                </Link>
                            </div>

                            {/* Pro Plan */}
                            <div className="bg-[#1a1a1a] p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col transform hover:scale-[1.02] transition-transform">
                                <div className="absolute top-0 right-0 bg-[#FFDE59] px-6 py-2 rounded-bl-3xl text-xs font-black uppercase tracking-widest text-[#1a1a1a]">
                                    Recommended
                                </div>
                                <div className="mb-8 text-white">
                                    <h3 className="text-xl font-bold mb-2">Gellobit Pro</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">$4.99</span>
                                        <span className="text-slate-500 text-sm">/ month</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    <PricingItem text="Instant Notifications" dark />
                                    <PricingItem text="Zero Ads (Ad-free)" dark />
                                    <PricingItem text="Unlimited favorites" dark />
                                    <PricingItem text="Access to VIP Giveaways" dark />
                                    <PricingItem text="24/7 Priority Support" dark />
                                </ul>
                                <Link
                                    href="/pricing"
                                    className="w-full py-4 rounded-2xl font-black bg-[#FFDE59] text-[#1a1a1a] hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-900/20 text-center block"
                                >
                                    Get Pro Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* --- APP DOWNLOAD SECTION --- */}
            <section className="bg-[#FFDE59] py-20 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-6 tracking-tight">
                            {appSectionTitle}
                        </h2>
                        <p className="text-lg text-[#1a1a1a]/70 font-bold mb-10 max-w-lg">
                            {appSectionSubtitle}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            {appPlaystoreUrl && (
                                <a
                                    href={appPlaystoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform shadow-xl"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.004 1.004 0 0 1-.61-.92V2.734c0-.4.23-.755.61-.92zm10.89 9.48l2.71-2.71 5.79 3.34c.6.35.6 1.21 0 1.55l-5.79 3.34-2.71-2.71L12 12l2.5-2.5.006.793zM4.47.914l9.32 5.38-2.71 2.71L4.47.914zm9.32 17.79l-9.32 5.38 6.61-8.09 2.71 2.71z"/>
                                    </svg>
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-70 leading-none">Get it on</p>
                                        <p className="text-lg font-black leading-none mt-1">Google Play</p>
                                    </div>
                                </a>
                            )}
                            {appAppstoreUrl && (
                                <a
                                    href={appAppstoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform shadow-xl"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                    </svg>
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-70 leading-none">Download on the</p>
                                        <p className="text-lg font-black leading-none mt-1">App Store</p>
                                    </div>
                                </a>
                            )}
                            {!appPlaystoreUrl && !appAppstoreUrl && (
                                <div className="bg-black/20 text-[#1a1a1a] px-8 py-4 rounded-2xl flex items-center gap-3">
                                    <Smartphone size={24} />
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold opacity-70 leading-none">Coming soon</p>
                                        <p className="text-lg font-black leading-none mt-1">Mobile App</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        {/* Mockup of Phone */}
                        <div className="w-[280px] h-[580px] bg-[#1a1a1a] rounded-[50px] border-[10px] border-[#1a1a1a] shadow-2xl mx-auto relative overflow-hidden flex items-center justify-center">
                            <div className="absolute top-0 w-32 h-6 bg-[#1a1a1a] rounded-b-3xl z-10"></div>
                            {appMockupImageUrl ? (
                                <img
                                    src={appMockupImageUrl}
                                    alt="App Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="bg-white w-full h-full p-4 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="bg-yellow-400 p-1.5 rounded-lg font-bold text-xs">GB</div>
                                        <div className="h-4 w-24 bg-slate-100 rounded-full"></div>
                                    </div>
                                    <div className="h-32 w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-slate-100 rounded-full"></div>
                                        <div className="h-4 w-2/3 bg-slate-100 rounded-full"></div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <div className="h-24 bg-yellow-50 rounded-xl border border-yellow-100"></div>
                                        <div className="h-24 bg-slate-50 rounded-xl"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Decoration */}
                        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-[#1a1a1a] text-white pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                        {/* Logo & Tagline */}
                        <div className="col-span-1 md:col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-6">
                                {branding.footerLogoUrl ? (
                                    <img
                                        src={branding.footerLogoUrl}
                                        alt={branding.appName}
                                        className="h-10 object-contain"
                                    />
                                ) : branding.logoUrl ? (
                                    <img
                                        src={branding.logoUrl}
                                        alt={branding.appName}
                                        className="h-10 object-contain"
                                    />
                                ) : (
                                    <>
                                        <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl text-[#1a1a1a]">GB</div>
                                        <span className="font-black text-2xl tracking-tighter">{branding.appName}</span>
                                    </>
                                )}
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {footerTagline}
                            </p>
                        </div>

                        {/* Explore Column */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Explore</h4>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                {footerExploreLinks.length > 0 ? (
                                    footerExploreLinks.map((link) => (
                                        <li key={link.id}>
                                            <Link
                                                href={link.url}
                                                className="hover:text-yellow-400 transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li><Link href="/opportunities" className="hover:text-yellow-400 transition-colors">Browse Opportunities</Link></li>
                                        <li><Link href="/blog" className="hover:text-yellow-400 transition-colors">Blog</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Information Column */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Information</h4>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                {footerInfoPages.length > 0 ? (
                                    footerInfoPages.map((page) => (
                                        <li key={page.id}>
                                            <Link href={`/${page.slug}`} className="hover:text-yellow-400 transition-colors">
                                                {page.title}
                                            </Link>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
                                        <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
                                        <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Social Column */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Social</h4>
                            <div className="flex gap-4 flex-wrap">
                                {footerSocialLinks.length > 0 ? (
                                    footerSocialLinks.map((social) => (
                                        <a
                                            key={social.platform}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black cursor-pointer transition-all font-bold text-sm"
                                        >
                                            {SOCIAL_ICONS[social.platform] || '?'}
                                        </a>
                                    ))
                                ) : (
                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black cursor-pointer transition-all">
                                        <Globe size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                        <p>{footerBottomLeft}</p>
                        <div className="flex gap-6">
                            <span>{footerBottomRight}</span>
                            <span>{APP_VERSION}</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Navigation */}
            <MobileNavBar />
        </div>
    );
};

export { APP_VERSION };
