'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { AdaptiveMediaRenderer } from '@/components/media/AdaptiveMediaRenderer'
import { useUI } from '@/components/providers/UIProvider'

export default function RoadmapPage() {
  const { renderMode, toggleRenderMode: globalToggleMode } = useUI()
  const [isBright, setIsBright] = useState(renderMode === 'bright')
  const toggleRenderMode = (e?: any) => {
    setIsBright(!isBright)
    globalToggleMode(e)
  }

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${
        isBright ? 'bg-[#F5F5F4] text-black' : 'bg-[#050505] text-white'
      }`}
    >
      {/* Top Header Layout */}
      <div
        className="sticky top-0 left-0 w-full p-6 md:px-12 md:pt-10 z-40 flex flex-col border-b backdrop-blur-md"
        style={{
          borderColor: isBright ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
          backgroundColor: isBright ? 'rgba(255,255,255,0.85)' : 'rgba(5,5,5,0.85)',
        }}
      >
        <div className="w-full flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                isBright ? 'bg-black border-black text-white' : 'bg-black border-white/20 text-orange-500'
              }`}
              title="TensorThrottle X"
            >
              <span className="font-black text-sm md:text-base tracking-tighter">TX</span>
            </div>
            <span className={`text-[10px] md:text-sm font-bold tracking-[0.15em] uppercase opacity-70 ${isBright ? 'text-black' : 'text-white'}`}>
              Conceptual overview and SOP
            </span>
          </div>
          <button
            onClick={(e) => toggleRenderMode(e)}
            className={`p-3 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg ${
              isBright
                ? 'bg-[#F5F5F4] border-black/10 shadow-black/5 text-black'
                : 'bg-black/40 border-white/20 shadow-black/50 backdrop-blur-md text-white'
            }`}
            aria-label="Toggle Theme"
          >
            {isBright ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
        <h1
          className={`w-full text-center text-4xl md:text-5xl lg:text-7xl uppercase transition-colors duration-700 ${
            isBright ? 'text-black' : 'text-white'
          }`}
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            WebkitTextStroke: isBright ? 'none' : '1.5px rgba(255,255,255,0.95)',
          }}
        >
          TENSOR THROTTLEX SPACE
        </h1>
      </div>

      {/* Journey Layout */}
      <div className="mx-auto w-full flex flex-col items-center overflow-x-hidden pt-12">
        {/* Section 1 - Hero */}
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 relative w-full mb-12">
          <div className={`w-full max-w-[1200px] mx-auto flex items-center justify-start gap-4 mb-8 md:mb-16 opacity-80 px-6 ${isBright ? 'text-black' : 'text-white'}`}>
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
            <span className="uppercase text-xl md:text-2xl font-bold tracking-widest" style={{ fontFamily: '"Alegreya Sans SC", sans-serif', letterSpacing: '0.2em' }}>
              ABOUT
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="w-full max-w-6xl flex flex-col items-center z-10"
          >
            <h1 className={`text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 ${isBright ? 'text-black' : 'text-white'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 500 }}>
              A Calm Space for Deep Technical Exploration
            </h1>
            <p className={`text-xl md:text-2xl font-light leading-relaxed max-w-2xl ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
              Step into a thoughtfully designed environment where ideas, projects, and experiments live in quiet focus — free from noise and distraction.
            </p>
          </motion.div>
        </div>

        {/* SECTION: ABOUT - Editorial Layout */}
        <div className="relative w-full max-w-[1200px] mx-auto xl:my-10 px-6 z-10">
          {/* ABOUT 01 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="relative w-full flex justify-center mt-12 md:mt-24 mb-32 md:mb-56"
          >
            <div className={`w-full md:w-10/12 aspect-[4/3] md:aspect-[21/9] rounded-sm overflow-hidden relative shadow-2xl border ${isBright ? 'border-black/5' : 'border-white/5'}`}>
              <AdaptiveMediaRenderer basePath="/media/roadmap/2" className="absolute inset-0 w-full h-full object-cover opacity-90" alt="System Architecture" />
            </div>
            <div className={`relative md:absolute md:bottom-[-15%] md:right-[10%] w-[95%] md:w-[400px] -mt-10 md:mt-0 p-6 md:p-10 backdrop-blur-xl z-30 shadow-2xl ${isBright ? 'bg-[#F5F5F4]/95 border-r-4 border-r-red-600 border border-black/10' : 'bg-[#111]/95 border-r-4 border-r-red-600 border border-white/10'}`}>
              <div className="text-xs uppercase tracking-widest mb-4 opacity-60 flex justify-between font-bold border-b border-current pb-2">
                <span>Reasoning</span>
                <span>01</span>
              </div>
              <div className={`space-y-3 text-base md:text-lg leading-relaxed ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                <p>Every idea starts unshaped.<br />This space helps to slow down and mould it clearly.</p>
                <p className="font-bold">Ground first. Build next.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className={`w-full py-8 px-4 flex items-center justify-center text-center text-xs md:text-sm tracking-[0.15em] font-semibold mt-24 ${isBright ? 'bg-[#F5F5F4] text-[#555] border-t border-black/10' : 'bg-[#050505] text-[#8b8b8b] border-t border-white/5'}`}>
          © 2026 TENSORTHROTTLE X. ALL RIGHTS RESERVED.
        </div>
      </div>
    </div>
  )
}
