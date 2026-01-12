<?php
/**
 * Admin interface class for RSS Processor Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Admin {
    
    private static $instance = null;
    private $database;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->database = Gellobit_RSS_Database::get_instance();
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('wp_ajax_gellobit_save_feed', [$this, 'ajax_save_feed']);
        add_action('wp_ajax_gellobit_delete_feed', [$this, 'ajax_delete_feed']);
        add_action('wp_ajax_gellobit_test_feed', [$this, 'ajax_test_feed']);
        add_action('wp_ajax_gellobit_export_feeds', [$this, 'ajax_export_feeds']);
        add_action('wp_ajax_gellobit_import_feeds', [$this, 'ajax_import_feeds']);
    }
    
    /**
     * Render feeds management page
     */
    public function render_feeds_page() {
        // Handle form submissions
        if (isset($_POST['action'])) {
            $this->handle_feed_form_submission();
        }
        
        $feeds = $this->database->get_feeds('all');
        $editing_feed = null;
        
        if (isset($_GET['edit']) && intval($_GET['edit'])) {
            $edit_id = intval($_GET['edit']);
            foreach ($feeds as $feed) {
                if ($feed['id'] == $edit_id) {
                    $editing_feed = $feed;
                    break;
                }
            }
        }
        ?>
        <div class="wrap">
            <h1><?php _e('RSS Feeds Management', 'gellobit-rss'); ?></h1>
            
            <div class="gellobit-feeds-container">
                <div class="gellobit-feed-tools">
                    <button type="button" id="export-feeds-btn" class="button"><?php _e('Export Feeds', 'gellobit-rss'); ?></button>
                    <button type="button" id="import-feeds-btn" class="button"><?php _e('Import Feeds', 'gellobit-rss'); ?></button>
                    <input type="file" id="import-feeds-file" accept=".json" style="display:none;">
                </div>
                
                <!-- Add/Edit Feed Form -->
                <div class="feed-form-section">
                    <h2><?php echo $editing_feed ? __('Edit Feed', 'gellobit-rss') : __('Add New Feed', 'gellobit-rss'); ?></h2>
                    
                    <form method="post" class="feed-form">
                        <?php wp_nonce_field('gellobit_feed_action', 'gellobit_feed_nonce'); ?>
                        <input type="hidden" name="action" value="save_feed">
                        <?php if ($editing_feed): ?>
                            <input type="hidden" name="feed_id" value="<?php echo $editing_feed['id']; ?>">
                        <?php endif; ?>
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="feed_name"><?php _e('Feed Name', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <input type="text" id="feed_name" name="feed_name" 
                                           value="<?php echo esc_attr($editing_feed['name'] ?? ''); ?>" 
                                           class="regular-text" required>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="feed_url"><?php _e('RSS Feed URL', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <input type="url" id="feed_url" name="feed_url" 
                                           value="<?php echo esc_attr($editing_feed['url'] ?? ''); ?>" 
                                           class="regular-text" required>
                                    <p class="description"><?php _e('The RSS or Atom feed URL', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="feed_status"><?php _e('Status', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <select id="feed_status" name="feed_status">
                                        <option value="active" <?php selected($editing_feed['status'] ?? 'active', 'active'); ?>><?php _e('Active', 'gellobit-rss'); ?></option>
                                        <option value="inactive" <?php selected($editing_feed['status'] ?? '', 'inactive'); ?>><?php _e('Inactive', 'gellobit-rss'); ?></option>
                                    </select>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="default_category"><?php _e('Category', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <?php
                                    $category_dropdown = wp_dropdown_categories([
                                        'taxonomy' => 'category',
                                        'hide_empty' => false,
                                        'name' => 'default_category',
                                        'id' => 'default_category',
                                        'selected' => intval($editing_feed['default_category'] ?? 0),
                                        'show_option_none' => __('Select a category', 'gellobit-rss'),
                                        'option_none_value' => '',
                                        'echo' => 0
                                    ]);
                                    echo $category_dropdown;
                                    ?>
                                    <p class="description"><?php _e('WordPress category where new posts from this feed will be stored', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="ai_provider"><?php _e('AI Provider', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <select id="ai_provider" name="ai_provider">
                                        <?php
                                        $current_provider = $editing_feed['ai_provider'] ?? 'default';
                                        $providers = [
                                            'default' => __('Use global default', 'gellobit-rss'),
                                            'openai' => __('OpenAI', 'gellobit-rss'),
                                            'openrouter' => __('OpenRouter', 'gellobit-rss'),
                                            'deepseek' => __('DeepSeek', 'gellobit-rss'),
                                            'claude' => __('Claude (Anthropic)', 'gellobit-rss'),
                                            'gemini' => __('Gemini (Google)', 'gellobit-rss')
                                        ];
                                        foreach ($providers as $value => $label) {
                                            printf(
                                                '<option value="%s" %s>%s</option>',
                                                esc_attr($value),
                                                selected($current_provider, $value, false),
                                                esc_html($label)
                                            );
                                        }
                                        ?>
                                    </select>
                                    <p class="description"><?php _e('Choose which AI provider should generate content for this feed.', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="default_opportunity_type"><?php _e('Default Opportunity Type', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <select id="default_opportunity_type" name="default_opportunity_type">
                                        <option value="giveaway" <?php selected($editing_feed['default_opportunity_type'] ?? 'giveaway', 'giveaway'); ?>><?php _e('Giveaway', 'gellobit-rss'); ?></option>
                                        <option value="scholarship" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'scholarship'); ?>><?php _e('Scholarship', 'gellobit-rss'); ?></option>
                                        <option value="contest" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'contest'); ?>><?php _e('Contest', 'gellobit-rss'); ?></option>
                                        <option value="job_fair" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'job_fair'); ?>><?php _e('Job Fair', 'gellobit-rss'); ?></option>
                                        <option value="volunteer" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'volunteer'); ?>><?php _e('Volunteer', 'gellobit-rss'); ?></option>
                                        <option value="sweepstakes" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'sweepstakes'); ?>><?php _e('Sweepstakes', 'gellobit-rss'); ?></option>
                                        <option value="instant_win" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'instant_win'); ?>><?php _e('Instant Win', 'gellobit-rss'); ?></option>
                                        <option value="get_paid_to" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'get_paid_to'); ?>><?php _e('Get Paid To', 'gellobit-rss'); ?></option>
                                        <option value="dream_job" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'dream_job'); ?>><?php _e('Dream Job', 'gellobit-rss'); ?></option>
                                        <option value="free_training" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'free_training'); ?>><?php _e('Free Training', 'gellobit-rss'); ?></option>
                                        <option value="promo" <?php selected($editing_feed['default_opportunity_type'] ?? '', 'promo'); ?>><?php _e('Promotions', 'gellobit-rss'); ?></option>
                                    </select>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row"><?php _e('Processing Options', 'gellobit-rss'); ?></th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="enable_scraping" value="1" 
                                               <?php checked($editing_feed['enable_scraping'] ?? 1, 1); ?>>
                                        <?php _e('Enable content scraping', 'gellobit-rss'); ?>
                                    </label><br>
                                    
                                    <label>
                                        <input type="checkbox" name="enable_ai_processing" value="1" 
                                               <?php checked($editing_feed['enable_ai_processing'] ?? 1, 1); ?>>
                                        <?php _e('Enable AI processing', 'gellobit-rss'); ?>
                                    </label><br>
                                    
                                    <label>
                                        <input type="checkbox" name="auto_publish" value="1" 
                                               <?php checked($editing_feed['auto_publish'] ?? 1, 1); ?>>
                                        <?php _e('Auto-publish posts', 'gellobit-rss'); ?>
                                    </label>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="quality_threshold"><?php _e('Quality Threshold', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <input type="number" id="quality_threshold" name="quality_threshold" 
                                           value="<?php echo esc_attr($editing_feed['quality_threshold'] ?? '0.60'); ?>" 
                                           min="0" max="1" step="0.01" class="small-text">
                                    <p class="description"><?php _e('Minimum AI confidence score (0.0 - 1.0)', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row">
                                    <label for="priority"><?php _e('Priority', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <input type="number" id="priority" name="priority"
                                           value="<?php echo esc_attr($editing_feed['priority'] ?? '5'); ?>"
                                           min="1" max="10" class="small-text">
                                    <p class="description"><?php _e('Processing priority (1-10, higher is first)', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="feed_interval"><?php _e('Cron Interval', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <select id="feed_interval" name="feed_interval">
                                        <?php
                                        $current_interval = $editing_feed['feed_interval'] ?? 'hourly';
                                        $intervals = [
                                            'every_15_minutes' => __('Every 15 Minutes', 'gellobit-rss'),
                                            'every_30_minutes' => __('Every 30 Minutes', 'gellobit-rss'),
                                            'hourly' => __('Hourly (Default)', 'gellobit-rss'),
                                            'twicedaily' => __('Twice Daily (Every 12 hours)', 'gellobit-rss'),
                                            'daily' => __('Daily', 'gellobit-rss')
                                        ];
                                        foreach ($intervals as $value => $label) {
                                            printf(
                                                '<option value="%s" %s>%s</option>',
                                                esc_attr($value),
                                                selected($current_interval, $value, false),
                                                esc_html($label)
                                            );
                                        }
                                        ?>
                                    </select>
                                    <p class="description"><?php _e('How often should this feed be processed? Each feed has its own schedule.', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="fallback_featured_image"><?php _e('Fallback Featured Image', 'gellobit-rss'); ?></label>
                                </th>
                                <td>
                                    <div style="margin-bottom: 10px;">
                                        <input type="url" id="fallback_featured_image" name="fallback_featured_image"
                                               value="<?php echo esc_attr($editing_feed['fallback_featured_image'] ?? ''); ?>"
                                               class="large-text" placeholder="https://example.com/default-image.jpg">
                                        <button type="button" class="button" id="upload_fallback_image_button">
                                            <?php _e('Choose from Library', 'gellobit-rss'); ?>
                                        </button>
                                    </div>
                                    <?php if (!empty($editing_feed['fallback_featured_image'])): ?>
                                        <div id="fallback_image_preview" style="margin-top: 10px;">
                                            <img src="<?php echo esc_url($editing_feed['fallback_featured_image']); ?>" style="max-width: 300px; height: auto; border: 1px solid #ddd;">
                                        </div>
                                    <?php else: ?>
                                        <div id="fallback_image_preview" style="margin-top: 10px; display: none;">
                                            <img src="" style="max-width: 300px; height: auto; border: 1px solid #ddd;">
                                        </div>
                                    <?php endif; ?>
                                    <p class="description"><?php _e('Default image to use if no featured image is found in the feed or scraped content. Leave empty to skip images when none found.', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row"><?php _e('Advanced Options', 'gellobit-rss'); ?></th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="allow_republish" value="1"
                                               <?php checked($editing_feed['allow_republish'] ?? 0, 1); ?>>
                                        <?php _e('Allow re-publishing (ignore duplicates)', 'gellobit-rss'); ?>
                                    </label>
                                    <p class="description"><?php _e('Enable this to allow the same content to be published multiple times (useful for rotating campaigns)', 'gellobit-rss'); ?></p>
                                </td>
                            </tr>
                        </table>
                        
                        <p class="submit">
                            <input type="submit" class="button-primary" 
                                   value="<?php echo $editing_feed ? __('Update Feed', 'gellobit-rss') : __('Add Feed', 'gellobit-rss'); ?>">
                            <?php if ($editing_feed): ?>
                                <a href="<?php echo admin_url('admin.php?page=gellobit-rss-feeds'); ?>" class="button"><?php _e('Cancel', 'gellobit-rss'); ?></a>
                            <?php endif; ?>
                        </p>
                    </form>
                </div>
                
                <!-- Existing Feeds List -->
                <div class="feeds-list-section">
                    <h2><?php _e('Existing Feeds', 'gellobit-rss'); ?></h2>
                    
                    <?php if (empty($feeds)): ?>
                        <p><?php _e('No RSS feeds configured yet.', 'gellobit-rss'); ?></p>
                    <?php else: ?>
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th><?php _e('Name', 'gellobit-rss'); ?></th>
                                    <th><?php _e('URL', 'gellobit-rss'); ?></th>
                                    <th><?php _e('Status', 'gellobit-rss'); ?></th>
                                    <th><?php _e('Category', 'gellobit-rss'); ?></th>
                                    <th><?php _e('AI Provider', 'gellobit-rss'); ?></th>
                                    <th><?php _e('Type', 'gellobit-rss'); ?></th>
                                    <th><?php _e('Last Processed', 'gellobit-rss'); ?></th>
                                    <th><?php _e('Actions', 'gellobit-rss'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($feeds as $feed): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($feed['name']); ?></strong></td>
                                    <td>
                                        <a href="<?php echo esc_url($feed['url']); ?>" target="_blank">
                                            <?php echo esc_html(wp_trim_words($feed['url'], 8, '...')); ?>
                                        </a>
                                    </td>
                                    <td>
                                        <span class="status-<?php echo esc_attr($feed['status']); ?>">
                                            <?php echo esc_html(ucfirst($feed['status'])); ?>
                                        </span>
                                        <?php if (!empty($feed['last_error'])): ?>
                                            <br><small style="color: red;"><?php echo esc_html(wp_trim_words($feed['last_error'], 10)); ?></small>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php
                                        if (!empty($feed['default_category'])) {
                                            $category = get_term($feed['default_category'], 'category');
                                            echo esc_html($category && !is_wp_error($category) ? $category->name : __('Unavailable', 'gellobit-rss'));
                                        } else {
                                            _e('No category', 'gellobit-rss');
                                        }
                                        ?>
                                    </td>
                                    <td>
                                        <?php
                                        $provider_labels = [
                                            'default' => __('Default', 'gellobit-rss'),
                                            'openai' => 'OpenAI',
                                            'openrouter' => 'OpenRouter',
                                            'deepseek' => 'DeepSeek',
                                            'claude' => 'Claude',
                                            'gemini' => 'Gemini'
                                        ];
                                        $provider = $feed['ai_provider'] ?? 'default';
                                        echo esc_html($provider_labels[$provider] ?? $provider);
                                        ?>
                                    </td>
                                    <td><?php echo esc_html($feed['default_opportunity_type']); ?></td>
                                    <td>
                                        <?php 
                                        echo $feed['last_processed'] ? 
                                            date('M j, Y H:i', strtotime($feed['last_processed'])) : 
                                            __('Never', 'gellobit-rss'); 
                                        ?>
                                    </td>
                                    <td>
                                        <a href="<?php echo admin_url('admin.php?page=gellobit-rss-feeds&edit=' . $feed['id']); ?>" class="button button-small"><?php _e('Edit', 'gellobit-rss'); ?></a>
                                        <button type="button" class="button button-small test-feed-btn" data-feed-id="<?php echo $feed['id']; ?>"><?php _e('Test', 'gellobit-rss'); ?></button>
                                        <button type="button" class="button button-small process-feed-btn" data-feed-id="<?php echo $feed['id']; ?>"><?php _e('Process', 'gellobit-rss'); ?></button>
                                        <button type="button" class="button button-small delete-feed-btn" data-feed-id="<?php echo $feed['id']; ?>" style="color: red;"><?php _e('Delete', 'gellobit-rss'); ?></button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
                
            </div>
            
            <style>
            .gellobit-feeds-container {
                max-width: 1200px;
            }
            
            .feed-form-section, .feeds-list-section {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .gellobit-feed-tools {
                margin-bottom: 15px;
                display: flex;
                gap: 10px;
            }
            
            .status-active { color: green; font-weight: bold; }
            .status-inactive { color: orange; font-weight: bold; }
            .status-error { color: red; font-weight: bold; }
            
            .button-small {
                font-size: 11px;
                height: auto;
                line-height: 16px;
                padding: 2px 6px;
            }
            </style>
            
            <script>
            jQuery(document).ready(function($) {
                // Test feed functionality
                $('.test-feed-btn').click(function() {
                    var feedId = $(this).data('feed-id');
                    var button = $(this);
                    
                    button.prop('disabled', true).text('Testing...');
                    
                    $.post(ajaxurl, {
                        action: 'gellobit_test_feed',
                        feed_id: feedId,
                        nonce: '<?php echo wp_create_nonce("gellobit_feed_test"); ?>'
                    }, function(response) {
                        if (response.success) {
                            alert('Feed test successful! Found ' + response.data.items_found + ' items.');
                        } else {
                            alert('Feed test failed: ' + response.data);
                        }
                    }).always(function() {
                        button.prop('disabled', false).text('Test');
                    });
                });
                
                // Process feed functionality
                $('.process-feed-btn').click(function() {
                    var feedId = $(this).data('feed-id');
                    var button = $(this);
                    
                    button.prop('disabled', true).text('Processing...');
                    
                    $.post(ajaxurl, {
                        action: 'gellobit_process_feed',
                        feed_id: feedId,
                        nonce: gellobitRssAjax.nonce
                    }, function(response) {
                        if (response.success) {
                            alert('Feed processed successfully! Created ' + response.data.created_posts + ' posts.');
                            location.reload();
                        } else {
                            alert('Feed processing failed: ' + response.data.message);
                        }
                    }).always(function() {
                        button.prop('disabled', false).text('Process');
                    });
                });
                
                // Delete feed functionality
                $('.delete-feed-btn').click(function() {
                    var feedId = $(this).data('feed-id');

                    if (confirm('Are you sure you want to delete this feed?')) {
                        $.post(ajaxurl, {
                            action: 'gellobit_delete_feed',
                            feed_id: feedId,
                            nonce: '<?php echo wp_create_nonce("gellobit_feed_delete"); ?>'
                        }, function(response) {
                            if (response.success) {
                                location.reload();
                            } else {
                                alert('Delete failed: ' + response.data);
                            }
                        });
                    }
                });

                // Media uploader for fallback featured image
                var fallbackImageFrame;
                $('#upload_fallback_image_button').click(function(e) {
                    e.preventDefault();

                    if (fallbackImageFrame) {
                        fallbackImageFrame.open();
                        return;
                    }

                    fallbackImageFrame = wp.media({
                        title: 'Select Fallback Featured Image',
                        button: {
                            text: 'Use this image'
                        },
                        multiple: false
                    });

                    fallbackImageFrame.on('select', function() {
                        var attachment = fallbackImageFrame.state().get('selection').first().toJSON();
                        $('#fallback_featured_image').val(attachment.url);
                        $('#fallback_image_preview img').attr('src', attachment.url);
                        $('#fallback_image_preview').show();
                    });

                    fallbackImageFrame.open();
                });
            });
            </script>
        </div>
        <?php
    }
    
    /**
     * Handle feed form submission
     */
    private function handle_feed_form_submission() {
        if (!isset($_POST['gellobit_feed_nonce']) || !wp_verify_nonce($_POST['gellobit_feed_nonce'], 'gellobit_feed_action')) {
            return;
        }
        
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $feed_data = [
            'name' => sanitize_text_field($_POST['feed_name']),
            'url' => esc_url_raw($_POST['feed_url']),
            'status' => sanitize_text_field($_POST['feed_status']),
            'default_post_type' => 'post',
            'default_category' => isset($_POST['default_category']) && $_POST['default_category'] !== ''
                ? intval($_POST['default_category'])
                : null,
            'ai_provider' => isset($_POST['ai_provider']) ? sanitize_text_field($_POST['ai_provider']) : 'default',
            'allow_republish' => isset($_POST['allow_republish']) ? 1 : 0,
            'feed_interval' => sanitize_text_field($_POST['feed_interval'] ?? ''),
            'fallback_featured_image' => isset($_POST['fallback_featured_image']) && !empty($_POST['fallback_featured_image'])
                ? esc_url_raw($_POST['fallback_featured_image'])
                : null,
            'default_opportunity_type' => sanitize_text_field($_POST['default_opportunity_type']),
            'enable_scraping' => isset($_POST['enable_scraping']) ? 1 : 0,
            'enable_ai_processing' => isset($_POST['enable_ai_processing']) ? 1 : 0,
            'auto_publish' => isset($_POST['auto_publish']) ? 1 : 0,
            'quality_threshold' => floatval($_POST['quality_threshold']),
            'priority' => intval($_POST['priority'])
        ];
        
        if (isset($_POST['feed_id']) && intval($_POST['feed_id'])) {
            $feed_data['id'] = intval($_POST['feed_id']);
        }
        
        $result = $this->database->save_feed($feed_data);

        if ($result) {
            echo '<div class="notice notice-success"><p>' . __('Feed saved successfully!', 'gellobit-rss') . '</p></div>';
            do_action('gellobit_feed_saved', $result);
        } else {
            echo '<div class="notice notice-error"><p>' . __('Error saving feed.', 'gellobit-rss') . '</p></div>';
        }
    }
    
    /**
     * AJAX handlers
     */
    public function ajax_test_feed() {
        check_ajax_referer('gellobit_feed_test', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $feed_id = intval($_POST['feed_id']);
        $processor = Gellobit_RSS_Processor::get_instance();
        
        try {
            $result = $processor->process_feed($feed_id);
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
    
    public function ajax_delete_feed() {
        check_ajax_referer('gellobit_feed_delete', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }

        $feed_id = intval($_POST['feed_id']);
        $result = $this->database->delete_feed($feed_id);

        if ($result) {
            do_action('gellobit_feed_deleted', $feed_id);
            wp_send_json_success();
        } else {
            wp_send_json_error(__('Failed to delete feed', 'gellobit-rss'));
        }
    }

    public function ajax_export_feeds() {
        // error_log('[Gellobit RSS] Export request received');

        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'gellobit_rss_ajax')) {
            error_log('[Gellobit RSS Export] Nonce verification failed');
            wp_send_json_error(['message' => 'Nonce verification failed']);
            return;
        }

        if (!current_user_can('manage_options')) {
            error_log('[Gellobit RSS Export] Permission denied');
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        try {
            // error_log('[Gellobit RSS Export] Getting feeds from database');
            $feeds = $this->database->get_feeds('all');
            // error_log('[Gellobit RSS Export] Found ' . count($feeds) . ' feeds');

            $export = [];

            foreach ($feeds as $feed) {
                $category_slug = '';
                if (!empty($feed['default_category'])) {
                    $term = get_term($feed['default_category'], 'category');
                    if ($term && !is_wp_error($term)) {
                        $category_slug = $term->slug;
                    }
                }

                $export[] = [
                    'name' => $feed['name'] ?? '',
                    'url' => $feed['url'] ?? '',
                    'status' => $feed['status'] ?? 'active',
                    'feed_type' => $feed['feed_type'] ?? 'rss',
                    'default_opportunity_type' => $feed['default_opportunity_type'] ?? '',
                    'enable_scraping' => isset($feed['enable_scraping']) ? (int)$feed['enable_scraping'] : 1,
                    'enable_ai_processing' => isset($feed['enable_ai_processing']) ? (int)$feed['enable_ai_processing'] : 1,
                    'auto_publish' => isset($feed['auto_publish']) ? (int)$feed['auto_publish'] : 0,
                    'keywords' => $feed['keywords'] ?? '',
                    'exclude_keywords' => $feed['exclude_keywords'] ?? '',
                    'quality_threshold' => isset($feed['quality_threshold']) ? floatval($feed['quality_threshold']) : 0.6,
                    'priority' => isset($feed['priority']) ? intval($feed['priority']) : 50,
                    'ai_provider' => $feed['ai_provider'] ?? 'default',
                    'feed_interval' => $feed['feed_interval'] ?? '',
                    'allow_republish' => isset($feed['allow_republish']) ? (int)$feed['allow_republish'] : 0,
                    'fallback_featured_image' => $feed['fallback_featured_image'] ?? '',
                    'default_category_slug' => $category_slug
                ];
            }

            // error_log('[Gellobit RSS Export] Sending success response');
            wp_send_json_success(['feeds' => $export]);

        } catch (Exception $e) {
            error_log('[Gellobit RSS Export] Exception: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    public function ajax_import_feeds() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'gellobit_rss_ajax')) {
            error_log('[Gellobit RSS Import] Nonce verification failed');
            wp_send_json_error(['message' => 'Nonce verification failed']);
            return;
        }

        if (!current_user_can('manage_options')) {
            error_log('[Gellobit RSS Import] Permission denied');
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        if (empty($_POST['feeds'])) {
            error_log('[Gellobit RSS Import] No data received');
            wp_send_json_error(['message' => 'No data received']);
            return;
        }

        try {
            $feeds = json_decode(stripslashes($_POST['feeds']), true);
            if (!is_array($feeds)) {
                error_log('[Gellobit RSS Import] Invalid JSON: ' . json_last_error_msg());
                wp_send_json_error(['message' => 'Invalid feeds format: ' . json_last_error_msg()]);
                return;
            }

            $imported = 0;
            $failed = 0;

        foreach ($feeds as $feed) {
            if (empty($feed['name']) || empty($feed['url'])) {
                $failed++;
                continue;
            }

            $category_id = null;
            if (!empty($feed['default_category_slug'])) {
                $term = get_term_by('slug', sanitize_title($feed['default_category_slug']), 'category');
                if ($term && !is_wp_error($term)) {
                    $category_id = $term->term_id;
                }
            }

            $feed_data = [
                'name' => sanitize_text_field($feed['name']),
                'url' => esc_url_raw($feed['url']),
                'status' => sanitize_text_field($feed['status'] ?? 'active'),
                'feed_type' => sanitize_text_field($feed['feed_type'] ?? 'rss'),
                'default_post_type' => 'post',
                'default_opportunity_type' => sanitize_text_field($feed['default_opportunity_type'] ?? 'giveaway'),
                'enable_scraping' => !empty($feed['enable_scraping']) ? 1 : 0,
                'enable_ai_processing' => !empty($feed['enable_ai_processing']) ? 1 : 0,
                'auto_publish' => !empty($feed['auto_publish']) ? 1 : 0,
                'keywords' => sanitize_textarea_field($feed['keywords'] ?? ''),
                'exclude_keywords' => sanitize_textarea_field($feed['exclude_keywords'] ?? ''),
                'quality_threshold' => isset($feed['quality_threshold']) ? floatval($feed['quality_threshold']) : 0.6,
                'priority' => isset($feed['priority']) ? intval($feed['priority']) : 5,
                'default_category' => $category_id,
                'ai_provider' => sanitize_text_field($feed['ai_provider'] ?? 'default'),
                'feed_interval' => sanitize_text_field($feed['feed_interval'] ?? 'hourly'),
                'allow_republish' => !empty($feed['allow_republish']) ? 1 : 0,
                'fallback_featured_image' => !empty($feed['fallback_featured_image']) ? esc_url_raw($feed['fallback_featured_image']) : null
            ];

            $result = $this->database->save_feed($feed_data);
            if ($result) {
                $imported++;
            } else {
                $failed++;
            }
        }

            wp_send_json_success([
                'message' => sprintf(__('Imported %d feeds, %d failures', 'gellobit-rss'), $imported, $failed)
            ]);

        } catch (Exception $e) {
            error_log('[Gellobit RSS Import] Exception: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
}
?>
