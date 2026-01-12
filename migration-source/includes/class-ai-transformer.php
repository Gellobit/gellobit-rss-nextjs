<?php
/**
 * AI Transformer class for RSS Processor Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_AI_Transformer {
    private static $instance = null;

    private $default_providers = [
        'openai' => [
            'api_key' => '',
            'model' => 'gpt-4o-mini',
            'base_url' => 'https://api.openai.com/v1/chat/completions'
        ],
        'openrouter' => [
            'api_key' => '',
            'model' => 'openrouter/anthropic/claude-3.5-sonnet',
            'base_url' => 'https://openrouter.ai/api/v1/chat/completions'
        ],
        'deepseek' => [
            'api_key' => '',
            'model' => 'deepseek-chat',
            'base_url' => 'https://api.deepseek.com/v1/chat/completions'
        ],
        'claude' => [
            'api_key' => '',
            'model' => 'claude-3-sonnet-20240229',
            'base_url' => 'https://api.anthropic.com/v1/messages'
        ],
        'gemini' => [
            'api_key' => '',
            'model' => 'gemini-1.5-flash',
            'base_url' => 'https://generativelanguage.googleapis.com/v1beta'
        ]
    ];

    private $config = [
        'default_provider' => 'openai',
        'providers' => [],
        'max_tokens' => 1500,
        'temperature' => 0.1,
        'timeout' => 60,
        'max_retries' => 3,
        'enable_logging' => true,
        'enable_caching' => true,
        'confidence_threshold' => 0.6,
        'rate_limit_per_hour' => 100
    ];

    private $response_cache = [];

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_config();
    }

    private function init_config() {
        $saved_config = get_option('gellobit_rss_ai_config', []);
        $legacy_config = get_option('gellobit_ai_config', []);
        if (!empty($legacy_config)) {
            $saved_config = array_merge($legacy_config, $saved_config);
        }

        $this->config['providers'] = $this->default_providers;
        $this->config = wp_parse_args($saved_config, $this->config);

        foreach ($this->default_providers as $slug => $defaults) {
            if (isset($saved_config['providers'][$slug]) && is_array($saved_config['providers'][$slug])) {
                $this->config['providers'][$slug] = array_merge($defaults, $saved_config['providers'][$slug]);
            }
        }

        foreach ($this->config['providers'] as $provider => $settings) {
            if (!empty($settings['api_key']) && $this->is_encrypted($settings['api_key'])) {
                $this->config['providers'][$provider]['api_key'] = $this->decrypt_api_key($settings['api_key']);
            }
        }
    }

    public function get_default_provider() {
        return $this->config['default_provider'] ?? 'openai';
    }

    public function call_openai($prompt, $system_message = '', $options = []) {
        $provider = $options['provider'] ?? null;
        unset($options['provider']);
        return $this->run_chat_completion($provider, $prompt, $system_message, $options);
    }

    public function generate_from_prompt($prompt, $options = [], $provider = null) {
        $system_message = $options['system_message'] ?? 'You are a professional editor. Return only the requested content.';
        unset($options['system_message']);
        return $this->run_chat_completion($provider, $prompt, $system_message, $options);
    }

    public function extract_opportunity_data($content, $title = '') {
        $prompt = "Analyze the following opportunity description and extract structured data in JSON format.\n\n"
            . "CONTENT:\n{$title}\n\n{$content}\n\n"
            . "Return JSON with keys: opportunity_type, title, description, deadline, prize_value, requirements, location, application_url, confidence (0-1).";

        return $this->call_openai($prompt, 'You classify opportunity content for gellobit.com. Respond with JSON only.');
    }

    public function test_connection() {
        try {
            $response = $this->call_openai(
                "Reply with 'OK' if you receive this message",
                "You are a diagnostic assistant. Respond only with 'OK'."
            );

            return [
                'success' => $response['success'],
                'message' => $response['success'] ? 'AI connection successful' : 'AI connection failed',
                'content' => $response['content'] ?? null,
                'error' => $response['error'] ?? null
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'AI connection failed',
                'error' => $e->getMessage()
            ];
        }
    }

    public function update_config($new_config) {
        if (isset($new_config['providers']) && is_array($new_config['providers'])) {
            foreach ($new_config['providers'] as $provider => $settings) {
                if (isset($settings['api_key']) && $settings['api_key'] !== '') {
                    $new_config['providers'][$provider]['api_key'] = $this->encrypt_api_key($settings['api_key']);
                } elseif (isset($settings['clear']) && $settings['clear']) {
                    $new_config['providers'][$provider]['api_key'] = '';
                }
                if (isset($new_config['providers'][$provider]['clear'])) {
                    unset($new_config['providers'][$provider]['clear']);
                }
            }
        }

        $this->config = array_replace_recursive($this->config, $new_config);
        update_option('gellobit_rss_ai_config', $this->config);
        $this->init_config();
        return true;
    }

    public function get_config() {
        $safe = $this->config;
        if (isset($safe['providers'])) {
            foreach ($safe['providers'] as $provider => &$data) {
                $data['api_key_display'] = !empty($data['api_key']) ? $data['api_key'] : '';
            }
            unset($data);
        }
        return $safe;
    }

    /**
     * Fetch available models for a provider using the supplied API key or stored key
     */
    public function list_provider_models($provider, $api_key = '') {
        $provider = $this->normalize_provider($provider);
        $config = $this->config['providers'][$provider] ?? null;
        if (!$config) {
            throw new Exception(__('Provider not configured', 'gellobit-rss'));
        }

        $key = $api_key ?: ($config['api_key'] ?? '');
        if (empty($key)) {
            throw new Exception(__('API key required for this provider', 'gellobit-rss'));
        }

        switch ($provider) {
            case 'openai':
                return $this->fetch_openai_models($config, $key);
            case 'openrouter':
                return $this->fetch_openrouter_models($config, $key);
            case 'deepseek':
                return $this->fetch_deepseek_models($config, $key);
            case 'claude':
                return $this->fetch_claude_models($config, $key);
            case 'gemini':
                return $this->fetch_gemini_models($config, $key);
            default:
                throw new Exception(sprintf(__('Unsupported provider: %s', 'gellobit-rss'), $provider));
        }
    }

    private function run_chat_completion($provider, $prompt, $system_message, $options) {
        try {
            $provider = $this->normalize_provider($provider);
            $provider_config = $this->config['providers'][$provider] ?? null;

            if (empty($provider_config) || empty($provider_config['api_key'])) {
                throw new Exception(sprintf('API key missing for provider: %s', $provider));
            }

            $model = $options['model'] ?? ($provider_config['model'] ?? null);
            if (empty($model)) {
                throw new Exception(sprintf('Model not configured for provider: %s', $provider));
            }

            $max_tokens = $options['max_tokens'] ?? $this->config['max_tokens'];
            $temperature = $options['temperature'] ?? $this->config['temperature'];

            $cache_key = $this->generate_cache_key($provider . $model, $prompt, $system_message, $options);
            if (!empty($this->config['enable_caching']) && isset($this->response_cache[$cache_key])) {
                return $this->response_cache[$cache_key];
            }

            switch ($provider) {
            case 'openai':
                $response = $this->call_openai_style(
                    $provider_config['base_url'],
                    $provider_config['api_key'],
                    $model,
                    $prompt,
                    $system_message,
                    $max_tokens,
                    $temperature,
                    [],
                    'openai'
                );
                break;
            case 'openrouter':
                $response = $this->call_openai_style(
                    $provider_config['base_url'],
                    $provider_config['api_key'],
                    $model,
                    $prompt,
                    $system_message,
                    $max_tokens,
                    $temperature,
                    [
                        'HTTP-Referer' => home_url('/'),
                        'X-Title' => get_bloginfo('name', 'display')
                    ],
                    'openrouter'
                );
                break;
            case 'deepseek':
                $response = $this->call_openai_style(
                    $provider_config['base_url'],
                    $provider_config['api_key'],
                    $model,
                    $prompt,
                    $system_message,
                    $max_tokens,
                    $temperature,
                    [],
                    'deepseek'
                );
                break;
            case 'claude':
                $response = $this->call_claude(
                    $provider_config,
                    $model,
                    $prompt,
                    $system_message,
                    $max_tokens,
                    $temperature
                );
                break;
            case 'gemini':
                $response = $this->call_gemini(
                    $provider_config,
                    $model,
                    $prompt,
                    $system_message,
                    $max_tokens,
                    $temperature
                );
                break;
            default:
                throw new Exception(sprintf('Unsupported AI provider: %s', $provider));
            }

            if (!empty($this->config['enable_caching'])) {
                $this->response_cache[$cache_key] = $response;
            }

            return $response;

        } catch (Exception $e) {
            if (!empty($this->config['enable_logging'])) {
                $this->log_error('AI provider error', $e->getMessage());
            }
            return [
                'success' => false,
                'content' => null,
                'error' => $e->getMessage()
            ];
        }
    }

    private function call_openai_style($endpoint, $api_key, $model, $prompt, $system_message, $max_tokens, $temperature, $extra_headers = [], $provider_slug = 'openai') {
        $messages = [];
        if (!empty($system_message)) {
            $messages[] = [
                'role' => 'system',
                'content' => $system_message
            ];
        }
        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $body = wp_json_encode([
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => $max_tokens,
            'temperature' => $temperature
        ]);

        $headers = array_merge([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key
        ], $extra_headers);

        $response = wp_remote_post($endpoint, [
            'timeout' => $this->config['timeout'],
            'headers' => $headers,
            'body' => $body
        ]);

        if (is_wp_error($response)) {
            throw new Exception('HTTP request failed: ' . $response->get_error_message());
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        if ($response_code !== 200) {
            $error_data = json_decode($response_body, true);
            $error_message = $error_data['error']['message'] ?? 'Unknown API error';
            throw new Exception($error_message);
        }

        $json = json_decode($response_body, true);
        if (!isset($json['choices'][0]['message']['content'])) {
            throw new Exception('Invalid AI response structure');
        }

        $content = trim($json['choices'][0]['message']['content']);
        $decoded = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $decoded;
        }

        $result = [
            'success' => true,
            'content' => $content,
            'usage' => $json['usage'] ?? []
        ];

        if ($this->config['enable_logging']) {
            $this->log_ai_interaction([
                'provider' => $provider_slug,
                'model' => $model,
                'prompt_length' => strlen($prompt)
            ], $result);
        }

        return $result;
    }

    private function call_claude($provider_config, $model, $prompt, $system_message, $max_tokens, $temperature) {
        $body = wp_json_encode([
            'model' => $model,
            'system' => $system_message,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'max_tokens' => $max_tokens,
            'temperature' => $temperature
        ]);

        $headers = [
            'Content-Type' => 'application/json',
            'x-api-key' => $provider_config['api_key'],
            'anthropic-version' => '2023-06-01'
        ];

        $response = wp_remote_post($provider_config['base_url'], [
            'timeout' => $this->config['timeout'],
            'headers' => $headers,
            'body' => $body
        ]);

        if (is_wp_error($response)) {
            throw new Exception('HTTP request failed: ' . $response->get_error_message());
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        if ($response_code !== 200) {
            $error_data = json_decode($response_body, true);
            $error_message = $error_data['error']['message'] ?? 'Claude API error';
            throw new Exception($error_message);
        }

        $json = json_decode($response_body, true);
        if (empty($json['content'][0]['text'])) {
            throw new Exception('Invalid Claude response');
        }
        $content = trim($json['content'][0]['text']);
        $decoded = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $decoded;
        }

        $result = [
            'success' => true,
            'content' => $content,
            'usage' => [
                'input_tokens' => $json['usage']['input_tokens'] ?? null,
                'output_tokens' => $json['usage']['output_tokens'] ?? null
            ]
        ];

        if ($this->config['enable_logging']) {
            $this->log_ai_interaction([
                'provider' => 'claude',
                'model' => $model,
                'prompt_length' => strlen($prompt)
            ], $result);
        }

        return $result;
    }

    private function call_gemini($provider_config, $model, $prompt, $system_message, $max_tokens, $temperature) {
        $url = trailingslashit($provider_config['base_url']) . 'models/' . $model . ':generateContent?key=' . urlencode($provider_config['api_key']);

        $full_prompt = $system_message ? ("SYSTEM:\n" . $system_message . "\n\nUSER:\n" . $prompt) : $prompt;

        $body = wp_json_encode([
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $full_prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $max_tokens
            ]
        ]);

        $response = wp_remote_post($url, [
            'timeout' => $this->config['timeout'],
            'headers' => ['Content-Type' => 'application/json'],
            'body' => $body
        ]);

        if (is_wp_error($response)) {
            throw new Exception('HTTP request failed: ' . $response->get_error_message());
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        if ($response_code !== 200) {
            $error_data = json_decode($response_body, true);
            $error_message = $error_data['error']['message'] ?? 'Gemini API error';
            throw new Exception($error_message);
        }

        $json = json_decode($response_body, true);
        if (empty($json['candidates'][0]['content']['parts'][0]['text'])) {
            throw new Exception('Invalid Gemini response');
        }
        $content = trim($json['candidates'][0]['content']['parts'][0]['text']);
        $decoded = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $decoded;
        }

        $result = [
            'success' => true,
            'content' => $content,
            'usage' => []
        ];

        if ($this->config['enable_logging']) {
            $this->log_ai_interaction([
                'provider' => 'gemini',
                'model' => $model,
                'prompt_length' => strlen($prompt)
            ], $result);
        }

        return $result;
    }

    private function normalize_provider($provider) {
        if (empty($provider) || $provider === 'default') {
            return $this->get_default_provider();
        }
        return $provider;
    }

    private function generate_cache_key($provider, $prompt, $system_message, $options) {
        return 'gellobit_ai_' . md5($provider . $prompt . $system_message . serialize($options));
    }

    private function log_ai_interaction($params, $response) {
        $db = Gellobit_RSS_Database::get_instance();
        $db->log(
            $response['success'] ? 'info' : 'error',
            'AI API call ' . ($response['success'] ? 'successful' : 'failed'),
            $params
        );
    }

    private function log_error($message, $error) {
        $db = Gellobit_RSS_Database::get_instance();
        $db->log('error', $message, ['error' => $error]);
    }

    private function fetch_openai_models($config, $api_key) {
        $response = $this->http_get('https://api.openai.com/v1/models', [
            'Authorization' => 'Bearer ' . $api_key
        ]);
        $json = json_decode($response, true);
        $models = [];
        foreach ($json['data'] ?? [] as $entry) {
            $id = $entry['id'] ?? '';
            if (!$id || strpos($id, 'gpt') === false) {
                continue;
            }
            $models[$id] = $id;
        }
        return $this->format_model_list($models, ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini']);
    }

    private function fetch_openrouter_models($config, $api_key) {
        $response = $this->http_get('https://openrouter.ai/api/v1/models', [
            'Authorization' => 'Bearer ' . $api_key,
            'HTTP-Referer' => home_url('/'),
            'X-Title' => get_bloginfo('name', 'display')
        ]);
        $json = json_decode($response, true);
        $models = [];
        foreach ($json['data'] ?? [] as $entry) {
            $id = $entry['id'] ?? '';
            if (!$id) {
                continue;
            }
            $display = $entry['name'] ?? $id;
            $models[$id] = $display;
        }
        return $this->format_model_list($models, ['openrouter/anthropic/claude-3.5-sonnet']);
    }

    private function fetch_deepseek_models($config, $api_key) {
        $response = $this->http_get('https://api.deepseek.com/v1/models', [
            'Authorization' => 'Bearer ' . $api_key
        ]);
        $json = json_decode($response, true);
        $models = [];
        foreach ($json['data'] ?? [] as $entry) {
            $id = $entry['id'] ?? '';
            if ($id) {
                $models[$id] = $id;
            }
        }
        return $this->format_model_list($models, ['deepseek-chat']);
    }

    private function fetch_claude_models($config, $api_key) {
        $response = $this->http_get('https://api.anthropic.com/v1/models', [
            'x-api-key' => $api_key,
            'anthropic-version' => '2023-06-01'
        ]);
        $json = json_decode($response, true);
        $models = [];
        foreach ($json['data'] ?? [] as $entry) {
            $id = $entry['id'] ?? '';
            if ($id) {
                $models[$id] = $entry['display_name'] ?? $id;
            }
        }
        return $this->format_model_list($models, ['claude-3.5-sonnet', 'claude-3-sonnet-20240229']);
    }

    private function fetch_gemini_models($config, $api_key) {
        $url = 'https://generativelanguage.googleapis.com/v1/models?key=' . urlencode($api_key);
        $response = $this->http_get($url, ['Content-Type' => 'application/json']);
        $json = json_decode($response, true);
        $models = [];
        foreach ($json['models'] ?? [] as $entry) {
            $name = $entry['name'] ?? '';
            if (!$name) {
                continue;
            }
            $parts = explode('/', $name);
            $slug = end($parts);
            $models[$slug] = $entry['displayName'] ?? $slug;
        }
        return $this->format_model_list($models, ['gemini-1.5-flash', 'gemini-1.5-pro']);
    }

    private function http_get($url, $headers = []) {
        $args = [
            'timeout' => $this->config['timeout'],
            'headers' => $headers
        ];
        $response = wp_remote_get($url, $args);
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        if ($code !== 200) {
            $error_data = json_decode($body, true);
            $message = $error_data['error']['message'] ?? $body;
            throw new Exception($message);
        }
        return $body;
    }

    private function format_model_list($models, $fallback = []) {
        if (empty($models)) {
            $models = array_combine($fallback, $fallback);
        }
        ksort($models);
        $list = [];
        foreach ($models as $value => $label) {
            $list[] = [
                'value' => $value,
                'label' => $label
            ];
        }
        return $list;
    }

    private function is_encrypted($key) {
        if (str_starts_with($key, 'b64:')) {
            return true;
        }
        return strlen($key) > 100 && !str_starts_with($key, 'sk-');
    }

    private function decrypt_api_key($encrypted_key) {
        if (str_starts_with($encrypted_key, 'b64:')) {
            return base64_decode(substr($encrypted_key, 4));
        }
        if ($this->is_encrypted($encrypted_key)) {
            return base64_decode($encrypted_key);
        }
        return $encrypted_key;
    }

    public function encrypt_api_key($api_key) {
        if (empty($api_key)) {
            return '';
        }
        if (str_starts_with($api_key, 'b64:')) {
            return $api_key;
        }
        return 'b64:' . base64_encode($api_key);
    }
}
?>
