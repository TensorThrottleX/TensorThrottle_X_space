'use client'

import React, { useEffect, useRef } from 'react'
import type { AnimeNarrativeData } from './AnimeNarrativeTemplate'
import { useImageOrientation } from '../../hooks/useImageOrientation'

export function Divider({ label }: { label: string }) {
  return (
    <div className="div-line">
      <div className="dl"></div>
      <span className="dt">{label}</span>
      <div className="dl"></div>
    </div>
  )
}

export function EntryHero({ data }: { data: AnimeNarrativeData }) {
  return (
    <div id="entry">
      <p className="entry-eyebrow">Anime Universe &nbsp;·&nbsp; #{data.index}</p>
      <h1 className="entry-title">{data.title}</h1>
      <p className="entry-jp">{data.jpTitle}</p>
      <span className="entry-index">{data.index}</span>
      <div className="entry-scroll">
        <span>scroll</span>
      </div>
    </div>
  )
}

export function BreathQuote({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="breath-block reveal">
      <div className="breath-quote">{data.entry.breathQuote}</div>
    </div>
  )
}

export function HeroSplit({ data }: { data: AnimeNarrativeData }) {
  return (
    <div id="hero-split">
      <div className="hero-poster reveal-left">
        {data.poster ? (
          <img className="hero-poster-img" src={data.poster} alt={data.title} />
        ) : (
          <div className="hero-poster-placeholder">
            <span className="hero-poster-glyph">{data.jpTitle?.charAt(0)}</span>
          </div>
        )}
        <div className="hero-poster-over"></div>
        <div className="hero-poster-right-fade"></div>
        <div className="hero-poster-meta">
          <div className="hpm-title">{data.title}</div>
          <div className="hpm-jp">{data.jpTitle}</div>
          <div className="hpm-chips">
            {[data.year, data.genre].filter(Boolean).map((v, i) => (
              <span key={i} className="hpm-chip">{v}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-right reveal-right">
        {data.subtitle && <p className="hero-tagline">{data.subtitle}</p>}
        {data.reflection?.quote && <blockquote className="hero-reflection-quote">{data.reflection.quote}</blockquote>}
        
        {data.reflection?.tags && data.reflection.tags.length > 0 && (
          <div className="hero-tags">
            {data.reflection.tags.map((t, i) => (
              <span key={i} className="hero-tag">{t}</span>
            ))}
          </div>
        )}
        
        <div className="reflection-cards">
          {[
            { label: 'What I Kept', text: data.reflection?.whatIKept },
            { label: 'Defining Scene', text: data.reflection?.definingScene },
            { label: 'Who It Made Me Think About', text: data.reflection?.whoItMadeMeThinkAbout },
          ].filter(c => c.text).map((c, i) => (
            <div key={i} className="rc" style={{ transitionDelay: `${i * 140}ms` }}>
              <div className="rc-label">{c.label}</div>
              <div className="rc-text">{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ThoughtCascade({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="thought-cascade">
      <div className="cascade-label">What I was thinking</div>
      {data.thoughtCascade.map((item, i) => (
        <div key={i} className="cascade-item reveal" style={{ transitionDelay: `${i * 100}ms` }}>
          <div className="cascade-dot"></div>
          <div className="cascade-thought">{item.thought}</div>
          <div className="cascade-micro">{item.micro}</div>
        </div>
      ))}
    </div>
  )
}

export function CinematicMoment({ data }: { data: AnimeNarrativeData }) {
  const cm = data.cinematicMoment
  const rawImage = cm.image?.trim()
  const orientation = useImageOrientation(rawImage)
  
  // Intelligently auto-rotate if the image is portrait
  const shouldRotate = orientation === 'portrait'

  return (
    <div className="cinematic-moment reveal-scale">
      <div className={`cm-bg ${rawImage ? 'has-img' : ''}`}>
        {rawImage ? (
          <img 
            className="cm-bg-img" 
            src={rawImage} 
            alt="" 
            style={shouldRotate ? {
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '150vh', // Ensures it covers the screen when rotated
              height: '100vw',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: 'translate(-50%, -50%) rotate(90deg)'
            } : { 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'center' 
            }} 
          />
        ) : (
          <div className="cm-bg-pattern"></div>
        )}
        <div className="cm-over"></div>
      </div>
      <div className="cm-content">
        <div className="cm-eyebrow">{cm.eyebrow}</div>
        <div className="cm-title">{cm.title}</div>
        <div className="cm-body">{cm.body}</div>
        <div className="cm-ep">{cm.episode}</div>
      </div>
    </div>
  )
}

export function MemoryCards({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="memory-section">
      <div className="ms-header reveal">
        <div className="ms-eyebrow">After the screen went dark</div>
        <div className="ms-question">{data.memoryCards.question}</div>
      </div>
      <div className="memory-grid">
        {data.memoryCards.cards.map((c, i) => (
          <div key={i} className="mem-card reveal" style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="mem-symbol">{c.symbol}</div>
            <div className="mem-title">{c.title}</div>
            <div className="mem-text">{c.text}</div>
            {c.image && <img className="mem-img" src={c.image} alt="" />}
            <div className="mem-tag">{c.tag}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AlternatingMemories({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="alt-memory">
      {data.altMemories.map((item, i) => (
        <div key={i} className={`alt-row ${item.flip ? 'flip' : ''}`}>
          <div className={`alt-img-col reveal-${item.flip ? 'right' : 'left'}`}>
            {item.image ? (
              <img className="alt-img" src={item.image} alt="" />
            ) : (
              <div className="alt-img-placeholder">
                <div className="alt-img-ph-glyph">{data.title.charAt(0)}</div>
              </div>
            )}
          </div>
          <div className={`alt-text-col reveal-${item.flip ? 'left' : 'right'}`} style={{ transitionDelay: '120ms' }}>
            <div className="alt-q">{item.question}</div>
            <div className="alt-heading">{item.heading}</div>
            <div className="alt-body">{item.body}</div>
            {item.caption && <div className="alt-caption">{item.caption}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PullQuote({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="pull-section">
      <div className="pull-quote reveal">
        {data.pullQuote.text}
      </div>
      <div className="pull-attr reveal">{data.pullQuote.attribution}</div>
    </div>
  )
}

export function Timeline({ data }: { data: AnimeNarrativeData }) {
  const tl = data.timeline
  const items = [
    { lbl: 'First Impression', ...tl.firstImpression },
    { lbl: 'What Shifted', ...tl.whatShifted },
    { lbl: 'What Stayed', ...tl.whatStayed },
  ]
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ioTl = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle('active', e.isIntersecting)
        })
      },
      { threshold: 0.55 }
    )
    if (containerRef.current) {
      containerRef.current.querySelectorAll('.tl-node').forEach(el => ioTl.observe(el))
    }
    return () => ioTl.disconnect()
  }, [data])

  return (
    <div className="manuscript-section" ref={containerRef}>
      <div className="ms-label">How it unfolded</div>
      <div className="tl-wrap">
        <div className="tl-spine"></div>
        {items.map((nd, i) => (
          <div key={i} className="tl-node reveal" style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="tl-dot"></div>
            <div className="tl-lbl">{nd.lbl}</div>
            <div className="tl-head">{nd.heading}</div>
            <div className="tl-body">{nd.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TodayBlock({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="today-section reveal">
      <div className="today-label">Real life connection</div>
      <div className="today-intro">{data.todayBlock.intro}</div>
      <div className="today-grid">
        {data.todayBlock.items.map((item, i) => (
          <div key={i} className="today-item">
            <div className="today-verb">{item.verb}</div>
            <div className="today-line">{item.line}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CharacterMirrors({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="chars-section reveal">
      <div className="chars-label">Who became a mirror</div>
      <div className="chars-list">
        {data.characters?.map((c, i) => (
          <div key={i} className="char-item">
            <div className="char-name-col">
              <div className="char-name">{c.name}</div>
              <div className="char-role">{c.role}</div>
            </div>
            <div className="char-mirror">{c.mirror}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function JournalNotes({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="notes-section">
      <div className="notes-label">Written while watching</div>
      <div className="notes-grid">
        {data.notes?.map((n, i) => (
          <div key={i} className="note-card reveal" style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="note-text">{n.text}</div>
            <div className="note-footer">{n.footer}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function IdeasBorrowed({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="ideas-section">
      <div className="ideas-label">Concepts that left the screen</div>
      {data.ideas?.map((idea, i) => (
        <div key={i} className="idea-row reveal" style={{ transitionDelay: `${i * 100}ms` }}>
          <div className="idea-concept">{idea.concept}</div>
          <div className="idea-application">{idea.application}</div>
        </div>
      ))}
    </div>
  )
}

export function ContinueJourney({ data }: { data: AnimeNarrativeData }) {
  return (
    <div className="continue-section reveal">
      <div className="cont-because">{data.continueJourney.because}</div>
      <div className="cont-prompt">{data.continueJourney.prompt}</div>
      <div className="cont-arrow"></div>
      <div className="cont-recs">
        {data.continueJourney.recommendations.map((r, i) => (
          <div key={i} className="cont-rec">
            <div className="cont-rec-title">{r.title}</div>
            <div className="cont-rec-reason">{r.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
