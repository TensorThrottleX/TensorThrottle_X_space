'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Terminal, Sun, Moon, Map, Volume2, VolumeX } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'

const AdaptiveImage = ({ basePath, alt, className }: { basePath: string; alt?: string; className?: string }) => {
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    const [extIndex, setExtIndex] = useState(0);

    return (
        <img
            src={`${basePath}.${extensions[extIndex]}`}
            alt={alt || "Roadmap graphic"}
            className={className}
            decoding="async"
            loading="lazy"
            onError={(e) => {
                if (extIndex < extensions.length - 1) {
                    setExtIndex(extIndex + 1);
                }
            }}
        />
    );
};

export function BootLoader() {
    const { setIsBooting, renderMode, toggleRenderMode } = useUI()
    const isBright = renderMode === 'bright'
    const [stage, setStage] = useState<'booting' | 'intro' | 'done'>('booting')
    const [progress, setProgress] = useState(0)
    const [isMuted, setIsMuted] = useState(true)

    // Boot sequence effect - Unpredictable and slower natural loading
    useEffect(() => {
        if (stage === 'booting') {
            const loadMore = () => {
                setProgress(prev => {
                    if (prev >= 100) return 100

                    // Unpredictable chunks between 1 and 25
                    let increment = Math.floor(Math.random() * 25) + 1
                    // Make it sometimes pause or slow down significantly
                    if (Math.random() > 0.7) increment = 1

                    return Math.min(prev + increment, 100)
                })
            }

            // Unpredictable timing intervals between 150ms and 700ms
            const randomInterval = () => {
                let timer: NodeJS.Timeout;
                if (progress >= 100) {
                    timer = setTimeout(() => setStage('intro'), 600)
                    return
                }
                loadMore()
                const nextDelay = Math.floor(Math.random() * 550) + 150
                timer = setTimeout(randomInterval, nextDelay)

                return timer;
            }

            const initialTimer = setTimeout(randomInterval, 300)

            return () => clearTimeout(initialTimer)
        }
    }, [stage, progress])

    // Prevent scrolling while booting/intro
    useEffect(() => {
        if (stage !== 'done') {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [stage])

    return (
        <AnimatePresence>
            {stage !== 'done' && (
                <motion.div
                    key="bootloader-root"
                    className="fixed inset-0 z-[100] overflow-hidden transition-colors duration-700 bg-black text-white"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
                >
                    {/* Background Layer with Dark/Light Transitions */}
                    <AnimatePresence mode="wait">
                        {stage === 'intro' && (
                            <motion.div
                                key="intro-bg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5 }}
                                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                                style={{ backgroundImage: 'url("/backgrounds/forest.jpg")' }}
                            >
                                {/* Base Dark Overlay */}
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                                {/* Expanding Light Overlay */}
                                <div
                                    className="absolute inset-0 bg-[#f5f5f7]/85 backdrop-blur-md"
                                    style={{
                                        clipPath: `circle(${isBright ? '150%' : '0%'} at 95% 5%)`,
                                        transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>



                    {/* Content Layers */}
                    {stage === 'booting' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full p-6">
                            <motion.div
                                key="booting-content"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
                                className="flex flex-col items-center justify-center space-y-8 font-mono"
                            >
                                <div className="relative flex items-center justify-center w-24 h-24 rounded-full border border-white/20 bg-black/50 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    <Terminal className="w-10 h-10 text-white/80" />
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="46"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="2"
                                        />
                                        <motion.circle
                                            cx="48"
                                            cy="48"
                                            r="46"
                                            fill="none"
                                            stroke="rgb(255,255,255)"
                                            strokeWidth="2"
                                            strokeDasharray="289"
                                            strokeDashoffset={289 - (289 * Math.min(progress, 100)) / 100}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </svg>
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-bold tracking-[0.2em] uppercase">TensorThrottleX Space</h2>
                                    <div className="text-xs text-white/50 tracking-widest flex items-center justify-center gap-4">
                                        <span>INITIALIZING...</span>
                                        <span>{Math.min(progress, 100)}%</span>
                                    </div>
                                </div>
                                <div className="w-64 h-[1px] bg-white/10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {stage === 'intro' && (
                        <motion.div
                            key="intro-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className={`absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth touch-pan-y premium-scrollbar z-20 w-full transition-colors duration-700 transform-gpu ${isBright ? 'text-black' : 'text-white'}`}
                            style={{ WebkitOverflowScrolling: 'touch', willChange: 'transform, background-color' }}
                        >
                            {/* Top Header Layout (Fixed to screen) */}
                            <div className="fixed top-0 left-0 w-full p-6 md:px-12 md:pt-10 z-[100] pointer-events-none flex flex-col border-b border-current backdrop-blur-sm" style={{ borderColor: isBright ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', backgroundColor: isBright ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
                                <div className="w-full flex justify-between items-center mb-2">
                                    <div className="pointer-events-auto flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isBright ? 'bg-black border-black text-white' : 'bg-black border-white/20 text-orange-500'}`}
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
                                        className={`pointer-events-auto p-3 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg ${isBright ? 'bg-white border-black/10 shadow-black/5 text-black' : 'bg-black/40 border-white/20 shadow-black/50 backdrop-blur-md text-white'}`}
                                        aria-label="Toggle Theme"
                                    >
                                        {isBright ? <Moon size={16} /> : <Sun size={16} />}
                                    </button>
                                </div>
                                <h1
                                    className={`w-full text-center text-4xl md:text-5xl lg:text-7xl uppercase transition-colors duration-700 ${isBright ? 'text-black' : 'text-white'}`}
                                    style={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em',
                                        WebkitTextStroke: isBright ? 'none' : '1.5px rgba(255,255,255,0.95)'
                                    }}
                                >
                                    TENSOR THROTTLEX SPACE
                                </h1>
                            </div>

                            {/* Journey Layout */}
                            <div className="mx-auto w-full flex flex-col items-center overflow-x-hidden">

                                {/* Section 1 - Hero */}
                                <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 relative w-full mb-12 mt-48 md:mt-60">

                                    {/* ABOUT SEPARATOR */}
                                    <div className={`w-full max-w-[1200px] mx-auto flex items-center justify-start gap-4 mb-8 md:mb-16 opacity-80 px-6 ${isBright ? 'text-black' : 'text-white'}`}>
                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                                        <span className="uppercase text-xl md:text-2xl font-bold tracking-widest" style={{ fontFamily: '"Alegreya Sans SC", sans-serif', letterSpacing: '0.2em' }}>ABOUT</span>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 1 }}
                                        className="w-full max-w-6xl flex flex-col items-center z-10 will-change-transform"
                                    >
                                        <div
                                            className={`w-full max-w-[1100px] aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden mb-10 shadow-2xl border relative ${isBright ? 'border-black/10' : 'border-white/10'}`}
                                            style={{
                                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                                            }}
                                        >
                                            <video
                                                className="w-full h-full object-cover mix-blend-normal opacity-90"
                                                autoPlay
                                                loop
                                                muted={isMuted}
                                                playsInline
                                            >
                                                <source src="/media/roadmap/1.mp4" type="video/mp4" />
                                                <source src="/media/roadmap/1.webm" type="video/webm" />
                                                {/* Fallback image if video is unavailable */}
                                                <AdaptiveImage basePath="/media/roadmap/1" className="w-full h-full object-cover mix-blend-normal opacity-90" alt="Atmospheric Horizon" />
                                            </video>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                                className={`absolute bottom-6 right-6 p-3 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg z-50 pointer-events-auto ${isBright ? 'bg-white/80 border-black/10 text-black' : 'bg-black/60 border-white/20 text-white hover:bg-black/80'}`}
                                                aria-label={isMuted ? "Unmute" : "Mute"}
                                            >
                                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                            </button>
                                        </div>
                                        <h1 className={`text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 ${isBright ? 'text-black' : 'text-white'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 500 }}>
                                            A Calm Space for Deep Technical Exploration
                                        </h1>
                                        <p className={`text-xl md:text-2xl font-light leading-relaxed max-w-2xl ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                            Step into a thoughtfully designed environment where ideas, projects, and experiments live in quiet focus — free from noise and distraction.
                                        </p>
                                    </motion.div>

                                    {/* Scroll indicator */}
                                    <motion.div
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        className={`absolute bottom-8 opacity-40 flex flex-col items-center gap-2 ${isBright ? 'text-black' : 'text-white'}`}
                                    >
                                        <div className="w-[1px] h-16 border-l border-dashed border-current" />
                                    </motion.div>
                                </div>

                                {/* SECTION: ABOUT - Editorial/Poster Style Layout */}
                                <div className="relative w-full max-w-[1200px] mx-auto xl:my-10 px-6 z-10">
                                    {/* Central subtle spine line for the aesthetic */}
                                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-current to-transparent opacity-10 hidden md:block" />

                                    {/* ABOUT 01: System Architecture */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        className="relative w-full flex justify-center mt-12 md:mt-24 mb-32 md:mb-56 will-change-transform"
                                    >
                                        {/* Big Number Header */}
                                        <div
                                            className="absolute top-0 md:-top-12 left-5 md:left-[5%] z-20 pointer-events-none"
                                            style={{
                                                filter: isBright ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 0px 2px rgba(255,255,255,1))' : 'drop-shadow(0px 0px 12px rgba(0,0,0,0.95)) drop-shadow(0px 0px 4px rgba(0,0,0,1))'
                                            }}
                                        >
                                            <div className="flex items-start">
                                                <h2
                                                    className="text-4xl sm:text-5xl md:text-6xl tracking-tight m-0 drop-shadow-lg uppercase select-none"
                                                    style={{
                                                        color: 'var(--heading-primary)',
                                                        fontFamily: '"Playfair Display", serif',
                                                        fontWeight: 900,
                                                        letterSpacing: '-0.02em',
                                                        WebkitTextStroke: isBright ? 'none' : '1.5px rgba(255,255,255,0.95)'
                                                    }}
                                                >
                                                    01
                                                </h2>
                                                <span
                                                    className="text-4xl md:text-5xl mt-2 ml-1"
                                                    style={{
                                                        color: '#000',
                                                        WebkitTextStroke: isBright ? 'none' : '1px rgba(255,255,255,0.95)'
                                                    }}
                                                >
                                                    +
                                                </span>
                                            </div>
                                            <h3
                                                className="text-2xl md:text-5xl mt-[-10px] md:mt-[-15px] uppercase tracking-widest pl-1 font-bold"
                                                style={{
                                                    fontFamily: '"Alegreya Sans SC", sans-serif',
                                                    color: '#000',
                                                    WebkitTextStroke: isBright ? 'none' : '1px rgba(255,255,255,0.95)'
                                                }}
                                            >
                                                Intent Protocol
                                            </h3>
                                            <div className="w-24 h-[3px] bg-red-600 mt-4 md:mt-6 ml-1"></div>
                                        </div>

                                        {/* Main Hero Image */}
                                        <div className={`w-full md:w-10/12 aspect-[4/3] md:aspect-[21/9] rounded-sm overflow-hidden mt-32 md:mt-24 relative shadow-2xl border ${isBright ? 'border-black/5' : 'border-white/5'}`}>
                                            <AdaptiveImage basePath="/media/roadmap/2" className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-&lsqb;2000ms&rsqb;" alt="System Architecture" />
                                            <div className={`absolute inset-0 bg-gradient-to-t ${isBright ? 'from-white/50' : 'from-black/80'} via-transparent to-transparent opacity-60 pointer-events-none`}></div>
                                        </div>

                                        {/* Overlapping Info Box */}
                                        <div className={`relative md:absolute md:bottom-[-15%] md:right-[10%] w-[95%] md:w-[400px] -mt-10 md:mt-0 p-6 md:p-10 backdrop-blur-xl z-30 shadow-2xl transition-all ${isBright ? 'bg-white/95 border-r-4 border-r-red-600 border border-black/10' : 'bg-[#111]/95 border-r-4 border-r-red-600 border border-white/10'}`}>
                                            <div className="text-xs uppercase tracking-widest mb-6 opacity-60 flex justify-between font-bold border-b border-current pb-2">
                                                <span>Reasoning</span>
                                                <span>+</span>
                                            </div>
                                            <div className={`space-y-4 text-base md:text-lg leading-relaxed ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                                <p>Every idea starts unshaped.<br />This space helps to slow down and mould it clearly.</p>
                                                <p>Clarify what I'm building.<br />Set direction before I move.</p>
                                                <p className="font-bold">Ground first. Build next.</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* ABOUT 02: Fluid Traversal */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        className="relative w-full flex flex-col md:flex-row md:justify-end items-center mb-32 md:mb-56 z-20 will-change-transform"
                                    >
                                        <div className={`relative w-full md:w-7/12 aspect-[4/5] md:aspect-[3/4] z-10 shadow-2xl border transform-gpu ${isBright ? 'border-black/5' : 'border-white/5'}`}>
                                            <AdaptiveImage basePath="/media/roadmap/3" className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-&lsqb;2000ms&rsqb;" alt="Fluid Traversal" />
                                            {/* Top corner label */}
                                            <div className={`absolute top-6 right-6 px-4 py-2 text-xs md:text-sm border uppercase tracking-widest backdrop-blur-md ${isBright ? 'bg-white/80 border-black/20 text-black' : 'bg-black/80 border-white/20 text-white'}`}>
                                                Vector
                                            </div>
                                        </div>

                                        {/* Giant Background Number */}
                                        <div
                                            className="absolute top-[-5%] left-5 md:left-[15%] z-30 pointer-events-none"
                                            style={{
                                                filter: isBright ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 0px 2px rgba(255,255,255,1))' : 'drop-shadow(0px 0px 12px rgba(0,0,0,0.95)) drop-shadow(0px 0px 4px rgba(0,0,0,1))'
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <h3
                                                    className="text-6xl md:text-8xl font-bold tracking-tight"
                                                    style={{
                                                        fontFamily: '"Alfa Slab One", serif',
                                                        color: '#000',
                                                        WebkitTextStroke: isBright ? 'none' : '1.5px rgba(255,255,255,0.95)'
                                                    }}
                                                >
                                                    02<span className="text-red-600 font-serif" style={{ WebkitTextStroke: 'none' }}>.</span>
                                                </h3>
                                                <h4
                                                    className="text-3xl md:text-5xl uppercase tracking-widest mt-1 font-bold"
                                                    style={{
                                                        fontFamily: '"Alegreya Sans SC", sans-serif',
                                                        color: '#000',
                                                        WebkitTextStroke: isBright ? 'none' : '1px rgba(255,255,255,0.95)'
                                                    }}
                                                >
                                                    Design in Motion
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Overlapping Info Box */}
                                        <div className={`relative md:absolute md:bottom-[10%] md:left-[10%] w-[95%] md:w-[420px] -mt-12 md:mt-0 p-6 md:p-10 border backdrop-blur-xl z-30 shadow-2xl transition-all ${isBright ? 'bg-white/95 border-l-4 border-l-red-600 border-[1px] border-black/10' : 'bg-[#0a0a0a]/95 border-l-4 border-l-red-600 border-[1px] border-white/10'}`}>
                                            <div className="w-full flex pb-3 mb-6 border-b border-current opacity-60 justify-between font-bold">
                                                <span className="text-xs uppercase tracking-widest">Fluidity</span>
                                                <span>+</span>
                                            </div>
                                            <div className={`space-y-4 text-base md:text-lg leading-relaxed ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                                <p>Ideas don’t stay abstract here.<br />They begin to take structure.</p>
                                                <p>Sketch the system.<br />Arrange components.<br />Test how parts connect.</p>
                                                <p className="font-bold">Thoughts start forming into something real.</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* ABOUT 03: Localized State Persistence */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        className="relative w-full flex flex-col md:flex-row items-center md:items-start md:justify-start mb-12 md:mb-32 z-30 md:pl-16 will-change-transform"
                                    >
                                        {/* Image Box */}
                                        <div className={`relative w-[95%] md:w-6/12 aspect-square z-10 shadow-2xl border transform-gpu ${isBright ? 'border-black/5' : 'border-white/5'}`}>
                                            <AdaptiveImage basePath="/media/roadmap/4" className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-&lsqb;2000ms&rsqb;" alt="Localized State Persistence" />
                                        </div>

                                        {/* Typography Elements */}
                                        <div
                                            className="absolute top-[10%] md:top-[15%] right-5 md:right-[20%] flex flex-col items-end text-right z-20 pointer-events-none"
                                            style={{
                                                filter: isBright ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 0px 2px rgba(255,255,255,1))' : 'drop-shadow(0px 0px 12px rgba(0,0,0,0.95)) drop-shadow(0px 0px 4px rgba(0,0,0,1))'
                                            }}
                                        >
                                            <h3
                                                className={`text-7xl md:text-9xl font-bold tracking-tighter ${isBright ? 'opacity-40' : 'opacity-90'}`}
                                                style={{
                                                    fontFamily: '"Playfair Display", serif',
                                                    color: 'var(--heading-primary)',
                                                    fontWeight: 900,
                                                    letterSpacing: '-0.02em',
                                                    WebkitTextStroke: isBright ? 'none' : '1.5px rgba(255,255,255,0.95)'
                                                }}
                                            >
                                                3rd
                                            </h3>
                                            <h4
                                                className="text-4xl md:text-6xl uppercase tracking-widest mt-[-20px] md:mt-[-40px] font-bold"
                                                style={{
                                                    fontFamily: '"Alegreya Sans SC", sans-serif',
                                                    color: '#000',
                                                    WebkitTextStroke: isBright ? 'none' : '1px rgba(255,255,255,0.95)'
                                                }}
                                            >
                                                Execution<br />Trace
                                            </h4>
                                        </div>

                                        {/* Red Solid Focus Box */}
                                        <div className="relative md:absolute md:bottom-[15%] w-[95%] md:-right-[5%] md:w-[350px] -mt-16 md:mt-0 p-8 md:p-10 shadow-[0_20px_50px_rgba(153,27,27,0.4)] z-30 bg-[#8b1818] text-white">
                                            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                                                <span className="text-xs uppercase tracking-widest font-bold">LOGIC</span>
                                                <div className="w-8 h-8 border border-white/40 flex items-center justify-center rounded-full text-xs font-serif">P</div>
                                            </div>
                                            <div className="space-y-4 text-base md:text-lg leading-relaxed text-white/95" style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                                <p>Nothing stays vague.<br />Each step is visible and trackable.</p>
                                                <p>See what changed.<br />See what worked.<br />Refine based on real feedback.</p>
                                                <p className="font-bold">Experiments become shaped outcomes.</p>
                                            </div>

                                            {/* Micro-table decorative */}
                                            <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-white/10 opacity-80 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold">
                                                <div className="flex justify-between"><span>VISUAL RANGE</span><span className="text-red-300">+800</span></div>
                                                <div className="flex justify-between"><span>RETENTION</span><span className="text-red-300">MAX</span></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* OPERATIONS SEPARATOR */}
                                <div className={`w-full max-w-[1200px] mx-auto flex items-center justify-start gap-4 mt-16 mb-24 opacity-80 ${isBright ? 'text-black' : 'text-white'} z-30 relative px-6`}>
                                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                                    <span className="uppercase text-xl md:text-2xl font-bold tracking-widest" style={{ fontFamily: '"Alegreya Sans SC", sans-serif', letterSpacing: '0.2em' }}>OPERATIONS</span>
                                </div>

                                {/* Roadmap Timeline Container for Operations */}
                                <div className="relative w-full max-w-[1400px] px-6 pb-12 flex flex-col items-center">
                                    {/* Render Blocks */}
                                    {[
                                        { title: "The Spatial Map", text: "I lay out my raw, unshaped ideas across this open field.\nIt’s where my unordered thoughts finally find their place as visual nodes.\n\nYou can zoom in to see a single detail or pull back to witness the entire arc of my creation.", img: "5", align: "right" },
                                        { title: "The Active Shell", text: "I talk to the system directly through this interface.\nIt’s the bridge between my intention and the actual code running underneath.\n\nThis command line isn't just for me—it's how the entire space stays alive and reactive.", img: "6", align: "left" },
                                        { title: "The Genealogy of Logic", text: "I use these branching trees to show you how my ideas grow.\nEvery complex result has a root, and I want you to see the path I took to get there.\n\nPeel away the layers to see the trade-offs and decisions that shaped the final system.", img: "7", align: "right" },
                                        { title: "The Live Heartbeat", text: "I share my work while it’s still in motion.\nThese live feeds aren't snapshots—they are the real-time heartbeat of my experiments as they form.\n\nWatch my thoughts stabilize into something functional as the telemetry updates live.", img: "8", align: "left" },
                                        { title: "The Atmospheric Shift", text: "I change the air in this room depending on the work I’m doing.\nHigh clarity for deep logic, and a noise-free darkness for pure creation.\n\nThis modulation keeps me focused for long hours, and you can see my work in either light.", img: "9", align: "right" }
                                    ].map((item, idx, array) => {
                                        const isLeft = item.align === 'left';
                                        const isRight = item.align === 'right';
                                        const isCenter = item.align === 'center';

                                        // Determine SVG path to NEXT node forming an S-curve bridge
                                        let svgPath = "";
                                        if (idx < array.length - 1) {
                                            const nextNode = array[idx + 1];
                                            if (isLeft && nextNode.align === 'right') {
                                                svgPath = "M 80,0 C 80,60 20,40 20,100";
                                            } else if (isRight && nextNode.align === 'left') {
                                                svgPath = "M 20,0 C 20,60 80,40 80,100";
                                            } else if (isLeft && nextNode.align === 'center') {
                                                svgPath = "M 80,0 C 80,50 50,50 50,100";
                                            } else if (isRight && nextNode.align === 'center') {
                                                svgPath = "M 20,0 C 20,50 50,50 50,100";
                                            } else if (isCenter && nextNode.align === 'left') {
                                                svgPath = "M 50,0 C 50,50 80,50 80,100";
                                            } else if (isCenter && nextNode.align === 'right') {
                                                svgPath = "M 50,0 C 50,50 20,50 20,100";
                                            }
                                        }

                                        return (
                                            <div key={idx} className="relative w-full flex flex-col justify-center min-h-[90vh] md:min-h-[85vh] py-16 md:py-20 z-10">
                                                {/* Curved SVG Bridge connecting to next section */}
                                                {svgPath && (
                                                    <div className="hidden md:block absolute -bottom-[25%] left-0 right-0 h-[50%] pointer-events-none z-0" style={{ color: isBright ? '#444' : '#fff' }}>
                                                        <svg className="w-full h-[120%] -mt-[10%]" preserveAspectRatio="none" viewBox="0 0 100 100">
                                                            <path d={svgPath} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" vectorEffect="non-scaling-stroke" className="opacity-20" />
                                                            <motion.path
                                                                d={svgPath}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                vectorEffect="non-scaling-stroke"
                                                                initial={{ pathLength: 0, opacity: 0 }}
                                                                whileInView={{ pathLength: 1, opacity: 0.7 }}
                                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                                viewport={{ once: true, margin: "-25%" }}
                                                                strokeLinecap="round"
                                                                style={{
                                                                    color: 'var(--heading-primary)',
                                                                    fontFamily: '"Playfair Display", serif',
                                                                    fontWeight: 900,
                                                                    letterSpacing: '-0.02em'
                                                                }}
                                                            />
                                                        </svg>
                                                    </div>
                                                )}

                                                {/* Wide Center Layout */}
                                                {isCenter && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 30 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true, margin: "-50px" }}
                                                        className="w-full flex flex-col items-center text-center z-10 will-change-transform"
                                                    >
                                                        <div className={`w-full max-w-4xl aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden mb-10 md:mb-12 relative shadow-2xl border ${isBright ? 'border-black/10 bg-white/60' : 'border-white/10 bg-black/40'}`}>
                                                            <AdaptiveImage basePath={`/media/roadmap/${item.img}`} className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000" alt={item.title} />
                                                        </div>
                                                        <h3 className={`text-3xl md:text-5xl font-serif tracking-tight mb-6 md:mb-8 leading-tight max-w-3xl ${isBright ? 'text-black' : 'text-white'}`} style={{ fontFamily: "Georgia, serif" }}>
                                                            {item.title}
                                                        </h3>
                                                        <div className={`space-y-4 md:space-y-6 leading-relaxed text-lg md:text-xl font-light max-w-2xl px-4 ${isBright ? 'text-black/80' : 'text-white/80'}`}>
                                                            {item.text.split('\n').map((para, i) => (
                                                                para && <p key={i}>{para}</p>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Alternating Left/Right Layout */}
                                                {!isCenter && (
                                                    <div className="flex flex-col md:flex-row items-center justify-between w-full h-full z-10 gap-12 md:gap-0">
                                                        {/* Text and Image as inline blocks to avoid type-recreation crash */}
                                                        {isLeft ? (
                                                            <>
                                                                <div className="w-full md:w-1/2 flex justify-start md:pr-16">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 30 }}
                                                                        whileInView={{ opacity: 1, y: 0 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        className={`flex flex-col w-full max-w-lg will-change-transform items-start text-left`}
                                                                    >
                                                                        <h3 className={`text-3xl md:text-4xl lg:text-5xl tracking-tight mb-5 md:mb-8 leading-tight ${isBright ? 'text-black' : 'text-white'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 500 }}>
                                                                            {item.title}
                                                                        </h3>
                                                                        <div className={`space-y-4 md:space-y-6 leading-relaxed text-balance text-lg md:text-xl font-light ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                                                            {item.text.split('\n').map((para, i) => (
                                                                                para && <p key={i}>{para}</p>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </div>
                                                                <div className="w-full md:w-1/2 flex justify-end md:pl-16">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                                        transition={{ duration: 0.8 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        className={`w-full max-w-[280px] sm:max-w-[320px] md:max-w-md aspect-[4/5] sm:aspect-[3/4] max-h-[50vh] md:max-h-[65vh] rounded-3xl overflow-hidden relative shadow-2xl backdrop-blur-md border transform-gpu will-change-transform ${isBright ? 'bg-white/60 border-black/10' : 'bg-black/40 border-white/10'}`}
                                                                    >
                                                                        <div className={`absolute top-6 left-6 z-30 flex items-center justify-center`}>
                                                                            <div className="w-6 h-6 bg-green-500 rounded-full animate-ping absolute opacity-60" />
                                                                            <div className="w-3 h-3 bg-green-400 rounded-full relative z-10 shadow-[0_0_8px_rgba(74,222,128,0.8)] border border-green-200" />
                                                                        </div>
                                                                        <div className={`absolute inset-0 bg-gradient-to-t ${isBright ? 'from-white/20' : 'from-black/40'} to-transparent z-10 pointer-events-none`} />
                                                                        <AdaptiveImage basePath={`/media/roadmap/${item.img}`} className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000" alt={item.title} />
                                                                    </motion.div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-full md:w-1/2 flex justify-start md:pr-16">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                                        transition={{ duration: 0.8 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        className={`w-full max-w-[280px] sm:max-w-[320px] md:max-w-md aspect-[4/5] sm:aspect-[3/4] max-h-[50vh] md:max-h-[65vh] rounded-3xl overflow-hidden relative shadow-2xl backdrop-blur-md border transform-gpu will-change-transform ${isBright ? 'bg-white/60 border-black/10' : 'bg-black/40 border-white/10'}`}
                                                                    >
                                                                        <div className={`absolute top-6 right-6 z-30 flex items-center justify-center`}>
                                                                            <div className="w-6 h-6 bg-green-500 rounded-full animate-ping absolute opacity-60" />
                                                                            <div className="w-3 h-3 bg-green-400 rounded-full relative z-10 shadow-[0_0_8px_rgba(74,222,128,0.8)] border border-green-200" />
                                                                        </div>
                                                                        <div className={`absolute inset-0 bg-gradient-to-t ${isBright ? 'from-white/20' : 'from-black/40'} to-transparent z-10 pointer-events-none`} />
                                                                        <AdaptiveImage basePath={`/media/roadmap/${item.img}`} className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000" alt={item.title} />
                                                                    </motion.div>
                                                                </div>
                                                                <div className="w-full md:w-1/2 flex justify-end md:pl-16">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 30 }}
                                                                        whileInView={{ opacity: 1, y: 0 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        className={`flex flex-col w-full max-w-lg will-change-transform items-end text-right`}
                                                                    >
                                                                        <h3 className={`text-3xl md:text-4xl lg:text-5xl tracking-tight mb-5 md:mb-8 leading-tight ${isBright ? 'text-black' : 'text-white'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 500 }}>
                                                                            {item.title}
                                                                        </h3>
                                                                        <div className={`space-y-4 md:space-y-6 leading-relaxed text-balance text-lg md:text-xl font-light ${isBright ? 'text-black/80' : 'text-white/80'}`} style={{ fontFamily: '"Alegreya Sans SC", sans-serif' }}>
                                                                            {item.text.split('\n').map((para, i) => (
                                                                                para && <p key={i}>{para}</p>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Section 10 - Closing */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 relative w-full pb-32 z-10 will-change-transform"
                                >
                                    <div className="max-w-4xl w-full">
                                        <div className={`w-full min-h-[500px] md:min-h-0 sm:aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden mb-12 relative shadow-2xl border flex flex-col items-center justify-center px-4 py-12 md:p-16 transform-gpu ${isBright ? 'border-black/10 bg-white/60' : 'border-white/10 bg-black/40'}`}>
                                            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                                <AdaptiveImage basePath="/media/roadmap/10" className="absolute inset-0 w-full h-full object-cover opacity-40 hover:scale-105 transition-transform duration-1000" alt="Closing Horizon" />
                                            </div>
                                            <motion.div
                                                className="relative z-10 flex flex-col items-center max-w-2xl px-2"
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true, margin: "-50px" }}
                                                variants={{ visible: { transition: { staggerChildren: 0.3 } } }}
                                            >
                                                <motion.p
                                                    variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}
                                                    className={`text-xl sm:text-2xl md:text-4xl mb-4 md:mb-6 leading-relaxed drop-shadow-sm ${isBright ? 'text-black' : 'text-white'}`}
                                                    style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 300 }}
                                                >
                                                    TensorThrottleX Space is not a portfolio.
                                                </motion.p>
                                                <motion.p
                                                    variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}
                                                    className={`text-[1.1rem] sm:text-xl md:text-3xl mb-8 md:mb-10 leading-relaxed drop-shadow-sm opacity-80 ${isBright ? 'text-black' : 'text-white'}`}
                                                    style={{ fontFamily: '"Alegreya Sans SC", sans-serif', fontWeight: 300 }}
                                                >
                                                    It is a place to wander through thought, creation, and exploration — as if moving through a living system.
                                                </motion.p>
                                                <motion.button
                                                    variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}
                                                    onClick={() => { setStage('done'); setIsBooting(false); }}
                                                    className={`group relative overflow-hidden px-12 py-5 rounded-full font-medium tracking-wide transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${isBright ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'}`}
                                                    style={{ fontFamily: '"Alfa Slab One", serif', letterSpacing: '0.1em' }}
                                                >
                                                    <span className="block group-hover:hidden">Enter the Space</span>
                                                    <span className="hidden group-hover:block px-2">Deep Dive</span>
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Footer as requested */}
                                <div className={`w-full py-8 px-4 flex items-center justify-center text-center text-xs md:text-sm tracking-[0.15em] font-semibold ${isBright ? 'bg-[#f5f5f7] text-[#555] border-t border-black/10' : 'bg-[#050505] text-[#8b8b8b] border-t border-white/5'}`}>
                                    © 2026 TENSORTHROTTLE X. ALL RIGHTS RESERVED.
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
