'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, Check, Calendar, ExternalLink, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface PricingConfig {
    monthlyPrice: number;
    annualPrice: number;
}

export default function MembershipPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile, loading: profileLoading, refreshProfile } = useUser();
    const [pricing, setPricing] = useState<PricingConfig | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const showSuccess = searchParams.get('success') === 'true';

    const isPremium = profile?.membership_type === 'premium';
    const isLifetime = profile?.membership_type === 'lifetime';
    const hasSubscription = isPremium && profile?.paypal_subscription_id;

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/pricing');
                if (res.ok) {
                    const data = await res.json();
                    setPricing(data);
                }
            } catch (err) {
                console.error('Error fetching pricing:', err);
            }
        };

        fetchPricing();
    }, []);

    useEffect(() => {
        // Refresh profile if coming from successful subscription
        if (showSuccess) {
            refreshProfile();
        }
    }, [showSuccess, refreshProfile]);

    const handleCancelSubscription = async () => {
        setCancelling(true);
        setCancelError(null);

        try {
            const res = await fetch('/api/subscription/cancel', {
                method: 'POST',
            });

            if (res.ok) {
                setShowCancelConfirm(false);
                await refreshProfile();
                router.refresh();
            } else {
                const data = await res.json();
                setCancelError(data.error || 'Failed to cancel subscription');
            }
        } catch (err) {
            setCancelError('An error occurred. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-green-800">Welcome to Premium!</p>
                        <p className="text-sm text-green-700">Your subscription is now active. Enjoy all the premium features!</p>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-bold text-slate-900">Membership</h1>
                    <p className="text-slate-600 text-sm mt-1">Manage your subscription and billing</p>
                </div>

                <div className="p-6">
                    {/* Plan Status */}
                    <div className={`rounded-xl p-6 ${
                        isPremium || isLifetime
                            ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-white'
                            : 'bg-slate-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    isPremium || isLifetime ? 'bg-white/20' : 'bg-slate-200'
                                }`}>
                                    <Crown className={`h-6 w-6 ${
                                        isPremium || isLifetime ? 'text-yellow-300' : 'text-slate-400'
                                    }`} />
                                </div>
                                <div>
                                    <h2 className={`font-bold text-lg ${
                                        isPremium || isLifetime ? 'text-white' : 'text-slate-900'
                                    }`}>
                                        {isLifetime ? 'Lifetime' : isPremium ? 'Premium' : 'Free'} Plan
                                    </h2>
                                    {(isPremium || isLifetime) && (
                                        <p className={isPremium || isLifetime ? 'text-slate-300 text-sm' : 'text-slate-600 text-sm'}>
                                            Full access to all features
                                        </p>
                                    )}
                                    {!isPremium && !isLifetime && (
                                        <p className="text-slate-600 text-sm">
                                            Limited access
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isPremium && !isLifetime && (
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Upgrade
                                </button>
                            )}
                        </div>

                        {/* Expiration Date */}
                        {isPremium && profile?.membership_expires_at && (
                            <div className={`mt-4 pt-4 border-t ${
                                isPremium ? 'border-white/20' : 'border-slate-200'
                            }`}>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className={`h-4 w-4 ${isPremium ? 'text-slate-400' : 'text-slate-400'}`} />
                                    <span className={isPremium ? 'text-slate-300' : 'text-slate-600'}>
                                        {hasSubscription ? 'Renews' : 'Expires'} on {formatDate(profile.membership_expires_at)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Premium Features */}
                    {(isPremium || isLifetime) && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-slate-900 mb-3">Your Premium Benefits</h3>
                            <ul className="space-y-2">
                                {[
                                    '100% access to all opportunities',
                                    'Instant access to new content',
                                    'Unlimited saved favorites',
                                    'Unlimited daily notifications',
                                    'Ad-free experience',
                                    'Priority support',
                                ].map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2 text-slate-600">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Free Plan Limitations */}
                    {!isPremium && !isLifetime && pricing && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-slate-900 mb-3">Upgrade to Premium</h3>
                            <p className="text-slate-600 mb-4">
                                Get unlimited access starting at ${pricing.monthlyPrice}/month or save with annual billing at ${pricing.annualPrice}/year.
                            </p>
                            <button
                                onClick={() => router.push('/pricing')}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                            >
                                View Plans
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Management */}
            {hasSubscription && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">Subscription Management</h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* PayPal Management Link */}
                        <a
                            href="https://www.paypal.com/myaccount/autopay"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="font-medium text-slate-900">Manage Payment Method</p>
                                    <p className="text-sm text-slate-500">Update your payment details on PayPal</p>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                        </a>

                        {/* Cancel Subscription */}
                        <div className="pt-4 border-t border-slate-100">
                            {!showCancelConfirm ? (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                    Cancel Subscription
                                </button>
                            ) : (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-red-800">Cancel your subscription?</p>
                                            <p className="text-sm text-red-700 mt-1">
                                                You&apos;ll retain access until {formatDate(profile?.membership_expires_at || null)}. After that, you&apos;ll be downgraded to the free plan.
                                            </p>

                                            {cancelError && (
                                                <p className="text-sm text-red-600 mt-2 font-medium">{cancelError}</p>
                                            )}

                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={handleCancelSubscription}
                                                    disabled={cancelling}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowCancelConfirm(false);
                                                        setCancelError(null);
                                                    }}
                                                    disabled={cancelling}
                                                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50"
                                                >
                                                    Keep Subscription
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Billing History Note */}
            {hasSubscription && (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                    <p>
                        For billing history and receipts, visit your{' '}
                        <a
                            href="https://www.paypal.com/myaccount/transactions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            PayPal account
                        </a>.
                    </p>
                </div>
            )}
        </div>
    );
}
