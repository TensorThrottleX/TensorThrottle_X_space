'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import type { Activity } from '@/types/activity'
import { getActivities, hasUnseenActivity } from '@/lib/activity/store'
import { localStorageReadStore } from '@/lib/activity/read-state'
import { ActivityPanel } from './ActivityPanel'

// Side effect: publish the built-in activity providers into the registry.
import '@/lib/activity/providers'

/**
 * Pulse — the ecosystem activity center.
 *
 * Rendered only on the Feed page (pathname gate). Desktop: a glass pill
 * sitting left of the SystemClock in the top strip. Mobile: a floating pill
 * in the top-right. Opening it lazily loads the aggregated activity stream —
 * nothing is fetched until the bell is clicked. All data flows through the
 * provider registry (lib/activity/registry.ts); this component never knows
 * a specific module.
 */
export function PulseBell({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const pathname = usePathname()
  const router = useRouter()
  const { renderMode, isBooting } = useUI()
  const isBright = renderMode === 'bright'

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => localStorageReadStore.getReadIds())
  const [hasUnread, setHasUnread] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const readIdsRef = useRef(readIds)

  useEffect(() => {
    readIdsRef.current = readIds
  }, [readIds])

  const isFeedPage = pathname === '/feed'
  const accent = isBright ? '#0891b2' : '#22d3ee'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Unread indicator from the persisted snapshot — no fetch (lazy by design)
  useEffect(() => {
    setHasUnread(hasUnseenActivity(readIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const measureAnchor = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 12, right: window.innerWidth - rect.right })
  }, [])

  const loadActivities = useCallback(async (force: boolean) => {
    setLoading(true)
    const fresh = await getActivities(force)
    setActivities(fresh)
    // Indicator reflects the just-refreshed snapshot vs current reads
    setHasUnread(hasUnseenActivity(readIdsRef.current))
    setLoading(false)
  }, [])

  const openPanel = useCallback(() => {
    setOpen(true)
    measureAnchor()
    if (activities === null && !loading) {
      loadActivities(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, loading, measureAnchor, loadActivities])

  const closePanel = useCallback(() => {
    setOpen(false)
    setTimeout(() => btnRef.current?.focus(), 50)
  }, [])

  const togglePanel = useCallback(() => {
    if (open) closePanel()
    else openPanel()
  }, [open, openPanel, closePanel])

  // Escape closes; click-outside closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closePanel()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      const portal = document.getElementById('pulse-panel-portal')
      if (portal?.contains(target)) return
      closePanel()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer, { passive: true })
    window.addEventListener('resize', measureAnchor)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('resize', measureAnchor)
    }
  }, [open, closePanel, measureAnchor])

  const handleActivityClick = useCallback(
    (activity: Activity) => {
      const next = new Set(readIdsRef.current)
      next.add(activity.id)
      localStorageReadStore.markRead(activity.id)
      setReadIds(next)
      // Reading the last unseen activity clears the indicator immediately
      setHasUnread(hasUnseenActivity(next))
      setOpen(false)
      // Preserve existing routing — the provider's url IS an existing route.
      router.push(activity.url)
    },
    [router],
  )

  const handleMarkAllRead = useCallback(() => {
    if (!activities || activities.length === 0) return
    const ids = activities.map((a) => a.id)
    localStorageReadStore.markAllRead(ids)
    setReadIds((prev) => new Set([...prev, ...ids]))
    setHasUnread(false)
  }, [activities])

  const handleRefresh = useCallback(() => {
    setActivities(null)
    loadActivities(true)
  }, [loadActivities])

  if (!mounted || isBooting || !isFeedPage) return null

  const dim = isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'

  const bellButton = (
    <motion.button
      ref={btnRef}
      type="button"
      onClick={togglePanel}
      aria-label={hasUnread ? 'Pulse — new activity' : 'Pulse — activity center'}
      aria-expanded={open}
      title="Pulse"
      className="relative flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 transition-transform duration-300 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: 'var(--adaptive-glass-bg)',
        borderColor: 'var(--adaptive-glass-border)',
        boxShadow: 'var(--adaptive-glass-shadow)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        pointerEvents: 'auto',
      }}
    >
      <Bell size={15} style={{ color: hasUnread ? accent : dim }} />
      <span
        className="font-sans text-[10px] font-bold uppercase tracking-widest"
        style={{ color: hasUnread ? accent : dim }}
      >
        Pulse
      </span>
      {hasUnread && (
        <motion.span
          className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  )

  return (
    <>
      {variant === 'mobile' ? (
        <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-[300]">
          {bellButton}
        </div>
      ) : (
        bellButton
      )}

      <ActivityPanel
        open={open}
        isMobile={variant === 'mobile'}
        anchorTop={anchor?.top}
        anchorRight={anchor?.right}
        accent={accent}
        activities={activities}
        loading={loading}
        readIds={readIds}
        onClose={closePanel}
        onActivityClick={handleActivityClick}
        onMarkAllRead={handleMarkAllRead}
        onRefresh={handleRefresh}
      />
    </>
  )
}
