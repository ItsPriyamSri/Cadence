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

    if (!activeTask) return null;

    return (
        <AnimatePresence>
            <motion.div
                variants={floatingBanner}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed top-14 left-0 right-0 z-40"
            >
                <div className="mx-auto max-w-7xl px-4">
                    <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-b-2xl shadow-lg shadow-green-500/25">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                </motion.div>
                                <div>
                                    <p className="text-xs text-white/80 font-medium">Working on</p>
                                    <p className="font-semibold truncate max-w-[200px] sm:max-w-md">
                                        {activeTask.title}
                                    </p>
                                </div>
                            </div>
                            <ElapsedTime startTime={activeTask.startedAt} />
                        </div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl backdrop-blur-sm"
        >
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{formatElapsed(elapsed)}</span>
        </motion.div>
    );
}
