/**
 * Platform Detection Utilities
 * Detects whether the app is running in a native Capacitor context or web browser
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'android' | 'ios';

/**
 * Check if running in a native app context (Capacitor)
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Check if running in a web browser
 */
export function isWebBrowser(): boolean {
  return !isNativeApp();
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';

  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
    return 'web';
  } catch {
    return 'web';
  }
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Get the appropriate ad provider based on platform
 */
export function getAdProvider(): 'admob' | 'adsense' {
  return isNativeApp() ? 'admob' : 'adsense';
}
