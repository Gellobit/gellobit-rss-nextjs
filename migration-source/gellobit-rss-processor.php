<?php
/**
 * Plugin Name: Gellobit RSS Processor
 * Plugin URI: https://gellobit.com
 * Description: Intelligent RSS processor with AI enrichment to extract and structure opportunity data
 * Version: 1.2.0
 * Author: Gellobit Team
 * License: GPL v2 or later
 * Text Domain: gellobit-rss
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GELLOBIT_RSS_VERSION', '1.2.0');
define('GELLOBIT_RSS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GELLOBIT_RSS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GELLOBIT_RSS_PLUGIN_FILE', __FILE__);

/**
 * Main plugin class
 */
class Gellobit_RSS_Processor_Plugin {
    
    /**
     * Plugin instance
     */
    private static $instance = null;
    
    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
        $this->init_components();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        register_activation_hook(__FILE__, [$this, 'activate_plugin']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate_plugin']);
        
        add_action('init', [$this, 'load_textdomain']);
        add_action('init', [$this, 'init_plugin']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        
        // AJAX hooks
        add_action('wp_ajax_gellobit_process_feed', [$this, 'ajax_process_feed']);
        add_action('wp_ajax_gellobit_test_ai', [$this, 'ajax_test_ai']);
        add_action('wp_ajax_gellobit_get_stats', [$this, 'ajax_get_stats']);
        
        // Cron hooks
        add_action('gellobit_process_feeds_cron', [$this, 'process_feeds_cron']);
        add_action('gellobit_process_single_feed', [$this, 'process_single_feed_cron']);
        add_action('gellobit_feed_saved', [$this, 'refresh_feed_schedule']);
        add_action('gellobit_feed_deleted', [$this, 'clear_feed_schedule']);
        
        // Custom cron schedules
        add_filter('cron_schedules', [$this, 'add_cron_schedules']);
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-database.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-ai-transformer.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-content-scraper.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-prompt-manager.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-rss-processor.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-analytics.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-admin.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-settings.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-dashboard.php';
        require_once GELLOBIT_RSS_PLUGIN_DIR . 'includes/class-prompt-manager.php';
    }
    
    /**
     * Initialize plugin components
     */
    private function init_components() {
        // Initialize database
        Gellobit_RSS_Database::get_instance();
        
        // Initialize settings
        Gellobit_RSS_Settings::get_instance();
        
        // Initialize admin interface
        if (is_admin()) {
            Gellobit_RSS_Admin::get_instance();
            Gellobit_RSS_Dashboard::get_instance();
        }
        
        // Initialize analytics
        Gellobit_RSS_Analytics::get_instance();
        
        // Initialize processor
        Gellobit_RSS_Processor::get_instance();
    }
    
    /**
     * Plugin activation
     */
    public function activate_plugin() {
        // Create database tables
        Gellobit_RSS_Database::get_instance()->create_tables();
        
        // Set default options
        $this->set_default_options();
        
        // Schedule cron events
        $this->schedule_cron_events();
        $this->sync_feed_schedules();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Set activation flag
        update_option('gellobit_rss_activated', true);
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate_plugin() {
        // Clear scheduled cron events
        wp_clear_scheduled_hook('gellobit_process_feeds_cron');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Set default plugin options
     */
    private function set_default_options() {
        $defaults = [
            'gellobit_rss_auto_process' => 1,
            'gellobit_rss_process_interval' => 'hourly',
            'gellobit_rss_auto_publish' => 1,
            'gellobit_rss_post_type' => 'post',
            'gellobit_rss_enable_ai' => 1,
            'gellobit_rss_enable_scraping' => 1,
            'gellobit_rss_quality_threshold' => 0.6,
            'gellobit_rss_max_posts_per_run' => 20
        ];

        foreach ($defaults as $option => $value) {
            // Use add_option which only adds if option doesn't exist (won't override user settings)
            add_option($option, $value);
        }
    }
    
    /**
     * Schedule cron events
     */
    private function schedule_cron_events() {
        if (!wp_next_scheduled('gellobit_process_feeds_cron')) {
            $interval = get_option('gellobit_rss_process_interval', 'hourly');
            wp_schedule_event(time(), $interval, 'gellobit_process_feeds_cron');
        }
    }
    
    /**
     * Add custom cron schedules
     * Note: Display strings are not translated here to avoid early translation loading warnings
     */
    public function add_cron_schedules($schedules) {
        $schedules['every_15_minutes'] = [
            'interval' => 900,
            'display' => 'Every 15 Minutes'
        ];

        $schedules['every_30_minutes'] = [
            'interval' => 1800,
            'display' => 'Every 30 Minutes'
        ];

        return $schedules;
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'gellobit-rss',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
    
    /**
     * Initialize plugin
     */
    public function init_plugin() {
        // Ensure default options exist (important for plugin updates)
        $this->ensure_default_options();

        // Plugin initialization logic
        do_action('gellobit_rss_init');
        $this->sync_feed_schedules();
    }

    /**
     * Ensure default options exist without overriding user settings
     */
    private function ensure_default_options() {
        // Add options only if they don't exist (won't override existing values)
        add_option('gellobit_rss_auto_publish', 1);
        add_option('gellobit_rss_auto_process', 1);
        add_option('gellobit_rss_quality_threshold', 0.6);
        add_option('gellobit_rss_max_posts_per_run', 20);
    }

    private function sync_feed_schedules() {
        $db = Gellobit_RSS_Database::get_instance();
        $feeds = $db->get_feeds('all');
        foreach ($feeds as $feed) {
            $this->ensure_feed_schedule($feed);
        }
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Gellobit RSS', 'gellobit-rss'),
            __('Gellobit RSS', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss',
            [$this, 'admin_dashboard_page'],
            'dashicons-rss',
            30
        );
        
        add_submenu_page(
            'gellobit-rss',
            __('Dashboard', 'gellobit-rss'),
            __('Dashboard', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss',
            [$this, 'admin_dashboard_page']
        );
        
        add_submenu_page(
            'gellobit-rss',
            __('RSS Feeds', 'gellobit-rss'),
            __('RSS Feeds', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss-feeds',
            [$this, 'admin_feeds_page']
        );
        
        add_submenu_page(
            'gellobit-rss',
            __('Analytics', 'gellobit-rss'),
            __('Analytics', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss-analytics',
            [$this, 'admin_analytics_page']
        );
        
        add_submenu_page(
            'gellobit-rss',
            __('Settings', 'gellobit-rss'),
            __('Settings', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss-settings',
            [$this, 'admin_settings_page']
        );

        add_submenu_page(
            'gellobit-rss',
            __('Processing Log', 'gellobit-rss'),
            __('Processing Log', 'gellobit-rss'),
            'manage_options',
            'gellobit-rss-history',
            [$this, 'admin_history_page']
        );
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'gellobit-rss') === false) {
            return;
        }

        // Enqueue WordPress media uploader
        wp_enqueue_media();

        wp_enqueue_script(
            'gellobit-rss-admin',
            GELLOBIT_RSS_PLUGIN_URL . 'assets/admin.js',
            ['jquery'],
            GELLOBIT_RSS_VERSION,
            true
        );

        wp_enqueue_style(
            'gellobit-rss-admin',
            GELLOBIT_RSS_PLUGIN_URL . 'assets/admin.css',
            [],
            GELLOBIT_RSS_VERSION
        );

        wp_localize_script('gellobit-rss-admin', 'gellobitRssAjax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('gellobit_rss_ajax'),
            'strings' => [
                'processing' => __('Processing...', 'gellobit-rss'),
                'success' => __('Success!', 'gellobit-rss'),
                'error' => __('Error occurred', 'gellobit-rss'),
                'confirm_delete' => __('Are you sure you want to delete this feed?', 'gellobit-rss')
            ]
        ]);
    }
    
    /**
     * Admin page callbacks
     */
    public function admin_dashboard_page() {
        Gellobit_RSS_Dashboard::get_instance()->render_dashboard_page();
    }
    
    public function admin_feeds_page() {
        Gellobit_RSS_Admin::get_instance()->render_feeds_page();
    }
    
    public function admin_analytics_page() {
        Gellobit_RSS_Analytics::get_instance()->render_analytics_page();
    }
    
    public function admin_settings_page() {
        Gellobit_RSS_Settings::get_instance()->render_settings_page();
    }

    public function admin_history_page() {
        Gellobit_RSS_Database::get_instance()->render_processing_history_page();
    }
    
    /**
     * AJAX handlers
     */
    public function ajax_process_feed() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $feed_id = intval($_POST['feed_id']);
        
        $processor = Gellobit_RSS_Processor::get_instance();
        $result = $processor->process_feed($feed_id);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    public function ajax_test_ai() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $ai = Gellobit_RSS_AI_Transformer::get_instance();
        $result = $ai->test_connection();
        
        wp_send_json($result);
    }
    
    public function ajax_get_stats() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $analytics = Gellobit_RSS_Analytics::get_instance();
        $stats = $analytics->get_dashboard_stats();
        
        wp_send_json_success($stats);
    }
    
    public function process_single_feed_cron($feed_id) {
        if (!get_option('gellobit_rss_auto_process', true)) {
            return;
        }
        $processor = Gellobit_RSS_Processor::get_instance();
        $processor->process_feed(intval($feed_id));
    }

    public function refresh_feed_schedule($feed_id) {
        $feed = Gellobit_RSS_Database::get_instance()->get_feed_by_id(intval($feed_id));
        if ($feed) {
            $this->ensure_feed_schedule($feed);
        }
    }

    public function clear_feed_schedule($feed_id) {
        $this->unschedule_feed_event(intval($feed_id));
    }

    private function ensure_feed_schedule($feed) {
        $feed_id = intval($feed['id']);
        $interval = $feed['feed_interval'] ?? '';
        $schedules = array_keys(wp_get_schedules());
        if (!empty($interval) && !in_array($interval, $schedules, true)) {
            $interval = '';
        }
        if (empty($interval)) {
            $this->unschedule_feed_event($feed_id);
            return;
        }
        $current = wp_get_schedule('gellobit_process_single_feed', [$feed_id]);
        if ($current === $interval) {
            return;
        }
        $this->unschedule_feed_event($feed_id);
        wp_schedule_event(time(), $interval, 'gellobit_process_single_feed', [$feed_id]);
    }

    private function unschedule_feed_event($feed_id) {
        $hook = 'gellobit_process_single_feed';
        $args = [$feed_id];
        $timestamp = wp_next_scheduled($hook, $args);
        while ($timestamp) {
            wp_unschedule_event($timestamp, $hook, $args);
            $timestamp = wp_next_scheduled($hook, $args);
        }
    }

    /**
     * Cron handler
     */
    public function process_feeds_cron() {
        if (!get_option('gellobit_rss_auto_process', true)) {
            return;
        }
        
        $processor = Gellobit_RSS_Processor::get_instance();
        $processor->process_all_feeds();
    }
    
    /**
     * Get plugin instance
     */
    public static function instance() {
        return self::get_instance();
    }
}

/**
 * Initialize the plugin
 */
function gellobit_rss_processor() {
    return Gellobit_RSS_Processor_Plugin::get_instance();
}

// Start the plugin
gellobit_rss_processor();

/**
 * Helper functions for theme/plugin integration
 */

/**
 * Get opportunity data processed by the plugin
 */
function gellobit_get_opportunity_data($post_id) {
    $data = [
        'type' => get_post_meta($post_id, '_gellobit_opportunity_type', true),
        'deadline' => get_post_meta($post_id, '_gellobit_deadline', true),
        'prize_value' => get_post_meta($post_id, '_gellobit_prize_value', true),
        'requirements' => get_post_meta($post_id, '_gellobit_requirements', true),
        'location' => get_post_meta($post_id, '_gellobit_location', true),
        'source_url' => get_post_meta($post_id, '_gellobit_source_url', true),
        'confidence' => get_post_meta($post_id, '_gellobit_confidence', true),
        'processed_at' => get_post_meta($post_id, '_gellobit_processed_at', true)
    ];
    
    return array_filter($data);
}

/**
 * Check if post was processed by Gellobit
 */
function gellobit_is_processed_opportunity($post_id) {
    return !empty(get_post_meta($post_id, '_gellobit_processed_at', true));
}

/**
 * Get processing statistics
 */
function gellobit_get_stats() {
    return Gellobit_RSS_Analytics::get_instance()->get_dashboard_stats();
}
?>
