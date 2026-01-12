import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base.provider';
import { AIResponse } from '../types/ai.types';

/**
 * Google Gemini Provider (Gemini 2.0 Flash, Pro, 1.5 Flash, etc.)
 */
export class GeminiProvider extends BaseAIProvider {
    private client: GoogleGenerativeAI;

    constructor(config: any) {
        super(config);
        this.client = new GoogleGenerativeAI(config.api_key);
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

            const model = this.client.getGenerativeModel({
                model: this.config.model,
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens
                }
            });

            // Combine system message and prompt
            let fullPrompt = `${systemMessage}\n\n${prompt}`;

            // Add JSON instruction if needed
            if (options?.response_format === 'json') {
                fullPrompt += '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just pure JSON.';
            }

            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const content = response.text();

            return {
                content,
                usage: {
                    // Gemini doesn't provide token counts easily, so we estimate
                    total_tokens: Math.ceil((fullPrompt.length + content.length) / 4)
                }
            };
        } catch (error) {
            throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model
            });

            const result = await model.generateContent('Test');
            const response = result.response;

            return !!response.text();
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}
