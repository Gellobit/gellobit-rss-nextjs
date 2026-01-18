'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useShowAds } from '@/context/UserContext';
import Script from 'next/script';
import Link from 'next/link';

interface LazyAdUnitProps {
    slotId?: string;
    format?: 'horizontal' | 'rectangle' | 'vertical' | 'auto';
    className?: string;
    position?: string; // For analytics/tracking: 'post_after_first', 'post_middle', 'post_bottom', etc.
    rootMargin?: string; // How far before the ad enters viewport to start loading
    showUpgradeLink?: boolean;
}

interface AdConfig {
    clientId: string | null;
    slotId: string | null;
    manualBannerEnabled: boolean;
    manualBannerImageUrl: string | null;
    manualBannerTargetUrl: string | null;
}

export default function LazyAdUnit({
    slotId,
    format = 'horizontal',
    className = '',
    position = 'default',
    rootMargin = '200px', // Start loading 200px before it enters viewport
    showUpgradeLink = true,
}: LazyAdUnitProps) {
    const { shouldShowAds, loading: membershipLoading } = useShowAds();
    const [isVisible, setIsVisible] = useState(false);
    const [adConfig, setAdConfig] = useState<AdConfig>({
        clientId: null,
        slotId: null,
        manualBannerEnabled: false,
        manualBannerImageUrl: null,
        manualBannerTargetUrl: null,
    });
    const [configLoaded, setConfigLoaded] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [adInitialized, setAdInitialized] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const adRef = useRef<HTMLModElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!shouldShowAds || membershipLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect(); // Stop observing once visible
                    }
                });
            },
            {
                rootMargin,
                threshold: 0,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [shouldShowAds, membershipLoading, rootMargin]);

    // Fetch ad configuration only when visible
    useEffect(() => {
        if (!isVisible || !shouldShowAds || membershipLoading) return;

        const fetchAdConfig = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setAdConfig({
                        clientId: data.adsense_client_id || null,
                        slotId: slotId || data.adsense_slot_id || null,
                        manualBannerEnabled: data.manual_banner_enabled === true,
                        manualBannerImageUrl: data.manual_banner_image_url || null,
                        manualBannerTargetUrl: data.manual_banner_target_url || null,
                    });
                }
            } catch (error) {
                console.error('Error fetching ad config:', error);
            } finally {
                setConfigLoaded(true);
            }
        };

        fetchAdConfig();
    }, [isVisible, slotId, shouldShowAds, membershipLoading]);

    // Initialize AdSense ad after script loads
    const initializeAd = useCallback(() => {
        if (
            !adConfig.manualBannerEnabled &&
            adConfig.clientId &&
            adConfig.slotId &&
            scriptLoaded &&
            !adInitialized &&
            adRef.current &&
            typeof window !== 'undefined'
        ) {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdInitialized(true);
            } catch (e) {
                console.error('AdSense initialization error:', e);
            }
        }
    }, [adConfig, scriptLoaded, adInitialized]);

    useEffect(() => {
        initializeAd();
    }, [initializeAd]);

    // Don't render anything for premium users
    if (!shouldShowAds || membershipLoading) {
        return null;
    }

    // Placeholder while not visible (for layout stability)
    if (!isVisible) {
        return (
            <div
                ref={containerRef}
                className={`my-6 ${className}`}
                data-ad-position={position}
            >
                <div className={getPlaceholderStyles(format)} />
            </div>
        );
    }

    // Loading state while fetching config
    if (!configLoaded) {
        return (
            <div
                ref={containerRef}
                className={`my-6 ${className}`}
                data-ad-position={position}
            >
                <div className={`${getPlaceholderStyles(format)} animate-pulse`} />
            </div>
        );
    }

    // Manual banner override
    if (adConfig.manualBannerEnabled && adConfig.manualBannerImageUrl) {
        return (
            <div
                ref={containerRef}
                className={`my-6 ${className}`}
                data-ad-position={position}
            >
                <a
                    href={adConfig.manualBannerTargetUrl || '#'}
                    target="_blank"
                    rel="noopener sponsored"
                    className="block"
                >
                    <img
                        src={adConfig.manualBannerImageUrl}
                        alt="Advertisement"
                        className="w-full h-auto rounded-xl hover:opacity-90 transition-opacity"
                        loading="lazy"
                    />
                </a>
                {showUpgradeLink && (
                    <div className="text-center mt-2">
                        <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                            Upgrade to Premium to remove ads
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    const effectiveSlotId = slotId || adConfig.slotId;

    // No AdSense config - show placeholder
    if (!adConfig.clientId || !effectiveSlotId) {
        return (
            <div
                ref={containerRef}
                className={`my-6 ${className}`}
                data-ad-position={position}
            >
                <div className={`${getPlaceholderStyles(format)} flex items-center justify-center`}>
                    <span className="text-gray-400 text-xs uppercase tracking-widest">Ad Space</span>
                </div>
                {showUpgradeLink && (
                    <div className="text-center mt-2">
                        <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                            Upgrade to Premium to remove ads
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    // Render AdSense ad
    return (
        <div
            ref={containerRef}
            className={`my-6 ${className}`}
            data-ad-position={position}
        >
            {/* Load AdSense script */}
            <Script
                async
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`}
                crossOrigin="anonymous"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
            />

            {/* AdSense ad container */}
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={getAdStyle(format)}
                data-ad-client={adConfig.clientId}
                data-ad-slot={effectiveSlotId}
                data-ad-format={getDataAdFormat(format)}
                data-full-width-responsive={format === 'auto' ? 'true' : 'false'}
            />

            {showUpgradeLink && (
                <div className="text-center mt-2">
                    <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Upgrade to Premium to remove ads
                    </Link>
                </div>
            )}
        </div>
    );
}

// Helper functions
function getPlaceholderStyles(format: string): string {
    const baseStyles = 'bg-gray-100 border border-gray-200 rounded-xl';
    switch (format) {
        case 'horizontal':
            return `${baseStyles} w-full h-24`;
        case 'rectangle':
            return `${baseStyles} w-[300px] h-[250px] mx-auto`;
        case 'vertical':
            return `${baseStyles} w-[160px] h-[600px] mx-auto`;
        case 'auto':
        default:
            return `${baseStyles} w-full min-h-[100px]`;
    }
}

function getAdStyle(format: string): React.CSSProperties {
    switch (format) {
        case 'horizontal':
            return { display: 'block', width: '100%', height: '90px' };
        case 'rectangle':
            return { display: 'block', width: '300px', height: '250px', margin: '0 auto' };
        case 'vertical':
            return { display: 'block', width: '160px', height: '600px', margin: '0 auto' };
        case 'auto':
        default:
            return { display: 'block' };
    }
}

function getDataAdFormat(format: string): string {
    switch (format) {
        case 'horizontal':
            return 'horizontal';
        case 'rectangle':
            return 'rectangle';
        case 'vertical':
            return 'vertical';
        case 'auto':
        default:
            return 'auto';
    }
}
