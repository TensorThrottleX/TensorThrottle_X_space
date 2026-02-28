import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ============================================
// RUNTIME CONFIGURATION
// ============================================
export const runtime = "nodejs";

// ============================================
// TYPES & INTERFACES
// ============================================
interface ValidationResult {
    valid: boolean;
    errors: string[];
}

interface SecurityResult {
    allowed: boolean;
    severity: 0 | 1 | 2;
    reason?: string;
}

interface EmailPayload {
    identity: string;
    email?: string;
    message: string;
}

interface EmailMetadata {
    timestamp: string;
    ip: string;
    userAgent: string;
    environment: string;
}

// ============================================
// LAYER A — VALIDATION (Non-Bypassable)
// ============================================
function validateInput(body: any): ValidationResult {
    const errors: string[] = [];

    if (!body.identity || typeof body.identity !== 'string') {
        errors.push('Identity is required');
    } else if (body.identity.trim().length < 2) {
        errors.push('Identity must be at least 2 characters');
    }

    if (!body.message || typeof body.message !== 'string') {
        errors.push('Message is required');
    } else if (body.message.trim().length < 5) {
        errors.push('Message must be at least 5 characters');
    }

    if (body.email && typeof body.email === 'string' && body.email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            errors.push('Invalid email format');
        }
    }

    if (!body.protocol || body.protocol !== true) {
        errors.push('Protocol acceptance is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// ============================================
// LAYER B — SECURITY LAYER
// ============================================
const rateLimits = new Map<string, number[]>();

function securityCheck(body: any, request: NextRequest): SecurityResult {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    // 1. Honeypot check
    if (body.h_field || body.honeypot || body._trap) {
        console.warn(`[SECURITY] Honeypot triggered from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Bot detected' };
    }

    // 2. Time-based validation (requires form to be active for at least 2s)
    const elapsedMs = parseInt(body.load_time || '0', 10);
    if (isNaN(elapsedMs) || elapsedMs < 2000) { // < 2 seconds is suspicious
        console.warn(`[SECURITY] Fast submission (Time-based validation) from IP: ${ip}. Elapsed: ${elapsedMs}ms`);
        return { allowed: false, severity: 2, reason: 'Submission too fast' };
    }

    // 3. Rate limiting
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    let attempts = rateLimits.get(ip) || [];
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (attempts.length >= 10) {
        console.warn(`[SECURITY] Rate limit exceeded from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Rate limit exceeded' };
    }

    attempts.push(now);
    rateLimits.set(ip, attempts);

    // 4. Link density check
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
    const links = (body.message || '').match(urlRegex) || [];
    if (links.length > 3) {
        console.warn(`[SECURITY] High link density (${links.length} links) from IP: ${ip}`);
        return { allowed: false, severity: 1, reason: 'Message contains too many links' };
    }

    // 5. Profanity / Blacklist pattern scan
    const profanityPatterns = [
        /\bf+u+c+k+\b/gi, /\bs+h+i+t+\b/gi, /\bb+i+t+c+h+\b/gi,
        /\ba+s+s+h+o+l+e+\b/gi, /\bc+u+n+t+\b/gi, /\bd+i+c+k+\b/gi,
        /\bp+u+s+s+y+\b/gi, /\bm+o+t+h+e+r+f+u+c+k+e+r+\b/gi,
        /\bb+a+s+t+a+r+d+\b/gi, /\bp+r+i+c+k+\b/gi, /\bs+l+u+t+\b/gi,
        /\bw+h+o+r+e+\b/gi,
        /\bm+a+d+a+r+c+h+o+d+\b/gi, /\bb+h+e+n+c+h+o+d+\b/gi,
        /\bc+h+u+t+i+y+a+\b/gi, /\bg+a+n+d+u+\b/gi, /\bh+a+r+a+m+i+\b/gi,
        /\bb+h+o+s+d+i+k+e+\b/gi, /\br+a+n+d+i+\b/gi, /\bs+a+a+l+a+\b/gi,
        /\bmc\b/gi, /\bbc\b/gi,
    ];

    const combinedText = `${(body.message || '')} ${(body.identity || '')}`.toLowerCase();
    for (const pattern of profanityPatterns) {
        if (pattern.test(combinedText)) {
            console.warn(`[SECURITY] Blacklisted pattern detected from IP: ${ip}`);
            return { allowed: false, severity: 2, reason: 'Prohibited language detected' };
        }
    }

    return { allowed: true, severity: 0 };
}

// ============================================
// LAYER C — METADATA ENRICHMENT
// ============================================
function enrichMetadata(request: NextRequest): EmailMetadata {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    return {
        timestamp: new Date().toISOString(),
        ip,
        userAgent: request.headers.get('user-agent') || 'Unknown',
        environment: process.env.NODE_ENV || 'development'
    };
}

// ============================================
// LAYER D — TEMPLATE BUILDER
// ============================================
function buildEmailTemplate(content: EmailPayload, metadata: EmailMetadata): string {
    const escapeHtml = (text: string) => text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const safeIdentity = escapeHtml(content.identity);
    const safeEmail = content.email ? escapeHtml(content.email) : 'Not Provided';
    const safeMessage = escapeHtml(content.message);
    const ipHash = crypto.createHash('sha256').update(metadata.ip).digest('hex').substring(0, 12);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure Transmission</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Courier New', Consolas, monospace;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border: 1px solid #333; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);">
        
        <div style="background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
            🔒 Secure Transmission
          </h1>
        </div>

        <div style="padding: 32px;">
          <div style="background: #111111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #06b6d4; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #222; padding-bottom: 8px;">
              Sender Information
            </h2>
            <div style="margin-bottom: 12px;">
              <span style="color: #888; font-size: 12px; display: block; margin-bottom: 4px;">IDENTITY</span>
              <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${safeIdentity}</span>
            </div>
            <div>
              <span style="color: #888; font-size: 12px; display: block; margin-bottom: 4px;">RETURN EMAIL</span>
              <span style="color: #06b6d4; font-size: 14px;">${safeEmail}</span>
            </div>
          </div>

          <div style="background: #0d0d0d; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">
              Transmission Data
            </h2>
            <div style="color: #cccccc; font-size: 15px; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">
${safeMessage}
            </div>
          </div>

          <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1a1a1a; padding-bottom: 8px;">
              System Metadata
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 11px; width: 140px;">TIMESTAMP</td>
                <td style="padding: 6px 0; color: #999; font-size: 11px;">${metadata.timestamp}</td>
               </tr>
               <tr>
                <td style="padding: 6px 0; color: #666; font-size: 11px;">IP HASH</td>
                <td style="padding: 6px 0; color: #999; font-size: 11px;">${ipHash}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 11px;">USER AGENT</td>
                <td style="padding: 6px 0; color: #999; font-size: 11px; word-break: break-all;">${escapeHtml(metadata.userAgent)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 11px;">ENVIRONMENT</td>
                <td style="padding: 6px 0; color: #999; font-size: 11px; text-transform: uppercase;">${metadata.environment}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background: #0a0a0a; padding: 16px; text-align: center; border-top: 1px solid #1a1a1a;">
          <p style="margin: 0; color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
            TensorThrottle X — Secure Communication Protocol
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// LAYER E — DISPATCH LAYER (MULTI-RELAY)
// ============================================

interface DispatchResult {
    success: boolean;
    relay: 'Resend' | 'SendGrid' | 'SMTP' | 'None';
    messageId?: string;
    error?: string;
}

// RELAY 1: Resend (Primary)
async function sendViaResend(
    payload: EmailPayload,
    htmlContent: string,
    recipients: string[]
): Promise<DispatchResult> {
    if (!process.env.RESEND_API_KEY) return { success: false, relay: 'None', error: 'Missing Configuration' };

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        // Ensure strictly configured sender identity
        const SYSTEM_SENDER = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || process.env.PRIMARY_FROM_EMAIL || 'noreply@system-relay.com';

        const { data, error } = await resend.emails.send({
            from: `Tensor Relay <${SYSTEM_SENDER}>`,
            to: recipients,
            replyTo: payload.email, // Dynamic user identity
            subject: `[Project Contact] ${payload.identity}`, // Consistent prefix
            html: htmlContent,
            headers: {
                'X-Entity-Ref-ID': crypto.randomUUID(),
            },
            tags: [
                { name: 'category', value: 'contact_form' },
                { name: 'environment', value: process.env.NODE_ENV || 'development' }
            ]
        });

        if (error) {
            return {
                success: false,
                relay: 'Resend',
                error: error.message
            };
        }

        return {
            success: true,
            relay: 'Resend',
            messageId: data?.id || 'resend-id'
        };
    } catch (err: any) {
        return {
            success: false,
            relay: 'Resend',
            error: err.message || 'Unknown error'
        };
    }
}

// RELAY 2: SendGrid (Secondary Fallback)
async function sendViaSendGrid(
    payload: EmailPayload,
    htmlContent: string,
    recipients: string[]
): Promise<DispatchResult> {
    if (!process.env.SENDGRID_API_KEY) return { success: false, relay: 'None', error: 'Missing SendGrid Configuration' };

    try {
        const SYSTEM_SENDER = process.env.SENDGRID_FROM || 'noreply@system-relay.com';

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: recipients.map(email => ({ email }))
                }],
                from: { email: SYSTEM_SENDER, name: 'Tensor Fallback Relay' },
                reply_to: { email: payload.email || SYSTEM_SENDER },
                subject: `[Project Contact] ${payload.identity}`,
                content: [{
                    type: 'text/html',
                    value: htmlContent
                }],
                tracking_settings: {
                    click_tracking: { enable: false },
                    open_tracking: { enable: false }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                relay: 'SendGrid',
                error: JSON.stringify(errorData.errors || 'Unknown SendGrid Error')
            };
        }

        return {
            success: true,
            relay: 'SendGrid',
            messageId: response.headers.get('x-message-id') || 'sendgrid-queued'
        };
    } catch (err: any) {
        return {
            success: false,
            relay: 'SendGrid',
            error: err.message || 'Fetch error'
        };
    }
}

// RELAY 3: Standard SMTP (Gmail, Outlook, etc.)
async function sendViaSMTP(
    payload: EmailPayload,
    htmlContent: string,
    recipients: string[]
): Promise<DispatchResult> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return { success: false, relay: 'None', error: 'Missing SMTP Configuration' };
    }

    try {
        const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const info = await transport.sendMail({
            from: `"TensorThrottle Contact" <${process.env.EMAIL_USER}>`,
            to: recipients.join(', '), // Nodemailer supports comma-separated string or array
            replyTo: payload.email,
            subject: `[Project Contact] ${payload.identity}`,
            html: htmlContent,
        });

        return {
            success: true,
            relay: 'SMTP',
            messageId: info.messageId
        };
    } catch (err: any) {
        return {
            success: false,
            relay: 'SMTP',
            error: err.message || 'SMTP Error'
        };
    }
}

// ============================================
// MAIN REQUEST HANDLER
// ============================================
export async function POST(req: NextRequest) {
    console.log('[API_CONTACT] Request received');

    // Anchored destination (Support for multiple comma-separated emails)
    const rawRecipients = process.env.EMAIL_RECIPIENT || 'tensorthrottleX@proton.me';
    const RECIPIENTS = rawRecipients.split(',').map(e => e.trim()).filter(Boolean);

    // Structured Logging Placeholder
    let logData: any = {
        timestamp: new Date().toISOString(),
        status: "pending",
        relayUsed: null,
        fallbackTriggered: false,
        validationPassed: false,
        ipHash: null,
        error: null
    };

    try {
        const body = await req.json();

        // 1. Validation
        const validation = validateInput(body);
        if (!validation.valid) {
            console.warn(`[EMAIL] Validation Failed: ${validation.errors[0]}`);
            return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
        }
        logData.validationPassed = true;

        // 2. Security
        const security = securityCheck(body, req);
        const metadata = enrichMetadata(req);
        // Hash IP for logs (Privacy)
        const ipHash = crypto.createHash('sha256').update(metadata.ip).digest('hex').substring(0, 12);
        logData.ipHash = ipHash;

        if (!security.allowed) {
            logData.status = "blocked";
            logData.error = security.reason;
            console.warn(`[SECURITY] Blocked: ${JSON.stringify(logData)}`);
            return NextResponse.json(
                { error: security.reason || 'Security check failed' },
                { status: security.severity === 2 ? 403 : 400 }
            );
        }

        // 3. Preparation
        const payload: EmailPayload = {
            identity: body.identity.trim(),
            email: body.email?.trim() || undefined,
            message: body.message.trim(),
        };

        const emailHtml = buildEmailTemplate(payload, metadata);

        // 4. Dispatch (Multi-Relay Strategy)
        let dispatch: DispatchResult;

        // ATTEMPT 1: Resend
        console.log(`[EMAIL] Attempting primary relay (Resend)...`);
        dispatch = await sendViaResend(payload, emailHtml, RECIPIENTS);

        if (!dispatch.success) {
            logData.primaryError = dispatch.error;
            logData.fallbackTriggered = true;
            console.warn(`[EMAIL] Primary relay failed: ${dispatch.error}. Activating secondary relay (SendGrid)...`);

            // ATTEMPT 2: SendGrid
            dispatch = await sendViaSendGrid(payload, emailHtml, RECIPIENTS);

            if (!dispatch.success) {
                console.warn(`[EMAIL] Secondary relay failed: ${dispatch.error}. Activating tertiary relay (SMTP)...`);

                // ATTEMPT 3: SMTP (Gmail/Custom)
                dispatch = await sendViaSMTP(payload, emailHtml, RECIPIENTS);

                if (!dispatch.success) {
                    console.warn(`[EMAIL] Tertiary relay failed: ${dispatch.error}.`);

                    // Log the unsent message locally so it's not lost out of nowhere
                    console.log('\n--- FAILED EMAIL TRANSMISSION SINK ---');
                    console.log(`From: ${payload.identity} <${payload.email || 'No Email'}>`);
                    console.log(`Message:\n${payload.message}`);
                    console.log('--------------------------------------\n');

                    // Provide a more detailed error if possible, but keep it clean for the user
                    dispatch.error = `Secure channel routing is currently unavailable. (Primary: ${logData.primaryError || 'Service Error'})`;
                }
            }
        }

        // 5. Final Reporting
        logData.status = dispatch.success ? "sent" : "failed";
        logData.relayUsed = dispatch.relay;
        logData.messageId = dispatch.messageId;
        logData.error = dispatch.error;

        console.log(JSON.stringify(logData)); // Structured log output

        if (!dispatch.success) {
            console.error(`[CRITICAL] All relays failed. Client given normalized error.`);
            return NextResponse.json(
                { error: dispatch.error || 'Transmission routing unavailable' },
                { status: 503 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Transmission successfully delivered',
            transmissionId: dispatch.messageId,
            relay: dispatch.relay
        });

    } catch (error: any) {
        console.error('[API_ERROR]', error);
        logData.status = "failed";
        logData.error = error.message;
        console.log(JSON.stringify(logData));

        return NextResponse.json(
            { error: 'An unexpected system error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
