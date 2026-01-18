'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useShowAds } from '@/context/UserContext';
import LazyAdUnit from '../LazyAdUnit';
import { isNativeApp } from '@/lib/utils/platform';
import { useAdMobBanner } from './admob';

interface StickyAnchorAdProps {
  slotId?: string;
  admobUnitId?: string;
  position?: string;
  dismissible?: boolean;
  showAfterScroll?: number; // Show after scrolling X pixels
}

/**
 * Sticky Anchor Ad - Mobile Only
 * Fixed at bottom of screen, 320x50 format
 * Ideal for high-urgency content where users scroll quickly
 *
 * Web: Uses AdSense with custom positioning
 * Native: Uses AdMob banner positioned at bottom
 */
export default function StickyAnchorAd({
  slotId,
  admobUnitId,
  position = 'sticky_anchor',
  dismissible = true,
  showAfterScroll = 300,
}: StickyAnchorAdProps) {
  const { shouldShowAds, loading } = useShowAds();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const { showBanner, hideBanner } = useAdMobBanner();

  // Detect platform
  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  // Handle scroll visibility
  useEffect(() => {
    if (!shouldShowAds || loading || isDismissed) return;

    const handleScroll = () => {
      if (window.scrollY > showAfterScroll) {
        setIsVisible(true);
      }
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldShowAds, loading, isDismissed, showAfterScroll]);

  // Show AdMob banner for native apps
  useEffect(() => {
    if (!isNative || !admobUnitId || !shouldShowAds || loading || isDismissed || !isVisible) {
      return;
    }

    showBanner({
      adUnitId: admobUnitId,
      size: 'BANNER',
      position: 'bottom',
    });

    return () => {
      hideBanner();
    };
  }, [isNative, admobUnitId, shouldShowAds, loading, isDismissed, isVisible, showBanner, hideBanner]);

  if (!shouldShowAds || loading || isDismissed || !isVisible) {
    return null;
  }

  // For native apps, AdMob banner is rendered by the SDK, just add spacer
  if (isNative) {
    return (
      <>
        {/* Spacer for AdMob native banner */}
        <div className="h-16" />
      </>
    );
  }

  // Web: AdSense implementation
  return (
    <>
      {/* Spacer to prevent content from being hidden behind the ad */}
      <div className="lg:hidden h-16" />

      {/* Sticky Ad Container - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg safe-area-bottom">
        <div className="relative">
          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute -top-8 right-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors z-10"
              aria-label="Close ad"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}

          {/* Ad Unit */}
          <div className="flex justify-center py-2 px-4">
            <LazyAdUnit
              format="horizontal"
              slotId={slotId}
              position={position}
              className="!my-0"
              showUpgradeLink={false}
              rootMargin="0px"
            />
          </div>
        </div>
      </div>
    </>
  );
}
