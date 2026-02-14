
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Brain, Folder, FlaskConical, Layers } from 'lucide-react'
import { useTransition } from 'react'
import { useUI } from '@/components/providers/UIProvider'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Feed', href: '/feed', icon: List },
  { label: 'Thoughts', href: '/category/thoughts', icon: Brain },
  { label: 'Projects', href: '/category/projects', icon: Folder },
  { label: 'Experiments', href: '/category/experiments', icon: FlaskConical },
  { label: 'Manifold', href: '/category/manifold', icon: Layers },
]

export function LabNavigation({ activeHref }: { activeHref?: string }): React.ReactNode {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { renderMode, setRenderMode, setIsPrecision, setMainView, setUiMode } = useUI()

  const isActive = (href: string): boolean => {
    if (activeHref) return activeHref === href
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
    e.preventDefault()

    // [CRITICAL_SYNC] – Reset all sectional and immersive states before navigation
    setMainView('dashboard')
    setUiMode('default')
    setIsPrecision(false)

    // Check for native View Transitions support
    if (!(document as any).startViewTransition) {
      router.push(href)
      return
    }

    (document as any).startViewTransition(() => {
      startTransition(() => {
        router.push(href)
      })
    })
  }

  return (
    <div className="sidebar flex h-full items-center px-4 py-8 pointer-events-auto relative z-40 transition-[opacity,transform] duration-500 ease-in-out">
      {/* Navigation Panel: Floating glass capsule */}
      <div
        className="flex flex-col gap-3 rounded-full px-3 py-6 backdrop-blur-lg backdrop-saturate-150 border shadow-xl transition-colors duration-300"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          viewTransitionName: 'sidebar-nav'
        }}
      >
        {navItems.map((item) => {
          const ActiveIcon = item.icon
          const active = isActive(item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={`group relative flex flex-col items-center justify-center gap-1 rounded-full w-12 h-12 transition-[transform,background-color,color,box-shadow] duration-300 ${active
                ? 'scale-105 shadow-md'
                : 'hover:scale-110'
                }`}
              style={{
                backgroundColor: active ? 'var(--card-bg)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: active ? 'var(--shadow-soft)' : 'none'
              }}
              title={item.label}
            >
              {/* Icon */}
              <span className="text-lg transition-transform group-hover:-translate-y-0.5" style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                <ActiveIcon size={20} strokeWidth={2} />
              </span>

              {/* Label (Tooltip style on hover) */}
              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-medium backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                {item.label}
              </span>

              {/* Active indicator dot refined */}
              {active && (
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: renderMode === 'bright' ? '#111' : '#22d3ee',
                    boxShadow: renderMode === 'bright' ? 'none' : '0 0 8px rgba(34,211,238,0.8)'
                  }}
                />
              )}
            </a>
          )
        })}
        <div className="h-px w-6 bg-white/10 my-1" />

        {/* Cyclic Render Mode Toggle */}
        <button
          onClick={() => {
            const nextMode = renderMode === 'normal' ? 'bright' : (renderMode === 'bright' ? 'dark' : 'normal')
            setRenderMode(nextMode)
          }}
          className={`group relative flex flex-col items-center justify-center gap-1 rounded-full w-12 h-12 transition-[background-color,border-color,color,box-shadow,transform] duration-300 border
            ${renderMode === 'normal'
              ? 'bg-black/40 border-cyan-500/30 text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:text-cyan-300'
              : (renderMode === 'bright'
                ? 'bg-[#ffffff] border-black/10 text-black shadow-sm hover:border-black/20'
                : 'bg-[#111111] border-white/10 text-white hover:bg-[#1a1a1a] shadow-inner')
            }`}
          title={`Mode: ${renderMode.toUpperCase()}`}
        >
          {/* Icon based on Mode */}
          <div className={`w-4 h-4 rounded-full transition-[background-color,border-color,box-shadow] duration-500 relative flex items-center justify-center
                ${renderMode === 'normal'
              ? 'bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
              : (renderMode === 'bright'
                ? 'bg-transparent border-[1.5px] border-black/80'
                : 'bg-black border border-white/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]')
            }
           `}>
            {renderMode === 'normal' && <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
            {renderMode === 'dark' && <div className="absolute w-full h-full rounded-full border border-blue-500/30 opacity-50" />}
          </div>
        </button>

        {/* Dynamic TX Badge (Synced here for layout, handled globally by TrademarkLogo logic or duplicate logic if needed) */}
        {/* The user confusingly asked to "place the switch above the TX logo badge". 
            But TX Logo is in TrademarkLogo.tsx which is fixed bottom-left. 
            LabNavigation is ALSO fixed left. 
            If they overlap or are separate, we might need to adjust.
            Assuming LabNavigation is the main "Sidebar". 
            If TrademarkLogo is separate, we'll leave it there but update its logic if possible or just use this toggle to control the global state which TX logo reads.
        */}
      </div>
    </div>
  )
}
