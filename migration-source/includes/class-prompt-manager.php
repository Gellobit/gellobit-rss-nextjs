<?php
/**
 * Prompt manager to load opportunity-specific GPT templates
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Prompt_Manager {

    private static $instance = null;

    private $prompt_cache = [];

    private $type_map = [
        'giveaway' => 'GIVEAWAYS.txt',
        'sweepstakes' => 'SWEEPTAKES.txt',
        'contest' => 'CONTESTS.txt',
        'dream_job' => 'DREAMJOBS.txt',
        'get_paid_to' => 'GET PAID TO.txt',
        'instant_win' => 'INSTANTWIN.txt',
        'job_fair' => 'JOBFAIRS.txt',
        'scholarship' => 'SCHOLARSHIPS.txt',
        'volunteer' => 'VOLUNTEER.txt',
        'free_training' => 'FREE TRAINING.txt',
        'promo' => 'PROMOS.txt'
    ];

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    /**
     * Return processed GPT prompt segments for the requested opportunity type
     */
    public function get_prompt_segments($opportunity_type, $context = []) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return [];
        }

        $template = $this->load_template($this->type_map[$type_key]);
        if (empty($template)) {
            return [];
        }

        $segments = [];
        if (preg_match_all('/\[gpt\](.*?)\[\/gpt\]/is', $template, $matches)) {
            foreach ($matches[1] as $segment) {
                $segments[] = $this->apply_context(trim($segment), $context);
            }
        }

        return $segments;
    }

    private function load_template($filename) {
        if (isset($this->prompt_cache[$filename])) {
            return $this->prompt_cache[$filename];
        }

        // Intentar cargar desde base de datos primero
        $custom_prompts = get_option('gellobit_rss_custom_prompts', []);
        $type_key = array_search($filename, $this->type_map);

        if ($type_key && !empty($custom_prompts[$type_key])) {
            $this->prompt_cache[$filename] = $custom_prompts[$type_key];
            return $this->prompt_cache[$filename];
        }

        // Fallback: cargar desde archivo .txt
        $path = trailingslashit(GELLOBIT_RSS_PLUGIN_DIR) . 'prompts/' . $filename;
        if (!file_exists($path)) {
            return '';
        }

        $contents = file_get_contents($path);
        $this->prompt_cache[$filename] = $contents ?: '';
        return $this->prompt_cache[$filename];
    }

    private function apply_context($segment, $context) {
        $content = $context['content'] ?? '';
        $replacements = [
            '[original_title]' => $context['original_title'] ?? '',
            '[source_title]' => $context['original_title'] ?? '',
            '[matched_content]' => $content,
            '[scraped_content]' => $content,
            '[source_content]' => $content,
            '[source_url]' => $context['source_url'] ?? '',
            '[feed_name]' => $context['feed_name'] ?? '',
            '[feed_url]' => $context['feed_url'] ?? ''
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $segment);
    }

    /**
     * Obtener prompt original desde archivo (sin cache)
     */
    public function get_default_prompt($opportunity_type) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return '';
        }

        $path = trailingslashit(GELLOBIT_RSS_PLUGIN_DIR) . 'prompts/' . $this->type_map[$type_key];
        if (!file_exists($path)) {
            return '';
        }

        return file_get_contents($path) ?: '';
    }

    /**
     * Guardar prompt personalizado en base de datos
     */
    public function save_custom_prompt($opportunity_type, $prompt_content) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return false;
        }

        $custom_prompts = get_option('gellobit_rss_custom_prompts', []);
        $custom_prompts[$type_key] = $prompt_content;

        // Limpiar cache
        unset($this->prompt_cache[$this->type_map[$type_key]]);

        return update_option('gellobit_rss_custom_prompts', $custom_prompts);
    }

    /**
     * Resetear prompt a su valor por defecto (eliminar personalización)
     */
    public function reset_prompt($opportunity_type) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return false;
        }

        $custom_prompts = get_option('gellobit_rss_custom_prompts', []);
        if (isset($custom_prompts[$type_key])) {
            unset($custom_prompts[$type_key]);
            update_option('gellobit_rss_custom_prompts', $custom_prompts);
        }

        // Limpiar cache
        unset($this->prompt_cache[$this->type_map[$type_key]]);

        return true;
    }

    /**
     * Obtener prompt actual (personalizado o por defecto)
     */
    public function get_current_prompt($opportunity_type) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return '';
        }

        // Verificar si existe prompt personalizado
        $custom_prompts = get_option('gellobit_rss_custom_prompts', []);
        if (!empty($custom_prompts[$type_key])) {
            return $custom_prompts[$type_key];
        }

        // Retornar prompt por defecto
        return $this->get_default_prompt($opportunity_type);
    }

    /**
     * Obtener mapa de tipos
     */
    public function get_type_map() {
        return $this->type_map;
    }

    /**
     * Verificar si un prompt está personalizado
     */
    public function is_customized($opportunity_type) {
        $type_key = strtolower(trim($opportunity_type));
        if (empty($type_key) || !isset($this->type_map[$type_key])) {
            return false;
        }

        $custom_prompts = get_option('gellobit_rss_custom_prompts', []);
        return isset($custom_prompts[$type_key]) && !empty($custom_prompts[$type_key]);
    }
}
?>
