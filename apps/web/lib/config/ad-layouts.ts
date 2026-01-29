/**
 * Ad Layout Configuration by Opportunity Type
 *
 * Different opportunity types have different user behaviors and require
 * different ad placements for optimal monetization without hurting UX.
 */

export type OpportunityCategory = 'high_urgency' | 'career_education' | 'lifestyle_social' | 'default';

export interface AdLayoutConfig {
  category: OpportunityCategory;
  description: string;

  // Mobile ads
  stickyAnchor: boolean;           // 320x50 sticky at bottom (mobile only)

  // Desktop ads
  stickySidebar: boolean;          // 300x600 sticky sidebar (desktop only)

  // Content ads
  belowTitle: boolean;             // 300x250 below title, above the fold
  inContent: boolean;              // Native ad in middle of content
  endOfPost: boolean;              // Ad at end of content
  afterCTA: boolean;               // Ad after main CTA button

  // Special ads
  exitInterstitial: boolean;       // Full-screen ad on external link click

  // Formats
  belowTitleFormat: 'rectangle' | 'horizontal';
  inContentFormat: 'native' | 'horizontal';
  sidebarFormat: 'skyscraper' | 'rectangle';
}

// Map opportunity types to their categories
export const OPPORTUNITY_TYPE_CATEGORIES: Record<string, OpportunityCategory> = {
  // High Urgency - Quick decisions, users in a hurry
  'sweepstakes': 'high_urgency',
  'giveaway': 'high_urgency',
  'contest': 'high_urgency',
  'instant_win': 'high_urgency',

  // Career & Education - Careful reading, important decisions
  'job_fair': 'career_education',
  'dream_job': 'career_education',
  'scholarship': 'career_education',
  'free_training': 'career_education',

  // Lifestyle & Social - Engagement-focused
  'volunteer': 'lifestyle_social',
  'promo': 'lifestyle_social',

  // Default for any other types
  'get_paid_to': 'default',
};

// Ad layouts by category
export const AD_LAYOUTS: Record<OpportunityCategory, AdLayoutConfig> = {
  /**
   * HIGH URGENCY: Sweepstakes, Giveaways, Contests, Instant Win
   * - User is in a hurry to participate
   * - Quick scan content
   * - High redirect rate to external sites
   */
  high_urgency: {
    category: 'high_urgency',
    description: 'Fast-paced content with high external redirect rate',

    // Mobile: Sticky anchor ensures views during quick reads
    stickyAnchor: true,

    // Desktop: Standard sidebar
    stickySidebar: false,

    // Content ads
    belowTitle: true,              // High impact, above the fold
    inContent: true,               // In-content ad for monetization
    endOfPost: true,               // Standard end placement
    afterCTA: false,               // Skip, user redirects quickly

    // Exit interstitial on external link click
    exitInterstitial: true,

    // Formats
    belowTitleFormat: 'rectangle', // 300x250 for max impact
    inContentFormat: 'horizontal',
    sidebarFormat: 'rectangle',
  },

  /**
   * CAREER & EDUCATION: Job Fairs, Dream Jobs, Scholarships, Free Training
   * - User reads carefully
   * - Longer time on page
   * - Important life decisions
   */
  career_education: {
    category: 'career_education',
    description: 'Detailed content requiring careful reading',

    // Mobile: No sticky anchor (distracting for serious content)
    stickyAnchor: false,

    // Desktop: Large sticky sidebar for long reads
    stickySidebar: true,

    // Content ads
    belowTitle: true,              // Below title ad
    inContent: true,               // Native ad between sections
    endOfPost: true,               // Recommended content style
    afterCTA: false,

    // No exit interstitial (professional context)
    exitInterstitial: false,

    // Formats
    belowTitleFormat: 'horizontal',
    inContentFormat: 'native',     // Blends with content
    sidebarFormat: 'skyscraper',   // 300x600 for long reads
  },

  /**
   * LIFESTYLE & SOCIAL: Volunteer, Promos
   * - Engagement-focused
   * - May have promo codes
   * - Social sharing common
   */
  lifestyle_social: {
    category: 'lifestyle_social',
    description: 'Engagement and social-focused content',

    // Mobile: Light sticky anchor
    stickyAnchor: true,

    // Desktop: Standard sidebar
    stickySidebar: false,

    // Content ads
    belowTitle: true,              // Below title ad
    inContent: true,               // Native grid style
    endOfPost: true,
    afterCTA: true,                // High CTR after copy code button

    // No exit interstitial
    exitInterstitial: false,

    // Formats
    belowTitleFormat: 'horizontal',
    inContentFormat: 'native',
    sidebarFormat: 'rectangle',
  },

  /**
   * DEFAULT: Get Paid To, Evergreen, Unknown types
   * - Balanced approach
   */
  default: {
    category: 'default',
    description: 'Balanced ad layout for general content',

    stickyAnchor: false,
    stickySidebar: false,

    belowTitle: true,              // Below title ad
    inContent: true,               // In-content ad
    endOfPost: true,
    afterCTA: false,

    exitInterstitial: false,

    belowTitleFormat: 'horizontal',
    inContentFormat: 'horizontal',
    sidebarFormat: 'rectangle',
  },
};

/**
 * Get the ad layout configuration for an opportunity type
 */
export function getAdLayout(opportunityType: string): AdLayoutConfig {
  const category = OPPORTUNITY_TYPE_CATEGORIES[opportunityType] || 'default';
  return AD_LAYOUTS[category];
}

/**
 * Get the category for an opportunity type
 */
export function getOpportunityCategory(opportunityType: string): OpportunityCategory {
  return OPPORTUNITY_TYPE_CATEGORIES[opportunityType] || 'default';
}
