'use client';

import { useEffect, useState } from 'react';
import { isNativeApp } from '@/lib/utils/platform';

interface AdMobInitializerProps {
  children: React.ReactNode;
  onInitialized?: () => void;
  onError?: (error: string) => void;
}

/**
 * AdMob Initializer Component
 * Must be placed high in the component tree to initialize AdMob SDK
 * before any ads are shown.
 */
export default function AdMobInitializer({
  children,
  onInitialized,
  onError,
}: AdMobInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAdMob = async () => {
      if (!isNativeApp()) {
        setIsInitialized(true);
        return;
      }

      try {
        const { AdMob } = await import('@capacitor-community/admob');

        await AdMob.initialize({
          // Request tracking authorization (iOS 14+)
          initializeForTesting: process.env.NODE_ENV === 'development',
        });

        // Request tracking authorization for iOS
        const { TrackingAuthorizationStatusEnum } = await import('@capacitor-community/admob');
        const status = await AdMob.requestTrackingAuthorization();

        if (process.env.NODE_ENV === 'development') {
          console.log('AdMob initialized');
          console.log('Tracking status:', status.status);
        }

        setIsInitialized(true);
        onInitialized?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AdMob';
        console.error('AdMob initialization error:', err);
        onError?.(errorMessage);
        // Still set initialized to true to not block the app
        setIsInitialized(true);
      }
    };

    initializeAdMob();
  }, [onInitialized, onError]);

  // Always render children - don't block on AdMob initialization
  return <>{children}</>;
}

/**
 * Hook to check AdMob availability
 */
export function useAdMobAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(isNativeApp());
  }, []);

  return isAvailable;
}
