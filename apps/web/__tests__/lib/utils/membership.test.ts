import {
  isPremiumMembership,
  isMembershipActive,
  shouldShowAds,
  getMembershipLabel,
  getMembershipBadgeClasses,
  hasFullContentAccess,
  isOpportunityAccessible,
  isWithinDelayPeriod,
  canAddFavorite,
  getRemainingFavorites,
  DEFAULT_MEMBERSHIP_LIMITS,
  MembershipLimits,
} from '@/lib/utils/membership';

describe('Membership Utilities', () => {
  // Helper to create dates
  const futureDate = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
  const pastDate = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago

  describe('isPremiumMembership', () => {
    it('returns true for premium membership', () => {
      expect(isPremiumMembership('premium')).toBe(true);
    });

    it('returns true for lifetime membership', () => {
      expect(isPremiumMembership('lifetime')).toBe(true);
    });

    it('returns false for free membership', () => {
      expect(isPremiumMembership('free')).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isPremiumMembership(null)).toBe(false);
      expect(isPremiumMembership(undefined)).toBe(false);
    });
  });

  describe('isMembershipActive', () => {
    it('returns true for lifetime membership (never expires)', () => {
      expect(isMembershipActive('lifetime', null)).toBe(true);
      expect(isMembershipActive('lifetime', pastDate())).toBe(true);
    });

    it('returns true for free membership (always active)', () => {
      expect(isMembershipActive('free', null)).toBe(true);
    });

    it('returns true for premium with future expiration', () => {
      expect(isMembershipActive('premium', futureDate())).toBe(true);
    });

    it('returns false for premium with past expiration', () => {
      expect(isMembershipActive('premium', pastDate())).toBe(false);
    });

    it('returns false for premium without expiration date', () => {
      expect(isMembershipActive('premium', null)).toBe(false);
    });

    it('returns false for null membership', () => {
      expect(isMembershipActive(null, null)).toBe(false);
    });
  });

  describe('shouldShowAds', () => {
    it('returns true for no membership (show ads)', () => {
      expect(shouldShowAds(null, null)).toBe(true);
      expect(shouldShowAds(undefined, undefined)).toBe(true);
    });

    it('returns true for free membership (show ads)', () => {
      expect(shouldShowAds('free', null)).toBe(true);
    });

    it('returns false for lifetime membership (no ads)', () => {
      expect(shouldShowAds('lifetime', null)).toBe(false);
    });

    it('returns false for active premium (no ads)', () => {
      expect(shouldShowAds('premium', futureDate())).toBe(false);
    });

    it('returns false for premium without expiry (admin granted)', () => {
      expect(shouldShowAds('premium', null)).toBe(false);
    });

    it('returns true for expired premium (show ads)', () => {
      expect(shouldShowAds('premium', pastDate())).toBe(true);
    });
  });

  describe('getMembershipLabel', () => {
    it('returns correct labels for each type', () => {
      expect(getMembershipLabel('premium')).toBe('Premium');
      expect(getMembershipLabel('lifetime')).toBe('Lifetime');
      expect(getMembershipLabel('free')).toBe('Free');
    });

    it('returns Free for unknown types', () => {
      expect(getMembershipLabel(null)).toBe('Free');
      expect(getMembershipLabel(undefined)).toBe('Free');
      expect(getMembershipLabel('unknown')).toBe('Free');
    });
  });

  describe('getMembershipBadgeClasses', () => {
    it('returns purple classes for premium', () => {
      expect(getMembershipBadgeClasses('premium')).toContain('purple');
    });

    it('returns yellow classes for lifetime', () => {
      expect(getMembershipBadgeClasses('lifetime')).toContain('yellow');
    });

    it('returns slate classes for free', () => {
      expect(getMembershipBadgeClasses('free')).toContain('slate');
    });
  });

  describe('hasFullContentAccess', () => {
    it('returns true when system is disabled', () => {
      expect(hasFullContentAccess('free', null, false)).toBe(true);
    });

    it('returns true for lifetime', () => {
      expect(hasFullContentAccess('lifetime', null, true)).toBe(true);
    });

    it('returns true for active premium', () => {
      expect(hasFullContentAccess('premium', futureDate(), true)).toBe(true);
    });

    it('returns true for premium without expiry (admin granted)', () => {
      expect(hasFullContentAccess('premium', null, true)).toBe(true);
    });

    it('returns false for expired premium', () => {
      expect(hasFullContentAccess('premium', pastDate(), true)).toBe(false);
    });

    it('returns false for free users', () => {
      expect(hasFullContentAccess('free', null, true)).toBe(false);
    });
  });

  describe('isOpportunityAccessible', () => {
    const limits: MembershipLimits = {
      ...DEFAULT_MEMBERSHIP_LIMITS,
      freeContentPercentage: 60,
      systemEnabled: true,
    };

    it('returns true when system is disabled', () => {
      const disabledLimits = { ...limits, systemEnabled: false };
      expect(isOpportunityAccessible('free', null, 0, 100, disabledLimits)).toBe(true);
    });

    it('returns true for premium users regardless of index', () => {
      expect(isOpportunityAccessible('premium', futureDate(), 0, 100, limits)).toBe(true);
      expect(isOpportunityAccessible('lifetime', null, 0, 100, limits)).toBe(true);
    });

    it('returns true for free users on older content', () => {
      // With 60% accessible and 100 items, indices 40-99 should be accessible
      expect(isOpportunityAccessible('free', null, 99, 100, limits)).toBe(true);
      expect(isOpportunityAccessible('free', null, 40, 100, limits)).toBe(true);
    });

    it('returns false for free users on newer content', () => {
      // With 60% accessible and 100 items, indices 0-39 should NOT be accessible
      expect(isOpportunityAccessible('free', null, 0, 100, limits)).toBe(false);
      expect(isOpportunityAccessible('free', null, 39, 100, limits)).toBe(false);
    });
  });

  describe('isWithinDelayPeriod', () => {
    it('returns false when system is disabled', () => {
      const recentDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      expect(isWithinDelayPeriod(recentDate, 24, false)).toBe(false);
    });

    it('returns true for recently published content', () => {
      const recentDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      expect(isWithinDelayPeriod(recentDate, 24, true)).toBe(true);
    });

    it('returns false for old content', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
      expect(isWithinDelayPeriod(oldDate, 24, true)).toBe(false);
    });

    it('returns false for null publish date', () => {
      expect(isWithinDelayPeriod(null, 24, true)).toBe(false);
    });
  });

  describe('canAddFavorite', () => {
    it('returns true when system is disabled', () => {
      expect(canAddFavorite('free', null, 100, 5, false)).toBe(true);
    });

    it('returns true for premium users', () => {
      expect(canAddFavorite('premium', futureDate(), 100, 5, true)).toBe(true);
      expect(canAddFavorite('lifetime', null, 100, 5, true)).toBe(true);
    });

    it('returns true for free users under limit', () => {
      expect(canAddFavorite('free', null, 4, 5, true)).toBe(true);
    });

    it('returns false for free users at/over limit', () => {
      expect(canAddFavorite('free', null, 5, 5, true)).toBe(false);
      expect(canAddFavorite('free', null, 10, 5, true)).toBe(false);
    });
  });

  describe('getRemainingFavorites', () => {
    it('returns null when system is disabled', () => {
      expect(getRemainingFavorites('free', null, 3, 5, false)).toBe(null);
    });

    it('returns null for premium users (unlimited)', () => {
      expect(getRemainingFavorites('premium', futureDate(), 100, 5, true)).toBe(null);
      expect(getRemainingFavorites('lifetime', null, 100, 5, true)).toBe(null);
    });

    it('returns correct remaining count for free users', () => {
      expect(getRemainingFavorites('free', null, 3, 5, true)).toBe(2);
      expect(getRemainingFavorites('free', null, 0, 5, true)).toBe(5);
    });

    it('returns 0 when at or over limit', () => {
      expect(getRemainingFavorites('free', null, 5, 5, true)).toBe(0);
      expect(getRemainingFavorites('free', null, 10, 5, true)).toBe(0);
    });
  });
});
