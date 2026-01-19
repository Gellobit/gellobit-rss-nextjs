import { createAdminClient } from '../utils/supabase-admin';
import { parseRSSFeed, normalizeRSSItem } from '../utils/rss-parser';
import { logger } from '../utils/logger';
import { aiService } from './ai.service';
import { promptService } from './prompt.service';
import { scraperService } from './scraper.service';
import { duplicateCheckerService } from './duplicate-checker.service';
import { opportunityService } from './opportunity.service';
import { postService } from './post.service';
import { analyticsService } from './analytics.service';
import { settingsService } from './settings.service';
import { imageService } from './image.service';
import { buildBlogPostPrompt } from '../../prompts/blog_post.prompt';
import type { OpportunityType, FeedOutputType } from '../types/database.types';

/**
 * Feed processing result
 */
interface FeedProcessingResult {
  feedId: string;
  feedName: string;
  outputType: FeedOutputType;
  opportunityType: OpportunityType;
  itemsProcessed: number;
  opportunitiesCreated: number;
  postsCreated: number;
  duplicatesSkipped: number;
  aiRejections: number;
  errors: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * RSS Processor Service - Main orchestrator
 * Coordinates RSS parsing, scraping, AI processing, and opportunity creation
 */
export class RSSProcessorService {
  private static instance: RSSProcessorService;

  /**
   * Cron interval to milliseconds mapping
   */
  private static readonly INTERVAL_MS: Record<string, number> = {
    'every_5_minutes': 5 * 60 * 1000,
    'every_15_minutes': 15 * 60 * 1000,
    'every_30_minutes': 30 * 60 * 1000,
    'hourly': 60 * 60 * 1000,
    'every_2_hours': 2 * 60 * 60 * 1000,
    'every_6_hours': 6 * 60 * 60 * 1000,
    'every_12_hours': 12 * 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
  };

  private constructor() {}

  static getInstance(): RSSProcessorService {
    if (!RSSProcessorService.instance) {
      RSSProcessorService.instance = new RSSProcessorService();
    }
    return RSSProcessorService.instance;
  }

  /**
   * Check if a feed should be processed based on its cron_interval and last_fetched
   */
  private shouldProcessFeed(feed: { last_fetched: string | null; cron_interval: string | null }): boolean {
    // If never fetched, process it
    if (!feed.last_fetched) {
      return true;
    }

    const interval = feed.cron_interval || 'hourly';
    const intervalMs = RSSProcessorService.INTERVAL_MS[interval] || RSSProcessorService.INTERVAL_MS['hourly'];

    const lastFetched = new Date(feed.last_fetched).getTime();
    const now = Date.now();

    // Add 1 minute buffer to avoid edge cases
    return (now - lastFetched) >= (intervalMs - 60000);
  }

  /**
   * Process all active RSS feeds that are due for processing
   *
   * @returns Array of processing results
   */
  async processAllFeeds(): Promise<FeedProcessingResult[]> {
    await logger.info('Starting RSS feed processing run');

    const startTime = Date.now();
    const results: FeedProcessingResult[] = [];

    try {
      const supabase = createAdminClient();

      // Get all active feeds ordered by priority
      const { data: feeds, error } = await supabase
        .from('rss_feeds')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch feeds: ${error.message}`);
      }

      if (!feeds || feeds.length === 0) {
        await logger.info('No active feeds to process');
        return [];
      }

      // Filter feeds that are due for processing based on their cron_interval
      const feedsDue = feeds.filter(feed => this.shouldProcessFeed(feed));

      await logger.info(`Found ${feeds.length} active feeds, ${feedsDue.length} due for processing`);

      if (feedsDue.length === 0) {
        await logger.info('No feeds due for processing at this time');
        return [];
      }

      // Process feeds sequentially to avoid overwhelming AI providers
      for (const feed of feedsDue) {
        await logger.info(`Processing feed: ${feed.name} (interval: ${feed.cron_interval || 'hourly'}, last: ${feed.last_fetched || 'never'})`);

        const result = await this.processFeed(feed.id);
        results.push(result);

        // Small delay between feeds
        await this.delay(2000);
      }

      const totalTime = Date.now() - startTime;

      await logger.info('RSS processing run completed', {
        active_feeds: feeds.length,
        feeds_processed: feedsDue.length,
        successful_feeds: results.filter((r) => r.success).length,
        total_opportunities_created: results.reduce(
          (sum, r) => sum + r.opportunitiesCreated,
          0
        ),
        total_posts_created: results.reduce(
          (sum, r) => sum + r.postsCreated,
          0
        ),
        total_time_ms: totalTime,
      });

      return results;
    } catch (error) {
      await logger.error('RSS processing run failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return results;
    }
  }

  /**
   * Process a single RSS feed
   *
   * @param feedId - Feed ID to process
   * @returns Processing result
   */
  async processFeed(feedId: string): Promise<FeedProcessingResult> {
    const startTime = Date.now();

    const result: FeedProcessingResult = {
      feedId,
      feedName: '',
      outputType: 'opportunity',
      opportunityType: 'giveaway',
      itemsProcessed: 0,
      opportunitiesCreated: 0,
      postsCreated: 0,
      duplicatesSkipped: 0,
      aiRejections: 0,
      errors: 0,
      executionTimeMs: 0,
      success: false,
    };

    try {
      const supabase = createAdminClient();

      // Get feed configuration
      const { data: feed, error: feedError } = await supabase
        .from('rss_feeds')
        .select('*')
        .eq('id', feedId)
        .single();

      if (feedError || !feed) {
        throw new Error(`Feed not found: ${feedId}`);
      }

      result.feedName = feed.name;
      result.outputType = feed.output_type || 'opportunity';
      result.opportunityType = feed.opportunity_type;

      await logger.info('Processing feed', {
        feed_id: feedId,
        feed_name: feed.name,
        feed_url: feed.url,
        output_type: feed.output_type || 'opportunity',
        opportunity_type: feed.opportunity_type,
      });

      // Parse RSS feed
      const rssItems = await parseRSSFeed(feed.url);

      if (!rssItems || rssItems.length === 0) {
        await logger.warning('No items found in RSS feed', {
          feed_id: feedId,
        });
        result.executionTimeMs = Date.now() - startTime;
        result.success = true;
        return result;
      }

      await logger.info(`Found ${rssItems.length} items in feed`, {
        feed_id: feedId,
      });

      // Load system settings
      const maxPostsPerRun = await settingsService.get('general.max_posts_per_run');
      const globalQualityThreshold = await settingsService.get('general.quality_threshold');
      const globalAutoPublish = await settingsService.get('general.auto_publish');

      // Limit items to process based on max_posts_per_run setting
      const itemsToProcess = rssItems.slice(0, maxPostsPerRun);

      if (itemsToProcess.length < rssItems.length) {
        await logger.info(`Limiting processing to ${maxPostsPerRun} items (${rssItems.length} available)`, {
          feed_id: feedId,
        });
      }

      // Process each RSS item
      for (const item of itemsToProcess) {
        try {
          result.itemsProcessed++;

          // Normalize RSS item
          const normalized = normalizeRSSItem(item);

          if (!normalized.title || !normalized.link) {
            await logger.warning('Skipping invalid RSS item', {
              feed_id: feedId,
              item_title: item.title,
            });
            continue;
          }

          // Check for duplicates BEFORE scraping (unless allow_republishing is enabled)
          const preliminaryContent = {
            title: normalized.title,
            content: normalized.content || normalized.contentSnippet || '',
            url: normalized.link,
          };

          if (!feed.allow_republishing) {
            const duplicateCheck = await duplicateCheckerService.isDuplicate(
              preliminaryContent,
              feedId
            );

            if (duplicateCheck.isDuplicate) {
              result.duplicatesSkipped++;
              await logger.debug('Skipping duplicate item', {
                feed_id: feedId,
                item_url: normalized.link,
                reason: duplicateCheck.reason,
              });
              continue;
            }
          } else {
            await logger.debug('Skipping duplicate check - allow_republishing enabled', {
              feed_id: feedId,
              item_url: normalized.link,
            });
          }

          // Scrape full content (if enabled)
          let scrapedContent = preliminaryContent;

          if (feed.enable_scraping) {
            const scraped = await scraperService.scrapeUrl(
              normalized.link,
              feedId
            );

            if (scraped) {
              scrapedContent = scraped;
            } else {
              await logger.warning('Failed to scrape content, using RSS content', {
                feed_id: feedId,
                item_url: normalized.link,
              });
            }
          }

          // Generate AI content (if enabled)
          if (!feed.enable_ai_processing) {
            await logger.debug('AI processing disabled for feed', {
              feed_id: feedId,
            });
            continue;
          }

          // Get appropriate prompt based on output type
          const outputType = feed.output_type || 'opportunity';
          let prompt: string;

          if (outputType === 'blog_post') {
            // Use blog post prompt for blog output
            prompt = buildBlogPostPrompt(scrapedContent);
          } else {
            // Use opportunity-specific prompt
            prompt = await promptService.getPrompt(
              feed.opportunity_type,
              scrapedContent
            );
          }

          // Generate content with AI (use feed-specific AI config if available)
          const aiContent = await aiService.generateOpportunity(
            scrapedContent,
            feed.opportunity_type,
            prompt,
            {
              provider: feed.ai_provider,
              model: feed.ai_model,
              api_key: feed.ai_api_key,
            }
          );

          if (!aiContent) {
            result.errors++;
            await logger.error('AI generation failed', {
              feed_id: feedId,
              item_url: normalized.link,
              output_type: outputType,
            });
            continue;
          }

          if (!aiContent.valid) {
            result.aiRejections++;
            await logger.info('Content rejected by AI', {
              feed_id: feedId,
              feed_name: feed.name,
              title: scrapedContent.title,
              source_url: normalized.link,
              reason: aiContent.reason || 'Content not suitable for processing',
              output_type: outputType,
              opportunity_type: feed.opportunity_type,
              ai_provider: feed.ai_provider,
            });
            continue;
          }

          // Check quality threshold (feed setting overrides global)
          const qualityThreshold = feed.quality_threshold ?? globalQualityThreshold ?? 0.7;

          if (
            aiContent.confidence_score &&
            aiContent.confidence_score < qualityThreshold
          ) {
            result.aiRejections++;
            await logger.info('Content rejected - below quality threshold', {
              feed_id: feedId,
              feed_name: feed.name,
              title: aiContent.title || scrapedContent.title,
              source_url: normalized.link,
              reason: `Quality score ${(aiContent.confidence_score * 100).toFixed(0)}% below threshold ${(qualityThreshold * 100).toFixed(0)}%`,
              confidence_score: aiContent.confidence_score,
              threshold: qualityThreshold,
              output_type: outputType,
              opportunity_type: feed.opportunity_type,
              ai_provider: feed.ai_provider,
            });
            continue;
          }

          // Determine auto-publish (feed setting takes priority, then global default)
          const shouldAutoPublish = feed.auto_publish ?? globalAutoPublish ?? false;

          // Create content based on output type
          let createdId: string | null = null;

          if (outputType === 'blog_post') {
            // For blog posts: scrape and store images locally
            let processedFeaturedImage: string | null = null;
            let processedContent = aiContent.content || '';

            try {
              // Get scraped featured image (from scraper result or RSS item)
              const scrapedFeaturedImage = (scrapedContent as any).image ||
                                           (scrapedContent as any).featuredImage ||
                                           normalized.featuredImage ||
                                           null;

              // Process images: download and store in Supabase Storage
              const imageResult = await imageService.processPostImages(
                scrapedFeaturedImage,
                processedContent,
                {
                  fallbackFeaturedUrl: feed.fallback_featured_image_url || null,
                  baseUrl: normalized.link,
                }
              );

              processedFeaturedImage = imageResult.featuredImageUrl;
              processedContent = imageResult.content;

              // Log image processing stats
              if (imageResult.stats.featuredUploaded || imageResult.stats.contentImagesUploaded > 0) {
                await logger.info('Blog post images processed', {
                  feed_id: feedId,
                  featured_uploaded: imageResult.stats.featuredUploaded,
                  content_images_uploaded: imageResult.stats.contentImagesUploaded,
                  content_images_failed: imageResult.stats.contentImagesFailed,
                });
              }
            } catch (imageError) {
              await logger.warning('Image processing failed, using fallback', {
                feed_id: feedId,
                error: imageError instanceof Error ? imageError.message : 'Unknown error',
              });
              processedFeaturedImage = feed.fallback_featured_image_url || null;
            }

            // Update aiContent with processed content
            const aiContentWithImages = {
              ...aiContent,
              content: processedContent,
            };

            // Create blog post with category from feed settings
            createdId = await postService.createFromAI(
              aiContentWithImages,
              normalized.link,
              feedId,
              shouldAutoPublish,
              processedFeaturedImage,
              feed.blog_category_id || null // Pass the feed's category or let service use default
            );

            if (createdId) {
              result.postsCreated++;

              // Link uploaded images to the created post
              // Note: Images are already tracked during upload, but we can update entity_id now
              await logger.info('Blog post created successfully', {
                feed_id: feedId,
                post_id: createdId,
                auto_published: shouldAutoPublish,
                category_id: feed.blog_category_id || 'default',
                has_featured_image: !!processedFeaturedImage,
              });
            }
          } else {
            // For opportunities: use fallback featured image only (no scraping)
            const featuredImageUrl = feed.fallback_featured_image_url || null;
            // Create opportunity
            createdId = await opportunityService.createFromAI(
              aiContent,
              feed.opportunity_type,
              normalized.link,
              feedId,
              shouldAutoPublish,
              featuredImageUrl
            );

            if (createdId) {
              result.opportunitiesCreated++;
              await logger.info('Opportunity created successfully', {
                feed_id: feedId,
                opportunity_id: createdId,
                opportunity_type: feed.opportunity_type,
                auto_published: shouldAutoPublish,
              });
            }
          }

          if (!createdId) {
            result.errors++;
            continue;
          }

          // Record in duplicate tracking
          await duplicateCheckerService.recordContent(
            scrapedContent,
            createdId,
            feedId
          );
        } catch (itemError) {
          result.errors++;
          await logger.error('Error processing RSS item', {
            feed_id: feedId,
            item_title: item.title,
            error:
              itemError instanceof Error
                ? itemError.message
                : 'Unknown error',
          });
        }
      }

      // Update feed statistics
      await this.updateFeedStats(feedId, result);

      result.executionTimeMs = Date.now() - startTime;
      result.success = true;

      // Record analytics
      await analyticsService.recordProcessing(result);

      await logger.info('Feed processing completed', {
        feed_id: feedId,
        output_type: result.outputType,
        items_processed: result.itemsProcessed,
        opportunities_created: result.opportunitiesCreated,
        posts_created: result.postsCreated,
        duplicates_skipped: result.duplicatesSkipped,
        ai_rejections: result.aiRejections,
        errors: result.errors,
        execution_time_ms: result.executionTimeMs,
      });

      return result;
    } catch (error) {
      result.executionTimeMs = Date.now() - startTime;
      result.error =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Feed processing failed', {
        feed_id: feedId,
        error: result.error,
        execution_time_ms: result.executionTimeMs,
      });

      return result;
    }
  }

  /**
   * Update feed statistics
   *
   * @param feedId - Feed ID
   * @param result - Processing result
   */
  private async updateFeedStats(
    feedId: string,
    result: FeedProcessingResult
  ) {
    try {
      const supabase = createAdminClient();

      const { data: feed } = await supabase
        .from('rss_feeds')
        .select('total_processed, total_published')
        .eq('id', feedId)
        .single();

      if (!feed) return;

      await supabase
        .from('rss_feeds')
        .update({
          total_processed:
            (feed.total_processed || 0) + result.itemsProcessed,
          total_published:
            (feed.total_published || 0) +
            result.opportunitiesCreated,
          last_fetched: new Date().toISOString(),
        })
        .eq('id', feedId);

      await logger.debug('Feed statistics updated', {
        feed_id: feedId,
      });
    } catch (error) {
      await logger.error('Error updating feed statistics', {
        feed_id: feedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Utility delay function
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get processing statistics
   *
   * @returns Overall processing stats
   */
  async getStats() {
    const supabase = createAdminClient();

    const { data: feeds } = await supabase
      .from('rss_feeds')
      .select('id, name, total_processed, total_published');

    const { data: recentLogs } = await supabase
      .from('processing_logs')
      .select('level')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const errors =
      recentLogs?.filter((l) => l.level === 'error').length || 0;

    return {
      total_feeds: feeds?.length || 0,
      total_items_processed:
        feeds?.reduce((sum, f) => sum + (f.total_processed || 0), 0) ||
        0,
      total_opportunities_created:
        feeds?.reduce(
          (sum, f) => sum + (f.total_published || 0),
          0
        ) || 0,
      errors_last_24h: errors,
    };
  }
}

// Export singleton instance
export const rssProcessorService = RSSProcessorService.getInstance();
