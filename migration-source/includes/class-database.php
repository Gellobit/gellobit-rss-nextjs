<?php
/**
 * Database management class
 * Extracted and simplified from theme
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Database {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->ensure_schema_updates();
    }

    /**
     * Ensure new columns exist when updating plugin
     */
    private function ensure_schema_updates() {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'default_category',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD default_category bigint(20) UNSIGNED NULL AFTER default_post_type"
        );
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'ai_provider',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD ai_provider varchar(50) DEFAULT 'default' AFTER default_category"
        );
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'allow_republish',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD allow_republish tinyint(1) DEFAULT 0 AFTER ai_provider"
        );
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'feed_interval',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD feed_interval varchar(50) DEFAULT '' AFTER allow_republish"
        );
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'fallback_featured_image',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD fallback_featured_image text NULL AFTER feed_interval"
        );
    }
    
    /**
     * Create all required database tables
     */
    public function create_tables() {
        global $wpdb;
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // RSS Feeds table
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            url text NOT NULL,
            status enum('active','inactive','error') DEFAULT 'active',
            feed_type varchar(50) DEFAULT 'rss',
            default_post_type varchar(50) DEFAULT 'post',
            default_category bigint(20) UNSIGNED NULL,
            ai_provider varchar(50) DEFAULT 'default',
            allow_republish tinyint(1) DEFAULT 0,
            feed_interval varchar(50) DEFAULT '',
            fallback_featured_image text NULL,
            default_opportunity_type varchar(50) DEFAULT 'giveaway',
            enable_scraping tinyint(1) DEFAULT 1,
            enable_ai_processing tinyint(1) DEFAULT 1,
            auto_publish tinyint(1) DEFAULT 1,
            keywords text,
            exclude_keywords text,
            quality_threshold decimal(3,2) DEFAULT 0.60,
            priority int(11) DEFAULT 5,
            last_processed datetime NULL,
            last_error text,
            error_count int(11) DEFAULT 0,
            total_processed int(11) DEFAULT 0,
            total_published int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY last_processed (last_processed)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Processing logs table
        $table_name = $wpdb->prefix . 'gellobit_processing_logs';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            level enum('info','warning','error','debug') DEFAULT 'info',
            message text NOT NULL,
            context text,
            feed_id mediumint(9) NULL,
            post_id mediumint(9) NULL,
            execution_time decimal(10,4) NULL,
            memory_usage int(11) NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY level (level),
            KEY feed_id (feed_id),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Analytics table
        $table_name = $wpdb->prefix . 'gellobit_analytics';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            date date NOT NULL,
            metric_type varchar(50) NOT NULL,
            metric_value decimal(15,4) NOT NULL,
            feed_id mediumint(9) NULL,
            post_type varchar(50) NULL,
            opportunity_type varchar(50) NULL,
            metadata text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_metric (date, metric_type, feed_id, post_type, opportunity_type),
            KEY date (date),
            KEY metric_type (metric_type)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Duplicate tracking table
        $table_name = $wpdb->prefix . 'gellobit_duplicate_tracking';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            content_hash varchar(64) NOT NULL,
            title_hash varchar(64) NOT NULL,
            url_hash varchar(64) NOT NULL,
            post_id mediumint(9) NOT NULL,
            feed_id mediumint(9) NOT NULL,
            similarity_score decimal(3,2) DEFAULT 0.00,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY content_hash (content_hash),
            KEY title_hash (title_hash),
            KEY url_hash (url_hash),
            KEY post_id (post_id),
            KEY feed_id (feed_id)
        ) $charset_collate;";
        dbDelta($sql);
        
        // AI processing queue table
        $table_name = $wpdb->prefix . 'gellobit_ai_queue';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            post_id mediumint(9) NOT NULL,
            content_hash varchar(64) NOT NULL,
            status enum('pending','processing','completed','failed') DEFAULT 'pending',
            priority int(11) DEFAULT 5,
            attempts int(11) DEFAULT 0,
            max_attempts int(11) DEFAULT 3,
            input_data longtext,
            output_data longtext,
            error_message text,
            processing_time decimal(10,4) NULL,
            scheduled_for datetime NULL,
            started_at datetime NULL,
            completed_at datetime NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY post_content (post_id, content_hash),
            KEY status (status),
            KEY priority (priority),
            KEY scheduled_for (scheduled_for)
        ) $charset_collate;";
        dbDelta($sql);

        // Processing history table
        $table_name = $wpdb->prefix . 'gellobit_processing_history';
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            feed_id mediumint(9) NOT NULL,
            feed_name varchar(255) DEFAULT '',
            category_id bigint(20) UNSIGNED NULL,
            category_name varchar(255) DEFAULT '',
            ai_provider varchar(50) DEFAULT 'default',
            item_title text,
            item_url text,
            status enum('published','rejected') NOT NULL,
            reason text,
            post_id bigint(20) NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY feed_id (feed_id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Ensure new columns exist when updating from previous versions
        maybe_add_column(
            $wpdb->prefix . 'gellobit_rss_feeds',
            'default_category',
            "ALTER TABLE {$wpdb->prefix}gellobit_rss_feeds ADD default_category bigint(20) UNSIGNED NULL AFTER default_post_type"
        );

        // Update version
        update_option('gellobit_rss_db_version', '1.1.0');
        
        return true;
    }
    
    /**
     * Check if tables exist and are up to date
     */
    public function check_tables() {
        global $wpdb;
        
        $tables = [
            $wpdb->prefix . 'gellobit_rss_feeds',
            $wpdb->prefix . 'gellobit_processing_logs', 
            $wpdb->prefix . 'gellobit_analytics',
            $wpdb->prefix . 'gellobit_duplicate_tracking',
            $wpdb->prefix . 'gellobit_ai_queue'
        ];
        
        $missing_tables = [];
        
        foreach ($tables as $table) {
            if ($wpdb->get_var("SHOW TABLES LIKE '{$table}'") !== $table) {
                $missing_tables[] = $table;
            }
        }
        
        return empty($missing_tables) ? true : $missing_tables;
    }
    
    /**
     * Get RSS feeds
     */
    public function get_feeds($status = 'active') {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        
        if ($status === 'all') {
            $sql = "SELECT * FROM {$table_name} ORDER BY priority DESC, name ASC";
            return $wpdb->get_results($sql, ARRAY_A);
        } else {
            $sql = $wpdb->prepare(
                "SELECT * FROM {$table_name} WHERE status = %s ORDER BY priority DESC, name ASC",
                $status
            );
            return $wpdb->get_results($sql, ARRAY_A);
        }
    }

    public function get_feed_by_id($feed_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", intval($feed_id)),
            ARRAY_A
        );
    }
    
    /**
     * Add or update RSS feed
     */
    public function save_feed($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        
        $defaults = [
            'status' => 'active',
            'feed_type' => 'rss',
            'default_post_type' => 'post',
            'default_opportunity_type' => 'giveaway',
            'enable_scraping' => 1,
            'enable_ai_processing' => 1,
            'auto_publish' => 1,
            'quality_threshold' => 0.60,
            'priority' => 5,
            'default_category' => null,
            'ai_provider' => 'default',
            'allow_republish' => 0,
            'feed_interval' => ''
        ];

        $data = wp_parse_args($data, $defaults);
        $data['default_category'] = isset($data['default_category']) && $data['default_category'] !== ''
            ? intval($data['default_category'])
            : null;
        $data['ai_provider'] = sanitize_text_field($data['ai_provider']);
        
        if (isset($data['id']) && $data['id']) {
            // Update existing feed
            $feed_id = intval($data['id']);
            unset($data['id']);
            $data['updated_at'] = current_time('mysql');
            
            $result = $wpdb->update(
                $table_name,
                $data,
                ['id' => $feed_id],
                null,
                ['%d']
            );
            
            return $result !== false ? $feed_id : false;
        } else {
            // Insert new feed
            unset($data['id']);
            $data['created_at'] = current_time('mysql');
            $data['updated_at'] = current_time('mysql');
            
            $result = $wpdb->insert($table_name, $data);
            
            return $result ? $wpdb->insert_id : false;
        }
    }
    
    /**
     * Delete RSS feed
     */
    public function delete_feed($feed_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_rss_feeds';
        
        return $wpdb->delete(
            $table_name,
            ['id' => intval($feed_id)],
            ['%d']
        );
    }
    
    /**
     * Log processing event
     */
    public function log($level, $message, $context = [], $feed_id = null, $post_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_processing_logs';
        
        $data = [
            'level' => $level,
            'message' => $message,
            'context' => !empty($context) ? json_encode($context) : null,
            'feed_id' => $feed_id,
            'post_id' => $post_id,
            'created_at' => current_time('mysql')
        ];
        
        return $wpdb->insert($table_name, $data);
    }
    
    /**
     * Get processing logs
     */
    public function get_logs($limit = 100, $level = null, $feed_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_processing_logs';
        
        $where = [];
        $values = [];
        
        if ($level) {
            $where[] = 'level = %s';
            $values[] = $level;
        }
        
        if ($feed_id) {
            $where[] = 'feed_id = %d';
            $values[] = intval($feed_id);
        }
        
        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        $values[] = intval($limit);
        
        $sql = "SELECT * FROM {$table_name} {$where_clause} ORDER BY created_at DESC LIMIT %d";
        
        return $wpdb->get_results($wpdb->prepare($sql, $values), ARRAY_A);
    }
    
    /**
     * Record analytics metric
     */
    public function record_metric($metric_type, $value, $date = null, $feed_id = null, $post_type = null, $opportunity_type = null, $metadata = []) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_analytics';
        
        $data = [
            'date' => $date ?: current_time('Y-m-d'),
            'metric_type' => $metric_type,
            'metric_value' => floatval($value),
            'feed_id' => $feed_id,
            'post_type' => $post_type,
            'opportunity_type' => $opportunity_type,
            'metadata' => !empty($metadata) ? json_encode($metadata) : null,
            'created_at' => current_time('mysql')
        ];
        
        return $wpdb->replace($table_name, $data);
    }
    
    /**
     * Get analytics data
     */
    public function get_analytics($metric_type = null, $days = 30, $feed_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gellobit_analytics';
        
        $where = ["date >= DATE_SUB(CURDATE(), INTERVAL %d DAY)"];
        $values = [intval($days)];
        
        if ($metric_type) {
            $where[] = 'metric_type = %s';
            $values[] = $metric_type;
        }
        
        if ($feed_id) {
            $where[] = 'feed_id = %d';
            $values[] = intval($feed_id);
        }
        
        $where_clause = implode(' AND ', $where);
        
        $sql = "SELECT * FROM {$table_name} WHERE {$where_clause} ORDER BY date DESC, metric_type ASC";
        
        return $wpdb->get_results($wpdb->prepare($sql, $values), ARRAY_A);
    }
    
    /**
     * Clean up old data
     */
    public function cleanup_old_data($days = 90) {
        global $wpdb;
        
        // Clean old logs
        $logs_table = $wpdb->prefix . 'gellobit_processing_logs';
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$logs_table} WHERE created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days
        ));
        
        // Clean old duplicate tracking
        $duplicates_table = $wpdb->prefix . 'gellobit_duplicate_tracking';
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$duplicates_table} WHERE created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days
        ));
        
        // Clean old analytics (keep longer)
        $analytics_table = $wpdb->prefix . 'gellobit_analytics';
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$analytics_table} WHERE created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days * 2
        ));
        
        return true;
    }

    public function record_processing_history($data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'gellobit_processing_history';
        $defaults = [
            'feed_id' => 0,
            'feed_name' => '',
            'category_id' => null,
            'category_name' => '',
            'ai_provider' => 'default',
            'item_title' => '',
            'item_url' => '',
            'status' => 'rejected',
            'reason' => '',
            'post_id' => null,
            'created_at' => current_time('mysql')
        ];
        $data = wp_parse_args($data, $defaults);
        $wpdb->insert($table_name, $data);
        $this->enforce_history_limit();
        return true;
    }

    private function enforce_history_limit() {
        global $wpdb;
        $limit = intval(get_option('gellobit_rss_history_limit', 500));
        $limit = max(50, $limit);
        $table = $wpdb->prefix . 'gellobit_processing_history';
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$table} WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM {$table} ORDER BY id DESC LIMIT %d
                ) as recent
            )",
            $limit
        ));
    }

    public function get_processing_history($args = []) {
        global $wpdb;
        $defaults = [
            'status' => '',
            'feed_id' => 0,
            'provider' => '',
            'paged' => 1,
            'per_page' => 25
        ];
        $args = wp_parse_args($args, $defaults);
        $where = [];
        $values = [];

        if (!empty($args['status']) && $args['status'] !== 'all') {
            $where[] = 'status = %s';
            $values[] = $args['status'];
        }

        if (!empty($args['feed_id'])) {
            $where[] = 'feed_id = %d';
            $values[] = intval($args['feed_id']);
        }

        if (!empty($args['provider']) && $args['provider'] !== 'all') {
            $where[] = 'ai_provider = %s';
            $values[] = $args['provider'];
        }

        $where_clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $limit = intval($args['per_page']);
        $offset = ($args['paged'] - 1) * $limit;

        $sql = "SELECT SQL_CALC_FOUND_ROWS * FROM {$wpdb->prefix}gellobit_processing_history {$where_clause} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $values[] = $limit;
        $values[] = $offset;

        $items = $wpdb->get_results($wpdb->prepare($sql, $values), ARRAY_A);
        $total = $wpdb->get_var('SELECT FOUND_ROWS()');

        return [
            'items' => $items,
            'total' => intval($total)
        ];
    }

    public function render_processing_history_page() {
        $filters = [
            'status' => sanitize_text_field($_GET['history_status'] ?? ''),
            'provider' => sanitize_text_field($_GET['history_provider'] ?? ''),
            'feed_id' => intval($_GET['history_feed'] ?? 0),
            'paged' => max(1, intval($_GET['paged'] ?? 1)),
            'per_page' => 25
        ];

        $data = $this->get_processing_history($filters);
        $total_pages = ceil(max(1, $data['total']) / $filters['per_page']);
        $feeds = $this->get_feeds('all');
        ?>
        <div class="wrap">
            <h1><?php _e('Processing Log', 'gellobit-rss'); ?></h1>

            <form method="get" class="gellobit-history-filters">
                <input type="hidden" name="page" value="gellobit-rss-history">
                <select name="history_status">
                    <option value="all"><?php _e('All statuses', 'gellobit-rss'); ?></option>
                    <option value="published" <?php selected($filters['status'], 'published'); ?>><?php _e('Published', 'gellobit-rss'); ?></option>
                    <option value="rejected" <?php selected($filters['status'], 'rejected'); ?>><?php _e('Rejected', 'gellobit-rss'); ?></option>
                </select>

                <select name="history_provider">
                    <option value="all"><?php _e('All providers', 'gellobit-rss'); ?></option>
                    <?php foreach (['openai','openrouter','deepseek','claude','gemini'] as $provider): ?>
                        <option value="<?php echo esc_attr($provider); ?>" <?php selected($filters['provider'], $provider); ?>><?php echo esc_html(ucfirst($provider)); ?></option>
                    <?php endforeach; ?>
                </select>

                <select name="history_feed">
                    <option value="0"><?php _e('All feeds', 'gellobit-rss'); ?></option>
                    <?php foreach ($feeds as $feed): ?>
                        <option value="<?php echo esc_attr($feed['id']); ?>" <?php selected($filters['feed_id'], $feed['id']); ?>><?php echo esc_html($feed['name']); ?></option>
                    <?php endforeach; ?>
                </select>

                <button type="submit" class="button"><?php _e('Filter', 'gellobit-rss'); ?></button>
            </form>

            <table class="widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Date', 'gellobit-rss'); ?></th>
                        <th><?php _e('Feed', 'gellobit-rss'); ?></th>
                        <th><?php _e('Category', 'gellobit-rss'); ?></th>
                        <th><?php _e('Provider', 'gellobit-rss'); ?></th>
                        <th><?php _e('Title', 'gellobit-rss'); ?></th>
                        <th><?php _e('Status', 'gellobit-rss'); ?></th>
                        <th><?php _e('Reason', 'gellobit-rss'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($data['items'])): ?>
                        <tr><td colspan="7"><?php _e('No records found.', 'gellobit-rss'); ?></td></tr>
                    <?php else: ?>
                        <?php foreach ($data['items'] as $entry): ?>
                            <tr>
                                <td><?php echo esc_html(date('Y-m-d H:i', strtotime($entry['created_at']))); ?></td>
                                <td><?php echo esc_html($entry['feed_name']); ?></td>
                                <td><?php echo esc_html($entry['category_name']); ?></td>
                                <td><?php echo esc_html(ucfirst($entry['ai_provider'])); ?></td>
                                <td>
                                    <?php if (!empty($entry['item_url'])): ?>
                                        <a href="<?php echo esc_url($entry['item_url']); ?>" target="_blank" rel="nofollow">
                                            <?php echo esc_html(wp_trim_words($entry['item_title'], 8, '…')); ?>
                                        </a>
                                    <?php else: ?>
                                        <?php echo esc_html($entry['item_title']); ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($entry['status'] === 'published' && !empty($entry['post_id'])): ?>
                                        <a href="<?php echo esc_url(get_edit_post_link($entry['post_id'])); ?>"><?php _e('Published', 'gellobit-rss'); ?></a>
                                    <?php else: ?>
                                        <?php _e('Rejected', 'gellobit-rss'); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($entry['reason']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <?php if ($total_pages > 1): ?>
                <div class="tablenav">
                    <div class="tablenav-pages">
                        <?php
                        echo paginate_links([
                            'base' => add_query_arg('paged', '%#%'),
                            'format' => '',
                            'current' => $filters['paged'],
                            'total' => $total_pages
                        ]);
                        ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
}
