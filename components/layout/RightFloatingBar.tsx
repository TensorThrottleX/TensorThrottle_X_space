'use client'

import React from 'react'
import { Mail, Github, MessageSquare, Coffee } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'

// [MSG_PAGE] – Custom X (Twitter) Icon
function XIcon({ className }: { className?: string }): React.ReactNode {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

interface SocialItem {
    label: string
    href?: string
    icon: React.ElementType
    isExternal?: boolean
    isMail?: boolean
    isInternal?: boolean
    view?: 'dashboard' | 'msg'
}

// [MSG_PAGE] – Sidebar items configuration
// Position: 4th from bottom (Msg) is ensured by placing it before the last 3 items.
const socialItems: SocialItem[] = [
    { label: 'X (Twitter)', href: 'https://x.com/TensorThrottleX', icon: XIcon, isExternal: true },
    { label: 'Email', href: 'mailto:tensorthrottleX@proton.me', icon: Mail, isMail: true },
    { label: 'GitHub', href: 'https://github.com/TensorThrottleX', icon: Github, isExternal: true },
    { label: 'Message', icon: MessageSquare, isInternal: true, view: 'msg' },
    { label: 'Support (BMC)', href: 'https://buymeacoffee.com/TensorThrottleX', icon: Coffee, isExternal: true },
]

export function RightFloatingBar(): React.ReactNode {
    const { renderMode, mainView, setMainView, setUiMode } = useUI()

    const activeIndex = socialItems.findIndex(item => item.isInternal && mainView === item.view)

    return (
        <div className="rightbar fixed right-0 top-0 h-full hidden md:flex items-center px-6 z-[100] pointer-events-none transition-transform duration-300 ease-in-out">
            <div
                className="relative flex flex-col gap-3 rounded-full px-3 py-6 backdrop-blur-xl backdrop-saturate-150 border animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-forwards transition-colors duration-300 pointer-events-auto"
                style={{
                    backgroundColor: 'var(--sidebar-bg)',
                    borderColor: 'var(--sidebar-border)',
                    boxShadow: 'var(--shadow-premium)'
                }}
            >
                {/* [CRITICAL_FIX] – Active Route Indicator (Blue Pointer) */}
                {activeIndex !== -1 && (
                    <div
                        className="absolute left-0 w-[5px] bg-cyan-400 rounded-r-full z-[110] transition-transform duration-400 cubic-bezier(0.4, 0, 0.2, 1) animate-pulse-subtle"
                        style={{
                            height: '3rem', // 48px -> 3rem
                            transform: `translateY(calc(${activeIndex} * 3.75rem + ${activeIndex} * 0px))`, // 3rem + 0.75rem gap
                            top: '1.5rem', // 24px -> 1.5rem
                            boxShadow: '0 0 8px rgba(0, 200, 255, 0.6)',
                        }}
                    />
                )}

                <style jsx global>{`
                    @keyframes pulse-subtle {
                        0%, 100% { opacity: 1; filter: brightness(1.1) drop-shadow(0 0 2px rgba(34, 211, 238, 0.4)); }
                        50% { opacity: 0.8; filter: brightness(1.3) drop-shadow(0 0 6px rgba(34, 211, 238, 0.8)); }
                    }
                    .animate-pulse-subtle {
                        animation: pulse-subtle 2s infinite ease-in-out;
                    }
                `}</style>

                {socialItems.map((item) => {
                    const Icon = item.icon
                    const isBright = renderMode === 'bright'
                    const isActive = item.isInternal ? mainView === item.view : false

                    return (
                        <div key={item.label} className="relative group">
                            {item.isInternal ? (
                                <button
                                    onClick={() => {
                                        if (item.view) {
                                            setMainView(item.view)
                                            setUiMode('default')
                                        }
                                    }}
                                    className={`sidebar-item relative flex h-12 w-12 flex-col items-center justify-center rounded-full transition-[transform,background-color,color,backdrop-filter] duration-300 ease-in-out active:scale-90 ${isActive ? 'active' : ''}`}
                                    style={{
                                        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                                        backgroundColor: isActive
                                            ? (isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)')
                                            : 'transparent',
                                        backdropFilter: isActive ? 'blur(4px)' : 'none',
                                    }}
                                    aria-label={`Navigate to ${item.label}`}
                                >
                                    <IconContent item={item} isActive={isActive} isBright={isBright} />

                                    {/* Hover indicator dot - matches left sidebar style */}
                                    <div
                                        className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-[opacity,transform] duration-200 ease-out pointer-events-none"
                                        style={{
                                            backgroundColor: isBright ? '#111' : '#22d3ee',
                                            boxShadow: isBright ? 'none' : '0 0 8px rgba(34,211,238,0.8)'
                                        }}
                                    />
                                </button>
                            ) : (
                                <a
                                    href={item.href}
                                    target={item.isExternal ? '_blank' : undefined}
                                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                                    className={`sidebar-item relative flex h-12 w-12 flex-col items-center justify-center rounded-full transition-[transform,background-color,color] duration-300 ease-in-out active:scale-95`}
                                    style={{
                                        color: 'var(--muted-foreground)',
                                    }}
                                    aria-label={`Open ${item.label}`}
                                >
                                    <IconContent item={item} isActive={isActive} isBright={isBright} />

                                    {/* Hover indicator dot - matches left sidebar style */}
                                    <div
                                        className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-[opacity,transform] duration-200 ease-out pointer-events-none"
                                        style={{
                                            backgroundColor: isBright ? '#111' : '#22d3ee',
                                            boxShadow: isBright ? 'none' : '0 0 8px rgba(34,211,238,0.8)'
                                        }}
                                    />
                                </a>
                            )}

                            {/* Tooltip */}
                            <span className="absolute right-14 top-1/2 -translate-y-1/2 hidden whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium backdrop-blur-sm group-hover:block transition-opacity duration-200 pointer-events-none z-[120]"
                                style={{
                                    backgroundColor: 'var(--popover)',
                                    color: 'var(--popover-foreground)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                {item.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function IconContent({ item, isActive, isBright }: { item: SocialItem, isActive: boolean, isBright: boolean }): React.ReactNode {
    const Icon = item.icon
    return (
        <span className={`text-base transition-transform duration-300 group-hover:scale-105 ${isActive ? 'scale-110' : ''}`}>
            {item.label.includes('X') ? (
                <Icon className="h-[18px] w-[18px]" />
            ) : (
                <Icon size={18} strokeWidth={2} />
            )}
        </span>
    )
}
