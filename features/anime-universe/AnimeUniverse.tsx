'use client'

import { useEffect, useState } from 'react'
import { fetchAnimeList } from '@/features/anime-universe/assets/loader'
import { AnimeLayout } from '@/features/anime-universe/components/layout/AnimeLayout'
import { CinematicIntro } from '@/features/anime-universe/components/layout/CinematicIntro'
import { useUI } from '@/components/providers/UIProvider'
import type { Anime } from '@/features/anime-universe/models/Anime'

export function AnimeUniverse({ initialSlug }: { initialSlug?: string }) {
  const { setIsBooting } = useUI()
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [defaultUniverse, setDefaultUniverse] = useState<Anime | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsBooting(false)
  }, [setIsBooting])

  useEffect(() => {
    fetchAnimeList()
      .then((list) => {
        // The 'default' universe is the ambient environment card, not an anime —
        // keep it separate so it can back the idle state below the carousel.
        const defaultEntry = list.find((a) => a.id === 'default') ?? null
        setDefaultUniverse(defaultEntry)
        const filtered = list.filter((a) => a.id !== 'default')
        setAnimeList(filtered)
        if (initialSlug) {
          const idx = filtered.findIndex((a) => a.id === initialSlug)
          if (idx >= 0) setActiveIndex(idx)
        }
        setIsReady(true)
      })
      .catch(() => {
        setIsReady(true)
      })
  }, [initialSlug])

  return (
    <>
      <CinematicIntro />
      <AnimeLayout
        animeList={animeList}
        defaultUniverse={defaultUniverse}
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
        isReady={isReady}
      />
    </>
  )
}
