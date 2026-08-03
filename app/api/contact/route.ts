import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { validateInput, securityCheck, enrichMetadata } from '@/lib/email/email-guard';
import { sendEmail } from '@/lib/email/email-service';
import { logTransition } from '@/lib/email/email-logger';
import { moderateContent } from '@/lib/moderation/decision';

const MAX_BODY_SIZE = 50_000;

const RECENT_TRANSACTIONS = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000;

function payloadHash(payload: { identity: string; email?: string; message: string }): string {
    const content = `${payload.identity}|${payload.email || ''}|${payload.message}`;
    return crypto.createHash('sha256').update(content).digest('hex');
}

function isDuplicate(hash: string): boolean {
    const ts = RECENT_TRANSACTIONS.get(hash);
    if (ts && Date.now() - ts < DEDUP_TTL_MS) return true;
    return false;
}

function markSeen(hash: string): void {
    RECENT_TRANSACTIONS.set(hash, Date.now());
}

/**
 * [DISPATCH_SYSTEM] — Primary Contact Entry Point
 * 
 * Optimized to use the Decoupled Email Engine.
 * Single Relay: Resend (Primary)
 * Security: Multi-layered Guard logic
 */
export async function POST(req: NextRequest) {
    try {
        const raw = await req.text();
        if (raw.length > MAX_BODY_SIZE) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }
        const body = JSON.parse(raw);

        // 1. Structural Validation
        const validation = validateInput(body);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
        }

        // 2. Security Guard (Rate limits, bot detection, content scanning)
        const security = securityCheck(body, req);
        const metadata = enrichMetadata(req);

        if (!security.allowed) {
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

        const payload = {
            identity: body.identity,
            email: body.email,
            message: body.message
        };

        const hash = payloadHash(payload);

        // 3. Duplicate Detection (Idempotency)
        if (isDuplicate(hash)) {
            return NextResponse.json({
                success: true,
                message: 'Transmission successfully delivered'
            });
        }

        // 4. ML Moderation (Server-side final authority)
        try {
            const moderationResult = await moderateContent(`${body.message} ${body.identity}`);

            if (!moderationResult.allow) {
                logTransition({
                    status: "blocked",
                    timestamp: metadata.timestamp,
                    validationPassed: true,
                    messageId: null,
                    ipHash: metadata.ipHash,
                    errorCode: 'MODERATION_VIOLATION',
                    securityFlags: security.flags
                });

                return NextResponse.json(
                    {
                        error: moderationResult.severity === 'high'
                            ? "Severe or offensive language is not allowed."
                            : "Your message contains abusive language. Please revise."
                    },
                    { status: 403 }
                );
            }
        } catch (error) {
            console.warn('[MODERATION] ML moderation unavailable, proceeding without:', error);
        }

        // 5. Dispatch Transmission
        const result = await sendEmail(req, payload);

        // 6. Persistence / Logging
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

        markSeen(hash);

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
