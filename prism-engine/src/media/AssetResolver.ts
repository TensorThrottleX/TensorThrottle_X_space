import { PrismItem } from '../prism/types/Item';
import { AssetPaths, ResolvedMedia } from './types';

/**
 * Resolves an item's media files from a template's asset folders using a
 * predictable naming convention:
 *
 *   covers/{slug}.jpg
 *   covers/{slug}.thumb.jpg
 *   covers/{slug}.poster.jpg
 *   videos/{slug}.mp4
 *   audio/{slug}.mp3
 *   metadata/{slug}.json   (already loaded, passed in as item.metadata)
 *
 * `slug` falls back to `id` if a template doesn't set one. Any field set
 * directly on the item (item.cover, item.backgroundVideo, ...) always wins
 * over the folder convention — explicit data beats convention.
 */
export class AssetResolver {
  constructor(private paths: AssetPaths) {}

  resolve(item: PrismItem): ResolvedMedia {
    const key = item.slug ?? item.id;

    return {
      cover: item.cover ?? this.build(this.paths.covers, key, 'jpg'),
      thumbnail: item.thumbnail ?? this.build(this.paths.covers, `${key}.thumb`, 'jpg'),
      poster: item.poster ?? this.build(this.paths.covers, `${key}.poster`, 'jpg'),
      video: item.backgroundVideo ?? this.build(this.paths.videos, key, 'mp4'),
      audio: item.backgroundAudio ?? this.build(this.paths.audio, key, 'mp3'),
      metadata: item.metadata,
    };
  }

  private build(folder: string, key: string, ext: string) {
    return `${folder}/${key}.${ext}`;
  }
}
