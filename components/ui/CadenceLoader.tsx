'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CadenceMark } from '@/components/auth/AuthBits';

interface CadenceLoaderProps {
    label?: string;
    className?: string;
}

// Branded loading state: the Cadence mark with pulsing concentric rings.
export function CadenceLoader({ label, className }: CadenceLoaderProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-5 ${className ?? ''}`}>
            <div className="relative flex items-center justify-center">
                {[0, 0.6].map((delay) => (
                    <motion.span
                        key={delay}
                        className="absolute rounded-4xl border border-accent"
                        style={{ width: 60, height: 60 }}
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.9 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay }}
                    />
                ))}
                <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <CadenceMark />
                </motion.div>
            </div>
            {label && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                    {label}
                    <motion.span
                        aria-hidden
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    >
                        …
                    </motion.span>
                </div>
            )}
        </div>
    );
}
