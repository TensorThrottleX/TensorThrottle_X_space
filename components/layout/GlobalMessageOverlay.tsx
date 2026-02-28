'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUI } from '@/components/providers/UIProvider'
import { MsgView } from '@/components/forms/MsgView'
import { X as XClose } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GlobalMessageOverlay() {
    const { mainView, setMainView, renderMode } = useUI()
    const isBright = renderMode === 'bright'

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mainView === 'msg') {
                setMainView('dashboard')
            }
        }
        if (mainView === 'msg') {
            window.addEventListener('keydown', handleEscape)
            // Prevent body scroll
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            window.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [mainView, setMainView])

    return (
        <AnimatePresence>
            {mainView === 'msg' && (
                <motion.div
                    initial={{ opacity: 0, y: '10%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '10%' }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className={cn(
                        "fixed inset-0 z-[300] overflow-y-auto pb-20 no-scrollbar touch-pan-y",
                        isBright ? "bg-[#f5f5f5]" : "bg-black"
                    )}
                    style={{ height: '100dvh' }}
                >
                    {/* Overlay Header */}
                    <div className="sticky top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b z-[310] backdrop-blur-xl shrink-0"
                        style={{
                            backgroundColor: isBright ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.98)',
                            borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
                        }}>
                        <span className="text-sm font-black uppercase tracking-tight" style={{ color: isBright ? '#000' : '#fff' }}>Secure Channel</span>
                        <button
                            onClick={() => setMainView('dashboard')}
                            className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isBright ? "bg-black/5 active:bg-black/10 text-black hover:bg-black/10" : "bg-white/10 active:bg-white/20 text-white hover:bg-white/20")}
                        >
                            <XClose size={18} />
                        </button>
                    </div>

                    <div className="w-full">
                        <MsgView />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
