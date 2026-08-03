'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useUI } from '@/components/providers/UIProvider'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { universeItems as universeData } from '@/src/data/universe'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Projects', href: '/category/projects' },
  { label: 'Thoughts', href: '/category/thoughts' },
  { label: 'Experiments', href: '/category/experiments' },
  { label: 'Manifold', href: '/category/manifold' },
]

const universeItems = universeData.filter(item => item.enabled)

export function TopFloatingBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { renderMode, setIsTerminalOpen, isBooting } = useUI()
  const [mounted, setMounted] = useState(false)
  const [universeOpen, setUniverseOpen] = useState(false)
  const universeBtnRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => { setMounted(true) }, [])

  const updateDropdownPosition = useCallback(() => {
    if (!universeBtnRef.current) return
    const rect = universeBtnRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 12,
      left: rect.left + rect.width / 2,
    })
  }, [])

  useEffect(() => {
    if (!universeOpen) return
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [universeOpen, updateDropdownPosition])

  useEffect(() => {
    if (!universeOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUniverseOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [universeOpen])

  useEffect(() => {
    if (!universeOpen) return
    const handler = (e: PointerEvent) => {
      const target = e.target as Node
      if (universeBtnRef.current?.contains(target)) return
      const portal = document.getElementById('universe-dropdown-portal')
      if (portal?.contains(target)) return
      setUniverseOpen(false)
    }
    document.addEventListener('pointerdown', handler, { passive: true })
    return () => document.removeEventListener('pointerdown', handler)
  }, [universeOpen])

  if (!mounted || isBooting) return null
  const isBright = renderMode === 'bright'

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleNavClick = (href: string) => router.push(href)

  const handleUniverseClick = (href: string) => {
    setUniverseOpen(false)
    router.push(href)
  }

  return (
    <motion.nav
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="pointer-events-auto"
    >
      <div
        className="relative h-[76px] flex items-center gap-10 px-8 rounded-full border"
        style={{
          backgroundColor: 'var(--adaptive-glass-bg)',
          borderColor: 'var(--adaptive-glass-border)',
          boxShadow: 'var(--adaptive-glass-shadow)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        <div
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-transform duration-300 hover:scale-105",
            isBright
              ? "bg-[#E5E2DD] text-black border border-black/15"
              : "bg-black text-white border border-white/15"
          )}>
            TX
          </div>
          <span
            className="font-semibold tracking-[0.2em] text-[9px] uppercase select-none transition-colors duration-300 opacity-70 hover:opacity-100"
            style={{ color: 'var(--heading-primary)' }}
          >
            TENSOR THROTTLEX
          </span>
        </div>

        <div className="flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className={cn(
                "px-3.5 py-2 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95",
                isActiveLink(link.href)
                  ? (isBright ? 'bg-black/5 text-black' : 'bg-white/8 text-orange-400')
                  : (isBright ? 'text-black/50 hover:text-black/70' : 'text-white/50 hover:text-white/70')
              )}
              style={isActiveLink(link.href) && !isBright ? {
                boxShadow: '0 0 12px rgba(251,146,60,0.15)',
              } : {}}
            >
              {link.label}
            </button>
          ))}

          <button
            ref={universeBtnRef}
            onClick={() => setUniverseOpen(prev => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95",
              isBright ? 'text-black/50 hover:text-black/70' : 'text-white/50 hover:text-white/70'
            )}
          >
            Universe
            <motion.div
              animate={{ rotate: universeOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronDown size={10} strokeWidth={2.5} />
            </motion.div>
          </button>
        </div>

        <button
          onClick={() => setIsTerminalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
          style={{
            backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            color: isBright ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            border: isBright ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isBright
              ? 'inset 0 1px 0 rgba(255,255,255,0.6)'
              : 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-orange-400/70 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute inset-0 rounded-full bg-orange-400" />
          </span>
          CONSOLE
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {universeOpen && (
            <motion.div
              id="universe-dropdown-portal"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-[250] w-[280px] rounded-2xl border"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--adaptive-glass-bg)',
                borderColor: 'var(--adaptive-glass-border)',
                boxShadow: 'var(--adaptive-glass-shadow), 0 20px 40px -12px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
              }}
            >
              {universeItems.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => handleUniverseClick(item.route)}
                  className={cn(
                    "w-full text-left px-5 py-3.5 transition-all duration-200 flex items-start gap-3.5 group/univ",
                    i > 0 ? "border-t" : "",
                    isBright
                      ? 'border-black/5 hover:bg-black/3'
                      : 'border-white/5 hover:bg-white/3'
                  )}
                >
                  {item.icon && <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={cn(
                      "text-[11px] font-semibold tracking-wide transition-colors duration-200",
                      isBright
                        ? 'text-black/80 group-hover/univ:text-black'
                        : 'text-white/80 group-hover/univ:text-white'
                    )}>
                      {item.title}
                    </span>
                    <span className="text-[10px] leading-relaxed opacity-50 truncate">
                      {item.description}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.nav>
  )
}
