'use client';

import React from 'react';
import { getAdLayout, AdLayoutConfig } from '@/lib/config/ad-layouts';
import StickyAnchorAd from './StickyAnchorAd';
import ExitInterstitialAd from './ExitInterstitialAd';
import StickySidebarAd from './StickySidebarAd';
import NativeInContentAd from './NativeInContentAd';
import LazyAdUnit from '../LazyAdUnit';

interface OpportunityAdsLayoutProps {
  opportunityType: string;
  children: React.ReactNode;
  // Optional slot IDs for different positions
  slots?: {
    stickyAnchor?: string;
    stickySidebar?: string;
    belowTitle?: string;
    inContent?: string;
    endOfPost?: string;
    afterCTA?: string;
    exitInterstitial?: string;
  };
}

/**
 * OpportunityAdsLayout
 * Wraps opportunity content and provides type-specific ad placements
 */
export default function OpportunityAdsLayout({
  opportunityType,
  children,
  slots = {},
}: OpportunityAdsLayoutProps) {
  const adLayout = getAdLayout(opportunityType);

  return (
    <>
      {/* Main Content */}
      {children}

      {/* Sticky Anchor Ad (Mobile) */}
      {adLayout.stickyAnchor && (
        <StickyAnchorAd
          slotId={slots.stickyAnchor}
          position={`${opportunityType}_sticky_anchor`}
        />
      )}

      {/* Exit Interstitial (for external links) */}
      {adLayout.exitInterstitial && (
        <ExitInterstitialAd
          slotId={slots.exitInterstitial}
          position={`${opportunityType}_exit_interstitial`}
        />
      )}
    </>
  );
}

/**
 * Individual ad slot components that check the layout config
 */

interface AdSlotProps {
  opportunityType: string;
  slotId?: string;
  className?: string;
}

export function BelowTitleAd({ opportunityType, slotId, className = '' }: AdSlotProps) {
  const adLayout = getAdLayout(opportunityType);

  if (!adLayout.belowTitle) return null;

  return (
    <div className={`my-6 ${className}`}>
      <LazyAdUnit
        format={adLayout.belowTitleFormat}
        slotId={slotId}
        position={`${opportunityType}_below_title`}
        rootMargin="100px"
      />
    </div>
  );
}

export function InContentAd({ opportunityType, slotId, className = '' }: AdSlotProps) {
  const adLayout = getAdLayout(opportunityType);

  if (!adLayout.inContent) return null;

  return (
    <NativeInContentAd
      slotId={slotId}
      position={`${opportunityType}_in_content`}
      variant={adLayout.inContentFormat === 'native' ? 'card' : 'banner'}
      className={className}
    />
  );
}

export function EndOfPostAd({ opportunityType, slotId, className = '' }: AdSlotProps) {
  const adLayout = getAdLayout(opportunityType);

  if (!adLayout.endOfPost) return null;

  return (
    <div className={`my-8 ${className}`}>
      <LazyAdUnit
        format="horizontal"
        slotId={slotId}
        position={`${opportunityType}_end_of_post`}
        rootMargin="200px"
      />
    </div>
  );
}

export function AfterCTAAd({ opportunityType, slotId, className = '' }: AdSlotProps) {
  const adLayout = getAdLayout(opportunityType);

  if (!adLayout.afterCTA) return null;

  return (
    <div className={`mt-6 ${className}`}>
      <div className="text-center mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          You might also like
        </span>
      </div>
      <LazyAdUnit
        format="horizontal"
        slotId={slotId}
        position={`${opportunityType}_after_cta`}
        rootMargin="200px"
      />
    </div>
  );
}

export function OpportunitySidebarAd({ opportunityType, slotId, className = '' }: AdSlotProps) {
  const adLayout = getAdLayout(opportunityType);

  if (!adLayout.stickySidebar) {
    // Use regular rectangle ad in sidebar
    return (
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 text-center">
            Sponsored
          </div>
          <LazyAdUnit
            format="rectangle"
            slotId={slotId}
            position={`${opportunityType}_sidebar`}
            className="!my-0"
            rootMargin="200px"
          />
        </div>
      </div>
    );
  }

  // Use sticky skyscraper for career/education
  return (
    <StickySidebarAd
      slotId={slotId}
      position={`${opportunityType}_sticky_sidebar`}
      format={adLayout.sidebarFormat}
      className={className}
    />
  );
}
