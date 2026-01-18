'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAdProvider, isNativeApp, Platform, getPlatform } from '@/lib/utils/platform';

/**
 * Ad unit configuration for different positions
 */
export interface AdUnitConfig {
  // AdSense slot IDs (web)
  adsense?: {
    slotId: string;
    format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  };
  // AdMob unit IDs (native)
  admob?: {
    unitId: string;
    size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD' | 'ADAPTIVE_BANNER';
  };
}

/**
 * Ad configuration for all positions
 */
export interface AdConfig {
  // Global settings
  enabled: boolean;
  adsensePublisherId?: string; // ca-pub-XXXXXXXXXXXXXXXX

  // Position-specific configurations
  positions: {
    // Sticky mobile banner
    stickyAnchor?: AdUnitConfig;
    // Sidebar ads
    sidebar?: AdUnitConfig;
    stickySidebar?: AdUnitConfig;
    // Content ads
    belowTitle?: AdUnitConfig;
    inContent?: AdUnitConfig;
    endOfPost?: AdUnitConfig;
    afterCTA?: AdUnitConfig;
    // Interstitials
    exitInterstitial?: AdUnitConfig;
  };
}

interface AdContextValue {
  // Current platform
  platform: Platform;
  adProvider: 'adsense' | 'admob';
  isNative: boolean;

  // User status
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;

  // Configuration
  config: AdConfig | null;
  isLoading: boolean;

  // Helpers
  getAdUnit: (position: keyof AdConfig['positions']) => AdUnitConfig | null;
  shouldShowAds: boolean;
}

const defaultConfig: AdConfig = {
  enabled: true,
  positions: {},
};

const AdContext = createContext<AdContextValue | null>(null);

interface AdProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AdConfig>;
  isPremiumUser?: boolean;
}

/**
 * AdProvider
 * Provides unified ad context for both AdSense (web) and AdMob (native)
 */
export function AdProvider({ children, initialConfig, isPremiumUser = false }: AdProviderProps) {
  const [platform, setPlatform] = useState<Platform>('web');
  const [adProvider, setAdProvider] = useState<'adsense' | 'admob'>('adsense');
  const [isNative, setIsNative] = useState(false);
  const [isPremium, setIsPremium] = useState(isPremiumUser);
  const [config, setConfig] = useState<AdConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect platform on mount
  useEffect(() => {
    const detectedPlatform = getPlatform();
    const provider = getAdProvider();
    const native = isNativeApp();

    setPlatform(detectedPlatform);
    setAdProvider(provider);
    setIsNative(native);

    if (process.env.NODE_ENV === 'development') {
      console.log('Ad Provider initialized:', {
        platform: detectedPlatform,
        provider,
        isNative: native,
      });
    }
  }, []);

  // Load ad configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // If initial config provided, use it
        if (initialConfig) {
          setConfig({ ...defaultConfig, ...initialConfig });
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from API
        const response = await fetch('/api/ads/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        } else {
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Failed to load ad config:', error);
        setConfig(defaultConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [initialConfig]);

  // Update premium status when prop changes
  useEffect(() => {
    setIsPremium(isPremiumUser);
  }, [isPremiumUser]);

  // Get ad unit for a specific position
  const getAdUnit = (position: keyof AdConfig['positions']): AdUnitConfig | null => {
    if (!config?.positions) return null;
    return config.positions[position] || null;
  };

  // Determine if ads should be shown
  const shouldShowAds = !isPremium && config?.enabled === true;

  const value: AdContextValue = {
    platform,
    adProvider,
    isNative,
    isPremium,
    setIsPremium,
    config,
    isLoading,
    getAdUnit,
    shouldShowAds,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

/**
 * Hook to access ad context
 */
export function useAds() {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

/**
 * Hook to check if ads should be shown
 */
export function useShouldShowAds() {
  const context = useContext(AdContext);
  // If not in provider, default to showing ads
  if (!context) return true;
  return context.shouldShowAds;
}

/**
 * Hook to get ad unit for a position
 */
export function useAdUnit(position: keyof AdConfig['positions']) {
  const context = useContext(AdContext);
  if (!context) return null;
  return context.getAdUnit(position);
}
