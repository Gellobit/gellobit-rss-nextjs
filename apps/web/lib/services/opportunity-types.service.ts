import { createAdminClient } from '../utils/supabase-admin';
import { OpportunityTypeRecord } from '../types/database.types';

export interface CreateOpportunityTypeData {
    slug: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface UpdateOpportunityTypeData {
    name?: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
    is_active?: boolean;
    display_order?: number;
}

export interface OpportunityTypeOption {
    value: string;
    label: string;
    color?: string;
    icon?: string;
}

class OpportunityTypesService {
    private cache: OpportunityTypeRecord[] | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_TTL = 60000; // 1 minute

    /**
     * Get all opportunity types
     */
    async getAll(includeInactive = false): Promise<OpportunityTypeRecord[]> {
        // Check cache first
        if (this.cache && Date.now() < this.cacheExpiry && !includeInactive) {
            return this.cache;
        }

        const supabase = createAdminClient();
        let query = supabase
            .from('opportunity_types')
            .select('*')
            .order('display_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching opportunity types:', error);
            return this.getDefaultTypes();
        }

        // Update cache only for active types
        if (!includeInactive) {
            this.cache = data || [];
            this.cacheExpiry = Date.now() + this.CACHE_TTL;
        }

        return data || [];
    }

    /**
     * Get opportunity types as options for dropdowns
     */
    async getOptions(includeInactive = false): Promise<OpportunityTypeOption[]> {
        const types = await this.getAll(includeInactive);
        return types.map(t => ({
            value: t.slug,
            label: t.name,
            color: t.color,
            icon: t.icon || undefined,
        }));
    }

    /**
     * Get a single opportunity type by slug
     */
    async getBySlug(slug: string): Promise<OpportunityTypeRecord | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('opportunity_types')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error(`Error fetching opportunity type ${slug}:`, error);
            return null;
        }

        return data;
    }

    /**
     * Get a single opportunity type by ID
     */
    async getById(id: string): Promise<OpportunityTypeRecord | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('opportunity_types')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching opportunity type by id ${id}:`, error);
            return null;
        }

        return data;
    }

    /**
     * Create a new opportunity type
     */
    async create(data: CreateOpportunityTypeData): Promise<OpportunityTypeRecord | null> {
        const supabase = createAdminClient();

        // Validate slug format
        if (!this.isValidSlug(data.slug)) {
            throw new Error('Invalid slug format. Use lowercase letters, numbers, and underscores only.');
        }

        // Check for duplicate slug
        const existing = await this.getBySlug(data.slug);
        if (existing) {
            throw new Error(`Opportunity type with slug "${data.slug}" already exists.`);
        }

        // Get next display order if not provided
        if (data.display_order === undefined) {
            const types = await this.getAll(true);
            data.display_order = Math.max(...types.map(t => t.display_order), 0) + 1;
        }

        const { data: newType, error } = await supabase
            .from('opportunity_types')
            .insert({
                slug: data.slug,
                name: data.name,
                description: data.description || null,
                color: data.color || '#3B82F6',
                icon: data.icon || null,
                is_active: data.is_active ?? true,
                is_system: false, // User-created types are never system types
                display_order: data.display_order,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating opportunity type:', error);
            throw new Error(`Failed to create opportunity type: ${error.message}`);
        }

        // Clear cache
        this.clearCache();

        return newType;
    }

    /**
     * Update an opportunity type
     */
    async update(id: string, data: UpdateOpportunityTypeData): Promise<OpportunityTypeRecord | null> {
        const supabase = createAdminClient();

        const { data: updated, error } = await supabase
            .from('opportunity_types')
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating opportunity type:', error);
            throw new Error(`Failed to update opportunity type: ${error.message}`);
        }

        // Clear cache
        this.clearCache();

        return updated;
    }

    /**
     * Delete an opportunity type
     * Note: System types cannot be deleted
     */
    async delete(id: string): Promise<boolean> {
        const supabase = createAdminClient();

        // First check if it's a system type
        const type = await this.getById(id);
        if (!type) {
            throw new Error('Opportunity type not found.');
        }

        if (type.is_system) {
            throw new Error('Cannot delete system opportunity types. You can deactivate them instead.');
        }

        // Check if there are opportunities using this type
        const { count, error: countError } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('opportunity_type', type.slug);

        if (countError) {
            console.error('Error checking opportunities:', countError);
        }

        if (count && count > 0) {
            throw new Error(`Cannot delete: ${count} opportunities are using this type. Deactivate it instead or reassign the opportunities first.`);
        }

        // Check if there are feeds using this type
        const { count: feedCount, error: feedCountError } = await supabase
            .from('rss_feeds')
            .select('id', { count: 'exact', head: true })
            .eq('opportunity_type', type.slug);

        if (feedCountError) {
            console.error('Error checking feeds:', feedCountError);
        }

        if (feedCount && feedCount > 0) {
            throw new Error(`Cannot delete: ${feedCount} feeds are using this type. Update the feeds first.`);
        }

        const { error } = await supabase
            .from('opportunity_types')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting opportunity type:', error);
            throw new Error(`Failed to delete opportunity type: ${error.message}`);
        }

        // Clear cache
        this.clearCache();

        return true;
    }

    /**
     * Toggle active status
     */
    async toggleActive(id: string): Promise<OpportunityTypeRecord | null> {
        const type = await this.getById(id);
        if (!type) {
            throw new Error('Opportunity type not found.');
        }

        return this.update(id, { is_active: !type.is_active });
    }

    /**
     * Reorder opportunity types
     */
    async reorder(orderedIds: string[]): Promise<boolean> {
        const supabase = createAdminClient();

        for (let i = 0; i < orderedIds.length; i++) {
            const { error } = await supabase
                .from('opportunity_types')
                .update({ display_order: i + 1 })
                .eq('id', orderedIds[i]);

            if (error) {
                console.error('Error reordering opportunity types:', error);
                return false;
            }
        }

        // Clear cache
        this.clearCache();

        return true;
    }

    /**
     * Check if a slug is valid
     */
    isValidSlug(slug: string): boolean {
        return /^[a-z][a-z0-9_]*$/.test(slug) && slug.length >= 2 && slug.length <= 50;
    }

    /**
     * Generate a slug from a name
     */
    generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 50);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache = null;
        this.cacheExpiry = 0;
    }

    /**
     * Get default types (fallback if database is unavailable)
     */
    private getDefaultTypes(): OpportunityTypeRecord[] {
        const now = new Date().toISOString();
        return [
            { id: '1', slug: 'contest', name: 'Contest', description: 'Competitions with prizes for winners', color: '#EF4444', icon: null, is_active: true, is_system: true, display_order: 1, created_at: now, updated_at: now },
            { id: '2', slug: 'giveaway', name: 'Giveaway', description: 'Free items or services given away', color: '#22C55E', icon: null, is_active: true, is_system: true, display_order: 2, created_at: now, updated_at: now },
            { id: '3', slug: 'sweepstakes', name: 'Sweepstakes', description: 'Random draw prize opportunities', color: '#8B5CF6', icon: null, is_active: true, is_system: true, display_order: 3, created_at: now, updated_at: now },
            { id: '4', slug: 'dream_job', name: 'Dream Job', description: 'Exceptional job opportunities', color: '#F59E0B', icon: null, is_active: true, is_system: true, display_order: 4, created_at: now, updated_at: now },
            { id: '5', slug: 'get_paid_to', name: 'Get Paid To', description: 'Earn money for tasks or activities', color: '#10B981', icon: null, is_active: true, is_system: true, display_order: 5, created_at: now, updated_at: now },
            { id: '6', slug: 'instant_win', name: 'Instant Win', description: 'Immediate prize notifications', color: '#EC4899', icon: null, is_active: true, is_system: true, display_order: 6, created_at: now, updated_at: now },
            { id: '7', slug: 'job_fair', name: 'Job Fair', description: 'Employment events and career fairs', color: '#6366F1', icon: null, is_active: true, is_system: true, display_order: 7, created_at: now, updated_at: now },
            { id: '8', slug: 'scholarship', name: 'Scholarship', description: 'Educational funding opportunities', color: '#0EA5E9', icon: null, is_active: true, is_system: true, display_order: 8, created_at: now, updated_at: now },
            { id: '9', slug: 'volunteer', name: 'Volunteer', description: 'Volunteer and community service opportunities', color: '#14B8A6', icon: null, is_active: true, is_system: true, display_order: 9, created_at: now, updated_at: now },
            { id: '10', slug: 'free_training', name: 'Free Training', description: 'Free courses and training programs', color: '#F97316', icon: null, is_active: true, is_system: true, display_order: 10, created_at: now, updated_at: now },
            { id: '11', slug: 'promo', name: 'Promo', description: 'Promotional offers and deals', color: '#A855F7', icon: null, is_active: true, is_system: true, display_order: 11, created_at: now, updated_at: now },
        ];
    }
}

// Export singleton instance
export const opportunityTypesService = new OpportunityTypesService();
