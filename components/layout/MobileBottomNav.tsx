'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Folder, FlaskConical } from 'lucide-react'
import { useTransition } from 'react'
import { useUI } from '@/components/providers/UIProvider'
import { motion } from 'framer-motion'

interface MobileNavItem {
    label: string
    href: string
    icon: React.ElementType
}

const mobileNavItems: MobileNavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Feed', href: '/feed', icon: List },
    { label: 'Projects', href: '/category/projects', icon: Folder },
    { label: 'Experiments', href: '/category/experiments', icon: FlaskConical },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const { renderMode, setMainView, setUiMode, setIsPrecision } = useUI()
    const isBright = renderMode === 'bright'

    const isActive = (href: string): boolean => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
        e.preventDefault()
        setMainView('dashboard')
        setUiMode('default')
        setIsPrecision(false)

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
        <nav
            className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[200] backdrop-blur-xl border-t transition-colors duration-300"
            style={{
                backgroundColor: isBright ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.95)',
                borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-stretch justify-around h-16 px-2">
                {mobileNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavigation(e, item.href)}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 transition-colors duration-200 active:scale-95"
                            style={{
                                color: active ? (isBright ? '#111' : '#22d3ee') : 'var(--muted-foreground)',
                            }}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                            <span className={`text-[10px] font-semibold tracking-wide uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>

                            {/* Active indicator dot */}
                            {active && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute top-0 w-8 h-0.5 rounded-full"
                                    style={{
                                        backgroundColor: isBright ? '#111' : '#22d3ee',
                                        boxShadow: isBright ? 'none' : '0 0 8px rgba(34,211,238,0.6)',
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </a>
                    )
                })}
            </div>
        </nav>
    )
}
