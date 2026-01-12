import { createAdminClient } from '../utils/supabase-admin';

interface SystemSettings {
    // General
    'general.automatic_processing': boolean;
    'general.processing_interval': number;
    'general.auto_publish': boolean;
    'general.quality_threshold': number;
    'general.max_posts_per_run': number;
    // Scraping
    'scraping.request_timeout': number;
    'scraping.max_redirects': number;
    'scraping.min_content_length': number;
    'scraping.max_content_length': number;
    'scraping.user_agent': string;
    'scraping.follow_google_feedproxy': boolean;
    // Advanced
    'advanced.log_retention_days': number;
    'advanced.debug_mode': boolean;
}

type SettingKey = keyof SystemSettings;
type SettingValue<K extends SettingKey> = SystemSettings[K];

class SettingsService {
    private cache: Map<string, any> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 60000; // 1 minute

    /**
     * Get a single setting value
     */
    async get<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
        // Check cache first
        if (this.cache.has(key) && Date.now() < (this.cacheExpiry.get(key) || 0)) {
            return this.cache.get(key);
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            console.error(`Error fetching setting ${key}:`, error);
            return this.getDefault(key);
        }

        // Parse JSONB value
        const value = this.parseValue(data.value);

        // Update cache
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

        return value;
    }

    /**
     * Get multiple settings at once
     */
    async getMany<K extends SettingKey>(keys: K[]): Promise<Partial<SystemSettings>> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', keys);

        if (error || !data) {
            console.error('Error fetching settings:', error);
            return {};
        }

        const settings: any = {};
        for (const row of data) {
            settings[row.key] = this.parseValue(row.value);
            // Update cache
            this.cache.set(row.key, settings[row.key]);
            this.cacheExpiry.set(row.key, Date.now() + this.CACHE_TTL);
        }

        return settings;
    }

    /**
     * Get all settings in a category
     */
    async getCategory(category: 'general' | 'scraping' | 'advanced'): Promise<Record<string, any>> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .eq('category', category);

        if (error || !data) {
            console.error(`Error fetching ${category} settings:`, error);
            return this.getDefaultCategory(category);
        }

        const settings: Record<string, any> = {};
        for (const row of data) {
            const shortKey = row.key.replace(`${category}.`, '');
            settings[shortKey] = this.parseValue(row.value);
            // Update cache
            this.cache.set(row.key, settings[shortKey]);
            this.cacheExpiry.set(row.key, Date.now() + this.CACHE_TTL);
        }

        return settings;
    }

    /**
     * Set a single setting value
     */
    async set<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<boolean> {
        const supabase = createAdminClient();

        // Store as JSONB
        const { error } = await supabase
            .from('system_settings')
            .update({
                value: JSON.stringify(value),
                updated_at: new Date().toISOString(),
            })
            .eq('key', key);

        if (error) {
            console.error(`Error setting ${key}:`, error);
            return false;
        }

        // Update cache
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

        return true;
    }

    /**
     * Set multiple settings at once
     */
    async setMany(settings: Partial<Record<SettingKey, any>>): Promise<boolean> {
        const supabase = createAdminClient();

        for (const [key, value] of Object.entries(settings)) {
            const { error } = await supabase
                .from('system_settings')
                .update({
                    value: JSON.stringify(value),
                    updated_at: new Date().toISOString(),
                })
                .eq('key', key);

            if (error) {
                console.error(`Error setting ${key}:`, error);
                return false;
            }

            // Update cache
            this.cache.set(key, value);
            this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
        }

        return true;
    }

    /**
     * Clear cache (useful after bulk updates)
     */
    clearCache(): void {
        this.cache.clear();
        this.cacheExpiry.clear();
    }

    /**
     * Parse JSONB value to proper type
     */
    private parseValue(value: any): any {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }

    /**
     * Get default value for a setting
     */
    private getDefault<K extends SettingKey>(key: K): SettingValue<K> {
        const defaults: SystemSettings = {
            'general.automatic_processing': true,
            'general.processing_interval': 60,
            'general.auto_publish': false,
            'general.quality_threshold': 0.7,
            'general.max_posts_per_run': 10,
            'scraping.request_timeout': 10000,
            'scraping.max_redirects': 5,
            'scraping.min_content_length': 100,
            'scraping.max_content_length': 50000,
            'scraping.user_agent': 'Gellobit RSS Bot/1.0',
            'scraping.follow_google_feedproxy': true,
            'advanced.log_retention_days': 30,
            'advanced.debug_mode': false,
        };
        return defaults[key];
    }

    /**
     * Get default values for a category
     */
    private getDefaultCategory(category: string): Record<string, any> {
        const defaults: Record<string, any> = {
            general: {
                automatic_processing: true,
                processing_interval: 60,
                auto_publish: false,
                quality_threshold: 0.7,
                max_posts_per_run: 10,
            },
            scraping: {
                request_timeout: 10000,
                max_redirects: 5,
                min_content_length: 100,
                max_content_length: 50000,
                user_agent: 'Gellobit RSS Bot/1.0',
                follow_google_feedproxy: true,
            },
            advanced: {
                log_retention_days: 30,
                debug_mode: false,
            },
        };
        return defaults[category] || {};
    }
}

// Export singleton instance
export const settingsService = new SettingsService();
