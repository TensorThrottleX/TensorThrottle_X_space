import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { SecurityResult, SecurityFlags, EmailMetadata, ValidationResult } from './email-types';

const rateLimits = new Map<string, number[]>();

// ============================================
// LAYER A — VALIDATION (Non-Bypassable)
// ============================================
export function validateInput(body: any): ValidationResult {
    const errors: string[] = [];

    // Basic Structure
    if (!body || typeof body !== 'object') {
        return { valid: false, errors: ['Invalid Payload Format'] };
    }

    // Protocol Check (Front-end confirmation checkbox)
    if (!body.protocol || body.protocol !== true) {
        errors.push('Protocol acceptance is required');
    }

    // Identity Validation
    if (!body.identity || typeof body.identity !== 'string') {
        errors.push('Identity is required');
    } else {
        const identity = body.identity.trim();
        // Sanitize: Strip control characters and trim
        const cleanIdentity = identity.replace(/[\x00-\x1F\x7F]/g, "").trim(); 
        if (cleanIdentity.length < 2) {
            errors.push('Identity must be at least 2 characters');
        }
    }

    // Message Validation
    if (!body.message || typeof body.message !== 'string') {
        errors.push('Message is required');
    } else {
        const msg = body.message.trim();
        // Sanitize: Strip control characters except newline/tab
        const cleanMsg = msg.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "").trim();
        if (cleanMsg.length < 5) {
            errors.push('Message must be at least 5 characters');
        }
    }

    // Email Format (Optional but strict if present)
    if (body.email && typeof body.email === 'string') {
        const email = body.email.trim();
        if (email !== '') {
            // Updated regex: Basic structure, no spaces, simple domain check
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

// ============================================
// LAYER B — SECURITY GUARD (Spam/Bot/Content Filter)
// ============================================
export function securityCheck(body: any, request: NextRequest): SecurityResult {
    const ip = getRawIp(request);
    
    // Initialize flags
    const flags: SecurityFlags = {
        honeypot: false,
        linkDensity: 0,
        rateLimited: false,
        fastSubmission: false,
        profanity: false
    };

    // 1. Honeypot check (Critical)
    // If hidden fields are filled, assume bot immediately.
    if (body.h_field || body.honeypot || body._trap) {
        flags.honeypot = true;
        // console.warn removed for strict logging later
        return { allowed: false, severity: 2, reason: 'Bot detected (Honeypot)', flags };
    }

    // 2. Time-based validation (Anti-Script)
    const loadTime = parseInt(body.load_time || '0');
    const now = Date.now();
    // < 2 seconds is suspicious for human typing
    if (loadTime === 0 || now - loadTime < 2000) { 
        flags.fastSubmission = true;
        return { allowed: false, severity: 2, reason: 'Submission too fast (Bot heuristics)', flags };
    }

    // 3. Rate Limiting (DoS Protection)
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '300000'); // Default 5 mins
    const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX || '3'); // Default 3
    
    let attempts = rateLimits.get(ip) || [];
    // Filter old attempts
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (attempts.length >= maxAttempts) {
        flags.rateLimited = true;
        // Do not update timestamp on blocked attempt to prevent infinite lockout from one burst? 
        // Or should we? Let's not punish legitimate retries too hard, but block the spam.
        return { allowed: false, severity: 2, reason: 'Rate limit exceeded', flags };
    }

    // Update rate limits only if not blocked by previous checks
    attempts.push(now);
    rateLimits.set(ip, attempts);

    // 4. Content Inspection: Link Density
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
    const links = (body.message || '').match(urlRegex) || [];
    flags.linkDensity = links.length;
    
    if (links.length > 3) {
        return { allowed: false, severity: 1, reason: 'Message contains too many links (Spam)', flags };
    }

    // 5. Context Inspection: Profanity & Patterns
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
            flags.profanity = true;
            return { allowed: false, severity: 2, reason: 'Content Policy Violation (Profanity)', flags };
        }
    }

    // 6. Header Injection Check (Sanity check)
    // CRLF injection detection in identity or email
    const crlfRegex = /[\r\n]/;
    if (crlfRegex.test(body.identity) || (body.email && crlfRegex.test(body.email))) {
         return { allowed: false, severity: 2, reason: 'Header Injection Detected', flags };
    }

    return { allowed: true, severity: 0, flags };
}

// ============================================
// HELPER: Metadata Enrichment (Sanitized)
// ============================================
export function enrichMetadata(request: NextRequest): EmailMetadata {
    const rawIp = getRawIp(request);
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex').substring(0, 16); // Truncate 16 chars

    return {
        timestamp: new Date().toISOString(),
        ipHash, // Store ONLY the hash
        userAgent: request.headers.get('user-agent') || 'Unknown',
        environment: process.env.NODE_ENV || 'development'
    };
}

function getRawIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';
}

// ============================================
// HELPER: Sanitization utilities
// ============================================
export function sanitizeContent(text: string): string {
    if (!text) return "";
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ""); // Strip control chars
}
