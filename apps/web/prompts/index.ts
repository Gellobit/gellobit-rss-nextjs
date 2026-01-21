/**
 * Unified Prompt System - Single-Call AI Generation
 * All prompts return JSON format with complete opportunity data
 */

import { buildGiveawayPrompt } from './giveaway.prompt';
import { buildContestPrompt } from './contest.prompt';
import { buildSweepstakesPrompt } from './sweepstakes.prompt';
import { buildDreamJobPrompt } from './dream_job.prompt';
import { buildGetPaidToPrompt } from './get_paid_to.prompt';
import { buildInstantWinPrompt } from './instant_win.prompt';
import { buildJobFairPrompt } from './job_fair.prompt';
import { buildScholarshipPrompt } from './scholarship.prompt';
import { buildVolunteerPrompt } from './volunteer.prompt';
import { buildFreeTrainingPrompt } from './free_training.prompt';
import { buildPromoPrompt } from './promo.prompt';
import { buildBlogPostPrompt } from './blog_post.prompt';
import { buildGenericPrompt, GENERIC_PROMPT } from './generic.prompt';

import type { OpportunityType } from '../types/database.types';

/**
 * Scraped content structure
 */
export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  featuredImage?: string | null;
}

/**
 * Prompt builder function type
 */
type PromptBuilder = (content: ScrapedContent) => string;

/**
 * Map of opportunity types to their prompt builder functions
 */
const PROMPT_BUILDERS: Record<OpportunityType, PromptBuilder> = {
  giveaway: buildGiveawayPrompt,
  contest: buildContestPrompt,
  sweepstakes: buildSweepstakesPrompt,
  dream_job: buildDreamJobPrompt,
  get_paid_to: buildGetPaidToPrompt,
  instant_win: buildInstantWinPrompt,
  job_fair: buildJobFairPrompt,
  scholarship: buildScholarshipPrompt,
  volunteer: buildVolunteerPrompt,
  free_training: buildFreeTrainingPrompt,
  promo: buildPromoPrompt,
};

/**
 * Get the appropriate prompt for a given opportunity type and scraped content
 *
 * @param opportunityType - The type of opportunity (or 'blog_post' for blog content)
 * @param scrapedContent - The scraped content to analyze
 * @returns Formatted prompt ready for AI processing
 *
 * @example
 * ```typescript
 * const prompt = getPromptForType('giveaway', {
 *   title: 'Win $1000 Cash',
 *   content: 'Enter to win...',
 *   url: 'https://example.com/giveaway'
 * });
 *
 * const result = await aiService.generateOpportunity(scrapedContent, 'giveaway', prompt);
 * ```
 */
export function getPromptForType(
  opportunityType: OpportunityType | 'blog_post' | string,
  scrapedContent: ScrapedContent
): string {
  // Handle blog_post as a special case
  if (opportunityType === 'blog_post') {
    return buildBlogPostPrompt(scrapedContent);
  }

  // Check if we have a specific prompt builder for this type
  const builder = PROMPT_BUILDERS[opportunityType as OpportunityType];

  if (builder) {
    return builder(scrapedContent);
  }

  // For dynamic/custom types without a specific prompt, use generic prompt
  console.log(`Using generic prompt for dynamic type: ${opportunityType}`);
  return buildGenericPrompt(scrapedContent);
}

/**
 * Check if an opportunity type has a dedicated TypeScript prompt
 * (as opposed to using the generic prompt)
 */
export function hasBuiltInPrompt(type: string): boolean {
  return type in PROMPT_BUILDERS || type === 'blog_post';
}

/**
 * Get the raw prompt template for a type (without content substitution)
 * Returns generic prompt for types without a built-in prompt
 */
export function getRawPromptForType(type: string): string {
  if (type === 'blog_post') {
    // Import dynamically to avoid circular dependencies
    return require('./blog_post.prompt').BLOG_POST_PROMPT;
  }

  const promptMap: Record<string, string> = {
    giveaway: require('./giveaway.prompt').GIVEAWAY_PROMPT,
    contest: require('./contest.prompt').CONTEST_PROMPT,
    sweepstakes: require('./sweepstakes.prompt').SWEEPSTAKES_PROMPT,
    dream_job: require('./dream_job.prompt').DREAM_JOB_PROMPT,
    get_paid_to: require('./get_paid_to.prompt').GET_PAID_TO_PROMPT,
    instant_win: require('./instant_win.prompt').INSTANT_WIN_PROMPT,
    job_fair: require('./job_fair.prompt').JOB_FAIR_PROMPT,
    scholarship: require('./scholarship.prompt').SCHOLARSHIP_PROMPT,
    volunteer: require('./volunteer.prompt').VOLUNTEER_PROMPT,
    free_training: require('./free_training.prompt').FREE_TRAINING_PROMPT,
    promo: require('./promo.prompt').PROMO_PROMPT,
  };

  return promptMap[type] || GENERIC_PROMPT;
}

/**
 * Check if an opportunity type has a built-in TypeScript prompt
 *
 * @param type - The opportunity type to check
 * @returns True if the type has a built-in prompt
 */
export function isSupportedOpportunityType(type: string): type is OpportunityType {
  return type in PROMPT_BUILDERS || type === 'blog_post';
}

/**
 * Get list of all opportunity types with built-in prompts
 *
 * @returns Array of opportunity types with built-in prompts
 */
export function getSupportedOpportunityTypes(): OpportunityType[] {
  return Object.keys(PROMPT_BUILDERS) as OpportunityType[];
}

/**
 * Get list of built-in prompt types (including blog_post)
 */
export function getBuiltInPromptTypes(): string[] {
  return [...Object.keys(PROMPT_BUILDERS), 'blog_post'];
}

// Export all prompt builders for direct access if needed
export {
  buildGiveawayPrompt,
  buildContestPrompt,
  buildSweepstakesPrompt,
  buildDreamJobPrompt,
  buildGetPaidToPrompt,
  buildInstantWinPrompt,
  buildJobFairPrompt,
  buildScholarshipPrompt,
  buildVolunteerPrompt,
  buildFreeTrainingPrompt,
  buildPromoPrompt,
  buildBlogPostPrompt,
};

// Export raw prompts (without content substitution) for testing
export { GIVEAWAY_PROMPT } from './giveaway.prompt';
export { CONTEST_PROMPT } from './contest.prompt';
export { SWEEPSTAKES_PROMPT } from './sweepstakes.prompt';
export { DREAM_JOB_PROMPT } from './dream_job.prompt';
export { GET_PAID_TO_PROMPT } from './get_paid_to.prompt';
export { INSTANT_WIN_PROMPT } from './instant_win.prompt';
export { JOB_FAIR_PROMPT } from './job_fair.prompt';
export { SCHOLARSHIP_PROMPT } from './scholarship.prompt';
export { VOLUNTEER_PROMPT } from './volunteer.prompt';
export { FREE_TRAINING_PROMPT } from './free_training.prompt';
export { PROMO_PROMPT } from './promo.prompt';
export { BLOG_POST_PROMPT } from './blog_post.prompt';
export { GENERIC_PROMPT, buildGenericPrompt } from './generic.prompt';
