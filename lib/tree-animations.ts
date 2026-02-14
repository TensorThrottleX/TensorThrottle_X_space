/**
 * Global Tree Animation Configuration
 * Deterministic, stable, and architecturally weighted.
 */

export const TREE_ANIMATION_CONFIG = {
    // Timing
    DURATION: {
        CONTAINER: 0.380,
        CONNECTOR: 0.350,
        NODE: 0.280,
        COLLAPSE_NODE: 0.220,
        COLLAPSE_CONNECTOR: 0.250,
        COLLAPSE_CONTAINER: 0.320,
    },

    // Delays
    DELAY: {
        CONNECTOR: 0.040,
        NODE: 0.060,
        STAGGER: 0.060,
    },

    // Easing: Standard Material-style Easing (Deterministic)
    EASING: [0.4, 0.0, 0.2, 1], // cubic-bezier(0.4, 0.0, 0.2, 1)
    EASING_FUNC: "cubic-bezier(0.4, 0.0, 0.2, 1)",

    // Physics (Spring backup if needed)
    SPRING: {
        type: "spring",
        stiffness: 120,
        damping: 22,
        mass: 0.8,
    },

    // Transforms
    TRANSFORMS: {
        INITIAL_Y: -6,
        INITIAL_SCALE: 0.985,
        COLLAPSE_Y: -4,
    }
};

export type AnimationPhase = 'container' | 'connector' | 'node';
