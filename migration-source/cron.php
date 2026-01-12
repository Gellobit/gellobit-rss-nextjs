<?php
/**
 * Gellobit RSS Processor - Cron Job for cPanel
 *
 * Usage in cPanel Cron Jobs:
 * * * * * * /usr/bin/php /path/to/wordpress/wp-content/plugins/gellobit-rss-processor/cron.php
 *
 * Or via wget/curl:
 * * * * * * curl -s https://yourdomain.com/wp-content/plugins/gellobit-rss-processor/cron.php?key=YOUR_SECRET_KEY
 */

// Security: Verify request
define('GELLOBIT_CRON', true);

// Find WordPress root
$wordpress_root = dirname(dirname(dirname(dirname(__FILE__))));
if (!file_exists($wordpress_root . '/wp-load.php')) {
    die('WordPress not found. Please check the path.');
}

// Load WordPress
require_once($wordpress_root . '/wp-load.php');

// Verify security key if accessed via HTTP
if (!empty($_SERVER['REQUEST_METHOD'])) {
    $secret_key = get_option('gellobit_rss_cron_secret_key');
    if (empty($secret_key)) {
        // Generate and save secret key on first run
        $secret_key = wp_generate_password(32, false);
        update_option('gellobit_rss_cron_secret_key', $secret_key);
        die('Secret key generated. Please update your cron job with: ?key=' . $secret_key);
    }

    $provided_key = $_GET['key'] ?? '';
    if ($provided_key !== $secret_key) {
        http_response_code(403);
        die('Invalid security key');
    }
}

// Prevent timeout
set_time_limit(300);

// Log cron execution
error_log('[Gellobit RSS Cron] Starting cron job at ' . date('Y-m-d H:i:s'));

// Get database instance
require_once(plugin_dir_path(__FILE__) . 'includes/class-database.php');
$database = Gellobit_RSS_Database::get_instance();

// Get all active feeds
$feeds = $database->get_feeds('active');

if (empty($feeds)) {
    error_log('[Gellobit RSS Cron] No active feeds found');
    echo "No active feeds to process\n";
    exit(0);
}

// Get processor instance
require_once(plugin_dir_path(__FILE__) . 'includes/class-rss-processor.php');
$processor = Gellobit_RSS_Processor::get_instance();

$processed = 0;
$errors = 0;

foreach ($feeds as $feed) {
    // Check if this feed should run now based on its feed_interval
    $feed_interval = !empty($feed['feed_interval']) ? $feed['feed_interval'] : 'hourly';
    $last_processed = $feed['last_processed'];

    $should_process = false;

    if (empty($last_processed)) {
        $should_process = true;
    } else {
        $last_time = strtotime($last_processed);
        $now = time();
        $diff_minutes = ($now - $last_time) / 60;

        switch ($feed_interval) {
            case 'every_15_minutes':
                $should_process = $diff_minutes >= 15;
                break;
            case 'every_30_minutes':
                $should_process = $diff_minutes >= 30;
                break;
            case 'hourly':
                $should_process = $diff_minutes >= 60;
                break;
            case 'twicedaily':
                $should_process = $diff_minutes >= 720; // 12 hours
                break;
            case 'daily':
                $should_process = $diff_minutes >= 1440; // 24 hours
                break;
            default:
                $should_process = $diff_minutes >= 60;
        }
    }

    if (!$should_process) {
        error_log('[Gellobit RSS Cron] Skipping feed ' . $feed['id'] . ' - not due yet (interval: ' . $feed_interval . ')');
        continue;
    }

    error_log('[Gellobit RSS Cron] Processing feed ' . $feed['id'] . ': ' . $feed['name']);

    try {
        $result = $processor->process_feed($feed['id']);

        if ($result['success']) {
            $processed++;
            error_log('[Gellobit RSS Cron] ✓ Feed ' . $feed['id'] . ' processed successfully. Created ' . ($result['created_posts'] ?? 0) . ' posts');
            echo "✓ Feed {$feed['id']} ({$feed['name']}): Created {$result['created_posts']} posts\n";
        } else {
            $errors++;
            error_log('[Gellobit RSS Cron] ✗ Feed ' . $feed['id'] . ' failed: ' . $result['message']);
            echo "✗ Feed {$feed['id']} ({$feed['name']}): Error - {$result['message']}\n";
        }
    } catch (Exception $e) {
        $errors++;
        error_log('[Gellobit RSS Cron] ✗ Feed ' . $feed['id'] . ' exception: ' . $e->getMessage());
        echo "✗ Feed {$feed['id']} ({$feed['name']}): Exception - {$e->getMessage()}\n";
    }
}

error_log('[Gellobit RSS Cron] Cron job completed. Processed: ' . $processed . ', Errors: ' . $errors);
echo "\nCron job completed at " . date('Y-m-d H:i:s') . "\n";
echo "Total processed: {$processed}, Errors: {$errors}\n";

exit(0);
?>
