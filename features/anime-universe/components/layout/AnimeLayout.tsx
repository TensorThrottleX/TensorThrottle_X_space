import { Stage } from './Stage'
import type { Anime } from '@/features/anime-universe/models/Anime'

interface AnimeLayoutProps {
  animeList: Anime[]
  activeIndex: number
  onIndexChange: (index: number) => void
  isReady: boolean
}

export function AnimeLayout({ animeList, activeIndex, onIndexChange, isReady }: AnimeLayoutProps) {
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
        activeIndex={activeIndex}
        onIndexChange={onIndexChange}
        isReady={isReady}
      />
    </div>
  )
}
