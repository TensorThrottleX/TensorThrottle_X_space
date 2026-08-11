import fs from 'fs'
import path from 'path'
import MusicBlackhole from '@/features/music-blackhole/components/MusicBlackhole'
import { LIFE_MOMENTS_DATA } from '@/features/music-blackhole/data/lifeMomentsData'

export const metadata = {
  title: 'Music Blackhole | TensorThrottleX Space',
  description: 'The soundtrack behind my journey.',
}

export default async function MusicBlackholePage() {
  const dataDir = path.join(process.cwd(), 'public/media/universe/music-blackhole/json')
  
  // Merge the physical planet mapping with the content JSON
  const populatedTracks = LIFE_MOMENTS_DATA.map(planet => {
    const category = planet.lifeInstance
    let songs: any[] = []
    if (category) {
      try {
        const jsonDir = path.join(process.cwd(), 'public/media/universe/music-blackhole/json', category)
        const musicDir = path.join(process.cwd(), 'public/media/universe/music-blackhole/music', category)
        
        let jsonFiles: string[] = []
        let audioFiles: string[] = []
        if (fs.existsSync(jsonDir)) jsonFiles = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'))
        if (fs.existsSync(musicDir)) audioFiles = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3'))
        
        // Find all unique basenames from both folders
        const allBaseNames = new Set([
          ...jsonFiles.map(f => f.replace('.json', '')),
          ...audioFiles.map(f => f.replace('.mp3', ''))
        ])
        
        // Sort explicitly by numeric prefix
        const baseNames = Array.from(allBaseNames).sort((a, b) => {
          const numA = parseInt(a.split('_')[0], 10) || 0;
          const numB = parseInt(b.split('_')[0], 10) || 0;
          return numA - numB;
        });
        
        songs = baseNames.map(baseName => {
          const jsonPath = path.join(jsonDir, `${baseName}.json`)
          const mp3Path = path.join(musicDir, `${baseName}.mp3`)
          
          let content: any = {}
          try {
            content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
          } catch (e) {
            console.warn(`[MusicBlackhole] Missing or invalid JSON for ${baseName} in ${category}`)
          }
          
          const hasAudio = fs.existsSync(mp3Path)
          if (!hasAudio) {
            console.warn(`[MusicBlackhole] Missing MP3 audio for ${baseName} in ${category}`)
          }
          
          return {
            id: `${planet.id}-${baseName}`,
            index: parseInt(baseName.split('_')[0], 10),
            title: content.song?.title,
            artist: content.song?.artist,
            audioUrl: hasAudio ? `/media/universe/music-blackhole/music/${category}/${baseName}.mp3` : null,
            memory: content.memory,
            hardHittingLine: content.hardHittingLine,
            whyThisLine: content.whyThisLine,
            hasAudio: hasAudio
          }
        })
      } catch (e) {
        console.warn(`Could not load tracks for lifeInstance: ${category}`, e)
      }
    }
    
    // Normalize into a single object for the universal card to consume
    return {
      id: planet.id,
      planetName: planet.planetName,
      planet: planet.planet,
      lifeInstance: category,
      songs: songs,
      // Provide defaults for SolarSystem clustering if needed
      clusterColor: songs.length > 0 ? songs[0].clusterColor : "#8a7b6a"
    }
  })

  return <MusicBlackhole tracks={populatedTracks} mediaBaseDir="/media/universe/music-blackhole/" />
}
