import { NextResponse } from 'next/server';
import { opportunityTypesService } from '@/lib/services/opportunity-types.service';

/**
 * GET /api/opportunity-types
 * Public endpoint to list all active opportunity types
 */
export async function GET() {
    try {
        const types = await opportunityTypesService.getOptions(false);

        return NextResponse.json({ types }, { status: 200 });
    } catch (error) {
        console.error('Error fetching opportunity types:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
