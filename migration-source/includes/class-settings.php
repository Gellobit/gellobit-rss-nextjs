<?php
/**
 * Settings class for RSS Processor Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Settings {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('wp_ajax_gellobit_fetch_ai_models', [$this, 'ajax_fetch_ai_models']);
        add_action('wp_ajax_gellobit_truncate_history', [$this, 'ajax_truncate_history']);
        add_action('wp_ajax_gellobit_export_settings', [$this, 'ajax_export_settings']);
        add_action('wp_ajax_gellobit_import_settings', [$this, 'ajax_import_settings']);
        add_action('wp_ajax_gellobit_save_prompt', [$this, 'ajax_save_prompt']);
        add_action('wp_ajax_gellobit_reset_prompt', [$this, 'ajax_reset_prompt']);
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        // General Settings
        register_setting('gellobit_rss_general', 'gellobit_rss_auto_process');
        register_setting('gellobit_rss_general', 'gellobit_rss_process_interval');
        register_setting('gellobit_rss_general', 'gellobit_rss_auto_publish');
        register_setting('gellobit_rss_general', 'gellobit_rss_post_type');
        register_setting('gellobit_rss_general', 'gellobit_rss_quality_threshold');
        register_setting('gellobit_rss_general', 'gellobit_rss_max_posts_per_run');
        
        // AI Settings
        register_setting('gellobit_rss_ai', 'gellobit_rss_ai_config', [$this, 'sanitize_ai_config']);
        
        // Scraping Settings
        register_setting('gellobit_rss_scraping', 'gellobit_rss_scraper_config', [$this, 'sanitize_scraper_config']);
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (isset($_POST['submit'])) {
            $this->handle_settings_form();
        }
        
        $current_tab = isset($_GET['tab']) ? $_GET['tab'] : 'general';
        ?>
        <div class="wrap">
            <h1><?php _e('Gellobit RSS Settings', 'gellobit-rss'); ?></h1>
            
            <nav class="nav-tab-wrapper">
                <a href="?page=gellobit-rss-settings&tab=general" class="nav-tab <?php echo $current_tab == 'general' ? 'nav-tab-active' : ''; ?>"><?php _e('General', 'gellobit-rss'); ?></a>
                <a href="?page=gellobit-rss-settings&tab=ai" class="nav-tab <?php echo $current_tab == 'ai' ? 'nav-tab-active' : ''; ?>"><?php _e('AI Settings', 'gellobit-rss'); ?></a>
                <a href="?page=gellobit-rss-settings&tab=prompts" class="nav-tab <?php echo $current_tab == 'prompts' ? 'nav-tab-active' : ''; ?>"><?php _e('Prompts', 'gellobit-rss'); ?></a>
                <a href="?page=gellobit-rss-settings&tab=scraping" class="nav-tab <?php echo $current_tab == 'scraping' ? 'nav-tab-active' : ''; ?>"><?php _e('Scraping', 'gellobit-rss'); ?></a>
                <a href="?page=gellobit-rss-settings&tab=advanced" class="nav-tab <?php echo $current_tab == 'advanced' ? 'nav-tab-active' : ''; ?>"><?php _e('Advanced', 'gellobit-rss'); ?></a>
            </nav>
            
            <form method="post" action="">
                <?php wp_nonce_field('gellobit_rss_settings', 'gellobit_rss_settings_nonce'); ?>
                
                <?php
                switch ($current_tab) {
                    case 'general':
                        $this->render_general_settings();
                        break;
                    case 'ai':
                        $this->render_ai_settings();
                        break;
                    case 'prompts':
                        $this->render_prompts_settings();
                        break;
                    case 'scraping':
                        $this->render_scraping_settings();
                        break;
                    case 'advanced':
                        $this->render_advanced_settings();
                        break;
                }
                ?>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Render general settings
     */
    private function render_general_settings() {
        $auto_process = get_option('gellobit_rss_auto_process', true);
        $process_interval = get_option('gellobit_rss_process_interval', 'hourly');
        $auto_publish = get_option('gellobit_rss_auto_publish', true);
        $post_type = get_option('gellobit_rss_post_type', 'opportunity');
        $quality_threshold = get_option('gellobit_rss_quality_threshold', 0.6);
        $max_posts = get_option('gellobit_rss_max_posts_per_run', 20);
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Automatic Processing', 'gellobit-rss'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="gellobit_rss_auto_process" value="1" <?php checked($auto_process, 1); ?>>
                        <?php _e('Automatically process RSS feeds', 'gellobit-rss'); ?>
                    </label>
                    <p class="description"><?php _e('Enable automatic processing of RSS feeds via WordPress cron', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="gellobit_rss_process_interval"><?php _e('Processing Interval', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <select id="gellobit_rss_process_interval" name="gellobit_rss_process_interval">
                        <option value="every_15_minutes" <?php selected($process_interval, 'every_15_minutes'); ?>><?php _e('Every 15 Minutes', 'gellobit-rss'); ?></option>
                        <option value="every_30_minutes" <?php selected($process_interval, 'every_30_minutes'); ?>><?php _e('Every 30 Minutes', 'gellobit-rss'); ?></option>
                        <option value="hourly" <?php selected($process_interval, 'hourly'); ?>><?php _e('Hourly', 'gellobit-rss'); ?></option>
                        <option value="twicedaily" <?php selected($process_interval, 'twicedaily'); ?>><?php _e('Twice Daily', 'gellobit-rss'); ?></option>
                        <option value="daily" <?php selected($process_interval, 'daily'); ?>><?php _e('Daily', 'gellobit-rss'); ?></option>
                    </select>
                    <p class="description"><?php _e('How often to check and process RSS feeds', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Auto Publish', 'gellobit-rss'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="gellobit_rss_auto_publish" value="1" <?php checked($auto_publish, 1); ?>>
                        <?php _e('Automatically publish processed posts', 'gellobit-rss'); ?>
                    </label>
                    <p class="description"><?php _e('If disabled, posts will be saved as drafts for manual review', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="gellobit_rss_quality_threshold"><?php _e('Quality Threshold', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="gellobit_rss_quality_threshold" name="gellobit_rss_quality_threshold" 
                           value="<?php echo esc_attr($quality_threshold); ?>" 
                           min="0" max="1" step="0.01" class="small-text">
                    <p class="description"><?php _e('Minimum AI confidence score to publish posts (0.0 - 1.0)', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="gellobit_rss_max_posts_per_run"><?php _e('Max Posts Per Run', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="gellobit_rss_max_posts_per_run" name="gellobit_rss_max_posts_per_run" 
                           value="<?php echo esc_attr($max_posts); ?>" 
                           min="1" max="100" class="small-text">
                    <p class="description"><?php _e('Maximum number of posts to process in a single run', 'gellobit-rss'); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Render AI settings
     */
    private function render_ai_settings() {
        $ai_transformer = Gellobit_RSS_AI_Transformer::get_instance();
        $ai_config = $ai_transformer->get_config();
        $providers = [
            'openai' => __('OpenAI', 'gellobit-rss'),
            'openrouter' => __('OpenRouter', 'gellobit-rss'),
            'deepseek' => __('DeepSeek', 'gellobit-rss'),
            'claude' => __('Claude (Anthropic)', 'gellobit-rss'),
            'gemini' => __('Gemini (Google)', 'gellobit-rss')
        ];
        $default_provider = $ai_config['default_provider'] ?? 'openai';
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Default AI Provider', 'gellobit-rss'); ?></th>
                <td>
                    <select name="ai_config[default_provider]" id="gellobit-default-provider">
                        <?php foreach ($providers as $slug => $label): ?>
                            <option value="<?php echo esc_attr($slug); ?>" <?php selected($default_provider, $slug); ?>>
                                <?php echo esc_html($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <p class="description"><?php _e('Feeds that use “Default” will call this provider.', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="ai_max_tokens"><?php _e('Max Tokens', 'gellobit-rss'); ?></label></th>
                <td>
                    <input type="number" id="ai_max_tokens" name="ai_config[max_tokens]" value="<?php echo esc_attr($ai_config['max_tokens']); ?>" min="100" max="4000" class="small-text">
                    <p class="description"><?php _e('Upper limit for responses (used unless a prompt overrides it).', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="ai_temperature"><?php _e('Temperature', 'gellobit-rss'); ?></label></th>
                <td>
                    <input type="number" id="ai_temperature" name="ai_config[temperature]" value="<?php echo esc_attr($ai_config['temperature']); ?>" min="0" max="1" step="0.1" class="small-text">
                    <p class="description"><?php _e('0 keeps responses factual, 1 allows more creativity.', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="ai_confidence_threshold"><?php _e('Confidence Threshold', 'gellobit-rss'); ?></label></th>
                <td>
                    <input type="number" id="ai_confidence_threshold" name="ai_config[confidence_threshold]" value="<?php echo esc_attr($ai_config['confidence_threshold']); ?>" min="0" max="1" step="0.01" class="small-text">
                    <p class="description"><?php _e('Used by legacy classifiers and fallbacks.', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php _e('AI Features', 'gellobit-rss'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="ai_config[enable_logging]" value="1" <?php checked($ai_config['enable_logging'], 1); ?>>
                        <?php _e('Enable request logging (recommended for debugging).', 'gellobit-rss'); ?>
                    </label><br>
                    <label>
                        <input type="checkbox" name="ai_config[enable_caching]" value="1" <?php checked($ai_config['enable_caching'], 1); ?>>
                        <?php _e('Cache identical prompts during the same run.', 'gellobit-rss'); ?>
                    </label>
                </td>
            </tr>
        </table>

        <hr>

        <div class="gellobit-ai-providers">
            <?php foreach ($providers as $slug => $label): 
                $settings = $ai_config['providers'][$slug] ?? [];
                $model_value = $settings['model'] ?? '';
                $key_value = $settings['api_key_display'] ?? ($settings['api_key'] ?? '');
                ?>
                <div class="gellobit-ai-provider-card">
                    <h3><?php echo esc_html($label); ?></h3>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><?php _e('API Key', 'gellobit-rss'); ?></th>
                            <td>
                                <input type="text" name="ai_config[providers][<?php echo esc_attr($slug); ?>][api_key]" class="regular-text gellobit-ai-key" data-provider="<?php echo esc_attr($slug); ?>" value="<?php echo esc_attr($key_value); ?>">
                                <?php if (!empty($key_value)): ?>
                                    <p class="description"><?php _e('This key is currently active. Edit to replace it.', 'gellobit-rss'); ?></p>
                                    <label><input type="checkbox" name="ai_config[providers][<?php echo esc_attr($slug); ?>][clear]" value="1"> <?php _e('Remove stored key', 'gellobit-rss'); ?></label>
                                <?php else: ?>
                                    <p class="description"><?php _e('Paste the API key provided by this vendor.', 'gellobit-rss'); ?></p>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><?php _e('Model Identifier', 'gellobit-rss'); ?></th>
                            <td>
                                <div class="gellobit-model-wrapper" data-provider="<?php echo esc_attr($slug); ?>">
                                    <input type="text" name="ai_config[providers][<?php echo esc_attr($slug); ?>][model]" value="<?php echo esc_attr($model_value); ?>" class="regular-text gellobit-model-input">
                                    <div class="gellobit-model-select"></div>
                                    <button type="button" class="button button-small gellobit-load-models" data-provider="<?php echo esc_attr($slug); ?>"><?php _e('Load available models', 'gellobit-rss'); ?></button>
                                    <p class="description gellobit-model-message"><?php _e('Exact model slug to request (see provider docs).', 'gellobit-rss'); ?></p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            <?php endforeach; ?>
        </div>

        <p>
            <button type="button" id="test-ai-btn" class="button button-secondary"><?php _e('Test default provider connection', 'gellobit-rss'); ?></button>
            <span id="test-ai-result"></span>
        </p>

        <script>
        jQuery(document).ready(function($) {
            $('#test-ai-btn').on('click', function() {
                var button = $(this);
                var result = $('#test-ai-result');
                button.prop('disabled', true).text('<?php echo esc_js(__('Testing…', 'gellobit-rss')); ?>');
                result.text('');
                $.post(ajaxurl, {
                    action: 'gellobit_test_ai',
                    nonce: gellobitRssAjax.nonce
                }).done(function(response) {
                    if (response.success) {
                        result.html('<span style="color: green;">✅ <?php echo esc_js(__('Connection successful', 'gellobit-rss')); ?></span>');
                    } else {
                        var message = response.message || '<?php echo esc_js(__('Unknown error', 'gellobit-rss')); ?>';
                        result.html('<span style="color: red;">❌ ' + message + '</span>');
                    }
                }).fail(function() {
                    result.html('<span style="color: red;">❌ <?php echo esc_js(__('Request failed', 'gellobit-rss')); ?></span>');
                }).always(function() {
                    button.prop('disabled', false).text('<?php echo esc_js(__('Test default provider connection', 'gellobit-rss')); ?>');
                });
            });

            $('.gellobit-load-models').on('click', function() {
                var card = $(this).closest('.gellobit-ai-provider-card');
                fetchModels(card, $(this));
            });

            $('.gellobit-ai-key').on('change blur', function() {
                var value = $(this).val();
                if (!value) {
                    return;
                }
                var card = $(this).closest('.gellobit-ai-provider-card');
                fetchModels(card, null, true);
            });

            function renderModelDropdown(wrapper, models) {
                var input = wrapper.find('.gellobit-model-input');
                var selectBox = $('<select class="gellobit-model-dropdown"></select>');
                selectBox.append($('<option value="">-- <?php echo esc_js(__('Choose a model', 'gellobit-rss')); ?> --</option>'));
                models.forEach(function(model) {
                    var option = $('<option></option>').val(model.value).text(model.label || model.value);
                    selectBox.append(option);
                });
                selectBox.val(input.val());
                selectBox.on('change', function() {
                    input.val($(this).val());
                });
                wrapper.find('.gellobit-model-select').empty().append(selectBox);
            }

            function fetchModels(card, button, autoTrigger) {
                var provider = card.find('.gellobit-model-wrapper').data('provider');
                var apiKey = card.find('.gellobit-ai-key').val();
                var wrapper = card.find('.gellobit-model-wrapper');
                var message = wrapper.find('.gellobit-model-message');
                var notice = autoTrigger
                    ? '<?php echo esc_js(__('Detected API key. Loading models…', 'gellobit-rss')); ?>'
                    : '<?php echo esc_js(__('Loading models…', 'gellobit-rss')); ?>';
                message.text(notice);
                if (button) {
                    button.prop('disabled', true);
                }

                $.post(ajaxurl, {
                    action: 'gellobit_fetch_ai_models',
                    nonce: gellobitRssAjax.nonce,
                    provider: provider,
                    api_key: apiKey
                }).done(function(response) {
                    if (response.success && response.data.models) {
                        renderModelDropdown(wrapper, response.data.models);
                        message.text('<?php echo esc_js(__('Model list updated. Select an option or keep your slug.', 'gellobit-rss')); ?>');
                    } else {
                        var err = response.data || '<?php echo esc_js(__('Unable to load models.', 'gellobit-rss')); ?>';
                        message.html('⚠️ ' + err);
                    }
                }).fail(function() {
                    message.html('⚠️ <?php echo esc_js(__('Request failed. Verify the API key.', 'gellobit-rss')); ?>');
                }).always(function() {
                    if (button) {
                        button.prop('disabled', false);
                    }
                });
            }

        });
        </script>
        <style>
            .gellobit-ai-providers {
                display: grid;
                gap: 20px;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                margin-top: 20px;
            }
            @media (min-width: 1200px) {
                .gellobit-ai-providers {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
            }
            .gellobit-ai-provider-card {
                border: 1px solid #dcdcdc;
                border-radius: 8px;
                padding: 18px;
                background: #fff;
                box-shadow: 0 3px 10px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                min-height: 240px;
            }
            .gellobit-ai-provider-card h3 {
                margin-top: 0;
                margin-bottom: 12px;
            }
            .gellobit-ai-provider-card .form-table {
                margin: 0;
            }
            .gellobit-model-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .gellobit-model-select select {
                width: 100%;
                margin-top: 4px;
            }
            .gellobit-model-dropdown {
                width: 100%;
            }
            .gellobit-load-models {
                align-self: flex-start;
            }
            .gellobit-model-message {
                margin: 0;
            }
        </style>
        <?php
    }
    
    /**
     * Render scraping settings
     */
    private function render_scraping_settings() {
        $scraper = Gellobit_RSS_Content_Scraper::get_instance();
        $scraper_config = $scraper->get_config();
        ?>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="scraper_timeout"><?php _e('Request Timeout', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="scraper_timeout" name="scraper_config[timeout]" 
                           value="<?php echo esc_attr($scraper_config['timeout']); ?>" 
                           min="10" max="120" class="small-text"> <?php _e('seconds', 'gellobit-rss'); ?>
                    <p class="description"><?php _e('Maximum time to wait for content scraping', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="scraper_max_redirects"><?php _e('Max Redirects', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="scraper_max_redirects" name="scraper_config[max_redirects]" 
                           value="<?php echo esc_attr($scraper_config['max_redirects']); ?>" 
                           min="1" max="10" class="small-text">
                    <p class="description"><?php _e('Maximum number of redirects to follow', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="scraper_min_content"><?php _e('Min Content Length', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="scraper_min_content" name="scraper_config[min_content_length]" 
                           value="<?php echo esc_attr($scraper_config['min_content_length']); ?>" 
                           min="10" max="1000" class="small-text"> <?php _e('characters', 'gellobit-rss'); ?>
                    <p class="description"><?php _e('Minimum content length to accept', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="scraper_max_content"><?php _e('Max Content Length', 'gellobit-rss'); ?></label>
                </th>
                <td>
                    <input type="number" id="scraper_max_content" name="scraper_config[max_content_length]" 
                           value="<?php echo esc_attr($scraper_config['max_content_length']); ?>" 
                           min="1000" max="100000" class="regular-text"> <?php _e('characters', 'gellobit-rss'); ?>
                    <p class="description"><?php _e('Maximum content length to process', 'gellobit-rss'); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Render advanced settings
     */
    private function render_advanced_settings() {
        $history_limit = get_option('gellobit_rss_history_limit', 500);
        ?>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Processing Log', 'gellobit-rss'); ?></th>
                <td>
                    <label>
                        <?php _e('Keep last', 'gellobit-rss'); ?>
                        <input type="number" name="ai_config[history_limit]" value="<?php echo esc_attr($history_limit); ?>" min="50" max="5000" class="small-text">
                        <?php _e('records', 'gellobit-rss'); ?>
                    </label>
                    <button type="button" id="truncate-history-btn" class="button" style="margin-left:10px;">
                        <?php _e('Clear Processing Log', 'gellobit-rss'); ?>
                    </button>
                    <p class="description"><?php _e('Controls the size of the processing history and lets you empty it manually.', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Export/Import', 'gellobit-rss'); ?></th>
                <td>
                    <button type="button" id="export-settings-btn" class="button"><?php _e('Export Settings', 'gellobit-rss'); ?></button>
                    <input type="file" id="import-settings-file" accept=".json" style="display: none;">
                    <button type="button" id="import-settings-btn" class="button"><?php _e('Import Settings', 'gellobit-rss'); ?></button>
                    <p class="description"><?php _e('Backup and restore plugin settings', 'gellobit-rss'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Debug Mode', 'gellobit-rss'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="gellobit_rss_debug_mode" value="1" 
                               <?php checked(get_option('gellobit_rss_debug_mode'), 1); ?>>
                        <?php _e('Enable debug mode', 'gellobit-rss'); ?>
                    </label>
                    <p class="description"><?php _e('Enable detailed logging and debug information', 'gellobit-rss'); ?></p>
                </td>
            </tr>
        </table>
        <script>
        jQuery(function($) {
            $('#truncate-history-btn').on('click', function(e) {
                e.preventDefault();
                if (!confirm('<?php echo esc_js(__('This will delete all processing log entries. Continue?', 'gellobit-rss')); ?>')) {
                    return;
                }
                var button = $(this);
                button.prop('disabled', true).text('<?php echo esc_js(__('Clearing…', 'gellobit-rss')); ?>');
                $.post(ajaxurl, {
                    action: 'gellobit_truncate_history',
                    nonce: gellobitRssAjax.nonce
                }).done(function(response) {
                    if (response.success) {
                        alert('<?php echo esc_js(__('Processing log cleared.', 'gellobit-rss')); ?>');
                        location.reload();
                    } else {
                        alert(response.data || '<?php echo esc_js(__('Failed to clear log.', 'gellobit-rss')); ?>');
                    }
                }).fail(function() {
                    alert('<?php echo esc_js(__('Request failed.', 'gellobit-rss')); ?>');
                }).always(function() {
                    button.prop('disabled', false).text('<?php echo esc_js(__('Clear Processing Log', 'gellobit-rss')); ?>');
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Handle settings form submission
     */
    private function handle_settings_form() {
        if (!isset($_POST['gellobit_rss_settings_nonce']) || 
            !wp_verify_nonce($_POST['gellobit_rss_settings_nonce'], 'gellobit_rss_settings')) {
            return;
        }
        
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Save general settings
        if (isset($_POST['gellobit_rss_auto_process'])) {
            update_option('gellobit_rss_auto_process', 1);
        } else {
            update_option('gellobit_rss_auto_process', 0);
        }
        
        $settings_map = [
            'gellobit_rss_process_interval' => 'sanitize_text_field',
            'gellobit_rss_auto_publish' => 'checkbox',
            'gellobit_rss_quality_threshold' => 'floatval',
            'gellobit_rss_max_posts_per_run' => 'intval',
            'gellobit_rss_debug_mode' => 'checkbox'
        ];
        
        foreach ($settings_map as $setting => $sanitizer) {
            if (isset($_POST[$setting])) {
                if ($sanitizer === 'checkbox') {
                    update_option($setting, 1);
                } else {
                    update_option($setting, call_user_func($sanitizer, $_POST[$setting]));
                }
            } elseif ($sanitizer === 'checkbox') {
                update_option($setting, 0);
            }
        }

        if (get_option('gellobit_rss_post_type') !== 'post') {
            update_option('gellobit_rss_post_type', 'post');
        }
        
        // Save AI config
        if (isset($_POST['ai_config'])) {
            $history_limit = $_POST['ai_config']['history_limit'] ?? null;
            if (isset($_POST['ai_config']['history_limit'])) {
                unset($_POST['ai_config']['history_limit']);
            }
            $ai_transformer = Gellobit_RSS_AI_Transformer::get_instance();
            $ai_transformer->update_config($_POST['ai_config']);
            if ($history_limit !== null) {
                update_option('gellobit_rss_history_limit', max(50, intval($history_limit)));
            }
        }
        
        // Save scraper config
        if (isset($_POST['scraper_config'])) {
            $scraper = Gellobit_RSS_Content_Scraper::get_instance();
            $scraper->update_config($_POST['scraper_config']);
        }
        
        echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'gellobit-rss') . '</p></div>';
    }

    public function ajax_fetch_ai_models() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }

        $provider = sanitize_text_field($_POST['provider'] ?? '');
        $api_key = sanitize_text_field($_POST['api_key'] ?? '');

        try {
            $ai_transformer = Gellobit_RSS_AI_Transformer::get_instance();
            $models = $ai_transformer->list_provider_models($provider, $api_key);
            wp_send_json_success(['models' => $models]);
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }

    public function ajax_truncate_history() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'gellobit_processing_history';
        $wpdb->query("TRUNCATE TABLE {$table}");
        wp_send_json_success();
    }
    
    /**
     * Sanitize AI config
     */
    public function sanitize_ai_config($config) {
        $sanitized = [];
        $allowed_providers = ['openai', 'openrouter', 'deepseek', 'claude', 'gemini'];

        if (!empty($config['default_provider']) && in_array($config['default_provider'], $allowed_providers, true)) {
            $sanitized['default_provider'] = $config['default_provider'];
        }

        if (isset($config['max_tokens'])) {
            $sanitized['max_tokens'] = max(100, intval($config['max_tokens']));
        }

        if (isset($config['temperature'])) {
            $sanitized['temperature'] = min(1, max(0, floatval($config['temperature'])));
        }

        if (isset($config['confidence_threshold'])) {
            $sanitized['confidence_threshold'] = min(1, max(0, floatval($config['confidence_threshold'])));
        }

        $sanitized['enable_logging'] = !empty($config['enable_logging']) ? 1 : 0;
        $sanitized['enable_caching'] = !empty($config['enable_caching']) ? 1 : 0;

        if (!empty($config['providers']) && is_array($config['providers'])) {
            $sanitized['providers'] = [];
            foreach ($config['providers'] as $slug => $settings) {
                $slug = sanitize_key($slug);
                if (!in_array($slug, $allowed_providers, true)) {
                    continue;
                }
                $entry = [];

                if (!empty($settings['model'])) {
                    $entry['model'] = sanitize_text_field($settings['model']);
                }

                if (!empty($settings['clear'])) {
                    $entry['api_key'] = '';
                    $entry['clear'] = 1;
                } elseif (isset($settings['api_key']) && $settings['api_key'] !== '') {
                    $entry['api_key'] = sanitize_text_field($settings['api_key']);
                }

                if (!empty($entry)) {
                    $sanitized['providers'][$slug] = $entry;
                }
            }
        }

        return $sanitized;
    }
    
    /**
     * Sanitize scraper config
     */
    public function sanitize_scraper_config($config) {
        $sanitized = [];

        if (isset($config['timeout'])) {
            $sanitized['timeout'] = intval($config['timeout']);
        }

        if (isset($config['max_redirects'])) {
            $sanitized['max_redirects'] = intval($config['max_redirects']);
        }

        return $sanitized;
    }

    /**
     * AJAX handler for exporting settings
     */
    public function ajax_export_settings() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        try {
            // Get all plugin settings
            $settings = [
                'general' => [
                    'auto_process' => get_option('gellobit_rss_auto_process'),
                    'process_interval' => get_option('gellobit_rss_process_interval'),
                    'auto_publish' => get_option('gellobit_rss_auto_publish'),
                    'post_type' => get_option('gellobit_rss_post_type'),
                    'quality_threshold' => get_option('gellobit_rss_quality_threshold'),
                    'max_posts_per_run' => get_option('gellobit_rss_max_posts_per_run')
                ],
                'ai' => get_option('gellobit_rss_ai_config', []),
                'scraping' => get_option('gellobit_rss_scraper_config', []),
                'version' => GELLOBIT_RSS_VERSION,
                'exported_at' => current_time('mysql')
            ];

            wp_send_json_success(['settings' => $settings]);

        } catch (Exception $e) {
            error_log('[Gellobit RSS Export Settings] Error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * AJAX handler for importing settings
     */
    public function ajax_import_settings() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        if (empty($_POST['settings'])) {
            wp_send_json_error(['message' => 'No settings data received']);
            return;
        }

        try {
            $settings = json_decode(stripslashes($_POST['settings']), true);

            if (!is_array($settings)) {
                wp_send_json_error(['message' => 'Invalid settings format']);
                return;
            }

            // Import general settings
            if (isset($settings['general'])) {
                foreach ($settings['general'] as $key => $value) {
                    update_option('gellobit_rss_' . $key, $value);
                }
            }

            // Import AI settings
            if (isset($settings['ai'])) {
                update_option('gellobit_rss_ai_config', $settings['ai']);
            }

            // Import scraping settings
            if (isset($settings['scraping'])) {
                update_option('gellobit_rss_scraper_config', $settings['scraping']);
            }

            wp_send_json_success([
                'message' => __('Settings imported successfully', 'gellobit-rss')
            ]);

        } catch (Exception $e) {
            error_log('[Gellobit RSS Import Settings] Error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * AJAX handler for saving custom prompt
     */
    public function ajax_save_prompt() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';
        $prompt = isset($_POST['prompt']) ? wp_unslash($_POST['prompt']) : '';

        if (empty($type)) {
            wp_send_json_error(['message' => __('Invalid opportunity type', 'gellobit-rss')]);
            return;
        }

        if (empty($prompt)) {
            wp_send_json_error(['message' => __('Prompt content cannot be empty', 'gellobit-rss')]);
            return;
        }

        try {
            $prompt_manager = Gellobit_RSS_Prompt_Manager::get_instance();
            $result = $prompt_manager->save_custom_prompt($type, $prompt);

            if ($result) {
                wp_send_json_success([
                    'message' => __('Prompt saved successfully', 'gellobit-rss')
                ]);
            } else {
                wp_send_json_error(['message' => __('Failed to save prompt', 'gellobit-rss')]);
            }

        } catch (Exception $e) {
            error_log('[Gellobit RSS Save Prompt] Error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * AJAX handler for resetting prompt to default
     */
    public function ajax_reset_prompt() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
            return;
        }

        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';

        if (empty($type)) {
            wp_send_json_error(['message' => __('Invalid opportunity type', 'gellobit-rss')]);
            return;
        }

        try {
            $prompt_manager = Gellobit_RSS_Prompt_Manager::get_instance();
            $prompt_manager->reset_prompt($type);

            // Obtener el prompt por defecto para devolverlo
            $default_prompt = $prompt_manager->get_default_prompt($type);

            wp_send_json_success([
                'message' => __('Prompt reset to default successfully', 'gellobit-rss'),
                'prompt' => $default_prompt
            ]);

        } catch (Exception $e) {
            error_log('[Gellobit RSS Reset Prompt] Error: ' . $e->getMessage());
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * Render prompts settings tab
     */
    private function render_prompts_settings() {
        $prompt_manager = Gellobit_RSS_Prompt_Manager::get_instance();
        $type_map = $prompt_manager->get_type_map();

        // Nombres descriptivos para cada tipo
        $type_labels = [
            'giveaway' => 'Giveaways',
            'sweepstakes' => 'Sweepstakes',
            'contest' => 'Contests',
            'dream_job' => 'Dream Jobs',
            'get_paid_to' => 'Get Paid To',
            'instant_win' => 'Instant Win',
            'job_fair' => 'Job Fairs',
            'scholarship' => 'Scholarships',
            'volunteer' => 'Volunteer Opportunities',
            'free_training' => 'Free Training',
            'promo' => 'Promos'
        ];
        ?>

        <h2><?php _e('AI Prompts Editor', 'gellobit-rss'); ?></h2>
        <p class="description">
            <?php _e('Customize the AI prompts used to process each opportunity type. Each prompt has three segments enclosed in [gpt]...[/gpt] tags: the first for excerpt/summary generation (max 20 words), the second for title generation, and the third for content generation.', 'gellobit-rss'); ?>
        </p>

        <div class="gellobit-prompts-info" style="background: #f0f0f1; padding: 15px; margin: 20px 0; border-left: 4px solid #2271b1;">
            <h3 style="margin-top: 0;"><?php _e('Prompt Structure', 'gellobit-rss'); ?></h3>
            <p><?php _e('Each prompt must contain exactly 3 segments in this order:', 'gellobit-rss'); ?></p>
            <ol style="margin-left: 20px;">
                <li><strong><?php _e('Excerpt Segment', 'gellobit-rss'); ?></strong> - <?php _e('Generates a compelling 20-word maximum summary (SEO-optimized for meta descriptions)', 'gellobit-rss'); ?></li>
                <li><strong><?php _e('Title Segment', 'gellobit-rss'); ?></strong> - <?php _e('Creates an SEO-friendly title for the post', 'gellobit-rss'); ?></li>
                <li><strong><?php _e('Content Segment', 'gellobit-rss'); ?></strong> - <?php _e('Produces the full HTML article content', 'gellobit-rss'); ?></li>
            </ol>

            <h3><?php _e('Available Variables', 'gellobit-rss'); ?></h3>
            <p><?php _e('You can use these variables in your prompts:', 'gellobit-rss'); ?></p>
            <ul style="list-style: disc; margin-left: 20px;">
                <li><code>[original_title]</code> - <?php _e('The original RSS item title', 'gellobit-rss'); ?></li>
                <li><code>[matched_content]</code> - <?php _e('The scraped content from the source URL', 'gellobit-rss'); ?></li>
                <li><code>[source_url]</code> - <?php _e('The source URL of the RSS item', 'gellobit-rss'); ?></li>
                <li><code>[feed_name]</code> - <?php _e('The name of the RSS feed', 'gellobit-rss'); ?></li>
                <li><code>[feed_url]</code> - <?php _e('The URL of the RSS feed', 'gellobit-rss'); ?></li>
            </ul>
        </div>

        <div class="gellobit-prompts-container">
            <?php foreach ($type_map as $type_key => $filename):
                $current_prompt = $prompt_manager->get_current_prompt($type_key);
                $is_customized = $prompt_manager->is_customized($type_key);
                $label = $type_labels[$type_key] ?? ucwords(str_replace('_', ' ', $type_key));
                ?>
                <div class="gellobit-prompt-editor" data-type="<?php echo esc_attr($type_key); ?>">
                    <h3>
                        <?php echo esc_html($label); ?>
                        <?php if ($is_customized): ?>
                            <span class="gellobit-prompt-badge gellobit-badge-customized"><?php _e('Customized', 'gellobit-rss'); ?></span>
                        <?php else: ?>
                            <span class="gellobit-prompt-badge gellobit-badge-default"><?php _e('Default', 'gellobit-rss'); ?></span>
                        <?php endif; ?>
                    </h3>

                    <textarea
                        class="gellobit-prompt-textarea"
                        name="prompts[<?php echo esc_attr($type_key); ?>]"
                        rows="15"
                        data-type="<?php echo esc_attr($type_key); ?>"
                    ><?php echo esc_textarea($current_prompt); ?></textarea>

                    <div class="gellobit-prompt-controls">
                        <span class="gellobit-prompt-char-count">
                            <?php
                            $char_count = strlen($current_prompt);
                            printf(__('Characters: %s', 'gellobit-rss'), '<strong>' . number_format($char_count) . '</strong>');
                            ?>
                        </span>
                        <div class="gellobit-prompt-buttons">
                            <button type="button" class="button gellobit-save-prompt-btn" data-type="<?php echo esc_attr($type_key); ?>">
                                <?php _e('Save Prompt', 'gellobit-rss'); ?>
                            </button>
                            <?php if ($is_customized): ?>
                                <button type="button" class="button gellobit-reset-prompt-btn" data-type="<?php echo esc_attr($type_key); ?>">
                                    <?php _e('Reset to Default', 'gellobit-rss'); ?>
                                </button>
                            <?php endif; ?>
                        </div>
                        <span class="gellobit-prompt-result"></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <style>
            .gellobit-prompts-container {
                margin-top: 30px;
            }
            .gellobit-prompt-editor {
                background: #fff;
                border: 1px solid #c3c4c7;
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 25px;
            }
            .gellobit-prompt-editor h3 {
                margin-top: 0;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .gellobit-prompt-badge {
                font-size: 11px;
                font-weight: normal;
                padding: 3px 8px;
                border-radius: 3px;
                text-transform: uppercase;
            }
            .gellobit-badge-customized {
                background: #2271b1;
                color: #fff;
            }
            .gellobit-badge-default {
                background: #dcdcde;
                color: #50575e;
            }
            .gellobit-prompt-textarea {
                width: 100%;
                font-family: 'Courier New', Courier, monospace;
                font-size: 13px;
                line-height: 1.5;
                padding: 12px;
                border: 1px solid #8c8f94;
                border-radius: 4px;
                resize: vertical;
                min-height: 300px;
            }
            .gellobit-prompt-textarea:focus {
                border-color: #2271b1;
                outline: none;
                box-shadow: 0 0 0 1px #2271b1;
            }
            .gellobit-prompt-controls {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 12px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .gellobit-prompt-char-count {
                color: #646970;
                font-size: 13px;
            }
            .gellobit-prompt-buttons {
                display: flex;
                gap: 8px;
            }
            .gellobit-prompt-result {
                flex-basis: 100%;
                font-size: 13px;
                margin-top: 5px;
            }
            .gellobit-prompt-result.success {
                color: #007017;
            }
            .gellobit-prompt-result.error {
                color: #d63638;
            }
        </style>

        <script>
        jQuery(document).ready(function($) {
            // Actualizar contador de caracteres en tiempo real
            $('.gellobit-prompt-textarea').on('input', function() {
                var $textarea = $(this);
                var $editor = $textarea.closest('.gellobit-prompt-editor');
                var charCount = $textarea.val().length;
                $editor.find('.gellobit-prompt-char-count strong').text(charCount.toLocaleString());
            });

            // Guardar prompt individual
            $('.gellobit-save-prompt-btn').on('click', function() {
                var $btn = $(this);
                var $editor = $btn.closest('.gellobit-prompt-editor');
                var type = $btn.data('type');
                var $textarea = $editor.find('.gellobit-prompt-textarea');
                var prompt = $textarea.val();
                var $result = $editor.find('.gellobit-prompt-result');

                $btn.prop('disabled', true).text('<?php echo esc_js(__('Saving...', 'gellobit-rss')); ?>');
                $result.removeClass('success error').text('');

                $.post(ajaxurl, {
                    action: 'gellobit_save_prompt',
                    nonce: gellobitRssAjax.nonce,
                    type: type,
                    prompt: prompt
                }).done(function(response) {
                    if (response.success) {
                        $result.addClass('success').text('✓ ' + response.data.message);

                        // Actualizar badge si cambió de default a customized
                        var $badge = $editor.find('.gellobit-prompt-badge');
                        if (!$badge.hasClass('gellobit-badge-customized')) {
                            $badge.removeClass('gellobit-badge-default')
                                  .addClass('gellobit-badge-customized')
                                  .text('<?php echo esc_js(__('Customized', 'gellobit-rss')); ?>');

                            // Agregar botón reset si no existe
                            if ($editor.find('.gellobit-reset-prompt-btn').length === 0) {
                                var $resetBtn = $('<button type="button" class="button gellobit-reset-prompt-btn"><?php echo esc_js(__('Reset to Default', 'gellobit-rss')); ?></button>');
                                $resetBtn.attr('data-type', type);
                                $editor.find('.gellobit-prompt-buttons').append($resetBtn);
                            }
                        }
                    } else {
                        $result.addClass('error').text('✗ ' + (response.data.message || '<?php echo esc_js(__('Error saving prompt', 'gellobit-rss')); ?>'));
                    }
                }).fail(function() {
                    $result.addClass('error').text('✗ <?php echo esc_js(__('Network error', 'gellobit-rss')); ?>');
                }).always(function() {
                    $btn.prop('disabled', false).text('<?php echo esc_js(__('Save Prompt', 'gellobit-rss')); ?>');
                });
            });

            // Resetear prompt a default (delegated event para botones agregados dinámicamente)
            $(document).on('click', '.gellobit-reset-prompt-btn', function() {
                var $btn = $(this);
                var $editor = $btn.closest('.gellobit-prompt-editor');
                var type = $btn.data('type');
                var $result = $editor.find('.gellobit-prompt-result');

                if (!confirm('<?php echo esc_js(__('Are you sure you want to reset this prompt to default?', 'gellobit-rss')); ?>')) {
                    return;
                }

                $btn.prop('disabled', true).text('<?php echo esc_js(__('Resetting...', 'gellobit-rss')); ?>');
                $result.removeClass('success error').text('');

                $.post(ajaxurl, {
                    action: 'gellobit_reset_prompt',
                    nonce: gellobitRssAjax.nonce,
                    type: type
                }).done(function(response) {
                    if (response.success) {
                        $result.addClass('success').text('✓ ' + response.data.message);

                        // Actualizar textarea con prompt por defecto
                        $editor.find('.gellobit-prompt-textarea').val(response.data.prompt).trigger('input');

                        // Actualizar badge
                        var $badge = $editor.find('.gellobit-prompt-badge');
                        $badge.removeClass('gellobit-badge-customized')
                              .addClass('gellobit-badge-default')
                              .text('<?php echo esc_js(__('Default', 'gellobit-rss')); ?>');

                        // Remover botón reset
                        $btn.remove();
                    } else {
                        $result.addClass('error').text('✗ ' + (response.data.message || '<?php echo esc_js(__('Error resetting prompt', 'gellobit-rss')); ?>'));
                        $btn.prop('disabled', false).text('<?php echo esc_js(__('Reset to Default', 'gellobit-rss')); ?>');
                    }
                }).fail(function() {
                    $result.addClass('error').text('✗ <?php echo esc_js(__('Network error', 'gellobit-rss')); ?>');
                    $btn.prop('disabled', false).text('<?php echo esc_js(__('Reset to Default', 'gellobit-rss')); ?>');
                });
            });
        });
        </script>

        <?php
    }
}
?>
