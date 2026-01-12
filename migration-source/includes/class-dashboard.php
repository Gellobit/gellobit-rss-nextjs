<?php
/**
 * Dashboard class for RSS Processor Plugin
 * Provides main dashboard interface
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Dashboard {
    
    private static $instance = null;
    private $analytics;
    private $processor;
    private $database;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->analytics = Gellobit_RSS_Analytics::get_instance();
        $this->processor = Gellobit_RSS_Processor::get_instance();
        $this->database = Gellobit_RSS_Database::get_instance();
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('wp_ajax_gellobit_process_all_feeds', [$this, 'ajax_process_all_feeds']);
        add_action('wp_ajax_gellobit_get_dashboard_data', [$this, 'ajax_get_dashboard_data']);
        add_action('wp_ajax_gellobit_test_ai', [$this, 'ajax_test_ai']);
    }
    
    /**
     * Render main dashboard page
     */
    public function render_dashboard_page() {
        $stats = $this->analytics->get_dashboard_stats();
        $recent_logs = $this->get_recent_logs();
        $feeds = $this->database->get_feeds('all');
        ?>
        <div class="wrap">
            <h1><?php _e('Gellobit RSS Processor Dashboard', 'gellobit-rss'); ?></h1>
            
            <div class="gellobit-dashboard">
                
                <!-- System Status Cards -->
                <div class="dashboard-section">
                    <div class="dashboard-cards">
                        <div class="dashboard-card system-status">
                            <h3><?php _e('System Status', 'gellobit-rss'); ?></h3>
                            <div class="status-indicator <?php echo $this->get_system_status_class($stats); ?>">
                                <span class="status-dot"></span>
                                <?php echo $this->get_system_status_text($stats); ?>
                            </div>
                            <div class="status-details">
                                <p><strong><?php _e('Last Processing:', 'gellobit-rss'); ?></strong> 
                                <?php echo $stats['feeds']['last_processed'] ? 
                                    date('M j, Y H:i', strtotime($stats['feeds']['last_processed'])) : 
                                    __('Never', 'gellobit-rss'); ?>
                                </p>
                                <p><strong><?php _e('Active Feeds:', 'gellobit-rss'); ?></strong> 
                                <?php echo $stats['feeds']['active']; ?>/<?php echo $stats['feeds']['total']; ?>
                                </p>
                            </div>
                        </div>
                        
                        <div class="dashboard-card">
                            <h3><?php _e('Today\'s Activity', 'gellobit-rss'); ?></h3>
                            <div class="big-number">
                                <?php echo $stats['posts']['today']; ?>
                            </div>
                            <p><?php _e('Posts Created Today', 'gellobit-rss'); ?></p>
                        </div>
                        
                        <div class="dashboard-card">
                            <h3><?php _e('This Week', 'gellobit-rss'); ?></h3>
                            <div class="big-number">
                                <?php echo $stats['posts']['week']; ?>
                            </div>
                            <p><?php _e('Posts Created This Week', 'gellobit-rss'); ?></p>
                        </div>
                        
                        <div class="dashboard-card">
                            <h3><?php _e('Total Posts', 'gellobit-rss'); ?></h3>
                            <div class="big-number">
                                <?php echo $stats['posts']['total']; ?>
                            </div>
                            <p><?php _e('All Time', 'gellobit-rss'); ?></p>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="dashboard-section">
                    <h2><?php _e('Quick Actions', 'gellobit-rss'); ?></h2>
                    <div class="quick-actions">
                        <button id="process-all-feeds-btn" class="button button-primary button-large">
                            <?php _e('Process All Feeds Now', 'gellobit-rss'); ?>
                        </button>
                        <button id="refresh-dashboard-btn" class="button button-large">
                            <?php _e('Refresh Dashboard', 'gellobit-rss'); ?>
                        </button>
                        <a href="<?php echo admin_url('admin.php?page=gellobit-rss-feeds'); ?>" class="button button-large">
                            <?php _e('Manage Feeds', 'gellobit-rss'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=gellobit-rss-settings'); ?>" class="button button-large">
                            <?php _e('Settings', 'gellobit-rss'); ?>
                        </a>
                    </div>
                </div>
                
                <!-- Feed Status -->
                <div class="dashboard-section">
                    <h2><?php _e('Feed Status', 'gellobit-rss'); ?></h2>
                    <div class="feed-status-grid">
                        <?php if (empty($feeds)): ?>
                            <div class="no-feeds-message">
                                <p><?php _e('No RSS feeds configured yet.', 'gellobit-rss'); ?></p>
                                <a href="<?php echo admin_url('admin.php?page=gellobit-rss-feeds'); ?>" class="button button-primary">
                                    <?php _e('Add Your First Feed', 'gellobit-rss'); ?>
                                </a>
                            </div>
                        <?php else: ?>
                            <?php foreach (array_slice($feeds, 0, 6) as $feed): ?>
                                <div class="feed-status-card">
                                    <h4><?php echo esc_html($feed['name']); ?></h4>
                                    <div class="feed-status-indicator status-<?php echo $feed['status']; ?>">
                                        <?php echo ucfirst($feed['status']); ?>
                                    </div>
                                    <div class="feed-meta">
                                        <p><strong><?php _e('Type:', 'gellobit-rss'); ?></strong> 
                                        <?php echo esc_html($feed['default_opportunity_type']); ?></p>
                                        <p><strong><?php _e('Last:', 'gellobit-rss'); ?></strong> 
                                        <?php echo $feed['last_processed'] ? 
                                            date('M j, H:i', strtotime($feed['last_processed'])) : 
                                            __('Never', 'gellobit-rss'); ?>
                                        </p>
                                    </div>
                                    <?php if (!empty($feed['last_error'])): ?>
                                        <div class="feed-error">
                                            <small><?php echo esc_html(wp_trim_words($feed['last_error'], 8)); ?></small>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                            <?php if (count($feeds) > 6): ?>
                                <div class="view-all-feeds">
                                    <a href="<?php echo admin_url('admin.php?page=gellobit-rss-feeds'); ?>" class="button">
                                        <?php _e('View All Feeds', 'gellobit-rss'); ?> (<?php echo count($feeds); ?>)
                                    </a>
                                </div>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="dashboard-section">
                    <h2><?php _e('Recent Activity', 'gellobit-rss'); ?></h2>
                    <div class="recent-activity">
                        <?php if (empty($recent_logs)): ?>
                            <p><?php _e('No recent activity.', 'gellobit-rss'); ?></p>
                        <?php else: ?>
                            <div class="activity-list">
                                <?php foreach ($recent_logs as $log): ?>
                                    <div class="activity-item level-<?php echo $log['level']; ?>">
                                        <div class="activity-icon">
                                            <?php echo $this->get_log_icon($log['level']); ?>
                                        </div>
                                        <div class="activity-content">
                                            <p><?php echo esc_html($log['message']); ?></p>
                                            <small><?php echo date('M j, H:i', strtotime($log['created_at'])); ?></small>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <div class="view-all-logs">
                                <a href="<?php echo admin_url('admin.php?page=gellobit-rss-analytics'); ?>" class="button">
                                    <?php _e('View All Activity', 'gellobit-rss'); ?>
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <style>
            .gellobit-dashboard {
                max-width: 1200px;
            }
            
            .dashboard-section {
                margin-bottom: 30px;
            }
            
            .dashboard-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .dashboard-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .dashboard-card h3 {
                margin-top: 0;
                color: #333;
                font-size: 16px;
            }
            
            .big-number {
                font-size: 2.5rem;
                font-weight: bold;
                color: #0157E9;
                margin: 10px 0;
            }
            
            .system-status {
                text-align: left;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-healthy .status-dot { background-color: #28a745; }
            .status-warning .status-dot { background-color: #ffc107; }
            .status-error .status-dot { background-color: #dc3545; }
            
            .status-details p {
                margin: 5px 0;
                font-size: 14px;
            }
            
            .quick-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .feed-status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .feed-status-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                font-size: 14px;
            }
            
            .feed-status-card h4 {
                margin: 0 0 10px 0;
                font-size: 16px;
            }
            
            .feed-status-indicator {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
            }
            
            .feed-status-indicator.status-active {
                background-color: #d4edda;
                color: #155724;
            }
            
            .feed-status-indicator.status-inactive {
                background-color: #fff3cd;
                color: #856404;
            }
            
            .feed-status-indicator.status-error {
                background-color: #f8d7da;
                color: #721c24;
            }
            
            .feed-meta p {
                margin: 3px 0;
                font-size: 13px;
            }
            
            .feed-error {
                margin-top: 8px;
                padding: 5px;
                background-color: #f8d7da;
                border-radius: 3px;
                font-size: 12px;
                color: #721c24;
            }
            
            .no-feeds-message {
                text-align: center;
                padding: 40px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            
            .activity-list {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .activity-item {
                display: flex;
                align-items: flex-start;
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            
            .activity-item:last-child {
                border-bottom: none;
            }
            
            .activity-icon {
                margin-right: 10px;
                font-size: 16px;
            }
            
            .activity-content {
                flex: 1;
            }
            
            .activity-content p {
                margin: 0 0 4px 0;
                font-size: 14px;
            }
            
            .activity-content small {
                color: #666;
                font-size: 12px;
            }
            
            .level-info .activity-icon { color: #0157E9; }
            .level-warning .activity-icon { color: #ffc107; }
            .level-error .activity-icon { color: #dc3545; }
            
            .view-all-logs, .view-all-feeds {
                margin-top: 10px;
                text-align: center;
            }
            
            #process-result {
                margin-top: 10px;
                padding: 10px;
                border-radius: 5px;
                display: none;
            }
            
            #process-result.success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            #process-result.error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            </style>
            
            <script>
            jQuery(document).ready(function($) {
                // Process all feeds
                $('#process-all-feeds-btn').click(function() {
                    var button = $(this);
                    var result = $('#process-result');
                    
                    button.prop('disabled', true).text('Processing...');
                    result.hide();
                    
                    $.post(ajaxurl, {
                        action: 'gellobit_process_all_feeds',
                        nonce: gellobitRssAjax.nonce
                    }, function(response) {
                        if (response.success) {
                            result.removeClass('error').addClass('success')
                                .html('<strong>Success!</strong> Processed ' + response.data.processed_feeds + ' feeds, created ' + response.data.created_posts + ' posts.')
                                .show();
                            
                            // Refresh dashboard data
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        } else {
                            result.removeClass('success').addClass('error')
                                .html('<strong>Error:</strong> ' + response.data.message)
                                .show();
                        }
                    }).fail(function() {
                        result.removeClass('success').addClass('error')
                            .html('<strong>Error:</strong> Request failed')
                            .show();
                    }).always(function() {
                        button.prop('disabled', false).text('Process All Feeds Now');
                    });
                });
                
                // Refresh dashboard
                $('#refresh-dashboard-btn').click(function() {
                    location.reload();
                });
                
                // Auto-refresh dashboard data every 30 seconds
                setInterval(function() {
                    $.post(ajaxurl, {
                        action: 'gellobit_get_dashboard_data',
                        nonce: gellobitRssAjax.nonce
                    }, function(response) {
                        if (response.success) {
                            // Update counters without full page reload
                            $('.big-number').each(function(index) {
                                var newValue = response.data.counters[index];
                                if (newValue !== undefined) {
                                    $(this).text(newValue);
                                }
                            });
                        }
                    });
                }, 30000);
            });
            </script>
            
            <div id="process-result"></div>
        </div>
        <?php
    }
    
    /**
     * Get recent processing logs
     */
    private function get_recent_logs($limit = 10) {
        global $wpdb;
        
        $log_table = $wpdb->prefix . 'gellobit_processing_logs';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$log_table} 
             ORDER BY created_at DESC 
             LIMIT %d",
            $limit
        ), ARRAY_A);
    }
    
    /**
     * Get system status class
     */
    private function get_system_status_class($stats) {
        if ($stats['feeds']['error'] > 0) {
            return 'status-error';
        } elseif ($stats['feeds']['inactive'] > 0) {
            return 'status-warning';
        } else {
            return 'status-healthy';
        }
    }
    
    /**
     * Get system status text
     */
    private function get_system_status_text($stats) {
        if ($stats['feeds']['error'] > 0) {
            return __('Issues Detected', 'gellobit-rss');
        } elseif ($stats['feeds']['inactive'] > 0) {
            return __('Some Feeds Inactive', 'gellobit-rss');
        } else {
            return __('All Systems Operational', 'gellobit-rss');
        }
    }
    
    /**
     * Get log icon
     */
    private function get_log_icon($level) {
        switch ($level) {
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📝';
        }
    }
    
    /**
     * AJAX handlers
     */
    public function ajax_process_all_feeds() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        try {
            $result = $this->processor->process_all_feeds();
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    public function ajax_get_dashboard_data() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $stats = $this->analytics->get_dashboard_stats();
        
        wp_send_json_success([
            'counters' => [
                $stats['posts']['today'],
                $stats['posts']['week'],
                $stats['posts']['total']
            ],
            'timestamp' => current_time('timestamp')
        ]);
    }
    
    public function ajax_test_ai() {
        check_ajax_referer('gellobit_rss_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'gellobit-rss'));
        }
        
        $ai_transformer = Gellobit_RSS_AI_Transformer::get_instance();
        
        try {
            $test_result = $ai_transformer->test_connection();
            if ($test_result['success']) {
                wp_send_json_success(['message' => 'AI connection successful']);
            } else {
                wp_send_json_error($test_result['message']);
            }
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }
}
?>