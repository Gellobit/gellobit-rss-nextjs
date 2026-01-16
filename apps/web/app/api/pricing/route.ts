import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/pricing
 * Returns public pricing configuration for the pricing page
 */
export async function GET() {
    try {
        const supabase = createAdminClient();

        // Fetch membership pricing settings
        const { data: settingsData, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .eq('category', 'membership')
            .in('key', [
                'membership.monthly_price',
                'membership.annual_price',
                'membership.paypal_enabled',
                'membership.paypal_client_id',
                'membership.paypal_plan_id_monthly',
                'membership.paypal_plan_id_annual',
                'membership.free_content_percentage',
                'membership.free_delay_hours',
                'membership.free_favorites_limit',
                'membership.free_notifications_daily',
            ]);

        if (error) {
            console.error('Error fetching pricing settings:', error);
            return NextResponse.json({
                monthlyPrice: 4.99,
                annualPrice: 39.99,
                paypalEnabled: false,
                paypalClientId: null,
                paypalPlanIdMonthly: null,
                paypalPlanIdAnnual: null,
                freeContentPercentage: 60,
                freeDelayHours: 24,
                freeFavoritesLimit: 5,
                freeNotificationsDaily: 1,
            });
        }

        // Parse settings into a clean object
        const settings: Record<string, any> = {};
        for (const row of settingsData || []) {
            const shortKey = row.key.replace('membership.', '');
            let value = row.value;

            // Parse JSON values
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            settings[shortKey] = value;
        }

        return NextResponse.json({
            monthlyPrice: Number(settings.monthly_price) || 4.99,
            annualPrice: Number(settings.annual_price) || 39.99,
            paypalEnabled: settings.paypal_enabled === true || settings.paypal_enabled === 'true',
            paypalClientId: settings.paypal_client_id || null,
            paypalPlanIdMonthly: settings.paypal_plan_id_monthly || null,
            paypalPlanIdAnnual: settings.paypal_plan_id_annual || null,
            freeContentPercentage: Number(settings.free_content_percentage) || 60,
            freeDelayHours: Number(settings.free_delay_hours) || 24,
            freeFavoritesLimit: Number(settings.free_favorites_limit) || 5,
            freeNotificationsDaily: Number(settings.free_notifications_daily) || 1,
        });
    } catch (error) {
        console.error('Error fetching pricing:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pricing' },
            { status: 500 }
        );
    }
}
