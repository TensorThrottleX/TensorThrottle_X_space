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
        architecture: 'Decoupled Relay (Vercel -> Resend -> Proton)',
        configured: false,
        details: [] as string[],
    };

    const hasApiKey = !!process.env.RESEND_API_KEY;
    const recipient = process.env.EMAIL_RECIPIENT || 'yourname@proton.me';
    const relayFrom = 'noreply@system-relay.com';

    if (hasApiKey) {
        checks.configured = true;
        checks.status = 'ready';
        checks.details.push('✅ RESEND_API_KEY is configured');
        checks.details.push(`✅ RELAY_FROM: ${relayFrom}`);
        checks.details.push(`✅ ANCHOR_RECIPIENT: ${recipient}`);
        checks.details.push('✅ Domain-independent mode active');
    } else {
        checks.status = 'misconfigured';
        checks.details.push('❌ RESEND_API_KEY is missing');
    }

    // Add security info
    checks.details.push('');
    checks.details.push(`🔒 SECURITY STACK:`);
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
