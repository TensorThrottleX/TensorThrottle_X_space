'use client'

import React, { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const VALID_SECTIONS = new Set([
  'anime', 'music', 'fox-den', 'secret-lab',
  'library', 'museum', 'memory',
])

export default function UniverseTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const section = pathname.startsWith('/universe/')
    ? pathname.split('/')[2]
    : null
  const isValid = section && VALID_SECTIONS.has(section)
  const [transitioning, setTransitioning] = useState(true)
  const prevSection = useRef(section)

  useEffect(() => {
    if (!isValid) {
      setTransitioning(false)
      return
    }

    if (section !== prevSection.current) {
      prevSection.current = section
      setTransitioning(true)
      const timer = setTimeout(() => setTransitioning(false), 400)
      return () => clearTimeout(timer)
    }
  }, [section, isValid])

  if (!isValid) return <>{children}</>

  return (
    <div
      key={section}
      className="universe-entry"
      style={{ pointerEvents: transitioning ? 'none' : 'auto' }}
    >
      {children}
    </div>
  )
}
