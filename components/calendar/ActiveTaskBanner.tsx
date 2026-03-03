'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { useActiveTasks } from '@/lib/hooks/useTasks';
import { formatElapsed } from '@/lib/utils/dates';
import { floatingBanner } from '@/lib/utils/animations';

export function ActiveTaskBanner() {
    const { activeTasks } = useActiveTasks();
    const activeTask = activeTasks[0];
    const [expanded, setExpanded] = useState(false);

    if (!activeTask) return null;

    return (
        <AnimatePresence>
            <motion.div
                variants={floatingBanner}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed top-16 right-4 z-50 flex justify-end"
            >
                <div
                    onClick={() => setExpanded(!expanded)}
                    className="cursor-pointer bg-gradient-to-r from-warning to-amber-500 text-white shadow-elevated rounded-full flex items-center overflow-hidden transition-all duration-300"
                >
                    <div className="px-3 py-2 flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="bg-white/20 p-1.5 rounded-full flex items-center justify-center backdrop-blur-sm"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                        </motion.div>

                        <ElapsedTime startTime={activeTask.startedAt} />

                        <AnimatePresence initial={false}>
                            {expanded && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="overflow-hidden whitespace-nowrap pl-2 border-l border-white/20 ml-2"
                                >
                                    <span className="font-semibold text-sm max-w-[150px] inline-block truncate align-middle">
                                        {activeTask.title}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function ElapsedTime({ startTime }: { startTime: any }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const start = startTime.toMillis ? startTime.toMillis() : startTime;

        const updateElapsed = () => {
            const now = Date.now();
            setElapsed(Math.floor((now - start) / 1000));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center">
            <span className="font-mono font-bold text-sm">{formatElapsed(elapsed)}</span>
        </div>
    );
}
