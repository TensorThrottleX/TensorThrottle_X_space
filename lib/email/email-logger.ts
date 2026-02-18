// Email Logger (Structured)
import { LogEntry } from './email-types';

const IS_DEBUG = process.env.EMAIL_DEBUG === 'true';

export function logTransition(entry: LogEntry): void {
    const output = {
        timestamp: entry.timestamp,
        status: entry.status,
        ipHash: entry.ipHash, // SHA-256 Truncated
        messageId: entry.messageId || 'N/A',
        errorCode: entry.errorCode || undefined,
        flags: entry.securityFlags || undefined,
        debug: IS_DEBUG ? entry.debugContext : undefined
    };

    if (entry.status === 'failed' || entry.status === 'blocked') {
        // Red color for errors in local dev, regular JSON in prod
        console.warn(`[EMAIL_FAIL]`, JSON.stringify(output));
    } else {
        console.log(`[EMAIL_SENT]`, JSON.stringify(output));
    }
}
