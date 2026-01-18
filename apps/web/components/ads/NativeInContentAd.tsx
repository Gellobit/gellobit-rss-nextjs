'use client';

import React from 'react';
import { useShowAds } from '@/context/UserContext';
import LazyAdUnit from '../LazyAdUnit';

interface NativeInContentAdProps {
  slotId?: string;
  position?: string;
  variant?: 'card' | 'inline' | 'banner';
  title?: string;
  className?: string;
}

/**
 * Native In-Content Ad
 * Blends with the surrounding content for less intrusive monetization
 * Ideal for career/education content where users are focused
 */
export default function NativeInContentAd({
  slotId,
  position = 'native_in_content',
  variant = 'card',
  title = 'Sponsored Content',
  className = '',
}: NativeInContentAdProps) {
  const { shouldShowAds, loading } = useShowAds();

  if (!shouldShowAds || loading) {
    return null;
  }

  if (variant === 'card') {
    return (
      <div className={`my-8 ${className}`}>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#FFDE59] rounded-full" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {title}
            </span>
          </div>
          <LazyAdUnit
            format="horizontal"
            slotId={slotId}
            position={position}
            className="!my-0"
            showUpgradeLink={true}
            rootMargin="200px"
          />
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`my-8 py-6 border-y border-slate-200 ${className}`}>
        <div className="text-center">
          <span className="inline-block text-xs text-slate-400 uppercase tracking-wider mb-4 px-3 py-1 bg-slate-100 rounded-full">
            {title}
          </span>
        </div>
        <LazyAdUnit
          format="horizontal"
          slotId={slotId}
          position={position}
          className="!my-0"
          showUpgradeLink={true}
          rootMargin="200px"
        />
      </div>
    );
  }

  // Banner variant - minimal styling
  return (
    <div className={`my-8 ${className}`}>
      <div className="text-center mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Advertisement
        </span>
      </div>
      <LazyAdUnit
        format="horizontal"
        slotId={slotId}
        position={position}
        className="!my-0"
        showUpgradeLink={true}
        rootMargin="200px"
      />
    </div>
  );
}
