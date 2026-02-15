import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

    if (body.h_field || body.honeypot || body._trap) {
        console.warn(`[SECURITY] Honeypot triggered from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Bot detected' };
    }

    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    let attempts = rateLimits.get(ip) || [];
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (attempts.length >= 3) {
        console.warn(`[SECURITY] Rate limit exceeded from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Rate limit exceeded' };
    }

    attempts.push(now);
    rateLimits.set(ip, attempts);

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
            console.warn(`[SECURITY] Profanity detected from IP: ${ip}`);
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
                <td style="padding: 6px 0; color: #666; font-size: 11px;">IP ADDRESS</td>
                <td style="padding: 6px 0; color: #999; font-size: 11px;">${metadata.ip}</td>
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
// MAIN REQUEST HANDLER
// ============================================
export async function POST(req: NextRequest) {
    // 4. Enforce Environment Safety
    if (!process.env.RESEND_API_KEY) {
        console.error('[EMAIL] RESEND_API_KEY not configured');
        return NextResponse.json(
            { error: 'Server misconfiguration: email service unavailable.' },
            { status: 500 }
        );
    }

    // 2. Enforce Verified Domain Sender
    const FROM_EMAIL = process.env.PRIMARY_FROM_EMAIL;

    if (!FROM_EMAIL) {
        console.error('[EMAIL] PRIMARY_FROM_EMAIL missing in environment');
        return NextResponse.json(
            { error: 'Server misconfiguration: sender not defined.' },
            { status: 500 }
        );
    }

    if (!process.env.EMAIL_RECIPIENT) {
        console.error('[EMAIL] EMAIL_RECIPIENT missing in environment');
        return NextResponse.json(
            { error: 'Server misconfiguration: recipient not defined.' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();

        const validation = validateInput(body);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.errors[0] },
                { status: 400 }
            );
        }

        const security = securityCheck(body, req);
        if (!security.allowed) {
            return NextResponse.json(
                { error: security.reason || 'Security check failed' },
                { status: security.severity === 2 ? 403 : 400 }
            );
        }

        const payload: EmailPayload = {
            identity: body.identity.trim(),
            email: body.email?.trim() || undefined,
            message: body.message.trim(),
        };

        const metadata = enrichMetadata(req);
        const emailHtml = buildEmailTemplate(payload, metadata);

        // 5. Use Official Resend SDK
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: `Tensor Throttle X <${FROM_EMAIL}>`,
            to: (process.env.EMAIL_RECIPIENT as string),
            subject: '🔒 New Secure Transmission Received',
            html: emailHtml,
        });

        // 3. & 6. Enforce Resend Usage Only (No Silent Fallback) & Remove Silent Success Responses
        if (error) {
            console.error('[EMAIL] Resend Error:', error);
            return NextResponse.json(
                { error: 'Email dispatch failed.' },
                { status: 500 }
            );
        }

        if (!data?.id) {
            console.error('[EMAIL] No Transmission ID returned from Resend');
            return NextResponse.json(
                { error: 'Email dispatch failed.' },
                { status: 500 }
            );
        }

        // 5. Log Transmission ID
        console.log('[EMAIL] Transmission ID:', data?.id);

        return NextResponse.json({
            success: true,
            message: 'Transmission successfully delivered',
            transmissionId: data.id
        });

    } catch (error: any) {
        console.error('[API_ERROR]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
