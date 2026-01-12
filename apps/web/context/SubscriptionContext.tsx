"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type PlanTier = 'free' | 'pro';

interface SubscriptionContextType {
    tier: PlanTier;
    isPro: boolean;
    upgradeToPro: () => void;
    downgradeToFree: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [tier, setTier] = useState<PlanTier>('free');

    // TODO: Sync with Supabase Auth profile
    const upgradeToPro = () => setTier('pro');
    const downgradeToFree = () => setTier('free');

    const value = {
        tier,
        isPro: tier === 'pro',
        upgradeToPro,
        downgradeToFree,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
