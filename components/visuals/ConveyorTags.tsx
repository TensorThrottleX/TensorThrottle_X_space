'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

const TAGS = ['AI', 'Research', 'Experiments', 'Universe', 'Anime', 'Music', 'Projects', 'Space', 'Travel', 'Light']
const TAG_GAP = 56
const PX_PER_SEC = 80
const DECEL = 0.94
const ACCEL_LERP = 0.04
const STOP_THRESHOLD = 0.05

export function ConveyorTags() {
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const offsetRef = useRef(0)
  const speedRef = useRef(PX_PER_SEC)
  const targetSpeedRef = useRef(PX_PER_SEC)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)

  const [setWidth, setSetWidth] = useState(0)
  const [paused, setPaused] = useState(false)
  const [clickedTag, setClickedTag] = useState<string | null>(null)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const displayTags = [...TAGS, ...TAGS, ...TAGS]

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const sw = el.scrollWidth / 3
    setSetWidth(sw)
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || setWidth === 0) return

    offsetRef.current = -setWidth * 2
    speedRef.current = PX_PER_SEC
    targetSpeedRef.current = PX_PER_SEC
    scroller.style.transform = `translate3d(${offsetRef.current}px, 0px, 0px)`

    lastTimeRef.current = performance.now()

    const animate = (time: number) => {
      const dt = Math.min(time - lastTimeRef.current, 50)
      lastTimeRef.current = time

      const cur = speedRef.current
      const tgt = targetSpeedRef.current

      if (Math.abs(cur - tgt) > STOP_THRESHOLD) {
        if (tgt === 0) {
          speedRef.current *= DECEL
          if (speedRef.current < STOP_THRESHOLD) speedRef.current = 0
        } else {
          speedRef.current += (tgt - cur) * ACCEL_LERP
          if (Math.abs(speedRef.current - tgt) < STOP_THRESHOLD) speedRef.current = tgt
        }
      }

      if (speedRef.current > STOP_THRESHOLD) {
        offsetRef.current += speedRef.current * (dt / 1000)
        if (offsetRef.current >= 0) {
          offsetRef.current -= setWidth
        }
        scroller.style.transform = `translate3d(${offsetRef.current}px, 0px, 0px)`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [setWidth])

  const handleClick = useCallback((tag: string) => {
    if (paused) {
      targetSpeedRef.current = PX_PER_SEC
      setPaused(false)
      setClickedTag(null)
      setHoveredTag(null)
    } else if (speedRef.current > STOP_THRESHOLD) {
      targetSpeedRef.current = 0
      setPaused(true)
      setClickedTag(tag)
    }
  }, [paused])

  const handleMouseLeave = useCallback(() => {
    if (paused) {
      targetSpeedRef.current = PX_PER_SEC
      setPaused(false)
      setClickedTag(null)
      setHoveredTag(null)
    }
  }, [paused])

  return (
    <div
      ref={trackRef}
      className="relative w-full overflow-hidden select-none"
      style={{
        height: '100px',
        maskImage: 'linear-gradient(to right, transparent 0%, black 96px, black calc(100% - 96px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 96px, black calc(100% - 96px), transparent 100%)',
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tags scroller */}
      <div
        ref={scrollerRef}
        className="absolute flex items-center"
        style={{
          left: 0,
          top: '46px',
          height: '36px',
          willChange: 'transform',
          gap: `${TAG_GAP}px`,
          zIndex: 2,
        }}
      >
        {displayTags.map((tag, i) => {
          const isActive = paused && clickedTag === tag
          return (
            <span
              key={`${tag}-${i}`}
              onClick={() => handleClick(tag)}
              onMouseEnter={() => {
                if (!paused) setHoveredTag(tag)
              }}
              onMouseLeave={() => {
                if (!paused) setHoveredTag(null)
              }}
              className="shrink-0 px-[14px] py-[5px] rounded-full text-[11px] font-medium tracking-wider border backdrop-blur-sm whitespace-nowrap cursor-pointer"
              style={{
                borderColor: isActive
                  ? 'var(--adaptive-hero-color)'
                  : 'var(--adaptive-glass-border)',
                color: isActive
                  ? 'var(--adaptive-hero-color)'
                  : 'var(--adaptive-hero-muted)',
                background: isActive
                  ? 'color-mix(in srgb, var(--adaptive-hero-color) 8%, transparent)'
                  : 'color-mix(in srgb, var(--adaptive-hero-color) 3%, transparent)',
                transform: isActive
                  ? 'scale(1.1)'
                  : hoveredTag === tag
                    ? 'scale(1.08)'
                    : 'scale(1)',
                boxShadow: isActive
                  ? 'var(--adaptive-hero-shadow)'
                  : 'none',
                opacity: hoveredTag && !isActive && hoveredTag !== tag ? 0.55 : isActive ? 1 : (hoveredTag === tag ? 1 : 0.75),
                transition: 'transform 0.3s, opacity 0.3s, background 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
            >
              {tag}
            </span>
          )
        })}
      </div>
    </div>
  )
}
