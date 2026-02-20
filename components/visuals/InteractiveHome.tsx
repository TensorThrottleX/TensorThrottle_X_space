'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Terminal } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'

export function InteractiveHome(): React.ReactNode {
  const router = useRouter()
  const { renderMode, setRenderMode, isPrecision, setIsPrecision, setIsTerminalOpen } = useUI()
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
  }, [isExpanded, setIsTerminalOpen])

  const toggleBGM = (force?: boolean) => {
    const nextState = force !== undefined ? force : !isPlaying
    setIsPlaying(nextState)
    // Dispatch to global player
    window.dispatchEvent(new CustomEvent('toggle-bgm', { detail: { force: nextState } }))
  }

  // Handle Scroll to Bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    historyEndRef.current?.scrollIntoView({ behavior })
  }

  // Auto-scroll terminal logic
  useEffect(() => {
    if (isExpanded && isAtBottom) {
      scrollToBottom()
    }
  }, [commandHistory, isExpanded])

  // Scroll listener to track position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowScrollFade(scrollTop > 10)
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(atBottom)
  }

  // Focus input on expand
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
      setTimeout(() => scrollToBottom('auto'), 100)
    }
  }, [isExpanded])

  // Click Outside & Escape Logic
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
      const newHistory = [...prev, { type: 'cmd' as const, text: `> ${cmd}` }];
      if (response) {
        newHistory.push({ type: 'res' as const, text: response });
      }
      return newHistory;
    })
    setHistoryLog(prev => [...prev, cmd])
    setHistoryIndex(null)
    setHistoryDraft('')
  }

  const executeCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase()
    let response = ''

    if (cleanCmd === 'help') {
      response = `Available Commands:

Navigation:
  open about
  open feed
  open thoughts
  open projects
  open experiments
  open manifold

Social:
  twitter
  github
  email

Utility:
  home        Minimize terminal
  explain     View system motives
  system      Check system status
  focus       [ON/OFF] Toggle precision mode`
    }
    else if (cleanCmd === 'system') {
      response = `System diagnostics ready.
Kernel: Vercel_Standard_v2
Modules: Notion_API, Framer_Motion
Hidden states may be toggled.`
    }
    // Secret BGM Triggers
    else if (
      cleanCmd.includes('awaken') || cleanCmd.includes('override') || (cleanCmd.includes('system') && cleanCmd.includes('boost'))
    ) {
      toggleBGM(true)
      response = `[CRITICAL_UPDATE]
System mode elevated. 
Enhancements active.`
    }
    // Mode Switching Logic
    else if (['mode normal', 'render normal', 'normal'].includes(cleanCmd)) {
      setRenderMode('normal')
      response = `[SYSTEM_UPDATE]
Render Mode: NORMAL (Cinematic)
Visuals: Standard
Video: Active`
    }
    else if (['mode bright', 'render bright', 'bright'].includes(cleanCmd)) {
      setRenderMode('bright')
      response = `[SYSTEM_UPDATE]
Render Mode: BRIGHT (High Clarity)
Visuals: Inverted/Matte
Video: Suspended`
    }
    else if (['mode dark', 'render dark', 'dark'].includes(cleanCmd)) {
      setRenderMode('dark')
      response = `[SYSTEM_UPDATE]
Render Mode: DARK (Deep Focus)
Visuals: Matte Black
Video: Suspended`
    }
    else if (['mode precision', 'focus on', 'precision on'].includes(cleanCmd)) {
      if (isPrecision) {
        response = `[SYSTEM_NOTICE]
Precision Mode already active.`
      } else {
        setIsPrecision(true)
        response = `[SYSTEM_UPDATE]
Precision Mode: ACTIVE
Enhancements: Focus Optimized
Background: Deep Black`
      }
    }
    else if (['focus off', 'precision off', 'focus exit'].includes(cleanCmd)) {
      if (!isPrecision) {
        response = `[SYSTEM_NOTICE]
Precision Mode already inactive.`
      } else {
        setIsPrecision(false)
        response = `[SYSTEM_UPDATE]
Precision Mode: INACTIVE
Restoring Standard Visuals...`
      }
    }
    else if (['focus', 'precision'].includes(cleanCmd)) {
      const nextState = !isPrecision
      setIsPrecision(nextState)
      response = `[FORCE_TOGGLE]
Precision Mode: ${nextState ? 'ACTIVE' : 'INACTIVE'}`
    }
    else if (['mode', 'render'].includes(cleanCmd)) {
      // Circle toggle
      setRenderMode((prev: any) => {
        if (prev === 'normal') return 'bright'
        if (prev === 'bright') return 'dark'
        return 'normal'
      })
      response = `[RENDER_TOGGLE]
Cycling render mode...`
    }
    else if (cleanCmd === 'clear' || cleanCmd === 'cls') {
      setCommandHistory([])
      return
    }
    else if (cleanCmd === 'home') {
      response = 'Minimizing terminal...'
      setTimeout(() => setIsExpanded(false), 500)
    }
    else if (cleanCmd === 'explain' || cleanCmd === 'explanation') {
      response = `System Motives:

1. FEED
   To capture raw, transient ideas in real-time.

2. PROJECTS
   Tangible proof of engineering and execution.

3. THOUGHTS
   Structured analysis and long-form philosophy.

4. EXPERIMENTS
   Volatile prototypes and unstable code.

5. MANIFOLD
   The intersection of AI, systems, and design.

6. ABOUT
   Core identity and operator context.`
    }
    else {
      const target = cleanCmd.replace(/^open\s+/, '').trim()

      // Check if this is a tree expansion command (e.g., origin.journey)
      const treeRoots = ['origin', 'focus', 'build', 'philosophy']
      if (treeRoots.some(root => target.startsWith(root))) {
        window.dispatchEvent(new CustomEvent('tree-expand', { detail: { path: target } }))
        logCommand(cleanCmd, `Expanding tree path: ${target}`)
        if (!isExpanded) setIsExpanded(true)
        return
      }

      const handled = handleNavigation(target, cleanCmd)
      if (!handled) {
        response = 'Command not recognized.\nType "help" to see available commands.'
      } else {
        logCommand(cleanCmd)
        return
      }
    }

    logCommand(cleanCmd, response)
  }

  const handleNavigation = (target: string, originalCmd: string): boolean => {
    const map: Record<string, string> = {
      'about': '/about',
      'work': '/category/projects',
      'interests': '/category/thoughts',
      'connect': 'mailto:tensorthrottleX@proton.me',
      'feed': '/feed',
      'thoughts': '/category/thoughts',
      'projects': '/category/projects',
      'experiments': '/category/experiments',
      'manifold': '/category/manifold',
      'twitter': 'https://x.com/TensorThrottleX',
      'x': 'https://x.com/TensorThrottleX',
      'github': 'https://github.com/TensorThrottleX',
      'gh': 'https://github.com/TensorThrottleX',
      'email': 'mailto:tensorthrottleX@proton.me'
    }

    const path = map[target]
    if (path) {
      logCommand(originalCmd, path.startsWith('http') || path.startsWith('mailto') ? 'Opening...' : `Redirecting to /${target}...`)
      if (path.startsWith('http') || path.startsWith('mailto')) {
        window.open(path, '_blank')
      } else {
        setTimeout(() => router.push(path), 600)
      }
      return true
    }
    return false
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
      if (newIndex >= historyLog.length) {
        setHistoryIndex(null)
        setInputValue(historyDraft)
      } else {
        setHistoryIndex(newIndex)
        setInputValue(historyLog[newIndex])
      }
    }
  }

  // Visual Classes based on RenderMode - Now simplified to use CSS Variables
  const isBright = renderMode === 'bright'
  // We rely on CSS variables for colors now, so fewer conditional classes needed (but keeping structure)

  const containerClasses = `relative flex flex-col transition-[height,width,transform,opacity] duration-500 overflow-hidden pointer-events-auto
    ${isExpanded
      ? 'h-[28rem] w-full max-w-[min(50rem,90vw)] rounded-md scale-100 translate-y-0 opacity-100 shadow-cyan-500/10'
      : `h-16 w-[min(22rem,90vw)] md:w-[min(28rem,90vw)] rounded-md cursor-text scale-[0.96] translate-y-2 opacity-100 shadow-[0_10px_40px_rgba(0,0,0,0.06)] 
         hover:shadow-[0_15px_50px_rgba(0,0,0,0.12)] hover:scale-[0.97] 
         ${isBright ? 'hover:ring-[1.5px] hover:ring-black' : 'hover:ring-1 hover:ring-cyan-500/50'}`
    } 
    ${isPlaying && !isBright
      ? 'ring-1 ring-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
      : (isPlaying && isBright ? 'ring-1 ring-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.15)]' : '')
    }`

  return (
    <div className="command-shell terminal fixed inset-0 flex flex-col items-center justify-end pb-12 px-4 font-mono z-50 pointer-events-none">
      {/* Full-Screen Blur Backdrop */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 beauty-blur ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{
          backdropFilter: 'blur(4px)',
          backgroundColor: isBright ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'
        }}
        onClick={() => setIsExpanded(false)}
      />

      <div
        ref={containerRef}
        className={containerClasses}
        style={{
          // Background handling moved to inner layer to prevent content blur bleed
          color: 'var(--foreground)',
          boxShadow: isBright ? '0 10px 40px rgba(0, 0, 0, 0.06)' : undefined,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1), height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s ease',
          zIndex: 51 // Ensure above backdrop
        }}
        onClick={() => {
          if (!isExpanded) setIsExpanded(true)
          inputRef.current?.focus()
        }}
      >
        {/* Background Layer - Isolated for Blur */}
        <div
          className="absolute inset-0 pointer-events-none z-0 border transition-[background-color,border-color] duration-500"
          style={{
            backgroundColor: 'var(--terminal-bg)',
            borderColor: isBright ? 'rgba(0, 0, 0, 0.08)' : 'var(--glass-border)'
          }}
        />

        {/* Content Layer - Z-Index 10 ensures clarity */}
        <div className="relative z-10 flex flex-col w-full h-full">

          <style jsx global>{`
          .terminal-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .terminal-scroll::-webkit-scrollbar-track {
            background: var(--sidebar-bg);
            border-radius: 4px;
          }
          .terminal-scroll::-webkit-scrollbar-thumb {
            background: var(--text-secondary); /* or muted-foreground */
            border-radius: 4px;
            background-clip: content-box;
            border: 2px solid transparent;
            opacity: 0.5;
          }
          .terminal-scroll::-webkit-scrollbar-thumb:hover {
            background-color: var(--text-primary);
          }
          .bgm-trigger {
            position: absolute;
            bottom: 12px;
            right: 16px;
            padding: 8px 12px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--muted-foreground);
            font-size: 9px;
            letter-spacing: 1.5px;
            border-radius: 12px;
            cursor: pointer;
            backdrop-filter: blur(4px);
            transition: transform 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            z-index: 60;
            text-transform: uppercase;
            pointer-events: auto;
          }
          .bgm-trigger:hover {
            transform: translateY(-1px);
            color: var(--foreground);
            border-color: var(--foreground);
          }
          .bgm-trigger.active {
            background: rgba(6, 182, 212, 0.1); 
            border-color: rgba(6, 182, 212, 0.5);
            color: #06b6d4;
          }
          /* Override for bright mode active trigger */
          body.mode-bright .bgm-trigger.active {
             background: rgba(0, 0, 0, 0.05);
             border-color: #000;
             color: #000;
          }
          /* Override for precision mode active trigger */
          body.mode-precision .bgm-trigger.active {
             background: rgba(34, 211, 238, 0.1);
             border-color: rgba(34, 211, 238, 0.5);
             color: #22d3ee;
          }
        `}</style>

          {/* Window Header */}
          <div className="p-2.5 flex items-center justify-between select-none shrink-0 border-b transition-colors duration-500"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: isBright ? 'rgba(0, 0, 0, 0.12)' : 'var(--sidebar-border)'
            }}
          >
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-50" style={{ color: 'var(--muted-foreground)' }}>
              {isExpanded ? 'SYSTEM_CONSOLE_v1.0.4' : 'SECURE_SHELL'}
            </div>
            <div className="w-10" />
          </div>

          {/* Scroll Output Area */}
          <div className={`flex-1 relative overflow-hidden transition-opacity duration-500 ${isExpanded ? 'opacity-100 px-6 pt-4' : 'opacity-0 h-0 hidden'}`}>
            <div className={`absolute top-0 left-0 right-0 h-10 bg-gradient-to-b z-20 pointer-events-none transition-opacity duration-300 ${showScrollFade ? 'opacity-100' : 'opacity-0'}
            ${isBright ? 'from-white to-transparent' : 'from-black to-transparent'}
          `} />

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto terminal-scroll space-y-2 font-mono text-xs md:text-sm"
            >
              <div className="text-[10px] mb-6 leading-relaxed uppercase tracking-wider border-l pl-3 transition-colors duration-1000"
                style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
              >
                [CON_ESTABLISHED] <br />
                SECURE_SHELL_ACTIVE <br />
                TYPE 'HELP' FOR SYSTEM DIRECTIVES.
              </div>

              {commandHistory.map((item, i) => (
                <div key={i} className="whitespace-pre-wrap leading-relaxed flex items-start gap-2"
                  style={{ color: item.type === 'cmd' ? (isBright ? '#1d4ed8' : '#22d3ee') : 'var(--foreground)' }}
                >
                  {item.type === 'cmd' ? <span className={`font-bold ${!isBright ? 'opacity-80 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'opacity-100'}`}>sh-3.2$</span> : null}
                  {item.text.replace(/^> /, '')}
                </div>
              ))}
              <div ref={historyEndRef} className="h-4" />
            </div>
          </div>

          {/* Input Area */}
          <div className={`flex items-center gap-3 px-6 transition-[height,border-top-width] duration-300 
            ${isExpanded ? 'h-14 border-t' : 'h-full justify-center'}
        `}
            style={{
              backgroundColor: isExpanded ? 'var(--sidebar-bg)' : 'transparent',
              borderColor: isBright ? 'rgba(0, 0, 0, 0.12)' : 'var(--sidebar-border)'
            }}
          >
            {isExpanded && <span className={`font-bold transition-opacity duration-500 ${isBright ? 'text-blue-600 opacity-100' : 'text-cyan-500 opacity-80 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'} ${isPlaying ? '!opacity-100' : ''}`}>sh-3.2$</span>}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyDown}
              className={`bg-transparent border-none outline-none placeholder-gray-500 font-mono 
                ${isBright ? 'caret-blue-600' : 'caret-cyan-400'}
                ${isExpanded ? 'flex-1 text-base' : 'w-full text-sm text-center'}
            `}
              style={{ color: 'var(--foreground)' }}
              placeholder={isExpanded ? "" : "[ READY ]"}
              autoComplete="off"
            />
          </div>

          {/* Surprise Trigger (Moved back INSIDE) */}
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent container click event
                toggleBGM()
              }}
              className={`bgm-trigger ${isPlaying ? 'active' : ''} animate-in fade-in duration-500`}
            >
              {isPlaying ? "System Active ✦" : "Hit to see changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
