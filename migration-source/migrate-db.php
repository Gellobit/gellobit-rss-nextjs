<?php
/**
 * Database Migration Script for Gellobit RSS Processor
 * Run this once to add the fallback_featured_image column if it doesn't exist
 *
 * Usage:
 * 1. Access via browser: http://localhost/gellobit/wp-content/plugins/gellobit-rss-processor/migrate-db.php
 * 2. Or via WP-CLI: wp eval-file migrate-db.php
 */

// Load WordPress
$wp_load_path = dirname(dirname(dirname(dirname(__FILE__)))) . '/wp-load.php';

if (file_exists($wp_load_path)) {
    require_once($wp_load_path);
} else {
    die('WordPress not found. Please run from plugin directory or adjust path.');
}

// Security check - only admin can run this
if (!current_user_can('manage_options')) {
    die('Permission denied. You must be an administrator.');
}

global $wpdb;

echo "<h2>Gellobit RSS Processor - Database Migration</h2>\n";
echo "<pre>\n";

// Check current database structure
$table_name = $wpdb->prefix . 'gellobit_rss_feeds';

echo "Checking table: $table_name\n\n";

// Get current columns
$columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name");

$has_fallback_image = false;
$has_feed_interval = false;
$has_allow_republish = false;

foreach ($columns as $column) {
    if ($column->Field === 'fallback_featured_image') {
        $has_fallback_image = true;
    }
    if ($column->Field === 'feed_interval') {
        $has_feed_interval = true;
    }
    if ($column->Field === 'allow_republish') {
        $has_allow_republish = true;
    }
}

echo "Current status:\n";
echo "- allow_republish: " . ($has_allow_republish ? "✓ EXISTS" : "✗ MISSING") . "\n";
echo "- feed_interval: " . ($has_feed_interval ? "✓ EXISTS" : "✗ MISSING") . "\n";
echo "- fallback_featured_image: " . ($has_fallback_image ? "✓ EXISTS" : "✗ MISSING") . "\n\n";

// Add missing columns
$changes_made = false;

if (!$has_allow_republish) {
    echo "Adding allow_republish column...\n";
    $result = $wpdb->query("ALTER TABLE $table_name ADD COLUMN allow_republish tinyint(1) DEFAULT 0 AFTER ai_provider");
    if ($result !== false) {
        echo "✓ allow_republish column added successfully\n";
        $changes_made = true;
    } else {
        echo "✗ Error adding allow_republish column: " . $wpdb->last_error . "\n";
    }
}

if (!$has_feed_interval) {
    echo "Adding feed_interval column...\n";
    $result = $wpdb->query("ALTER TABLE $table_name ADD COLUMN feed_interval varchar(50) DEFAULT '' AFTER allow_republish");
    if ($result !== false) {
        echo "✓ feed_interval column added successfully\n";
        $changes_made = true;
    } else {
        echo "✗ Error adding feed_interval column: " . $wpdb->last_error . "\n";
    }
}

if (!$has_fallback_image) {
    echo "Adding fallback_featured_image column...\n";
    $result = $wpdb->query("ALTER TABLE $table_name ADD COLUMN fallback_featured_image text NULL AFTER feed_interval");
    if ($result !== false) {
        echo "✓ fallback_featured_image column added successfully\n";
        $changes_made = true;
    } else {
        echo "✗ Error adding fallback_featured_image column: " . $wpdb->last_error . "\n";
    }
}

if (!$changes_made) {
    echo "\n✓ Database is up to date! No changes needed.\n";
} else {
    echo "\n✓ Database migration completed successfully!\n";
}

// Show current table structure
echo "\n\nCurrent table structure:\n";
echo "------------------------\n";
$columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name");
foreach ($columns as $column) {
    echo sprintf("%-30s %-20s %s\n", $column->Field, $column->Type, $column->Null === 'YES' ? 'NULL' : 'NOT NULL');
}

echo "</pre>\n";
echo "<p><strong>Done!</strong> You can now go back to <a href=\"" . admin_url('admin.php?page=gellobit-rss-feeds') . "\">Gellobit RSS Feeds</a></p>\n";
?>
