import { PrismItem } from './Item';

/**
 * Every event hands back the FULL item object, never just an index.
 * The page decides what to do with it (swap background video, update
 * a side panel, etc) — the prism does none of that itself.
 */
export interface PrismEvents {
  onActiveChange?: (item: PrismItem, index: number) => void;
  onCardClick?: (item: PrismItem, index: number) => void;
  onHover?: (item: PrismItem | null, index: number | null) => void;
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
}
