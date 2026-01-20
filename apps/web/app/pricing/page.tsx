'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Crown, Zap, Clock, Heart, Bell, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import PayPalProvider from '@/components/PayPalProvider';
import PayPalSubscribeButton from '@/components/PayPalSubscribeButton';

interface PricingConfig {
    systemEnabled: boolean;
    monthlyPrice: number;
    annualPrice: number;
    paypalEnabled: boolean;
    paypalClientId: string | null;
    paypalPlanIdMonthly: string | null;
    paypalPlanIdAnnual: string | null;
    freeContentPercentage: number;
    freeDelayHours: number;
    freeFavoritesLimit: number;
    freeNotificationsDaily: number;
}

interface Branding {
    appName: string;
    logoUrl: string | null;
}

export default function PricingPage() {
    const router = useRouter();
    const { profile, loading: userLoading, isAuthenticated } = useUser();
    const [pricing, setPricing] = useState<PricingConfig | null>(null);
    const [branding, setBranding] = useState<Branding>({ appName: 'GelloBit', logoUrl: null });
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [processingSubscription, setProcessingSubscription] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPremium = profile?.membership_type === 'premium' || profile?.membership_type === 'lifetime';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pricingRes, brandingRes] = await Promise.all([
                    fetch('/api/pricing'),
                    fetch('/api/branding'),
                ]);

                if (pricingRes.ok) {
                    const pricingData = await pricingRes.json();
                    setPricing(pricingData);
                }

                if (brandingRes.ok) {
                    const brandingData = await brandingRes.json();
                    setBranding(brandingData);
                }
            } catch (err) {
                console.error('Error fetching pricing data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubscriptionSuccess = async (subscriptionId: string) => {
        setProcessingSubscription(true);
        setError(null);

        try {
            const res = await fetch('/api/subscription/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId,
                    planType: selectedPlan,
                }),
            });

            if (res.ok) {
                router.push('/account/membership?success=true');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to activate subscription');
            }
        } catch (err) {
            setError('Failed to activate subscription. Please contact support.');
        } finally {
            setProcessingSubscription(false);
        }
    };

    const handleSubscriptionError = (err: Error) => {
        console.error('PayPal error:', err);
        setError('Payment failed. Please try again.');
    };

    if (loading || userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            </div>
        );
    }

    if (!pricing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Unable to load pricing. Please try again later.</p>
            </div>
        );
    }

    // Show free access message when membership system is disabled
    if (!pricing.systemEnabled) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            All Content is Free!
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Great news! {branding.appName} is currently offering free access to all opportunities.
                            No premium subscription required.
                        </p>
                        <button
                            onClick={() => router.push('/opportunities')}
                            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                        >
                            Browse All Opportunities
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        Premium subscriptions may be available in the future.
                    </p>
                </div>
            </div>
        );
    }

    const annualMonthly = pricing.annualPrice / 12;
    const savingsPercent = Math.round((1 - annualMonthly / pricing.monthlyPrice) * 100);

    const features = [
        {
            name: 'Access to opportunities',
            free: `${pricing.freeContentPercentage}%`,
            premium: '100%',
            icon: Zap,
        },
        {
            name: 'New content access',
            free: `${pricing.freeDelayHours}h delay`,
            premium: 'Instant',
            icon: Clock,
        },
        {
            name: 'Saved favorites',
            free: `${pricing.freeFavoritesLimit} max`,
            premium: 'Unlimited',
            icon: Heart,
        },
        {
            name: 'Daily notifications',
            free: `${pricing.freeNotificationsDaily}`,
            premium: 'Unlimited',
            icon: Bell,
        },
        {
            name: 'Ad-free experience',
            free: false,
            premium: true,
            icon: Check,
        },
        {
            name: 'Priority support',
            free: false,
            premium: true,
            icon: Crown,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Upgrade to {branding.appName} Premium
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Get unlimited access to all opportunities, instant updates, and an ad-free experience.
                    </p>
                </div>

                {/* Already Premium Message */}
                {isPremium && (
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <Crown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-green-800 font-medium">
                            You&apos;re already a Premium member!
                        </p>
                        <button
                            onClick={() => router.push('/account/membership')}
                            className="mt-2 text-green-600 hover:text-green-700 underline"
                        >
                            Manage your subscription
                        </button>
                    </div>
                )}

                {/* Plan Toggle */}
                {!isPremium && (
                    <div className="flex justify-center mb-8">
                        <div className="bg-gray-100 p-1 rounded-full flex">
                            <button
                                onClick={() => setSelectedPlan('monthly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedPlan === 'monthly'
                                        ? 'bg-white text-gray-900 shadow'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setSelectedPlan('annual')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedPlan === 'annual'
                                        ? 'bg-white text-gray-900 shadow'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Annual
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Save {savingsPercent}%
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-gray-900">$0</span>
                            <span className="text-gray-600">/month</span>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Basic access to discover opportunities.
                        </p>
                        <button
                            onClick={() => router.push('/opportunities')}
                            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Continue Free
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                            POPULAR
                        </div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-400" />
                            Premium
                        </h3>
                        <div className="mb-6">
                            {selectedPlan === 'monthly' ? (
                                <>
                                    <span className="text-4xl font-bold">${pricing.monthlyPrice}</span>
                                    <span className="text-slate-400">/month</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl font-bold">${pricing.annualPrice}</span>
                                    <span className="text-slate-400">/year</span>
                                    <p className="text-sm text-slate-400 mt-1">
                                        ${annualMonthly.toFixed(2)}/month billed annually
                                    </p>
                                </>
                            )}
                        </div>
                        <p className="text-slate-300 mb-6">
                            Full access to everything {branding.appName} offers.
                        </p>

                        {/* PayPal Button or Login Prompt */}
                        {!isPremium && (
                            <>
                                {!isAuthenticated ? (
                                    <button
                                        onClick={() => router.push('/auth?redirect=/pricing')}
                                        className="w-full py-3 px-4 bg-yellow-400 text-slate-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
                                    >
                                        Sign in to Subscribe
                                    </button>
                                ) : pricing.paypalEnabled && pricing.paypalClientId ? (
                                    <div className="bg-white rounded-lg p-4">
                                        <PayPalProvider clientId={pricing.paypalClientId}>
                                            <PayPalSubscribeButton
                                                planId={
                                                    selectedPlan === 'monthly'
                                                        ? pricing.paypalPlanIdMonthly!
                                                        : pricing.paypalPlanIdAnnual!
                                                }
                                                onSuccess={handleSubscriptionSuccess}
                                                onError={handleSubscriptionError}
                                                disabled={processingSubscription}
                                            />
                                        </PayPalProvider>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400">
                                        Payment processing is not available yet.
                                    </div>
                                )}
                            </>
                        )}

                        {processingSubscription && (
                            <div className="mt-4 flex items-center justify-center text-slate-300">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Activating your subscription...
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center text-red-700">
                        {error}
                    </div>
                )}

                {/* Feature Comparison */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Compare Plans</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {features.map((feature, index) => (
                            <div key={index} className="grid grid-cols-3 px-8 py-4">
                                <div className="flex items-center gap-3">
                                    <feature.icon className="h-5 w-5 text-gray-400" />
                                    <span className="text-gray-900">{feature.name}</span>
                                </div>
                                <div className="text-center">
                                    {typeof feature.free === 'boolean' ? (
                                        feature.free ? (
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                                        )
                                    ) : (
                                        <span className="text-gray-600">{feature.free}</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    {typeof feature.premium === 'boolean' ? (
                                        feature.premium ? (
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                                        )
                                    ) : (
                                        <span className="text-slate-900 font-medium">{feature.premium}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 px-8 py-4 bg-gray-50 border-t border-gray-200">
                        <div></div>
                        <div className="text-center font-medium text-gray-900">Free</div>
                        <div className="text-center font-medium text-slate-900">Premium</div>
                    </div>
                </div>

                {/* FAQ or Trust Signals */}
                <div className="mt-12 text-center text-gray-600 text-sm">
                    <p>Cancel anytime. No questions asked.</p>
                    <p className="mt-1">Secure payment via PayPal.</p>
                </div>
            </div>
        </div>
    );
}
