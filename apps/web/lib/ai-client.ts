import OpenAI from 'openai';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Define the shape of our AI config
type AIConfig = {
    provider: 'openai' | 'deepseek' | 'anthropic';
    api_key: string;
    model: string;
};

export async function getAIConfig(): Promise<AIConfig | null> {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore } as any);

    // In a real scenario, you'd want to cache this or use environment variables for fallback
    const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data as AIConfig;
}

export async function generateContent(prompt: string, systemMessage: string) {
    const config = await getAIConfig();

    if (!config || !config.api_key) {
        throw new Error('AI Configuration missing or inactive.');
    }

    if (config.provider === 'openai') {
        const openai = new OpenAI({ apiKey: config.api_key });
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            model: config.model || 'gpt-4o-mini',
        });
        return completion.choices[0].message.content;
    }

    // Placeholder for other providers
    throw new Error(`Provider ${config.provider} not yet implemented.`);
}
