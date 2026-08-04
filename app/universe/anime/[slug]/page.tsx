import React from 'react'
import { notFound } from 'next/navigation'
import path from 'path'
import fs from 'fs/promises'
import { AnimeNarrativeTemplate } from '@/features/anime-universe/components/narrative'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params
    const dataPath = path.join(process.cwd(), 'public', 'media', 'universe', 'anime', 'data', slug, `${slug}.json`)
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
    const dataPath = path.join(process.cwd(), 'public', 'media', 'universe', 'anime', 'data', slug, `${slug}.json`)
    const file = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(file)
    
    return <AnimeNarrativeTemplate data={data} />
  } catch (e) {
    console.error('Error loading anime JSON:', e)
    notFound()
  }
}
