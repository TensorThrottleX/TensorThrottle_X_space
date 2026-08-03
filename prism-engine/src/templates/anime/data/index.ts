import { PrismItem } from '../../../prism/types/Item';

/**
 * Only data lives here. Each entry's `slug` is the key used to look up its
 * files in the sibling covers/ videos/ audio/ metadata/ folders, e.g.
 * slug "frieren" resolves to:
 *   covers/frieren.jpg, covers/frieren.thumb.jpg, covers/frieren.poster.jpg
 *   videos/frieren.mp4
 *   audio/frieren.mp3
 *
 * Add a new card by adding a row here + dropping matching files in those
 * folders — no code changes needed anywhere else.
 */
export const animeItems: PrismItem[] = [
  { id: 'a1', slug: 'frieren', title: 'Frieren', subtitle: "Beyond Journey's End" },
  { id: 'a2', slug: 'jjk', title: 'Jujutsu Kaisen', subtitle: 'Cursed energy, unbound' },
  { id: 'a3', slug: 'vinland-saga', title: 'Vinland Saga', subtitle: 'A saga of peace' },
  { id: 'a4', slug: 'mob-psycho', title: 'Mob Psycho 100', subtitle: '100% strength' },
  { id: 'a5', slug: 'made-in-abyss', title: 'Made in Abyss', subtitle: 'The call of the abyss' },
  { id: 'a6', slug: 'spy-family', title: 'Spy x Family', subtitle: 'A family of secrets' },
];
