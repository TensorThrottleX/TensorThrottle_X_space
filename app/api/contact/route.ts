import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

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

    // Required: identity
    if (!body.identity || typeof body.identity !== 'string') {
        errors.push('Identity is required');
    } else if (body.identity.trim().length < 2) {
        errors.push('Identity must be at least 2 characters');
    } else if (body.identity.trim().length > 100) {
        errors.push('Identity must not exceed 100 characters');
    } else if (body.identity.trim() === '') {
        errors.push('Identity cannot be empty');
    }

    // Required: message
    if (!body.message || typeof body.message !== 'string') {
        errors.push('Message is required');
    } else if (body.message.trim().length < 5) {
        errors.push('Message must be at least 5 characters');
    } else if (body.message.trim().length > 10000) {
        errors.push('Message must not exceed 10,000 characters');
    } else if (body.message.trim() === '') {
        errors.push('Message cannot be empty');
    }

    // Optional but validated: email
    if (body.email) {
        if (typeof body.email !== 'string') {
            errors.push('Email must be a string');
        } else if (body.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            errors.push('Invalid email format');
        } else if (body.email.length > 254) {
            errors.push('Email must not exceed 254 characters');
        }
    }

    // Protocol checkbox (assuming frontend sends this)
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

    // 1. Honeypot Detection
    if (body.h_field || body.honeypot || body._trap) {
        console.warn(`[SECURITY] Honeypot triggered from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Bot detected' };
    }

    // 2. IP-based Rate Limiting (3 requests / 5 minutes)
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes

    let attempts = rateLimits.get(ip) || [];
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (attempts.length >= 3) {
        console.warn(`[SECURITY] Rate limit exceeded from IP: ${ip}`);
        return { allowed: false, severity: 2, reason: 'Rate limit exceeded' };
    }

    attempts.push(now);
    rateLimits.set(ip, attempts);

    // 3. Profanity Detection (English + Hindi patterns)
    const profanityPatterns = [
        /\bf+u+c+k+\b/gi,
        /\bs+h+i+t+\b/gi,
        /\bb+i+t+c+h+\b/gi,
        /\ba+s+s+h+o+l+e+\b/gi,
        /\bc+u+n+t+\b/gi,
        /\bd+i+c+k+\b/gi,
        /\bp+u+s+s+y+\b/gi,
        /\bm+o+t+h+e+r+f+u+c+k+e+r+\b/gi,
        /\bb+a+s+t+a+r+d+\b/gi,
        /\bp+r+i+c+k+\b/gi,
        /\bs+l+u+t+\b/gi,
        /\bw+h+o+r+e+\b/gi,
        // Hindi patterns
        /\bm+a+d+a+r+c+h+o+d+\b/gi,
        /\bb+h+e+n+c+h+o+d+\b/gi,
        /\bc+h+u+t+i+y+a+\b/gi,
        /\bg+a+n+d+u+\b/gi,
        /\bh+a+r+a+m+i+\b/gi,
        /\bb+h+o+s+d+i+k+e+\b/gi,
        /\br+a+n+d+i+\b/gi,
        /\bs+a+a+l+a+\b/gi,
        /\bmc\b/gi,
        /\bbc\b/gi,
    ];

    const message = (body.message || '').toLowerCase();
    const identity = (body.identity || '').toLowerCase();
    const combinedText = `${message} ${identity}`;

    for (const pattern of profanityPatterns) {
        if (pattern.test(combinedText)) {
            console.warn(`[SECURITY] Profanity detected from IP: ${ip}`);
            return { allowed: false, severity: 2, reason: 'Prohibited language detected' };
        }
    }

    // 4. Payload Size Enforcement
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 50000) { // 50KB limit
        console.warn(`[SECURITY] Payload size exceeded from IP: ${ip}: ${payloadSize} bytes`);
        return { allowed: false, severity: 2, reason: 'Payload too large' };
    }

    // 5. Basic Injection Pattern Detection
    const injectionPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /eval\(/gi,
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(combinedText)) {
            console.warn(`[SECURITY] Injection pattern detected from IP: ${ip}`);
            return { allowed: false, severity: 1, reason: 'Suspicious patterns detected' };
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

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const environment = process.env.NODE_ENV || 'development';
    const timestamp = new Date().toISOString();

    return {
        timestamp,
        ip,
        userAgent,
        environment
    };
}

// ============================================
// LAYER D — TEMPLATE BUILDER
// ============================================
function buildEmailTemplate(content: EmailPayload, metadata: EmailMetadata): string {
    // Escape HTML to prevent injection
    const escapeHtml = (text: string) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

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
        
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
            🔒 Secure Transmission
          </h1>
        </div>

        <!-- Content Container -->
        <div style="padding: 32px;">
          
          <!-- Sender Information Block -->
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

          <!-- Message Block -->
          <div style="background: #0d0d0d; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">
              Transmission Data
            </h2>
            <div style="color: #cccccc; font-size: 15px; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word;">
${safeMessage}
            </div>
          </div>

          <!-- Metadata Block -->
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

        <!-- Footer -->
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
// LAYER E — DISPATCH LAYER
// ============================================
async function sendEmail(payload: EmailPayload, metadata: EmailMetadata): Promise<{ success: boolean; error?: string }> {
    const htmlContent = buildEmailTemplate(payload, metadata);
    const recipient = process.env.EMAIL_RECIPIENT || 'tensorthrottleX@proton.me';

    // Primary sender configuration
    const primarySender = process.env.PRIMARY_FROM_EMAIL;
    const fallbackSender = process.env.FALLBACK_FROM_EMAIL || 'onboarding@resend.dev';

    // Check if using Resend API
    const useResend = process.env.EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY;

    if (useResend) {
        console.log('[EMAIL] Provider: Resend API');

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Try primary sender first
        if (primarySender) {
            try {
                console.log(`[EMAIL] Primary Attempt: ${primarySender}`);
                await resend.emails.send({
                    from: primarySender,
                    to: [recipient],
                    subject: '🔒 New Secure Transmission Received',
                    html: htmlContent,
                });
                console.log('[EMAIL] Primary Attempt: Success');
                console.log(`[EMAIL] Fallback Used: No`);
                console.log(`[EMAIL] IP: ${metadata.ip}`);
                console.log(`[EMAIL] Timestamp: ${metadata.timestamp}`);
                return { success: true };
            } catch (primaryError: any) {
                console.warn(`[EMAIL] Primary sender failed: ${primaryError.message}`);
                console.log('[EMAIL] Attempting fallback sender...');
            }
        }

        // Try fallback sender
        try {
            console.log(`[EMAIL] Fallback Attempt: ${fallbackSender}`);
            await resend.emails.send({
                from: fallbackSender,
                to: [recipient],
                subject: '🔒 New Secure Transmission Received',
                html: htmlContent,
            });
            console.log('[EMAIL] Fallback Attempt: Success');
            console.log(`[EMAIL] Fallback Used: Yes`);
            console.log(`[EMAIL] IP: ${metadata.ip}`);
            console.log(`[EMAIL] Timestamp: ${metadata.timestamp}`);
            return { success: true };
        } catch (fallbackError: any) {
            console.error(`[EMAIL] Fallback sender failed: ${fallbackError.message}`);
            return { success: false, error: 'Both primary and fallback senders failed' };
        }

    } else {
        // SMTP via Nodemailer
        console.log('[EMAIL] Provider: SMTP (Nodemailer)');

        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('[EMAIL] SMTP credentials missing');
            return { success: false, error: 'SMTP not configured' };
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        try {
            console.log(`[EMAIL] Primary Attempt: ${process.env.EMAIL_USER}`);
            await transporter.sendMail({
                from: `"TensorThrottle X" <${process.env.EMAIL_USER}>`,
                to: recipient,
                subject: '🔒 New Secure Transmission Received',
                html: htmlContent,
            });
            console.log('[EMAIL] Primary Attempt: Success');
            console.log(`[EMAIL] Fallback Used: No`);
            console.log(`[EMAIL] IP: ${metadata.ip}`);
            console.log(`[EMAIL] Timestamp: ${metadata.timestamp}`);
            return { success: true };
        } catch (smtpError: any) {
            console.error(`[EMAIL] SMTP Error: ${smtpError.message}`);
            return { success: false, error: smtpError.message };
        }
    }
}

// ============================================
// MAIN REQUEST HANDLER
// ============================================
export async function POST(req: NextRequest) {
    try {
        // Step 1: Parse JSON
        const body = await req.json();

        // Step 2: Validate
        const validation = validateInput(body);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.errors[0] },
                { status: 400 }
            );
        }

        // Step 3: Security Layer
        const security = securityCheck(body, req);
        if (!security.allowed) {
            const statusCode = security.severity === 2 ? 403 : 400;
            return NextResponse.json(
                { error: security.reason || 'Security check failed' },
                { status: statusCode }
            );
        }

        // Step 4: Build Payload
        const payload: EmailPayload = {
            identity: body.identity.trim(),
            email: body.email?.trim() || undefined,
            message: body.message.trim(),
        };

        // Step 5: Append Metadata
        const metadata = enrichMetadata(req);

        // Step 6: Dispatch Email
        const result = await sendEmail(payload, metadata);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Email transmission failed. Please try again later.' },
                { status: 500 }
            );
        }

        // Step 7: Structured Response
        return NextResponse.json({
            success: true,
            message: 'Transmission successfully delivered',
        });

    } catch (error: any) {
        console.error('[API_ERROR]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
