'use client'

import React from 'react'
import Link from 'next/link'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

export default function UniversePage() {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'

  const textColor = isBright ? "text-neutral-900" : "text-neutral-100"
  const mutedColor = isBright ? "text-neutral-500" : "text-neutral-400"
  const faintColor = isBright ? "text-neutral-400" : "text-neutral-600"
  const dividerColor = isBright ? "border-neutral-200" : "border-neutral-800"

  const activeDimensions = [
    {
      id: '01',
      label: 'ANIME UNIVERSE',
      progression: 'Stories → perspective → mindset',
      description: 'The stories that changed the way I think, question, endure and understand people.',
      route: '/universe/anime'
    },
    {
      id: '02',
      label: 'MUSIC NEBULA',
      progression: 'Sound → memory → emotion',
      description: 'The sounds that became attached to moments, places and versions of me.',
      route: '/universe/music'
    },
    {
      id: '03',
      label: 'FOX DEN',
      progression: 'Curiosity → conversation → exploration',
      description: "A space for Lumi, experiments, questions and things I haven't figured out yet.",
      route: '/universe/fox-den'
    }
  ]

  const futureDimensions = [
    'SECRET LAB',
    'LIBRARY',
    'MUSEUM',
    'MEMORY GALLERY'
  ]

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 max-w-3xl mx-auto flex flex-col font-sans selection:bg-cyan-500/30">
      
      {/* 1. INTRODUCTION */}
      <section className="mb-28">
        <p className={cn("text-xs font-medium tracking-[0.2em] mb-10 uppercase", faintColor)}>
          The Universe
        </p>
        <h1 className={cn("text-4xl md:text-5xl font-light tracking-tight leading-tight mb-8", textColor)}>
          Different dimensions.<br/>
          One journey.
        </h1>
        <p className={cn("text-lg md:text-xl leading-relaxed max-w-2xl font-light", mutedColor)}>
          TensorThrottle X is not one collection of interests.<br className="hidden md:block"/>
          It is a collection of perspectives — different places for the stories, sounds, experiments and questions that have shaped the journey.
        </p>
      </section>

      {/* 2. THE IDEA */}
      <section className="mb-32 max-w-2xl">
        <h2 className={cn("text-xl md:text-2xl font-light mb-6", textColor)}>
          Not everything belongs in one place.
        </h2>
        <p className={cn("text-base md:text-lg leading-relaxed font-light", mutedColor)}>
          The Universe separates different forms of exploration into their own dimensions, allowing each perspective to exist in the environment that suits it best.
        </p>
      </section>

      {/* 3. DIMENSION DIRECTIVE */}
      <section className="mb-32">
        <p className={cn("text-xs font-medium tracking-[0.2em] mb-12 uppercase", faintColor)}>
          The Dimensions
        </p>

        <div className="flex flex-col">
          {/* Top Divider */}
          <div className={cn("w-full border-t border-[0.5px]", dividerColor)} />
          
          {activeDimensions.map((dim, i) => (
            <Link 
              key={dim.id} 
              href={dim.route}
              className={cn(
                "group block py-12 transition-transform duration-500 hover:translate-x-1",
                i !== activeDimensions.length - 1 ? cn("border-b border-[0.5px]", dividerColor) : ""
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className={cn("text-2xl font-light transition-colors duration-500", mutedColor, "group-hover:" + textColor)}>
                      {dim.id}
                    </span>
                    <span className={cn("text-xs md:text-sm font-semibold tracking-widest uppercase mt-4 transition-colors duration-500", faintColor, "group-hover:" + textColor)}>
                      {dim.label}
                    </span>
                    <span className={cn("text-sm md:text-base font-light italic mt-1", mutedColor)}>
                      {dim.progression}
                    </span>
                  </div>
                  
                  <p className={cn("text-lg md:text-xl font-light leading-relaxed max-w-xl mt-4", textColor)}>
                    &ldquo;{dim.description}&rdquo;
                  </p>
                </div>

                {/* Arrow */}
                <div className="self-end md:self-auto md:mt-8">
                  <ArrowRight className={cn(
                    "w-6 h-6 transition-all duration-500 opacity-20 group-hover:opacity-100 group-hover:translate-x-1",
                    textColor
                  )} strokeWidth={1} />
                </div>

              </div>
            </Link>
          ))}
          {/* Bottom Divider */}
          <div className={cn("w-full border-t border-[0.5px]", dividerColor)} />
        </div>
      </section>

      {/* 4. FUTURE DIMENSIONS */}
      <section className="mb-48">
        <p className={cn("text-xs font-medium tracking-[0.2em] mb-10 uppercase", faintColor)}>
          Still Forming
        </p>
        <div className="flex flex-col gap-6 max-w-2xl">
          {futureDimensions.map((title) => (
            <div key={title} className="flex items-center gap-4">
              <div className={cn("w-1 h-1 rounded-full", isBright ? "bg-neutral-300" : "bg-neutral-700")} />
              <span className={cn("text-sm font-light tracking-wider uppercase", faintColor)}>
                {title}
              </span>
              <span className={cn("text-[9px] font-medium tracking-widest uppercase opacity-40", faintColor)}>
                (FORMING)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CLOSING STATEMENT */}
      <section className="pb-20 text-center flex flex-col items-center justify-center">
        <h2 className={cn("text-2xl md:text-3xl font-light mb-8 leading-tight", textColor)}>
          This isn&apos;t a collection of interests.<br/>
          It&apos;s a collection of perspectives.
        </h2>
        <p className={cn("text-sm md:text-base font-light leading-loose text-center", mutedColor)}>
          Some dimensions are open.<br/>
          Some are being built.<br/>
          Some haven&apos;t been discovered yet.
        </p>
      </section>

    </div>
  )
}
