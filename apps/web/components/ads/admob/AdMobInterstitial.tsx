'use client';

import { useEffect, useCallback, useRef } from 'react';
import { isNativeApp } from '@/lib/utils/platform';

interface AdMobInterstitialProps {
  adUnitId: string;
  autoShow?: boolean;
  onAdLoaded?: () => void;
  onAdShowed?: () => void;
  onAdDismissed?: () => void;
  onAdFailed?: (error: string) => void;
}

/**
 * AdMob Interstitial Component for Native Apps
 * Uses @capacitor-community/admob plugin
 *
 * Interstitial ads are full-screen ads that cover the interface.
 * Use sparingly to maintain good UX.
 */
export default function AdMobInterstitial({
  adUnitId,
  autoShow = false,
  onAdLoaded,
  onAdShowed,
  onAdDismissed,
  onAdFailed,
}: AdMobInterstitialProps) {
  const isLoadedRef = useRef(false);

  const prepareInterstitial = useCallback(async () => {
    if (!isNativeApp()) return;

    try {
      const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

      // Set up event listeners
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        isLoadedRef.current = true;
        onAdLoaded?.();
        if (autoShow) {
          AdMob.showInterstitial();
        }
      });

      AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
        onAdShowed?.();
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        isLoadedRef.current = false;
        onAdDismissed?.();
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (info: { message: string }) => {
        onAdFailed?.(info.message);
      });

      // Prepare the interstitial
      await AdMob.prepareInterstitial({
        adId: adUnitId,
        isTesting: process.env.NODE_ENV === 'development',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to prepare interstitial';
      onAdFailed?.(errorMessage);
      console.error('AdMob Interstitial Error:', err);
    }
  }, [adUnitId, autoShow, onAdLoaded, onAdShowed, onAdDismissed, onAdFailed]);

  useEffect(() => {
    prepareInterstitial();

    // Cleanup listeners on unmount
    return () => {
      if (isNativeApp()) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.removeAllListeners();
        });
      }
    };
  }, [prepareInterstitial]);

  // This component doesn't render anything - interstitials are shown programmatically
  return null;
}

/**
 * Hook for programmatic interstitial control
 */
export function useAdMobInterstitial(adUnitId: string) {
  const isLoadedRef = useRef(false);
  const callbacksRef = useRef<{
    onShowed?: () => void;
    onDismissed?: () => void;
  }>({});

  const prepare = useCallback(async () => {
    if (!isNativeApp()) return;

    try {
      const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

      // Remove existing listeners first
      await AdMob.removeAllListeners();

      // Set up event listeners
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        isLoadedRef.current = true;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
        callbacksRef.current.onShowed?.();
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        isLoadedRef.current = false;
        callbacksRef.current.onDismissed?.();
        // Prepare next interstitial
        prepare();
      });

      await AdMob.prepareInterstitial({
        adId: adUnitId,
        isTesting: process.env.NODE_ENV === 'development',
      });
    } catch (err) {
      console.error('AdMob Interstitial Prepare Error:', err);
    }
  }, [adUnitId]);

  const show = useCallback(
    async (callbacks?: { onShowed?: () => void; onDismissed?: () => void }) => {
      if (!isNativeApp()) return false;

      if (callbacks) {
        callbacksRef.current = callbacks;
      }

      if (!isLoadedRef.current) {
        console.warn('Interstitial not ready yet');
        return false;
      }

      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.showInterstitial();
        return true;
      } catch (err) {
        console.error('AdMob Interstitial Show Error:', err);
        return false;
      }
    },
    []
  );

  const isReady = () => isLoadedRef.current;

  useEffect(() => {
    prepare();

    return () => {
      if (isNativeApp()) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.removeAllListeners();
        });
      }
    };
  }, [prepare]);

  return { prepare, show, isReady };
}
