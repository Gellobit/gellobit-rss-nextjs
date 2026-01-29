'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Script from 'next/script';

interface AdSenseContextValue {
    isLoaded: boolean;
    clientId: string | null;
    isEnabled: boolean;
    initializeAd: (element: HTMLModElement | null) => void;
}

const AdSenseContext = createContext<AdSenseContextValue>({
    isLoaded: false,
    clientId: null,
    isEnabled: false,
    initializeAd: () => {},
});

interface AdSenseProviderProps {
    children: ReactNode;
}

/**
 * Normalizes the AdSense client ID to ensure it has the correct format
 * AdSense panel shows "pub-XXXXX" but the code requires "ca-pub-XXXXX"
 */
function normalizeClientId(clientId: string | null): string | null {
    if (!clientId) return null;

    const trimmed = clientId.trim();
    if (!trimmed) return null;

    // If it already starts with ca-pub-, it's correct
    if (trimmed.startsWith('ca-pub-')) {
        return trimmed;
    }

    // If it starts with pub-, add the ca- prefix
    if (trimmed.startsWith('pub-')) {
        return `ca-${trimmed}`;
    }

    // If it's just numbers, assume it's missing the full prefix
    if (/^\d+$/.test(trimmed)) {
        return `ca-pub-${trimmed}`;
    }

    // Return as-is for any other format
    return trimmed;
}

/**
 * AdSenseProvider
 * Loads the AdSense script once globally and provides context for ad units
 */
export function AdSenseProvider({ children }: AdSenseProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [clientId, setClientId] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [configFetched, setConfigFetched] = useState(false);

    // Fetch AdSense configuration on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const data = await res.json();
                    const normalizedClientId = normalizeClientId(data.adsense_client_id);
                    setClientId(normalizedClientId);
                    setIsEnabled(!!normalizedClientId && !data.manual_banner_enabled);
                }
            } catch (error) {
                console.error('Error fetching AdSense config:', error);
            } finally {
                setConfigFetched(true);
            }
        };

        fetchConfig();
    }, []);

    // Initialize an ad element by pushing to adsbygoogle
    const initializeAd = useCallback((element: HTMLModElement | null) => {
        if (!element || !isLoaded || !clientId) return;

        try {
            // Check if this element has already been initialized
            if (element.dataset.adsbygoogleStatus === 'done') {
                return;
            }

            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            // AdSense errors are common (e.g., ad blockers), don't spam console
            if (process.env.NODE_ENV === 'development') {
                console.warn('AdSense initialization warning:', e);
            }
        }
    }, [isLoaded, clientId]);

    const value: AdSenseContextValue = {
        isLoaded,
        clientId,
        isEnabled,
        initializeAd,
    };

    return (
        <AdSenseContext.Provider value={value}>
            {/* Load AdSense script once globally */}
            {configFetched && clientId && isEnabled && (
                <Script
                    id="adsense-script"
                    async
                    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
                    crossOrigin="anonymous"
                    strategy="lazyOnload"
                    onLoad={() => {
                        setIsLoaded(true);
                        if (process.env.NODE_ENV === 'development') {
                            console.log('AdSense script loaded globally');
                        }
                    }}
                    onError={(e) => {
                        console.error('AdSense script failed to load:', e);
                    }}
                />
            )}
            {children}
        </AdSenseContext.Provider>
    );
}

/**
 * Hook to access AdSense context
 */
export function useAdSense() {
    return useContext(AdSenseContext);
}

/**
 * Hook to check if AdSense is ready
 */
export function useAdSenseReady() {
    const { isLoaded, clientId, isEnabled } = useContext(AdSenseContext);
    return isLoaded && !!clientId && isEnabled;
}
