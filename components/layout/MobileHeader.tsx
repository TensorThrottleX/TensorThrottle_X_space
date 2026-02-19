'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MoreVertical, X as XClose, Github, Mail, Coffee, MessageSquare, Send, ShieldAlert, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// X (Twitter) Icon
function XIcon({ className }: { className?: string }): React.ReactNode {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

const externalLinks = [
    { label: 'Message', action: 'msg', icon: MessageSquare, isInternal: true },
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

export function MobileHeader({ pageTitleOverride, articleCount }: { pageTitleOverride?: string; articleCount?: number }) {
    const pathname = usePathname()
    const { renderMode, mainView } = useUI()
    const [menuOpen, setMenuOpen] = useState(false)
    const [showMessage, setShowMessage] = useState(false)
    const [time, setTime] = useState<Date | null>(null)
    const [mounted, setMounted] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const isBright = renderMode === 'bright'

    // Message Form State
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)

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

    const handleSend = async () => {
        if (!name || !message || !isConfirmed) return
        setIsSending(true)
        setSendError(null)

        // Simulate sending (replace with actual API call if needed, mirroring MsgView)
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: name.trim(),
                    email: email.trim() || undefined,
                    message: message.trim(),
                    protocol: isConfirmed,
                    load_time: Date.now()
                })
            })
            if (response.ok) {
                setIsSent(true)
                setName('')
                setEmail('')
                setMessage('')
            } else {
                setSendError('Transmission failed.')
            }
        } catch (e) {
            setSendError('Network error.')
        } finally {
            setIsSending(false)
        }
    }

    const pageTitle = pageTitleOverride || (mainView === 'msg' ? 'Message' : getPageTitle(pathname))

    return (
        <>
            <header
                className="mobile-header fixed top-0 left-0 right-0 z-[200] backdrop-blur-xl border-b transition-colors duration-300"
                style={{
                    backgroundColor: isBright ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,10,0.92)',
                    borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                    height: '56px'
                }}
            >
                <div className="flex items-center justify-between h-full px-4">
                    {/* Left Section: Page Title & Article Count */}
                    <div className="flex flex-col justify-center">
                        <h1
                            className="text-sm font-black tracking-tight uppercase leading-none"
                            style={{ color: 'var(--heading-primary)' }}
                        >
                            {pageTitle}
                        </h1>
                        {articleCount !== undefined && (
                            <span
                                className="text-[10px] font-mono font-medium tracking-wide mt-0.5 opacity-60"
                                style={{ color: 'var(--muted-foreground)' }}
                            >
                                {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                            </span>
                        )}
                    </div>

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
                                                    <button // Changed to button for unified handling
                                                        key={link.label}
                                                        onClick={() => {
                                                            setMenuOpen(false)
                                                            if (link.action === 'msg') {
                                                                setShowMessage(true)
                                                            } else if (link.href) {
                                                                window.open(link.href, '_blank')
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 active:scale-[0.97] w-full text-left"
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
                                                    </button>
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

            {/* FULL SCREEN MESSAGE OVERLAY */}
            <AnimatePresence>
                {showMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed inset-0 z-[250] overflow-y-auto pb-20 no-scrollbar touch-pan-y",
                            isBright ? "bg-[#f5f5f5]" : "bg-black"
                        )}
                        style={{ height: '100dvh' }}
                    >
                        {/* Overlay Header */}
                        <div className="sticky top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b z-[260] backdrop-blur-xl shrink-0"
                            style={{
                                backgroundColor: isBright ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                                borderColor: isBright ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                            }}>
                            <span className="text-sm font-black uppercase tracking-tight">Secure Channel</span>
                            <button
                                onClick={() => setShowMessage(false)}
                                className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isBright ? "bg-black/5 active:bg-black/10" : "bg-white/10 active:bg-white/20")}
                            >
                                <XClose size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8 max-w-lg mx-auto pb-32">

                            {/* Guide */}
                            <div className={cn("p-4 rounded-xl border flex items-start gap-3", isBright ? "bg-white border-black/5" : "bg-white/5 border-white/10")}>
                                <ShieldAlert size={20} className="text-cyan-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wide">Protocol Guidelines</h3>
                                    <p className="text-[11px] opacity-70 leading-relaxed">
                                        Identity verification required. Zero tolerance for prohibited content.
                                        Keep transmissions concise.
                                    </p>
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer touch-manipulation p-1 -ml-1">
                                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isConfirmed ? "bg-cyan-500 border-cyan-500" : "border-gray-500/50")}>
                                            {isConfirmed && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                        <input type="checkbox" checked={isConfirmed} onChange={e => setIsConfirmed(e.target.checked)} className="hidden" />
                                        <span className={cn("text-[10px] font-bold uppercase", isConfirmed ? "text-cyan-500" : "opacity-60")}>I Confirm Compliance</span>
                                    </label>
                                </div>
                            </div>

                            {/* Form */}
                            <div className={cn("space-y-4 transition-opacity duration-300", !isConfirmed && "opacity-50 pointer-events-none")}>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase opacity-40 ml-1">Identity</label>
                                    <input
                                        type="text"
                                        placeholder="YOUR NAME"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className={cn("w-full h-12 px-4 rounded-xl border bg-transparent text-sm focus:outline-none focus:border-cyan-500/50 transition-colors", isBright ? "border-black/10 bg-white" : "border-white/10 bg-white/5")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase opacity-40 ml-1">Contact (Optional)</label>
                                    <input
                                        type="email"
                                        placeholder="EMAIL ADDRESS"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={cn("w-full h-12 px-4 rounded-xl border bg-transparent text-sm focus:outline-none focus:border-cyan-500/50 transition-colors", isBright ? "border-black/10 bg-white" : "border-white/10 bg-white/5")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase opacity-40 ml-1">Transmission</label>
                                    <textarea
                                        rows={6}
                                        placeholder="ENTER MESSAGE DATA..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        className={cn("w-full p-4 rounded-xl border bg-transparent text-sm focus:outline-none focus:border-cyan-500/50 resize-none transition-colors", isBright ? "border-black/10 bg-white" : "border-white/10 bg-white/5")}
                                    />
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={!name || !message || isSending || isSent}
                                    className={cn(
                                        "w-full h-14 mt-2 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs tracking-wider transition-all shadow-lg active:scale-[0.98]",
                                        isSent
                                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                            : (isBright ? "bg-black text-white hover:bg-black/80 shadow-black/10" : "bg-white text-black hover:bg-white/90 shadow-white/5")
                                    )}
                                >
                                    {isSending ? <Loader2 size={16} className="animate-spin" /> : (isSent ? <CheckCircle size={16} /> : <Send size={16} />)}
                                    {isSending ? 'TRANSMITTING...' : (isSent ? 'TRANSMISSION SENT' : 'INITIALIZE UPLOAD')}
                                </button>

                                {sendError && (
                                    <div className="flex items-center gap-2 text-red-500 text-[10px] uppercase font-bold justify-center pt-2">
                                        <AlertCircle size={12} />
                                        <span>{sendError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full h-px bg-current opacity-10" />

                            {/* BMC Card (Mobile Version) - Slide Up Entry */}
                            <motion.a
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: 0.2
                                }}
                                href="https://buymeacoffee.com/TensorThrottleX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn("flex flex-col gap-4 p-5 rounded-xl border relative overflow-hidden group transition-all duration-300 active:scale-[0.98]", isBright ? "bg-white border-black/5 shadow-sm" : "bg-white/5 border-white/5")}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold">Support Protocols</h3>
                                        <p className="text-xs opacity-60 leading-relaxed max-w-[200px]">
                                            Fueling the development of advanced neural architectures.
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Coffee size={20} />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 w-full justify-center">
                                        Support via BMC <Coffee size={12} />
                                    </span>
                                </div>
                            </motion.a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
