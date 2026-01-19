import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import { getPromptForType, type ScrapedContent } from '../../prompts';
import type { OpportunityType } from '../types/database.types';

/**
 * Prompt Service - Manages AI prompts for content generation
 * Supports both TypeScript defaults and custom database prompts
 */
export class PromptService {
  private static instance: PromptService;

  private constructor() {}

  static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }

  /**
   * Get prompt for a specific opportunity type and scraped content
   * First checks database for custom prompt, falls back to TypeScript default
   *
   * @param opportunityType - Type of opportunity (includes 'blog_post')
   * @param scrapedContent - Scraped content to analyze
   * @returns Complete prompt ready for AI processing
   */
  async getPrompt(
    opportunityType: OpportunityType | 'blog_post',
    scrapedContent: ScrapedContent
  ): Promise<string> {
    try {
      // Check if custom prompt exists in database
      const customPrompt = await this.getCustomPrompt(opportunityType);

      if (customPrompt) {
        await logger.info('Using custom prompt from database', {
          opportunity_type: opportunityType,
        });
        return this.buildCustomPrompt(customPrompt, scrapedContent);
      }

      // Fall back to TypeScript default prompt
      await logger.info('Using default TypeScript prompt', {
        opportunity_type: opportunityType,
      });
      return getPromptForType(opportunityType, scrapedContent);
    } catch (error) {
      await logger.error('Error loading prompt', {
        opportunity_type: opportunityType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Always fall back to TypeScript default
      return getPromptForType(opportunityType, scrapedContent);
    }
  }

  /**
   * Get custom prompt from database
   *
   * @param opportunityType - Type of opportunity
   * @returns Custom prompt template or null
   */
  private async getCustomPrompt(
    opportunityType: OpportunityType | 'blog_post'
  ): Promise<string | null> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('unified_prompt, is_customized')
      .eq('opportunity_type', opportunityType)
      .single();

    // Return custom prompt only if it has been customized and is not empty
    if (error || !data || !data.is_customized || !data.unified_prompt) {
      return null;
    }

    return data.unified_prompt;
  }

  /**
   * Build custom prompt with variable substitution
   *
   * @param promptTemplate - Custom prompt template from database
   * @param scrapedContent - Scraped content to substitute
   * @returns Complete prompt with substituted variables
   */
  private buildCustomPrompt(
    promptTemplate: string,
    scrapedContent: ScrapedContent
  ): string {
    // Replace [matched_content] with actual content
    let prompt = promptTemplate.replace(
      '[matched_content]',
      `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
    `.trim()
    );

    // Replace [original_title] if present
    prompt = prompt.replace('[original_title]', scrapedContent.title);

    return prompt;
  }

  /**
   * Save or update a custom prompt in the database
   *
   * @param opportunityType - Type of opportunity (includes 'blog_post')
   * @param promptText - Custom prompt text
   * @returns Success status
   */
  async saveCustomPrompt(
    opportunityType: OpportunityType | 'blog_post',
    promptText: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      // Check if prompt already exists for this type
      const { data: existing } = await supabase
        .from('prompt_templates')
        .select('id')
        .eq('opportunity_type', opportunityType)
        .single();

      if (existing) {
        // Update existing prompt
        const { error } = await supabase
          .from('prompt_templates')
          .update({
            unified_prompt: promptText,
            is_customized: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;

        await logger.info('Custom prompt updated', {
          opportunity_type: opportunityType,
        });
      } else {
        // Insert new prompt entry
        const { error } = await supabase.from('prompt_templates').insert({
          opportunity_type: opportunityType,
          unified_prompt: promptText,
          default_prompt: promptText,
          is_customized: true,
        });

        if (error) throw error;

        await logger.info('Custom prompt created', {
          opportunity_type: opportunityType,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error saving custom prompt', {
        opportunity_type: opportunityType,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete/reset a custom prompt and revert to default
   *
   * @param opportunityType - Type of opportunity (includes 'blog_post')
   * @returns Success status
   */
  async deleteCustomPrompt(
    opportunityType: OpportunityType | 'blog_post'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      // Reset to default by clearing unified_prompt and setting is_customized to false
      const { error } = await supabase
        .from('prompt_templates')
        .update({
          unified_prompt: '',
          is_customized: false,
          updated_at: new Date().toISOString(),
        })
        .eq('opportunity_type', opportunityType);

      if (error) throw error;

      await logger.info('Custom prompt reset to default', {
        opportunity_type: opportunityType,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error resetting custom prompt', {
        opportunity_type: opportunityType,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get all custom prompts
   *
   * @returns Array of custom prompts with metadata
   */
  async getAllCustomPrompts() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('opportunity_type', { ascending: true });

    if (error) {
      await logger.error('Error fetching custom prompts', {
        error: error.message,
      });
      return [];
    }

    return data || [];
  }

  /**
   * Test a prompt by validating it can be parsed and built
   *
   * @param opportunityType - Type of opportunity (includes 'blog_post')
   * @param promptText - Prompt text to test
   * @returns Validation result
   */
  async testPrompt(
    opportunityType: OpportunityType | 'blog_post',
    promptText: string
  ): Promise<{
    valid: boolean;
    error?: string;
    preview?: string;
  }> {
    try {
      // Test with sample content
      const sampleContent: ScrapedContent = {
        title: 'Sample Title',
        content: 'Sample content for testing prompt validation.',
        url: 'https://example.com/test',
      };

      const builtPrompt = this.buildCustomPrompt(promptText, sampleContent);

      // Basic validation
      if (!builtPrompt || builtPrompt.trim().length === 0) {
        return {
          valid: false,
          error: 'Prompt is empty after processing',
        };
      }

      // Check if [matched_content] or [original_title] are still present (not substituted)
      if (
        builtPrompt.includes('[matched_content]') ||
        builtPrompt.includes('[original_title]')
      ) {
        return {
          valid: false,
          error: 'Prompt contains unsubstituted variables',
        };
      }

      return {
        valid: true,
        preview: builtPrompt.substring(0, 500) + '...',
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get prompt statistics
   *
   * @returns Statistics about prompts usage
   */
  async getPromptStats() {
    const supabase = createAdminClient();

    const { data: customPrompts } = await supabase
      .from('prompt_templates')
      .select('opportunity_type, is_customized');

    const { data: recentLogs } = await supabase
      .from('processing_logs')
      .select('context')
      .ilike('message', '%prompt%')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    return {
      total_custom_prompts: customPrompts?.length || 0,
      customized_prompts:
        customPrompts?.filter((p) => p.is_customized).length || 0,
      prompt_usage_last_7_days: recentLogs?.length || 0,
    };
  }
}

// Export singleton instance
export const promptService = PromptService.getInstance();
