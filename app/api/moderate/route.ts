import { NextResponse } from 'next/server';
import { moderateContent } from '@/lib/moderation/decision';

const MAX_BODY_SIZE = 50_000;

export async function POST(req: Request) {
    try {
        const raw = await req.text();
        if (raw.length > MAX_BODY_SIZE) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }
        const body = JSON.parse(raw);
        const { text, context, userId } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Invalid input. Text is required.' },
                { status: 400 }
            );
        }

        const start = Date.now();
        const result = await moderateContent(text);
        const duration = Date.now() - start;

        // Log strict violations
        if (!result.allow) {
            console.log(JSON.stringify({
                event: 'moderation_violation',
                severity: result.severity,
                text: text.substring(0, 100), // Truncate for log safety
                scores: result.scores,
                timestamp: new Date().toISOString(),
                userId: userId || 'anonymous',
                context: context || 'unknown'
            }));
        }

        return NextResponse.json({
            severity: result.severity,
            allow: result.allow,
            scores: result.scores,
            duration_ms: duration
        });
    } catch (error) {
        console.error('Moderation API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error during moderation.' },
            { status: 500 }
        );
    }
}
