'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Search,
    SlidersHorizontal,
    Gift,
    Trophy,
    Briefcase,
    GraduationCap,
    BookOpen,
    MapPin,
    Clock,
    X,
    Check,
    ChevronLeft,
} from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import MobileNavBar from '@/components/MobileNavBar';
import FavoriteButton from '@/components/FavoriteButton';

interface Opportunity {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    opportunity_type: string;
    deadline: string | null;
    prize_value: string | null;
    location: string | null;
    featured_image_url: string | null;
    published_at: string | null;
}

interface Branding {
    logoUrl: string | null;
    appName: string;
}

interface OpportunitiesBrowserProps {
    opportunities: Opportunity[];
    branding: Branding;
}

const opportunityTypes = [
    { value: 'giveaway', label: 'Giveaways', icon: Gift, color: 'bg-pink-100 text-pink-700' },
    { value: 'contest', label: 'Contests', icon: Trophy, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'sweepstakes', label: 'Sweepstakes', icon: Gift, color: 'bg-purple-100 text-purple-700' },
    { value: 'dream_job', label: 'Dream Jobs', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
    { value: 'get_paid_to', label: 'Get Paid To', icon: Briefcase, color: 'bg-green-100 text-green-700' },
    { value: 'instant_win', label: 'Instant Wins', icon: Trophy, color: 'bg-orange-100 text-orange-700' },
    { value: 'job_fair', label: 'Job Fairs', icon: Briefcase, color: 'bg-indigo-100 text-indigo-700' },
    { value: 'scholarship', label: 'Scholarships', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-700' },
    { value: 'volunteer', label: 'Volunteer', icon: Briefcase, color: 'bg-teal-100 text-teal-700' },
    { value: 'free_training', label: 'Free Training', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700' },
    { value: 'promo', label: 'Promos', icon: Gift, color: 'bg-red-100 text-red-700' },
    { value: 'evergreen', label: 'Evergreen', icon: BookOpen, color: 'bg-lime-100 text-lime-700' },
];

export default function OpportunitiesBrowser({ opportunities, branding }: OpportunitiesBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempSelectedTypes, setTempSelectedTypes] = useState<string[]>([]);

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter((opp) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    opp.title.toLowerCase().includes(query) ||
                    opp.excerpt?.toLowerCase().includes(query) ||
                    opp.location?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (selectedTypes.length > 0 && !selectedTypes.includes(opp.opportunity_type)) {
                return false;
            }

            return true;
        });
    }, [opportunities, searchQuery, selectedTypes]);

    const openFilters = () => {
        setTempSelectedTypes([...selectedTypes]);
        setIsFilterOpen(true);
    };

    const applyFilters = () => {
        setSelectedTypes([...tempSelectedTypes]);
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        setTempSelectedTypes([]);
    };

    const toggleType = (type: string) => {
        setTempSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const getTypeConfig = (type: string) => {
        return opportunityTypes.find((t) => t.value === type) || {
            value: type,
            label: type,
            icon: Gift,
            color: 'bg-gray-100 text-gray-700',
        };
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            {/* Mobile Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
                {/* Top bar with logo */}
                <div className="flex items-center justify-between px-4 h-14 md:hidden">
                    <Link href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt={branding.appName} className="h-8 object-contain" />
                        ) : (
                            <div className="bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm">GB</div>
                        )}
                    </Link>
                    <h1 className="font-bold text-lg">Explore</h1>
                    <div className="w-8" /> {/* Spacer */}
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between px-6 h-16 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt={branding.appName} className="h-10 object-contain" />
                            ) : (
                                <>
                                    <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl">GB</div>
                                    <span className="font-black text-2xl tracking-tighter">{branding.appName}</span>
                                </>
                            )}
                        </Link>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-900">Home</Link>
                        <Link href="/blog" className="text-sm font-bold text-slate-600 hover:text-slate-900">Blog</Link>
                        <Link href="/account" className="text-sm font-bold text-slate-600 hover:text-slate-900">Account</Link>
                    </nav>
                </div>

                {/* Search and Filter Bar */}
                <div className="px-4 py-3 flex gap-2">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={openFilters}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            selectedTypes.length > 0
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                        <span className="hidden sm:inline">Filters</span>
                        {selectedTypes.length > 0 && (
                            <span className="bg-yellow-400 text-slate-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                {selectedTypes.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Active Filters (Desktop) */}
                {selectedTypes.length > 0 && (
                    <div className="hidden md:flex px-4 pb-3 gap-2 flex-wrap">
                        {selectedTypes.map((type) => {
                            const config = getTypeConfig(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedTypes((prev) => prev.filter((t) => t !== type))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.color}`}
                                >
                                    {config.label}
                                    <X size={12} />
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setSelectedTypes([])}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </header>

            {/* Results Count */}
            <div className="px-4 py-3 text-sm text-slate-500">
                {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'} found
            </div>

            {/* Opportunities Grid */}
            <main className="px-4 pb-6">
                {filteredOpportunities.length === 0 ? (
                    <div className="text-center py-16">
                        <Gift className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 mb-2">No opportunities found</h2>
                        <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
                        {(searchQuery || selectedTypes.length > 0) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedTypes([]);
                                }}
                                className="text-sm font-bold text-yellow-600 hover:text-yellow-700"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOpportunities.map((opp) => {
                            const config = getTypeConfig(opp.opportunity_type);
                            const Icon = config.icon;

                            return (
                                <div
                                    key={opp.id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group"
                                >
                                    {/* Image */}
                                    <Link href={`/p/${opp.slug}`}>
                                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                            {opp.featured_image_url ? (
                                                <img
                                                    src={opp.featured_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                                    <Icon className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}
                                            <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="p-3">
                                        <Link href={`/p/${opp.slug}`}>
                                            <h3 className="font-bold text-sm text-slate-900 mb-1.5 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                                {opp.title}
                                            </h3>
                                        </Link>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                                                {opp.prize_value && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Gift size={10} />
                                                        {opp.prize_value}
                                                    </span>
                                                )}
                                                {opp.deadline && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={10} />
                                                        {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <FavoriteButton opportunityId={opp.id} size={16} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Bottom Sheet Filter */}
            <BottomSheet
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter Opportunities"
            >
                <div className="p-4 space-y-6">
                    {/* Type Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-900">Opportunity Type</h3>
                            {tempSelectedTypes.length > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {opportunityTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = tempSelectedTypes.includes(type.value);

                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => toggleType(type.value)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                                            isSelected
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-sm font-medium flex-1">{type.label}</span>
                                        {isSelected && <Check size={16} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Apply Button */}
                    <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t border-slate-100 -mx-4 px-4">
                        <button
                            onClick={applyFilters}
                            className="w-full bg-[#FFDE59] text-slate-900 font-bold py-4 rounded-xl hover:bg-yellow-400 transition-colors"
                        >
                            Show {filteredOpportunities.length} Results
                        </button>
                    </div>
                </div>
            </BottomSheet>

            {/* Mobile Navigation Bar */}
            <MobileNavBar />
        </div>
    );
}
