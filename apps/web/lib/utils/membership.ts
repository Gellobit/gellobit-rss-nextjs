/**
 * Membership utilities for determining user access levels and ad visibility
 */

export type MembershipType = 'free' | 'premium' | 'lifetime';

// Tiers that don't see ads
const PREMIUM_TIERS: MembershipType[] = ['premium', 'lifetime'];

// Tiers with full content access
const FULL_ACCESS_TIERS: MembershipType[] = ['premium', 'lifetime'];

/**
 * Membership limits configuration (fetched from API)
 */
export interface MembershipLimits {
    freeContentPercentage: number;
    freeDelayHours: number;
    freeFavoritesLimit: number;
    showLockedContent: boolean;
    lockedContentBlur: boolean;
}

/**
 * Default membership limits (used if API fails)
 */
export const DEFAULT_MEMBERSHIP_LIMITS: MembershipLimits = {
    freeContentPercentage: 60,
    freeDelayHours: 24,
    freeFavoritesLimit: 5,
    showLockedContent: true,
    lockedContentBlur: true,
};

/**
 * Check if a membership type is considered premium (no ads)
 */
export function isPremiumMembership(membershipType: string | null | undefined): boolean {
    if (!membershipType) return false;
    return PREMIUM_TIERS.includes(membershipType as MembershipType);
}

/**
 * Check if a membership is currently active (not expired)
 */
export function isMembershipActive(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined
): boolean {
    if (!membershipType) return false;

    // Lifetime never expires
    if (membershipType === 'lifetime') return true;

    // Free is always "active" (but not premium)
    if (membershipType === 'free') return true;

    // For premium, check expiration
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
}

/**
 * Determine if ads should be shown to a user based on their membership
 * Returns true if ads SHOULD be shown, false if ads should be hidden
 */
export function shouldShowAds(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined
): boolean {
    // No membership = show ads
    if (!membershipType) return true;

    // Free users see ads
    if (membershipType === 'free') return true;

    // Lifetime users never see ads
    if (membershipType === 'lifetime') return false;

    // Premium users don't see ads if membership is active
    if (membershipType === 'premium') {
        // No expiration date = assume active premium (admin granted)
        if (!expiresAt) return false;
        // Check if expired
        return new Date(expiresAt) <= new Date(); // Expired = show ads
    }

    // Default: show ads
    return true;
}

/**
 * Get display label for membership type
 */
export function getMembershipLabel(membershipType: string | null | undefined): string {
    switch (membershipType) {
        case 'premium': return 'Premium';
        case 'lifetime': return 'Lifetime';
        case 'free':
        default: return 'Free';
    }
}

/**
 * Get Tailwind CSS classes for membership badge
 */
export function getMembershipBadgeClasses(membershipType: string | null | undefined): string {
    switch (membershipType) {
        case 'premium': return 'bg-purple-100 text-purple-700';
        case 'lifetime': return 'bg-yellow-100 text-yellow-700';
        case 'free':
        default: return 'bg-slate-100 text-slate-700';
    }
}

/**
 * Check if user has full content access (premium/lifetime)
 */
export function hasFullContentAccess(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined
): boolean {
    if (!membershipType) return false;

    // Lifetime always has full access
    if (membershipType === 'lifetime') return true;

    // Premium has full access if not expired
    if (membershipType === 'premium') {
        if (!expiresAt) return true; // Admin granted, no expiry
        return new Date(expiresAt) > new Date();
    }

    // Free/Basic don't have full access
    return false;
}

/**
 * Check if a specific opportunity is accessible to the user
 * based on their membership and the opportunity's position in the list
 */
export function isOpportunityAccessible(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined,
    opportunityIndex: number,
    totalOpportunities: number,
    limits: MembershipLimits
): boolean {
    // Premium users have full access
    if (hasFullContentAccess(membershipType, expiresAt)) {
        return true;
    }

    // For free users, only the oldest X% are accessible
    // Index 0 = newest, so we need to check if this is in the "older" portion
    const accessibleCount = Math.floor(totalOpportunities * (limits.freeContentPercentage / 100));
    const oldestAccessibleIndex = totalOpportunities - accessibleCount;

    // If the opportunity index is >= oldestAccessibleIndex, it's accessible
    return opportunityIndex >= oldestAccessibleIndex;
}

/**
 * Check if an opportunity is within the delay period for free users
 */
export function isWithinDelayPeriod(
    publishedAt: string | null | undefined,
    delayHours: number
): boolean {
    if (!publishedAt) return false;

    const publishDate = new Date(publishedAt);
    const delayMs = delayHours * 60 * 60 * 1000;
    const accessibleAfter = new Date(publishDate.getTime() + delayMs);

    return new Date() < accessibleAfter;
}

/**
 * Check if user can add more favorites
 */
export function canAddFavorite(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined,
    currentFavoritesCount: number,
    freeFavoritesLimit: number
): boolean {
    // Premium users have unlimited favorites
    if (hasFullContentAccess(membershipType, expiresAt)) {
        return true;
    }

    // Free users have a limit
    return currentFavoritesCount < freeFavoritesLimit;
}

/**
 * Get the number of remaining favorites for free users
 */
export function getRemainingFavorites(
    membershipType: string | null | undefined,
    expiresAt: string | null | undefined,
    currentFavoritesCount: number,
    freeFavoritesLimit: number
): number | null {
    // Premium users have unlimited
    if (hasFullContentAccess(membershipType, expiresAt)) {
        return null; // null = unlimited
    }

    return Math.max(0, freeFavoritesLimit - currentFavoritesCount);
}
