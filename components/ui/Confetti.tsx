'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/app';

const CONFETTI_COLORS = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff', '#06d6a0'];

interface ConfettiPiece {
    id: number;
    x: number;
    color: string;
    delay: number;
    size: number;
}

export function Confetti() {
    const { showConfetti } = useAppStore();
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (showConfetti) {
            // Generate confetti pieces
            const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                delay: Math.random() * 0.5,
                size: Math.random() * 8 + 4,
            }));
            setPieces(newPieces);

            // Play celebration sound
            try {
                const audio = new Audio('/sounds/complete.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                    // Sound blocked by browser, that's ok
                });
            } catch {
                // Audio not supported
            }
        } else {
            setPieces([]);
        }
    }, [showConfetti]);

    if (!showConfetti) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {pieces.map((piece) => (
                    <motion.div
                        key={piece.id}
                        initial={{
                            y: -20,
                            x: `${piece.x}vw`,
                            opacity: 1,
                            rotate: 0,
                            scale: 1,
                        }}
                        animate={{
                            y: '110vh',
                            rotate: Math.random() > 0.5 ? 720 : -720,
                            opacity: [1, 1, 0],
                            scale: [1, 1.2, 0.8],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2.5 + Math.random(),
                            delay: piece.delay,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        style={{
                            position: 'absolute',
                            width: piece.size,
                            height: piece.size,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            backgroundColor: piece.color,
                            boxShadow: `0 0 6px ${piece.color}`,
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
