import { NextRequest, NextResponse } from 'next/server';
import { validateInput, securityCheck, enrichMetadata } from '@/lib/email/email-guard';
import { sendEmail } from '@/lib/email/email-service';
import { logTransition } from '@/lib/email/email-logger';

/**
 * [DISPATCH_SYSTEM] — Primary Contact Entry Point
 * 
 * Optimized to use the Decoupled Email Engine.
 * Single Relay: Resend (Primary)
 * Security: Multi-layered Guard logic
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Structural Validation
        const validation = validateInput(body);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
        }

        // 2. Security Guard (Rate limits, bot detection, content scanning)
        const security = securityCheck(body, req);
        const metadata = enrichMetadata(req);

        if (!security.allowed) {
            // Log blocked attempt (Silent failure for bots, clear for users)
            logTransition({
                status: "blocked",
                timestamp: metadata.timestamp,
                validationPassed: true,
                messageId: null,
                ipHash: metadata.ipHash,
                errorCode: 'SECURITY_VIOLATION',
                securityFlags: security.flags
            });

            return NextResponse.json(
                { error: security.reason || 'Security validation failed' },
                { status: security.severity === 2 ? 403 : 400 }
            );
        }

        // 3. Dispatch Transmission
        const payload = {
            identity: body.identity,
            email: body.email,
            message: body.message
        };

        const result = await sendEmail(req, payload);

        // 4. Persistence / Logging
        logTransition({
            status: result.success ? "sent" : "failed",
            timestamp: metadata.timestamp,
            validationPassed: true,
            messageId: result.messageId || null,
            ipHash: metadata.ipHash,
            errorCode: result.error || null,
            securityFlags: security.flags
        });

        if (!result.success) {
            // Check if error is specifically about API key to maintain context from user's report
            const isInvalidKey = result.error?.toLowerCase().includes('api key') || result.error?.toLowerCase().includes('unauthorized');

            return NextResponse.json(
                {
                    error: isInvalidKey
                        ? `Secure channel routing is currently unavailable. (Primary: API key is invalid)`
                        : (result.error || 'Transmission failed')
                },
                { status: 503 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Transmission successfully delivered',
            transmissionId: result.messageId
        });

    } catch (error: any) {
        console.error('[API_FATAL] Error in contact route:', error);
        return NextResponse.json(
            { error: 'An unexpected system error occurred' },
            { status: 500 }
        );
    }
}
