'use client';

import React from 'react';
import { useShowAds } from '@/context/UserContext';
import LazyAdUnit from '../LazyAdUnit';

interface StickySidebarAdProps {
  slotId?: string;
  position?: string;
  format?: 'skyscraper' | 'rectangle';
  className?: string;
}

/**
 * Sticky Sidebar Ad - Desktop Only
 * Large format (300x600 skyscraper or 300x250 rectangle)
 * Follows user as they scroll through long content
 * Ideal for career/education content where users read carefully
 */
export default function StickySidebarAd({
  slotId,
  position = 'sticky_sidebar',
  format = 'skyscraper',
  className = '',
}: StickySidebarAdProps) {
  const { shouldShowAds, loading } = useShowAds();

  if (!shouldShowAds || loading) {
    return null;
  }

  return (
    <div className={`hidden lg:block ${className}`}>
      <div className="sticky top-24">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 text-center">
            Sponsored
          </div>
          <LazyAdUnit
            format={format === 'skyscraper' ? 'vertical' : 'rectangle'}
            slotId={slotId}
            position={position}
            className="!my-0"
            showUpgradeLink={true}
            rootMargin="200px"
          />
        </div>
      </div>
    </div>
  );
}
