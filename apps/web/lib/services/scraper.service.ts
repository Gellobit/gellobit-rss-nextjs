import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { settingsService } from './settings.service';
import type { ScrapedContent } from '../../prompts';

/**
 * Extended scraped content with additional metadata
 */
export interface ScrapedContentExtended extends ScrapedContent {
  description?: string;
  author?: string;
  publishedDate?: string;
  image?: string;
  htmlContent?: string; // HTML content for passthrough (preserves formatting)
}

/**
 * Scraper Service - Enhanced web scraping with Google redirect handling
 * Extracts clean content from URLs for AI processing
 */
export class ScraperService {
  private static instance: ScraperService;

  /**
   * User Agent rotation array for anti-bot detection
   * Rotates between different browser signatures
   */
  private readonly userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];

  private constructor() {}

  /**
   * Get a random User Agent from the rotation array
   */
  private getRandomUserAgent(): string {
    const index = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[index];
  }

  /**
   * Validate URL before attempting to fetch
   * Checks for valid format and allowed schemes
   */
  private validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);

      // Check for allowed schemes
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: `Invalid URL scheme: ${parsed.protocol}` };
      }

      // Check for valid hostname
      if (!parsed.hostname || parsed.hostname.length === 0) {
        return { valid: false, error: 'Missing hostname' };
      }

      // Block localhost and private IPs for security
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.')
      ) {
        return { valid: false, error: 'Private/local URLs not allowed' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  /**
   * Scrape content from a URL
   *
   * @param url - URL to scrape
   * @param feedId - Optional feed ID for logging
   * @returns Scraped content with metadata or null if failed
   */
  async scrapeUrl(
    url: string,
    feedId?: string
  ): Promise<ScrapedContentExtended | null> {
    const startTime = Date.now();

    try {
      // Validate URL before proceeding
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.valid) {
        throw new Error(`URL validation failed: ${urlValidation.error}`);
      }

      // Load scraping settings
      const followGoogleFeedproxy = await settingsService.get('scraping.follow_google_feedproxy');

      // Resolve Google FeedProxy redirects (if enabled)
      const resolvedUrl = followGoogleFeedproxy
        ? await this.resolveGoogleRedirect(url)
        : url;

      // Validate resolved URL as well (redirect could point to invalid URL)
      if (resolvedUrl !== url) {
        const resolvedValidation = this.validateUrl(resolvedUrl);
        if (!resolvedValidation.valid) {
          throw new Error(`Resolved URL validation failed: ${resolvedValidation.error}`);
        }
      }

      // Load settings for scraping
      const timeout = await settingsService.get('scraping.request_timeout');
      const configuredUserAgent = await settingsService.get('scraping.user_agent');
      const minContentLength = await settingsService.get('scraping.min_content_length');
      const maxContentLength = await settingsService.get('scraping.max_content_length');

      // Use configured User Agent or rotate from array
      const userAgent = configuredUserAgent || this.getRandomUserAgent();

      // Fetch content with charset handling
      const { html, charset } = await this.fetchHtmlWithCharset(resolvedUrl, userAgent, timeout);

      if (!html) {
        throw new Error('Empty response from URL');
      }

      // Extract content with Cheerio (includes metadata)
      const scraped = this.extractContentWithMetadata(html, resolvedUrl, minContentLength, maxContentLength);

      const executionTime = Date.now() - startTime;

      await logger.info('Content scraped successfully', {
        url: resolvedUrl,
        feed_id: feedId,
        content_length: scraped.content.length,
        charset_detected: charset,
        has_metadata: !!(scraped.description || scraped.author || scraped.image),
        execution_time_ms: executionTime,
      });

      return scraped;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      await logger.error('Scraping failed', {
        url,
        feed_id: feedId,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime,
      });

      return null;
    }
  }

  /**
   * Resolve Google redirect URLs (Alerts, FeedProxy) to final destination URL
   * Matches WordPress plugin behavior for Google Alerts URLs
   *
   * @param url - Original URL (may be Google redirect)
   * @returns Resolved final URL
   */
  private async resolveGoogleRedirect(url: string): Promise<string> {
    // 1. Check for Google Alerts URL pattern: google.com/url?...&url=ACTUAL_URL
    // This is the most common pattern from Google Alerts RSS feeds
    if (url.includes('google.com/url')) {
      try {
        const parsedUrl = new URL(url);
        const targetUrl = parsedUrl.searchParams.get('url');

        if (targetUrl) {
          await logger.debug('Resolved Google Alerts redirect', {
            original: url,
            resolved: targetUrl,
          });
          return targetUrl;
        }
      } catch (error) {
        await logger.warning('Failed to parse Google Alerts URL', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 2. Check for Google FeedProxy URL
    if (url.includes('feedproxy.google.com')) {
      try {
        await logger.debug('Resolving Google FeedProxy redirect', { url });

        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual', // Don't auto-follow redirects
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000),
        });

        // Get Location header for redirect
        const location = response.headers.get('Location');

        if (location && response.status >= 300 && response.status < 400) {
          await logger.debug('FeedProxy redirect resolved', {
            original: url,
            resolved: location,
          });
          return location;
        }
      } catch (error) {
        await logger.warning('Failed to resolve FeedProxy redirect', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // No redirect pattern found, return original URL
    return url;
  }

  /**
   * Fetch HTML content from URL with charset detection and conversion
   *
   * @param url - URL to fetch
   * @param userAgent - User agent string
   * @param timeout - Request timeout in ms
   * @returns HTML content and detected charset
   */
  private async fetchHtmlWithCharset(
    url: string,
    userAgent: string,
    timeout: number
  ): Promise<{ html: string | null; charset: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Charset': 'utf-8, iso-8859-1;q=0.5',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type') || '';

      // Check if response is HTML
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Extract charset from Content-Type header
      let charset = 'utf-8';
      const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
      if (charsetMatch) {
        charset = charsetMatch[1].toLowerCase().replace(/['"]/g, '');
      }

      // Get response as ArrayBuffer for proper encoding handling
      const buffer = await response.arrayBuffer();

      // Convert to string with proper encoding
      let html: string;
      if (charset === 'utf-8' || charset === 'utf8') {
        html = new TextDecoder('utf-8').decode(buffer);
      } else {
        // Try to decode with detected charset
        try {
          const decoder = new TextDecoder(charset);
          html = decoder.decode(buffer);
        } catch {
          // Fallback: try common encodings
          html = this.decodeWithFallback(buffer, charset);
        }
      }

      // Also check for charset in HTML meta tags if not found in header
      if (charset === 'utf-8') {
        const metaCharset = this.extractCharsetFromHtml(html);
        if (metaCharset && metaCharset !== 'utf-8') {
          // Re-decode with the charset found in HTML
          try {
            const decoder = new TextDecoder(metaCharset);
            html = decoder.decode(buffer);
            charset = metaCharset;
          } catch {
            // Keep the UTF-8 decoded version
          }
        }
      }

      return { html, charset };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Decode buffer with fallback encodings
   */
  private decodeWithFallback(buffer: ArrayBuffer, originalCharset: string): string {
    const fallbackEncodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'iso-8859-15'];

    for (const encoding of fallbackEncodings) {
      try {
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buffer);
      } catch {
        continue;
      }
    }

    // Last resort: decode as UTF-8 with replacement characters
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  }

  /**
   * Extract charset from HTML meta tags
   */
  private extractCharsetFromHtml(html: string): string | null {
    // Check <meta charset="...">
    const metaCharsetMatch = html.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
    if (metaCharsetMatch) {
      return metaCharsetMatch[1].toLowerCase();
    }

    // Check <meta http-equiv="Content-Type" content="...; charset=...">
    const httpEquivMatch = html.match(
      /<meta[^>]+http-equiv=["']?content-type["']?[^>]+content=["']?[^"']*charset=([^"'\s;>]+)/i
    );
    if (httpEquivMatch) {
      return httpEquivMatch[1].toLowerCase();
    }

    return null;
  }

  /**
   * Extract clean content from HTML using Cheerio
   *
   * @param html - HTML content
   * @param url - Source URL
   * @param minLength - Minimum content length
   * @param maxLength - Maximum content length
   * @returns Scraped content structure
   */
  private extractContent(html: string, url: string, minLength: number, maxLength: number): ScrapedContent {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();
    $('.advertisement, .ads, .social-share, .comments').remove();

    // Extract title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      '';

    title = this.cleanText(title);

    // Extract main content
    // Try to find article content using common selectors
    let content = '';

    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main',
      '#content',
      '.post',
      '.article',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback: extract all paragraph text
    if (!content || content.trim().length < minLength) {
      content = $('p')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
    }

    // Final fallback: extract body text
    if (!content || content.trim().length < minLength) {
      content = $('body').text();
    }

    // Clean content
    content = this.cleanText(content);

    // Limit content length (AI providers have token limits)
    if (content.length > maxLength) {
      const originalLength = content.length;
      content = content.substring(0, maxLength) + '...';

      logger.warning('Content truncated due to length', {
        url,
        original_length: originalLength,
        truncated_length: maxLength,
      });
    }

    // Note: Featured images are now handled by feed fallback images only
    // This reduces scraping complexity since posts are private (not SEO indexed)

    return {
      title,
      content,
      url,
    };
  }

  /**
   * Extract content with additional metadata from HTML
   * Enhanced version that includes description, author, date, and image
   *
   * @param html - HTML content
   * @param url - Source URL
   * @param minLength - Minimum content length
   * @param maxLength - Maximum content length
   * @returns Scraped content with metadata
   */
  private extractContentWithMetadata(
    html: string,
    url: string,
    minLength: number,
    maxLength: number
  ): ScrapedContentExtended {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();
    $('.advertisement, .ads, .social-share, .comments, .sidebar').remove();

    // Extract title (same as before)
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      '';
    title = this.cleanText(title);

    // Extract description
    let description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    description = this.cleanText(description);

    // Extract author
    let author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').first().text() ||
      $('[itemprop="author"]').first().text() ||
      $('.author-name').first().text() ||
      $('.byline').first().text() ||
      '';
    author = this.cleanText(author);

    // Extract published date
    let publishedDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="pubdate"]').attr('content') ||
      $('time[datetime]').first().attr('datetime') ||
      $('[itemprop="datePublished"]').first().attr('content') ||
      $('[itemprop="datePublished"]').first().text() ||
      '';
    publishedDate = this.cleanText(publishedDate);

    // Extract featured image
    const image = this.extractFeaturedImage($, url);

    // Extract main content (text for AI, HTML for passthrough)
    let content = '';
    let htmlContent = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main',
      '#content',
      '.post',
      '.article',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        if (content.trim().length >= minLength) {
          // Also capture the HTML content for this element
          htmlContent = element.html() || '';
          break;
        }
      }
    }

    // Fallback: extract all paragraph text and HTML
    if (!content || content.trim().length < minLength) {
      const paragraphs = $('p').filter((_, el) => $(el).text().trim().length > 30);
      content = paragraphs.map((_, el) => $(el).text()).get().join('\n');
      // Build HTML from paragraphs
      htmlContent = paragraphs.map((_, el) => $.html(el)).get().join('\n');
    }

    // Final fallback: extract body text
    if (!content || content.trim().length < minLength) {
      content = $('body').text();
      htmlContent = $('body').html() || '';
    }

    // Clean text content (for AI processing)
    content = this.cleanText(content);

    // Clean HTML content (for passthrough) - remove scripts/styles but keep structure
    // Also pass the featured image URL to remove it from content (avoid duplication)
    htmlContent = this.cleanHtmlContent(htmlContent, image);

    // Limit text content length
    if (content.length > maxLength) {
      const originalLength = content.length;
      content = content.substring(0, maxLength) + '...';

      logger.warning('Content truncated due to length', {
        url,
        original_length: originalLength,
        truncated_length: maxLength,
      });
    }

    return {
      title,
      content,
      url,
      description: description || undefined,
      author: author || undefined,
      publishedDate: publishedDate || undefined,
      image: image || undefined,
      htmlContent: htmlContent || undefined,
    };
  }

  /**
   * Clean HTML content for passthrough
   * Removes scripts, styles, unwanted elements, and share buttons but preserves structure
   * Also removes the featured image from content to avoid duplication
   *
   * @param html - HTML content to clean
   * @param featuredImageUrl - Optional featured image URL to remove from content
   */
  private cleanHtmlContent(html: string, featuredImageUrl?: string | null): string {
    if (!html) return '';

    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, form').remove();

    // Remove tracking/ad related elements
    $('[class*="ad-"], [class*="advertisement"], [id*="ad-"]').remove();
    $('[class*="ads-"], [class*="advert"]').remove();

    // Remove social share elements (common patterns)
    $('[class*="social-share"], [class*="share-buttons"], [class*="share-icons"]').remove();
    $('[class*="sharing"], [class*="sharedaddy"], [class*="post-share"]').remove();
    $('[class*="social-links"], [class*="social-icons"], [class*="social-media"]').remove();
    $('[class*="addtoany"], [class*="a2a_"], [id*="addtoany"]').remove();
    $('[class*="shareaholic"], [class*="sharethis"]').remove();
    $('[class*="jp-relatedposts"]').remove(); // Jetpack related posts

    // Remove share-specific elements by common IDs
    $('#share, #sharing, #social-share, #post-share').remove();

    // Remove related posts sections
    $('[class*="related-posts"], [class*="recommended"], [class*="you-may-like"]').remove();
    $('[class*="more-from"], [class*="also-like"], [class*="similar-posts"]').remove();

    // Remove author boxes and bio sections (often contain unrelated images)
    $('[class*="author-box"], [class*="author-bio"], [class*="about-author"]').remove();

    // Remove newsletter/subscription boxes
    $('[class*="newsletter"], [class*="subscribe"], [class*="signup"]').remove();
    $('[class*="email-signup"], [class*="mailing-list"]').remove();

    // Remove comment sections
    $('[class*="comments"], [id*="comments"], [class*="respond"]').remove();

    // Normalize the featured image URL for comparison (if provided)
    const normalizedFeaturedUrl = featuredImageUrl ? this.normalizeImageUrl(featuredImageUrl) : null;
    let featuredImageRemoved = false;

    // Remove images that are likely share/social buttons OR match the featured image
    $('img').each((_, el) => {
      const img = $(el);
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
      const srcLower = src.toLowerCase();
      const alt = (img.attr('alt') || '').toLowerCase();
      const className = (img.attr('class') || '').toLowerCase();
      const parentClass = (img.parent().attr('class') || '').toLowerCase();

      // Check if this image matches the featured image (to remove duplication)
      if (normalizedFeaturedUrl && src) {
        const normalizedSrc = this.normalizeImageUrl(src);
        if (this.imagesMatch(normalizedSrc, normalizedFeaturedUrl)) {
          img.remove();
          featuredImageRemoved = true;
          return; // Continue to next image
        }
      }

      // Check if image is a share button based on src, alt, or class
      const sharePatterns = [
        'facebook', 'twitter', 'linkedin', 'pinterest', 'whatsapp',
        'reddit', 'tumblr', 'email', 'share', 'social',
        'icon', 'button', 'logo', 'badge', 'widget'
      ];

      const isShareImage = sharePatterns.some(pattern =>
        srcLower.includes(pattern) || alt.includes(pattern) ||
        className.includes(pattern) || parentClass.includes(pattern)
      );

      // Also check for small images (likely icons)
      const width = parseInt(img.attr('width') || '0', 10);
      const height = parseInt(img.attr('height') || '0', 10);
      const isSmallIcon = (width > 0 && width < 50) || (height > 0 && height < 50);

      // Check for data URIs that are tiny (likely icons)
      const isDataIcon = srcLower.startsWith('data:') && src.length < 1000;

      if (isShareImage || (isSmallIcon && (className.includes('icon') || className.includes('share'))) || isDataIcon) {
        img.remove();
      }
    });

    // If featured image wasn't found and removed, try to remove the first large image
    // (often the featured image is placed at the beginning of content)
    if (normalizedFeaturedUrl && !featuredImageRemoved) {
      const firstImg = $('img').first();
      if (firstImg.length > 0) {
        const src = firstImg.attr('src') || firstImg.attr('data-src') || '';
        const width = parseInt(firstImg.attr('width') || '0', 10);
        const height = parseInt(firstImg.attr('height') || '0', 10);

        // If first image is large (likely a featured image) and at start of content
        const isLargeImage = width >= 200 || height >= 150 || (!width && !height);
        const parent = firstImg.parent();
        const parentTag = parent.prop('tagName')?.toLowerCase();

        // Check if image is in a figure, div, or directly at start
        const isAtStart = parentTag === 'figure' || parentTag === 'div' || parentTag === 'p';

        if (isLargeImage && isAtStart) {
          // Check if the parent figure/div can be removed entirely
          if (parentTag === 'figure' || (parentTag === 'div' && parent.children().length === 1)) {
            parent.remove();
          } else {
            firstImg.remove();
          }
        }
      }
    }

    // Remove event handlers and tracking attributes
    $('*').each((_, el) => {
      const elem = $(el);
      const attrsToRemove = [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
        'data-track', 'data-analytics', 'data-share', 'data-social'
      ];
      attrsToRemove.forEach(attr => elem.removeAttr(attr));
    });

    // Remove empty paragraphs and divs
    $('p:empty, div:empty').remove();

    // Remove empty figures (after removing images)
    $('figure:empty').remove();

    return $.html() || '';
  }

  /**
   * Normalize image URL for comparison
   * Removes query params, protocol, www prefix, and trailing slashes
   */
  private normalizeImageUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Get pathname without query params
      let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
      // Remove trailing slash
      normalized = normalized.replace(/\/$/, '');
      // Convert to lowercase
      return normalized.toLowerCase();
    } catch {
      // If URL parsing fails, just do basic normalization
      return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\?.*$/, '')
        .replace(/\/$/, '');
    }
  }

  /**
   * Check if two image URLs likely refer to the same image
   * Handles CDN variations, size parameters, etc.
   */
  private imagesMatch(url1: string, url2: string): boolean {
    // Exact match
    if (url1 === url2) return true;

    // Check if one contains the other (handles size variants like image-300x200.jpg vs image.jpg)
    // Extract the base filename without size suffixes
    const getBaseName = (url: string) => {
      // Remove common size patterns like -300x200, _thumb, -scaled, etc.
      return url.replace(/-\d+x\d+/g, '')
                .replace(/_thumb/g, '')
                .replace(/-scaled/g, '')
                .replace(/-\d+w/g, '');
    };

    const base1 = getBaseName(url1);
    const base2 = getBaseName(url2);

    return base1 === base2 || base1.includes(base2) || base2.includes(base1);
  }

  /**
   * Extract featured image from HTML
   * Tries multiple strategies: OG image, Twitter card, first content image
   */
  private extractFeaturedImage($: ReturnType<typeof cheerio.load>, baseUrl: string): string | null {
    // 1. Try Open Graph image
    let imageUrl = $('meta[property="og:image"]').attr('content');

    // 2. Try Twitter card image
    if (!imageUrl) {
      imageUrl = $('meta[name="twitter:image"]').attr('content');
    }

    // 3. Try schema.org image
    if (!imageUrl) {
      imageUrl = $('meta[itemprop="image"]').attr('content');
    }

    // 4. Try first image in article/content area
    if (!imageUrl) {
      const contentSelectors = [
        'article img',
        '.post-content img',
        '.entry-content img',
        '.article-content img',
        'main img',
        '.content img'
      ];

      for (const selector of contentSelectors) {
        const img = $(selector).first();
        if (img.length > 0) {
          imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          if (imageUrl) break;
        }
      }
    }

    // 5. Try first reasonably sized image
    if (!imageUrl) {
      $('img').each((_, el) => {
        const img = $(el);
        const src = img.attr('src');
        const width = parseInt(img.attr('width') || '0');
        const height = parseInt(img.attr('height') || '0');

        // Skip small images (icons, avatars, etc.)
        if (src && (width >= 200 || height >= 200 || (!width && !height))) {
          // Skip common icon/avatar patterns
          if (!src.match(/avatar|icon|logo|button|sprite|badge/i)) {
            imageUrl = src;
            return false; // break
          }
        }
      });
    }

    if (!imageUrl) {
      return null;
    }

    // Resolve relative URLs
    return this.resolveImageUrl(imageUrl, baseUrl);
  }

  /**
   * Resolve relative image URL to absolute URL
   */
  private resolveImageUrl(imageUrl: string, baseUrl: string): string {
    // Already absolute URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Protocol-relative URL
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }

    try {
      const base = new URL(baseUrl);

      // Absolute path
      if (imageUrl.startsWith('/')) {
        return `${base.protocol}//${base.host}${imageUrl}`;
      }

      // Relative path
      return new URL(imageUrl, baseUrl).href;
    } catch {
      return imageUrl;
    }
  }

  /**
   * Clean and normalize text
   *
   * @param text - Raw text
   * @returns Cleaned text
   */
  private cleanText(text: string): string {
    return (
      text
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim()
    );
  }

  /**
   * Batch scrape multiple URLs
   *
   * @param urls - Array of URLs to scrape
   * @param feedId - Optional feed ID for logging
   * @param concurrency - Number of concurrent requests (default 3)
   * @returns Array of scraped content with metadata (null for failed scrapes)
   */
  async scrapeUrls(
    urls: string[],
    feedId?: string,
    concurrency: number = 3
  ): Promise<(ScrapedContentExtended | null)[]> {
    const results: (ScrapedContentExtended | null)[] = [];

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map((url) => this.scrapeUrl(url, feedId))
      );

      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming servers
      if (i + concurrency < urls.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return results;
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
   * Get scraping statistics
   *
   * @returns Statistics about recent scraping activity
   */
  async getScrapingStats() {
    const supabase = (await import('../utils/supabase-admin')).createAdminClient();

    const { data: logs } = await supabase
      .from('processing_logs')
      .select('*')
      .or('message.ilike.%scrape%,message.ilike.%fetch%')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const successful = logs?.filter((l) => l.level === 'info').length || 0;
    const failed = logs?.filter((l) => l.level === 'error').length || 0;

    return {
      scrapes_last_24h: logs?.length || 0,
      successful_scrapes: successful,
      failed_scrapes: failed,
      success_rate: logs?.length ? (successful / logs.length) * 100 : 0,
    };
  }
}

// Export singleton instance
export const scraperService = ScraperService.getInstance();
