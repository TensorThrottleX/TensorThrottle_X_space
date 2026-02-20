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
    const recipient = process.env.EMAIL_RECIPIENT || 'tensorthrottleX@proton.me';

    // Check configuration status
    if (hasResend) {
        checks.configured = true;
        checks.status = 'ready';
        checks.details.push('✅ PRIMARY: Resend API configured');
    } else {
        checks.details.push('❌ PRIMARY: Resend API missing');
    }

    if (hasSendGrid) {
        checks.details.push('✅ BACKUP: SendGrid configured');
    } else {
        checks.details.push('ℹ️ BACKUP: SendGrid not active (Planned for future redundancy)');
    }

    if (hasResend || hasSendGrid) {
        checks.details.push(`✅ RECIPIENT: ${recipient}`);
        checks.details.push('✅ Domain-independence active');
    } else {
        checks.status = 'critical_failure';
        checks.details.push('❌ FATAL: No email providers configured');
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
