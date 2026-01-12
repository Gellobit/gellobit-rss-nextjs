"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Check, ArrowRight, ShieldCheck, Zap, Bell, Smartphone, Search,
    Briefcase, Gift, GraduationCap, Star, Users, ChevronDown, Globe
} from 'lucide-react';

import { useSubscription } from '../context/SubscriptionContext';
import { AdUnit } from './AdUnit';
import { FeatureCard } from './FeatureCard';
import { PricingItem } from './PricingItem';

interface LandingPageProps {
    opportunities: any[]; // Replace with proper type
}

export const LandingPage = ({ opportunities = [] }: LandingPageProps) => {
    const { upgradeToPro, isPro } = useSubscription();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-yellow-200">
            {/* Sticky Banner for Demo */}
            {!isPro && (
                <div className="bg-black text-white text-xs text-center py-2 font-bold cursor-pointer hover:bg-gray-900" onClick={upgradeToPro}>
                    DEMO: Click here to simulate upgrading to PRO (Removes Ads)
                </div>
            )}
            {/* ... Navigation ... */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                {/* ... (Copy existing nav code) ... */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                            <span className="font-black text-2xl tracking-tighter text-[#1a1a1a]">GelloBit</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Pricing</a>
                            <a href="#trust" className="text-sm font-bold text-slate-600 hover:text-[#1a1a1a] transition-colors">Why Us</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/auth">
                                <button className="text-sm font-bold text-[#1a1a1a] hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">Sign In</button>
                            </Link>
                            <Link href="/auth">
                                <button className="bg-[#1a1a1a] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Sign Up Free</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ... Hero ... */}
            <header className="relative pt-16 pb-24 overflow-hidden">
                {/* ... (Copy existing hero code) ... */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                            <Star size={14} fill="currentColor" /> New Platform 2.0 Available!
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#1a1a1a] leading-[1.1] mb-8 tracking-tight">
                            Verified USA Opportunities <span className="text-yellow-500">just a click away.</span>
                        </h1>
                        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Gellobit connects you with real giveaways, job fairs, and scholarships. No scams, just value verified daily by experts.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button className="w-full sm:w-auto bg-[#FFDE59] text-[#1a1a1a] font-black px-10 py-5 rounded-2xl text-lg hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-100 flex items-center justify-center gap-2">
                                Explore Feed Now <ArrowRight size={20} />
                            </button>
                            <button className="w-full sm:w-auto bg-white border-2 border-slate-100 text-slate-600 font-bold px-10 py-5 rounded-2xl text-lg hover:border-yellow-400 hover:text-[#1a1a1a] transition-all">
                                View Pro Plan
                            </button>
                        </div>
                        {/* Search Mockup */}
                        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 max-w-3xl mx-auto relative group">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-2xl border border-transparent group-focus-within:border-yellow-400 transition-all">
                                    <Search className="text-slate-400 mr-2" size={20} />
                                    <input type="text" placeholder="What are you looking for today?" className="bg-transparent w-full py-4 outline-none font-medium text-slate-700" />
                                </div>
                                <button className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-3xl -z-10"></div>
            </header>

            {/* --- LIST OF OPPORTUNITIES (NEW SECTION) --- */}
            {opportunities.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-black text-[#1a1a1a] mb-8">Latest Opportunities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {opportunities.map((opp) => (
                                <div key={opp.id} className="border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-lg uppercase">{opp.type}</span>
                                        <span className="text-slate-400 text-xs">{new Date(opp.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{opp.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{opp.description}</p>
                                    <div className="mt-auto">
                                        {opp.prize_value && <div className="text-sm font-medium text-green-600 mb-2">Value: {opp.prize_value}</div>}
                                        <a href={opp.source_url} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                                            View Details
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ... Rest of sections (Stats, Features, Pricing, Footer) ... */}
            {/* Copy Stats, Features, Pricing, App Download, Footer from original file */}
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

            {/* --- PRICING SECTION --- */}
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
                            <button className="w-full py-4 rounded-2xl font-bold bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                                Current Plan
                            </button>
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
                            <button className="w-full py-4 rounded-2xl font-black bg-[#FFDE59] text-[#1a1a1a] hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-900/20">
                                Get Pro Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- APP DOWNLOAD SECTION --- */}
            <section className="bg-[#FFDE59] py-20 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black text-[#1a1a1a] mb-6 tracking-tight">
                            Carry opportunities in your pocket.
                        </h2>
                        <p className="text-lg text-[#1a1a1a]/70 font-bold mb-10 max-w-lg">
                            Download the mobile App and never miss a job fair or verified giveaway by not being at your PC.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <button className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
                                <Smartphone size={24} />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold opacity-70 leading-none">Available on</p>
                                    <p className="text-lg font-black leading-none mt-1">Google Play</p>
                                </div>
                            </button>
                            {/* Option for App Store in the future */}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        {/* Mockup of Phone */}
                        <div className="w-[280px] h-[580px] bg-[#1a1a1a] rounded-[50px] border-[10px] border-[#1a1a1a] shadow-2xl mx-auto relative overflow-hidden flex items-center justify-center">
                            <div className="absolute top-0 w-32 h-6 bg-[#1a1a1a] rounded-b-3xl"></div>
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
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl text-[#1a1a1a]">GB</div>
                                <span className="font-black text-2xl tracking-tighter">GelloBit</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Empowering the USA community through verified opportunities and valuable content since 2025.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Explore</h4>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Verified Giveaways</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Job Fairs</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">STEM Scholarships</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Evergreen Guides</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Support</h4>
                            <ul className="space-y-4 text-slate-300 text-sm">
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-yellow-400 transition-colors">FTC Compliance</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-6">Social</h4>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black cursor-pointer transition-all">
                                    <Globe size={18} />
                                </div>
                                {/* Add more social icons if desired */}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                        <p>© 2026 Gellobit.com. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span>Developed with ❤️ for USA</span>
                            <span>v2.0.4-Stable</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
