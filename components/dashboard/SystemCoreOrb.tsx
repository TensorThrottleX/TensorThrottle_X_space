'use client'

import { useCallback, useEffect } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'

export function SystemCoreOrb() {
  const { renderMode } = useUI()
  const reduced = useReducedMotion()
  const controls = useAnimationControls()
  const isBright = renderMode === 'bright'

  useEffect(() => {
    if (reduced) return
    controls.start({
      y: [0, -2, 0],
      rotate: [-0.3, 0.3, -0.3],
      transition: {
        y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      },
    })
  }, [reduced, controls])

  const handleTap = useCallback(() => {
    if (reduced) return

    controls.start({
      y: [0, -5, 0, -2, 0],
      transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
    }).then(() => {
      controls.start({
        y: [0, -2, 0],
        rotate: [-0.3, 0.3, -0.3],
        transition: {
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        },
      })
    })
  }, [reduced, controls])

  const themeTransition = 'all 0.35s ease'

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-[300] pointer-events-auto select-none outline-none cursor-pointer"
      style={{ width: 48, height: 48 }}
      role="presentation"
      aria-label="System Core"
      animate={controls}
      whileHover={reduced ? {} : {
        y: -2,
        transition: { type: 'spring', stiffness: 300, damping: 20, mass: 0.5 },
      }}
      whileTap={reduced ? { scale: 0.97 } : {
        scaleY: 0.86,
        scaleX: 1.09,
        transition: { duration: 0.06, ease: 'easeIn' },
      }}
      onTap={handleTap}
    >
      {/* Outer ambient shadow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          transition: themeTransition,
          boxShadow: isBright
            ? '0 4px 20px rgba(0,0,0,0.15), 0 0 30px rgba(0,0,0,0.03)'
            : '0 4px 24px rgba(0,0,0,0.55), 0 0 40px rgba(34,211,238,0.06)',
        }}
      />

      {/* Glass base */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          transition: themeTransition,
          background: isBright
            ? 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.4) 0%, rgba(220,220,220,0.3) 50%, rgba(200,200,200,0.15) 100%)'
            : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.8) 100%)',
          boxShadow: isBright
            ? 'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.08)'
            : 'inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -3px 8px rgba(0,0,0,0.5)',
          border: isBright
            ? '1px solid rgba(255,255,255,0.5)'
            : '1px solid rgba(255,255,255,0.07)',
        }}
      />

      {/* Specular highlight */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          transition: themeTransition,
          background: isBright
            ? 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 35%, transparent 60%)'
            : 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.04) 35%, transparent 60%)',
        }}
      />

      {/* Bottom rim reflection */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          transition: themeTransition,
          background: isBright
            ? 'linear-gradient(to top, rgba(0,0,0,0.03) 0%, transparent 45%)'
            : 'linear-gradient(to top, rgba(34,211,238,0.06) 0%, transparent 45%)',
        }}
      />

      {/* Center label: TX */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="text-[13px] font-black tracking-tight"
          style={{
            transition: themeTransition,
            color: isBright ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.88)',
            textShadow: isBright
              ? '0 1px 1px rgba(255,255,255,0.5)'
              : '0 1px 2px rgba(0,0,0,0.5)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          TX
        </span>
      </div>
    </motion.div>
  )
}
