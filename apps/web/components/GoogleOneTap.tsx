'use client';

import { useEffect, useCallback, useRef } from 'react';
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
                        context?: 'signin' | 'signup' | 'use';
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
                    disableAutoSelect: () => void;
                };
            };
        };
    }
}

export default function GoogleOneTap() {
    const { isAuthenticated, loading, refreshProfile } = useUser();
    const supabase = createClientComponentClient();
    const initializedRef = useRef(false);
    const promptShownRef = useRef(false);

    const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
        console.log('[One Tap] Credential received, signing in...');

        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });

            if (error) {
                console.error('[One Tap] Sign in error:', error.message);
                return;
            }

            if (data.user) {
                console.log('[One Tap] Sign in successful');
                await refreshProfile();
                window.location.reload();
            }
        } catch (err) {
            console.error('[One Tap] Error:', err);
        }
    }, [supabase, refreshProfile]);

    useEffect(() => {
        // Don't show One Tap if user is already authenticated or still loading
        if (loading || isAuthenticated) {
            return;
        }

        // Prevent double initialization
        if (initializedRef.current) {
            return;
        }

        // Don't show One Tap in Capacitor/native app (different origin)
        const isCapacitor = typeof window !== 'undefined' &&
            (window.location.protocol === 'capacitor:' ||
             window.location.hostname !== 'localhost' && window.location.hostname !== 'gellobit.com' && window.location.hostname !== 'www.gellobit.com');
        if (isCapacitor) {
            console.log('[One Tap] Disabled in Capacitor app');
            return;
        }

        // Check if One Tap is enabled
        const oneTapEnabled = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP_ENABLED === 'true';
        if (!oneTapEnabled) {
            return;
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.warn('[One Tap] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
            return;
        }

        const initializeOneTap = () => {
            if (!window.google?.accounts?.id) {
                console.warn('[One Tap] Google Identity Services not loaded');
                return;
            }

            if (initializedRef.current) {
                return;
            }

            try {
                console.log('[One Tap] Initializing...');

                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    itp_support: true,
                    // Disable FedCM to avoid AbortError on dismiss
                    use_fedcm_for_prompt: false,
                    context: 'signin',
                });

                initializedRef.current = true;

                // Only show prompt once per session
                if (!promptShownRef.current) {
                    promptShownRef.current = true;

                    window.google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed()) {
                            const reason = notification.getNotDisplayedReason();
                            console.log('[One Tap] Not displayed:', reason);
                            // Common reasons: browser_not_supported, invalid_client,
                            // missing_client_id, opt_out_or_no_session, secure_http_required,
                            // suppressed_by_user, unregistered_origin
                        } else if (notification.isSkippedMoment()) {
                            const reason = notification.getSkippedReason();
                            console.log('[One Tap] Skipped:', reason);
                            // Common reasons: auto_cancel, user_cancel, tap_outside
                        } else if (notification.isDismissedMoment()) {
                            const reason = notification.getDismissedReason();
                            console.log('[One Tap] Dismissed:', reason);
                            // Common reasons: credential_returned, cancel_called, flow_restarted
                        }
                    });
                }
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
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            // Script exists, wait for it to load
            existingScript.addEventListener('load', initializeOneTap);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeOneTap;
        script.onerror = () => {
            console.error('[One Tap] Failed to load Google Identity Services script');
        };
        document.head.appendChild(script);

        return () => {
            // Cancel One Tap on cleanup
            try {
                if (window.google?.accounts?.id) {
                    window.google.accounts.id.cancel();
                }
            } catch {
                // Ignore errors during cleanup
            }
        };
    }, [loading, isAuthenticated, handleCredentialResponse]);

    // This component doesn't render anything visible
    return null;
}
