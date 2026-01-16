'use client';

import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useUser } from '@/context/UserContext';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                        itp_support?: boolean;
                        use_fedcm_for_prompt?: boolean;
                    }) => void;
                    prompt: (callback?: (notification: {
                        isNotDisplayed: () => boolean;
                        isSkippedMoment: () => boolean;
                        isDismissedMoment: () => boolean;
                        getNotDisplayedReason: () => string;
                        getSkippedReason: () => string;
                        getDismissedReason: () => string;
                    }) => void) => void;
                    cancel: () => void;
                };
            };
        };
    }
}

export default function GoogleOneTap() {
    const { isAuthenticated, loading, refreshProfile } = useUser();
    const supabase = createClientComponentClient();

    const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });

            if (error) {
                console.error('Google One Tap sign in error:', error.message);
                return;
            }

            if (data.user) {
                await refreshProfile();
                window.location.reload();
            }
        } catch (err) {
            console.error('Google One Tap error:', err);
        }
    }, [supabase, refreshProfile]);

    useEffect(() => {
        // Don't show One Tap if user is already authenticated or still loading
        if (loading || isAuthenticated) return;

        // Check if One Tap is enabled (disabled by default until Google app is verified)
        const oneTapEnabled = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP_ENABLED === 'true';
        if (!oneTapEnabled) return;

        // One Tap works best in Chrome. Skip for browsers that block third-party cookies
        const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg|Brave/.test(navigator.userAgent);
        if (!isChrome) return;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const initializeOneTap = () => {
            if (!window.google) return;

            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false, // Disable auto-select to avoid FedCM issues
                    cancel_on_tap_outside: true,
                    itp_support: true,
                    use_fedcm_for_prompt: true,
                });

                window.google.accounts.id.prompt();
            } catch (err) {
                console.error('[One Tap] Init error:', err);
            }
        };

        // Check if script is already loaded
        if (window.google?.accounts?.id) {
            initializeOneTap();
            return;
        }

        // Load the Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeOneTap;
        document.head.appendChild(script);

        return () => {
            // Cancel One Tap on cleanup
            if (window.google?.accounts?.id) {
                window.google.accounts.id.cancel();
            }
        };
    }, [loading, isAuthenticated, handleCredentialResponse]);

    // This component doesn't render anything visible
    return null;
}
