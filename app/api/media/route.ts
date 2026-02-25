
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const publicDir = path.join(process.cwd(), 'public');
    const mediaBaseDir = path.join(publicDir, 'media');

    // Hardened deterministic paths
    const videosDir = path.join(mediaBaseDir, 'videos');
    const musicDir = path.join(mediaBaseDir, 'music');

    const getFiles = (dir: string, publicPathPart: string, extensions: string[]) => {
        try {
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir)
                .filter(file => extensions.includes(path.extname(file).toLowerCase()))
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

    const videos = getFiles(videosDir, 'videos', ['.mp4', '.webm']);
    const sounds = getFiles(musicDir, 'music', ['.mp3', '.wav', '.ogg']);

    return NextResponse.json({ videos, sounds }, {
        headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        }
    });
}
