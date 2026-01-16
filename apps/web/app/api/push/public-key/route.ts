import { NextResponse } from 'next/server';
import { pushService } from '@/lib/services/push.service';

// GET - Get public VAPID key for client subscription
export async function GET() {
    try {
        const publicKey = await pushService.getPublicKey();

        if (!publicKey) {
            return NextResponse.json(
                { error: 'Push notifications not configured' },
                { status: 503 }
            );
        }

        return NextResponse.json({ publicKey });
    } catch (error) {
        console.error('Error getting public key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
