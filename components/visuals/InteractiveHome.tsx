'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { NAV_COMMANDS, SYSTEM_MOTIVES, HELP_TEXT } from '@/lib/terminal-commands'

export function InteractiveHome(): React.ReactNode {
  const router = useRouter()
  const { renderMode, setRenderMode, setIsTerminalOpen, setUiMode } = useUI()
  const [commandHistory, setCommandHistory] = useState<{ type: 'cmd' | 'res', text: string }[]>([])
  const [historyLog, setHistoryLog] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [historyDraft, setHistoryDraft] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showScrollFade, setShowScrollFade] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  // Sync state with global player
  useEffect(() => {
    const checkState = () => {
      setIsPlaying(localStorage.getItem('bgmState') === 'true')
    }
    window.addEventListener('storage', checkState)
    checkState()
    return () => window.removeEventListener('storage', checkState)
  }, [])

  // Sync Global Terminal State
  useEffect(() => {
    setIsTerminalOpen(isExpanded)
    return () => {
      setIsTerminalOpen(false)
    }
  }, [isExpanded, setIsTerminalOpen])

  const toggleBGM = (force?: boolean) => {
    const nextState = force !== undefined ? force : !isPlaying
    setIsPlaying(nextState)
    window.dispatchEvent(new CustomEvent('toggle-bgm', { detail: { force: nextState } }))
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    historyEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    if (isExpanded && isAtBottom) {
      scrollToBottom()
    }
  }, [commandHistory, isExpanded])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowScrollFade(scrollTop > 10)
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(atBottom)
  }

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
      setTimeout(() => scrollToBottom('auto'), 100)
    }
  }, [isExpanded])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
        setHistoryIndex(null)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false)
        inputRef.current?.blur()
        setHistoryIndex(null)
      }
      if (e.key === '/' && !isExpanded) {
        e.preventDefault()
        setIsExpanded(true)
      }

      if (isExpanded) {
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
  }, [isExpanded])

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

    // Haptic Feedback for execution
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
    else if (['mode normal', 'render normal', 'normal'].includes(cleanCmd)) {
      setRenderMode('normal')
      response = `[SYSTEM_UPDATE]\nRender Mode: NORMAL (Cinematic)`
    }
    else if (['mode bright', 'render bright', 'bright'].includes(cleanCmd)) {
      setRenderMode('bright')
      response = `[SYSTEM_UPDATE]\nRender Mode: BRIGHT (High Clarity)`
    }
    else if (['mode dark', 'render dark', 'dark'].includes(cleanCmd)) {
      setRenderMode('dark')
      response = `[SYSTEM_UPDATE]\nRender Mode: DARK (Deep Focus)`
    }
    else if (cleanCmd === 'clear' || cleanCmd === 'cls') {
      setCommandHistory([])
      return
    }
    else if (cleanCmd === 'home') {
      response = 'Minimizing terminal...'
      setTimeout(() => setIsExpanded(false), 500)
    }
    else if (cleanCmd === 'explain') {
      response = SYSTEM_MOTIVES
    }
    else {
      const target = cleanCmd.replace(/^open\s+/, '').trim()

      // Tree expansion deep-linking
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
          setIsExpanded(false)
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
    <div className="terminal-shell-fixed fixed inset-0 flex flex-col items-center justify-end pb-12 px-4 font-mono z-50 pointer-events-none">
      {/* Background Blur */}
      <div
        className={cn(
          "absolute inset-0 z-0 transition-opacity duration-500",
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{
          backdropFilter: 'blur(8px)',
          backgroundColor: isBright ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
        }}
        onClick={() => setIsExpanded(false)}
      />

      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col transition-all duration-500 overflow-hidden pointer-events-auto",
          isExpanded
            ? "h-[28rem] w-full max-w-[50rem] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.3)]"
            : "h-14 w-[18rem] md:w-[24rem] rounded-lg cursor-text hover:scale-[1.02]",
          isBright ? "bg-white border-black/20" : "bg-[#050505] border-white/10",
          "border shadow-2xl"
        )}
        onClick={() => { if (!isExpanded) setIsExpanded(true) }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-2 border-b select-none",
          isBright ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/10"
        )}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className={cn(
            "text-[10px] font-bold tracking-widest uppercase opacity-40",
            isBright ? "text-black" : "text-white"
          )}>
            {isExpanded ? "system_console_v2.0" : "secure_shell"}
          </span>
          <div className="w-10" />
        </div>

        {/* Output */}
        <div className={cn(
          "flex-1 overflow-hidden relative",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          <div className={cn(
            "absolute inset-0 overflow-y-auto terminal-scroll p-6 space-y-3 text-xs md:text-sm",
            isBright ? "text-black" : "text-cyan-50/90"
          )} ref={scrollContainerRef} onScroll={handleScroll}>
            {commandHistory.map((item, i) => (
              <div key={i} className={cn(
                "whitespace-pre-wrap leading-relaxed",
                item.type === 'cmd' ? "font-bold text-cyan-500" : "opacity-80"
              )}>
                {item.text}
              </div>
            ))}
            <div ref={historyEndRef} className="h-4" />
          </div>
        </div>

        {/* Input */}
        <div className={cn(
          "flex items-center gap-2 px-6 border-t transition-all duration-300",
          isExpanded ? "h-14" : "h-full justify-center border-t-0"
        )}>
          {isExpanded && <span className="text-cyan-500 font-bold">sh-3.2$</span>}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isExpanded ? "" : "[ READY ]"}
            className={cn(
              "bg-transparent border-none outline-none flex-1 font-mono",
              isExpanded ? "text-base" : "text-center text-sm",
              isBright ? "text-black caret-black" : "text-white caret-cyan-400"
            )}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Hint overlay */}
      {!isExpanded && (
        <div className="absolute top-[-30px] opacity-40 text-[10px] tracking-widest uppercase animate-pulse">
          Press [/] to search or command
        </div>
      )}
    </div>
  )
}
