/**
 * Database types matching Supabase schema
 * These types should ideally be generated with: npx supabase gen types typescript
 * For now, manually defined based on migration schema
 */

export type OpportunityType =
    | 'contest'
    | 'giveaway'
    | 'sweepstakes'
    | 'dream_job'
    | 'get_paid_to'
    | 'instant_win'
    | 'job_fair'
    | 'scholarship'
    | 'volunteer'
    | 'free_training'
    | 'promo';

export type FeedStatus = 'active' | 'inactive' | 'error';
export type OpportunityStatus = 'draft' | 'published' | 'rejected';
export type AIProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini';
export type FeedOutputType = 'opportunity' | 'blog_post';
export type FeedSourceType = 'rss' | 'url_list';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ProcessingStatus = 'published' | 'rejected';
export type UserRole = 'admin' | 'user';

// ============================================================================
// Table Types
// ============================================================================

export interface Profile {
    id: string;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface RSSFeed {
    id: string;
    name: string;
    url: string;
    status: FeedStatus;
    output_type: FeedOutputType;
    source_type: FeedSourceType;
    url_list: string | null;
    url_list_offset: number;
    opportunity_type: OpportunityType;
    blog_category_id: string | null;
    enable_scraping: boolean;
    enable_ai_processing: boolean;
    auto_publish: boolean;
    allow_republishing: boolean;
    ai_provider: string;
    keywords: string[];
    exclude_keywords: string[];
    quality_threshold: number;
    feed_interval: string;
    last_fetched: string | null;
    last_error: string | null;
    error_count: number;
    total_processed: number;
    total_published: number;
    preserve_source_slug: boolean;
    preserve_source_title: boolean;
    fallback_featured_image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Opportunity {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    opportunity_type: OpportunityType;
    deadline: string | null;
    prize_value: string | null;
    requirements: string | null;
    location: string | null;
    source_url: string;
    source_feed_id: string | null;
    confidence_score: number | null;
    featured_image_url: string | null;
    status: OpportunityStatus;
    rejection_reason: string | null;
    processed_at: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface AISettings {
    id: string;
    provider: AIProvider;
    api_key: string;
    model: string;
    is_active: boolean;
    max_tokens: number;
    temperature: number;
    rate_limit_per_hour: number;
    created_at: string;
    updated_at: string;
}

export interface ProcessingLog {
    id: string;
    level: LogLevel;
    message: string;
    context: Record<string, any> | null;
    feed_id: string | null;
    opportunity_id: string | null;
    execution_time_ms: number | null;
    created_at: string;
}

export interface DuplicateTracking {
    id: string;
    content_hash: string;
    title_hash: string;
    url_hash: string;
    opportunity_id: string;
    feed_id: string;
    similarity_score: number | null;
    created_at: string;
}

export interface AIQueue {
    id: string;
    opportunity_id: string;
    content_hash: string;
    status: QueueStatus;
    priority: number;
    attempts: number;
    max_attempts: number;
    input_data: Record<string, any> | null;
    output_data: Record<string, any> | null;
    error_message: string | null;
    processing_time_ms: number | null;
    scheduled_for: string;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface Analytics {
    id: string;
    date: string;
    metric_type: string;
    metric_value: number;
    feed_id: string | null;
    opportunity_type: OpportunityType | null;
    metadata: Record<string, any> | null;
    created_at: string;
}

export interface ProcessingHistory {
    id: string;
    feed_id: string;
    feed_name: string;
    ai_provider: string | null;
    item_title: string;
    item_url: string;
    status: ProcessingStatus;
    reason: string | null;
    opportunity_id: string | null;
    created_at: string;
}

// PromptType includes all opportunity types plus 'blog_post' for blog content generation
export type PromptType = OpportunityType | 'blog_post';

export interface PromptTemplate {
    id: string;
    opportunity_type: PromptType;
    unified_prompt: string;
    default_prompt: string;
    is_customized: boolean;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    color: string;
    icon: string | null;
    display_order: number;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    status: 'draft' | 'published' | 'archived';
    category_id: string | null;
    author_id: string | null;
    source_url: string | null;
    source_feed_id: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Database Schema Type
// ============================================================================

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
            };
            rss_feeds: {
                Row: RSSFeed;
                Insert: Omit<RSSFeed, 'id' | 'created_at' | 'updated_at' | 'last_fetched' | 'last_error' | 'error_count' | 'total_processed' | 'total_published'>;
                Update: Partial<Omit<RSSFeed, 'id' | 'created_at' | 'updated_at'>>;
            };
            opportunities: {
                Row: Opportunity;
                Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>>;
            };
            ai_settings: {
                Row: AISettings;
                Insert: Omit<AISettings, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<AISettings, 'id' | 'created_at' | 'updated_at'>>;
            };
            processing_logs: {
                Row: ProcessingLog;
                Insert: Omit<ProcessingLog, 'id' | 'created_at'>;
                Update: never;
            };
            duplicate_tracking: {
                Row: DuplicateTracking;
                Insert: Omit<DuplicateTracking, 'id' | 'created_at'>;
                Update: never;
            };
            ai_queue: {
                Row: AIQueue;
                Insert: Omit<AIQueue, 'id' | 'created_at'>;
                Update: Partial<Omit<AIQueue, 'id' | 'created_at'>>;
            };
            analytics: {
                Row: Analytics;
                Insert: Omit<Analytics, 'id' | 'created_at'>;
                Update: never;
            };
            processing_history: {
                Row: ProcessingHistory;
                Insert: Omit<ProcessingHistory, 'id' | 'created_at'>;
                Update: never;
            };
            prompt_templates: {
                Row: PromptTemplate;
                Insert: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>>;
            };
            categories: {
                Row: Category;
                Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
            };
            posts: {
                Row: Post;
                Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}
