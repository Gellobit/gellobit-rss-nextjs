'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
    const [hasFetched, setHasFetched] = useState(false);

    const fetchProfile = useCallback(async () => {
        // Don't re-fetch if we already have data (unless explicitly refreshing)
        if (hasFetched && profile !== null) {
            return;
        }

        try {
            const res = await fetch('/api/user/profile');
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
            setHasFetched(true);
        }
    }, [hasFetched, profile]);

    // Force refresh profile (used after updates)
    const refreshProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile');
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
        setHasFetched(false);
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);

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
