import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const publicDir = path.join(process.cwd(), 'public');
    const mediaDir = path.join(publicDir, 'media');

    const videosDir = path.join(mediaDir, 'backgrounds', 'video');
    const musicDir = path.join(mediaDir, 'audio', 'bgm');

    const getFiles = (dir: string, publicPathPart: string, extensions: string[]) => {
        try {
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir)
                .filter(file => extensions.includes(path.extname(file).toLowerCase()))
                .sort((a, b) => a.localeCompare(b))
                .map(file => ({
                    name: formatName(file),
                    path: `/media/${publicPathPart}/${encodeURIComponent(file)}`
                }));
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
            return [];
        }
    };

    const formatName = (filename: string) => {
        return path.parse(filename).name
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .toUpperCase()
            .slice(0, 40) || 'BACKGROUND';
    };

    const videos = getFiles(videosDir, 'backgrounds/video', ['.mp4', '.webm']);
    const sounds = getFiles(musicDir, 'audio/bgm', ['.mp3', '.wav', '.ogg', '.m4a']);

    return NextResponse.json({ videos, sounds }, {
        headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        }
    });
}
