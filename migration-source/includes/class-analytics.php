<?php
/**
 * Analytics class for RSS Processor Plugin
 * Extracted and simplified from theme
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Analytics {
    
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
        add_action('gellobit_rss_post_created', [$this, 'record_post_creation'], 10, 3);
        add_action('gellobit_rss_feed_processed', [$this, 'record_feed_processing'], 10, 2);
        add_action('gellobit_rss_daily_cleanup', [$this, 'generate_daily_stats']);
    }
    
    /**
     * Get dashboard statistics
     */
    public function get_dashboard_stats() {
        global $wpdb;
        
        $stats = [
            'feeds' => $this->get_feed_stats(),
            'posts' => $this->get_post_stats(),
            'processing' => $this->get_processing_stats(),
            'performance' => $this->get_performance_stats()
        ];
        
        return $stats;
    }
    
    /**
     * Get feed statistics
     */
    private function get_feed_stats() {
        $feeds = $this->database->get_feeds('all');
        
        $stats = [
            'total' => count($feeds),
            'active' => 0,
            'inactive' => 0,
            'error' => 0,
            'last_processed' => null
        ];
        
        $last_processed_time = 0;
        
        foreach ($feeds as $feed) {
            $stats[$feed['status']]++;
            
            if ($feed['last_processed']) {
                $processed_time = strtotime($feed['last_processed']);
                if ($processed_time > $last_processed_time) {
                    $last_processed_time = $processed_time;
                    $stats['last_processed'] = $feed['last_processed'];
                }
            }
        }
        
        return $stats;
    }
    
    /**
     * Get post statistics
     */
    private function get_post_stats() {
        global $wpdb;
        
        $post_type = get_option('gellobit_rss_post_type', 'opportunity');
        
        // Total posts created by plugin
        $total_posts = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p 
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
             WHERE p.post_type = %s AND pm.meta_key = '_gellobit_processed_at'",
            $post_type
        ));
        
        // Posts created today
        $today_posts = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p 
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
             WHERE p.post_type = %s AND pm.meta_key = '_gellobit_processed_at'
             AND DATE(p.post_date) = CURDATE()",
            $post_type
        ));
        
        // Posts created this week
        $week_posts = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p 
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
             WHERE p.post_type = %s AND pm.meta_key = '_gellobit_processed_at'
             AND p.post_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
            $post_type
        ));
        
        // Posts by status
        $status_stats = $wpdb->get_results($wpdb->prepare(
            "SELECT p.post_status, COUNT(*) as count FROM {$wpdb->posts} p 
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
             WHERE p.post_type = %s AND pm.meta_key = '_gellobit_processed_at'
             GROUP BY p.post_status",
            $post_type
        ), ARRAY_A);
        
        $by_status = [];
        foreach ($status_stats as $stat) {
            $by_status[$stat['post_status']] = intval($stat['count']);
        }
        
        return [
            'total' => intval($total_posts),
            'today' => intval($today_posts),
            'week' => intval($week_posts),
            'by_status' => $by_status
        ];
    }
    
    /**
     * Get processing statistics
     */
    private function get_processing_stats() {
        global $wpdb;
        
        $log_table = $wpdb->prefix . 'gellobit_processing_logs';
        
        // Recent logs
        $recent_logs = $wpdb->get_results(
            "SELECT level, COUNT(*) as count FROM {$log_table} 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
             GROUP BY level",
            ARRAY_A
        );
        
        $log_counts = [
            'info' => 0,
            'warning' => 0,
            'error' => 0,
            'debug' => 0
        ];
        
        foreach ($recent_logs as $log) {
            $log_counts[$log['level']] = intval($log['count']);
        }
        
        // Last processing time
        $last_processing = $wpdb->get_var(
            "SELECT MAX(created_at) FROM {$log_table} 
             WHERE message LIKE '%RSS processing%'"
        );
        
        return [
            'logs_24h' => $log_counts,
            'last_processing' => $last_processing,
            'total_logs' => array_sum($log_counts)
        ];
    }
    
    /**
     * Get performance statistics
     */
    private function get_performance_stats() {
        $analytics = $this->database->get_analytics(null, 7);
        
        $performance = [
            'avg_processing_time' => 0,
            'success_rate' => 0,
            'items_per_hour' => 0,
            'ai_accuracy' => 0
        ];
        
        // Calculate averages from analytics data
        $processing_times = [];
        $success_count = 0;
        $total_count = 0;
        
        foreach ($analytics as $metric) {
            switch ($metric['metric_type']) {
                case 'processing_time':
                    $processing_times[] = floatval($metric['metric_value']);
                    break;
                case 'success_rate':
                    $success_count += floatval($metric['metric_value']);
                    $total_count++;
                    break;
            }
        }
        
        if (!empty($processing_times)) {
            $performance['avg_processing_time'] = array_sum($processing_times) / count($processing_times);
        }
        
        if ($total_count > 0) {
            $performance['success_rate'] = ($success_count / $total_count) * 100;
        }
        
        return $performance;
    }
    
    /**
     * Record post creation
     */
    public function record_post_creation($post_id, $feed_id, $opportunity_type) {
        $date = current_time('Y-m-d');
        
        // Record general post creation
        $this->database->record_metric('posts_created', 1, $date, $feed_id);
        
        // Record by opportunity type
        if ($opportunity_type) {
            $this->database->record_metric('posts_by_type', 1, $date, $feed_id, 'opportunity', $opportunity_type);
        }
    }
    
    /**
     * Record feed processing
     */
    public function record_feed_processing($feed_id, $stats) {
        $date = current_time('Y-m-d');
        
        if (isset($stats['processing_time'])) {
            $this->database->record_metric('processing_time', $stats['processing_time'], $date, $feed_id);
        }
        
        if (isset($stats['success_rate'])) {
            $this->database->record_metric('success_rate', $stats['success_rate'], $date, $feed_id);
        }
        
        if (isset($stats['items_processed'])) {
            $this->database->record_metric('items_processed', $stats['items_processed'], $date, $feed_id);
        }
    }
    
    /**
     * Generate daily statistics
     */
    public function generate_daily_stats() {
        $date = current_time('Y-m-d');
        
        // Generate summary metrics
        $this->generate_summary_metrics($date);
        
        // Clean old analytics data
        $this->cleanup_old_analytics();
    }
    
    /**
     * Generate summary metrics
     */
    private function generate_summary_metrics($date) {
        global $wpdb;
        
        $post_type = get_option('gellobit_rss_post_type', 'opportunity');
        
        // Daily post count
        $daily_posts = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p 
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
             WHERE p.post_type = %s AND pm.meta_key = '_gellobit_processed_at'
             AND DATE(p.post_date) = %s",
            $post_type, $date
        ));
        
        $this->database->record_metric('daily_posts', $daily_posts, $date);
        
        // AI confidence average
        $avg_confidence = $wpdb->get_var($wpdb->prepare(
            "SELECT AVG(CAST(pm.meta_value AS DECIMAL(3,2))) 
             FROM {$wpdb->postmeta} pm 
             INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
             WHERE pm.meta_key = '_gellobit_confidence' 
             AND p.post_type = %s 
             AND DATE(p.post_date) = %s",
            $post_type, $date
        ));
        
        if ($avg_confidence) {
            $this->database->record_metric('avg_ai_confidence', $avg_confidence, $date);
        }
    }
    
    /**
     * Clean up old analytics data
     */
    private function cleanup_old_analytics() {
        $this->database->cleanup_old_data(90);
    }
    
    /**
     * Render analytics page
     */
    public function render_analytics_page() {
        $stats = $this->get_dashboard_stats();
        ?>
        <div class="wrap">
            <h1><?php _e('Analytics', 'gellobit-rss'); ?></h1>
            
            <div class="gellobit-analytics-dashboard">
                
                <!-- Feed Statistics -->
                <div class="analytics-section">
                    <h2><?php _e('Feed Statistics', 'gellobit-rss'); ?></h2>
                    <div class="analytics-cards">
                        <div class="analytics-card">
                            <h3><?php echo $stats['feeds']['total']; ?></h3>
                            <p><?php _e('Total Feeds', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo $stats['feeds']['active']; ?></h3>
                            <p><?php _e('Active Feeds', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo $stats['feeds']['error']; ?></h3>
                            <p><?php _e('Feeds with Errors', 'gellobit-rss'); ?></p>
                        </div>
                    </div>
                </div>
                
                <!-- Post Statistics -->
                <div class="analytics-section">
                    <h2><?php _e('Post Statistics', 'gellobit-rss'); ?></h2>
                    <div class="analytics-cards">
                        <div class="analytics-card">
                            <h3><?php echo $stats['posts']['total']; ?></h3>
                            <p><?php _e('Total Posts Created', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo $stats['posts']['today']; ?></h3>
                            <p><?php _e('Posts Today', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo $stats['posts']['week']; ?></h3>
                            <p><?php _e('Posts This Week', 'gellobit-rss'); ?></p>
                        </div>
                    </div>
                </div>
                
                <!-- Processing Statistics -->
                <div class="analytics-section">
                    <h2><?php _e('Processing Statistics', 'gellobit-rss'); ?></h2>
                    <div class="analytics-cards">
                        <div class="analytics-card">
                            <h3><?php echo $stats['processing']['logs_24h']['error']; ?></h3>
                            <p><?php _e('Errors (24h)', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo number_format($stats['performance']['success_rate'], 1); ?>%</h3>
                            <p><?php _e('Success Rate', 'gellobit-rss'); ?></p>
                        </div>
                        <div class="analytics-card">
                            <h3><?php echo $stats['processing']['last_processing'] ? date('H:i', strtotime($stats['processing']['last_processing'])) : 'Never'; ?></h3>
                            <p><?php _e('Last Processing', 'gellobit-rss'); ?></p>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <style>
            .gellobit-analytics-dashboard {
                max-width: 1200px;
            }
            
            .analytics-section {
                margin-bottom: 30px;
            }
            
            .analytics-cards {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .analytics-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 20px;
                text-align: center;
                flex: 1;
                min-width: 150px;
            }
            
            .analytics-card h3 {
                font-size: 2rem;
                margin: 0 0 10px 0;
                color: #0157E9;
            }
            
            .analytics-card p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }
            </style>
        </div>
        <?php
    }
}
?>