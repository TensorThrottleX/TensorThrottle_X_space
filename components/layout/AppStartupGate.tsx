'use client'

import React, { useState } from 'react'
import { useUI } from '@/components/providers/UIProvider'
import { BootLoader } from '@/components/visuals/BootLoader'
import { AnimatePresence, motion } from 'framer-motion'

export function AppStartupGate({ children }: { children: React.ReactNode }) {
  const { isBooting } = useUI()

  // We only render children once isBooting is explicitly false, ensuring no overlap
  return (
    <AnimatePresence mode="wait">
      {isBooting ? (
        <BootLoader key="bootloader" />
      ) : (
        <motion.div
          key="main-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="contents"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
