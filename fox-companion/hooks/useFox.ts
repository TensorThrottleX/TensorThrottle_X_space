'use client'

import { useContext } from 'react'
import { FoxContext } from '../FoxContext'
import type { FoxContextType } from '../types'

export function useFox(): FoxContextType {
  const ctx = useContext(FoxContext)
  if (!ctx) {
    throw new Error('useFox must be used within a FoxProvider')
  }
  return ctx
}
