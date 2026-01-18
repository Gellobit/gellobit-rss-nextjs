'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useShowAds } from '@/context/UserContext';
import LazyAdUnit from '../LazyAdUnit';

interface ExitInterstitialAdProps {
  slotId?: string;
  position?: string;
  countdownSeconds?: number;
}

interface InterstitialState {
  isOpen: boolean;
  targetUrl: string | null;
  countdown: number;
}

/**
 * Exit Interstitial Ad
 * Shows a full-screen ad when user clicks an external link
 * After countdown, redirects to the target URL
 */
export default function ExitInterstitialAd({
  slotId,
  position = 'exit_interstitial',
  countdownSeconds = 5,
}: ExitInterstitialAdProps) {
  const { shouldShowAds, loading } = useShowAds();
  const [state, setState] = useState<InterstitialState>({
    isOpen: false,
    targetUrl: null,
    countdown: countdownSeconds,
  });

  // Handle external link clicks
  const handleExternalLinkClick = useCallback((e: MouseEvent) => {
    if (!shouldShowAds || loading) return;

    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href]') as HTMLAnchorElement | null;

    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Check if it's an external link
    const isExternal =
      href.startsWith('http') &&
      !href.includes(window.location.hostname) &&
      anchor.getAttribute('target') === '_blank';

    if (isExternal) {
      e.preventDefault();
      e.stopPropagation();

      setState({
        isOpen: true,
        targetUrl: href,
        countdown: countdownSeconds,
      });
    }
  }, [shouldShowAds, loading, countdownSeconds]);

  // Attach click listener
  useEffect(() => {
    if (!shouldShowAds || loading) return;

    document.addEventListener('click', handleExternalLinkClick, true);
    return () => document.removeEventListener('click', handleExternalLinkClick, true);
  }, [handleExternalLinkClick, shouldShowAds, loading]);

  // Countdown timer
  useEffect(() => {
    if (!state.isOpen || state.countdown <= 0) return;

    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        countdown: prev.countdown - 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isOpen, state.countdown]);

  // Auto-redirect when countdown reaches 0
  useEffect(() => {
    if (state.isOpen && state.countdown === 0 && state.targetUrl) {
      window.open(state.targetUrl, '_blank', 'noopener,noreferrer');
      closeInterstitial();
    }
  }, [state.countdown, state.isOpen, state.targetUrl]);

  const closeInterstitial = () => {
    setState({
      isOpen: false,
      targetUrl: null,
      countdown: countdownSeconds,
    });
  };

  const skipAndRedirect = () => {
    if (state.targetUrl) {
      window.open(state.targetUrl, '_blank', 'noopener,noreferrer');
    }
    closeInterstitial();
  };

  if (!state.isOpen || !shouldShowAds) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-slate-500" />
            <div>
              <p className="text-sm font-bold text-slate-900">Loading external site...</p>
              <p className="text-xs text-slate-500">You'll be redirected automatically</p>
            </div>
          </div>
          <button
            onClick={closeInterstitial}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Ad Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sponsored</p>
          </div>

          {/* Ad Unit */}
          <div className="flex justify-center">
            <LazyAdUnit
              format="rectangle"
              slotId={slotId}
              position={position}
              className="!my-0"
              showUpgradeLink={false}
              rootMargin="0px"
            />
          </div>
        </div>

        {/* Footer with countdown */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {state.countdown > 0 ? (
                <span>Redirecting in <strong className="text-slate-900">{state.countdown}s</strong></span>
              ) : (
                <span>Redirecting...</span>
              )}
            </div>
            <button
              onClick={skipAndRedirect}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDE59] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {state.countdown > 0 ? 'Skip Ad' : 'Continue'}
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
