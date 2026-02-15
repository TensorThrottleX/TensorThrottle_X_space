
export type BaseTheme = 'normal' | 'dark' | 'bright' | 'custom';

export interface VideoState {
    index: number;                // -2 = white, -1 = black, 0+ = folder
    hasAudioTrack: boolean;
    videoAudioEnabled: boolean;
}

export interface SoundState {
    soundIndex: number; // -1 = muted, 0+ = sounds in folder
}

export interface MediaAsset {
    name: string;
    path: string;
}

export interface MediaConfig {
    videos: MediaAsset[];
    sounds: MediaAsset[];
}
