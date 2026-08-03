'use client'

import { useEffect, useState } from 'react'
import { fetchAnimeList } from '@/features/anime-universe/assets/loader'
import { AnimeLayout } from '@/features/anime-universe/components/layout/AnimeLayout'
import { useUI } from '@/components/providers/UIProvider'
import type { Anime } from '@/features/anime-universe/models/Anime'

export function AnimeUniverse() {
  const { setIsBooting } = useUI()
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isReady, setIsReady] = useState(false) // Just to know if fetch completed, though not blocking

  useEffect(() => {
    setIsBooting(false)
  }, [setIsBooting])

  useEffect(() => {
    fetchAnimeList()
      .then((list) => {
        // Filter out the 'default' universe which is an environment, not an anime
        setAnimeList(list.filter((a) => a.id !== 'default'))
        setIsReady(true)
      })
      .catch(() => {
        setIsReady(true)
      })
  }, [])

  return (
    <AnimeLayout
      animeList={animeList}
      activeIndex={activeIndex}
      onIndexChange={setActiveIndex}
      isReady={isReady}
    />
  )
}
