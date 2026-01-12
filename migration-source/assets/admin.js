/**
 * Admin JavaScript for Gellobit RSS Processor Plugin
 */

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        GellobitRSSAdmin.init();
    });

    /**
     * Main admin object
     */
    var GellobitRSSAdmin = {
        
        init: function() {
            this.bindEvents();
            this.initTooltips();
            this.initAutoRefresh();
        },

        /**
         * Bind events
         */
        bindEvents: function() {
            // Dashboard events
            $(document).on('click', '#process-all-feeds-btn', this.processAllFeeds);
            $(document).on('click', '#refresh-dashboard-btn', this.refreshDashboard);

            // Feed management events
            $(document).on('click', '.test-feed-btn', this.testFeed);
            $(document).on('click', '.process-feed-btn', this.processFeed);
            $(document).on('click', '.delete-feed-btn', this.deleteFeed);

            // Settings events
            $(document).on('click', '#test-ai-btn', this.testAI);
            $(document).on('click', '#cleanup-logs-btn', this.cleanupLogs);
            $(document).on('click', '#reset-stats-btn', this.resetStats);
            $(document).on('click', '#export-settings-btn', this.exportSettings);
            $(document).on('click', '#import-settings-btn', this.importSettings);
            $(document).on('click', '#export-feeds-btn', this.exportFeeds);
            $(document).on('click', '#import-feeds-btn', this.importFeeds);

            // Media uploader for fallback featured image
            $(document).on('click', '#upload_fallback_image_button', this.openMediaUploader);

            // Form validation
            $(document).on('submit', '.feed-form', this.validateFeedForm);
        },

        /**
         * Initialize tooltips
         */
        initTooltips: function() {
            $('[data-tooltip]').each(function() {
                $(this).attr('title', $(this).data('tooltip'));
            });
        },

        /**
         * Initialize auto-refresh for dashboard
         */
        initAutoRefresh: function() {
            if ($('.gellobit-dashboard').length > 0) {
                // Refresh dashboard data every 60 seconds
                setInterval(function() {
                    GellobitRSSAdmin.refreshDashboardData();
                }, 60000);
            }
        },

        /**
         * Process all feeds
         */
        processAllFeeds: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var $result = $('#process-result');
            
            $button.prop('disabled', true).text('Processing...');
            $result.hide();
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_process_all_feeds',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $result.removeClass('error').addClass('success')
                            .html('<strong>Success!</strong> Processed ' + response.data.processed_feeds + ' feeds, created ' + response.data.created_posts + ' posts.')
                            .show();
                        
                        // Refresh dashboard after 3 seconds
                        setTimeout(function() {
                            GellobitRSSAdmin.refreshDashboardData();
                        }, 3000);
                    } else {
                        $result.removeClass('success').addClass('error')
                            .html('<strong>Error:</strong> ' + (response.data.message || 'Unknown error'))
                            .show();
                    }
                },
                error: function() {
                    $result.removeClass('success').addClass('error')
                        .html('<strong>Error:</strong> Request failed')
                        .show();
                },
                complete: function() {
                    $button.prop('disabled', false).text('Process All Feeds Now');
                }
            });
        },

        /**
         * Refresh dashboard
         */
        refreshDashboard: function(e) {
            e.preventDefault();
            location.reload();
        },

        /**
         * Refresh dashboard data (AJAX)
         */
        refreshDashboardData: function() {
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_get_dashboard_data',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success && response.data.counters) {
                        // Update counters
                        $('.big-number').each(function(index) {
                            var newValue = response.data.counters[index];
                            if (newValue !== undefined) {
                                $(this).text(newValue);
                            }
                        });
                        
                        // Update timestamp
                        var now = new Date();
                        $('.last-updated').text('Last updated: ' + now.toLocaleTimeString());
                    }
                }
            });
        },

        /**
         * Test individual feed
         */
        testFeed: function(e) {
            e.preventDefault();
            
            var feedId = $(this).data('feed-id');
            var $button = $(this);
            
            $button.prop('disabled', true).text('Testing...');
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_test_feed',
                    feed_id: feedId,
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Feed test successful! Found ' + (response.data.items_found || 0) + ' items.');
                    } else {
                        alert('Feed test failed: ' + (response.data || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Test');
                }
            });
        },

        /**
         * Process individual feed
         */
        processFeed: function(e) {
            e.preventDefault();
            
            var feedId = $(this).data('feed-id');
            var $button = $(this);
            
            $button.prop('disabled', true).text('Processing...');
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_process_feed',
                    feed_id: feedId,
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Feed processed successfully! Created ' + (response.data.created_posts || 0) + ' posts.');
                        location.reload();
                    } else {
                        alert('Feed processing failed: ' + (response.data.message || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Process');
                }
            });
        },

        /**
         * Delete feed
         */
        deleteFeed: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this feed? This action cannot be undone.')) {
                return;
            }
            
            var feedId = $(this).data('feed-id');
            var $button = $(this);
            
            $button.prop('disabled', true);
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_delete_feed',
                    feed_id: feedId,
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert('Delete failed: ' + (response.data || 'Unknown error'));
                        $button.prop('disabled', false);
                    }
                },
                error: function() {
                    alert('Request failed');
                    $button.prop('disabled', false);
                }
            });
        },

        /**
         * Test AI connection
         */
        testAI: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var $result = $('#test-ai-result');
            
            $button.prop('disabled', true).text('Testing...');
            $result.text('');
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_test_ai',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $result.html('<span style="color: green;">✅ Connection successful!</span>');
                    } else {
                        $result.html('<span style="color: red;">❌ Connection failed: ' + (response.data || 'Unknown error') + '</span>');
                    }
                },
                error: function() {
                    $result.html('<span style="color: red;">❌ Request failed</span>');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Test Connection');
                }
            });
        },

        /**
         * Cleanup logs
         */
        cleanupLogs: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to clean old logs? This will remove logs older than 90 days.')) {
                return;
            }
            
            var $button = $(this);
            
            $button.prop('disabled', true).text('Cleaning...');
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_cleanup_logs',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Logs cleaned successfully!');
                    } else {
                        alert('Cleanup failed: ' + (response.data || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Clean Old Logs');
                }
            });
        },

        /**
         * Reset statistics
         */
        resetStats: function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
                return;
            }
            
            var $button = $(this);
            
            $button.prop('disabled', true).text('Resetting...');
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_reset_stats',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        alert('Statistics reset successfully!');
                        location.reload();
                    } else {
                        alert('Reset failed: ' + (response.data || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Reset Statistics');
                }
            });
        },

        /**
         * Export settings
         */
        exportSettings: function(e) {
            e.preventDefault();
            
            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_export_settings',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success && response.data.settings) {
                        var dataStr = JSON.stringify(response.data.settings, null, 2);
                        var dataBlob = new Blob([dataStr], {type: 'application/json'});
                        
                        var link = document.createElement('a');
                        link.href = URL.createObjectURL(dataBlob);
                        link.download = 'gellobit-rss-settings-' + new Date().toISOString().split('T')[0] + '.json';
                        link.click();
                    } else {
                        alert('Export failed: ' + (response.data || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                }
            });
        },

        /**
         * Import settings
         */
        importSettings: function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Gellobit] Import settings clicked');

            var fileInput = $('#import-settings-file');
            fileInput.val(''); // Clear previous selection
            fileInput.trigger('click');

            fileInput.off('change').on('change', function() {
                var file = this.files[0];
                if (!file) {
                    console.log('[Gellobit] No settings file selected');
                    return;
                }

                console.log('[Gellobit] Settings file selected:', file.name);
                var reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        var settings = JSON.parse(evt.target.result);
                        console.log('[Gellobit] Importing settings:', settings);

                        $.ajax({
                            url: gellobitRssAjax.ajax_url,
                            type: 'POST',
                            data: {
                                action: 'gellobit_import_settings',
                                settings: JSON.stringify(settings),
                                nonce: gellobitRssAjax.nonce
                            },
                            success: function(response) {
                                console.log('[Gellobit] Import settings response:', response);
                                if (response.success) {
                                    alert('Settings imported successfully!');
                                    location.reload();
                                } else {
                                    alert('Import failed: ' + (response.data.message || response.data || 'Unknown error'));
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('[Gellobit] Import settings error:', xhr, status, error);
                                console.error('[Gellobit] Response text:', xhr.responseText);
                                alert('Request failed: ' + error + '\nCheck browser console for details');
                            }
                        });
                    } catch (err) {
                        console.error('[Gellobit] Settings JSON parsing error:', err);
                        alert('Invalid JSON file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
        },

        /**
         * Export feeds
         */
        exportFeeds: function(e) {
            e.preventDefault();

            $.ajax({
                url: gellobitRssAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'gellobit_export_feeds',
                    nonce: gellobitRssAjax.nonce
                },
                success: function(response) {
                    if (response.success && response.data.feeds) {
                        var dataStr = JSON.stringify(response.data.feeds, null, 2);
                        var blob = new Blob([dataStr], {type: 'application/json'});
                        var link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'gellobit-feeds-' + new Date().toISOString().split('T')[0] + '.json';
                        link.click();
                    } else {
                        alert('Export failed: ' + (response.data || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('Request failed');
                }
            });
        },

        /**
         * Import feeds
         */
        importFeeds: function(e) {
            e.preventDefault();
            e.stopPropagation();

            var fileInput = $('#import-feeds-file');
            fileInput.val(''); // Clear previous selection
            fileInput.trigger('click');

            fileInput.off('change').on('change', function() {
                var file = this.files[0];
                if (!file) {
                    console.log('[Gellobit] No file selected');
                    return;
                }
                console.log('[Gellobit] File selected:', file.name);
                var reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        var feeds = JSON.parse(evt.target.result);
                        console.log('[Gellobit] Importing feeds:', feeds);
                        $.ajax({
                            url: gellobitRssAjax.ajax_url,
                            type: 'POST',
                            data: {
                                action: 'gellobit_import_feeds',
                                feeds: JSON.stringify(feeds),
                                nonce: gellobitRssAjax.nonce
                            },
                            success: function(response) {
                                console.log('[Gellobit] Import response:', response);
                                if (response.success) {
                                    alert(response.data.message || 'Feeds imported successfully');
                                    location.reload();
                                } else {
                                    alert('Import failed: ' + (response.data.message || response.data || 'Unknown error'));
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('[Gellobit] Import error:', xhr, status, error);
                                console.error('[Gellobit] Response text:', xhr.responseText);
                                alert('Request failed: ' + error + '\nCheck browser console for details');
                            }
                        });
                    } catch (err) {
                        console.error('[Gellobit] JSON parsing error:', err);
                        alert('Invalid JSON file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
        },

        /**
         * Open WordPress Media Uploader
         */
        openMediaUploader: function(e) {
            e.preventDefault();

            // Check if media frame already exists
            if (typeof window.fallbackImageFrame !== 'undefined') {
                window.fallbackImageFrame.open();
                return;
            }

            // Create media frame
            window.fallbackImageFrame = wp.media({
                title: 'Select Fallback Featured Image',
                button: {
                    text: 'Use this image'
                },
                multiple: false,
                library: {
                    type: 'image'
                }
            });

            // When image is selected
            window.fallbackImageFrame.on('select', function() {
                var attachment = window.fallbackImageFrame.state().get('selection').first().toJSON();
                $('#fallback_featured_image').val(attachment.url);
                $('#fallback_image_preview img').attr('src', attachment.url);
                $('#fallback_image_preview').show();
            });

            // Open media frame
            window.fallbackImageFrame.open();
        },

        /**
         * Validate feed form
         */
        validateFeedForm: function(e) {
            var $form = $(this);
            var feedUrl = $form.find('#feed_url').val();
            var feedName = $form.find('#feed_name').val();
            
            if (!feedName.trim()) {
                alert('Please enter a feed name');
                e.preventDefault();
                return false;
            }
            
            if (!feedUrl.trim()) {
                alert('Please enter a feed URL');
                e.preventDefault();
                return false;
            }
            
            // Basic URL validation
            try {
                new URL(feedUrl);
            } catch (_) {
                alert('Please enter a valid URL');
                e.preventDefault();
                return false;
            }
            
            return true;
        },

        /**
         * Show loading state
         */
        showLoading: function($element) {
            $element.addClass('loading');
        },

        /**
         * Hide loading state
         */
        hideLoading: function($element) {
            $element.removeClass('loading');
        },

        /**
         * Show notification
         */
        showNotification: function(message, type) {
            type = type || 'success';
            
            var $notification = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.wrap h1').after($notification);
            
            // Auto-remove after 5 seconds
            setTimeout(function() {
                $notification.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        },

        /**
         * Format numbers with commas
         */
        formatNumber: function(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

        /**
         * Debounce function
         */
        debounce: function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }
    };

    // Make GellobitRSSAdmin globally available
    window.GellobitRSSAdmin = GellobitRSSAdmin;

    // Handle WordPress admin notices
    $(document).on('click', '.notice-dismiss', function() {
        $(this).parent().fadeOut();
    });

    // Auto-hide success messages after 5 seconds
    setTimeout(function() {
        $('.notice-success').fadeOut();
    }, 5000);

})(jQuery);
