import { z } from 'zod';

/**
 * Validation schemas using Zod for API request validation
 */

// ============================================================================
// RSS Feed Schemas
// ============================================================================

export const createFeedSchema = z.object({
    name: z.string().min(1, 'Feed name is required').max(255),
    url: z.string().url('Invalid URL').min(1, 'URL is required'),
    opportunity_type: z.enum([
        'contest',
        'giveaway',
        'sweepstakes',
        'dream_job',
        'get_paid_to',
        'instant_win',
        'job_fair',
        'scholarship',
        'volunteer',
        'free_training',
        'promo'
    ]),
    status: z.enum(['active', 'inactive', 'error']).optional().default('active'),
    enable_scraping: z.boolean().optional().default(true),
    enable_ai_processing: z.boolean().optional().default(true),
    auto_publish: z.boolean().optional().default(false),
    ai_provider: z.string().optional().default('default'),
    keywords: z.array(z.string()).optional().default([]),
    exclude_keywords: z.array(z.string()).optional().default([]),
    quality_threshold: z.number().min(0).max(1).optional().default(0.6),
    feed_interval: z.string().optional().default('hourly')
});

export const updateFeedSchema = createFeedSchema.partial();

export type CreateFeedInput = z.infer<typeof createFeedSchema>;
export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;

// ============================================================================
// AI Settings Schemas
// ============================================================================

export const createAISettingsSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'deepseek', 'gemini']),
    api_key: z.string().min(1, 'API key is required'),
    model: z.string().min(1, 'Model is required'),
    is_active: z.boolean().optional().default(false),
    max_tokens: z.number().positive().optional().default(1500),
    temperature: z.number().min(0).max(2).optional().default(0.1),
    rate_limit_per_hour: z.number().positive().optional().default(100)
});

export const updateAISettingsSchema = createAISettingsSchema.partial();

export type CreateAISettingsInput = z.infer<typeof createAISettingsSchema>;
export type UpdateAISettingsInput = z.infer<typeof updateAISettingsSchema>;

// ============================================================================
// Opportunity Schemas
// ============================================================================

export const createOpportunitySchema = z.object({
    title: z.string().min(1, 'Title is required'),
    excerpt: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
    opportunity_type: z.enum([
        'contest',
        'giveaway',
        'sweepstakes',
        'dream_job',
        'get_paid_to',
        'instant_win',
        'job_fair',
        'scholarship',
        'volunteer',
        'free_training',
        'promo'
    ]),
    deadline: z.string().datetime().optional().nullable(),
    prize_value: z.string().optional().nullable(),
    requirements: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    source_url: z.string().url('Invalid source URL'),
    source_feed_id: z.string().uuid().optional().nullable(),
    confidence_score: z.number().min(0).max(1).optional().nullable(),
    featured_image_url: z.string().url().optional().nullable(),
    status: z.enum(['draft', 'published', 'rejected']).optional().default('draft')
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

// ============================================================================
// Prompt Template Schemas
// ============================================================================

export const updatePromptSchema = z.object({
    opportunity_type: z.enum([
        'contest',
        'giveaway',
        'sweepstakes',
        'dream_job',
        'get_paid_to',
        'instant_win',
        'job_fair',
        'scholarship',
        'volunteer',
        'free_training',
        'promo'
    ]),
    unified_prompt: z.string().min(1, 'Prompt is required')
});

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const paginationSchema = z.object({
    limit: z.coerce.number().positive().max(100).optional().default(20),
    offset: z.coerce.number().nonnegative().optional().default(0)
});

export const opportunityFiltersSchema = paginationSchema.extend({
    status: z.enum(['draft', 'published', 'rejected']).optional(),
    opportunity_type: z.string().optional(),
    search: z.string().optional()
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type OpportunityFilters = z.infer<typeof opportunityFiltersSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export async function validateRequestBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    try {
        const body = await request.json();
        return schema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}

/**
 * Validate URL search params against a Zod schema
 */
export function validateSearchParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
): T {
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
}

/**
 * Safe parse that returns { success, data, error }
 */
export function safeParse<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            };
        }
        return { success: false, error: 'Unknown validation error' };
    }
}
