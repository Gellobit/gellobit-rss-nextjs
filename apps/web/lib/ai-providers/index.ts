import { BaseAIProvider } from './base.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { GeminiProvider } from './gemini.provider';
import { AIProviderConfig } from '../types/ai.types';

/**
 * Factory function to create AI provider instances
 * @param config - Provider configuration
 * @returns Instance of the appropriate AI provider
 */
export function createAIProvider(config: AIProviderConfig): BaseAIProvider {
    switch (config.provider) {
        case 'openai':
            return new OpenAIProvider(config);
        case 'anthropic':
            return new ClaudeProvider(config);
        case 'deepseek':
            return new DeepSeekProvider(config);
        case 'gemini':
            return new GeminiProvider(config);
        default:
            throw new Error(`Unknown AI provider: ${config.provider}`);
    }
}

// Export all providers
export {
    BaseAIProvider,
    OpenAIProvider,
    ClaudeProvider,
    DeepSeekProvider,
    GeminiProvider
};

// Export types
export type { AIProviderConfig } from '../types/ai.types';
