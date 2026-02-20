import { NextResponse } from 'next/server';
import { moderateContent } from '@/lib/moderation/decision';

export async function POST(req: Request) {
    try {
        const body = await req.json();
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
