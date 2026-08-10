import { NextResponse } from 'next/server';
import mediaRegistry from '@/features/anime-universe/assets/media-registry.json';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(mediaRegistry, {
        headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        }
    });
}
