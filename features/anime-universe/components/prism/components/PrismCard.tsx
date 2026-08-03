'use client'

import { motion } from 'framer-motion'
import { useCardParallax } from '../hooks/useCardParallax'
import type { PrismCardProps } from '../types'

const CARD_RADIUS = 20
const EASE = [0.22, 1, 0.36, 1] as const

const activeVariants = {
  inactive: {
    filter: 'brightness(0.7) saturate(0.6)',
    scale: 0.92,
    opacity: 0.75,
    transition: { duration: 0.3, ease: EASE },
  },
  active: {
    filter: 'brightness(1) saturate(1)',
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE },
  },
}

export function PrismCard({ anime, isActive }: PrismCardProps) {
  const { ref, style, handleMouseMove, handleMouseLeave } = useCardParallax()

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      variants={activeVariants}
      animate={isActive ? 'active' : 'inactive'}
      style={{
        ...style,
        borderRadius: CARD_RADIUS,
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: [
          `0 0 30px -8px color-mix(in srgb, ${anime.accentColor} 25%, transparent)`,
          `0 8px 32px -12px rgba(0,0,0,0.5)`,
          `inset 0 1px 0 rgba(255,255,255,0.06)`,
        ].join(', '),
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--adaptive-glass-bg)',
        backgroundImage: `radial-gradient(ellipse at 50% 40%, color-mix(in srgb, ${anime.accentColor} 12%, transparent) 0%, transparent 70%)`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Upper: Cover Image (~72%) ── */}
      <div
        style={{
          flex: 7,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {anime.coverImage ? (
          <motion.img
            src={anime.coverImage}
            alt={anime.title}
            decoding="async"
            loading="lazy"
            animate={{ filter: isActive ? 'brightness(1)' : 'brightness(0.75)' }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              willChange: 'transform',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              backgroundColor: 'rgba(0,0,0,0.55)',
              backgroundImage: [
                `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${anime.accentColor} 20%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.6) 100%)`,
                `linear-gradient(135deg, color-mix(in srgb, ${anime.accentColor} 35%, transparent) 0%, transparent 70%)`,
              ].join(', '),
            }}
          >
            <span
              style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 700,
                fontFamily: "'Stay Chill', sans-serif",
                color: '#FFFFFF',
                opacity: 0.85,
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                textAlign: 'center',
                lineHeight: 1.1,
                padding: '0 20px',
                letterSpacing: '0.04em',
              }}
            >
              {anime.title}
            </span>
            <span
              style={{
                fontSize: 'clamp(12px, 1.2vw, 14px)',
                fontWeight: 400,
                fontFamily: "'Stay Chill', sans-serif",
                color: anime.accentColor,
                opacity: 0.7,
                textAlign: 'center',
                padding: '0 24px',
                letterSpacing: '0.06em',
                textShadow: '0 1px 8px rgba(0,0,0,0.4)',
              }}
            >
              {anime.subtitle}
            </span>
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Divider ── */}
      <motion.div
        animate={{
          backgroundColor: isActive
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.06)',
        }}
        transition={{ duration: 0.3, ease: EASE }}
        style={{
          height: 1,
          flexShrink: 0,
          marginLeft: 20,
          marginRight: 20,
        }}
      />

      {/* ── Lower: Metadata (~28%) ── */}
      <div
        style={{
          flex: 3,
          padding: '18px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {/* Title */}
        <motion.h3
          animate={{
            y: isActive ? 0 : 4,
            opacity: isActive ? 1 : 0.6,
          }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{
            fontFamily: "'Stay Chill', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(14px, 1.6vw, 18px)',
            letterSpacing: '0.02em',
            color: 'var(--adaptive-hero-color)',
            margin: 0,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {anime.title}
        </motion.h3>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Stay Chill', sans-serif",
            fontWeight: 450,
            fontSize: 'clamp(11px, 1vw, 13px)',
            color: 'var(--adaptive-hero-muted)',
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {anime.subtitle}
        </p>

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: isActive ? 0.1 : 0 }}
          style={{
            height: 2,
            width: '100%',
            borderRadius: 1,
            transformOrigin: 'left center',
            backgroundColor: anime.accentColor,
            opacity: isActive ? 0.8 : 0.4,
            marginTop: 4,
          }}
        />
      </div>
    </motion.div>
  )
}
