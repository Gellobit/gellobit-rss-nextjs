import { AIProvider, AISettings } from './database.types';

/**
 * AI-related types for providers and processing
 */

// ============================================================================
// AI Response Types
// ============================================================================

/**
 * Unified AI response structure (single call generates all content)
 */
export interface AIGeneratedContent {
    valid: boolean;
    title?: string;
    excerpt?: string;
    content?: string;
    deadline?: string | null;
    prize_value?: string | null;
    requirements?: string | null;
    location?: string | null;
    confidence_score?: number;
    reason?: string; // Rejection reason if valid=false
    // Blog post specific fields
    meta_title?: string | null;
    meta_description?: string | null;
}

/**
 * Raw AI API response
 */
export interface AIResponse {
    content: string;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
}

// ============================================================================
// AI Provider Options
// ============================================================================

export interface AIOptions {
    provider?: AIProvider;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system_message?: string;
    response_format?: 'text' | 'json';
}

// ============================================================================
// AI Provider Configuration
// ============================================================================

export interface AIProviderConfig extends Omit<AISettings, 'id' | 'created_at' | 'updated_at'> {
    provider: AIProvider;
    api_key: string;
    model: string;
    max_tokens: number;
    temperature: number;
}

// ============================================================================
// Prompt Context
// ============================================================================

export interface PromptContext {
    original_title: string;
    matched_content: string;
    source_url: string;
    feed_name?: string;
    feed_url?: string;
}

// ============================================================================
// Scraped Content (input to AI)
// ============================================================================

export interface ScrapedContent {
    title: string;
    description?: string;
    text: string;
    html?: string;
    image?: string;
    author?: string;
    published_date?: string;
    url: string;
    images?: string[];
    links?: string[];
}

// ============================================================================
// Processing Result Types
// ============================================================================

export interface ProcessingResult {
    success: boolean;
    message?: string;
    processed_feeds?: number;
    created_opportunities?: number;
    skipped_items?: number;
    errors?: string[];
    execution_time_ms?: number;
}

export interface FeedProcessingResult {
    success: boolean;
    feed_id: string;
    feed_name: string;
    items_processed: number;
    items_created: number;
    items_skipped: number;
    items_rejected: number;
    errors: string[];
}

export interface ItemProcessingResult {
    success: boolean;
    item_title: string;
    item_url: string;
    opportunity_id?: string;
    status: 'created' | 'skipped' | 'rejected';
    reason?: string;
}

// ============================================================================
// AI Test Result
// ============================================================================

export interface AITestResult {
    success: boolean;
    provider: AIProvider;
    model: string;
    message: string;
    response?: string;
    error?: string;
    latency_ms?: number;
}
