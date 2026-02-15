
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const publicDir = path.join(process.cwd(), 'public');
    const videosDir = path.join(publicDir, 'videos');
    const soundsDir = path.join(publicDir, 'sounds');

    const getFiles = (dir: string, extensions: string[]) => {
        try {
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir)
                .filter(file => extensions.includes(path.extname(file).toLowerCase()))
                .map(file => ({
                    name: formatName(file),
                    path: `/${path.basename(dir)}/${file}`
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

    const videos = getFiles(videosDir, ['.mp4', '.webm']);
    const sounds = getFiles(soundsDir, ['.mp3', '.wav', '.ogg']);

    return NextResponse.json({ videos, sounds });
}
