'use client'

import { ReactNode } from 'react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

interface LabContainerProps {
  children: ReactNode
  videoSrc?: string
}

export function LabContainer({ children, videoSrc }: LabContainerProps) {
  const { uiMode, isTerminalOpen } = useUI()

  return (
    <div className={`layout relative min-h-screen w-full flex flex-col transition-colors duration-500 ease-in-out
      ${uiMode === 'tree' ? 'tree-active' : ''}
    `}>
      {/* Video background removed — using theme-aware bg from body */}

      {/* [LAYER_2]: Substrate Overlay — theme-aware via CSS variables */}
      <div className={cn(
        "fixed inset-0 z-[-1] transition-all duration-700 ease-in-out",
        isTerminalOpen
          ? "backdrop-blur-md"
          : "bg-transparent backdrop-blur-none",
        isTerminalOpen ? "bg-[var(--terminal-overlay-bg)]" : "bg-transparent"
      )} />

      {/* [DIM_OVERLAY]: Dim content when terminal is open */}
      <div className={cn(
        "fixed inset-0 z-[20] transition-all duration-500 ease-in-out pointer-events-none",
        isTerminalOpen
          ? "opacity-100 backdrop-blur-sm bg-[var(--overlay-bg)]"
          : "opacity-0 backdrop-blur-0 bg-transparent"
      )} />

      {/* [LAYER_3]: Flow Plane */}
      <div className="relative flex flex-col flex-1 w-full max-w-[var(--panel-max-width)] mx-auto transition-opacity duration-500">
        {children}
      </div>
    </div>
  )
}
