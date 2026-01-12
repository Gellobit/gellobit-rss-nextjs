import { AIProviderConfig, AIResponse, AIGeneratedContent } from '../types/ai.types';

/**
 * Abstract base class for all AI providers
 * Provides unified interface for OpenAI, Claude, DeepSeek, and Gemini
 */
export abstract class BaseAIProvider {
    protected config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
    }

    /**
     * Generate content using the AI provider
     * Must be implemented by each provider
     */
    abstract generateContent(
        prompt: string,
        systemMessage: string,
        options?: {
            max_tokens?: number;
            temperature?: number;
            response_format?: 'text' | 'json';
        }
    ): Promise<AIResponse>;

    /**
     * Test connection to AI provider
     * Returns true if API key is valid and provider is reachable
     */
    abstract testConnection(): Promise<boolean>;

    /**
     * Parse AI response into structured content
     * Handles both JSON and text responses
     */
    protected parseAIResponse(content: string): AIGeneratedContent | null {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(content);

            // Validate required fields
            if (typeof parsed.valid !== 'boolean') {
                return null;
            }

            // If invalid, only need reason
            if (!parsed.valid) {
                return {
                    valid: false,
                    reason: parsed.reason || 'Content rejected by AI'
                };
            }

            // If valid, ensure required fields exist
            if (!parsed.title || !parsed.excerpt || !parsed.content) {
                return null;
            }

            return {
                valid: true,
                title: parsed.title,
                excerpt: parsed.excerpt,
                content: parsed.content,
                deadline: parsed.deadline || null,
                prize_value: parsed.prize_value || null,
                requirements: parsed.requirements || null,
                location: parsed.location || null,
                confidence_score: parsed.confidence_score || null
            };
        } catch (error) {
            // If not valid JSON, check if it's a rejection message
            if (content.toLowerCase().includes('invalid content')) {
                return {
                    valid: false,
                    reason: content
                };
            }
            return null;
        }
    }

    /**
     * Validate API response structure
     */
    protected validateResponse(response: AIResponse): boolean {
        return !!(response && response.content && typeof response.content === 'string');
    }

    /**
     * Get provider name
     */
    getProviderName(): string {
        return this.config.provider;
    }

    /**
     * Get model name
     */
    getModelName(): string {
        return this.config.model;
    }

    /**
     * Get configuration (without API key for security)
     */
    getConfig(): Omit<AIProviderConfig, 'api_key'> {
        const { api_key, ...safeConfig } = this.config;
        return safeConfig;
    }
}
