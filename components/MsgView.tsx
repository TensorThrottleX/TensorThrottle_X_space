'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Loader2, Send, ShieldAlert, XOctagon } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { analyzeMessage, ScrutinyResult } from '@/lib/scrutiny'



// [MSG_PAGE] – Main container for the messaging interface
export function MsgView(): React.ReactNode {
    const { renderMode } = useUI()
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const [isSent, setIsSent] = useState(false)
    const [scrutiny, setScrutiny] = useState<ScrutinyResult>({ level: 0, score: 0, violations: [], offendingWords: [] })
    const [hField, setHField] = useState('') // Honeypot
    const [imgError, setImgError] = useState(false)
    const coffeeCardRef = useRef<HTMLDivElement>(null)

    // [MSG_PAGE] – Real-time Message Scrutiny
    useEffect(() => {
        const result = analyzeMessage(message)
        setScrutiny(result)
    }, [message])

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
    const isProfane = scrutiny.level >= 2
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
    const handleSend = async () => {
        if (!canSend) return

        setIsSending(true)
        setSendError(null)

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: name.trim(),
                    email: email.trim() || undefined,
                    message: message.trim(),
                    protocol: isConfirmed,
                    h_field: hField
                })
            })

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
            console.error('[FRONTEND_ERROR]', err);
            setSendError('Transmission link failure. High-latency or connection unstable.');
        } finally {
            setIsSending(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 overflow-y-auto px-6 pt-32 pb-20 secure-channel-container"
        >
            <div className="max-w-[720px] mx-auto space-y-8">
                {/* [MSG_PAGE] – Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--heading-primary)' }}>
                        Secure Channel
                    </h1>
                    <p className="text-sm font-mono text-cyan-500/60 uppercase tracking-widest">
                        CRITICAL_COMM_LINK 01
                    </p>
                </div>

                {/* [MSG_PAGE] – Guidelines */}
                <div className={cn(
                    "p-6 rounded-2xl border backdrop-blur-md transition-all duration-500",
                    renderMode === 'bright' ? "bg-[#f4f4f4] border-black/5" : "bg-black/40 border-white/5"
                )}>
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="space-y-4 flex-1 text-left">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--foreground)' }}>Transmission Protocol</h3>
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
                                <span className="text-xs font-medium select-none" style={{ color: renderMode === 'bright' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.7)' }}>
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
                            <label className="text-[10px] uppercase tracking-widest font-bold ml-1 opacity-40">Identity (Required)</label>
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
                            <label className="text-[10px] uppercase tracking-widest font-bold ml-1 opacity-40">Return Email (Optional)</label>
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
                        <label className="text-[10px] uppercase tracking-widest font-bold ml-1 opacity-40">Transmission Data (Required)</label>
                        <textarea
                            rows={8}
                            placeholder="Min 5 characters..."
                            value={message}
                            onChange={handleMessageChange}
                            className={cn(
                                "w-full border rounded-2xl px-4 py-4 text-sm focus:outline-none transition-all resize-none",
                                scrutiny.level >= 2 ? "border-red-500/50 bg-red-500/5" : (renderMode === 'bright' ? "bg-[#f4f4f4] border-black/10 focus:border-black/20 text-black" : "bg-white/5 border-white/10 focus:border-cyan-500/50 text-white")
                            )}
                        />

                        {/* Scrutiny Warning */}
                        <AnimatePresence>
                            {scrutiny.level >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="mt-2 p-3 rounded-xl border bg-red-500/5 border-red-500/20 text-red-400 flex items-start gap-3 text-[10px] font-medium"
                                >
                                    <XOctagon size={14} className="shrink-0" />
                                    <div className="space-y-1">
                                        <p className="uppercase tracking-widest font-bold text-red-500">Policy Violation</p>
                                        <p className="opacity-80">Message contains prohibited language. Transmission blocked.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {isSending ? 'Transmitting...' : isSent ? 'Sent' : 'Initialize Transmission'}
                            </span>
                        </button>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {sendError && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] text-red-500 font-medium tracking-wide flex items-center gap-1.5"
                                >
                                    <AlertCircle size={12} /> {sendError}
                                </motion.p>
                            )}
                            {isSent && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest"
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
                        className="coffee-card w-full max-w-[540px] relative overflow-hidden"
                    >
                        {/* BMC Logo - Top Left Corner */}
                        <div className="absolute top-4 left-4 w-10 h-10 hover:opacity-80 transition-opacity">
                            <img
                                src="/bmc/bmc-logo.svg"
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
                                        src="/bmc/profile.jpg"
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
