import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

/**
 * Email Configuration Health Check Endpoint
 * GET /api/email-health
 * 
 * Returns the status of email configuration without exposing credentials
 */
export async function GET() {
    const checks = {
        timestamp: new Date().toISOString(),
        status: 'unknown',
        provider: 'unknown',
        configured: false,
        details: [] as string[],
    };

    // Check for Resend configuration
    if (process.env.EMAIL_SERVICE === 'resend') {
        checks.provider = 'Resend API';

        if (process.env.RESEND_API_KEY) {
            checks.configured = true;
            checks.status = 'ready';
            checks.details.push('✅ RESEND_API_KEY is set');
            checks.details.push(`✅ FROM: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}`);
        } else {
            checks.status = 'misconfigured';
            checks.details.push('❌ RESEND_API_KEY is missing');
        }
    }
    // Check for SMTP configuration
    else {
        checks.provider = 'SMTP (Nodemailer)';

        const hasHost = !!process.env.EMAIL_HOST;
        const hasUser = !!process.env.EMAIL_USER;
        const hasPass = !!process.env.EMAIL_PASS;

        if (hasHost && hasUser && hasPass) {
            checks.configured = true;
            checks.status = 'ready';
            checks.details.push(`✅ EMAIL_HOST: ${process.env.EMAIL_HOST}`);
            checks.details.push(`✅ EMAIL_PORT: ${process.env.EMAIL_PORT || '587'}`);
            checks.details.push(`✅ EMAIL_USER: ${process.env.EMAIL_USER?.substring(0, 3)}***`);
            checks.details.push('✅ EMAIL_PASS: ****** (set)');
        } else {
            checks.status = 'misconfigured';
            if (!hasHost) checks.details.push('❌ EMAIL_HOST is missing');
            if (!hasUser) checks.details.push('❌ EMAIL_USER is missing');
            if (!hasPass) checks.details.push('❌ EMAIL_PASS is missing');
        }
    }

    // Add general info
    checks.details.push('');
    checks.details.push(`📧 Destination: tensorthrottleX@proton.me`);
    checks.details.push(`🔒 Rate Limit: 3 per 5 minutes`);
    checks.details.push(`🛡️ Security: Honeypot, Profanity Filter, Validation`);

    return NextResponse.json(checks, {
        status: checks.configured ? 200 : 500,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
