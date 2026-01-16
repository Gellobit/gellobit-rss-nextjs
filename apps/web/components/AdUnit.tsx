"use client";

import React, { useEffect, useState } from 'react';
import { useShowAds } from '@/context/UserContext';
import Script from 'next/script';
import Link from 'next/link';

interface AdUnitProps {
    slotId?: string;
    format?: 'horizontal' | 'rectangle' | 'auto';
    className?: string;
}

interface AdConfig {
    // AdSense
    clientId: string | null;
    slotId: string | null;
    // Manual Banner
    manualBannerEnabled: boolean;
    manualBannerImageUrl: string | null;
    manualBannerTargetUrl: string | null;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'horizontal', className = '' }) => {
    const { shouldShowAds, loading: membershipLoading } = useShowAds();
    const [adConfig, setAdConfig] = useState<AdConfig>({
        clientId: null,
        slotId: null,
        manualBannerEnabled: false,
        manualBannerImageUrl: null,
        manualBannerTargetUrl: null,
    });
    const [loaded, setLoaded] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        // Only fetch config if we should show ads
        if (!shouldShowAds || membershipLoading) return;

        // Fetch ad configuration
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
    }, [slotId, shouldShowAds, membershipLoading]);

    useEffect(() => {
        // Initialize AdSense ads when config is loaded (only if not using manual banner)
        if (!adConfig.manualBannerEnabled && adConfig.clientId && adConfig.slotId && loaded && typeof window !== 'undefined') {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('AdSense error:', e);
            }
        }
    }, [adConfig, loaded]);

    // Don't render anything for premium users or while loading
    if (!shouldShowAds || membershipLoading) {
        return null;
    }

    // Don't show anything until config is loaded
    if (!configLoaded) {
        return null;
    }

    // Render manual banner if enabled
    if (adConfig.manualBannerEnabled && adConfig.manualBannerImageUrl) {
        return (
            <div className={`my-6 ${className}`}>
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
                    />
                </a>
                <div className="text-center mt-2">
                    <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Upgrade to Premium to remove ads
                    </Link>
                </div>
            </div>
        );
    }

    const effectiveSlotId = slotId || adConfig.slotId;

    // If no AdSense config, show placeholder
    if (!adConfig.clientId || !effectiveSlotId) {
        const baseStyles = "bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest rounded-xl";
        const dimStyles = format === 'horizontal' ? 'w-full h-24' : format === 'rectangle' ? 'w-[300px] h-[250px]' : 'w-full min-h-[100px]';

        return (
            <div className={`my-6 ${className}`}>
                <div className={`${baseStyles} ${dimStyles} relative overflow-hidden`}>
                    <span className="relative z-10">Ad Space</span>
                </div>
                <div className="text-center mt-2">
                    <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Upgrade to Premium to remove ads
                    </Link>
                </div>
            </div>
        );
    }

    // Determine ad format and responsive behavior
    const getAdStyle = () => {
        switch (format) {
            case 'horizontal':
                return { display: 'block', width: '100%', height: '90px' };
            case 'rectangle':
                return { display: 'block', width: '300px', height: '250px' };
            case 'auto':
            default:
                return { display: 'block' };
        }
    };

    const getDataAdFormat = () => {
        switch (format) {
            case 'horizontal':
                return 'horizontal';
            case 'rectangle':
                return 'rectangle';
            case 'auto':
            default:
                return 'auto';
        }
    };

    return (
        <div className={`my-6 ${className}`}>
            {/* Load AdSense script once */}
            <Script
                async
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`}
                crossOrigin="anonymous"
                strategy="lazyOnload"
                onLoad={() => setLoaded(true)}
            />

            {/* Ad container */}
            <ins
                className="adsbygoogle"
                style={getAdStyle()}
                data-ad-client={adConfig.clientId}
                data-ad-slot={effectiveSlotId}
                data-ad-format={getDataAdFormat()}
                data-full-width-responsive={format === 'auto' ? 'true' : 'false'}
            />

            <div className="text-center mt-2">
                <Link href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                    Upgrade to Premium to remove ads
                </Link>
            </div>
        </div>
    );
};

export default AdUnit;
