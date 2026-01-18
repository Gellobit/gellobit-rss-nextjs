'use client';

import React from 'react';
import { useAds, AdUnitConfig } from '@/lib/contexts/AdContext';
import LazyAdUnit from '../LazyAdUnit';
import { AdMobBanner } from './admob';

type AdFormat = 'horizontal' | 'vertical' | 'rectangle' | 'auto';
type AdMobSize = 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD' | 'ADAPTIVE_BANNER';

interface UnifiedAdUnitProps {
  position: string;
  // Fallback values if not in AdProvider context
  adsenseSlotId?: string;
  admobUnitId?: string;
  // Display options
  format?: AdFormat;
  admobSize?: AdMobSize;
  className?: string;
  rootMargin?: string;
  // Callbacks
  onLoad?: () => void;
  onError?: (error: string) => void;
}

/**
 * Map AdSense format to AdMob size
 */
function formatToAdMobSize(format: AdFormat): AdMobSize {
  switch (format) {
    case 'horizontal':
      return 'BANNER';
    case 'vertical':
      return 'MEDIUM_RECTANGLE';
    case 'rectangle':
      return 'MEDIUM_RECTANGLE';
    case 'auto':
    default:
      return 'ADAPTIVE_BANNER';
  }
}

/**
 * UnifiedAdUnit
 * Renders either AdSense or AdMob ad based on platform
 */
export default function UnifiedAdUnit({
  position,
  adsenseSlotId,
  admobUnitId,
  format = 'auto',
  admobSize,
  className = '',
  rootMargin = '200px',
  onLoad,
  onError,
}: UnifiedAdUnitProps) {
  const adsContext = useAds();

  // Don't show ads if premium user or ads disabled
  if (!adsContext.shouldShowAds) {
    return null;
  }

  // Get configuration for this position
  const positionConfig = adsContext.getAdUnit(position as keyof typeof adsContext.config.positions);

  // Native app - use AdMob
  if (adsContext.isNative) {
    const unitId = positionConfig?.admob?.unitId || admobUnitId;

    if (!unitId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`No AdMob unit ID for position: ${position}`);
      }
      return null;
    }

    const size = positionConfig?.admob?.size || admobSize || formatToAdMobSize(format);

    return (
      <AdMobBanner
        adUnitId={unitId}
        size={size}
        className={className}
        onAdLoaded={onLoad}
        onAdFailed={onError}
      />
    );
  }

  // Web - use AdSense (lazy loaded)
  const slotId = positionConfig?.adsense?.slotId || adsenseSlotId;
  const adFormat = positionConfig?.adsense?.format || format;

  return (
    <LazyAdUnit
      slotId={slotId}
      format={adFormat}
      position={position}
      className={className}
      rootMargin={rootMargin}
    />
  );
}

/**
 * Wrapper that provides context-aware ad rendering
 * Use this when you need to conditionally render based on ad availability
 */
interface AdSlotProps {
  position: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  adsenseSlotId?: string;
  admobUnitId?: string;
  format?: AdFormat;
  admobSize?: AdMobSize;
  className?: string;
}

export function AdSlot({
  position,
  children,
  fallback,
  adsenseSlotId,
  admobUnitId,
  format = 'auto',
  admobSize,
  className = '',
}: AdSlotProps) {
  const adsContext = useAds();

  if (!adsContext.shouldShowAds) {
    return fallback ? <>{fallback}</> : null;
  }

  if (children) {
    return <>{children}</>;
  }

  return (
    <UnifiedAdUnit
      position={position}
      adsenseSlotId={adsenseSlotId}
      admobUnitId={admobUnitId}
      format={format}
      admobSize={admobSize}
      className={className}
    />
  );
}
