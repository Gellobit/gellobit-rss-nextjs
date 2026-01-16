/**
 * Membership utilities for determining user access levels and ad visibility
 */

export type MembershipType = 'free' | 'basic' | 'premium' | 'lifetime';

// Tiers that don't see ads
const PREMIUM_TIERS: MembershipType[] = ['premium', 'lifetime'];

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

    // Basic is always "active" (but not premium)
    if (membershipType === 'basic') return true;

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

    // Free/basic users see ads
    if (membershipType === 'free' || membershipType === 'basic') return true;

    // Lifetime users never see ads
    if (membershipType === 'lifetime') return false;

    // Premium users don't see ads if membership is active
    if (membershipType === 'premium') {
        if (!expiresAt) return true; // No expiration date = show ads (safety)
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
        case 'basic': return 'Basic';
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
        case 'basic': return 'bg-blue-100 text-blue-700';
        case 'lifetime': return 'bg-yellow-100 text-yellow-700';
        case 'free':
        default: return 'bg-slate-100 text-slate-700';
    }
}
