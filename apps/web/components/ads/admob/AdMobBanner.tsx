'use client';

import { useEffect, useState, useCallback } from 'react';
import { isNativeApp } from '@/lib/utils/platform';

type BannerSize = 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD' | 'ADAPTIVE_BANNER';

interface AdMobBannerProps {
  adUnitId: string;
  size?: BannerSize;
  position?: 'top' | 'bottom';
  className?: string;
  onAdLoaded?: () => void;
  onAdFailed?: (error: string) => void;
}

/**
 * AdMob Banner Component for Native Apps
 * Uses @capacitor-community/admob plugin
 *
 * Banner sizes:
 * - BANNER: 320x50
 * - LARGE_BANNER: 320x100
 * - MEDIUM_RECTANGLE: 300x250
 * - FULL_BANNER: 468x60
 * - LEADERBOARD: 728x90
 * - ADAPTIVE_BANNER: Adaptive width
 */
export default function AdMobBanner({
  adUnitId,
  size = 'BANNER',
  position = 'bottom',
  className = '',
  onAdLoaded,
  onAdFailed,
}: AdMobBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showBanner = useCallback(async () => {
    if (!isNativeApp()) {
      setError('Not in native app context');
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

      // Map size string to BannerAdSize enum
      const sizeMap: Record<BannerSize, BannerAdSize> = {
        BANNER: BannerAdSize.BANNER,
        LARGE_BANNER: BannerAdSize.LARGE_BANNER,
        MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE,
        FULL_BANNER: BannerAdSize.FULL_BANNER,
        LEADERBOARD: BannerAdSize.LEADERBOARD,
        ADAPTIVE_BANNER: BannerAdSize.ADAPTIVE_BANNER,
      };

      // Map position string to BannerAdPosition enum
      const positionMap: Record<string, BannerAdPosition> = {
        top: BannerAdPosition.TOP_CENTER,
        bottom: BannerAdPosition.BOTTOM_CENTER,
      };

      const options = {
        adId: adUnitId,
        adSize: sizeMap[size],
        position: positionMap[position],
        margin: 0,
        isTesting: process.env.NODE_ENV === 'development',
      };

      await AdMob.showBanner(options);
      setIsLoaded(true);
      onAdLoaded?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load banner ad';
      setError(errorMessage);
      onAdFailed?.(errorMessage);
      console.error('AdMob Banner Error:', err);
    }
  }, [adUnitId, size, position, onAdLoaded, onAdFailed]);

  useEffect(() => {
    showBanner();

    // Cleanup: Hide banner when component unmounts
    return () => {
      if (isNativeApp()) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.hideBanner().catch(console.error);
        });
      }
    };
  }, [showBanner]);

  // This component doesn't render anything visible on its own
  // The banner is rendered natively by AdMob SDK
  if (error) {
    return null;
  }

  // Placeholder for layout purposes (optional)
  if (!isLoaded) {
    return (
      <div
        className={`admob-banner-placeholder ${className}`}
        style={{
          height: size === 'BANNER' ? 50 : size === 'LARGE_BANNER' ? 100 : size === 'MEDIUM_RECTANGLE' ? 250 : 50,
        }}
      />
    );
  }

  return null;
}

/**
 * Hook for programmatic banner control
 */
export function useAdMobBanner() {
  const showBanner = async (options: {
    adUnitId: string;
    size?: BannerSize;
    position?: 'top' | 'bottom';
  }) => {
    if (!isNativeApp()) return;

    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

    const sizeMap: Record<BannerSize, BannerAdSize> = {
      BANNER: BannerAdSize.BANNER,
      LARGE_BANNER: BannerAdSize.LARGE_BANNER,
      MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE,
      FULL_BANNER: BannerAdSize.FULL_BANNER,
      LEADERBOARD: BannerAdSize.LEADERBOARD,
      ADAPTIVE_BANNER: BannerAdSize.ADAPTIVE_BANNER,
    };

    await AdMob.showBanner({
      adId: options.adUnitId,
      adSize: sizeMap[options.size || 'BANNER'],
      position: options.position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      isTesting: process.env.NODE_ENV === 'development',
    });
  };

  const hideBanner = async () => {
    if (!isNativeApp()) return;
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.hideBanner();
  };

  const resumeBanner = async () => {
    if (!isNativeApp()) return;
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.resumeBanner();
  };

  return { showBanner, hideBanner, resumeBanner };
}
