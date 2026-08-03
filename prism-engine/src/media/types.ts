export interface ResolvedMedia {
  cover?: string;
  thumbnail?: string;
  poster?: string;
  video?: string;
  audio?: string;
  metadata?: Record<string, unknown>;
}

/** The four asset folders every template exposes */
export interface AssetPaths {
  covers: string;
  videos: string;
  audio: string;
  metadata: string;
}
