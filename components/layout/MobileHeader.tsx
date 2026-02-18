'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MoreVertical, X as XClose, Github, Mail, Coffee } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import { AnimatePresence, motion } from 'framer-motion'

// X (Twitter) Icon
function XIcon({ className }: { className?: string }): React.ReactNode {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

const externalLinks = [
    { label: 'X (Twitter)', href: 'https://x.com/TensorThrottleX', icon: XIcon, isCustomSvg: true },
    { label: 'GitHub', href: 'https://github.com/TensorThrottleX', icon: Github },
    { label: 'Email', href: 'mailto:tensorthrottleX@proton.me', icon: Mail },
    { label: 'Support', href: 'https://buymeacoffee.com/TensorThrottleX', icon: Coffee },
]

function getPageTitle(pathname: string): string {
    if (pathname === '/') return 'Home'
    if (pathname === '/feed') return 'Feed'
    if (pathname.startsWith('/category/thoughts')) return 'Thoughts'
    if (pathname.startsWith('/category/projects')) return 'Projects'
    if (pathname.startsWith('/category/experiments')) return 'Experiments'
    if (pathname.startsWith('/category/manifold')) return 'Manifold'
    if (pathname.startsWith('/post/')) return 'Post'
    if (pathname.startsWith('/about')) return 'About'
    return 'TensorThrottle X'
}

export function MobileHeader() {
    const pathname = usePathname()
    const { renderMode, mainView } = useUI()
    const [menuOpen, setMenuOpen] = useState(false)
    const [time, setTime] = useState<Date | null>(null)
    const [mounted, setMounted] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const isBright = renderMode === 'bright'

    useEffect(() => {
        setMounted(true)
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0')
        const m = date.getMinutes().toString().padStart(2, '0')
        const s = date.getSeconds().toString().padStart(2, '0')
        return `${h}:${m}:${s}`
    }

    const pageTitle = mainView === 'msg' ? 'Message' : getPageTitle(pathname)

    return (
        <header
            className="mobile-header fixed top-0 left-0 right-0 z-[200] backdrop-blur-xl border-b transition-colors duration-300"
            style={{
                backgroundColor: isBright ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,10,0.92)',
                borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            }}
        >
            <div className="flex items-center justify-between h-14 px-4">
                {/* Page Title */}
                <h1
                    className="text-sm font-black tracking-tight uppercase"
                    style={{ color: 'var(--heading-primary)' }}
                >
                    {pageTitle}
                </h1>

                {/* Right Section: Clock + Menu */}
                <div className="flex items-center gap-3">
                    {/* Compact Clock */}
                    {mounted && time && (
                        <div
                            className="text-[10px] font-mono font-bold tracking-wider tabular-nums px-2 py-1 rounded-md border transition-colors duration-300"
                            style={{
                                backgroundColor: isBright ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                                borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                                color: isBright ? '#333' : 'rgba(255,255,255,0.7)',
                            }}
                        >
                            {formatTime(time)}
                        </div>
                    )}

                    {/* Menu Toggle */}
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
                            style={{
                                backgroundColor: menuOpen
                                    ? (isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)')
                                    : 'transparent',
                                color: 'var(--foreground)',
                            }}
                            aria-label="Menu"
                        >
                            {menuOpen ? <XClose size={18} /> : <MoreVertical size={18} />}
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute top-full right-0 mt-2 w-52 rounded-xl border overflow-hidden shadow-2xl z-[300]"
                                    style={{
                                        backgroundColor: isBright ? '#ffffff' : '#141414',
                                        borderColor: isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <div className="p-2 flex flex-col gap-0.5">
                                        {externalLinks.map((link) => {
                                            const Icon = link.icon
                                            return (
                                                <a
                                                    key={link.label}
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 active:scale-[0.97]"
                                                    style={{
                                                        color: 'var(--foreground)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = isBright
                                                            ? 'rgba(0,0,0,0.04)'
                                                            : 'rgba(255,255,255,0.06)'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                    }}
                                                >
                                                    {link.isCustomSvg ? (
                                                        <Icon className="w-4 h-4" />
                                                    ) : (
                                                        <Icon size={16} strokeWidth={2} />
                                                    )}
                                                    <span className="text-sm font-medium">{link.label}</span>
                                                </a>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    )
}
