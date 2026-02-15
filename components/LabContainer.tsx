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
      case 'bright': return 'bg-[#fafafa]' // Clean engineering white
      case 'dark': return 'bg-[#050505]'   // Deep matte black
      default: return 'bg-black'           // Video background base
    }
  }

  return (
    <div className={`layout relative h-screen w-screen overflow-hidden transition-colors duration-500 ease-in-out 
      ${uiMode === 'tree' ? 'tree-active' : ''}
      ${getBgClass()}
    `}>
      {/* [SCREENSHOT]: Background Video Layer
          - Only rendered in NORMAL mode to save resources
      */}
      {videoSrc && showVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out 
            ${uiMode === 'tree' ? 'opacity-30' : 'opacity-100'} 
          `}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Fallback & Mode Overlays */}
      {!videoSrc && renderMode === 'normal' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
      )}

      {/* [SCREENSHOT]: Background Overlay
          - Provides the darkening effect (backdrop-blur) that ensures the white text is readable against the background.
          - Disabled in Bright mode for clarity.
      */}
      <div className={`absolute inset-0 transition-all duration-700 ease-in-out
          ${renderMode === 'bright' ? 'bg-transparent' : (uiMode === 'tree' ? 'bg-black/55 backdrop-blur-[3px]' : 'bg-black/40 backdrop-blur-sm')}
          ${isTerminalOpen && renderMode !== 'bright' ? 'bg-black/80 backdrop-blur-md' : ''}
      `} />

      {/* Layer 3: Floating content and navigation */}
      <div className={`relative flex h-full w-full transition-opacity duration-500 ${isTerminalOpen ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}
