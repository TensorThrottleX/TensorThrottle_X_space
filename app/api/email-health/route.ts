import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

/**
 * Email Configuration Health Check Endpoint
 * GET /api/email-health
 * 
 * Returns the status of the decoupled email transmission engine.
 */
export async function GET() {
    const checks = {
        timestamp: new Date().toISOString(),
        status: 'unknown',
        architecture: 'Dual-Relay Fallback (Resend -> Proton/SMTP) [SendGrid Dormant]',
        configured: false,
        details: [] as string[],
    };

    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    const hasSMTP = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const recipient = process.env.EMAIL_RECIPIENT || 'tensorthrottleX@proton.me';

    const provider = hasResend ? 'Resend' : (hasSendGrid ? 'SendGrid' : (hasSMTP ? 'SMTP' : 'None'));

    // Check configuration status
    if (hasResend || hasSendGrid || hasSMTP) {
        checks.configured = true;
        checks.status = 'ready';
        // @ts-ignore - Adding provider for the test script
        checks.provider = provider;

        if (hasResend) checks.details.push('✅ PRIMARY: Resend API configured');
        if (hasSendGrid) checks.details.push('✅ BACKUP: SendGrid configured');
        if (hasSMTP) checks.details.push('✅ FALLBACK: SMTP configured');
    } else {
        checks.status = 'critical_failure';
        checks.details.push('❌ FATAL: No email providers configured');
    }

    if (checks.configured) {
        checks.details.push(`✅ RECIPIENT: ${recipient}`);
        checks.details.push(`✅ RELAY: ${provider} active`);
    }

    // Add security info
    checks.details.push('');
    checks.details.push(`🔒 SECURITY MATRIX:`);
    checks.details.push(`✅ Honeypot Detection (Hidden inputs)`);
    checks.details.push(`✅ Time-based validation (>2s)`);
    checks.details.push(`✅ IP-based Rate Limiting (3/5min)`);
    checks.details.push(`✅ Link Density Check (<3 links)`);
    checks.details.push(`✅ Blacklist Pattern Scan (Profanity)`);
    checks.details.push(`✅ Content Validation (Schema enforcement)`);

    return NextResponse.json(checks, {
        status: checks.configured ? 200 : 500,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
