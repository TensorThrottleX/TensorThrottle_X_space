import React from 'react'
import { notFound } from 'next/navigation'
import path from 'path'
import fs from 'fs/promises'
import { AnimeUniverse } from '@/features/anime-universe'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const dataPath = path.join(process.cwd(), 'public', 'media', 'universe', 'anime', 'data', decodedSlug, `${decodedSlug}.json`)
    const file = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(file)
    
    return {
      title: `${data.title} | Anime Verse`,
      description: data.subtitle,
    }
  } catch (e) {
    return {
      title: 'Not Found | Anime Verse'
    }
  }
}

export default async function AnimeNarrativePage({ params }: PageProps) {
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    // Verify the JSON exists to throw a 404 if invalid — the narrative itself
    // is rendered client-side by the carousel stage (AnimeUniverse).
    const dataPath = path.join(process.cwd(), 'public', 'media', 'universe', 'anime', 'data', decodedSlug, `${decodedSlug}.json`)
    await fs.readFile(dataPath, 'utf8')

    return <AnimeUniverse initialSlug={decodedSlug} />
  } catch (e) {
    console.error('Error loading anime JSON:', e)
    notFound()
  }
}
