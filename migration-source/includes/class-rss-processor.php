<?php
/**
 * RSS Processor class - Main processing logic
 * Simplified and extracted from theme
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Processor {
    
    private static $instance = null;
    
    private $config = [
        'batch_size' => 10,
        'max_execution_time' => 300,
        'timeout_per_feed' => 30,
        'retry_attempts' => 3,
        'quality_threshold' => 0.6,
        'auto_publish' => true,
        'post_type' => 'post'
    ];
    
    private $ai_transformer;
    private $content_scraper;
    private $database;
    private $prompt_manager;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_config();
        $this->init_dependencies();
    }
    
    /**
     * Initialize configuration
     */
    private function init_config() {
        $saved_config = get_option('gellobit_rss_processor_config', []);
        $this->config = array_merge($this->config, $saved_config);
        
        // Get settings from plugin options (enforce core post type)
        $this->config['auto_publish'] = get_option('gellobit_rss_auto_publish', true);
        $this->config['post_type'] = 'post';
        if (get_option('gellobit_rss_post_type') !== 'post') {
            update_option('gellobit_rss_post_type', 'post');
        }
        $this->config['quality_threshold'] = get_option('gellobit_rss_quality_threshold', 0.6);
        $this->config['max_posts_per_run'] = intval(get_option('gellobit_rss_max_posts_per_run', 20));
    }
    
    /**
     * Initialize dependencies
     */
    private function init_dependencies() {
        $this->ai_transformer = Gellobit_RSS_AI_Transformer::get_instance();
        $this->content_scraper = Gellobit_RSS_Content_Scraper::get_instance();
        $this->database = Gellobit_RSS_Database::get_instance();
        $this->prompt_manager = Gellobit_RSS_Prompt_Manager::get_instance();
    }
    
    /**
     * Process all active feeds
     */
    public function process_all_feeds() {
        try {
            $this->log('Starting RSS processing for all feeds', 'info');
            
            $feeds = $this->database->get_feeds('active');
            
            if (empty($feeds)) {
                $this->log('No active RSS feeds found', 'info');
                return ['success' => true, 'message' => 'No feeds to process'];
            }
            
            $results = [
                'success' => true,
                'processed_feeds' => 0,
                'created_posts' => 0,
                'errors' => []
            ];
            
            foreach ($feeds as $feed) {
                try {
                    $feed_result = $this->process_feed($feed['id']);
                    
                    $results['processed_feeds']++;
                    if ($feed_result['success']) {
                        $results['created_posts'] += $feed_result['created_posts'] ?? 0;
                    } else {
                        $results['errors'][] = "Feed {$feed['id']}: " . $feed_result['message'];
                    }
                    
                } catch (Exception $e) {
                    $this->log("Error processing feed {$feed['id']}: " . $e->getMessage(), 'error', [], $feed['id']);
                    $results['errors'][] = "Feed {$feed['id']}: " . $e->getMessage();
                }
            }
            
            $this->log("RSS processing completed. Processed {$results['processed_feeds']} feeds, created {$results['created_posts']} posts", 'info');
            
            return $results;
            
        } catch (Exception $e) {
            $this->log("Critical error in RSS processing: " . $e->getMessage(), 'error');
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Process a single feed
     */
    public function process_feed($feed_id) {
        try {
            $feed = $this->get_feed($feed_id);
            if (!$feed) {
                throw new Exception("Feed not found: {$feed_id}");
            }
            
            $this->log("Processing feed: {$feed['name']}", 'info', [], $feed_id);
            
            // Fetch RSS content
            $rss_content = $this->fetch_rss_feed($feed['url']);
            
            // Parse RSS items
            $rss_items = $this->parse_rss_content($rss_content);
            
            if (empty($rss_items)) {
                $this->log("No items found in feed {$feed_id}", 'info', [], $feed_id);
                return ['success' => true, 'message' => 'No items found', 'created_posts' => 0];
            }
            
            $this->log("Found " . count($rss_items) . " items in feed {$feed_id}", 'info', [], $feed_id);

            // Process items
            $created_posts = 0;
            $rejected_posts = 0;
            $max_posts = max(0, intval($this->config['max_posts_per_run'] ?? 0));

            // error_log('[Gellobit RSS] Starting to process ' . count($rss_items) . ' items from feed ' . $feed_id);

            foreach ($rss_items as $index => $item) {
                try {
                    $this->log('Processing feed item', 'debug', [
                        'title' => $item['title'],
                        'link' => $item['link']
                    ], $feed_id);
                    // error_log('[Gellobit RSS] Processing item ' . ($index + 1) . '/' . count($rss_items) . ': ' . $item['title']);

                    if ($this->process_single_item($item, $feed)) {
                        $created_posts++;
                        // error_log('[Gellobit RSS] ✓ Item created successfully: ' . $item['title']);
                        if ($max_posts && $created_posts >= $max_posts) {
                            $this->log('Reached max posts per run limit', 'info', ['limit' => $max_posts], $feed_id);
                            // error_log('[Gellobit RSS] Reached max posts limit (' . $max_posts . '), stopping processing');
                            break;
                        }
                    } else {
                        $rejected_posts++;
                        // error_log('[Gellobit RSS] ✗ Item rejected: ' . $item['title']);
                    }
                } catch (Exception $e) {
                    $this->log("Error processing item: " . $e->getMessage(), 'error', [], $feed_id);
                    error_log('[Gellobit RSS] Exception processing item: ' . $e->getMessage());
                    $rejected_posts++;
                }
            }

            // error_log('[Gellobit RSS] Feed processing summary - Created: ' . $created_posts . ', Rejected: ' . $rejected_posts . ', Total: ' . count($rss_items));
            
            // Update feed stats
            $this->update_feed_stats($feed_id);
            
            $this->log("Feed processing completed. Created {$created_posts} posts", 'info', [], $feed_id);
            
            return [
                'success' => true, 
                'message' => "Processed successfully",
                'created_posts' => $created_posts,
                'total_items' => count($rss_items)
            ];
            
        } catch (Exception $e) {
            $this->log("Error processing feed {$feed_id}: " . $e->getMessage(), 'error', [], $feed_id);
            $this->mark_feed_error($feed_id, $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Fetch RSS feed content
     */
    private function fetch_rss_feed($url) {
        $this->log('Fetching RSS feed', 'debug', ['url' => $url]);
        // error_log('[Gellobit RSS] Fetching feed: ' . $url);

        $response = wp_remote_get($url, [
            'timeout' => $this->config['timeout_per_feed'],
            'headers' => [
                'User-Agent' => 'Gellobit RSS Processor 1.0',
                'Accept' => 'application/rss+xml, application/xml, text/xml'
            ]
        ]);

        if (is_wp_error($response)) {
            error_log('[Gellobit RSS] WP Error fetching feed: ' . $response->get_error_message());
            throw new Exception($response->get_error_message());
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_headers = wp_remote_retrieve_headers($response);

        // error_log('[Gellobit RSS] Feed response code: ' . $response_code . ' | Content-Type: ' . ($response_headers['content-type'] ?? 'unknown'));

        if ($response_code !== 200) {
            error_log('[Gellobit RSS] Non-200 response code: ' . $response_code);
            throw new Exception("HTTP {$response_code} response");
        }

        $body = wp_remote_retrieve_body($response);
        if (empty($body)) {
            error_log('[Gellobit RSS] Empty response body from feed');
            throw new Exception("Empty response body");
        }

        // error_log('[Gellobit RSS] Feed body length: ' . strlen($body) . ' bytes');

        return $body;
    }
    
    /**
     * Parse RSS content
     */
    private function parse_rss_content($content) {
        // error_log('[Gellobit RSS] Starting RSS parsing. Content length: ' . strlen($content) . ' bytes');

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($content);

        if (!$xml) {
            $errors = libxml_get_errors();
            $error_messages = array_map(function($error) {
                return trim($error->message);
            }, $errors);
            error_log('[Gellobit RSS] XML parsing errors: ' . implode(', ', $error_messages));
            throw new Exception("XML parsing failed: " . implode(', ', $error_messages));
        }

        $items = [];
        $format_detected = 'unknown';
        $root_element = $xml->getName();

        if (isset($xml->channel->item)) {
            // RSS 2.0 format
            $format_detected = 'RSS 2.0';
            $item_count = count($xml->channel->item);
            // error_log('[Gellobit RSS] Detected RSS 2.0 format with ' . $item_count . ' items');

            foreach ($xml->channel->item as $item) {
                $items[] = $this->parse_rss_item($item, 'rss');
            }
        } elseif ($root_element === 'feed') {
            // Atom format (with or without namespace)
            $format_detected = 'Atom';

            // Try to get entries with namespace support
            $namespaces = $xml->getNamespaces(true);
            $entries = [];

            if (isset($namespaces['']) || isset($namespaces['atom'])) {
                // Atom with namespace
                $atom_ns = isset($namespaces['']) ? '' : 'atom';
                if ($atom_ns === '') {
                    // Default namespace - access children directly
                    $entries = $xml->children();
                } else {
                    // Named namespace
                    $entries = $xml->children($namespaces[$atom_ns]);
                }
            } else {
                // Try direct access (no namespace)
                $entries = $xml->entry;
            }

            // Count actual entry elements
            $entry_count = 0;
            foreach ($entries as $child_name => $child) {
                if ($child_name === 'entry') {
                    $entry_count++;
                    $items[] = $this->parse_rss_item($child, 'atom');
                }
            }

            // error_log('[Gellobit RSS] Detected Atom format with ' . $entry_count . ' entries');

            // If no entries found, check if feed is empty
            if ($entry_count === 0) {
                // error_log('[Gellobit RSS] Atom feed is EMPTY (no <entry> elements found)');
                // error_log('[Gellobit RSS] This is normal for Google Alerts with no new results');
            }

        } elseif (isset($xml->entry)) {
            // Atom format without namespace (fallback)
            $format_detected = 'Atom';
            $entry_count = count($xml->entry);
            // error_log('[Gellobit RSS] Detected Atom format with ' . $entry_count . ' entries');

            foreach ($xml->entry as $item) {
                $items[] = $this->parse_rss_item($item, 'atom');
            }
        } else {
            // Unknown format - debug XML structure
            error_log('[Gellobit RSS] UNKNOWN RSS FORMAT. Root element: ' . $root_element);
            error_log('[Gellobit RSS] Available children: ' . implode(', ', array_keys((array)$xml)));

            // Check namespaces
            $namespaces = $xml->getNamespaces(true);
            if (!empty($namespaces)) {
                error_log('[Gellobit RSS] XML Namespaces: ' . implode(', ', array_keys($namespaces)));
            }

            // Try to show first few lines of XML for debugging
            $xml_preview = substr($content, 0, 500);
            error_log('[Gellobit RSS] XML Preview: ' . $xml_preview);
        }

        $filtered_items = array_filter($items);
        // error_log('[Gellobit RSS] Parsed ' . count($items) . ' items, filtered to ' . count($filtered_items) . ' valid items (format: ' . $format_detected . ')');

        if (count($items) > 0 && count($filtered_items) === 0) {
            error_log('[Gellobit RSS] WARNING: All items were filtered out during parsing!');
        }

        return $filtered_items;
    }
    
    /**
     * Parse individual RSS item
     */
    private function parse_rss_item($item, $format) {
        $parsed_item = [
            'title' => '',
            'description' => '',
            'content' => '',
            'link' => '',
            'pub_date' => '',
            'guid' => '',
            'featured_image' => ''
        ];

        if ($format === 'rss') {
            $parsed_item['title'] = (string)$item->title;
            $parsed_item['description'] = (string)$item->description;
            $parsed_item['content'] = isset($item->{'content:encoded'}) ?
                (string)$item->{'content:encoded'} : $parsed_item['description'];
            $parsed_item['link'] = (string)$item->link;
            $parsed_item['pub_date'] = (string)$item->pubDate;
            $parsed_item['guid'] = (string)$item->guid;

            // Try to extract image from RSS feed
            // 1. Check for enclosure (podcast/media feeds)
            if (isset($item->enclosure) && isset($item->enclosure['url'])) {
                $enclosure_type = (string)($item->enclosure['type'] ?? '');
                if (strpos($enclosure_type, 'image/') === 0) {
                    $parsed_item['featured_image'] = (string)$item->enclosure['url'];
                }
            }

            // 2. Check for media:thumbnail (Media RSS)
            if (empty($parsed_item['featured_image']) && isset($item->children('media', true)->thumbnail)) {
                $parsed_item['featured_image'] = (string)$item->children('media', true)->thumbnail['url'];
            }

            // 3. Check for media:content (Media RSS)
            if (empty($parsed_item['featured_image']) && isset($item->children('media', true)->content)) {
                $media_content = $item->children('media', true)->content;
                if (isset($media_content['url'])) {
                    $media_type = (string)($media_content['medium'] ?? '');
                    if ($media_type === 'image' || strpos((string)($media_content['type'] ?? ''), 'image/') === 0) {
                        $parsed_item['featured_image'] = (string)$media_content['url'];
                    }
                }
            }
        } elseif ($format === 'atom') {
            $parsed_item['title'] = (string)$item->title;
            $parsed_item['description'] = (string)$item->summary;
            $parsed_item['content'] = isset($item->content) ?
                (string)$item->content : $parsed_item['description'];
            $parsed_item['link'] = isset($item->link['href']) ?
                (string)$item->link['href'] : (string)$item->link;
            $parsed_item['pub_date'] = (string)$item->published;
            $parsed_item['guid'] = (string)$item->id;

            // Try to extract image from Atom feed
            // Check for link with rel="enclosure" and type="image/*"
            if (isset($item->link)) {
                foreach ($item->link as $link) {
                    $rel = (string)($link['rel'] ?? '');
                    $type = (string)($link['type'] ?? '');
                    if ($rel === 'enclosure' && strpos($type, 'image/') === 0) {
                        $parsed_item['featured_image'] = (string)$link['href'];
                        break;
                    }
                }
            }
        }

        // Clean and normalize
        $parsed_item = $this->normalize_rss_item($parsed_item);

        return $parsed_item;
    }
    
    /**
     * Normalize RSS item
     */
    private function normalize_rss_item($item) {
        // Clean title
        $item['title'] = html_entity_decode(strip_tags($item['title']), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $item['title'] = trim($item['title']);
        
        // Clean description
        $item['description'] = html_entity_decode(strip_tags($item['description']), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $item['description'] = trim($item['description']);
        
        // Clean content
        $item['content'] = html_entity_decode(strip_tags($item['content']), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $item['content'] = trim($item['content']);
        
        // Normalize date
        if (!empty($item['pub_date'])) {
            $timestamp = strtotime($item['pub_date']);
            $item['pub_date'] = $timestamp ? date('Y-m-d H:i:s', $timestamp) : current_time('mysql');
        } else {
            $item['pub_date'] = current_time('mysql');
        }
        
        // Validate URL
        if (!filter_var($item['link'], FILTER_VALIDATE_URL)) {
            $item['link'] = '';
        }
        
        // Generate GUID if empty
        if (empty($item['guid'])) {
            $item['guid'] = md5($item['link'] . $item['title']);
        }

        // Validate featured_image URL
        if (!empty($item['featured_image']) && !filter_var($item['featured_image'], FILTER_VALIDATE_URL)) {
            $item['featured_image'] = '';
        }

        // Set main content
        $item['main_content'] = strlen($item['content']) > strlen($item['description']) ? 
            $item['content'] : $item['description'];
        
        return $item;
    }
    
    /**
     * Process single item
     */
    private function process_single_item($item, $feed) {
        // Basic validation
        if (empty($item['title']) || empty($item['main_content']) || empty($item['link'])) {
            $this->log('Skipping item due to missing required fields', 'warning', [
                'title' => $item['title'],
                'link' => $item['link']
            ], $feed['id']);
            error_log('[Gellobit RSS] Missing fields for item: ' . $item['title']);
            $this->record_processing_history($feed, $item, 'rejected', 'missing_fields');
            return false;
        }

        // Check for duplicates
        $allow_republish = !empty($feed['allow_republish']);
        if ($this->is_duplicate($item, $feed)) {
            $this->log("Duplicate item detected: " . $item['title'], 'info');
            $this->record_processing_history($feed, $item, 'rejected', 'duplicate_detected');
            return false;
        }
        
        // Scrape full content if enabled
        if (!empty($feed['enable_scraping'])) {
            // error_log('[Gellobit RSS] Scraping enabled for item: ' . $item['link']);
            $scraped_content = $this->content_scraper->scrape_url($item['link']);
            if ($scraped_content['success']) {
                // error_log('[Gellobit RSS] ✓ Scraping successful. Text length: ' . strlen($scraped_content['content']['text'] ?? ''));
                $item = $this->merge_scraped_content($item, $scraped_content['content']);
            } else {
                $this->log('Content scraping failed', 'warning', [
                    'link' => $item['link'],
                    'error' => $scraped_content['error'] ?? 'unknown'
                ], $feed['id']);
                error_log('[Gellobit RSS] ✗ Scraper failed: ' . ($scraped_content['error'] ?? 'unknown') . ' URL: ' . $item['link']);
                $this->record_processing_history($feed, $item, 'rejected', 'scrape_failed');
                return false;
            }
        } else {
            // error_log('[Gellobit RSS] Scraping disabled for this feed, using RSS content');
        }
        
        $generated_excerpt = null;
        $generated_title = null;
        $generated_content = null;
        $extracted_data = [
            'opportunity_type' => $feed['default_opportunity_type'] ?? '',
            'confidence' => 1
        ];

        if (!empty($feed['enable_ai_processing'])) {
            $ai_payload = $this->generate_ai_article($feed, $item);
            if (!$ai_payload['success']) {
                $reason = $ai_payload['error'] === 'invalid_content' ? 'invalid_content' : 'ai_error: ' . $ai_payload['error'];
                $this->log('AI prompt execution failed: ' . $ai_payload['error'], 'error', [], $feed['id']);

                // Only log AI errors that are NOT invalid_content (invalid_content is expected behavior)
                if ($ai_payload['error'] !== 'invalid_content') {
                    error_log('[Gellobit RSS] AI error: ' . $ai_payload['error']);
                }

                $this->record_processing_history($feed, $item, 'rejected', $reason);
                return false;
            }
            $this->log('AI content generated successfully', 'debug', [
                'feed_id' => $feed['id'],
                'ai_title' => $ai_payload['title']
            ], $feed['id']);
            // error_log('[Gellobit RSS] AI success for feed ' . $feed['id'] . ' title: ' . $ai_payload['title']);
            $generated_excerpt = $ai_payload['excerpt'] ?? null;
            $generated_title = $ai_payload['title'];
            $generated_content = $ai_payload['content'];
        }

        // Create WordPress post
        $item['generated_excerpt'] = $generated_excerpt;
        $item['generated_title'] = $generated_title;
        $item['generated_content'] = $generated_content;
        $post_id = $this->create_wordpress_post($item, $extracted_data, $feed);
        
        if ($post_id) {
            $this->log("Created post {$post_id}: " . $item['title'], 'info');
            $this->record_duplicate($item, $post_id, $feed['id']);
            $this->record_processing_history($feed, $item, 'published', 'published', $post_id);
            // Always try to set featured image (will use fallback if no image in item)
            $this->maybe_set_featured_image($post_id, $item['featured_image'] ?? '', $feed);
            return true;
        }
        
        $this->record_processing_history($feed, $item, 'rejected', 'post_insert_failed');
        return false;
    }
    
    /**
     * Merge scraped content with RSS item
     */
    private function merge_scraped_content($item, $scraped_content) {
        if (!empty($scraped_content['title']) && strlen($scraped_content['title']) > strlen($item['title'])) {
            $item['original_title'] = $item['title'];
            $item['title'] = $scraped_content['title'];
        }
        
        if (!empty($scraped_content['text'])) {
            $item['original_content'] = $item['main_content'];
            $item['main_content'] = $scraped_content['text'];
            $item['content'] = $scraped_content['text'];
        }
        
        if (!empty($scraped_content['description']) && empty($item['description'])) {
            $item['description'] = $scraped_content['description'];
        }
        
        $item['content_scraped'] = true;
        if (!empty($scraped_content['image'])) {
            $item['featured_image'] = $scraped_content['image'];
        }
        
        return $item;
    }
    
    /**
     * Create WordPress post
     */
    private function create_wordpress_post($item, $extracted_data, $feed) {
        // Ensure WordPress core post type is used
        $post_type = 'post';
        $category_id = !empty($feed['default_category']) ? intval($feed['default_category']) : 0;
        
        $title = !empty($item['generated_title']) ? $item['generated_title'] : ($extracted_data['title'] ?? $item['title']);
        $content = !empty($item['generated_content'])
            ? $this->append_source_reference($item['generated_content'], $item['link'])
            : $this->generate_post_content($item, $extracted_data);
        $content = $this->sanitize_generated_content($content, $title);

        // Use AI-generated excerpt if available, otherwise fallback to RSS description
        $excerpt = !empty($item['generated_excerpt'])
            ? $item['generated_excerpt']
            : ($extracted_data['description'] ?? $item['description']);

        // Determine post status: check both config and feed-level auto_publish setting
        $should_publish = false;

        // Check feed-level auto_publish first (takes precedence)
        if (isset($feed['auto_publish'])) {
            $should_publish = (bool) $feed['auto_publish'];
        }
        // Fallback to global config
        else {
            // Convert to boolean to handle string "1", int 1, bool true, etc.
            $should_publish = !empty($this->config['auto_publish']) && $this->config['auto_publish'] != '0';
        }

        // Prepare post data
        $post_data = [
            'post_title' => $title,
            'post_content' => $content,
            'post_excerpt' => $excerpt,
            'post_status' => $should_publish ? 'publish' : 'draft',
            'post_type' => $post_type,
            'post_author' => 1,
            'post_date' => $item['pub_date'],
            'meta_input' => $this->prepare_post_meta($item, $extracted_data, $feed),
            'post_category' => $category_id ? [$category_id] : []
        ];
        
        // Create post
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            throw new Exception($post_id->get_error_message());
        }
        
        if ($category_id) {
            wp_set_post_terms($post_id, [$category_id], 'category');
        }
        
        // Set taxonomies if extracted
        if (!empty($extracted_data['opportunity_type'])) {
            wp_set_object_terms($post_id, $extracted_data['opportunity_type'], 'opportunity_type');
        }
        
        return $post_id;
    }
    
    /**
     * Generate post content
     */
    private function generate_post_content($item, $extracted_data) {
        $content = $item['main_content'];
        
        // Add source link
        if (!empty($item['link'])) {
            $content .= "\n\n<p><strong>Source:</strong> <a href=\"{$item['link']}\" target=\"_blank\">View Original</a></p>";
        }
        
        return $content;
    }
    
    /**
     * Prepare post metadata
     */
    private function prepare_post_meta($item, $extracted_data, $feed) {
        $meta = [
            '_gellobit_source_url' => $item['link'],
            '_gellobit_feed_id' => $feed['id'],
            '_gellobit_rss_guid' => $item['guid'],
            '_gellobit_processed_at' => current_time('mysql'),
            '_gellobit_content_scraped' => !empty($item['content_scraped'])
        ];
        
        // Add extracted AI data
        foreach (['opportunity_type', 'deadline', 'prize_value', 'requirements', 'location', 'confidence'] as $field) {
            if (!empty($extracted_data[$field])) {
                $meta["_gellobit_{$field}"] = $extracted_data[$field];
            }
        }
        
        if (empty($meta['_gellobit_opportunity_type']) && !empty($feed['default_opportunity_type'])) {
            $meta['_gellobit_opportunity_type'] = $feed['default_opportunity_type'];
        }
        
        return $meta;
    }
    
    /**
     * Check for duplicates
     */
    private function is_duplicate($item, $feed) {
        if (!empty($feed['allow_republish'])) {
            return false;
        }
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_duplicate_tracking';
        
        $content_hash = md5($item['main_content']);
        $title_hash = md5($item['title']);
        $url_hash = md5($item['link']);
        
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$table_name} WHERE content_hash = %s OR title_hash = %s OR url_hash = %s",
            $content_hash, $title_hash, $url_hash
        ));
        
        return !empty($existing);
    }
    
    /**
     * Record duplicate
     */
    private function record_duplicate($item, $post_id, $feed_id) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'gellobit_duplicate_tracking';

        // Use INSERT IGNORE to silently skip duplicates without errors
        $wpdb->query(
            $wpdb->prepare(
                "INSERT IGNORE INTO {$table_name}
                (content_hash, title_hash, url_hash, post_id, feed_id, created_at)
                VALUES (%s, %s, %s, %d, %d, %s)",
                md5($item['main_content']),
                md5($item['title']),
                md5($item['link']),
                $post_id,
                intval($feed_id),
                current_time('mysql')
            )
        );
    }

    private function record_processing_history($feed, $item, $status, $reason, $post_id = null) {
        $db = $this->database;
        $category_id = $feed['default_category'] ?? null;
        $category_name = '';
        if (!empty($category_id)) {
            $term = get_term($category_id, 'category');
            if ($term && !is_wp_error($term)) {
                $category_name = $term->name;
            }
        }

        $db->record_processing_history([
            'feed_id' => $feed['id'],
            'feed_name' => $feed['name'],
            'category_id' => $category_id,
            'category_name' => $category_name,
            'ai_provider' => $feed['ai_provider'] ?? 'default',
            'item_title' => $item['title'] ?? '',
            'item_url' => $item['link'] ?? '',
            'status' => $status,
            'reason' => $reason,
            'post_id' => $post_id
        ]);
    }
    
    /**
     * Generate AI-driven excerpt, title and content based on the configured prompt
     */
    private function generate_ai_article($feed, $item) {
        $type = $feed['default_opportunity_type'] ?? '';
        $provider = $feed['ai_provider'] ?? 'default';
        if ($provider === 'default' || empty($provider)) {
            $provider = $this->ai_transformer->get_default_provider();
        }
        $context = [
            'original_title' => $item['title'],
            'content' => $item['main_content'],
            'source_url' => $item['link'],
            'feed_name' => $feed['name'],
            'feed_url' => $feed['url']
        ];
        $segments = $this->prompt_manager->get_prompt_segments($type, $context);
        if (empty($segments)) {
            return ['success' => false, 'error' => 'Prompt template not found for type ' . $type];
        }

        $excerpt = null;
        $title = null;
        $content = null;

        foreach ($segments as $index => $segment) {
            // Segment 0: Excerpt (max 20 words)
            // Segment 1: Title (SEO-friendly)
            // Segment 2: Content (full HTML article)
            $options = [
                'max_tokens' => $index === 0 ? 60 : ($index === 1 ? 80 : 1800),
                'temperature' => 0.2,
                'system_message' => $index === 0
                    ? 'You write compelling 20-word maximum excerpts for opportunity listings. Be concise and SEO-friendly.'
                    : ($index === 1
                        ? 'You craft concise, SEO-friendly titles for opportunity listings. Return exactly one title.'
                        : 'You are a senior editor for gellobit.com. Produce polished HTML only and follow instructions precisely.')
            ];
            $response = $this->ai_transformer->generate_from_prompt($segment, $options, $provider);
            if (empty($response['success']) || empty($response['content'])) {
                return ['success' => false, 'error' => $response['error'] ?? 'Empty AI response'];
            }
            $payload = is_array($response['content']) ? wp_json_encode($response['content']) : $response['content'];

            if ($index === 0) {
                // Excerpt segment
                $excerpt = $this->sanitize_generated_excerpt($payload);
            } elseif ($index === 1) {
                // Title segment
                $title = $this->sanitize_generated_title($payload, $item['title']);
            } else {
                // Content segment
                $content = trim($payload);
            }
        }

        if (empty($content)) {
            return ['success' => false, 'error' => 'AI did not return article content'];
        }

        // Detectar contenido inválido rechazado por la IA
        if (stripos($content, 'INVALID CONTENT:') === 0 || stripos($content, 'INVALID CONTENT') !== false) {
            $this->log('AI rejected content as invalid: ' . substr($content, 0, 200), 'warning', [
                'feed_id' => $feed['id'],
                'item_title' => $item['title']
            ], $feed['id']);
            // error_log('[Gellobit RSS] AI rejected invalid content for: ' . $item['title'] . ' - Reason: ' . substr($content, 0, 200));
            return ['success' => false, 'error' => 'invalid_content'];
        }

        return [
            'success' => true,
            'excerpt' => $excerpt,
            'title' => $title,
            'content' => $content
        ];
    }
    
    private function sanitize_generated_title($candidate, $fallback) {
        $title = trim(wp_strip_all_tags($candidate));
        $title = preg_replace('/\s+/', ' ', $title);
        if (empty($title)) {
            return $fallback;
        }
        return mb_substr($title, 0, 140);
    }

    /**
     * Sanitize AI-generated excerpt (max 20 words)
     */
    private function sanitize_generated_excerpt($candidate) {
        // Remove HTML tags and clean whitespace
        $excerpt = trim(wp_strip_all_tags($candidate));
        $excerpt = preg_replace('/\s+/', ' ', $excerpt);

        // Limit to 20 words
        $words = explode(' ', $excerpt);
        if (count($words) > 20) {
            $words = array_slice($words, 0, 20);
            $excerpt = implode(' ', $words) . '...';
        }

        // Limit to 160 characters for SEO (meta description length)
        if (mb_strlen($excerpt) > 160) {
            $excerpt = mb_substr($excerpt, 0, 157) . '...';
        }

        return $excerpt;
    }
    
    private function append_source_reference($content, $source_url) {
        if (is_array($content)) {
            $content = wp_json_encode($content);
        }
        if (empty($source_url)) {
            return $content;
        }

        // Extract real opportunity URLs from content (links that are not the source URL)
        $opportunity_links = $this->extract_opportunity_links($content, $source_url);

        // Don't append source reference - real opportunity links should already be in the content
        // The AI is instructed to include proper links in the article
        // We only want links to the actual opportunity, not to where we found it

        return $content;
    }

    /**
     * Extract opportunity URLs from AI-generated content
     * Returns links that point to the actual opportunity (not the source page)
     */
    private function extract_opportunity_links($content, $source_url) {
        $links = [];

        // Find all URLs in the content
        if (preg_match_all('/<a[^>]+href=["\'](.*?)["\'][^>]*>/i', $content, $matches)) {
            foreach ($matches[1] as $url) {
                // Skip if it's the source URL or same domain as source
                if ($url === $source_url) {
                    continue;
                }

                $source_domain = parse_url($source_url, PHP_URL_HOST);
                $link_domain = parse_url($url, PHP_URL_HOST);

                // Only include external links that are different from the source
                if ($link_domain && $link_domain !== $source_domain) {
                    $links[] = $url;
                }
            }
        }

        return $links;
    }
    
    /**
     * Helper methods
     */
    private function get_feed($feed_id) {
        $feeds = $this->database->get_feeds('all');
        foreach ($feeds as $feed) {
            if ($feed['id'] == $feed_id) {
                return $feed;
            }
        }
        return null;
    }
    
    private function update_feed_stats($feed_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        
        $wpdb->update(
            $table_name,
            [
                'last_processed' => current_time('mysql'),
                'error_count' => 0,
                'last_error' => null
            ],
            ['id' => $feed_id]
        );
    }
    
    private function mark_feed_error($feed_id, $error_message) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        
        $wpdb->query($wpdb->prepare(
            "UPDATE {$table_name} SET error_count = error_count + 1, last_error = %s WHERE id = %d",
            $error_message, $feed_id
        ));
    }
    
    private function log($message, $level = 'info', $context = [], $feed_id = null) {
        $this->database->log($level, $message, $context, $feed_id);
    }

    private function sanitize_generated_content($content, $title) {
        if (empty($content)) {
            return $content;
        }

        // Step 1: Remove markdown code fences (```html, ```markdown, etc.)
        // AI sometimes wraps HTML content in code fences - we need to extract the actual content
        $content = $this->remove_markdown_code_fences($content);

        // Step 2: Remove ALL h1 tags at the beginning of content
        // WordPress already shows the post title in <h1>, no need to duplicate
        $h1_pattern = '/^\s*<h1[^>]*>.*?<\/h1>\s*/is';
        $content = preg_replace($h1_pattern, '', $content, 1);

        // Step 3: Also remove h2 tags at the very beginning that look like titles
        // Check if h2 is at the start and looks like a title (not a section heading)
        $h2_pattern = '/^\s*<h2[^>]*>(.*?)<\/h2>\s*/is';
        if (preg_match($h2_pattern, $content, $matches)) {
            $h2_text = trim(strip_tags($matches[1]));
            // If h2 is long enough to be a title (more than 20 chars) and starts at beginning, remove it
            if (strlen($h2_text) > 20) {
                $content = preg_replace($h2_pattern, '', $content, 1);
            }
        }

        return ltrim($content);
    }

    /**
     * Remove markdown code fences from AI-generated content
     * Extracts HTML content wrapped in ```html or similar markdown fences
     */
    private function remove_markdown_code_fences($content) {
        // Pattern to match markdown code fences like ```html, ```markdown, or just ```
        // Captures the content between the opening and closing fences
        $fence_pattern = '/^```(?:html|markdown|md)?\s*\n?(.*?)\n?```$/is';

        if (preg_match($fence_pattern, trim($content), $matches)) {
            // Extract the actual content from inside the code fence
            $content = trim($matches[1]);
        }

        // Also remove inline code fences that might appear at start or end
        $content = preg_replace('/^```(?:html|markdown|md)?\s*\n?/i', '', $content);
        $content = preg_replace('/\n?```\s*$/i', '', $content);

        return trim($content);
    }

    private function maybe_set_featured_image($post_id, $image_url, $feed = null) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $fallback_url = null;
        if (!empty($feed['fallback_featured_image']) && filter_var($feed['fallback_featured_image'], FILTER_VALIDATE_URL)) {
            $fallback_url = $feed['fallback_featured_image'];
        }

        // Strategy: Try feed image first, if it fails try fallback, if that fails give up
        $images_to_try = [];

        // Add feed/scraped image as first option
        if (!empty($image_url) && filter_var($image_url, FILTER_VALIDATE_URL)) {
            $images_to_try[] = ['url' => $image_url, 'source' => 'feed/scraping'];
        }

        // Add fallback as second option
        if ($fallback_url) {
            $images_to_try[] = ['url' => $fallback_url, 'source' => 'fallback'];
        }

        // If no images available, exit early
        if (empty($images_to_try)) {
            // error_log('[Gellobit RSS] No featured image available for post ' . $post_id);
            return false;
        }

        // Try each image in order until one succeeds
        foreach ($images_to_try as $image_data) {
            $url = $image_data['url'];
            $source = $image_data['source'];

            // error_log('[Gellobit RSS] Attempting to set featured image from ' . $source . ': ' . $url);

            $attachment_id = media_sideload_image($url, $post_id, null, 'id');

            if (!is_wp_error($attachment_id)) {
                set_post_thumbnail($post_id, $attachment_id);
                // error_log('[Gellobit RSS] ✓ Featured image set successfully for post ' . $post_id . ' (source: ' . $source . ')');
                return true;
            } else {
                // Log error but continue to next image
                error_log('[Gellobit RSS] ✗ Failed to set featured image from ' . $source . ': ' . $attachment_id->get_error_message());
            }
        }

        // All attempts failed
        error_log('[Gellobit RSS] ✗ All featured image attempts failed for post ' . $post_id);
        return false;
    }
}
?>
