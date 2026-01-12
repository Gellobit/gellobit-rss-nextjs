import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base.provider';
import { AIResponse } from '../types/ai.types';

/**
 * Anthropic Claude Provider (Claude 3.5 Sonnet, etc.)
 */
export class ClaudeProvider extends BaseAIProvider {
    private client: Anthropic;

    constructor(config: any) {
        super(config);
        this.client = new Anthropic({
            apiKey: config.api_key
        });
    }

    async generateContent(
        prompt: string,
        systemMessage: string,
        options?: {
            max_tokens?: number;
            temperature?: number;
            response_format?: 'text' | 'json';
        }
    ): Promise<AIResponse> {
        try {
            const maxTokens = options?.max_tokens || this.config.max_tokens;
            const temperature = options?.temperature ?? this.config.temperature;

            // Add JSON instruction to prompt if needed
            let enhancedPrompt = prompt;
            if (options?.response_format === 'json') {
                enhancedPrompt = `${prompt}\n\nIMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just pure JSON.`;
            }

            const message = await this.client.messages.create({
                model: this.config.model,
                max_tokens: maxTokens,
                temperature: temperature,
                system: systemMessage,
                messages: [
                    { role: 'user', content: enhancedPrompt }
                ]
            });

            const content = message.content[0]?.type === 'text'
                ? message.content[0].text
                : '';

            return {
                content,
                usage: {
                    prompt_tokens: message.usage.input_tokens,
                    completion_tokens: message.usage.output_tokens,
                    total_tokens: message.usage.input_tokens + message.usage.output_tokens
                }
            };
        } catch (error) {
            throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const message = await this.client.messages.create({
                model: this.config.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test' }]
            });

            return message.content.length > 0;
        } catch (error: any) {
            console.error('Claude connection test failed:', error);

            // Extract meaningful error message
            let errorMessage = 'Connection failed';
            if (error?.error?.message) {
                errorMessage = error.error.message;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (error?.error?.type) {
                errorMessage = `Error type: ${error.error.type}`;
            }

            throw new Error(errorMessage);
        }
    }
}
