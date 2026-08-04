'use client'

import React, { useEffect } from 'react'
import './narrative.css'
import {
  EntryHero,
  BreathQuote,
  HeroSplit,
  ThoughtCascade,
  CinematicMoment,
  MemoryCards,
  AlternatingMemories,
  PullQuote,
  Timeline,
  TodayBlock,
  CharacterMirrors,
  JournalNotes,
  IdeasBorrowed,
  ContinueJourney,
  Divider,
} from './blocks'

export interface AnimeNarrativeData {
  id: string
  index: number
  title: string
  subtitle: string
  jpTitle: string
  year: number
  genre: string
  poster: string
  entry: { breathQuote: string }
  reflection: {
    quote: string
    tags: string[]
    whatIKept: string
    definingScene: string
    whoItMadeMeThinkAbout: string
  }
  thoughtCascade: Array<{ thought: string; micro: string }>
  cinematicMoment: {
    eyebrow: string
    title: string
    body: string
    episode: string
    image: string
  }
  memoryCards: {
    question: string
    cards: Array<{ symbol: string; title: string; text: string; tag: string; image: string }>
  }
  altMemories: Array<{
    question: string
    heading: string
    body: string
    caption: string | null
    image: string
    flip: boolean
  }>
  pullQuote: { text: string; attribution: string }
  timeline: {
    firstImpression: { heading: string; body: string }
    whatShifted: { heading: string; body: string }
    whatStayed: { heading: string; body: string }
  }
  todayBlock: {
    intro: string
    items: Array<{ verb: string; line: string }>
  }
  characters?: Array<{ name: string; role: string; mirror: string }>
  notes?: Array<{ text: string; footer: string }>
  ideas?: Array<{ concept: string; application: string }>
  continueJourney: {
    because: string
    prompt: string
    recommendations: Array<{ title: string; reason: string }>
  }
}

export function AnimeNarrativeTemplate({ data }: { data: AnimeNarrativeData }) {
  // Ambient canvas
  useEffect(() => {
    const cv = document.getElementById('acanvas') as HTMLCanvasElement
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return
    
    let W = window.innerWidth
    let H = window.innerHeight
    const pts: any[] = []
    let spd = 1
    let animationFrameId: number
    
    function resize() {
      if (!cv) return
      W = cv.width = window.innerWidth
      H = cv.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    function mk() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.2,
        vy: -(Math.random() * 0.25 + 0.04),
        vx: (Math.random() - 0.5) * 0.07,
        o: Math.random() * 0.22 + 0.04,
        life: Math.random()
      }
    }
    for (let i = 0; i < 80; i++) pts.push(mk())
    
    function tick() {
      if (!cx) return
      cx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.life += 0.003 * spd
        p.y += p.vy * spd
        p.x += p.vx * spd
        const a = Math.sin(p.life * Math.PI) * p.o
        cx.beginPath()
        cx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        cx.fillStyle = `rgba(232,226,212,${a})`
        cx.fill()
        if (p.y < -10 || p.life > 1) {
          Object.assign(p, mk(), { y: H + 10, life: 0 })
        }
      })
      animationFrameId = requestAnimationFrame(tick)
    }
    tick()
    
    ;(window as any)._aspd = (v: number) => { spd = v }
    
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Atmosphere dimming based on scroll
  useEffect(() => {
    const dim = document.getElementById('adim')
    const hero = document.getElementById('hero-split')
    
    const onScroll = () => {
      if (!hero || !dim) return
      const top = hero.getBoundingClientRect().top + window.scrollY
      const prog = Math.max(0, Math.min(1, (window.scrollY - (top - window.innerHeight * 0.7)) / (window.innerHeight * 0.9)))
      dim.style.opacity = (prog * 0.48).toString()
      if ((window as any)._aspd) {
        (window as any)._aspd(Math.max(0.12, 1 - prog * 0.88))
      }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Progress bar
  useEffect(() => {
    const pb = document.getElementById('progress')
    const onScroll = () => {
      if (!pb) return
      const m = document.documentElement.scrollHeight - window.innerHeight
      if (m > 0) {
        pb.style.width = ((window.scrollY / m) * 100).toFixed(1) + '%'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in')
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .div-line').forEach(el => io.observe(el))
    
    return () => io.disconnect()
  }, [data])

  return (
    <div className="anime-narrative">
      <div id="progress"></div>
      
      <div id="ambient">
        <canvas id="acanvas"></canvas>
        <div id="adim"></div>
      </div>

      <div id="page">
        {/* Stage 1: Full viewport cinematic title */}
        <EntryHero data={data} />

        {/* Stage 2: Breath Quote */}
        {data.entry?.breathQuote && <BreathQuote data={data} />}

        {/* Stage 3: Hero Split */}
        {data.reflection && <HeroSplit data={data} />}

        {/* Stage 4: Thought Cascade */}
        {data.thoughtCascade?.length > 0 && (
          <>
            <Divider label="while watching" />
            <ThoughtCascade data={data} />
          </>
        )}

        {/* Stage 5: Cinematic Moment */}
        {data.cinematicMoment && (
          <>
            <Divider label="the moment" />
            <CinematicMoment data={data} />
          </>
        )}

        {/* Stage 6: Memory Cards */}
        {data.memoryCards?.cards?.length > 0 && (
          <>
            <Divider label="what stayed" />
            <MemoryCards data={data} />
          </>
        )}

        {/* Stage 7: Alternating Memories */}
        {data.altMemories?.length > 0 && (
          <>
            <Divider label="reflections" />
            <AlternatingMemories data={data} />
          </>
        )}

        {/* Stage 8: Pull Quote */}
        {data.pullQuote && <PullQuote data={data} />}

        {/* Stage 9: Timeline */}
        {data.timeline && (
          <>
            <Divider label="the manuscript" />
            <Timeline data={data} />
          </>
        )}

        {/* Stage 10: Today Block */}
        {data.todayBlock && (
          <>
            <Divider label="today" />
            <TodayBlock data={data} />
          </>
        )}

        {/* Stage 11: Character Mirrors */}
        {(data.characters?.length ?? 0) > 0 && (
          <>
            <Divider label="characters that stayed" />
            <CharacterMirrors data={data} />
          </>
        )}

        {/* Stage 12: Journal Notes */}
        {(data.notes?.length ?? 0) > 0 && (
          <>
            <Divider label="journal notes" />
            <JournalNotes data={data} />
          </>
        )}

        {/* Stage 13: Ideas Borrowed */}
        {(data.ideas?.length ?? 0) > 0 && (
          <>
            <Divider label="ideas i borrowed" />
            <IdeasBorrowed data={data} />
          </>
        )}

        {/* Stage 14: Continue Journey */}
        {data.continueJourney && (
          <>
            <Divider label="continue" />
            <ContinueJourney data={data} />
          </>
        )}
      </div>
    </div>
  )
}
