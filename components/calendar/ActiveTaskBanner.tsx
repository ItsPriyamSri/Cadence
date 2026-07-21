'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Check, ChevronUp } from 'lucide-react';
import { useActiveTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { formatElapsed } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

export function ActiveTaskBanner() {
    const { activeTasks } = useActiveTasks();
    const { triggerConfetti } = useAppStore();
    const activeTask = activeTasks[0];
    const [open, setOpen] = useState(false);

    if (!activeTask) return null;

    const handlePause = async () => { setOpen(false); await updateTaskStatus(activeTask.id, 'paused'); };
    const handleDone = async () => { setOpen(false); await updateTaskStatus(activeTask.id, 'done'); triggerConfetti(); };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-lg bg-bg-primary border border-border shadow-elev-2 overflow-hidden"
        >
            <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-3.5 text-left">
                <span className="relative w-[38px] h-[38px] shrink-0 flex items-center justify-center rounded-full bg-started-bg text-started">
                    <span className="absolute inset-0 rounded-full animate-cad-glow" style={{ boxShadow: '0 0 0 3px var(--started-bg), 0 0 12px var(--started)' }} />
                    <Play className="relative w-[17px] h-[17px]" fill="currentColor" strokeWidth={0} />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-started">In progress</div>
                    <div className="text-sm font-semibold text-text-primary truncate">{activeTask.title}</div>
                </div>
                <ElapsedTime startTime={activeTask.startedAt} />
                <ChevronUp className={cn('w-[18px] h-[18px] text-text-tertiary transition-transform', !open && 'rotate-180')} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-2 px-3.5 pb-3.5">
                            <button onClick={handlePause} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-bg-secondary text-text-primary text-sm font-semibold hover:bg-bg-tertiary transition-colors">
                                <Pause className="w-4 h-4" strokeWidth={2.2} /> Pause
                            </button>
                            <button onClick={handleDone} className="flex-[1.3] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-done text-white text-sm font-semibold hover:brightness-105 transition">
                                <Check className="w-4 h-4" strokeWidth={2.6} /> Complete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ElapsedTime({ startTime }: { startTime: any }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!startTime) return;
        const start = startTime.toMillis ? startTime.toMillis() : startTime;
        const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);
    return <span className="font-mono font-bold text-sm text-started tabular-nums shrink-0">{formatElapsed(elapsed)}</span>;
}
