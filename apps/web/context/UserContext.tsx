'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
    shouldShowAds as checkShouldShowAds,
    hasFullContentAccess,
    MembershipLimits,
    DEFAULT_MEMBERSHIP_LIMITS
} from '@/lib/utils/membership';

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    membership_type: string;
    membership_expires_at: string | null;
    role: string;
    created_at: string;
}

interface UserContextType {
    profile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => void;
    clearProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
            } else {
                setProfile(null);
            }
        } catch (error) {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Force refresh profile (used after updates)
    const refreshProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Update profile locally (optimistic update)
    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    // Clear profile (on logout)
    const clearProfile = useCallback(() => {
        setProfile(null);
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return (
        <UserContext.Provider
            value={{
                profile,
                loading,
                isAuthenticated: profile !== null,
                refreshProfile,
                updateProfile,
                clearProfile,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

// Hook for components that only need avatar (lightweight)
export function useUserAvatar() {
    const { profile, loading } = useUser();
    return {
        avatarUrl: profile?.avatar_url || null,
        loading,
    };
}

// Hook to determine if ads should be shown based on membership
export function useShowAds() {
    const { profile, loading } = useUser();

    const shouldShowAds = useMemo(() => {
        // Don't show ads while loading (prevents flash)
        if (loading) return false;

        // Not authenticated = show ads
        if (!profile) return true;

        // Check membership
        return checkShouldShowAds(profile.membership_type, profile.membership_expires_at);
    }, [profile, loading]);

    return {
        shouldShowAds,
        loading,
        membershipType: profile?.membership_type || 'free',
        isPremium: profile?.membership_type === 'premium' || profile?.membership_type === 'lifetime',
    };
}

// Hook to get membership limits and user access status
export function useMembershipAccess() {
    const { profile, loading: profileLoading } = useUser();
    const [limits, setLimits] = useState<MembershipLimits>(DEFAULT_MEMBERSHIP_LIMITS);
    const [limitsLoading, setLimitsLoading] = useState(true);

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const res = await fetch('/api/membership/limits');
                if (res.ok) {
                    const data = await res.json();
                    setLimits(data);
                }
            } catch (error) {
                console.error('Error fetching membership limits:', error);
            }
            setLimitsLoading(false);
        };

        fetchLimits();
    }, []);

    const hasFullAccess = useMemo(() => {
        // If membership system is disabled, everyone has full access
        if (!limits.systemEnabled) return true;

        if (profileLoading) return false;
        if (!profile) return false;
        return hasFullContentAccess(profile.membership_type, profile.membership_expires_at, limits.systemEnabled);
    }, [profile, profileLoading, limits.systemEnabled]);

    return {
        profile,
        limits,
        loading: profileLoading || limitsLoading,
        hasFullAccess,
        membershipType: profile?.membership_type || 'free',
        membershipExpiresAt: profile?.membership_expires_at || null,
        membershipEnabled: limits.systemEnabled,
    };
}
