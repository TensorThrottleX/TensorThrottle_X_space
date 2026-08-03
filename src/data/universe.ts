export interface UniverseItem {
  id: string
  title: string
  description: string
  icon: string
  route: string
  enabled: boolean
}

export const universeItems: UniverseItem[] = [
  {
    id: 'anime',
    title: 'Anime Verse',
    description: 'Stories that shaped my mindset.',
    icon: '',
    route: '/universe/anime',
    enabled: true,
  },
  {
    id: 'music',
    title: 'Music Nebula',
    description: 'The soundtrack behind my journey.',
    icon: '',
    route: '/universe/music',
    enabled: true,
  },
  {
    id: 'fox-den',
    title: 'Fox Den',
    description: 'Meet Lumi, my AI companion.',
    icon: '',
    route: '/universe/fox-den',
    enabled: true,
  },
  {
    id: 'secret-lab',
    title: 'Secret Lab',
    description: 'Experiments beyond the observable.',
    icon: '',
    route: '/universe/secret-lab',
    enabled: false,
  },
  {
    id: 'library',
    title: 'Library',
    description: 'A curated collection of works.',
    icon: '',
    route: '/universe/library',
    enabled: false,
  },
  {
    id: 'museum',
    title: 'Museum',
    description: 'Artifacts from the journey.',
    icon: '',
    route: '/universe/museum',
    enabled: false,
  },
  {
    id: 'memory',
    title: 'Memory Gallery',
    description: 'Moments frozen in time.',
    icon: '',
    route: '/universe/memory',
    enabled: false,
  },
]
