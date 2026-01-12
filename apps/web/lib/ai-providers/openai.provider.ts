import OpenAI from 'openai';
import { BaseAIProvider } from './base.provider';
import { AIResponse } from '../types/ai.types';

/**
 * OpenAI Provider (GPT-4o, GPT-4o-mini, etc.)
 */
export class OpenAIProvider extends BaseAIProvider {
    private client: OpenAI;

    constructor(config: any) {
        super(config);
        this.client = new OpenAI({
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
            const responseFormat = options?.response_format || 'json';

            const completion = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined
            });

            const content = completion.choices[0]?.message?.content || '';

            return {
                content,
                usage: {
                    prompt_tokens: completion.usage?.prompt_tokens,
                    completion_tokens: completion.usage?.completion_tokens,
                    total_tokens: completion.usage?.total_tokens
                }
            };
        } catch (error) {
            throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            // Make a minimal test request
            const completion = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
            });

            return !!completion.choices[0]?.message?.content;
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}
