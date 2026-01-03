import { Variants, Transition } from 'framer-motion';

// Premium easing functions
export const easing = {
    smooth: [0.4, 0, 0.2, 1] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    premium: [0.22, 1, 0.36, 1] as const,
    snappy: [0.25, 0.1, 0.25, 1] as const,
};

// Durations (in seconds)
export const duration = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    dramatic: 0.8,
};

// Premium fade in with slight scale
export const fadeIn: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: duration.normal,
            ease: easing.premium,
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.98,
        transition: {
            duration: duration.fast,
            ease: easing.smooth,
        },
    },
};

// Slide in from left with spring
export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30,
        },
    },
};

// Slide in from right
export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30,
        },
    },
};

// Premium scale up with spring
export const scaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        transition: {
            duration: duration.fast,
        },
    },
};

// Pulse animation for active tasks - more subtle and premium
export const pulseGreen: Variants = {
    animate: {
        scale: [1, 1.015, 1],
        opacity: [0.95, 1, 0.95],
        boxShadow: [
            '0 0 0 0 rgba(52, 199, 89, 0)',
            '0 0 0 4px rgba(52, 199, 89, 0.15)',
            '0 0 0 0 rgba(52, 199, 89, 0)',
        ],
    },
};

export const pulseTransition: Transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
};

// Stagger children with faster timing
export const staggerContainer: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.05,
        },
    },
};

// Premium card tap - more responsive
export const cardTap = {
    scale: 0.985,
    transition: { duration: 0.1, ease: easing.snappy },
};

// Card hover effect
export const cardHover = {
    y: -2,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    transition: { duration: 0.2, ease: easing.smooth },
};

// Premium backdrop with blur
export const backdrop: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: duration.fast },
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.fast, delay: 0.1 },
    },
};

// Premium modal with spring physics
export const modalContent: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.94,
        y: 24,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 32,
            mass: 1,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.94,
        y: 16,
        transition: {
            duration: duration.fast,
            ease: easing.smooth,
        },
    },
};

// List item with smooth spring
export const listItem: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 35,
        },
    },
    exit: {
        opacity: 0,
        x: -16,
        transition: {
            duration: duration.fast,
            ease: easing.smooth,
        },
    },
};

// Success checkmark animation
export const checkmarkPath: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: 0.1,
            },
            opacity: { duration: 0.1 },
        },
    },
};

// Status change celebration
export const celebrationPop: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.2, 0.95, 1.05, 1],
        transition: {
            duration: 0.5,
            times: [0, 0.2, 0.4, 0.6, 1],
            ease: easing.spring,
        },
    },
};

// Floating animation for banners
export const floatingBanner: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30,
        },
    },
    exit: {
        y: -100,
        opacity: 0,
        transition: {
            duration: duration.fast,
            ease: easing.smooth,
        },
    },
};

// Shimmer loading effect (use with CSS)
export const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// Drag feedback
export const dragActive = {
    scale: 1.02,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
    cursor: 'grabbing',
};

// Drop zone hover
export const dropZoneActive = {
    scale: 1.01,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderColor: 'rgba(0, 122, 255, 0.4)',
};
