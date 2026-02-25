/**
 * Global Tree Animation Configuration
 * Deterministic, stable, and architecturally weighted.
 * 
 * IMPORTANT: All duration values are in MILLISECONDS for d3 compatibility.
 * d3.transition().duration() expects milliseconds.
 */

export const TREE_ANIMATION_CONFIG = {
    // Timing (in milliseconds for d3 compatibility)
    DURATION: {
        CONTAINER: 380,
        CONNECTOR: 350,
        NODE: 280,
        COLLAPSE_NODE: 220,
        COLLAPSE_CONNECTOR: 250,
        COLLAPSE_CONTAINER: 320,
        // Horizontal tree uses longer durations
        HORIZONTAL: 600,
    },

    // Delays (in milliseconds)
    DELAY: {
        CONNECTOR: 40,
        NODE: 60,
        STAGGER: 60,
    },

    // Easing: Standard Material-style Easing (Deterministic)
    EASING: [0.4, 0.0, 0.2, 1] as const, // cubic-bezier(0.4, 0.0, 0.2, 1)
    EASING_FUNC: "cubic-bezier(0.4, 0.0, 0.2, 1)",

    // Physics (Spring backup for framer-motion if needed)
    SPRING: {
        type: "spring" as const,
        stiffness: 120,
        damping: 22,
        mass: 0.8,
    },

    // Transforms
    TRANSFORMS: {
        INITIAL_Y: -6,
        INITIAL_SCALE: 0.985,
        COLLAPSE_Y: -4,
    },

    // Lock timeout buffer (ms) - prevents rapid toggle spam
    LOCK_BUFFER: 100,
} as const;

export type AnimationPhase = 'container' | 'connector' | 'node';

// Type-safe duration getter
export type TreeAnimationDuration = typeof TREE_ANIMATION_CONFIG.DURATION;
