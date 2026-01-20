import { createAdminClient } from '../utils/supabase-admin';
import { createAIProvider } from '../ai-providers';
import { logger } from '../utils/logger';
import { AIGeneratedContent, ScrapedContent, AITestResult } from '../types/ai.types';
import { AIProvider } from '../types/database.types';

/**
 * AI Service - Unified interface for all AI providers
 * Handles content generation with automatic provider selection
 */
export class AIService {
    private static instance: AIService;

    private constructor() {}

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Get active AI provider configuration from database
     * @param feedOverride - Optional feed-specific AI config
     */
    private async getActiveProviderConfig(feedOverride?: {
        provider?: string;
        model?: string;
        api_key?: string;
    }) {
        const supabase = createAdminClient();

        // If feed has specific AI provider and model, use those with the API key from settings
        if (feedOverride?.provider && feedOverride?.model) {
            // Get the API key from ai_settings for this provider
            const { data: providerSettings, error: providerError } = await supabase
                .from('ai_settings')
                .select('*')
                .eq('provider', feedOverride.provider)
                .single();

            if (providerError || !providerSettings) {
                await logger.warning('Feed AI provider not configured in settings, falling back to global', {
                    requested_provider: feedOverride.provider,
                });
                // Fall through to use global active provider
            } else {
                await logger.debug('Using feed-specific AI provider', {
                    provider: feedOverride.provider,
                    model: feedOverride.model,
                });
                return {
                    provider: feedOverride.provider as AIProvider,
                    model: feedOverride.model,
                    api_key: providerSettings.api_key,
                    max_tokens: providerSettings.max_tokens || 1500,
                    temperature: providerSettings.temperature || 0.1,
                    is_active: true,
                };
            }
        }

        // Use global active config
        const { data, error } = await supabase
            .from('ai_settings')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error || !data) {
            throw new Error('No active AI provider configured');
        }

        return data;
    }

    /**
     * Generate opportunity content from scraped data
     * Single unified call that returns all fields
     *
     * @param scrapedContent - Content scraped from source URL
     * @param opportunityType - Type of opportunity
     * @param prompt - AI prompt to use
     * @param feedAIConfig - Optional feed-specific AI configuration (provider, model, api_key)
     */
    async generateOpportunity(
        scrapedContent: ScrapedContent,
        opportunityType: string,
        prompt: string,
        feedAIConfig?: {
            provider?: string;
            model?: string;
            api_key?: string;
        }
    ): Promise<AIGeneratedContent | null> {
        const startTime = Date.now();

        try {
            // Get provider config (feed-specific or global)
            const config = await this.getActiveProviderConfig(feedAIConfig);
            const provider = createAIProvider(config);

            // Build system message
            const systemMessage = `You are a professional content specialist for Gellobit.com.
You analyze opportunities and generate complete, factual content.
Return ONLY valid JSON in the exact format specified.
Never invent details not present in the source material.`;

            // Generate content
            const response = await provider.generateContent(
                prompt,
                systemMessage,
                {
                    max_tokens: config.max_tokens,
                    temperature: config.temperature,
                    response_format: 'json'
                }
            );

            if (!response.content) {
                throw new Error('Empty response from AI provider');
            }

            // Parse and validate response
            const parsed = this.parseResponse(response.content);

            if (!parsed) {
                await logger.error('Failed to parse AI response', {
                    provider: config.provider,
                    model: config.model,
                    response_length: response.content.length
                });
                return null;
            }

            // Log success
            const executionTime = Date.now() - startTime;
            await logger.info('AI content generated successfully', {
                provider: config.provider,
                model: config.model,
                opportunity_type: opportunityType,
                valid: parsed.valid,
                execution_time_ms: executionTime,
                tokens_used: response.usage?.total_tokens || 0
            });

            return parsed;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            await logger.error('AI generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                opportunity_type: opportunityType,
                execution_time_ms: executionTime
            });
            return null;
        }
    }

    /**
     * Parse AI response into structured format
     */
    private parseResponse(content: string): AIGeneratedContent | null {
        try {
            // Remove markdown code blocks if present
            let cleaned = content.trim();

            // Handle various markdown code block formats
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
            }

            // Try to find JSON object if there's extra text
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }

            // Log for debugging if it doesn't look like JSON
            if (!cleaned.startsWith('{')) {
                console.error('AI response does not appear to be JSON:', cleaned.substring(0, 200));
                return null;
            }

            const parsed = JSON.parse(cleaned);

            // Validate structure
            if (typeof parsed.valid !== 'boolean') {
                console.error('AI response missing valid field');
                return null;
            }

            // If invalid, return with reason
            if (!parsed.valid) {
                return {
                    valid: false,
                    reason: parsed.reason || 'Content rejected by AI'
                };
            }

            // Validate required fields for valid content
            if (!parsed.title || !parsed.content) {
                console.error('AI response missing required fields (title or content)');
                return null;
            }

            // Return structured content
            return {
                valid: true,
                title: this.cleanText(parsed.title, 150),
                excerpt: this.cleanText(parsed.excerpt || '', 300),
                content: parsed.content, // Keep HTML as is
                deadline: parsed.deadline || null,
                prize_value: parsed.prize_value || null,
                requirements: parsed.requirements || null,
                location: parsed.location || null,
                confidence_score: parsed.confidence_score || 1.0,
                meta_title: parsed.meta_title || null,
                meta_description: parsed.meta_description || null
            };

        } catch (error) {
            console.error('Error parsing AI response:', error);
            console.error('Raw content (first 500 chars):', content?.substring(0, 500));
            return null;
        }
    }

    /**
     * Clean and truncate text
     */
    private cleanText(text: string, maxLength: number): string {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, maxLength);
    }

    /**
     * Test connection to a specific AI provider
     */
    async testProvider(
        provider: AIProvider,
        apiKey: string,
        model: string
    ): Promise<AITestResult> {
        const startTime = Date.now();

        try {
            const providerInstance = createAIProvider({
                provider,
                api_key: apiKey,
                model,
                is_active: false,
                max_tokens: 100,
                temperature: 0.1,
                rate_limit_per_hour: 100
            });

            const success = await providerInstance.testConnection();
            const latency = Date.now() - startTime;

            return {
                success,
                provider,
                model,
                message: success ? 'Connection successful' : 'Connection failed',
                latency_ms: latency
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            return {
                success: false,
                provider,
                model,
                message: 'Connection failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                latency_ms: latency
            };
        }
    }

    /**
     * Get AI provider statistics
     */
    async getProviderStats() {
        const supabase = createAdminClient();

        const { data: settings } = await supabase
            .from('ai_settings')
            .select('*');

        const { data: logs } = await supabase
            .from('processing_logs')
            .select('context')
            .ilike('message', '%AI%')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        return {
            configured_providers: settings?.length || 0,
            active_provider: settings?.find(s => s.is_active)?.provider || null,
            calls_last_24h: logs?.length || 0
        };
    }
}

// Export singleton instance
export const aiService = AIService.getInstance();
