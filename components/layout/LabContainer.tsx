'use client'

import { ReactNode } from 'react'
import { useUI } from '@/components/providers/UIProvider'

interface LabContainerProps {
  children: ReactNode
  videoSrc?: string
}

/**
 * LabContainer: The main three-layer experimental interface
 * Layer 1: Background video
 * Layer 2: Dark overlay
 * Layer 3: Floating content panel + side navigation
 */
export function LabContainer({ children, videoSrc }: LabContainerProps) {
  const { uiMode, renderMode, isTerminalOpen } = useUI()

  // Video only active in Normal mode
  const showVideo = renderMode === 'normal'

  // Background base classes
  const getBgClass = () => {
    switch (renderMode) {
      case 'bright': return 'bg-[#ffffff]' // Clean engineering white
      case 'dark': return 'bg-[#000000]'   // Pitch black
      default: return 'bg-transparent'     // Allow global video transparency
    }
  }

  return (
    <div className={`layout relative min-h-screen w-full flex flex-col transition-colors duration-500 ease-in-out 
      ${uiMode === 'tree' ? 'tree-active' : ''}
      ${getBgClass()}
    `}>
      {/* [LAYER_2]: Substrate Overlay (Fixed Viewport Blur) 
          - Maintains focus on the Cognitive layer
      */}
      <div className={`fixed inset-0 z-[-1] transition-all duration-700 ease-in-out
          ${renderMode === 'bright' ? 'bg-transparent' : (uiMode === 'tree' ? 'bg-black/45 backdrop-blur-[2px]' : 'bg-black/20 backdrop-blur-[1px]')}
          ${isTerminalOpen && renderMode !== 'bright' ? 'bg-black/75 backdrop-blur-md' : ''}
      `} />

      {/* [LAYER_3]: Flow Plane (Deterministic Content Stack)
          - Normalized to allow document flow and zoom resilience
          - Bounded by --panel-max-width for desktop density consistency
      */}
      <div className={`relative flex flex-col flex-1 w-full max-w-[var(--panel-max-width)] mx-auto z-10 transition-opacity duration-500 ${isTerminalOpen ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}
