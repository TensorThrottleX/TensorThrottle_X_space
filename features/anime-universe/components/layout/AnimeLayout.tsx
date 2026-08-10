import { Stage } from './Stage'
import type { Anime } from '@/features/anime-universe/models/Anime'

interface AnimeLayoutProps {
  animeList: Anime[]
  defaultUniverse?: Anime | null
  activeIndex: number
  onIndexChange: (index: number) => void
  isReady: boolean
}

export function AnimeLayout({ animeList, defaultUniverse, activeIndex, onIndexChange, isReady }: AnimeLayoutProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 'calc(50% - 50vw)',
        width: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
        zIndex: 10,
      }}
    >
      <Stage
        animeList={animeList}
        defaultUniverse={defaultUniverse}
        activeIndex={activeIndex}
        onIndexChange={onIndexChange}
        isReady={isReady}
      />
    </div>
  )
}
