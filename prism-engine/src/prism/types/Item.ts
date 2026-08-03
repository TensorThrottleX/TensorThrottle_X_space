/**
 * The universal card model. The engine only ever knows about this shape —
 * it never knows what "Anime" or "Movies" mean. Pages attach real meaning
 * to these fields; the prism just rotates them in 3D space.
 */
export interface PrismItem {
  id: string;

  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;

  cover?: string;
  thumbnail?: string;
  poster?: string;

  backgroundVideo?: string;
  backgroundAudio?: string;

  metadata?: Record<string, unknown>;
  theme?: Record<string, unknown>;

  actions?: PrismItemAction[];
  customData?: Record<string, unknown>;
}

export interface PrismItemAction {
  id: string;
  label: string;
  onTrigger?: (item: PrismItem) => void;
}
