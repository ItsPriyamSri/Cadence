'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
    value: number;
    className?: string;
    showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = false }: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    // Color based on progress
    const getGradient = () => {
        if (clampedValue >= 100) return 'from-green-400 to-emerald-500';
        if (clampedValue >= 80) return 'from-yellow-400 to-orange-500';
        if (clampedValue >= 50) return 'from-accent to-blue-500';
        return 'from-accent/70 to-blue-400';
    };

    return (
        <div className="relative">
            <div
                className={cn(
                    'w-full bg-bg-secondary rounded-full overflow-hidden',
                    className
                )}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.1,
                    }}
                    className={cn(
                        'h-full rounded-full',
                        'bg-gradient-to-r',
                        getGradient()
                    )}
                />

                {/* Shine effect */}
                {clampedValue > 0 && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{
                            duration: 1.5,
                            delay: 0.5,
                            repeat: Infinity,
                            repeatDelay: 3,
                        }}
                        className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                )}
            </div>

            {showLabel && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-0 -top-6 text-xs font-medium text-text-secondary"
                >
                    {clampedValue}%
                </motion.span>
            )}
        </div>
    );
}
