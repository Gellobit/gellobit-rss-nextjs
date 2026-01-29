"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useShowAds } from '@/context/UserContext';
import { useAdSense } from '@/components/ads/AdSenseProvider';
import Link from 'next/link';

interface AdUnitProps {
    slotId?: string;
    format?: 'horizontal' | 'rectangle' | 'auto';
    className?: string;
}

interface SlotConfig {
    slotId: string | null;
    manualBannerEnabled: boolean;
    manualBannerImageUrl: string | null;
    manualBannerTargetUrl: string | null;
}

/**
 * Normalizes the AdSense client ID to ensure it has the correct format
 */
function normalizeClientId(clientId: string | null): string | null {
    if (!clientId) return null;
    const trimmed = clientId.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('ca-pub-')) return trimmed;
    if (trimmed.startsWith('pub-')) return `ca-${trimmed}`;
    if (/^\d+$/.test(trimmed)) return `ca-pub-${trimmed}`;
    return trimmed;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'horizontal', className = '' }) => {
    const { shouldShowAds, loading: membershipLoading } = useShowAds();
    const { isLoaded: adsenseLoaded, clientId: globalClientId, initializeAd } = useAdSense();

    const [slotConfig, setSlotConfig] = useState<SlotConfig>({
        slotId: null,
        manualBannerEnabled: false,
        manualBannerImageUrl: null,
        manualBannerTargetUrl: null,
    });
    const [configLoaded, setConfigLoaded] = useState(false);
    const [adInitialized, setAdInitialized] = useState(false);
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        // Only fetch config if we should show ads
        if (!shouldShowAds || membershipLoading) return;

        // Fetch ad configuration
        const fetchAdConfig = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setSlotConfig({
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

    // Initialize AdSense ad when everything is ready
    useEffect(() => {
        if (
            !slotConfig.manualBannerEnabled &&
            globalClientId &&
            slotConfig.slotId &&
            adsenseLoaded &&
            configLoaded &&
            !adInitialized &&
            adRef.current
        ) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                initializeAd(adRef.current);
                setAdInitialized(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [slotConfig, globalClientId, adsenseLoaded, configLoaded, adInitialized, initializeAd]);

    // Don't render anything for premium users or while loading
    if (!shouldShowAds || membershipLoading) {
        return null;
    }

    // Don't show anything until config is loaded
    if (!configLoaded) {
        return null;
    }

    // Render manual banner if enabled
    if (slotConfig.manualBannerEnabled && slotConfig.manualBannerImageUrl) {
        return (
            <div className={`my-6 ${className}`}>
                <a
                    href={slotConfig.manualBannerTargetUrl || '#'}
                    target="_blank"
                    rel="noopener sponsored"
                    className="block"
                >
                    <img
                        src={slotConfig.manualBannerImageUrl}
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

    const effectiveSlotId = slotId || slotConfig.slotId;
    const effectiveClientId = normalizeClientId(globalClientId);

    // If no AdSense config, show placeholder
    if (!effectiveClientId || !effectiveSlotId) {
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
            {/* AdSense ad container - script is loaded globally by AdSenseProvider */}
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={getAdStyle()}
                data-ad-client={effectiveClientId}
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
