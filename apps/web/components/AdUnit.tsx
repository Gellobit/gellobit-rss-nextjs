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

interface AdSenseConfig {
    clientId: string | null;
    slotId: string | null;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'horizontal', className = '' }) => {
    const { shouldShowAds, loading: membershipLoading } = useShowAds();
    const [adConfig, setAdConfig] = useState<AdSenseConfig>({ clientId: null, slotId: null });
    const [loaded, setLoaded] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        // Only fetch config if we should show ads
        if (!shouldShowAds || membershipLoading) return;

        // Fetch AdSense configuration
        const fetchAdConfig = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setAdConfig({
                        clientId: data.adsense_client_id || null,
                        slotId: slotId || data.adsense_slot_id || null,
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
        // Initialize ads when config is loaded
        if (adConfig.clientId && adConfig.slotId && loaded && typeof window !== 'undefined') {
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

    const effectiveSlotId = slotId || adConfig.slotId;

    // If no AdSense config, show placeholder
    if (!adConfig.clientId || !effectiveSlotId) {
        const baseStyles = "bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest rounded-xl";
        const dimStyles = format === 'horizontal' ? 'w-full h-24' : format === 'rectangle' ? 'w-[300px] h-[250px]' : 'w-full min-h-[100px]';

        // Only show placeholder if config has loaded (avoid flash)
        if (!configLoaded) return null;

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
