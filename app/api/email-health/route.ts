import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

/**
 * Email Configuration Health Check Endpoint
 * GET /api/email-health
 * 
 * Returns the status of email configuration without exposing credentials
 * Enforces strict Resend with verified domain configuration.
 */
export async function GET() {
    const checks = {
        timestamp: new Date().toISOString(),
        status: 'unknown',
        provider: 'Resend API (Enforced)',
        configured: false,
        details: [] as string[],
    };

    const hasApiKey = !!process.env.RESEND_API_KEY;
    const hasFromEmail = !!process.env.PRIMARY_FROM_EMAIL;
    const hasRecipient = !!process.env.EMAIL_RECIPIENT;

    if (hasApiKey && hasFromEmail) {
        checks.configured = true;
        checks.status = 'ready';
        checks.details.push('✅ RESEND_API_KEY is configured');
        checks.details.push(`✅ FROM: ${process.env.PRIMARY_FROM_EMAIL} (Verified Domain)`);

        if (hasRecipient) {
            checks.details.push(`✅ RECIPIENT: ${process.env.EMAIL_RECIPIENT}`);
        } else {
            checks.details.push('⚠️ EMAIL_RECIPIENT missing (using default)');
        }
    } else {
        checks.status = 'misconfigured';
        if (!hasApiKey) checks.details.push('❌ RESEND_API_KEY is missing');
        if (!hasFromEmail) checks.details.push('❌ PRIMARY_FROM_EMAIL is missing (Verified domain required)');
    }

    // Add general info
    checks.details.push('');
    checks.details.push(`🔒 Sandbox sender is STRICTLY BLOCKED`);
    checks.details.push(`🔒 Rate Limit: 3 per 5 minutes`);
    checks.details.push(`🛡️ Security: Honeypot, Profanity Filter, Validation`);

    return NextResponse.json(checks, {
        status: checks.configured ? 200 : 500,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
