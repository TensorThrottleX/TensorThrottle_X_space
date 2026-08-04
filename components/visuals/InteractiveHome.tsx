'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_COMMANDS, SYSTEM_MOTIVES, HELP_TEXT } from '@/lib/terminal-commands'

export default function InteractiveHome(): React.ReactNode {
  const router = useRouter()
  const { renderMode, toggleRenderMode, isTerminalOpen, setIsTerminalOpen, setUiMode } = useUI()
  const [commandHistory, setCommandHistory] = useState<{ type: 'cmd' | 'res', text: string }[]>([])
  const [historyLog, setHistoryLog] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [historyDraft, setHistoryDraft] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [showScrollFade, setShowScrollFade] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  // Reset global terminal state on unmount to prevent blur artifacts
  useEffect(() => {
    return () => {
      if (isTerminalOpen) setIsTerminalOpen(false)
    }
  }, [isTerminalOpen, setIsTerminalOpen])

  // Sync state with global player
  useEffect(() => {
    const checkState = () => {
      setIsPlaying(localStorage.getItem('bgmState') === 'true')
    }
    window.addEventListener('storage', checkState)
    checkState()
    return () => window.removeEventListener('storage', checkState)
  }, [])

  const toggleBGM = (force?: boolean) => {
    const nextState = force !== undefined ? force : !isPlaying
    setIsPlaying(nextState)
    window.dispatchEvent(new CustomEvent('toggle-bgm', { detail: { force: nextState } }))
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    historyEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    if (isTerminalOpen && isAtBottom) {
      scrollToBottom()
    }
  }, [commandHistory, isTerminalOpen])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowScrollFade(scrollTop > 10)
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(atBottom)
  }

  useEffect(() => {
    if (isTerminalOpen) {
      inputRef.current?.focus()
      setTimeout(() => scrollToBottom('auto'), 100)
    }
  }, [isTerminalOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTerminalOpen(false)
        setHistoryIndex(null)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTerminalOpen(false)
        inputRef.current?.blur()
        setHistoryIndex(null)
      }
      if (e.key === '/' && !isTerminalOpen) {
        e.preventDefault()
        setIsTerminalOpen(true)
      }

      if (isTerminalOpen) {
        if (e.key === 'PageUp') {
          scrollContainerRef.current?.scrollBy({ top: -300, behavior: 'smooth' })
        } else if (e.key === 'PageDown') {
          scrollContainerRef.current?.scrollBy({ top: 300, behavior: 'smooth' })
        } else if (e.key === 'Home') {
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        } else if (e.key === 'End') {
          scrollToBottom()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTerminalOpen])

  const logCommand = (cmd: string, response?: string) => {
    setCommandHistory(prev => {
      const newHistory = [...prev, { type: 'cmd' as const, text: `sh-3.2$ ${cmd}` }];
      if (response) {
        newHistory.push({ type: 'res' as const, text: response });
      }
      return newHistory;
    })
    setHistoryLog(prev => {
      if (['help', 'clear', 'cls'].includes(cmd.toLowerCase().trim())) return prev;
      return [...prev, cmd];
    })
    setHistoryIndex(null)
    setHistoryDraft('')
  }

  const executeCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase()
    let response = ''

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5)
    }

    if (cleanCmd === 'help') {
      response = HELP_TEXT
    }
    else if (cleanCmd === 'system') {
      response = `System diagnostics ready.\nKernel: Vercel_Standard_v2\nModules: Notion_API, Framer_Motion, Tree_Engine_v2\nStatus: ACCELERATED`
    }
    else if (cleanCmd.includes('awaken') || cleanCmd.includes('override')) {
      toggleBGM(true)
      response = `[CRITICAL_UPDATE]\nSystem mode elevated.\nEnhancements active.`
    }
    else if (['mode bright', 'render bright', 'bright'].includes(cleanCmd)) {
      toggleRenderMode(null, 'bright')
      response = `[SYSTEM_UPDATE]\nRender Mode: BRIGHT (High Clarity)`
    }
    else if (['mode dark', 'render dark', 'dark'].includes(cleanCmd)) {
      toggleRenderMode(null, 'dark')
      response = `[SYSTEM_UPDATE]\nRender Mode: DARK (Deep Focus)`
    }
    else if (cleanCmd === 'clear' || cleanCmd === 'cls') {
      setCommandHistory([])
      return
    }
    else if (cleanCmd === 'home') {
      response = 'Minimizing terminal...'
      setTimeout(() => setIsTerminalOpen(false), 500)
    }
    else if (cleanCmd === 'explain') {
      response = SYSTEM_MOTIVES
    }
    else {
      const target = cleanCmd.replace(/^open\s+/, '').trim()
      const treeRoots = ['origin', 'focus', 'build', 'philosophy']
      if (treeRoots.some(root => target.startsWith(root))) {
        setUiMode('tree')
        window.dispatchEvent(new CustomEvent('tree-expand', { detail: { path: target } }))
        logCommand(cleanCmd, `Expanding data node: ${target}`)
        return
      }

      const path = NAV_COMMANDS[target]
      if (path) {
        logCommand(cleanCmd, path.startsWith('http') || path.startsWith('mailto') ? 'Opening external...' : `Redirecting to /${target}...`)
        if (path.startsWith('http') || path.startsWith('mailto')) {
          window.open(path, '_blank')
        } else {
          setUiMode('default')
          setIsTerminalOpen(false)
          setTimeout(() => router.push(path), 600)
        }
        return
      } else {
        response = 'Command not recognized.\nType "help" to see available commands.'
      }
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
      const newIndex = historyIndex === null ? null : historyIndex + 1
      if (newIndex === null || newIndex >= historyLog.length) {
        setHistoryIndex(null)
        setInputValue(historyDraft)
      } else {
        setHistoryIndex(newIndex)
        setInputValue(historyLog[newIndex])
      }
    }
  }

  const isBright = renderMode === 'bright'

  return (
    <div className="terminal-shell-fixed fixed inset-0 flex flex-col items-center justify-center p-4 font-mono z-50 pointer-events-none">
      <AnimatePresence>
        {isTerminalOpen && (
          <>
            {/* Background Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-auto"
              style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: isBright ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
              }}
              onClick={() => setIsTerminalOpen(false)}
            />

            {/* Terminal Window */}
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "relative flex flex-col overflow-hidden pointer-events-auto z-10",
                "h-[30rem] w-full max-w-[52rem] rounded-xl border shadow-[var(--shadow-premium)]",
                isBright ? "bg-[#EFECE7] border-black/15" : "bg-[#050505] border-white/10"
              )}
            >
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between px-4 py-2.5 border-b select-none",
                isBright ? "bg-[#F5F5F4] border-gray-200" : "bg-white/5 border-white/10"
              )}>
                <div className="flex gap-1.5">
                  <button onClick={() => setIsTerminalOpen(false)} className="w-2.5 h-2.5 rounded-full bg-red-500/80 hover:bg-red-600 transition-colors" aria-label="Close console" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <button onClick={() => setIsTerminalOpen(false)} className="w-2.5 h-2.5 rounded-full bg-green-500/80 hover:bg-green-600 transition-colors" aria-label="Minimize console" />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-widest uppercase opacity-40",
                  isBright ? "text-black" : "text-white"
                )}>
                  system_console_v2.0
                </span>
                <div className="w-10" />
              </div>

              {/* Output */}
              <div className="flex-1 overflow-hidden relative">
                <div className={cn(
                  "absolute inset-0 overflow-y-auto terminal-scroll p-6 space-y-3 text-xs md:text-sm",
                  isBright ? "text-black" : "text-cyan-50/90"
                )} ref={scrollContainerRef} onScroll={handleScroll}>
                  <div className={cn(
                    "text-[10px] pb-2 leading-relaxed uppercase tracking-widest border-l-2 pl-3 transition-colors duration-500 select-none",
                    isBright ? "text-gray-500 border-gray-300" : "text-cyan-500/50 border-cyan-500/30"
                  )}>
                    [CON_ESTABLISHED]<br />
                    SYSTEM_CONSOLE_ACTIVE<br />
                    TYPE &apos;HELP&apos; FOR SYSTEM DIRECTIVES.
                  </div>
                  {commandHistory.map((item, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed flex items-start gap-2"
                      style={{ color: item.type === 'cmd' ? (isBright ? '#1e40af' : '#22d3ee') : 'inherit' }}
                    >
                      {item.type === 'cmd' ? (
                        <span className={cn("font-bold select-none opacity-80 shrink-0", isBright ? "text-blue-800" : "text-cyan-500")}>
                          sh-3.2$
                        </span>
                      ) : null}
                      <div className={cn("flex-1", item.type === 'cmd' ? "" : "opacity-80")}>
                        {item.text.replace(/^sh-3\.2\$\s/, '').split('\n').map((line, li) => {
                          const isHeader = line.trim().endsWith(':');
                          const isTitle = line.trim().startsWith('[');

                          const cmdDescMatch = line.match(/^(\s{2,})([a-z0-9\s]+?)\s{3,}(.+)$/i);
                          const openMatch = line.match(/^(\s{2,})(open\s+[a-z]+)$/i);
                          const shortMatch = line.match(/^(\s{2,})([a-z]{3,})$/i);

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
                              <div key={li} className="flex items-center hover:bg-white/5 rounded px-1 -ml-1 transition-colors cursor-pointer"
                                onClick={() => {
                                  setInputValue(cmdPart.trim());
                                  inputRef.current?.focus();
                                }}
                              >
                                <span className="select-none opacity-0 whitespace-pre text-[8px]">{prefix}</span>
                                <span className="underline decoration-cyan-500/30 hover:decoration-cyan-400 underline-offset-4 min-w-[110px] inline-block font-semibold">
                                  {cmdPart}
                                </span>
                                {descPart && (
                                  <span className="select-none opacity-50 ml-6 italic text-[11px] whitespace-nowrap">
                                    {descPart}
                                  </span>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={li} className={cn(
                              line.trim() === '' ? "h-1" : "",
                              (line.startsWith(' ') || line.match(/^[0-9]\./)) && "select-none opacity-60 text-[11px]"
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
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-6 border-t h-14 shrink-0">
                <span className="text-cyan-500 font-bold">sh-3.2$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  className={cn(
                    "bg-transparent border-none outline-none flex-1 font-mono text-base",
                    isBright ? "text-black caret-black" : "text-white caret-cyan-400"
                  )}
                  autoComplete="off"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
