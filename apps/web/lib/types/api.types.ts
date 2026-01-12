/**
 * API request and response types
 */

import { RSSFeed, Opportunity, AISettings, ProcessingLog, Analytics } from './database.types';
import { AITestResult, ProcessingResult } from './ai.types';

// ============================================================================
// Common API Responses
// ============================================================================

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
}

// ============================================================================
// Feed API Types
// ============================================================================

export interface GetFeedsResponse extends PaginatedResponse<RSSFeed> {}

export interface GetFeedResponse {
    feed: RSSFeed;
}

export interface CreateFeedResponse {
    feed: RSSFeed;
    message: string;
}

export interface UpdateFeedResponse {
    feed: RSSFeed;
    message: string;
}

export interface DeleteFeedResponse {
    success: boolean;
    message: string;
}

export interface SyncFeedResponse extends ProcessingResult {
    feed_id: string;
    feed_name: string;
}

// ============================================================================
// Opportunity API Types
// ============================================================================

export interface GetOpportunitiesResponse extends PaginatedResponse<Opportunity> {}

export interface GetOpportunityResponse {
    opportunity: Opportunity;
}

export interface CreateOpportunityResponse {
    opportunity: Opportunity;
    message: string;
}

export interface UpdateOpportunityResponse {
    opportunity: Opportunity;
    message: string;
}

export interface DeleteOpportunityResponse {
    success: boolean;
    message: string;
}

// ============================================================================
// AI Settings API Types
// ============================================================================

export interface GetAISettingsResponse {
    settings: AISettings[];
}

export interface GetActiveAISettingResponse {
    setting: AISettings | null;
}

export interface CreateAISettingResponse {
    setting: AISettings;
    message: string;
}

export interface UpdateAISettingResponse {
    setting: AISettings;
    message: string;
}

export interface TestAIConnectionResponse extends AITestResult {}

// ============================================================================
// Logs API Types
// ============================================================================

export interface GetLogsResponse extends PaginatedResponse<ProcessingLog> {}

export interface GetLogsFilters {
    level?: string;
    feed_id?: string;
    start_date?: string;
    end_date?: string;
}

// ============================================================================
// Analytics API Types
// ============================================================================

export interface GetAnalyticsResponse {
    metrics: Analytics[];
    summary: {
        total_feeds: number;
        active_feeds: number;
        total_opportunities: number;
        published_opportunities: number;
        total_processed_items: number;
        success_rate: number;
        average_confidence_score: number;
    };
}

export interface DashboardStats {
    feeds: {
        total: number;
        active: number;
        error: number;
    };
    opportunities: {
        total: number;
        published: number;
        draft: number;
        rejected: number;
    };
    processing: {
        last_24h: number;
        success_rate: number;
        average_time_ms: number;
    };
    ai: {
        total_calls_today: number;
        average_confidence: number;
        rejection_rate: number;
    };
}

// ============================================================================
// Cron API Types
// ============================================================================

export interface CronProcessResponse extends ProcessingResult {
    timestamp: string;
}

// ============================================================================
// Prompt API Types
// ============================================================================

export interface GetPromptsResponse {
    prompts: {
        opportunity_type: string;
        is_customized: boolean;
        version: number;
    }[];
}

export interface GetPromptResponse {
    opportunity_type: string;
    unified_prompt: string;
    default_prompt: string;
    is_customized: boolean;
    version: number;
}

export interface UpdatePromptResponse {
    message: string;
    version: number;
}

export interface ResetPromptResponse {
    message: string;
}
