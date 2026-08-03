'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const VALID_SECTIONS = new Set([
  'anime', 'music', 'fox-den', 'secret-lab',
  'library', 'museum', 'memory',
])

export function UniverseTransition({ children }: { children: React.ReactNode }) {
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
