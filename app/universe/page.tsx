'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { universeItems } from '@/src/data/universe'
import { Sparkles, ChevronRight, PlayCircle, Music, Ghost, FlaskConical, Library, LibraryBig, Box } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ReactNode> = {
  anime: <PlayCircle size={24} />,
  music: <Music size={24} />,
  'fox-den': <Ghost size={24} />,
  'secret-lab': <FlaskConical size={24} />,
  library: <Library size={24} />,
  museum: <LibraryBig size={24} />,
  memory: <Box size={24} />,
}

export default function UniversePage() {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'

  const activeItems = universeItems.filter(item => item.enabled)
  const disabledItems = universeItems.filter(item => !item.enabled)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 max-w-2xl mx-auto flex flex-col gap-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "p-3 rounded-2xl",
            isBright ? "bg-black/5 text-black" : "bg-white/10 text-cyan-400"
          )}>
            <Sparkles size={28} />
          </div>
          <h1 className={cn(
            "text-4xl font-bold tracking-tight",
            isBright ? "text-black" : "text-white"
          )}>
            The Universe
          </h1>
        </div>
        <p className={cn(
          "text-lg",
          isBright ? "text-black/60" : "text-white/60"
        )}>
          Explore the different dimensions of TensorThrottleX. Each universe represents a distinct facet of my journey, interests, and experiments.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4"
      >
        <h2 className={cn(
          "text-sm font-semibold tracking-widest uppercase mb-2",
          isBright ? "text-black/40" : "text-white/40"
        )}>
          Active Dimensions
        </h2>
        
        {activeItems.map((item) => (
          <motion.div key={item.id} variants={itemAnim}>
            <Link href={item.route} className="block group">
              <div className={cn(
                "p-5 rounded-3xl border transition-all duration-300 flex items-center justify-between",
                isBright 
                  ? "bg-white/50 border-black/5 hover:bg-black/5 hover:border-black/10 hover:shadow-lg" 
                  : "bg-black/40 border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-xl"
              )}>
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    isBright ? "bg-black/5 text-black/70 group-hover:text-black group-hover:bg-black/10" : "bg-white/5 text-white/70 group-hover:text-cyan-400 group-hover:bg-cyan-400/10"
                  )}>
                    {iconMap[item.id] || <Sparkles size={24} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className={cn(
                      "text-xl font-bold transition-colors duration-300",
                      isBright ? "text-black/80 group-hover:text-black" : "text-white/80 group-hover:text-white"
                    )}>
                      {item.title}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isBright ? "text-black/50" : "text-white/50"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1",
                  isBright ? "text-black/30 group-hover:text-black group-hover:bg-black/5" : "text-white/30 group-hover:text-cyan-400 group-hover:bg-cyan-400/10"
                )}>
                  <ChevronRight size={20} strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {disabledItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col gap-4 mt-8"
        >
          <h2 className={cn(
            "text-sm font-semibold tracking-widest uppercase mb-2",
            isBright ? "text-black/30" : "text-white/30"
          )}>
            Locked Dimensions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {disabledItems.map((item) => (
              <div key={item.id} className={cn(
                "p-4 rounded-2xl border flex items-center gap-4 opacity-50 grayscale",
                isBright ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isBright ? "bg-black/10 text-black/50" : "bg-white/10 text-white/50"
                )}>
                  {iconMap[item.id] || <Sparkles size={20} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className={cn(
                    "text-sm font-bold truncate",
                    isBright ? "text-black" : "text-white"
                  )}>
                    {item.title}
                  </h3>
                  <p className={cn(
                    "text-xs truncate",
                    isBright ? "text-black/60" : "text-white/60"
                  )}>
                    Coming soon...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
