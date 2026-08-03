'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { useMediaOrchestrator } from '@/components/providers/MediaOrchestrator'
import { cn } from '@/lib/utils'
import { Terminal, Activity, Database, Cpu, HardDrive, Wifi, ShieldCheck } from 'lucide-react'

interface TelemetryWidgetProps {
    activeTab: 'purpose' | 'about' | 'quote'
}

export function TelemetryWidget({ activeTab }: TelemetryWidgetProps) {
    const { renderMode, setIsTerminalOpen, isTerminalOpen } = useUI()
    const { activeSession, isAudioMuted } = useMediaOrchestrator()
    const isBright = renderMode === 'bright'

    // Telemetry stats
    const [cpu, setCpu] = useState(24.5)
    const [ram, setRam] = useState(412)
    const [ping, setPing] = useState(12)
    const [logs, setLogs] = useState<string[]>([])
    const logEndRef = useRef<HTMLDivElement>(null)

    // Simulate real-time hardware telemetry
    useEffect(() => {
        const interval = setInterval(() => {
            setCpu(prev => {
                const diff = (Math.random() - 0.5) * 4
                return Math.max(10, Math.min(85, parseFloat((prev + diff).toFixed(1))))
            })
            setRam(prev => {
                const diff = Math.round((Math.random() - 0.5) * 8)
                return Math.max(380, Math.min(512, prev + diff))
            })
            setPing(prev => {
                const diff = Math.round((Math.random() - 0.5) * 4)
                return Math.max(8, Math.min(45, prev + diff))
            })
        }, 2000)

        // Initialize logs
        const initialLogs = [
            `[${new Date().toLocaleTimeString()}] SYS: kernel_v2.0 loaded.`,
            `[${new Date().toLocaleTimeString()}] SYS: notion_api gateway initialized.`,
            `[${new Date().toLocaleTimeString()}] SYS: database_relay connected.`,
            `[${new Date().toLocaleTimeString()}] SYS: spatial_map_engine status: OK.`,
            `[${new Date().toLocaleTimeString()}] SYS: ready for technical exploration.`
        ]
        setLogs(initialLogs)

        return () => clearInterval(interval)
    }, [])

    // Log user tab changes
    const prevTabRef = useRef(activeTab)
    useEffect(() => {
        if (prevTabRef.current !== activeTab) {
            appendLog(`USER: switched view to '${activeTab.toUpperCase()}'`)
            if (activeTab !== 'quote') {
                appendLog(`SYS: loading ${activeTab}_deck components...`)
            } else {
                appendLog(`SYS: loading quotes_daemon pool...`)
            }
            prevTabRef.current = activeTab
        }
    }, [activeTab])

    // Log renderMode changes
    const prevRenderModeRef = useRef(renderMode)
    useEffect(() => {
        if (prevRenderModeRef.current !== renderMode) {
            appendLog(`SYS: render_mode updated to '${renderMode.toUpperCase()}'`)
            prevRenderModeRef.current = renderMode
        }
    }, [renderMode])

    // Log terminal open/close
    useEffect(() => {
        appendLog(`SYS: terminal_interface state changed to ${isTerminalOpen ? 'ACTIVE' : 'COLLAPSED'}`)
    }, [isTerminalOpen])

    const appendLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [...prev.slice(-30), `[${timestamp}] ${msg}`])
    }

    // Scroll to bottom of logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const activeSoundName = (activeSession?.audioEnabled !== false && !isAudioMuted && activeSession?.assetPackage?.id) 
        ? activeSession.assetPackage.id 
        : 'MUTED'

    return (
        <div className="flex flex-col gap-6 w-full select-none">
            {/* Telemetry Panel */}
            <div
                className={cn(
                    "flex flex-col gap-6 p-6 rounded-3xl border backdrop-blur-lg transition-all duration-300",
                    isBright
                        ? "bg-[#F5F5F4] border-black/10 shadow-[var(--shadow-soft)]"
                        : "bg-black/40 border-white/10 shadow-[var(--shadow-premium)]"
                )}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <Activity size={16} className={isBright ? 'text-cyan-600' : 'text-cyan-400'} />
                        <span className={cn("text-xs font-black tracking-widest uppercase font-mono", isBright ? "text-black/80" : "text-white/80")}>
                            SYSTEM_TELEMETRY
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black font-mono tracking-wider text-emerald-500">LIVE</span>
                    </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4">
                    {/* CPU */}
                    <div className={cn("p-4 rounded-2xl border", isBright ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5")}>
                        <div className={cn(
                            "flex justify-between items-center mb-1 text-[10px] font-mono",
                            isBright ? "text-black/50" : "text-white/50"
                        )}>
                            <span className="flex items-center gap-1"><Cpu size={10} /> PROCESSOR</span>
                            <span className={isBright ? "text-black font-bold" : "text-white font-bold"}>{cpu}%</span>
                        </div>
                        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isBright ? "bg-black/10" : "bg-white/10")}>
                            <motion.div
                                className="h-full bg-cyan-400"
                                animate={{ width: `${cpu}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* RAM */}
                    <div className={cn("p-4 rounded-2xl border", isBright ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5")}>
                        <div className={cn(
                            "flex justify-between items-center mb-1 text-[10px] font-mono",
                            isBright ? "text-black/50" : "text-white/50"
                        )}>
                            <span className="flex items-center gap-1"><HardDrive size={10} /> MEMORY</span>
                            <span className={isBright ? "text-black font-bold" : "text-white font-bold"}>{ram} MB</span>
                        </div>
                        <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isBright ? "bg-black/10" : "bg-white/10")}>
                            <motion.div
                                className="h-full bg-purple-400"
                                animate={{ width: `${(ram / 512) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Connection Status Row */}
                <div className="flex flex-col gap-3 text-xs font-mono">
                    <div className="flex justify-between items-center">
                        <span className="opacity-40 flex items-center gap-1.5"><Database size={12} /> SUPABASE RELAY</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><ShieldCheck size={12} /> CONNECTED</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="opacity-40 flex items-center gap-1.5"><Wifi size={12} /> GATEWAY PING</span>
                        <span className={cn("font-bold", ping > 30 ? "text-amber-500" : "text-cyan-400")}>{ping} ms</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3" style={{ borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                        <span className="opacity-40">AUDIO ENGINE</span>
                        <span className={cn("font-bold", (!activeSession || activeSession.audioEnabled === false || isAudioMuted) ? "opacity-30" : "text-purple-400")}>
                            {activeSoundName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Systems Log Console */}
            <div
                className={cn(
                    "flex flex-col rounded-3xl border backdrop-blur-lg overflow-hidden h-[15rem] transition-all duration-300",
                    isBright
                        ? "bg-[#F5F5F4] border-black/10 shadow-[var(--shadow-soft)]"
                        : "bg-[#050505]/80 border-white/10 shadow-[var(--shadow-premium)]"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "px-4 py-2 border-b flex items-center justify-between select-none",
                    isBright ? "bg-black/5" : "bg-white/5"
                )} style={{ borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                    <span className={cn(
                        "text-[10px] font-black font-mono tracking-widest uppercase",
                        isBright ? "text-black/40" : "text-white/40"
                    )}>EVENT_LOGGER</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute" />
                    </div>
                </div>

                {/* Log Output Stream */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed space-y-1 select-text scrollbar-thin scrollbar-thumb-white/20">
                    <AnimatePresence>
                        {logs.map((log, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    log.includes('USER:') ? "text-cyan-400 font-semibold" :
                                    log.includes('SYS: render_mode') ? "text-purple-400" :
                                    log.includes('gateway') || log.includes('connected') ? "text-emerald-400" : "text-white/60"
                                )}
                            >
                                {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* Terminal Console Trigger Bridge */}
            <button
                onClick={() => setIsTerminalOpen(true)}
                className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 font-mono text-left transition-all duration-300 w-full hover:-translate-y-0.5",
                    isBright
                        ? "bg-black border-black text-white hover:bg-black/90 shadow-md hover:shadow-cyan-500/10"
                        : "bg-white border-white text-black hover:bg-white/90 shadow-md hover:shadow-cyan-400/20"
                )}
            >
                {/* Glow border overlay */}
                <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    isBright
                        ? "bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.15),transparent_70%)]"
                        : "bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.25),transparent_70%)]"
                )} />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className={isBright ? "text-cyan-400" : "text-cyan-600"} />
                        <span className="text-[10px] font-black tracking-widest uppercase">SECURE_SHELL</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-50 font-mono group-hover:translate-x-0.5 transition-transform">
                        ACTIVATE [ / ]
                    </span>
                </div>
                <div className="mt-2 text-[10px] opacity-40 font-mono">
                    sh-3.2$ execute commands or type help
                </div>
            </button>
        </div>
    )
}
