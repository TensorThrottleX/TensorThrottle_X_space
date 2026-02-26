'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Loader2, Send, ShieldAlert, XOctagon } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { useScrutiny } from '@/hooks/use-scrutiny'
import { useModeration } from '@/hooks/use-moderation'

// Request timeout for contact API
const CONTACT_TIMEOUT_MS = 30_000;

// [MSG_PAGE] – Main container for the messaging interface
export function MsgView(): React.ReactNode {
    const { renderMode } = useUI()
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loadTime, setLoadTime] = useState<number>(0)
    const [isSending, setIsSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const [isSent, setIsSent] = useState(false)
    const { scrutiny, isProfane } = useScrutiny(message, 0) // 0ms debounce on desktop for instant feedback
    const [hField, setHField] = useState('') // Honeypot
    const [imgError, setImgError] = useState(false)
    const coffeeCardRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)

    // Track mounted state for async operations
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            // Abort any pending request on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    useEffect(() => {
        setLoadTime(Date.now())
    }, [])

    // Visibility observer for Coffee Card
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible')
                }
            },
            { threshold: 0.1 }
        )

        if (coffeeCardRef.current) {
            observer.observe(coffeeCardRef.current)
        }

        return () => observer.disconnect()
    }, [])

    const maxWords = 1000

    // [MSG_PAGE] – Calculates word count
    const getWordCount = (text: string) => {
        return text.trim().split(/\s+/).filter(Boolean).length
    }

    const wordCount = getWordCount(message)

    // Validation Logic
    const isNameValid = name.trim().length >= 2 && name.trim().length <= 100
    const isMessageValid = message.trim().length >= 5 && wordCount <= maxWords
    const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const canSend = isConfirmed && isNameValid && isMessageValid && isEmailValid && !isProfane && !isSending && !isSent

    // [MSG_PAGE] – Enforces word limit on input
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        const count = getWordCount(value)

        // Hard stop if word count exceeds limit - only block if adding more words
        if (count > maxWords && count > wordCount) {
            return
        }
        setMessage(value)
    }

    // [MSG_PAGE] – Handles the core email sending logic
    const { checkContent, isChecking } = useModeration()

    const handleSend = useCallback(async () => {
        if (!canSend) return

        // Abort previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller
        const timeoutId = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS)

        setIsSending(true)
        setSendError(null)

        try {
            // 1. Server-Side Scrutiny (ML)
            const moderation = await checkContent(message + " " + name, { context: 'chat', userId: name });

            // Check if component unmounted during moderation
            if (!isMountedRef.current) return;

            if (!moderation) {
                throw new Error('Security check unavailable.');
            }

            if (!moderation.allow) {
                if (moderation.severity === 'high') {
                    setSendError("Severe or offensive language is not allowed.");
                } else {
                    setSendError("Your message contains abusive language. Please revise.");
                }
                setIsSending(false);
                return;
            }

            // 2. Transmission
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: name.trim(),
                    email: email.trim() || undefined,
                    message: message.trim(),
                    protocol: isConfirmed,
                    h_field: hField,
                    load_time: loadTime
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            // Check if component unmounted during fetch
            if (!isMountedRef.current) return;

            const data = await response.json()

            if (response.ok) {
                setIsSent(true)
                // Clear form but keep sent state
                setName('')
                setEmail('')
                setMessage('')

                // Keep success state visible briefly before allowing new transmission logic
                // (though project spec implies it stays "Sent")
            } else {
                // Return structured error message from backend
                setSendError(data.error || 'Transmission engine reported an anomaly. Please try again.');
            }
        } catch (err) {
            clearTimeout(timeoutId)
            // Don't log/show error for intentional aborts
            if (err instanceof Error && err.name === 'AbortError') {
                if (isMountedRef.current) {
                    setSendError('Request timed out. Please try again.');
                }
                return;
            }
            console.error('[FRONTEND_ERROR]', err);
            if (isMountedRef.current) {
                setSendError('Transmission link failure. Unable to establish a secure connection.');
            }
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current) {
                setIsSending(false)
            }
        }
    }, [canSend, checkContent, message, name, email, isConfirmed, hField, loadTime])

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full px-6 pt-10 pb-20"
        >
            <div className="max-w-2xl mx-auto space-y-8">
                {/* [MSG_PAGE] – Header */}
                <div className="space-y-2">
                    <h1 className="text-h1 font-black tracking-tighter" style={{ color: 'var(--heading-primary)' }}>
                        Secure Channel
                    </h1>
                    <p className="text-sm font-mono text-cyan-500/60 uppercase tracking-tighter">
                        CRITICAL_COMM_LINK 01
                    </p>
                </div>

                {/* [MSG_PAGE] – Guidelines */}
                <div className={cn(
                    "p-6 rounded-2xl border backdrop-blur-md transition-all duration-500 shadow-[var(--shadow-premium)]",
                    renderMode === 'bright' ? "bg-[#f4f4f4] border-black/5" : "bg-black/40 border-white/5"
                )}>
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="space-y-4 flex-1 text-left">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--foreground)' }}>Transmission Protocol</h3>
                                <ul className="mt-2 space-y-1 text-xs leading-relaxed list-disc list-inside" style={{ color: renderMode === 'bright' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }}>
                                    <li>Identity must be at least 2 characters.</li>
                                    <li>Zero tolerance for profanity or abuse (Filtered).</li>
                                    <li>Limit: {maxWords} words per transmission.</li>
                                    <li>Format validation required for return communications.</li>
                                </ul>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isConfirmed}
                                        onChange={(e) => setIsConfirmed(e.target.checked)}
                                    />
                                    <div className={cn(
                                        "w-5 h-5 rounded border transition-all flex items-center justify-center",
                                        isConfirmed ? "bg-cyan-500 border-cyan-500" : (renderMode === 'bright' ? "border-black/20 bg-black/5 group-hover:border-black/40" : "border-white/20 bg-white/5 group-hover:border-white/40")
                                    )}>
                                        {isConfirmed && <CheckCircle size={14} className={renderMode === 'bright' ? "text-white" : "text-black"} />}
                                    </div>
                                </div>
                                <span className="text-[10px] uppercase font-black tracking-tighter select-none" style={{ color: isConfirmed ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                                    I adhere to the transmission protocol.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* [MSG_PAGE] – Message Form */}
                <div className={cn(
                    "space-y-6 transition-all duration-500",
                    !isConfirmed && "opacity-40 pointer-events-none grayscale blur-[1px]"
                )}>
                    {/* Honeypot */}
                    <input type="text" className="hidden" aria-hidden="true" value={hField} onChange={e => setHField(e.target.value)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-tighter font-black ml-1 opacity-40">Identity (Required)</label>
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={cn(
                                    "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors",
                                    !isNameValid && name.length > 0 ? "border-red-500/50" : "",
                                    renderMode === 'bright' ? "bg-[#f4f4f4] border-black/10 focus:border-black/20 text-black" : "bg-white/5 border-white/10 focus:border-cyan-500/50 text-white"
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-tighter font-black ml-1 opacity-40">Return Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="name@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn(
                                    "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors",
                                    !isEmailValid && email.length > 0 ? "border-red-500/50" : "",
                                    renderMode === 'bright' ? "bg-[#f4f4f4] border-black/10 focus:border-black/20 text-black" : "bg-white/5 border-white/10 focus:border-cyan-500/50 text-white"
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] uppercase tracking-tighter font-black ml-1 opacity-40">Transmission Data (Required)</label>

                            {/* Scrutiny Status Indicator (Top Right of Textarea) */}
                            <AnimatePresence>
                                {scrutiny.level > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border backdrop-blur-md z-10",
                                            scrutiny.level === 1
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                                : "bg-red-500/10 border-red-500/30 text-red-500"
                                        )}
                                    >
                                        {scrutiny.level === 1 ? <AlertCircle size={10} /> : <XOctagon size={10} />}
                                        <span>
                                            {scrutiny.level === 1 ? "Advisory: " : "Violation: "}
                                            {scrutiny.violations.join(", ")}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <textarea
                            rows={8}
                            placeholder="Min 5 characters..."
                            value={message}
                            onChange={handleMessageChange}
                            className={cn(
                                "w-full border rounded-2xl px-4 py-4 text-sm focus:outline-none transition-all resize-none",
                                scrutiny.level >= 2
                                    ? "border-red-500/50 bg-red-500/5 focus:border-red-500"
                                    : scrutiny.level === 1
                                        ? "border-amber-500/50 bg-amber-500/5 focus:border-amber-500"
                                        : (renderMode === 'bright' ? "bg-[#f4f4f4] border-black/10 focus:border-black/20 text-black" : "bg-white/5 border-white/10 focus:border-cyan-500/50 text-white")
                            )}
                        />

                        {/* Word Counter */}
                        <div className={cn(
                            "absolute bottom-4 right-4 text-[9px] font-mono tracking-tighter transition-colors",
                            wordCount >= maxWords ? "text-red-500 font-bold" : (renderMode === 'bright' ? "text-black/30" : "text-white/30")
                        )}>
                            {wordCount} / {maxWords} words
                        </div>
                    </div>

                    {/* Send Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className={cn(
                                "relative overflow-hidden group flex items-center gap-3 px-10 py-4 rounded-full border transition-all duration-300",
                                !canSend && !isSent
                                    ? "opacity-50 cursor-not-allowed bg-black/5 border-white/5 grayscale"
                                    : isSent
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        : (renderMode === 'bright'
                                            ? "bg-black border-black text-white hover:bg-black/80 shadow-lg"
                                            : "bg-white border-white text-black hover:bg-white/80 shadow-lg shadow-cyan-500/10")
                            )}
                        >
                            {isSending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isSent ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                </motion.div>
                            ) : (
                                <Send size={18} className={cn(!canSend ? "" : "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform")} />
                            )}
                            <span className="text-xs font-black uppercase tracking-tighter">
                                {isSending ? 'Transmitting...' : isSent ? 'Sent' : 'Initialize Transmission'}
                            </span>
                        </button>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {sendError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="max-w-md px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex flex-col items-center text-center gap-1"
                                >
                                    <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider">
                                        <AlertCircle size={12} />
                                        <span>Transmission Failure</span>
                                    </div>
                                    <p className="text-[11px] opacity-90 font-medium">
                                        {sendError}
                                    </p>
                                </motion.div>
                            )}
                            {isSent && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] text-emerald-500 font-bold uppercase tracking-normal"
                                >
                                    Transmission Successfully Delivered.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className={cn("h-px w-full", renderMode === 'bright' ? "bg-black/10" : "bg-white/5")} />

                {/* Support Section */}
                <div className="flex justify-center py-6">
                    <div
                        ref={coffeeCardRef}
                        className="coffee-card w-full max-w-[540px] relative overflow-hidden shadow-[var(--shadow-premium)]"
                    >
                        {/* BMC Logo - Top Left Corner */}
                        <div className="absolute top-4 left-4 w-10 h-10 hover:opacity-80 transition-opacity">
                            <img
                                src="/media/brand/bmc-logo.svg"
                                alt="Buy Me a Coffee"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Author Profile Picture - Top Right Corner */}
                        <div className="absolute top-8 right-8 transition-transform duration-300 hover:scale-105">
                            <div className={cn(
                                "w-14 h-14 md:w-16 md:h-16 rounded-full border overflow-hidden backdrop-blur-md relative flex items-center justify-center",
                                renderMode === 'bright' ? "border-black/10 bg-black/5" : "border-white/10 bg-white/5"
                            )}>
                                {!imgError ? (
                                    <motion.img
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        src="/media/brand/profile.jpg"
                                        alt="Author Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="opacity-20">
                                        <div className="w-6 h-6 rounded-full border-2 border-current animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Text Block - Top Left */}
                        <div className="text-left pt-16 pl-8 pb-10 pr-24">
                            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4" style={{ color: 'var(--foreground)' }}>
                                Support the Journey
                            </h3>
                            <p className="text-sm leading-[1.5] mb-8 max-w-[85%] md:max-w-[70%]" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                                Currently in a building phase — growing, learning, and contributing.<br />
                                Your support is genuinely appreciated.
                            </p>

                            {/* CTA Button */}
                            <a
                                href="https://buymeacoffee.com/TensorThrottleX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="coffee-btn"
                            >
                                <span>Support via BMC</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
