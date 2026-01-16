import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { emailService } from '@/lib/services/email.service';

// POST - Send test email
export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email address required' }, { status: 400 });
        }

        // Check if email service is configured
        const isConfigured = await emailService.isConfigured();
        if (!isConfigured) {
            return NextResponse.json({
                error: 'Email service not configured. Please save your Resend API key first.',
            }, { status: 400 });
        }

        // Send test email
        const result = await emailService.send({
            to: email,
            subject: 'Test Email from Gellobit',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FFDE59; padding: 24px; text-align: center;">
            <span style="font-size: 24px; font-weight: 900; color: #1a1a1a;">Gellobit</span>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">✅</span>
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px 0; text-align: center;">
                Email Configuration Working!
            </h1>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
                This is a test email from your Gellobit application. If you're receiving this, your email configuration is set up correctly.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="font-size: 13px; color: #64748b; text-align: center;">
                Sent at: ${new Date().toLocaleString()}
            </p>
        </div>
        <div style="padding: 24px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">Gellobit - Verified USA Opportunities</p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (result.success) {
            return NextResponse.json({ success: true, id: result.id });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
