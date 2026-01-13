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
 * @param opportunityType - The type of opportunity
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
  opportunityType: OpportunityType,
  scrapedContent: ScrapedContent
): string {
  const builder = PROMPT_BUILDERS[opportunityType];

  if (!builder) {
    throw new Error(`Unknown opportunity type: ${opportunityType}`);
  }

  return builder(scrapedContent);
}

/**
 * Check if an opportunity type is supported
 *
 * @param type - The opportunity type to check
 * @returns True if the type is supported
 */
export function isSupportedOpportunityType(type: string): type is OpportunityType {
  return type in PROMPT_BUILDERS;
}

/**
 * Get list of all supported opportunity types
 *
 * @returns Array of all supported opportunity types
 */
export function getSupportedOpportunityTypes(): OpportunityType[] {
  return Object.keys(PROMPT_BUILDERS) as OpportunityType[];
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
