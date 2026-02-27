'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Terminal, X as XClose } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { useRouter } from 'next/navigation'
import { HELP_TEXT } from '@/lib/terminal-commands'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * MobileTerminal: A full-screen overlay terminal for mobile.
 * Triggered via a floating action button.
 * Reuses all command logic from InteractiveHome but with mobile-native UX.
 */
export function MobileTerminal() {
    const router = useRouter()
    const { renderMode, toggleRenderMode, isTerminalOpen, setIsTerminalOpen, setUiMode } = useUI()
    const [commandHistory, setCommandHistory] = useState<{ type: 'cmd' | 'res'; text: string }[]>([])
    const [historyLog, setHistoryLog] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState<number | null>(null)
    const [historyDraft, setHistoryDraft] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [isPlaying, setIsPlaying] = useState(false)

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const historyEndRef = useRef<HTMLDivElement>(null)

    const isBright = renderMode === 'bright'

    // Sync BGM state
    useEffect(() => {
        const checkState = () => setIsPlaying(localStorage.getItem('bgmState') === 'true')
        window.addEventListener('storage', checkState)
        checkState()
        return () => window.removeEventListener('storage', checkState)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (isTerminalOpen) {
            setTimeout(() => inputRef.current?.focus(), 200)
        }
        // Reset global terminal state on unmount to prevent blur artifacts
        return () => {
            if (isTerminalOpen) setIsTerminalOpen(false)
        }
    }, [isTerminalOpen, setIsTerminalOpen])

    // Auto-scroll
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [commandHistory])

    const toggleBGM = (force?: boolean) => {
        const nextState = force !== undefined ? force : !isPlaying
        setIsPlaying(nextState)
        window.dispatchEvent(new CustomEvent('toggle-bgm', { detail: { force: nextState } }))
    }

    const logCommand = (cmd: string, response?: string) => {
        setCommandHistory(prev => {
            const newHistory = [...prev, { type: 'cmd' as const, text: `> ${cmd}` }]
            if (response) newHistory.push({ type: 'res' as const, text: response })
            return newHistory
        })
        setHistoryLog(prev => {
            if (['help', 'clear', 'cls'].includes(cmd.toLowerCase().trim())) return prev
            return [...prev, cmd]
        })
        setHistoryIndex(null)
        setHistoryDraft('')
    }

    const handleNavigation = (target: string, originalCmd: string): boolean => {
        const map: Record<string, string> = {
            'about': '/about', 'work': '/category/projects', 'interests': '/category/thoughts',
            'connect': 'mailto:tensorthrottleX@proton.me', 'feed': '/feed',
            'thoughts': '/category/thoughts', 'projects': '/category/projects',
            'experiments': '/category/experiments', 'manifold': '/category/manifold',
            'twitter': 'https://x.com/TensorThrottleX', 'x': 'https://x.com/TensorThrottleX',
            'github': 'https://github.com/TensorThrottleX', 'gh': 'https://github.com/TensorThrottleX',
            'email': 'mailto:tensorthrottleX@proton.me'
        }
        const path = map[target]
        if (path) {
            logCommand(originalCmd, path.startsWith('http') || path.startsWith('mailto') ? 'Opening...' : `Redirecting to /${target}...`)
            if (path.startsWith('http') || path.startsWith('mailto')) {
                window.open(path, '_blank')
            } else {
                setUiMode('default') // Reset tree state on navigation
                setTimeout(() => { router.push(path); setIsTerminalOpen(false) }, 600)
            }
            return true
        }
        return false
    }

    const executeCommand = (cmd: string) => {
        const cleanCmd = cmd.trim().toLowerCase()
        let response = ''

        if (cleanCmd === 'help') {
            response = HELP_TEXT
        }
        else if (cleanCmd === 'system') {
            response = `System diagnostics ready.\nKernel: Vercel_Standard_v2\nModules: Notion_API, Framer_Motion\nHidden states may be toggled.`
        }
        else if (cleanCmd.includes('awaken') || cleanCmd.includes('override') || (cleanCmd.includes('system') && cleanCmd.includes('boost'))) {
            toggleBGM(true)
            response = `[CRITICAL_UPDATE]\nSystem mode elevated.\nEnhancements active.`
        }
        else if (['mode normal', 'render normal', 'normal'].includes(cleanCmd)) { toggleRenderMode(null, 'normal'); response = `[SYSTEM_UPDATE]\nRender Mode: NORMAL (Cinematic)` }
        else if (['mode bright', 'render bright', 'bright'].includes(cleanCmd)) { toggleRenderMode(null, 'bright'); response = `[SYSTEM_UPDATE]\nRender Mode: BRIGHT (High Clarity)` }
        else if (['mode dark', 'render dark', 'dark'].includes(cleanCmd)) { toggleRenderMode(null, 'dark'); response = `[SYSTEM_UPDATE]\nRender Mode: DARK (Deep Focus)` }
        else if (['mode', 'render'].includes(cleanCmd)) {
            const nextMode = renderMode === 'normal' ? 'bright' : renderMode === 'bright' ? 'dark' : 'normal'
            toggleRenderMode(null, nextMode)
            response = `[RENDER_TOGGLE]\nCycling render mode...`
        }
        else if (cleanCmd === 'clear' || cleanCmd === 'cls') { setCommandHistory([]); return }
        else if (cleanCmd === 'home') { response = 'Minimizing terminal...'; setTimeout(() => setIsTerminalOpen(false), 500) }
        else if (cleanCmd === 'explain' || cleanCmd === 'explanation') {
            response = `System Motives:\n\n1. FEED\n   To capture raw, transient ideas in real-time.\n\n2. PROJECTS\n   Tangible proof of engineering and execution.\n\n3. THOUGHTS\n   Structured analysis and long-form philosophy.\n\n4. EXPERIMENTS\n   Volatile prototypes and unstable code.\n\n5. MANIFOLD\n   The intersection of AI, systems, and design.\n\n6. ABOUT\n   Core identity and operator context.`
        }
        else {
            const target = cleanCmd.replace(/^open\s+/, '').trim()
            const treeRoots = ['origin', 'focus', 'build', 'philosophy']
            if (treeRoots.some(root => target.startsWith(root))) {
                setUiMode('tree') // Ensure tree is visible on mobile
                window.dispatchEvent(new CustomEvent('tree-expand', { detail: { path: target } }))
                logCommand(cleanCmd, `Expanding data node: ${target}`)
                return
            }
            const handled = handleNavigation(target, cleanCmd)
            if (!handled) { response = 'Command not recognized.\nType "help" to see available commands.' }
            else { logCommand(cleanCmd); return }
        }
        logCommand(cleanCmd, response)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!inputValue.trim()) return
            executeCommand(inputValue)
            setInputValue('')
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (historyLog.length === 0) return
            if (historyIndex === null) {
                setHistoryDraft(inputValue)
                const newIndex = historyLog.length - 1
                setHistoryIndex(newIndex)
                setInputValue(historyLog[newIndex])
            } else {
                const newIndex = Math.max(0, historyIndex - 1)
                setHistoryIndex(newIndex)
                setInputValue(historyLog[newIndex])
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIndex === null) return
            const newIndex = historyIndex + 1
            if (newIndex >= historyLog.length) { setHistoryIndex(null); setInputValue(historyDraft) }
            else { setHistoryIndex(newIndex); setInputValue(historyLog[newIndex]) }
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isTerminalOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsTerminalOpen(true)}
                        className="fixed bottom-24 right-5 z-[190] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-300 hover:ring-[1.5px] hover:ring-black"
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            boxShadow: 'var(--shadow-premium)',
                        }}
                        aria-label="Open Terminal"
                    >
                        <Terminal
                            size={20}
                            className={isBright ? 'text-[#111111]' : 'text-cyan-400'}
                            style={{ filter: isBright ? 'none' : 'drop-shadow(0 0 4px rgba(34,211,238,0.4))' }}
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Full-Screen Terminal Overlay */}
            <AnimatePresence>
                {isTerminalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[250] flex flex-col font-mono"
                        style={{
                            backgroundColor: isBright ? '#fafafa' : '#050505',
                        }}
                    >
                        {/* Mac-style Header */}
                        <div
                            className="flex items-center justify-between px-4 h-12 shrink-0 border-b"
                            style={{
                                backgroundColor: isBright ? '#ebebeb' : '#080808',
                                borderColor: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.12)',
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50" style={{ color: 'var(--muted-foreground)' }}>
                                SECURE_SHELL
                            </span>
                            <button
                                onClick={() => setIsTerminalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors active:scale-90"
                                style={{
                                    backgroundColor: isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                    color: 'var(--foreground)',
                                }}
                            >
                                <XClose size={16} />
                            </button>
                        </div>

                        {/* Scrollable Output */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-2 text-xs leading-relaxed scroll-smooth touch-pan-y transform-gpu will-change-transform"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <div className="text-[10px] mb-4 leading-relaxed uppercase tracking-wider border-l-2 pl-3 transition-colors duration-500"
                                style={{ color: isBright ? '#030712' : 'var(--muted-foreground)', borderColor: isBright ? 'rgba(0,0,0,0.4)' : 'var(--border)' }}
                            >
                                [CON_ESTABLISHED]<br />
                                SECURE_SHELL_ACTIVE<br />
                                TYPE &apos;HELP&apos; FOR SYSTEM DIRECTIVES.
                            </div>

                            {commandHistory.map((item, i) => (
                                <div key={i} className="whitespace-pre-wrap leading-relaxed flex items-start gap-2"
                                    style={{ color: item.type === 'cmd' ? (isBright ? '#1e40af' : '#22d3ee') : 'var(--foreground)' }}
                                >
                                    {item.type === 'cmd' ? (
                                        <span className="font-bold select-none opacity-80 shrink-0">
                                            sh-3.2$
                                        </span>
                                    ) : null}
                                    <div className="flex-1">
                                        {item.text.replace(/^> /, '').split('\n').map((line, li) => {
                                            const isHeader = line.trim().endsWith(':');

                                            // Match patterns similar to InteractiveHome
                                            const cmdDescMatch = line.match(/^(\s{2,})([a-z0-9\s]+?)\s{3,}(.+)$/i);
                                            const openMatch = line.match(/^(\s{2,})(open\s+[a-z]+)$/i);
                                            const shortMatch = line.match(/^(\s{2,})([a-z]{3,})$/i);

                                            const isTitle = line.trim().startsWith('[');

                                            if (isTitle) {
                                                return <div key={li} className="select-none font-black opacity-90 mt-2 mb-2 tracking-widest text-[11px] uppercase">{line}</div>;
                                            }

                                            if (isHeader) {
                                                return <div key={li} className="select-none font-bold opacity-60 mt-3 mb-1 tracking-widest text-[10px] uppercase">{line}</div>;
                                            }

                                            if (cmdDescMatch || openMatch || shortMatch) {
                                                const cmdPart = cmdDescMatch ? cmdDescMatch[2] : (openMatch ? openMatch[2] : shortMatch![2]);
                                                const descPart = cmdDescMatch ? cmdDescMatch[3] : null;
                                                const prefix = cmdDescMatch ? cmdDescMatch[1] : (openMatch ? openMatch[1] : shortMatch![1]);

                                                return (
                                                    <div key={li} className="flex items-center active:bg-white/5 rounded px-1 -ml-1 transition-colors"
                                                        onClick={() => {
                                                            setInputValue(cmdPart.trim());
                                                            inputRef.current?.focus();
                                                        }}
                                                    >
                                                        <span className="select-none opacity-0 whitespace-pre text-[8px]">{prefix}</span>
                                                        <span className="underline decoration-cyan-500/30 underline-offset-4 min-w-[70px] inline-block">
                                                            {cmdPart}
                                                        </span>
                                                        {descPart && (
                                                            <span className="select-none opacity-40 ml-3 italic text-[10px] whitespace-nowrap">
                                                                {descPart}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={li} className={cn(
                                                    line.trim() === '' ? "h-1" : "",
                                                    (line.startsWith(' ') || line.match(/^[0-9]\./)) && "select-none opacity-50 text-[10px]"
                                                )}>
                                                    {line}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div ref={historyEndRef} className="h-4" />
                        </div>

                        {/* Command Input at Bottom */}
                        <div
                            className="flex items-center gap-3 px-4 h-14 shrink-0 border-t"
                            style={{
                                backgroundColor: isBright ? '#ebebeb' : '#080808',
                                borderColor: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.12)',
                                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                            }}
                        >
                            <span className={`font-bold text-sm ${isBright ? 'text-blue-800' : 'text-cyan-400'}`}>$</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={onKeyDown}
                                className={`flex-1 bg-transparent border-none outline-none text-sm font-mono ${isBright ? 'caret-blue-800' : 'caret-cyan-400'}`}
                                style={{ color: isBright ? '#030712' : 'var(--foreground)' }}
                                placeholder="Type a command..."
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
