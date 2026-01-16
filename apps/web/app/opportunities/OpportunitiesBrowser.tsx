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
    LayoutGrid,
    Table2,
} from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import MobileNavBar from '@/components/MobileNavBar';
import FavoriteButton from '@/components/FavoriteButton';
import { AdUnit } from '@/components/AdUnit';
import UserNav from '@/components/UserNav';

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
    initialSearch?: string;
    initialType?: string;
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

export default function OpportunitiesBrowser({ opportunities, branding, initialSearch = '', initialType = '' }: OpportunitiesBrowserProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(initialType ? [initialType] : []);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempSelectedTypes, setTempSelectedTypes] = useState<string[]>(initialType ? [initialType] : []);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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
                                <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl">GB</div>
                            )}
                            <span className="text-sm font-bold text-[#1a1a1a]">{branding.appName}</span>
                        </Link>
                    </div>
                    <UserNav hideOpportunities={true} />
                </div>

                {/* Search and Filter Bar */}
                <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
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

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Table view"
                        >
                            <Table2 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'card'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                            title="Card view"
                        >
                            <LayoutGrid size={18} />
                        </button>
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
                    <div className="hidden md:flex max-w-7xl mx-auto px-4 pb-3 gap-2 flex-wrap">
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
            <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-slate-500">
                {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'} found
            </div>

            {/* Ad Unit */}
            <div className="max-w-7xl mx-auto px-4">
                <AdUnit format="horizontal" className="mb-4" />
            </div>

            {/* Opportunities Grid */}
            <main className="max-w-7xl mx-auto px-4 pb-6">
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
                ) : viewMode === 'table' ? (
                    /* Table View */
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-3 md:px-4 py-3 md:w-1/2">Opportunity</th>
                                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-2 md:px-4 py-3 w-10 md:w-28">Type</th>
                                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Prize</th>
                                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-2 md:px-4 py-3 w-[52px] md:w-28">
                                        <span className="hidden md:inline">Deadline</span>
                                        <span className="md:hidden">Date</span>
                                    </th>
                                    <th className="w-10 md:w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOpportunities.map((opp) => {
                                    const config = getTypeConfig(opp.opportunity_type);
                                    const Icon = config.icon;

                                    return (
                                        <tr key={opp.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-3 md:px-4 py-3">
                                                <Link href={`/opportunities/${opp.slug}`} className="flex items-center gap-2 md:gap-3">
                                                    {/* Thumbnail */}
                                                    <div className="w-12 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                                        {opp.featured_image_url ? (
                                                            <img
                                                                src={opp.featured_image_url}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                                                <Icon className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-bold text-xs md:text-sm text-slate-900 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                                                            {opp.title}
                                                        </h3>
                                                        {opp.excerpt && (
                                                            <p className="text-[10px] md:text-xs text-slate-500 line-clamp-1">{opp.excerpt}</p>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            {/* Type - Icon only on mobile, icon+label on md+ */}
                                            <td className="px-2 md:px-4 py-3">
                                                {/* Mobile: Icon only */}
                                                <span className={`md:hidden inline-flex items-center justify-center w-7 h-7 rounded-lg ${config.color}`}>
                                                    <Icon size={14} />
                                                </span>
                                                {/* Desktop: Icon + Label */}
                                                <span className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
                                                    <Icon size={12} />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {opp.prize_value ? (
                                                    <span className="text-sm text-slate-700">{opp.prize_value}</span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">-</span>
                                                )}
                                            </td>
                                            {/* Deadline - Abbreviated on mobile */}
                                            <td className="px-2 md:px-4 py-3">
                                                {opp.deadline ? (
                                                    <>
                                                        {/* Mobile: Very short format */}
                                                        <span className="md:hidden text-[10px] text-slate-600 whitespace-nowrap">
                                                            {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        {/* Desktop: With icon */}
                                                        <span className="hidden md:flex items-center gap-1 text-sm text-slate-600">
                                                            <Clock size={14} className="text-slate-400" />
                                                            {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="md:hidden text-[10px] text-slate-400 whitespace-nowrap">No date</span>
                                                        <span className="hidden md:inline text-sm text-slate-400">No deadline</span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-2 md:px-4 py-3">
                                                <FavoriteButton opportunityId={opp.id} size={16} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Card View - Horizontal layout with 50% image */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredOpportunities.map((opp) => {
                            const config = getTypeConfig(opp.opportunity_type);
                            const Icon = config.icon;

                            return (
                                <div
                                    key={opp.id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group flex flex-col sm:flex-row"
                                >
                                    {/* Image - 50% width on desktop */}
                                    <Link href={`/opportunities/${opp.slug}`} className="sm:w-1/2 flex-shrink-0">
                                        <div className="aspect-[4/3] sm:aspect-auto sm:h-full bg-slate-100 relative overflow-hidden">
                                            {opp.featured_image_url ? (
                                                <img
                                                    src={opp.featured_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                                    <Icon className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}
                                            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Content - 50% width on desktop */}
                                    <div className="p-4 sm:w-1/2 flex flex-col justify-between">
                                        <div>
                                            <Link href={`/opportunities/${opp.slug}`}>
                                                <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                                    {opp.title}
                                                </h3>
                                            </Link>
                                            {opp.excerpt && (
                                                <p className="text-sm text-slate-500 line-clamp-3 mb-3">{opp.excerpt}</p>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                                {opp.prize_value && (
                                                    <span className="flex items-center gap-1">
                                                        <Gift size={14} />
                                                        {opp.prize_value}
                                                    </span>
                                                )}
                                                {opp.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <FavoriteButton opportunityId={opp.id} size={18} />
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
